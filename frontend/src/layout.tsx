import { Show, Suspense } from "solid-js"
import Sidebar from "./components/Sidebar/Sidebar"
import TopBanner from "./components/TopBanner/TopBanner"
import { useCoins } from "./providers/CoinsProvider"

export default function Layout(props: any) {
    const { coins } = useCoins()
    
    return (
        <Show when={coins.length > 0}>
            <div>
                <TopBanner/>
                <div class="flex" style={{ "height": "calc(100vh - 1.25rem)", "max-height": "calc(100vh - 1.25rem)" }}>
                    <Sidebar/>
                    <Suspense>{props.children}</Suspense>
                </div>
            </div>
        </Show>
    )
}