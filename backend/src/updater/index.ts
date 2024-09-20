import { sleep } from "../../../shared/src/utils"
import { updateCoins } from "./coins"
import { updateWallets } from "./wallets";

export default async function update() {
    ;(async () => {
        while (true) {
            updateCoins()
            await sleep(1000 * 60 * 24)
        }
    })()

    ;(async () => {
        while (true) {
            updateWallets()
            await sleep(1000 * 60 * 5)
        }
    })()
}