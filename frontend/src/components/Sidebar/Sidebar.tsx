import { createSignal, For, Show, Suspense } from "solid-js"
import { useWallets, WalletFilters } from "~/domains/wallets"
import Loader from "../Loader/Loader"
import { Wallet } from "../../../../shared/src/types"
import { useNavigate } from "@solidjs/router"
import PageHeader from "../Page/PageHeader"
import PageContent from "../Page/PageContent"
import { debounce, getExchangeLogo } from "~/utils"
import { formatNumber } from "../../../../shared/src/utils"
import { useSidebar } from "~/providers/SidebarProvider"
import { useFavorites } from "~/providers/FavoritesProvider"
import PageFooter from "../Page/PageFooter"
import { logout } from "~/domains/auth"

export default function Sidebar() {
    const navigate = useNavigate()
    const [filters, setFilters] = createSignal<WalletFilters>({
        search: "",
        onlyFavorites: false,
    })
    const { wallets } = useWallets(filters)
    const { isOpen, setIsOpen } = useSidebar()

    const onSearchInput = debounce((val: string) => {
        setFilters(prev => ({ ...prev, search: val.trim() }))
    }, 400)

    const onLogoutClick = async () => {
        await logout()
        navigate('/login')
    }

    return (
        <div class="w-full h-[calc(100vh-1.25rem)] lg:w-2/5 xl:w-1/3 2xl:w-1/5 fixed lg:block lg:inset-auto lg:border-r bg-gray-50 dark:bg-gray-950 z-30 transition" classList={{ "transform -translate-x-full lg:transform-none": !isOpen() }}>
            <PageHeader hideMenu={true}>
                <div class="flex w-full justify-between items-center">
                    <h2 onclick={() => navigate('/')} class="cursor-pointer font-display font-bold text-2xl">Wallets</h2>
                    <div class="lg:hidden" onClick={() => setIsOpen(false)}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width={1.5} stroke="currentColor" class="size-8">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                    </div>
                </div>
            </PageHeader>
            <PageContent>
                <div class="mb-4">
                    <input onInput={(e) => onSearchInput(e.target.value)} type="text" class="form-control" placeholder="Search..." />
                    <div class="mt-2 flex justify-between">
                        <button onclick={() => { setFilters(prev => ({ ...prev, onlyFavorites: !prev.onlyFavorites })) }} class="btn btn-sm">{filters().onlyFavorites ? "Show all" : "Show favorites"}</button>
                        <button disabled class="btn btn-sm flex items-center">
                            <span class="mr-1">Filters</span>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="size-3">
                                <path fill-rule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>
                <Suspense fallback={<Loader text="Loading wallets..." />}>
                    <ul class="flex flex-col gap-2 text-sm font-mono">
                        <For each={wallets()}>
                            {wallet => <WalletCard wallet={wallet} />}
                        </For>
                    </ul>
                </Suspense>
            </PageContent>
            <PageFooter>
                <span onClick={onLogoutClick} title="Logout" class="cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width={1.5} stroke="currentColor" class="size-6">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15" />
                    </svg>
                </span>
            </PageFooter>
        </div>
    )
}

type WalletCardProps = {
    wallet: Wallet
}

function WalletCard({ wallet }: WalletCardProps) {
    const { isFavorite } = useFavorites()
    const { setIsOpen } = useSidebar()
    const navigate = useNavigate()

    const onWalletClick = (wallet: Wallet) => {
        setIsOpen(false)
        navigate(`/w/${wallet._id}`)
    }

    const stats = [{
        key: "D",
        value: wallet.stats.daily.pnl
    }, {
        key: "W",
        value: wallet.stats.weekly.pnl
    }, {
        key: "M",
        value: wallet.stats.monthly.pnl
    }, {
        key: "AT",
        value: wallet.stats.allTime.pnl
    }]

    return (
        <li onClick={() => onWalletClick(wallet)} class="card card-hover flex flex-col items-center justify-between">
            <div class="flex items-center justify-between w-full px-3 py-2">
                <div class="flex items-center">
                    <Show when={isFavorite(String(wallet._id))}>
                        <span class="mr-2">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="size-4 text-yellow-500">
                                <path fill-rule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z" clipR-rule="evenodd" />
                            </svg>
                        </span>
                    </Show>
                    <Show when={wallet.label !== null && !wallet.isVault}>
                        <span class="mr-2">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-4">
                                <path fill-rule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clip-rule="evenodd" />
                            </svg>
                        </span>
                    </Show>
                    <Show when={wallet.isVault}>
                        <span class="mr-2">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width={1.5} stroke="currentColor" class="size-4">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                            </svg>
                        </span>
                    </Show>
                    <span>{wallet.label ?? wallet.address}</span>
                </div>
                <div class="flex items-center gap-x-2">
                    <For each={wallet.exchanges}>
                        {ex => <img src={getExchangeLogo(ex)} class="size-4" />}
                    </For>
                </div>
            </div>
            <div class="text-[.65rem] flex items-center divide-x w-full border-t">
                <For each={stats}>
                    {stat => (
                        <div class="flex justify-between w-1/4 px-2 py-0.5">
                            <span>{stat.key}</span>
                            <span
                                class="text-[.65rem] font-bold"
                                classList={{
                                    "text-bullish-500": stat.value > 0,
                                    "text-bearish-500": stat.value < 0,
                                    "text-gray-400 dark:text-gray-600": stat.value == 0,
                                }}
                            >
                                {formatNumber(stat.value, 0, true, true)}
                            </span>
                        </div>
                    )}
                </For>
            </div>
        </li>
    )
}