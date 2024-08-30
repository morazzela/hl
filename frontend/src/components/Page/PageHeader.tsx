export default function PageHeader(props: any) {
    return (
        <div class="border-b px-4 h-16 flex items-center bg-white dark:bg-gray-950">
            {props.children}
        </div>
    )
}