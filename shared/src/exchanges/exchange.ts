import axios, { AxiosInstance, CreateAxiosDefaults } from "axios"
import IExchange from "../interfaces/Exchange"
import { BackCoin, BackPosition, Candle, Coin, Interval, Wallet } from "../types"
import { intervals } from "../constants"

export default abstract class Exchange implements IExchange {
    protected axios: AxiosInstance

    constructor() {
        this.axios = axios.create(this.getAxiosConfiguration())
    }

    protected getAxiosConfiguration(): CreateAxiosDefaults {
        return {}
    }

    public async getCandles(coin: BackCoin): Promise<{ [key:string]: Candle[] }> {
        const candles: { [key:string]: Candle[] } = {}

        const availableIntervals = this.getAvailableChartIntervals()
        for (const interval of availableIntervals) {
            candles[interval.key] = await this.getIntervalCandles(coin, interval)
        }

        return candles
    }

    public abstract getLogo(): string
    public abstract getKey(): string
    public abstract getCoins(): Promise<BackCoin[]>
    public abstract getWallets(): Promise<Wallet[]>
    public abstract getPositions(wallet: Wallet, coins: BackCoin[]): Promise<BackPosition[]>
    public abstract getPosition(wallet: Wallet, coin: BackCoin): Promise<BackPosition | null>
    public abstract getAvailableChartIntervals(): Interval[]
    public abstract getIntervalCandles(coin: BackCoin, interval: Interval): Promise<Candle[]>
}