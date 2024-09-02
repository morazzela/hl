import { createContext, createResource, useContext } from "solid-js";
import { getFavoriteModel } from "../../../shared/src/database";
import { getUser } from "~/domains/auth";

type ContextType = {
    isFavorite: { (walletId: string): boolean },
    toggleFavorite: { (walletId: string): void }
}

const Context = createContext<ContextType>()

async function fetchFavorites(): Promise<string[]> {
    "use server";

    const user = await getUser()

    if ( ! user) {
        return []
    }

    const favorites = await getFavoriteModel()
        .find()
        .where({ user: user._id })
        .populate('wallet')

    return favorites.map(f => String(f.wallet._id?.toString()))
}

async function toggleFavoriteBack(walletId: string): Promise<boolean> {
    "use server";

    const user = await getUser()

    if (user === null) {
        return false
    }

    const exists = await getFavoriteModel().countDocuments().where({ wallet: walletId, user: user._id })

    if (exists > 0) {
        await getFavoriteModel().deleteOne({ wallet: walletId, user: user._id })
        return false
    }

    await getFavoriteModel().create({
        wallet: walletId,
        user: user?._id
    })

    return true
}

export function FavoritesProvider (props: any) {
    const [favorites, { mutate }] = createResource(fetchFavorites, { initialValue: [] })

    const isFavorite = (walletId: string) => {
        return favorites().findIndex(f => f === walletId) !== -1
    }

    const toggleFavorite = async (walletId: string) => {
        const res = await toggleFavoriteBack(walletId)

        mutate(prev => {
            if (res) {
                prev.push(walletId)
            } else {
                const index = prev.findIndex(f => f === walletId)

                if (index !== -1) {
                    prev.splice(index, 1)
                }
            }

            return [ ...prev ]
        })
    }
    
    return (
        <Context.Provider value={{ isFavorite, toggleFavorite }}>
            {props.children}
        </Context.Provider>
    )
}

export function useFavorites() {
    return useContext(Context) as ContextType
}
