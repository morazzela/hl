import { createEffect, Show, Suspense } from "solid-js"
import Sidebar from "../components/Sidebar/Sidebar"
import TopBanner from "../components/TopBanner/TopBanner"
import { useCoins } from "../providers/CoinsProvider"
import { useNavigate } from "@solidjs/router"

export default function Layout(props: any) {
    const navigate = useNavigate()
    const { coins } = useCoins()

    return (
        <Show when={coins.length > 0}>
            <div>
                <TopBanner/>
                <div class="flex" style={{ "height": "calc(100vh - 1.25rem)", "max-height": "calc(100vh - 1.25rem)" }}>
                    <Sidebar/>
                    <div class="flex w-full lg:w-3/5 xl:w-2/3 2xl:w-4/5 ml-auto">
                        <Suspense>{props.children}</Suspense>
                    </div>
                </div>
            </div>
        </Show>
    )
}