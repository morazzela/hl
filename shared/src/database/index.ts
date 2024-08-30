import mongoose from "mongoose"

export * from "./schemas"

export async function connect(uri: string, dbName: string): Promise<mongoose.Mongoose> {
    return await mongoose.connect(uri, { dbName })
}