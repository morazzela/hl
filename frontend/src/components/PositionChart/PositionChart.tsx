import { createEffect, createSignal, For, on, onMount, Resource, Show } from "solid-js"
import Loader from "../Loader/Loader"
import { Interval, Position, Trade } from "../../../../shared/src/types"
import { useCandles } from "~/domains/candles"
import { AreaSeriesOptions, ChartOptions, createChart, CrosshairMode, DeepPartial, HistogramData, HistogramSeriesOptions, IChartApi, IPriceLine, ISeriesApi, LineStyle, SeriesMarker, Time } from "lightweight-charts"
import { exchangeByKey } from "../../../../shared/src/utils"
import { useNavigate } from "@solidjs/router"
import { useTheme } from "~/providers/ThemeProvider"
import { getColor } from "~/utils"
import { useTrades } from "~/domains/trades"

type Props = {
    position: Resource<Position | null>
    trades: Resource<Trade[]>
}

export default function PositionChart({ position, trades }: Props) {
    const navigate = useNavigate()

    const [coinId, setCoinId] = createSignal("")
    const [exchangeKey, setExchangeKey] = createSignal("")
    const [intervals, setIntervals] = createSignal<Interval[]>([])
    const [interval, setInterval] = createSignal<Interval>()
    const [showLines, setShowLines] = createSignal(true)
    const [showTrades, setShowTrades] = createSignal(true)
    const { isDark } = useTheme()
    const { candles } = useCandles(coinId, exchangeKey, interval)

    let container!: HTMLDivElement
    let chart!: IChartApi
    let candleSeries!: ISeriesApi<"Area", Time>
    let volumeSeries!: ISeriesApi<"Histogram", Time>
    let entryPriceLine!: IPriceLine
    let liquidationPriceLine!: IPriceLine

    onMount(() => {
        chart = createChart(container, chartConfig())
        candleSeries = chart.addAreaSeries(candleSeriesConfig())
        volumeSeries = chart.addHistogramSeries(volumeSeriesConfig())

        candleSeries.priceScale().applyOptions({
            scaleMargins: { top: 0.1, bottom: 0.1 }
        })
        
        volumeSeries.priceScale().applyOptions({
            scaleMargins: { top: 0.8, bottom: 0 }
        })
    })

    createEffect(on([trades, showTrades], () => {
        const tradesVal = trades()

        candleSeries.setMarkers([])

        if ( ! showTrades()) {
            return
        }

        if (!tradesVal || tradesVal.length === 0) {
            return
        }

        tradesVal.sort((a, b) => a.time > b.time ? 1 : -1)
        
        const markers: SeriesMarker<Time>[] = []
        for (const trade of tradesVal) {
            markers.push({
                time: Math.round(trade.time / 1000),
                position: trade.isBuy ? "belowBar" : "aboveBar",
                shape: "circle",
                color: trade.isBuy ? getColor('bullish') : getColor('bearish')
            })
        }

        candleSeries.setMarkers(markers)
    }))

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
            title: "Avg.",
            color: getColor('bullish'),
            lineStyle: LineStyle.SparseDotted,
            lineWidth: 2
        })

        if (pos.liquidationPrice !== null) {
            liquidationPriceLine = candleSeries.createPriceLine({
                price: pos.liquidationPrice,
                title: "Liq.",
                color: getColor('bearish'),
                lineStyle: LineStyle.SparseDotted,
                lineWidth: 2
            })
        }
    }))

    createEffect(on([candles], () => {
        const cands = candles()

        if (cands.length === 0) {
            return
        }

        const volumeData: HistogramData[] = []

        for (const candle of cands) {
            if (candle.volume === 0) {
                continue
            }

            volumeData.push({
                time: candle.time,
                value: candle.volume,
                color: getColor('primary') + "40"
            })  
        }
        
        volumeSeries.setData(volumeData)
        candleSeries.setData(cands.map(row => ({
            value: row.close,
            time: row.time
        })))
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
                borderVisible: false,
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
            },
            crosshair: {
                mode: CrosshairMode.Normal
            }
        }
    }

    function volumeSeriesConfig(): DeepPartial<HistogramSeriesOptions> {
        return {
            priceFormat: { type: "volume" },
            priceScaleId: '',
        }
    }

    function candleSeriesConfig(): DeepPartial<AreaSeriesOptions> {
        return {
            lineColor: getColor('primary'),
            topColor: getColor('primary') + "40",
            bottomColor: 'transparent',
            lineWidth: 2
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
                <div onClick={() => setShowLines(prev => !prev)} class="flex items-center dark:text-gray-400 text-xs rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 cursor-pointer px-1.5 py-0.5">
                    <div class={"size-3 rounded " + (showLines() ? "bg-primary-500" : "bg-gray-300 dark:bg-gray-600")}></div>
                    <div class="ml-2">Show entry / liq.</div>
                </div>
                <div onClick={() => setShowTrades(prev => !prev)} class="flex items-center dark:text-gray-400 text-xs rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 cursor-pointer px-1.5 py-0.5">
                    <div class={"size-3 rounded " + (showTrades() ? "bg-primary-500" : "bg-gray-300 dark:bg-gray-600")}></div>
                    <div class="ml-2">Show trades</div>
                </div>
            </div>
            <div ref={container} class="h-96 relative card rounded-tl-none overflow-hidden w-full">
                <div class="absolute top-0 right-14 rounded-lg" classList={{ "hidden": !trades.loading }}>
                    <Loader text="Loading trades..."/>
                </div>
                <div class="absolute inset-0 bg-white dark:bg-gray-950 flex items-center justify-center z-10" classList={{ "hidden": !candles.loading }}>
                    <Loader text="Loading chart..." />
                </div>
            </div>
        </div>
    )
}