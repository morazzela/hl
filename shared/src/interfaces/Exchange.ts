import { BackCoin, BackPosition, Wallet, Candle, Interval, BackTrade, Order, BackOrder } from "../types";

export default interface IExchange {
    getKey(): string

    // functions that will be used to store into the database
    getCoins(): Promise<BackCoin[]>
    getWallets(): Promise<Wallet[]>

    // functions used in the frontend
    getPositions(wallet: Wallet, coins: BackCoin[]): Promise<BackPosition[]>
    getPosition(wallet: Wallet, coin: BackCoin): Promise<BackPosition|null>

    getAvailableChartIntervals(): Interval[]
    getCandles(coin: BackCoin, interval: Interval): Promise<Candle[]>

    getTrades(wallet: Wallet, coins: BackCoin[], startTime: number): Promise<BackTrade[]>
    getOrders(wallet: Wallet, coins: BackCoin[]): Promise<BackOrder[]>
}