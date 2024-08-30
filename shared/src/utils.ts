import exchanges from "./exchanges"
import IExchange from "./interfaces/Exchange"

export async function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

export function formatNumber(val: any, decimals: number = 2, isCurrency: boolean = false, withSign: boolean = false): string {
    const options: Intl.NumberFormatOptions = {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }

    if (isCurrency) {
        options.style = "currency"
        options.currency = "USD"
    }

    return (withSign && val > 0 ? "+" : "") + new Intl.NumberFormat("en-US", options).format(val)
}

export function shortenAddress(address: string): string {
    return address.substring(2, 6) + ".." + address.substring(38)
}

export function exchangeByKey(key: string): IExchange|undefined {
    return exchanges.find(e => e.getKey() === key) as IExchange
}