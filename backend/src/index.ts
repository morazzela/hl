import path from "path"
import dotenv from "dotenv"
import runUpdater from "./updater"
import { connect } from "../../shared/src/database"

dotenv.config({
    path: path.resolve(__dirname, "../../.env")
})

;(async () => {
    await connect(String(process.env.VITE_MONGO_URI), String(process.env.VITE_MONGO_DB))
    
    runUpdater()
})()
