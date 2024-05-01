import { loadSync } from "@std/dotenv";

export const serverConfig = {
  PORT: 8902,
  LOCAL_IP: 'localhost',
  VERBOSE: 0,
}

export async function initConfig() {
  const env = loadSync({
    allowEmptyValues: true,
  });
  serverConfig.PORT = Number(env["PORT"]) || 8902
  serverConfig.VERBOSE = Number(env["VERBOSE"]) || 0
  console.log(await printServerConfig())
}

export const printServerConfig = () => {
  return `Server Running on: ${serverConfig.LOCAL_IP}:${serverConfig.PORT}`
}

