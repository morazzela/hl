import { BackCoin, BackPosition, Coin, Wallet, Candle, Interval } from "../types";

export default interface IExchange {
    getKey(): string

    // functions that will be used to store into the database
    getCoins(): Promise<BackCoin[]>
    getWallets(): Promise<Wallet[]>

    // functions used in the frontend
    getPositions(wallet: Wallet, coins: BackCoin[]): Promise<BackPosition[]>
    getPosition(wallet: Wallet, coin: BackCoin): Promise<BackPosition|null>

    getAvailableChartIntervals(): Interval[]
    getCandles(coin: BackCoin): Promise<{ [key:string]: Candle[] }>
}