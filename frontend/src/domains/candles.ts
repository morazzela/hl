import { Accessor, createResource } from "solid-js";
import { BackCoin, Candle, Coin, Interval } from "../../../shared/src/types";
import { getCoinModel } from "../../../shared/src/database";
import { exchangeByKey } from "../../../shared/src/utils";
import { redirectIfGuest } from "./auth";

async function fetchCandles(coinId: string, exchangeKey: string, interval: Interval): Promise<Candle[]> {
    "use server";

    await redirectIfGuest()

    const candles: Candle[] = []

    const coin = await getCoinModel().findById(coinId)

    if ( ! coin) {
        return candles
    }

    const exchange = exchangeByKey(exchangeKey)

    if ( ! exchange) {
        return candles
    }

    if (exchange.getAvailableChartIntervals().map(e => e.key).indexOf(interval.key) === -1) {
        return candles
    }

    return await exchange.getCandles(coin, interval)
}

export function useCandles(coinId: Accessor<string>, exchangeKey: Accessor<string>, interval: Accessor<Interval|undefined>) {
    const [candles] = createResource(() => [coinId(), exchangeKey(), interval()], async () => {
        const int = interval()

        if (!coinId() || !exchangeKey() || !int) {
            return []
        }

        return fetchCandles(coinId(), exchangeKey(), int)
    }, { initialValue: [] })

    return { candles }
}