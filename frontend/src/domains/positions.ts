import { Accessor, AccessorArray, createResource } from "solid-js";
import { BackPosition, Coin, Position } from "../../../shared/src/types";
import exchanges from "../../../shared/src/exchanges";
import { getCoinModel, getWalletModel } from "../../../shared/src/database";
import { useCoins } from "~/providers/CoinsProvider";
import { exchangeByKey, shortenAddress } from "../../../shared/src/utils";
import { redirectIfGuest } from "./auth";

async function fetchPositions(userId: string): Promise<BackPosition[]> {
    "use server";

    await redirectIfGuest()

    let wallet = await getWalletModel().findById(userId)

    if (wallet === null) {
        return []
    }

    wallet = wallet.toJSON({
        flattenObjectIds: true,
        flattenMaps: true
    })

    const coins = (await getCoinModel().find()).map(coin => coin.toJSON({ flattenObjectIds: true }))

    const positions: BackPosition[] = []
    const exchangesPositions = await Promise.all(exchanges.map(ex => ex.getPositions(wallet, coins)))

    wallet.address = shortenAddress(wallet.address)
    
    for (const exchange of exchangesPositions) {
        for (const pos of exchange) {
            positions.push(pos)
        }
    }

    return positions
}

export function usePositions(walletId: Accessor<string>) {
    const { coins } = useCoins()

    const [positions] = createResource(walletId, async (id) => {
        const positions = await fetchPositions(id) as Position[]

        for (const i in positions) {
            positions[i] = backPositionToPosition(coins, positions[i])
        }

        positions.sort((a, b) => Math.abs(a.value) < Math.abs(b.value) ? 1 : -1)

        return positions
    })

    return { positions }
}

async function fetchPosition(walletId: string, coinId: string, exchangeKey: string): Promise<BackPosition|null> {
    "use server";

    let wallet = await getWalletModel().findById(walletId)

    if ( ! wallet) {
        return null
    }

    wallet = wallet.toJSON({
        flattenMaps: true,
        flattenObjectIds: true
    })

    let coin = await getCoinModel().findById(coinId)

    if ( ! coin) {
        return null
    }

    coin = coin.toJSON({
        flattenMaps: true,
        flattenObjectIds: true
    })

    const exchange = exchangeByKey(exchangeKey)
    
    if ( ! exchange) {
        return null
    }

    const position = await exchange.getPosition(wallet, coin)

    wallet.address = shortenAddress(wallet.address)

    return position ?? null
}

export function usePosition(walletId: Accessor<string>, coinId: Accessor<string>, exchangeKey: Accessor<string>) {
    const { coins } = useCoins()

    const [position] = createResource(() => [walletId(), coinId(), exchangeKey()], async (params) => {
        const position = await fetchPosition(...params)
        return position ? backPositionToPosition(coins, position) : null
    })

    return { position }
}

function backPositionToPosition(coins: Coin[], pos: BackPosition): Position {
    return {
        ...pos,
        coin: coins.find(c => c._id === pos.coinId) as Coin,
        get value() {
            return this.size * this.coin.prices[this.exchange]
        },
        get unrealizedPnl() {
            if (this.isLong) {
                return this.value - this.size * this.entryPrice
            } else {
                return this.size * this.entryPrice - this.value
            }
        },
        get roi() {
            return this.unrealizedPnl / this.collateral * 100
        },
        get leverage() {
            return this.value / this.collateral
        }
    }
}