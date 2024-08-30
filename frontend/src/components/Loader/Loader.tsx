type Props = {
    text: string
}

export default function Loader({ text }: Props) {
    return (
        <div class="flex items-center justify-center p-4 leading-none">
            <div class="relative size-3 flex items-center justify-center">
                <div class="absolute size-3 bg-primary-500 rounded-full"></div>
                <div class="absolute size-3 bg-primary-500 rounded-full animate-ping"></div>
            </div>
            <span class="text-gray-800 dark:text-gray-200 font-mono text-xs md:text-sm ml-3">{text}</span>
        </div>
    )
}