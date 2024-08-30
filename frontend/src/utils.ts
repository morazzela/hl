import theme from "./tailwind";

export function getExchangeLogo(exchange: string) {
    return "/assets/" + exchange + ".svg";
}

export function debounce(callback: Function, ms: number = 250) {
    let timer: ReturnType<typeof setTimeout>

    return function (this: any, ...args: any[]) {
        clearTimeout(timer)
        timer = setTimeout(() => callback.apply(this, args), ms)
    }
}

export function getColor(name: string, level: number = 500): string {
    if (typeof theme.colors[name] !== "object") {
        return theme.colors[name]
    }
    
    return theme.colors[name][level]
}