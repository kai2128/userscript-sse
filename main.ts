import { initConfig } from "@/config.ts";
import { startServer } from "@/routes/index.ts"

await initConfig()
startServer()