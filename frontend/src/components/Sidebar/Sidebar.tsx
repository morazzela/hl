import { For, Show, Suspense } from "solid-js"
import { useWallets } from "~/domains/wallets"
import Loader from "../Loader/Loader"
import { Wallet } from "~/shared/types"
import { useNavigate } from "@solidjs/router"
import PageHeader from "../Page/PageHeader"
import PageContent from "../Page/PageContent"
import { exchangeByKey } from "../../../../shared/src/utils"

export default function Sidebar() {
    const navigate = useNavigate()
    const { wallets } = useWallets()

    const onWalletClient = (wallet: Wallet) => {
        navigate(`/w/${wallet._id}`)
    }

    return (
        <div class="w-1/5 border-r">
            <PageHeader>
                <h2 onclick={() => navigate('/')} class="cursor-pointer font-display font-bold text-2xl">Wallets</h2>
            </PageHeader>
            <PageContent>
                <Suspense fallback={<Loader text="Loading wallets..."/>}>
                    <ul class="flex flex-col gap-2 text-sm font-mono">
                        <For each={wallets()}>
                            {wallet => (
                                <li onClick={() => onWalletClient(wallet)} class="card card-hover px-3 py-2 flex items-center justify-between">
                                    <div class="flex items-center">
                                        <Show when={wallet.label !== null}>
                                            <span class="mr-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-4">
                                                    <path fill-rule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clip-rule="evenodd" />
                                                </svg>
                                            </span>
                                        </Show>
                                        <span>{wallet.label ?? wallet.address}</span>
                                    </div>
                                    <div>
                                        <For each={wallet.exchanges}>{ex => <img src={exchangeByKey(ex)?.getLogo()} class="size-5"/>}</For>
                                    </div>
                                </li>
                            )}
                        </For>
                    </ul>
                </Suspense>
            </PageContent>
        </div>
    )
}