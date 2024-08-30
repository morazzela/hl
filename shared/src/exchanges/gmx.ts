import { CreateAxiosDefaults } from "axios";
import { BackCoin, BackPosition, Candle, Interval, Wallet } from "../types";
import Exchange from "./exchange";
import { GMX_USERS_QUERY, INTERVAL_15M, INTERVAL_1D, INTERVAL_1H, INTERVAL_1M, INTERVAL_4H, INTERVAL_5M } from "../constants";
import { ethers, getAddress, JsonRpcProvider } from "ethers"
import ReaderAbi from "../abis/gmx/Reader.json"
import DataStoreAbi from "../abis/gmx/DataStore.json"
import moment from "moment"

export default class Gmx extends Exchange {
    public getKey(): string {
        return "gmx"
    }

    public async getCoins(): Promise<BackCoin[]> {
        const { data } = await this.axios.get("tokens")

        const coins: BackCoin[] = []

        for (const row of data.tokens) {
            coins.push({
                symbol: row.symbol,
                decimals: {
                    [this.getKey()]: Number(row.decimals),
                }
            })
        }

        return coins
    }

    public async getWallets(): Promise<Wallet[]> {
        const timelines = [{
            from: 0,
            key: "allTime"
        }, {
            from: moment().utc().subtract(1, 'month').startOf('day').unix(),
            key: "monthly"
        }, {
            from: moment().utc().subtract(1, 'week').startOf('day').unix(),
            key: "weekly"
        }, {
            from: moment().utc().subtract(1, 'day').startOf('day').unix(),
            key: "daily"
        }]

        const wallets: { [key:string]: Wallet } = {}
        for (const timeline of timelines) {
            let data
            try {
                const res = await this.axios.post("https://gmx.squids.live/gmx-synthetics-arbitrum/graphql", {
                    operationName: "PeriodAccountStats",
                    query: GMX_USERS_QUERY,
                    variables: { from: timeline.from }
                })

                data = res.data
            } catch (_) {
                return []
            }

            for (const row of data.data.all) {
                const address = String(row.id.toLowerCase())

                if (!wallets[address]) {
                    wallets[address] = {
                        address,
                        label: null,
                        isVault: false,
                        stats: {
                            daily: { pnl: 0, volume: 0 },
                            weekly: { pnl: 0, volume: 0 },
                            monthly: { pnl: 0, volume: 0 },
                            allTime: { pnl: 0, volume: 0 },
                        },
                        exchanges: ["gmx"],
                    }
                }

                const realizedPnl = Number(row.realizedPnl) / 10 ** 30
                const realizedFees = Number(row.realizedFees) / 10 ** 30
                const realizedPriceImpact = Number(row.realizedPriceImpact) / 10 ** 30
                const volume = Number(row.volume) / 10 ** 30

                if (timeline.key === "daily") {
                    wallets[address].stats.daily.pnl = realizedPnl - realizedFees + realizedPriceImpact
                    wallets[address].stats.daily.volume = volume
                }

                if (timeline.key === "weekly") {
                    wallets[address].stats.weekly.pnl = realizedPnl - realizedFees + realizedPriceImpact
                    wallets[address].stats.weekly.volume = volume
                }

                if (timeline.key === "monthly") {
                    wallets[address].stats.monthly.pnl = realizedPnl - realizedFees + realizedPriceImpact
                    wallets[address].stats.monthly.volume = volume
                }

                if (timeline.key === "allTime") {
                    wallets[address].stats.allTime.pnl = realizedPnl - realizedFees + realizedPriceImpact
                    wallets[address].stats.allTime.volume = volume
                }
            }
        }

        return Object.values(wallets)
    }

    public async getPositions(wallet: Wallet, coins: BackCoin[]): Promise<BackPosition[]> {
        const positions: BackPosition[] = []

        const provider = this.getEthers()
        const reader = this.getReader(provider)

        const rawPositions = await reader.getAccountPositions(DataStoreAbi.address, getAddress(wallet.address), 0, 10000)
        const markets = await reader.getMarkets(DataStoreAbi.address, 0, 100000)
        const { tokens } = await this.axios.get("https://arbitrum-api.gmxinfra.io/tokens").then(res => res.data)
        const { data: prices } = await this.axios.get("https://arbitrum-api.gmxinfra.io/prices/tickers")

        for (const row of rawPositions) {
            const market = markets.find((m: any) => m[0] === row[0][1])
            if (!market) {
                continue
            }

            const collateralToken = tokens.find((t: any) => t.address === row[0][2])
            const longToken = tokens.find((t: any) => t.address === market[2])
            if (!longToken || !collateralToken) {
                continue
            }

            const longCoin = this.resolveCoin(longToken, coins)
            if (!longCoin) {
                console.log("Unable to resolve GMX long coin:", longToken)
                continue
            }

            const collateralCoinPrice = prices.find((p: any) => p.tokenAddress === collateralToken.address)
            if (!collateralCoinPrice) {
                continue
            }

            let key = this.getKey()
            const sizeInTokens = Number(row[1][1]) / 10 ** longCoin.decimals[key]
            const collateral = Number(row[1][2]) / 10 ** collateralToken.decimals * collateralCoinPrice.minPrice / 10 ** (30 - collateralToken.decimals)
            const sizeInUsd = Number(row[1][0]) / 10 ** 30

            positions.push({
                isLong: row[2][0],
                size: sizeInTokens,
                collateral: collateral,
                entryPrice: sizeInUsd / sizeInTokens,
                liquidationPrice: null,
                wallet: wallet,
                coinId: String(longCoin._id),
                exchange: this.getKey()
            })
        }

        return positions
    }

    public getAvailableChartIntervals(): Interval[] {
        return [
            INTERVAL_1M,
            INTERVAL_5M,
            INTERVAL_15M,
            INTERVAL_1H,
            INTERVAL_4H,
            INTERVAL_1D
        ]
    }

    public async getIntervalCandles(coin: BackCoin, interval: Interval): Promise<Candle[]> {
        const candles: Candle[] = []

        const { data } = await this.axios.get("https://arbitrum-api.gmxinfra.io/prices/candles", {
            params: {
                tokenSymbol: coin.symbol,
                period: interval.key
            }
        })

        for (const row of data.candles) {
            candles.push({
                time: row[0],
                open: row[1],
                high: row[2],
                low: row[3],
                close: row[4],
                volume: 0
            })
        }

        return candles
    }

    protected getAxiosConfiguration(): CreateAxiosDefaults {
        return {
            baseURL: "https://arbitrum-api.gmxinfra.io/"
        }
    }

    protected resolveCoin(gmxCoin: any, coins: BackCoin[]): BackCoin | null {
        const coin = coins.find(c => c.symbol === gmxCoin.symbol)

        if (!coin) {
            return null
        }

        return coin
    }

    protected getEthers() {
        return new JsonRpcProvider(import.meta.env.VITE_ARBITRUM_PROVIDER)
    }

    protected getReader(provider: JsonRpcProvider) {
        return new ethers.Contract(ReaderAbi.address, ReaderAbi.abi, provider)
    }
}