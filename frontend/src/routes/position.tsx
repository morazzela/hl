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
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                            <div class="card card-body">
                                <h2 class="font-display text-gray-500 dark:text-gray-400 mb-1">Side</h2>
                                <div class={"font-bold text-2xl font-mono " + (position()?.isLong ? "text-bullish-500" : "text-bearish-500")}>
                                    {position()?.isLong ? "Long" : "Short"} x{formatNumber(position()?.leverage, 0)}
                                </div>
                            </div>
                            <div class="card card-body">
                                <h2 class="font-display text-gray-500 dark:text-gray-400 mb-1">Value</h2>
                                <div class="font-bold text-2xl font-mono">{formatNumber(position()?.value, 0, true)}</div>
                            </div>
                            <div class="card card-body">
                                <h2 class="font-display text-gray-500 dark:text-gray-400 mb-1">Collateral</h2>
                                <div class="font-bold text-2xl font-mono">{formatNumber(position()?.collateral, 0, true)}</div>
                            </div>
                            <div class="card card-body">
                                <h2 class="font-display text-gray-500 dark:text-gray-400 mb-1">Unrealized Pnl</h2>
                                <div class={"font-bold text-2xl font-mono " + (Number(position()?.unrealizedPnl) > 0 ? "text-bullish-500" : "text-bearish-500")}>
                                    {formatNumber(position()?.unrealizedPnl, 2, true, true)}
                                </div>
                            </div>
                        </div>
                        <PositionChart position={position} trades={trades} />
                        <div class="card mt-4 h-96 overflow-y-auto">
                            <Suspense fallback={<div class="h-full w-full flex items-center justify-center"><Loader text="Loading trades..." /></div>}>
                                <table class="table">
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