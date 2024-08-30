export default function PageContent(props: any) {
    return (
        <div class="h-[calc(100%-4rem)] overflow-y-auto p-4">
            {props.children}
        </div>
    )
}