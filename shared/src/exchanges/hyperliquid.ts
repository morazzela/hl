import { CreateAxiosDefaults } from "axios";
import { BackCoin, BackPosition, BackTrade, Candle, Coin, Interval, Trade, Wallet } from "../types";
import Exchange from "./exchange";
import { Time } from "lightweight-charts";
import { INTERVAL_15M, INTERVAL_1D, INTERVAL_1H, INTERVAL_1M, INTERVAL_30M, INTERVAL_4H, INTERVAL_5M } from "../constants";
import { sleep } from "../../../shared/src/utils"

export default class Hyperliquid extends Exchange {
    public getKey(): string {
        return "hl"
    }

    public async getCoins(): Promise<BackCoin[]> {
        const { data } = await this.axios.post("info", { type: "meta" })

        const coins: BackCoin[] = []
        for (const row of data.universe) {
            coins.push({
                symbol: row.name,
                decimals: {
                    [this.getKey()]: Number(row.szDecimals)
                }
            })
        }
        
        return coins
    }

    public async getWallets(): Promise<Wallet[]> {
        const [{ data: leaderboard }, { data: vaults }] = await Promise.all([
            this.axios.post("info", { type: "leaderboard" }),
            this.axios.post("info", { type: "vaults" })
        ])

        const vaultAddresses: { [key:string]: any } = {}
        for (const vault of vaults) {
            vaultAddresses[vault.vaultAddress] = vault
        }

        const wallets: Wallet[] = []
        for (const row of leaderboard.leaderboardRows) {
            const vault = vaultAddresses[row.ethAddress]

            if (vault && vault.relationship.type === "parent") {
                continue
            }

            const dailyPnl = Number(row.windowPerformances[0][1].pnl)
            const weeklyPnl = Number(row.windowPerformances[1][1].pnl)
            const monthlyPnl = Number(row.windowPerformances[2][1].pnl)
            const allTimePnl = Number(row.windowPerformances[3][1].pnl)
            const dailyVlm = Number(row.windowPerformances[0][1].vlm)
            const weeklyVlm = Number(row.windowPerformances[1][1].vlm)
            const monthlyVlm = Number(row.windowPerformances[2][1].vlm)
            const allTimeVlm = Number(row.windowPerformances[3][1].vlm)

            wallets.push({
                address: row.ethAddress.trim().toLowerCase(),
                label: vault ? vault.name : row.displayName,
                exchanges: [this.getKey()],
                isVault: vault !== undefined,
                stats: {
                    daily: { pnl: dailyPnl, volume: dailyVlm },
                    weekly: { pnl: weeklyPnl, volume: weeklyVlm },
                    monthly: { pnl: monthlyPnl, volume: monthlyVlm },
                    allTime: { pnl: allTimePnl, volume: allTimeVlm },
                },
                hash: "",
            })
        }

        return wallets
    }

    public async getPositions(wallet: Wallet, coins: BackCoin[]): Promise<BackPosition[]> {
        const { data } = await this.axios.post("info", { type: "clearinghouseState", user: wallet.address })

        const positions: BackPosition[] = []
        for (const row of data.assetPositions) {
            const pos = this.mapRowToPosition(row.position, wallet, coins)
            
            if (pos !== null) {
                positions.push(pos)
            }
        }

        return positions
    }

    public async getPosition(wallet: Wallet, coin: BackCoin): Promise<BackPosition | null> {
        const { data } = await this.axios.post("info", { type: "clearinghouseState", user: wallet.address })

        const row = data.assetPositions.find((row: any) => row.position.coin === coin.symbol)

        if ( ! row) {
            return null
        }

        return this.mapRowToPosition(row.position, wallet, [coin])
    }

    protected mapRowToPosition(row: any, wallet: Wallet, coins: BackCoin[]): BackPosition|null {
        const coin = coins.find(c => c.symbol === row.coin)

        if (coin === undefined) {
            return null
        }

        return {
            wallet: wallet,
            isLong: Number(row.szi) > 0,
            coinId: String(coin._id),
            exchange: this.getKey(),
            size: Math.abs(Number(row.szi)),
            entryPrice: Number(row.entryPx),
            liquidationPrice: Number(row.liquidationPx) === 0 ? null : Number(row.liquidationPx),
            collateral: Number(row.marginUsed),
        }
    }

    public getAvailableChartIntervals(): Interval[] {
        return [INTERVAL_1M, INTERVAL_5M, INTERVAL_15M, INTERVAL_30M, INTERVAL_1H, INTERVAL_4H, INTERVAL_1D]
    }

    public async getCandles(coin: BackCoin, interval: Interval): Promise<Candle[]> {
        const { data } = await this.axios.post("info", {
            type: "candleSnapshot",
            req: {
                coin: coin.symbol,
                interval: interval.key,
                startTime: 0
            }
        })

        return data.map((row: any) => this.mapRowToCandle(row, interval))
    }

    public async getTrades(wallet: Wallet, coins: BackCoin[], startTime: number): Promise<BackTrade[]> {
        const trades: BackTrade[] = []

        startTime = startTime + 1

        let rows
        do {
            const { data } = await this.axios.post("info", {
                type: "userFillsByTime",
                user: wallet.address,
                aggregateByTime: true,
                startTime: startTime
            })

            rows = data

            for (const row of rows) {
                const coin = coins.find(c => c.symbol === row.coin)

                if (!coin) {
                    continue
                }

                trades.push({
                    time: Number(row.time),
                    coin: String(coin._id),
                    wallet: String(wallet._id),
                    price: Number(row.px),
                    size: Number(row.sz),
                    isBuy: row.side === "B",
                    exchange: this.getKey(),
                    hash: row.hash,
                    startPosition: Number(row.startPosition)
                })
            }

            for (const row of rows) {
                if (row.time > startTime) {
                    startTime = row.time + 1
                }
            }

            if (rows.length >= 2000) {
                await sleep(500)
            }
        } while (rows.length >= 2000)

        return trades
    }

    protected mapRowToCandle(row: any, interval: Interval): Candle {
        const t = Math.round(row.t / 1000)

        return {
            time: t - (t % interval.seconds) as Time,
            open: Number(row.o),
            high: Number(row.h),
            low: Number(row.l),
            close: Number(row.c),
            volume: Number(row.v),
        }
    }

    protected getAxiosConfiguration(): CreateAxiosDefaults {
        return {
            baseURL: "https://api.hyperliquid.xyz/"
        }
    }
}