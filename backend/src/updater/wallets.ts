import { getWalletModel } from "../../../shared/src/database/schemas"
import exchanges from "../../../shared/src/exchanges"
import { Wallet } from "../../../shared/src/types"

export async function updateWallets() {
    console.log("Updating wallets...")

    const storedWallets = (await getWalletModel().find().select(["address"])).map(w => w.address)

    const walletsObj: { [key:string]: Wallet } = {}
    for (const exchange of exchanges) {
        const exWallets = await exchange.getWallets()

        for (const exWallet of exWallets) {
            if ( ! walletsObj[exWallet.address]) {
                walletsObj[exWallet.address] = exWallet
                continue
            }

            walletsObj[exWallet.address].exchanges.push(exchange.getKey())
        } 
    }

    const wallets = Object.values(walletsObj)

    const operations: any[] = []
    for (const wallet of wallets) {
        if (storedWallets.indexOf(wallet.address) === -1) {
            operations.push({
                insertOne: { document: wallet }
            })
        } else {
            operations.push({
                updateOne: {
                    filter: { address: wallet.address },
                    update: { $set: { exchanges: wallet.exchanges } }
                }
            })
        }
    }

    if (operations.length > 0) {
        await getWalletModel().bulkWrite(operations)
    }

    console.log("Done updating wallets.")
}