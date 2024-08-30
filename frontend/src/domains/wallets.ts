import { Accessor, createResource } from "solid-js";
import { getWalletModel } from "../../../shared/src/database";
import { Wallet } from "../../../shared/src/types";
import { shortenAddress } from "../../../shared/src/utils"
import exchanges from "../../../shared/src/exchanges";

export type WalletFilters = {
    search: string
}

async function fetchWallets(filters: WalletFilters): Promise<Wallet[]> {
    "use server";

    const query = getWalletModel()
        .find()
        .where({ exchanges: { $in: exchanges.map(e => e.getKey()) } })
        .sort({ "stats.allTime.pnl": "desc" })
        .limit(10)

    if (filters.search) {
        query.where({ address: filters.search })
    }

    return (await query.exec()).map(wallet => wallet.toJSON({
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