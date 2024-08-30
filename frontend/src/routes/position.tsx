import { useParams, useSearchParams } from "@solidjs/router";
import { batch, createEffect, createSignal, on, Show, Suspense } from "solid-js";
import PageContent from "~/components/Page/PageContent";
import PageHeader from "~/components/Page/PageHeader";
import { usePosition } from "~/domains/positions";
import { exchangeByKey, formatNumber } from "../../../shared/src/utils";
import Loader from "~/components/Loader/Loader";
import PositionChart from "~/components/PositionChart/PositionChart";

export default function Position() {
    const params = useParams()
    const [query] = useSearchParams()
    const [id, setId] = createSignal(params.id)
    const [coinSymbol, setCoinSymbol] = createSignal(params.coin)
    const [exchangeKey, setExchangeKey] = createSignal(String(query.exchange))

    const { position } = usePosition(id, coinSymbol, exchangeKey)

    createEffect(() => {
        setId(params.id)
        setCoinSymbol(params.coin)
        setExchangeKey(String(query.exchange))
    })

    return (
        <Show when={`${params.id}-${params.coin}-${query.exchange}`} keyed>
            <div class="w-3/5">
                <PageHeader>
                    <h2 class="font-display font-bold text-2xl">
                        <span>Position</span>
                        <Show when={ ! position.loading}>
                            <span> - {position()?.coin.symbol}</span>
                        </Show>
                    </h2>
                </PageHeader>
                <PageContent>
                    <Suspense fallback={<Loader text="Loading position..."/>}>
                        <div class="grid grid-cols-4 gap-x-4 mb-4">
                            <div class="card card-body">
                                <h2 class="font-display text-gray-500 dark:text-gray-400 mb-1">Side</h2>
                                <div class={"font-bold text-2xl font-mono " + (position()?.isLong ? "text-bullish-500" : "text-bearish-500")}>
                                    {position()?.isLong ? "Long" : "Short"} x{formatNumber(position()?.leverage, 1)}
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
                        <PositionChart position={position}/>
                        <div class="mt-4 card h-96 flex items-center justify-center">
                            <Loader text="Loading trades..."/>
                        </div>
                    </Suspense>
                </PageContent>
            </div>
        </Show>
    )
}