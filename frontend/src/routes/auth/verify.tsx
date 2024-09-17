import { action, useNavigate } from "@solidjs/router"
import { Suspense } from "solid-js";
import Loader from "~/components/Loader/Loader";
import { useUser } from "~/domains/auth";
import { getUserModel } from "../../../../shared/src/database";

async function verify(data: FormData): Promise<boolean> {
    "use server";

    const id = data.get('id')
    const code = data.get('code')

    if (!id || !code) {
        return false
    }

    await getUserModel().updateOne({ _id: id }, { $set: { verified: true } })

    return true
}

export default function Verify() {
    const navigate = useNavigate()
    const { user } = useUser()

    const onSubmit = action(async (data: FormData) => {
        const res = await verify(data)

        if (res !== true) {
            alert('error')
            return
        }

        navigate('/')
    }, "verify")
    
    return (
        <div class="w-1/5">
            <div class="card card-body">
                <Suspense fallback={<Loader text="Loading..."/>}>
                    <h1 class="font-display font-bold text-3xl mb-4">Verify</h1>
                    <form method="post" action={onSubmit}>
                        <input name="id" type="hidden" value={String(user()?._id)}/>
                        <div class="form-group">
                            <input value={String(user()?.email)} disabled type="text" class="form-control" />
                        </div>
                        <div class="form-group">
                            <input name="code" value="" type="text" placeholder="Verification Code" class="form-control" />
                        </div>
                        <div class="mt-4 flex justify-end gap-2">
                            <button type="button" class="btn">Send Verification Code</button>
                            <button class="btn btn-primary">Verify</button>
                        </div>
                </form>
                </Suspense>
            </div>
        </div>
    )
}