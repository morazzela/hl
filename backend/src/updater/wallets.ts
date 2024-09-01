import crypto from "crypto"
import { getWalletModel } from "../../../shared/src/database/schemas"
import exchanges from "../../../shared/src/exchanges"
import { Wallet } from "../../../shared/src/types"

export async function updateWallets() {
    console.log("Updating wallets...")

    const storedWallets = (await getWalletModel().find().select(["address", "hash"]))

    const storedwalletsObj: { [key:string]: { address: string, hash: string } } = {}
    for (const wallet of storedWallets) {
        storedwalletsObj[wallet.address] = wallet
    }

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
        wallet.hash = generateWalletHash(wallet)

        // wallet is not in database
        if ( ! storedwalletsObj[wallet.address]) {
            inserts.push(wallet)
            continue
        }

        const storedHash = storedwalletsObj[wallet.address].hash

        // wallet did not change
        if (storedHash === wallet.hash) {
            continue
        }

        updates.push({
            updateOne: {
                filter: { address: wallet.address },
                update: {
                    $set: {
                        exchanges: wallet.exchanges,
                        isVault: wallet.isVault,
                        label: wallet.label,
                        stats: wallet.stats,
                        hash: wallet.hash
                    }
                }
            }
        })
    }

    if (inserts.length > 0) {
        console.log("Inserting " + inserts.length + " new wallets...")
        await getWalletModel().insertMany(inserts, { lean: true })
        console.log("Done inserting wallets.")
    }

    if (updates.length > 0) {
        console.log("Updating " + updates.length + " wallets...")
        await getWalletModel().bulkWrite(updates)
    }

    console.log("Done updating wallets.")
}

function generateWalletHash(wallet: Wallet): string {
    wallet.exchanges.sort((a, b) => a > b ? 1 : -1)
    
    let key = ""
    key += JSON.stringify(wallet.exchanges) + "-"
    key += (wallet.isVault ? "1" : "0") + "-"
    key += wallet.label + "-"
    key += JSON.stringify(wallet.stats)

    return crypto.createHash('md5').update(key).digest('hex')
}