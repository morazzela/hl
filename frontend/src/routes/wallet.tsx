import { useNavigate, useParams } from "@solidjs/router"
import { createEffect, createSignal, For, on, Resource, Show, Suspense } from "solid-js"
import Loader from "~/components/Loader/Loader"
import { usePositions } from "~/domains/positions"
import { exchangeByKey, formatNumber } from "../../../shared/src/utils"
import Badge from "~/components/Badge/Badge"
import { Position } from "../../../shared/src/types"
import PageHeader from "~/components/Page/PageHeader"
import PageContent from "~/components/Page/PageContent"

export default function Wallet(props: any) {
    const params = useParams()
    const [id, setId] = createSignal(params.id)
    const [activeTab, setActiveTab] = createSignal(0)
    const { positions } = usePositions(id)

    createEffect(() => {
        setId(params.id)
    })

    const tabs = [{
        label: "Positions",
        component: <Positions positions={positions} />
    }, {
        label: "Orders",
        component: <></>
    }, {
        label: "Trades",
        component: <></>
    }]

    return (
        <>
            <Show when={params.id} keyed>
                <div class="w-1/5 border-r">
                    <PageHeader>
                        <div class="flex gap-x-6 h-full">
                            <For each={tabs}>
                                {(tab, index) => (
                                    <h2
                                        onclick={() => setActiveTab(index)}
                                        class="cursor-pointer relative h-full flex items-center font-display font-bold text-2xl"
                                        classList={{ "text-gray-400 dark:text-gray-600 dark:hover:text-gray-500 hover:text-gray-500": tabs[activeTab()] !== tab }}
                                    >
                                        <div
                                            class="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1.5 size-3 border-b border-r rotate-45 bg-white dark:bg-gray-950"
                                            classList={{ "hidden": tabs[activeTab()] !== tab }}
                                        ></div>
                                        <span>{tab.label}</span>
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

type PositionsProps = {
    positions: Resource<Position[]>
}

function Positions({ positions }: PositionsProps) {
    const navigate = useNavigate()

    return (
        <Suspense fallback={<Loader text="Loading positions..." />}>
            <ul class="flex flex-col gap-2 text-sm">
                <For each={positions()}>
                    {position => (
                        <li onClick={() => navigate(`/w/${position.wallet._id}/p/${position.coin._id}?exchange=${position.exchange}`)} class="flex flex-col card card-hover p-3 cursor-pointer">
                            <div class="mb-2 flex justify-between items-start">
                                <Badge isBullish={position.isLong}>{position.isLong ? "Long" : "Short"}</Badge>
                                <div>
                                    <img src={exchangeByKey(position.exchange)?.getLogo()} class="size-5" />
                                </div>
                            </div>
                            <div class="flex items-center justify-between mb-2">
                                <div class="flex items-center">
                                    <span class="font-bold text-lg">{formatNumber(position.size, 1)} {position.coin.symbol}</span>
                                    <span class="text-gray-500 dark:text-gray-400 text-sm ml-2">{formatNumber(position.value, 0, true)}</span>
                                </div>
                                <div class={"flex flex-col items-end " + (position.unrealizedPnl > 0 ? "text-bullish-500" : "text-bearish-500")}>
                                    <div class="font-mono">
                                        {formatNumber(position.unrealizedPnl, 2, true, true)}
                                    </div>
                                    <div class="text-[.7rem]">{formatNumber(position.roi, 2, false, true)}%</div>
                                </div>
                            </div>
                            <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                <span>Entry: {formatNumber(position.entryPrice, 2, true)}</span>
                                <span>Liquidation: {position.liquidationPrice === null ? "N/A" : formatNumber(position.liquidationPrice, 2, true)}</span>
                            </div>
                        </li>
                    )}
                </For>
            </ul>
        </Suspense>
    )
}