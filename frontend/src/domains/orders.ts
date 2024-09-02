import { Accessor, createResource } from "solid-js";
import { getCoinModel, getWalletModel } from "../../../shared/src/database";
import exchanges from "../../../shared/src/exchanges";
import { BackOrder, Coin, Order, Wallet } from "../../../shared/src/types";
import { useCoins } from "~/providers/CoinsProvider";
import { shortenAddress } from "../../../shared/src/utils";

async function fetchOrders(walletId: string): Promise<BackOrder[]> {
    "use server";

    let wallet = await getWalletModel().findById(walletId)

    if ( ! wallet) {
        return []
    }

    wallet = wallet.toJSON({ flattenObjectIds: true, flattenMaps: true })
    
    const coins = await getCoinModel().find()
    const data = await Promise.all(exchanges.map(e => e.getOrders(wallet, coins)))
    const orders: BackOrder[] = []

    for (const rows of data) {
        for (const row of rows) {
            orders.push(row)
        }
    }

    wallet.address = shortenAddress(wallet.address)

    return orders
}

export function useOrders(walletId: Accessor<string>) {
    const { coins } = useCoins()
    
    const [orders] = createResource(walletId, async () => {
        const backOrders = await fetchOrders(walletId())

        return backOrders.map<Order>(order => ({
            ...order,
            coin: coins.find(c => c._id === order.coinId) as Coin
        }))
    })

    return { orders }
}