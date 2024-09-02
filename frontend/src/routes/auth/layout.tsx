import { Suspense } from "solid-js";
import TopBanner from "~/components/TopBanner/TopBanner";

export function AuthLayout(props: any) {
    return (
        <div>
            <div class="absolute inset-x-0 top-0">
                <TopBanner/>
            </div>
            <div class="flex items-center justify-center h-screen">
                <Suspense>{props.children}</Suspense>
            </div>
        </div>
    )
}