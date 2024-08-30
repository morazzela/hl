import { Accessor, createResource } from "solid-js";
import { BackTrade, Coin, Trade } from "../../../shared/src/types";
import { exchangeByKey } from "../../../shared/src/utils";
import { getCoinModel, getTradeModel, getWalletModel } from "../../../shared/src/database";
import { useCoins } from "~/providers/CoinsProvider";

async function fetchTrades(walletId: string, exchangeKey: string, coinId: string): Promise<BackTrade[]> {
    "use server";

    const exchange = exchangeByKey(exchangeKey)
    if ( ! exchange) {
        return []
    }

    let wallet = await getWalletModel().findById(walletId)
    if ( ! wallet) {
        return []
    }

    wallet = wallet.toJSON({
        flattenMaps: true,
        flattenObjectIds: true
    })

    let coin = await getCoinModel().findById(coinId)
    if ( ! coin) {
        return []
    }

    coin = coin.toJSON({
        flattenMaps: true,
        flattenObjectIds: true
    })

    let storedTrades = (await getTradeModel()
        .find()
        .where({
            exchange: exchangeKey,
            wallet: walletId,
            coin: coinId
        })
        .sort({ time: "desc" })
        .limit(100)
    ).map(trade => trade.toJSON({
        flattenMaps: true,
        flattenObjectIds: true
    }))

    let storedTradeHashes: { [key:string]: boolean } = {}
    let startTime = 0
    for (const i in storedTrades) {
        storedTradeHashes[storedTrades[i].hash] = true
        if (storedTrades[i].time > startTime) {
            startTime = storedTrades[i].time
        }
    }

    const newTrades = await exchange.getTrades(wallet, coin, startTime)
    const filteredNewTrades = newTrades.filter(trade => storedTradeHashes[trade.hash] !== true)

    if (filteredNewTrades.length > 0) {
        await getTradeModel().insertMany(filteredNewTrades)
    }

    const trades: BackTrade[] = [...storedTrades, ...filteredNewTrades]
        .filter(trade => trade.coin === coinId)
        .sort((a, b) => a.time < b.time ? 1 : -1)
        .slice(0, 100)

    return trades
}

export function useTrades(walletId: Accessor<string>, exchangeKey: Accessor<string>, coinId: Accessor<string>) {
    const { coins } = useCoins()
    
    const [trades] = createResource(() => [walletId(), exchangeKey(), coinId()], async () => {
        const backTrades = await fetchTrades(walletId(), exchangeKey(), coinId())
        return backTrades.map(t => mapResponseTradeToTrade(t, coins)) as Trade[]
    })

    return { trades }
}

function mapResponseTradeToTrade(trade: BackTrade, coins: Coin[]): Trade {
    return {
        ...trade,
        coin: coins.find(c => c._id === trade.coin) as Coin
    } as Trade
}