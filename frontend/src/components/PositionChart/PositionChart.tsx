import { Accessor, createEffect, createSignal, For, InitializedResource, on, onMount, Resource } from "solid-js"
import Loader from "../Loader/Loader"
import { Candle, Interval, Position, Trade } from "../../../../shared/src/types"
import { useCandles } from "~/domains/candles"
import { AreaData, AreaSeriesOptions, BarPrice, BaselineData, BaselineSeriesOptions, ChartOptions, createChart, CrosshairMode, DeepPartial, HistogramData, HistogramSeriesOptions, IChartApi, IPriceLine, ISeriesApi, LineStyle, LogicalRange, LogicalRangeChangeEventHandler, MouseEventHandler, SeriesMarker, Time, TimeRangeChangeEventHandler } from "lightweight-charts"
import { exchangeByKey, formatNumber } from "../../../../shared/src/utils"
import { useNavigate } from "@solidjs/router"
import { useTheme } from "~/providers/ThemeProvider"
import { getColor } from "~/utils"

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
    let positionContainer!: HTMLDivElement

    let chart!: IChartApi
    let positionChart!: IChartApi

    let areaSeries!: ISeriesApi<"Area", Time>
    let volumeSeries!: ISeriesApi<"Histogram", Time>
    let positionSeries!: ISeriesApi<"Baseline", Time>

    let entryPriceLine!: IPriceLine
    let liquidationPriceLine!: IPriceLine

    onMount(() => {
        chart = createChart(container, chartConfig())
        positionChart = createChart(positionContainer, positionChartConfig())

        areaSeries = chart.addAreaSeries(candleSeriesConfig())
        volumeSeries = chart.addHistogramSeries(volumeSeriesConfig())
        positionSeries = positionChart.addBaselineSeries(positionSeriesConfig())

        volumeSeries.priceScale().applyOptions({
            scaleMargins: { top: 0.8, bottom: 0 }
        })

        chart.timeScale().subscribeVisibleLogicalRangeChange(onChartVisibleLogicalRangeChange)
        positionChart.timeScale().subscribeVisibleLogicalRangeChange(onPositionChartVisibleLogicalRangeChange)
    })

    createEffect(on([trades, showTrades, interval], () => {
        const tradesValue = trades()
        const intervalValue = interval()

        areaSeries.setMarkers([])

        if (!showTrades()) {
            return
        }

        if (!tradesValue || tradesValue.length === 0 || !intervalValue) {
            return
        }

        tradesValue.sort((a, b) => a.time > b.time ? 1 : -1)
        const aggrTrades = Object.values(aggregateTrades(tradesValue, intervalValue))

        let biggestSize = 0
        for (const trade of aggrTrades) {
            const size = Math.abs(trade.size)
            if (size > biggestSize) {
                biggestSize = size
            }
        }

        const markers: SeriesMarker<Time>[] = []
        for (const trade of aggrTrades) {
            markers.push({
                time: trade.time,
                position: trade.size > 0 ? "belowBar" : "aboveBar",
                shape: "circle",
                color: trade.size > 0 ? getColor('bullish') : getColor('bearish'),
            })
        }

        areaSeries.setMarkers(markers)
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
        setInterval(exchange.getAvailableChartIntervals()[4])
    }))

    createEffect(on([position, showLines], () => {
        const pos = position()

        if (!pos) {
            return
        }

        if (entryPriceLine) {
            areaSeries.removePriceLine(entryPriceLine)
        }

        if (liquidationPriceLine) {
            areaSeries.removePriceLine(liquidationPriceLine)
        }

        if (!showLines()) {
            return
        }

        entryPriceLine = areaSeries.createPriceLine({
            price: pos.entryPrice,
            title: "Avg.",
            color: getColor('bullish'),
            lineStyle: LineStyle.SparseDotted,
            lineWidth: 2
        })

        if (pos.liquidationPrice !== null) {
            liquidationPriceLine = areaSeries.createPriceLine({
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
        areaSeries.setData(cands.map(row => ({
            value: row.close,
            time: row.time
        })))
    }))

    createEffect(on([candles, trades], () => {
        const candlesValue = candles()
        const tradesValue = trades()
        const intervalValue = interval()

        if (candlesValue.length === 0 || !tradesValue || !intervalValue) {
            return
        }

        const aggr = aggregateTrades(tradesValue, intervalValue)
        const aggrBeforeFirstCandle = Object.values(aggr).filter(a => a.time < Number(candlesValue[0].time))
        const data: BaselineData<Time>[] = []

        let lastValue = 0
        if (aggrBeforeFirstCandle.length > 0) {
            lastValue = aggrBeforeFirstCandle[aggrBeforeFirstCandle.length - 1].positionSize
        }

        for (const candle of candlesValue) {
            const trade = aggr[Number(candle.time)]

            let val = lastValue

            if (trade) {
                val = trade.positionSize
                lastValue = trade.positionSize
            }

            data.push({
                value: val,
                time: candle.time,
            })
        }

        positionSeries.setData(data)
    }))

    createEffect(on(isDark, () => {
        chart.applyOptions(chartConfig())
        positionChart.applyOptions(positionChartConfig())
    }, { defer: true }))

    async function onChartVisibleLogicalRangeChange(logicalRange: LogicalRange | null) {
        if (logicalRange !== null) {
            positionChart.timeScale().setVisibleLogicalRange(logicalRange)
        }
    }

    async function onPositionChartVisibleLogicalRangeChange(logicalRange: LogicalRange | null) {
        if (logicalRange !== null) {
            chart.timeScale().setVisibleLogicalRange(logicalRange)
        }
    }

    function aggregateTrades(trades: Trade[], interval: Interval) {
        const aggr: { [key:string]: { time: number, positionSize: number, size: number } } = {}

        for (const trade of trades) {
            let time = Math.round(trade.time / 1000)
            time = time - (time % interval.seconds)

            if ( ! aggr[time]) {
                aggr[time] = {
                    positionSize: trade.startPosition,
                    size: 0,
                    time: time
                }
            }

            aggr[time].positionSize += trade.size * (trade.isBuy ? 1 : -1)
            aggr[time].size += trade.size * (trade.isBuy ? 1 : -1)
        }
        
        return aggr
    }

    function chartConfig(): DeepPartial<ChartOptions> {
        return {
            autoSize: true,
            timeScale: {
                visible: false
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

    function positionChartConfig(): DeepPartial<ChartOptions> {
        return {
            autoSize: true,
            grid: {
                vertLines: { visible: false },
                horzLines: { visible: false }
            },
            rightPriceScale: { borderVisible: false },
            timeScale: {
                borderVisible: false,
                timeVisible: true
            },
            crosshair: { mode: CrosshairMode.Hidden },
            layout: {
                background: {
                    color: "transparent"
                },
                textColor: isDark() ? "white" : "black"
            },
        }
    }

    function positionSeriesConfig(): DeepPartial<BaselineSeriesOptions> {
        return {
            priceFormat: {
                type: "custom",
                formatter: (val: BarPrice) => formatNumber(val, 1, false) + " " + position()?.coin.symbol
            },
            priceScaleId: '',
            baseValue: {
                type: "price",
                price: 0
            },

            topLineColor: getColor('bullish'),
            bottomLineColor: getColor('bearish'),

            topFillColor1: getColor('bullish') + "40",
            topFillColor2: getColor('bullish') + "40",

            bottomFillColor1: getColor('bearish') + "40",
            bottomFillColor2: getColor('bearish') + "40",

            baseLineColor: "transparent",
            priceLineColor: "transparent"
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
        <div class="flex flex-col items-start -mx-4 lg:mx-0">
            <div class="flex items-center gap-x-2 text-xs ml-4 lg:ml-0">
                <div class="flex divide-x card border-b-0 rounded-b-none transform translate-y-px overflow-hidden text-[.65rem] z-20 font-mono">
                    <For each={intervals()}>
                        {int => (
                            <div onClick={() => { setInterval(int) }} class="w-10 text-center py-2 cursor-pointer" classList={{
                                "hover:bg-gray-50 hover:dark:bg-gray-900 bg-gray-50 dark:bg-gray-900 text-gray-500 border-b dark:text-gray-400": int !== interval(),
                            }}>{int.key}</div>
                        )}
                    </For>
                </div>
                <div class="hidden lg:flex">
                    <div onClick={() => setShowLines(prev => !prev)} class="flex items-center dark:text-gray-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 cursor-pointer px-2 py-1">
                        <div class={"size-3 rounded " + (showLines() ? "bg-primary-500" : "bg-gray-300 dark:bg-gray-600")}></div>
                        <div class="ml-2">Show entry / liq.</div>
                    </div>
                    <div onClick={() => setShowTrades(prev => !prev)} classList={{ "hidden": trades.loading || trades()?.length === 0 }} class="flex items-center dark:text-gray-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 cursor-pointer px-2 py-1">
                        <div class={"size-3 rounded " + (showTrades() ? "bg-primary-500" : "bg-gray-300 dark:bg-gray-600")}></div>
                        <div class="ml-2">Show trades</div>
                    </div>
                </div>
            </div>
            <div class="relative w-full card overflow-hidden w-full rounded-none lg:rounded-lg lg:rounded-tl-none border-x-0 lg:border-x">
                <div class="absolute inset-0 bg-white dark:bg-gray-950 flex items-center justify-center z-20" classList={{ "hidden": !candles.loading }}>
                    <Loader text="Loading chart..." />
                </div>
                <div ref={container} class="h-96"></div>
                <div class="relative w-full border-t">
                        <div class="absolute inset-0 bg-white dark:bg-gray-950 flex items-center justify-center z-10" classList={{ "hidden": !trades.loading }}>
                            <Loader text="Loading trades..." />
                        </div>
                    <div class="h-40 w-full" ref={positionContainer}></div>
                </div>
            </div>
        </div>
    )
}