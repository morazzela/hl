import { BackCoin, Trade, Wallet } from "../types"
import mongoose, { Model, Schema, Types } from "mongoose"

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
        exchanges: [String],
        stats: {
            daily: { pnl: Number, volume: Number },
            weekly: { pnl: Number, volume: Number },
            monthly: { pnl: Number, volume: Number },
            allTime: { pnl: Number, volume: Number },
        }
    }, { timestamps: true }))
}

export function getTradeModel() {
    const schema = new mongoose.Schema<Trade>({
        wallet: {
            type: Types.ObjectId,
            ref: "Wallet",
            index: true,
        },
        coin: {
            type: Types.ObjectId,
            ref: "Coin",
            index: true
        },
        time: Number,
        price: Number,
        size: Number,
        isBuy: Boolean,
        exchange: {
            type: String,
            index: true
        },
        hash: String
    }, { timestamps: true })

    return getModel<Trade>("Trade", schema)
}

export function getModel<T>(name: string, schema: Schema<T>): Model<T> {
    return mongoose.models[name] ?? mongoose.model(name, schema)
}