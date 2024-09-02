import { useNavigate, useParams } from "@solidjs/router"
import { Accessor, createEffect, createSignal, For, on, Resource, Show, Suspense } from "solid-js"
import Loader from "~/components/Loader/Loader"
import { usePositions } from "~/domains/positions"
import { exchangeByKey, formatNumber } from "../../../shared/src/utils"
import Badge from "~/components/Badge/Badge"
import { Position } from "../../../shared/src/types"
import PageHeader from "~/components/Page/PageHeader"
import PageContent from "~/components/Page/PageContent"
import { getExchangeLogo } from "~/utils"
import { useTrades } from "~/domains/trades"
import moment from "moment"
import { useFavorites } from "~/providers/FavoritesProvider"

export default function Wallet(props: any) {
    const params = useParams()
    const [id, setId] = createSignal(params.id)
    const [activeTab, setActiveTab] = createSignal(0)
    const { toggleFavorite, isFavorite } = useFavorites()

    createEffect(() => {
        setId(params.id)
    })
    
    const tabs = [{
        label: "Positions",
        component: <Positions walletId={id} />
    }, {
        label: "Orders",
        component: <Orders walletId={id} />
    }, {
        label: "Trades",
        component: <Trades walletId={id}/>
    }]

    return (
        <>
            <Show when={params.id} keyed>
                <div class="w-full 2xl:w-1/4 lg:border-r" classList={{ "2xl:block hidden": props.children()().length !== 0 }}>
                    <PageHeader>
                        <div class="w-full flex justify-between items-center">
                            <div class="flex gap-x-4 2xl:gap-x-6 h-full">
                                <For each={tabs}>
                                    {(tab, index) => (
                                        <h2
                                            onclick={() => setActiveTab(index)}
                                            class="cursor-pointer relative h-full flex items-center font-display font-bold text-lg 2xl:text-2xl"
                                            classList={{ "text-gray-400 dark:text-gray-600 dark:hover:text-gray-500 hover:text-gray-500": tabs[activeTab()] !== tab }}
                                        >
                                            {tab.label}
                                        </h2>
                                    )}
                                </For>
                            </div>
                            <div onClick={() => toggleFavorite(params.id)} class="cursor-pointer">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class={"size-6 text-gray-500" + (isFavorite(params.id) ? " text-yellow-500" : "")}>
                                    <path fill-rule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z" clipR-rule="evenodd" />
                                </svg>
                            </div>
                        </div>
                    </PageHeader>
                    <PageContent>
                        {tabs[activeTab()].component}
                    </PageContent>
                </div>
            </Show>
            {props.children}
        </>
    )
}

type ChildProps = {
    walletId: Accessor<string>
}

function Positions({ walletId }: ChildProps) {
    const { positions } = usePositions(walletId)
    const navigate = useNavigate()

    return (
        <Suspense fallback={<Loader text="Loading positions..." />}>
            <ul class="flex flex-col gap-4 text-sm">
                <For each={positions()}>
                    {position => (
                        <li
                            onClick={() => navigate(`/w/${position.wallet._id}/p/${position.coin._id}?exchange=${position.exchange}`)}
                            class="flex flex-col card card-hover cursor-pointer"
                        >
                            <div class="p-3">
                                <div class="mb-2 flex justify-between items-start">
                                    <Badge isBullish={position.isLong}>{position.isLong ? "Long" : "Short"} x{formatNumber(position.leverage, 0)}</Badge>
                                    <div>
                                        <img src={getExchangeLogo(position.exchange)} class="size-5" />
                                    </div>
                                </div>
                                <div class="flex items-center justify-between mb-2">
                                    <div class="flex items-center">
                                        <span class="font-bold text-lg">{formatNumber(position.size, 1)} {position.coin.symbol}</span>
                                        <span class="text-gray-500 text-sm ml-2">{formatNumber(position.value, 0, true)}</span>
                                    </div>
                                    <div class={"flex flex-col items-end " + (position.unrealizedPnl > 0 ? "text-bullish-500" : "text-bearish-500")}>
                                        <div class="font-mono">
                                            {formatNumber(position.unrealizedPnl, 2, true, true)}
                                        </div>
                                        <div class="text-[.7rem]">{formatNumber(position.roi, 2, false, true)}%</div>
                                    </div>
                                </div>
                            </div>
                            <div class="flex items-center justify-between text-[.7rem] text-gray-500 px-3 pb-1">
                                <div class="w-1/3">Entry: {formatNumber(position.entryPrice, 6 - position.coin.decimals[position.exchange], true)}</div>
                                <div class="w-1/3 text-center">Mark: {formatNumber(position.coin.prices[position.exchange], 6 - position.coin.decimals[position.exchange], true)}</div>
                                <div class="w-1/3 text-right">Liq: {position.liquidationPrice === null ? "N/A" : formatNumber(position.liquidationPrice, 6 - position.coin.decimals[position.exchange], true)}</div>
                            </div>
                        </li>
                    )}
                </For>
            </ul>
        </Suspense>
    )
}

function Orders({ walletId }: ChildProps) {
    return (
        <h1>ORDERS</h1>
    )
}

function Trades({ walletId }: ChildProps) {
    const navigate = useNavigate()
    const [limit] = createSignal(50)
    const { trades } = useTrades(walletId, null, limit)

    return (
        <Suspense fallback={<Loader text="Loading trades..." />}>
            <div class="-m-4">
                <table class="table text-xs bg-white dark:bg-gray-950">
                    <thead>
                        <tr>
                            <th>Time</th>
                            <th>Coin</th>
                            <th>Side</th>
                            <th>Size</th>
                            <th>Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        <For each={trades()}>
                            {trade => (
                                <tr onClick={() => navigate(`/w/${walletId()}/p/${trade.coin._id}?exchange=${trade.exchange}`)} class="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900">
                                    <td>{moment(trade.time).fromNow()}</td>
                                    <td>{trade.coin.symbol}</td>
                                    <td>
                                        <Badge isBullish={trade.isBuy}>{trade.isBuy ? "Buy" : "Sell"}</Badge>
                                    </td>
                                    <td>{formatNumber(trade.price * trade.size, 0, true)}</td>
                                    <td>{formatNumber(trade.price, 2, true)}</td>
                                </tr>
                            )}
                        </For>
                    </tbody>
                </table>
            </div>
        </Suspense>
    )
}