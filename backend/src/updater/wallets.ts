import { getWalletModel } from "../../../shared/src/database/schemas"
import exchanges from "../../../shared/src/exchanges"
import { Wallet } from "../../../shared/src/types"

export async function updateWallets() {
    console.log("Updating wallets...")

    const storedWallets = (await getWalletModel().find().select(["address"])).map(w => w.address)

    console.log(`Found ${storedWallets.length} stored wallets.`)

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

    const inserts: any[] = []
    const updates: any[] = []
    for (const wallet of wallets) {
        if (storedWallets.indexOf(wallet.address) === -1) {
            inserts.push(wallet)
        } else {
            updates.push({
                updateOne: {
                    filter: { address: wallet.address },
                    update: { $set: { exchanges: wallet.exchanges } }
                }
            })
        }
    }

    if (inserts.length > 0) {
        console.log("Inserting " + inserts.length + " new wallets...")
        await getWalletModel().insertMany(inserts)
        console.log("Done inserting wallets.")
    }

    if (updates.length > 0) {
        console.log("Updating " + updates.length + " wallets...")
        await getWalletModel().bulkWrite(updates)
    }

    console.log("Done updating wallets.")
}