import { CreateAxiosDefaults } from "axios";
import { BackCoin, BackPosition, Wallet } from "../types";
import Exchange from "./exchange";

export default class Gmx extends Exchange {
    public getKey(): string {
        return "gmx"
    }

    public getLogo(): string {
        return ""
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
        return []
    }

    public async getPositions(wallet: Wallet, coins: BackCoin[]): Promise<BackPosition[]> {
        return []
    }

    protected getAxiosConfiguration(): CreateAxiosDefaults {
        return {
            baseURL: "https://arbitrum-api.gmxinfra.io/"
        }
    }
}