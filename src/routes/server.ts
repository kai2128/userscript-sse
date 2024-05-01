import { printServerConfig } from "@/config.ts";
import { Hono } from "@kyiro/hono";
import { useClientDB } from '@/db/client.ts';
import { exampleKvData } from "@/routes/example.ts";

const app = new Hono()
export {
  app as serverRoutes
};

app.get('status', async (c) => {
  const clientDb = useClientDB()
  const clients = await clientDb.getAvailableClientsList()
  return c.json({
    serverConfig: await printServerConfig(),
    clients,
    sseConnectionMap: Array.from(clientDb.sseConnectionMap.entries()),

    // add more kv data here
    exampleKvData: Array.from(await exampleKvData.entries())
  })
})

app.on(["DELETE", "GET"], "reset-clients", async (c) => {
  const clientDb = useClientDB()

  clientDb.sseConnectionMap.clear()
  clientDb.resetClients()

  // add more kv data here
  await exampleKvData.clear()

  return c.json({ code: 1 })
})