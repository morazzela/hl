import { Accessor, createContext, createSignal, Setter, useContext } from "solid-js";

type ContextType = {
    isOpen: Accessor<boolean>
    setIsOpen: Setter<boolean>
}

const Context = createContext<ContextType>()

export function SidebarProvider(props: any) {
    const [isOpen, setIsOpen] = createSignal(true)
    
    return (
        <Context.Provider value={{ isOpen, setIsOpen }}>
            {props.children}
        </Context.Provider>
    )
}

export function useSidebar() {
    return useContext(Context) as ContextType
}