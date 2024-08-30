import { useParams, useSearchParams } from "@solidjs/router";
import { batch, createEffect, createSignal, For, on, Show, Suspense } from "solid-js";
import PageContent from "~/components/Page/PageContent";
import PageHeader from "~/components/Page/PageHeader";
import { usePosition } from "~/domains/positions";
import { exchangeByKey, formatNumber } from "../../../shared/src/utils";
import Loader from "~/components/Loader/Loader";
import PositionChart from "~/components/PositionChart/PositionChart";
import { useTrades } from "~/domains/trades";
import Badge from "~/components/Badge/Badge";
import moment from "moment";

export default function Position() {
    const params = useParams()
    const [query] = useSearchParams()
    const [id, setId] = createSignal(params.id)
    const [coinId, setCoinId] = createSignal(params.coin)
    const [exchangeKey, setExchangeKey] = createSignal(String(query.exchange))

    const { position } = usePosition(id, coinId, exchangeKey)
    const { trades } = useTrades(id, exchangeKey, null, coinId)

    const cards = [{
        label: "Side",
        value: () => <span class={position()?.isLong ? "text-bullish-500" : "text-bearish-500"}>{position()?.isLong ? "Long" : "Short"} x{formatNumber(position()?.leverage, 0)}</span>
    }, {
        label: "Value",
        value: () => formatNumber(position()?.value, 0, true)
    }, {
        label: "Collateral",
        value: () => formatNumber(position()?.collateral, 0, true)
    }, {
        label: "Unrealized Pnl",
        value: () => <span class={position()?.unrealizedPnl > 0 ? "text-bullish-500" : "text-bearish-500"}>{formatNumber(position()?.unrealizedPnl, 2, true)}</span>
    }]

    createEffect(() => {
        setId(params.id)
        setCoinId(params.coin)
        setExchangeKey(String(query.exchange))
    })

    return (
        <Show when={`${params.id}-${params.coin}-${query.exchange}`} keyed>
            <div class="w-full lg:w-full 2xl:w-4/5">
                <PageHeader>
                    <h2 class="font-display font-bold text-2xl">
                        <span>Position</span>
                        <Show when={!position.loading}>
                            <span> - {position()?.coin.symbol}</span>
                        </Show>
                    </h2>
                </PageHeader>
                <PageContent>
                    <Suspense fallback={<Loader text="Loading position..." />}>
                        <div class="grid grid-cols-1 lg:grid-cols-2 lg:gap-2 mb-4 -mt-4 lg:mt-0 divide-y">
                            <For each={cards}>
                                {card => (
                                    <div class="card card-body -mx-4 rounded-none border-0 lg:rounded-lg lg:border lg:mx-0 transform">
                                        <h2 class="font-display text-gray-500 dark:text-gray-500 mb-1">{card.label}</h2>
                                        <div class="font-bold text-2xl font-mono">{card.value()}</div>
                                    </div>
                                )}
                            </For>
                        </div>
                        <PositionChart position={position} trades={trades} />
                        <div class="card mt-4 h-96 overflow-y-auto -mx-4 rounded-none border-x-0 lg:mx-0 lg:rounded-xl lg:border-x">
                            <Suspense fallback={<div class="h-full w-full flex items-center justify-center"><Loader text="Loading trades..." /></div>}>
                                <table class="table text-sm">
                                    <thead>
                                        <tr>
                                            <th>Time</th>
                                            <th>Side</th>
                                            <th>Value</th>
                                            <th>Price</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <For each={trades()?.slice(0, 50)}>
                                            {trade => (
                                                <tr>
                                                    <td>{moment(trade.time).fromNow()}</td>
                                                    <td>
                                                        <Badge isBullish={trade.isBuy}>{trade.isBuy ? "Buy" : "Sell"}</Badge>
                                                    </td>
                                                    <td>{formatNumber(trade.size * trade.price, 2, true)}</td>
                                                    <td>{formatNumber(trade.price, 2, true)}</td>
                                                </tr>
                                            )}
                                        </For>
                                    </tbody>
                                </table>
                            </Suspense>
                        </div>
                    </Suspense>
                </PageContent>
            </div>
        </Show>
    )
}