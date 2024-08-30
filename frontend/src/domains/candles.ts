import { Accessor, createResource } from "solid-js";
import { BackCoin, Candle, Coin, Interval } from "../../../shared/src/types";
import { getCoinModel } from "../../../shared/src/database";
import { exchangeByKey } from "../../../shared/src/utils";

async function fetchCandles({ coinId, exchangeKey }: { coinId: string, exchangeKey: string }): Promise<{ [key:string]: Candle[] }|null> {
    "use server";

    const candles: { [key:string]: Candle[] } = {}

    if (!coinId || !exchangeKey) {
        return candles
    }

    const coin = await getCoinModel().findById(coinId)

    if ( ! coin) {
        return candles
    }

    const exchange = exchangeByKey(exchangeKey)

    if ( ! exchange) {
        return candles
    }

    return await exchange.getCandles(coin)
}

export function useCandles(coinId: Accessor<string>, exchangeKey: Accessor<string>) {
    const [candles] = createResource(() => ({coinId: coinId(), exchangeKey: exchangeKey()}), fetchCandles)

    return { candles }
}