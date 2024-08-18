import { Suspense } from "solid-js";

export default function Layout(props: any) {
    return (
        <Suspense>
            <div class="flex min-h-screen">
                <div class="w-1/4"></div>
                <div class="w-3/4">
                    {props.children}
                </div>
            </div>
        </Suspense>
    )
}