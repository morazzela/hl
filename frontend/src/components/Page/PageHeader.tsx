import { Show } from "solid-js"
import { useSidebar } from "~/providers/SidebarProvider"

type Props = {
    children: any,
    hideMenu?: boolean
}

export default function PageHeader({ children, hideMenu }: Props) {
    const { setIsOpen } = useSidebar()
    
    return (
        <div class="border-b h-16 flex items-center bg-white dark:bg-gray-950 px-4">
            <Show when={!hideMenu}>
                <div onclick={() => setIsOpen(true)} class="lg:hidden h-full flex items-center justify-center px-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width={1.5} stroke="currentColor" class="size-8">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
                    </svg>
                </div>
            </Show>
            <div class="h-full w-full flex items-center ml-4">
                {children}
            </div>
        </div>
    )
}