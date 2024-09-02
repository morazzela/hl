import { getSession } from "~/session";
import { getUserModel } from "../../../shared/src/database";
import { redirect } from "@solidjs/router";
import { createResource } from "solid-js";

export async function getUser() {
    "use server";

    const session = await getSession()

    if ( ! session.data.userId) {
        return null
    }

    const user = await getUserModel().findById(session.data.userId).select({ password: 0 })

    return user ? user.toJSON({ flattenObjectIds: true }) : null
}

export function useUser() {
    const [user] = createResource(getUser)

    return { user }
}

export async function redirectIfGuest() {
    "use server";
    
    const user = await getUser()

    if (user === null || user.verified !== true) {
        throw redirect('/login')
    }
}

export async function logout() {
    "use server";

    const session = await getSession()
    await session.update(data => ({ ...data, userId: null }))
}