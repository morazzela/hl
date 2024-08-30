type Props = {
    isBullish: boolean
    children: any
}

export default function Badge({ isBullish, children }: Props) {
    return (
        <span classList={{
            "font-mono text-xs rounded-md inline-block ring-1 ring-inset px-2 py-1 font-bold": true,
            "bg-bullish-50 text-bullish-700 ring-bullish-600/10 dark:bg-bullish-500/10 dark:text-bullish-400": isBullish,
            "bg-bearish-50 text-bearish-700 ring-bearish-600/10 dark:bg-bearish-500/10 dark:text-bearish-400": !isBullish
        }}>
            {children}
        </span>
    )
}