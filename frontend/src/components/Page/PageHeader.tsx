import { Show } from "solid-js"
import { useSidebar } from "~/providers/SidebarProvider"

type Props = {
    children: any,
    hideMenu: boolean
}

export default function PageHeader({ children, hideMenu }: Props) {
    const { setIsOpen } = useSidebar()
    
    return (
        <div class="border-b px-4 h-16 flex items-center bg-white dark:bg-gray-950">
            <Show when={!hideMenu}>
                <div onclick={() => setIsOpen(true)} class="ml-2 mr-6 lg:hidden">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width={1.5} stroke="currentColor" class="size-6">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
                    </svg>
                </div>
            </Show>
            <div>
                {children}
            </div>
        </div>
    )
}