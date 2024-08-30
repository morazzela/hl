import axios, { AxiosInstance, CreateAxiosDefaults } from "axios"
import IExchange from "../interfaces/Exchange"
import { BackCoin, BackPosition, Candle, Interval, Wallet } from "../types"

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
            candles[interval.key].sort((a, b) => a.time > b.time ? 1 : -1)
        }

        return candles
    }

    public abstract getKey(): string
    public abstract getCoins(): Promise<BackCoin[]>
    public abstract getWallets(): Promise<Wallet[]>
    public abstract getPositions(wallet: Wallet, coins: BackCoin[]): Promise<BackPosition[]>
    
    public async getPosition(wallet: Wallet, coin: BackCoin): Promise<BackPosition | null> {
        const positions = await this.getPositions(wallet, [coin])

        const pos = positions.find(pos => pos.coinId === coin._id)
        
        return pos ? pos : null
    }

    public abstract getAvailableChartIntervals(): Interval[]
    public abstract getIntervalCandles(coin: BackCoin, interval: Interval): Promise<Candle[]>
}