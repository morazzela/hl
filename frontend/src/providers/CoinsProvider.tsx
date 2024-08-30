import { createContext, createEffect, on, onCleanup, onMount, useContext } from "solid-js"
import { createStore } from "solid-js/store"
import { Coin } from "../../../shared/src/types"
import { getCoinModel } from "../../../shared/src/database"
import exchanges from "../../../shared/src/exchanges"
import axios from "axios"
import { useHyperliquidSocket } from "./HyperliquidSocketProvider"

type ContextType = {
    coins: Coin[]
}

const Context = createContext<ContextType>({ coins: [] })

async function fetchCoins(): Promise<Coin[]> {
    "use server";

    let res = await getCoinModel().find().select(["symbol", "decimals"])
    const coins = res.map(coin => coin.toObject({ flattenObjectIds: true, flattenMaps: true })) as Coin[]

    for (const i in coins) {
        coins[i].prices = {}
        for (const ex of exchanges) {
            coins[i].prices[ex.getKey()] = 0
        }
    }

    return coins
}

export function CoinsProvider(props: any) {
    const [coins, setCoins] = createStore<Coin[]>([])
    const { isReady, lastMessage, subscribe, unsubscribe } = useHyperliquidSocket()

    createEffect(on(isReady, () => {
        if (isReady()) {
            subscribe({ type: "allMids" })
        }
    }))

    onCleanup(() => {
        if (isReady()) {
            unsubscribe({ type: "allMids" })
        }
    })

    createEffect(on(lastMessage, () => {
        const { data, channel } = lastMessage()

        if (channel !== "allMids") {
            return
        }

        for (const symbol in data.mids) {
            const index = coins.findIndex(c => c.symbol === symbol)

            if (index === -1) {
                continue
            }
            
            setCoins(index, "prices", "hl", Number(data.mids[symbol]))
        }
    }))

    createEffect(() => {
        async function main() {
            setCoins(await fetchCoins())
        }

        main()
    })

    const gmxInterval = setInterval(async () => {
        if (coins.length === 0) {
            return
        }
        
        const { data } = await axios.get("https://arbitrum-api.gmxinfra.io/prices/tickers")

        for (const row of data) {
            const index = coins.findIndex(coin => coin.symbol === row.tokenSymbol)

            if (index === -1) {
                continue
            }

            setCoins(index, "prices", "gmx", Number(row.minPrice) / 10 ** (30 - coins[index].decimals.gmx))
        }
    }, 1000)

    onCleanup(() => {
        clearInterval(gmxInterval)
    })
    
    return (
        <Context.Provider value={{ coins }}>
            {props.children}
        </Context.Provider>
    )
}

export function useCoins() {
    return useContext(Context)
}