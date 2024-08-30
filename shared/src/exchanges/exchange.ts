import axios, { AxiosInstance, CreateAxiosDefaults } from "axios"
import IExchange from "../interfaces/Exchange"
import { BackCoin, BackPosition, BackTrade, Candle, Interval, Wallet } from "../types"
import crypto from "crypto"

export default abstract class Exchange implements IExchange {
    protected axios: AxiosInstance

    constructor() {
        this.axios = axios.create(this.getAxiosConfiguration())
    }

    protected getAxiosConfiguration(): CreateAxiosDefaults {
        return {}
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
    public abstract getCandles(coin: BackCoin, interval: Interval): Promise<Candle[]>
    public abstract getTrades(wallet: Wallet, coins: BackCoin[], startTime: number): Promise<BackTrade[]>
}