import { useClientDB, Client } from "@/db/client.ts";
import { Hono } from "@kyiro/hono";
import { streamSSE } from "@kyiro/hono/streaming";

const app = new Hono()
export {
  app as clientRoutes
};

app.get('listen', async (c) => {
  const id = c.req.query('id') as string
  const type = c.req.query('type') as string
  const username = c.req.query('username') as string 
  
  const clientDb = useClientDB()
  // @ts-ignore Context not correct
  const sseConnection = streamSSE(c, async (stream) => {
    let client: Deno.KvEntryMaybe<Client> | null = null
    if (id) {
      client = await clientDb.getClient(id, type)
    }

    if(!id || client == null || client == undefined || client.value == null) {
      const newClient = await clientDb.createClient(username, type)
      await clientDb.registerClient(newClient)
      client = await clientDb.getClient(newClient.id)
      await stream.writeSSE({
        data: JSON.stringify(newClient),
        event: 'register',
      })
    }
    if (client == null || !client.value || client.value == undefined) {
      return
    }

    const clientId = client.value.id
    clientDb.saveSSEConnection(clientId, stream)
    stream.onAbort(() => {
      console.log(`client ${clientId} disconnected`)
      clientDb.removeSSEConnection(clientId)
    })
    while (true) {
      await stream.writeSSE({
        data: JSON.stringify({ client }),
        event: 'heartbeat',
      })
      // clientDb.refreshSSEConnection(clientId, stream) //NOTE - refreshing connection has some issues
      await stream.sleep(5000)
    }
  })
  return sseConnection
})