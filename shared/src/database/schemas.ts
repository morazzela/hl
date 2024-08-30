import { BackCoin, Wallet } from "../types"
import mongoose, { Model, Schema } from "mongoose"

export function getCoinModel() {
    return getModel<BackCoin>("Coin", new mongoose.Schema<BackCoin>({
        symbol: {
            type: String,
            unique: true
        },
        decimals: {
            type: Map,
            of: Number
        }
    }, { timestamps: true }))
}

export function getWalletModel() {
    return getModel<Wallet>("Wallet", new mongoose.Schema<Wallet>({
        address: {
            type: String,
            unique: true,
            index: true,
        },
        label: {
            type: String,
            default: null
        },
        exchanges: [String]
    }, { timestamps: true }))
}

export function getModel<T>(name: string, schema: Schema<T>): Model<T> {
    return mongoose.models[name] ?? mongoose.model(name, schema)
}