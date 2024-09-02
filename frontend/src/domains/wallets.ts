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

    if (filters.search) {
        query.where({ address: filters.search })
    }

    if (filters.onlyFavorites) {
        const user = await getUser()
        const favorites = await getFavoriteModel().find().where({ user: user?._id }).select(["wallet"])
        query.where({ _id: { $in: favorites.map(f => f.wallet) } })
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