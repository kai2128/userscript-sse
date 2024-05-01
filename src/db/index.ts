import { keys } from "jsr:@kitsonk/kv-toolbox@^0.12.0/keys";
import { ms } from "https://raw.githubusercontent.com/denolib/ms/master/ms.ts";
import { get, remove, set } from "jsr:@kitsonk/kv-toolbox/blob";

export const kv = await Deno.openKv()

export function createKvMap<T>(prefixKey: string, ttl = Number(ms('30m'))) { // default expire time is 30 minutes
  return {
    async set(key: string, value: any, expireIn = -1) {
      if (expireIn === -1) {
        expireIn = ttl
      }
      if (typeof value === 'object') {
        value = JSON.stringify(value)
      }
      await set(kv, [prefixKey, key], new TextEncoder().encode(value), { expireIn })
    },
    async delete(key: string) {
      await remove(kv, [prefixKey, key])
    },
    async has(key: string) {
      const data = await this.get(key)
      return await data !== null
    },
    async get(key: string): Promise<T | null> {
      const data = await get(kv, [prefixKey, key])
      // convert unit8Array to string
      if (data) {
        const res = new TextDecoder().decode(data)
        try {
          return JSON.parse(res)
        } catch {
          return res as T
        }
      }
      return null
    },
    async lists(limit = 100) {
      return await keys(kv, { prefix: [prefixKey] }, { limit })
    },
    async entries(limit = 100): Promise<{ key: string, value: T | null }[]> {
      const entries = await this.lists(limit)
      const result: { key: string, value: T | null }[] = []
      const keySet = new Set<string>()
      for (const key of entries) {
        keySet.add(key[1] as string)
      }
      for (const key of keySet) {
        const value = await this.get(key as string)
        result.push({ key, value })
      }
      return result
    },
    async clear() {
      const entries = await kv.list({ prefix: [prefixKey] })
      for await (const { key } of entries) {
        await kv.delete(key)
      }
    }
  }
}