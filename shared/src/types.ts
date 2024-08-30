import { Time } from "lightweight-charts"

export type BackCoin = {
    _id?: string
    symbol: string
    decimals: { [key:string]: number }
}

export type Coin = BackCoin & {
    prices: { [key:string]: number }
}

type WalletTimeframeStats = {
    pnl: number
    volume: number
}

export type Wallet = {
    _id?: string
    address: string
    label: string|null
    exchanges: string[],
    isVault: boolean,
    stats: {
        daily: WalletTimeframeStats,
        weekly: WalletTimeframeStats,
        monthly: WalletTimeframeStats,
        allTime: WalletTimeframeStats,
    }
}

export type BackPosition = {
    isLong: boolean
    size: number
    collateral: number
    entryPrice: number
    liquidationPrice: number|null
    
    wallet: Wallet
    coinId: string
    exchange: string
}

export type Position = BackPosition & {
    coin: Coin
    value: number
    unrealizedPnl: number
    roi: number
    leverage: number
}

export type Interval = {
    key: string
    seconds: number
}

export type Candle = {
    time: Time
    open: number
    high: number
    low: number
    close: number
    volume: number
}

export type BackTrade = {
    coin: string
    wallet: string
    time: number
    price: number
    size: number
    isBuy: boolean
    exchange: string
    hash: string
}

export type Trade = Omit<BackTrade, "coin"> & Omit<BackTrade, "wallet"> & {
    coin: Coin
}
