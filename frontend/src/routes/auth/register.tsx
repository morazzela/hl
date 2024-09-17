import crypto from "crypto"
import { action, useNavigate } from "@solidjs/router"
import { getUserModel } from "../../../../shared/src/database";
import { User } from "../../../../shared/src/types";
import { getSession } from "~/session";

async function register(data: FormData): Promise<null|User> {
    "use server";

    const email = data.get('email')
    const password = data.get('password')
    const passwordConfirmation = data.get('password-confirmation')

    if (!email || !password || !passwordConfirmation) {
        return null
    }

    if (password !== passwordConfirmation) {
        return null
    }

    const count = await getUserModel().countDocuments().where({
        email: email
    })

    if (count > 0) {
        return null
    }

    const user = await getUserModel().create({
        email: email,
        password: crypto.createHash('sha256').update(password.toString()).digest('hex'),
        verified: false
    })

    const session = await getSession()
    await session.update(data => ({ ...data, userId: user?._id.toHexString() }))

    return user.toJSON({ flattenObjectIds: true })
}

export default function Register() {
    const navigate = useNavigate()

    const onSubmit = action(async (data: FormData) => {
        const user = await register(data)
        
        if (user === null) {
            alert('error')
            return
        }
        
        navigate('/verify')
    })
    
    return (
        <div class="w-full sm:w-2/3 md:w-1/2 xl:w-1/4 2xl:w-1/5 flex flex-col items-center">
            <div class="card card-body">
                <h1 class="font-display font-bold text-3xl mb-4">Register</h1>
                <form method="post" action={onSubmit}>
                    <div class="form-group">
                        <input name="email" type="text" placeholder="E-Mail Address" class="form-control" />
                    </div>
                    <div class="form-group">
                        <input name="password" type="password" placeholder="Password" class="form-control" />
                    </div>
                    <div class="form-group">
                        <input name="password-confirmation" type="password" placeholder="Confirm Password" class="form-control" />
                    </div>
                    <div class="mt-4 flex justify-end">
                        <button class="btn btn-primary">Register</button>
                    </div>
                </form>
            </div>
            <a href="/login" class="block mt-2 text-gray-500 hover:underline">Already registered?</a>
        </div>
    )
}