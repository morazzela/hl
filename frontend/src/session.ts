import { useSession } from "vinxi/http";

export async function getSession() {
    return useSession({
        password: String(import.meta.env.VITE_SESSION_SECRET)
    })
}