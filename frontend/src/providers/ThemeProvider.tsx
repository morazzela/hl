import { Accessor, createContext, createEffect, createSignal, onMount, Setter, useContext } from "solid-js";

type ContextType = {
    isDark: Accessor<boolean>
    setIsDark: Setter<boolean>
}

const Context = createContext<ContextType>()

export function ThemeProvider(props: any) {
    const [storage, setStorage] = createSignal<Storage>()
    const [isDark, setIsDark] = createSignal(false)

    onMount(() => {
        setStorage(localStorage)
        setIsDark(localStorage.getItem("dark") === "1")
    })
    
    createEffect(() => {
        if (isDark()) {
            document.body.classList.add("dark")
        } else {
            document.body.classList.remove("dark")
        }

        storage()?.setItem("dark", isDark() ? "1" : "0")
    })
    
    return (
        <Context.Provider value={{ isDark, setIsDark }}>
            {props.children}
        </Context.Provider>
    )
}

export function useTheme() {
    return useContext(Context) as ContextType
}