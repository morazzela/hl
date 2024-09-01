import { createEffect, createSignal, For } from "solid-js";
import { useCoins } from "~/providers/CoinsProvider";
import { formatNumber } from "../../../../shared/src/utils";
import { useTheme } from "~/providers/ThemeProvider";
import { Coin } from "../../../../shared/src/types";

export default function TopBanner() {
    const { coins } = useCoins()
    const [exchange] = createSignal("hl")
    const { setIsDark, isDark } = useTheme()

    const exchangeCoins = () => coins.filter(coin => Number(coin.prices[exchange()]) !== 0)

    return (
        <div class="h-5 bg-gray-950 flex whitespace-nowrap text-white items-center justify-between text-[.6rem] leading-none font-mono w-screen border-b">
            <div class="flex gap-x-4 px-4 overflow-x-hidden">
                <For each={exchangeCoins()}>
                    {coin => <CoinPrice coin={coin} exchange={exchange()}/>}
                </For>
            </div>
            <div onClick={() => setIsDark(prev => !prev)} class="h-full min-w-8 flex items-center justify-center cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="size-3.5" classList={{ "hidden": isDark() }}>
                    <path fill-rule="evenodd" d="M7.455 2.004a.75.75 0 0 1 .26.77 7 7 0 0 0 9.958 7.967.75.75 0 0 1 1.067.853A8.5 8.5 0 1 1 6.647 1.921a.75.75 0 0 1 .808.083Z" clip-rule="evenodd" />
                </svg>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="size-3.5" classList={{ "hidden": !isDark() }}>
                    <path d="M10 2a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 2ZM10 15a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 15ZM10 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM15.657 5.404a.75.75 0 1 0-1.06-1.06l-1.061 1.06a.75.75 0 0 0 1.06 1.06l1.06-1.06ZM6.464 14.596a.75.75 0 1 0-1.06-1.06l-1.06 1.06a.75.75 0 0 0 1.06 1.06l1.06-1.06ZM18 10a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 18 10ZM5 10a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 5 10ZM14.596 15.657a.75.75 0 0 0 1.06-1.06l-1.06-1.061a.75.75 0 1 0-1.06 1.06l1.06 1.06ZM5.404 6.464a.75.75 0 0 0 1.06-1.06l-1.06-1.06a.75.75 0 1 0-1.061 1.06l1.06 1.06Z" />
                </svg>
            </div>
        </div>
    )
}

type CoinPriceProps = {
    coin: Coin,
    exchange: string
}

function CoinPrice({ coin, exchange }: CoinPriceProps) {
    const [lastPrice, setLastPrice] = createSignal(coin.prices[exchange])
    const [animation, setAnimation] = createSignal<boolean|null>(null)

    createEffect(() => {
        if (lastPrice() === coin.prices[exchange]) {
            return
        }

        if (coin.prices[exchange] > lastPrice()) {
            setAnimation(true)
        } else if (coin.prices[exchange] < lastPrice()) {
            setAnimation(false)
        }

        setLastPrice(coin.prices[exchange])
    })

    createEffect(() => {
        if (animation() === null) {
            return
        }

        setTimeout(() => {
            setAnimation(null)
        }, 1000)
    })
    
    return (
        <div>
            <span class="transition duration-75 ease-out font-bold" classList={{ "text-bullish-500": animation() === true, "text-bearish-500": animation() === false }}>
                {coin.symbol} {formatNumber(coin.prices[exchange], 6 - coin.decimals[exchange], true)}
            </span>
        </div>
        
    )
}