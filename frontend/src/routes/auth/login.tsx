import crypto from "crypto"
import { action, useNavigate } from "@solidjs/router"
import { getUserModel } from "../../../../shared/src/database";
import { User } from "../../../../shared/src/types";
import { getSession } from "~/session";

async function login(data: FormData): Promise<null|User> {
    "use server";

    const email = data.get('email')
    const password = data.get('password')

    if (!email || !password) {
        return null
    }

    const user = await getUserModel().findOne().where({
        email: email.toString().trim(),
        password: crypto.createHash('sha256').update(password.toString().trim()).digest('hex')
    }).select({ password: 0 })

    const session = await getSession()
    await session.update(data => ({ ...data, userId: user?._id.toHexString() }))

    return user ? user.toJSON({ flattenObjectIds: true }) : null
}

export default function Login() {
    const navigate = useNavigate()

    const onSubmit = action(async (data: FormData) => {
        const user = await login(data)
        
        if (user === null) {
            alert('error')
            return
        }

        if (user.verified) {
            navigate('/')
        } else {
            navigate('/verify')
        }
    }, "login")
    
    return (
        <div class="w-full sm:w-2/3 md:w-1/2 xl:w-1/4 2xl:w-1/5 flex items-center flex-col">
            <div class="card card-body">
                <h1 class="font-display font-bold text-3xl mb-4">Login</h1>
                <form method="post" action={onSubmit}>
                    <div class="form-group">
                        <input name="email" type="text" placeholder="E-Mail Address" class="form-control" />
                    </div>
                    <div class="form-group">
                        <input name="password" type="password" placeholder="Password" class="form-control" />
                    </div>
                    <div class="mt-4 flex justify-end">
                        <button class="btn btn-primary">Login</button>
                    </div>
                </form>
            </div>
            <a href="/register" class="block mt-2 text-gray-500 hover:underline">Not registered yet?</a>
        </div>
    )
}