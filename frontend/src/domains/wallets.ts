import { createResource } from "solid-js";
import { getWalletModel } from "../../../shared/src/database";
import { Wallet } from "../../../shared/src/types";
import { shortenAddress } from "../../../shared/src/utils"
import exchanges from "../../../shared/src/exchanges";

async function fetchWallets(): Promise<Wallet[]> {
    "use server";

    const wallets = await getWalletModel()
        .find()
        .where({ exchanges: { $in: exchanges.map(e => e.getKey()) } })
        .limit(50)

    return wallets.map(wallet => wallet.toJSON({
        flattenObjectIds: true,
        flattenMaps: true
    })).map(wallet => {
        wallet.address = shortenAddress(wallet.address)
        return wallet
    })
}

export function useWallets() {
    const [wallets] = createResource<Wallet[]>(fetchWallets)

    return { wallets }
}