import { BackCoin } from "../../../shared/src/types";
import { getCoinModel } from "../../../shared/src/database"
import exchanges from "../../../shared/src/exchanges"

export async function updateCoins() {
    console.log("Updating coins...")

    const storedCoins = (await getCoinModel().find().select(["symbol"])).map(coin => coin.symbol)
    const coinsObj: { [key:string]: BackCoin } = {}

    const exchangesCoins = await Promise.all(exchanges.map(async (e) => ({
        key: e.getKey(),
        coins: await e.getCoins()
    })))

    for (const exchange of exchangesCoins) {
        const key = exchange.key

        for (const coin of exchange.coins) {
            if ( ! coinsObj[coin.symbol]) {
                coinsObj[coin.symbol] = coin
                continue
            }

            coinsObj[coin.symbol].decimals[key] = coin.decimals[key]
        }
    }

    const coins = Object.values(coinsObj)

    const operations: any = []
    for (const coin of coins) {
        if (storedCoins.indexOf(coin.symbol) === -1) {
            operations.push({
                insertOne: {
                    document: coin
                }
            })
        } else {
            operations.push({
                updateOne: {
                    filter: { symbol: coin.symbol },
                    update: { $set: { decimals: coin.decimals } }
                }
            })
        }
    }

    if (operations.length > 0) {
        await getCoinModel().bulkWrite(operations)
    }

    console.log("Done updating coins.")
}