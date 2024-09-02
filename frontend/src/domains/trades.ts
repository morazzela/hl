import { Accessor, createResource } from "solid-js";
import { BackTrade, Coin, Trade, Wallet } from "../../../shared/src/types";
import { exchangeByKey } from "../../../shared/src/utils";
import { getCoinModel, getTradeModel, getWalletModel } from "../../../shared/src/database";
import { useCoins } from "~/providers/CoinsProvider";
import exchanges from "../../../shared/src/exchanges";
import { Document, Model } from "mongoose";
import { cache } from "@solidjs/router";
import { redirectIfGuest } from "./auth";

async function fetchTrades(walletId: string, exchangeKey: string|null, limit: number|null, coinId: string|null): Promise<BackTrade[]> {
    "use server";

    await redirectIfGuest()

    if (!walletId) {
        return []
    }

    let exchange = null

    if (exchangeKey !== null) {
        exchange = exchangeByKey(exchangeKey)
        if ( ! exchange) {
            return []
        }
    }

    let wallet = await getWalletModel().findById(walletId)
    if ( ! wallet) {
        return []
    }

    const walletObject = wallet.toJSON({
        flattenMaps: true,
        flattenObjectIds: true
    })

    let coins = (await getCoinModel().find())
        .map(c => c.toJSON({
            flattenMaps: true,
            flattenObjectIds: true
        }))

    let coin = null
    if (coinId !== null) {
        coin = coins.find(c => c._id === coinId)

        if ( ! coin) {
            return []
        }
    }

    let query = getTradeModel()
        .find()
        .where({
            wallet: walletId,
        })
        .sort({ time: "desc" })

    if (exchangeKey !== null) {
        query.where({ exchange: exchangeKey })
    }

    if (coin !== null) {
        query.where({ coin: coin._id })
    }

    if (limit !== null) {
        query.limit(limit)
    }

    let storedTrades = (await query).map(trade => trade.toJSON({
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

    const allNewTrades = await Promise.all(
        exchanges
            .filter(e => exchangeKey === null || e.getKey() === exchangeKey)
            .map(e => e.getTrades(walletObject, coins, startTime))
    )

    const newTrades = []
    for (const tmp of allNewTrades) {
        newTrades.push(...tmp)
    }

    if (newTrades.length > 0) {
        newTrades.sort((a, b) => a.time < b.time ? 1 : -1)
        try {
            await getTradeModel().insertMany(newTrades, {
                ordered: false,
            })
        } catch (_) {}
    }

    let trades: BackTrade[] = [...storedTrades, ...newTrades].sort((a, b) => a.time < b.time ? 1 : -1)

    if (coinId !== null) {
        trades = trades.filter(t => t.coin === coinId)
    }

    if (limit !== null) {
        trades = trades.slice(0, limit)
    }

    return trades
}

export function useTrades(walletId: Accessor<string>, exchangeKey?: Accessor<string>|null, limit?: Accessor<number>|null, coinId?: Accessor<string>|null) {
    const { coins } = useCoins()
    
    const [trades] = createResource(() => [
        walletId(),
        exchangeKey ? exchangeKey() : null,
        coinId ? coinId() : null,
        limit ? limit() : null
    ], async () => {
        const backTrades = await fetchTrades(
            walletId(),
            exchangeKey ? exchangeKey() : null,
            limit ? limit() : null,
            coinId ? coinId() : null,
        )

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