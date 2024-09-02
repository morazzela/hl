import { useSidebar } from "~/providers/SidebarProvider"

type Props = {
    children: any,
}

export default function PageFooter({ children }: Props) {
    const { setIsOpen } = useSidebar()
    
    return (
        <div class="border-t w-full h-16 flex items-center bg-white dark:bg-gray-950 px-4 absolute bottom-0 inset-x">
            <div class="h-full w-full flex items-center">
                {children}
            </div>
        </div>
    )
}