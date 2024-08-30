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

export default function Wallet(props: any) {
    const params = useParams()
    const [id, setId] = createSignal(params.id)
    const [activeTab, setActiveTab] = createSignal(0)

    createEffect(() => {
        setId(params.id)
    })

    const tabs = [{
        label: "Positions",
        component: <Positions walletId={id}/>
    }, {
        label: "Orders",
        component: <Orders walletId={id}/>
    }, {
        label: "Trades",
        component: <Trades walletId={id}/>
    }]

    return (
        <>
            <Show when={params.id} keyed>
                <div class="w-full 2xl:w-1/4 lg:border-r" classList={{ "2xl:block hidden": props.children()().length !== 0 }}>
                    <PageHeader>
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
            <ul class="flex flex-col gap-2 text-sm">
                <For each={positions()}>
                    {position => (
                        <li onClick={() => navigate(`/w/${position.wallet._id}/p/${position.coin._id}?exchange=${position.exchange}`)} class="flex flex-col card card-hover p-3 cursor-pointer">
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
                            <div class="flex items-center justify-between text-[.7rem] text-gray-500">
                                <div class="w-1/3">Entry: {formatNumber(position.entryPrice, 2, true)}</div>
                                <div class="w-1/3 text-center">Market: {formatNumber(position.coin.prices[position.exchange], 2, true)}</div>
                                <div class="w-1/3 text-right">Liquidation: {position.liquidationPrice === null ? "N/A" : formatNumber(position.liquidationPrice, 2, true)}</div>
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
    const [limit] = createSignal(50)
    const { trades } = useTrades(walletId, null, limit)
    
    return (
        <Suspense fallback={<Loader text="Loading trades..."/>}>
            <div class="-m-4">
                <table class="table text-xs">
                    <tbody>
                        <For each={trades()}>
                            {trade => (
                                <tr>
                                    <td>{trade.hash.substring(0, 5)}</td>
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