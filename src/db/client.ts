import { SSEStreamingApi } from "@kyiro/hono/streaming";
import { kv } from "./index.ts"
import { serverConfig } from "@/config.ts";
import { ms } from "https://raw.githubusercontent.com/denolib/ms/master/ms.ts";

export interface Client {
  id: string;
  username: string;
  ip: string;
  type: ClientType | string;
}

export enum ClientType {
  // define client type here
  example = 'example',
}

const sseConnectionMap = new Map<string, SSEStreamingApi>()

export function useClientDB() {
  return {
    sseConnectionMap,
    async resetClients() {
      const entries = await kv.list<Client>({ prefix: ["client"] })
      for await (const { key } of entries) {
        await kv.delete(key)
      }
    },
    async registerClient(client: Client) {
      await kv.set(["client", client.id], client, { expireIn: Number(ms('1h')) })
    },
    createClient(username = "", type: ClientType | string): Client {
      return {
        id: crypto.randomUUID(),
        username: username,
        ip: serverConfig.LOCAL_IP,
        // status: ClientStatus.idle,
        type: type
      }
    },
    async getAvailableClientsList(type = "", isLoggedIn = false) {
      const entries = await kv.list<Client>({ prefix: ["client"] })
      let clients = []
      for await (const { value } of entries) {
        clients.push(value)
      }
      if (type !== "") {
        clients = clients.filter(client => client.type == type)
      }
      if (isLoggedIn) {
        clients = clients.filter(client => client.username != "guest")
      }
      // filter client that exists in sseConnectionMap
      return clients.filter(client => sseConnectionMap.has(client.id))
    },
    async getClient(id: string, type = "") {
      if (!id) {
        return null
      }
      if (type != "") {
        const client = await kv.get<Client>(["client", id])
        if (client?.value?.type == type) {
          return client
        }
        return null
      }
      return await kv.get<Client>(["client", id])
    },
    async refreshClient(id: string) {
      const client = await this.getClient(id)
      if (client?.value) {
        this.registerClient(client.value)
      }
    },
    refreshSSEConnection(id: string, refreshSSE: SSEStreamingApi) {
      if (sseConnectionMap.has(id)) {
        const clientSse = sseConnectionMap.get(id)
        this.refreshClient(id)
        if (clientSse != refreshSSE) {
          console.log(`client ${id} refreshed`)
          sseConnectionMap.set(id, refreshSSE)
        }
      }
    },
    saveSSEConnection(id: string, sse: SSEStreamingApi) {
      sseConnectionMap.set(id, sse)
      console.log(`client ${id} connected`)
    },
    removeSSEConnection(id: string) {
      sseConnectionMap.delete(id)
    },
    async sendEventToClientByType(type = "", isLoggedIn = false, data: any) {
      let clients = await this.getAvailableClientsList(type, isLoggedIn)
      while (clients.length === 0) {
        // Wait for 1 second before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log(`no available free client, waiting for ${type} client...`)
        clients = await this.getAvailableClientsList(type, isLoggedIn);
      }
      // shuffle clients
      clients.sort(() => Math.random() - 0.5)
      for (const client of clients) {
        try {
          sseConnectionMap.get(client.id)?.writeSSE({
            event: `client-${client.id}`,
            data: JSON.stringify(data)
          });
          // If the event is successfully sent, break the loop
          break;
        } catch (error) {
          console.log(error);
          sseConnectionMap.delete(client.id);
          await kv.delete(["client", client.id]);
          // If an error occurs, continue to the next client
        }
      }
    },
  }
}