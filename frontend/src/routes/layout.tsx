import { createEffect, Show, Suspense } from "solid-js"
import Sidebar from "../components/Sidebar/Sidebar"
import TopBanner from "../components/TopBanner/TopBanner"
import { useCoins } from "../providers/CoinsProvider"
import { useUser } from "~/domains/auth"
import { useNavigate } from "@solidjs/router"

export default function Layout(props: any) {
    const navigate = useNavigate()
    const { coins } = useCoins()
    const { user } = useUser()

    createEffect(() => {
        if (user.loading) {
            return
        }
        
        if (user() === null) {
            navigate('/login', { replace: true })
        } else if (user()?.verified !== true) {
            navigate('/verify')
        }
    })

    return (
        <Show when={coins.length > 0 && !user.loading && user()?.verified}>
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