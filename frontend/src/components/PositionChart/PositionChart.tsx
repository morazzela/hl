import { createEffect, createSignal, For, on, onMount, Resource, Show } from "solid-js"
import Loader from "../Loader/Loader"
import { Interval, Position } from "../../../../shared/src/types"
import { useCandles } from "~/domains/candles"
import { ChartOptions, createChart, DeepPartial, IChartApi, IPriceLine, ISeriesApi, Time } from "lightweight-charts"
import { exchangeByKey } from "../../../../shared/src/utils"
import { useNavigate } from "@solidjs/router"
import { INTERVAL_1D } from "../../../../shared/src/constants"
import { useTheme } from "~/providers/ThemeProvider"

type Props = {
    position: Resource<Position | null>
}

export default function PositionChart({ position }: Props) {
    const navigate = useNavigate()

    const [coinId, setCoinId] = createSignal("")
    const [exchangeKey, setExchangeKey] = createSignal("")
    const [intervals, setIntervals] = createSignal<Interval[]>([])
    const [interval, setInterval] = createSignal<Interval>()
    const [showLines, setShowLines] = createSignal(true)
    const [showTrades, setShowTrades] = createSignal(false)
    const { isDark } = useTheme()
    const { candles } = useCandles(coinId, exchangeKey)

    let container!: HTMLDivElement
    let chart!: IChartApi
    let candleSeries!: ISeriesApi<"Candlestick", Time>
    let entryPriceLine!: IPriceLine
    let liquidationPriceLine!: IPriceLine

    onMount(() => {
        chart = createChart(container, chartConfig())
        candleSeries = chart.addCandlestickSeries()
    })

    createEffect(on(position, () => {
        let pos = position()

        if (!pos) {
            return
        }

        setCoinId(pos.coinId)
        setExchangeKey(pos.exchange)

        const exchange = exchangeByKey(pos.exchange)

        if (!exchange) {
            return navigate('/')
        }

        setIntervals(exchange.getAvailableChartIntervals())
        setInterval(exchange.getAvailableChartIntervals()[0])
    }))

    createEffect(on([position, showLines], () => {
        const pos = position()

        if (!pos) {
            return
        }

        if (entryPriceLine) {
            candleSeries.removePriceLine(entryPriceLine)
        }

        if (liquidationPriceLine) {
            candleSeries.removePriceLine(liquidationPriceLine)
        }

        if (!showLines()) {
            return
        }
        
        entryPriceLine = candleSeries.createPriceLine({
            price: pos.entryPrice,
            title: "Avg."
        })

        if (pos.liquidationPrice !== null) {
            liquidationPriceLine = candleSeries.createPriceLine({
                price: pos.liquidationPrice,
                title: "Liq."
            })
        }
    }))

    createEffect(on([candles, interval], () => {
        const int = interval()
        const cands = candles()

        if (!int || !cands) {
            return
        }

        const data = cands[int.key]

        if (!data) {
            return
        }

        candleSeries.setData(data)
    }))

    createEffect(on(isDark, () => {
        chart.applyOptions(chartConfig())
    }, { defer: true }))

    function chartConfig(): DeepPartial<ChartOptions> {
        return {
            timeScale: {
                borderVisible: false,
                timeVisible: true,
            },
            rightPriceScale: {
                borderVisible: false
            },
            layout: {
                background: {
                    color: "transparent"
                },
                textColor: isDark() ? "white" : "black"
            },
            grid: {
                horzLines: { visible: false },
                vertLines: { visible: false }
            }
        }
    }

    return (
        <div class="flex flex-col items-start">
            <div class="flex items-center gap-x-4">
                <div class="flex divide-x card rounded-b-none border-b-0 overflow-hidden text-[.65rem] z-10 font-mono transform translate-y-px">
                    <For each={intervals()}>
                        {int => (
                            <div onClick={() => { setInterval(int) }} class="w-10 text-center py-2 cursor-pointer" classList={{
                                "hover:bg-gray-50 hover:dark:bg-gray-900 border-b bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400": int !== interval(),
                            }}>{int.key}</div>
                        )}
                    </For>
                </div>
                <div onClick={() => setShowLines(prev => !prev)} class="flex items-center dark:text-gray-400 text-xs rounded-lg hover:bg-gray-800 cursor-pointer px-1.5 py-0.5">
                    <div class={"size-3 rounded " + (showLines() ? "bg-primary-500" : "bg-white dark:bg-gray-600")}></div>
                    <div class="ml-2">Show entry / liquidation prices</div>
                </div>
                <div onClick={() => setShowTrades(prev => !prev)} class="flex items-center dark:text-gray-400 text-xs rounded-lg hover:bg-gray-800 cursor-pointer px-1.5 py-0.5">
                    <div class={"size-3 rounded " + (showTrades() ? "bg-primary-500" : "bg-white dark:bg-gray-600")}></div>
                    <div class="ml-2">Show trades</div>
                </div>
            </div>
            <div ref={container} class="h-96 relative card rounded-tl-none overflow-hidden w-full">
                <div class="absolute inset-0 bg-white dark:bg-gray-950 flex items-center justify-center z-10" classList={{ "hidden": !candles.loading }}>
                    <Loader text="Loading chart..." />
                </div>
            </div>
        </div>
    )
}