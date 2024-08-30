import resolveConfig from "tailwindcss/resolveConfig";
import tailwindConfig from "../tailwind.config.cjs";

const config = resolveConfig(tailwindConfig)

export default config.theme