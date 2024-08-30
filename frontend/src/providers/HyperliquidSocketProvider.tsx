import { Accessor, createContext, createSignal, onMount, useContext } from "solid-js"
import { sleep } from "../../../shared/src/utils"

type ContextType = {
    isReady: Accessor<boolean>
    lastMessage: Accessor<any>
    subscribe: { (params: any): void }
    unsubscribe: { (params: any): void }
}

const Context = createContext()

export function HyperliquidSocketProvider(props: any) {
    const [isReady, setIsReady] = createSignal(false)
    const [lastMessage, setLastMessage] = createSignal<any>({})

    let ws: WebSocket

    onMount(() => connect())

    const connect = async () => {
        ws = new WebSocket("wss://api.hyperliquid.xyz/ws")
        ws.addEventListener("open", onOpen)
        ws.addEventListener("close", onClose)
        ws.addEventListener("message", onMessage)
    }

    const onOpen = async () => {
        while (ws.readyState !== WebSocket.OPEN) {
            await sleep(100)
        }

        setIsReady(true)
    }

    const onClose = async () => {
        setIsReady(false)
        await sleep(2500)
        connect()
    }

    const onMessage = (ev: MessageEvent) => {
        setLastMessage(JSON.parse(ev.data))
    }

    const subscribe = (params: any) => {
        ws.send(JSON.stringify({ method: "subscribe", subscription: params }))
    }

    const unsubscribe = (params: any) => {
        ws.send(JSON.stringify({ method: "unsubscribe", subscription: params }))
    }
    
    return (
        <Context.Provider value={{ isReady, lastMessage, subscribe, unsubscribe }}>
            {props.children}
        </Context.Provider>
    )
}

export function useHyperliquidSocket() {
    return useContext(Context) as ContextType
}