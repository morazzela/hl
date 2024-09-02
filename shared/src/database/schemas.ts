import { BackCoin, Favorite, Trade, User, Wallet } from "../types"
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
            index: true
        },
        label: {
            type: String,
            default: null
        },
        isVault: {
            type: Boolean,
            default: false
        },
        exchanges: [String],
        stats: {
            daily: { pnl: Number, volume: Number },
            weekly: { pnl: Number, volume: Number },
            monthly: { pnl: Number, volume: Number },
            allTime: { pnl: Number, volume: Number },
        },
        hash: {
            type: String,
            required: true
        }
    }, { timestamps: true }))
}

export function getTradeModel() {
    const schema = new mongoose.Schema<Trade>({
        wallet: String,
        coin: String,
        time: Number,
        price: Number,
        size: Number,
        isBuy: Boolean,
        startPosition: Number,
        exchange: {
            type: String,
            index: true
        },
        hash: {
            type: String,
            unique: true
        },
    }, { timestamps: true })

    return getModel<Trade>("Trade", schema)
}

export function getUserModel() {
    return getModel<User>("User", new mongoose.Schema<User>({
        email: {
            type: String,
            unique: true
        },
        password: String,
        verified: {
            type: Boolean,
            default: false
        }
    }, { timestamps: true }))
}

export function getFavoriteModel() {
    return getModel<Favorite>("Favorite", new mongoose.Schema<Favorite>({
        user: {
            type: Types.ObjectId,
            ref: "User",
            index: true
        },
        wallet: {
            type: Types.ObjectId,
            ref: "Wallet",
            index: true
        }
    }, { timestamps: true }))
}

export function getModel<T>(name: string, schema: Schema<T>): Model<T> {
    return mongoose.models[name] ?? mongoose.model(name, schema)
}