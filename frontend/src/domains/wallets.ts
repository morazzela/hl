import { Accessor, createResource } from "solid-js";
import { getFavoriteModel, getWalletModel } from "../../../shared/src/database";
import { Wallet } from "../../../shared/src/types";
import { shortenAddress } from "../../../shared/src/utils"
import exchanges from "../../../shared/src/exchanges";
import { getUser, redirectIfGuest } from "./auth";

export type WalletFilters = {
    search: string
    onlyFavorites: boolean
}

async function fetchWallets(filters: WalletFilters): Promise<Wallet[]> {
    "use server";

    await redirectIfGuest()

    const query = getWalletModel()
        .find()
        .where({ exchanges: { $in: exchanges.map(e => e.getKey()) } })
        .sort({ "stats.allTime.pnl": "desc" })
        .limit(10)

    if (filters.onlyFavorites) {
        const user = await getUser()
        const favorites = await getFavoriteModel().find().where({ user: user?._id }).select(["wallet"])
        query.where({ _id: { $in: favorites.map(f => f.wallet) } })
    } else {

        if (filters.search) {
            query.or([{ address: filters.search }, { label: { $regex: filters.search, $options: "i" } }])
        } else {
            query.where({ "stats.weekly.volume": { $gt: 0 } })
        }
    }

    return (await query).map(wallet => wallet.toJSON({
        flattenObjectIds: true,
        flattenMaps: true
    })).map(wallet => {
        wallet.address = shortenAddress(wallet.address)
        return wallet
    })
}

export function useWallets(filters: Accessor<WalletFilters>) {
    const [wallets] = createResource(filters, fetchWallets)

    return { wallets }
}