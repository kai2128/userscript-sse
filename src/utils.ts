
import { createKvMap } from '@/db/index.ts';
import { ms } from "https://raw.githubusercontent.com/denolib/ms/master/ms.ts";

export class WaitTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WaitTimeoutError";
  }
}
export function waitForMapItem<T>(map: Map<string, T>, key: string, getItemFunc: () => void = () => { }, shouldRefresh = false, timeout = 20000): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    if (shouldRefresh) {
      map.delete(key)
    }
    if (!shouldRefresh && map.has(key)) {
      resolve(map.get(key));
      return
    }
    getItemFunc()
    const checkInterval = setInterval(() => {
      if (map.has(key)) {
        clearInterval(checkInterval);
        clearTimeout(failureTimeout);
        resolve(map.get(key));
      }
    }, 1000); // check every 1000ms

    const failureTimeout = setTimeout(() => {
      clearInterval(checkInterval);
      reject(new WaitTimeoutError(`Timeout waiting for item ${key}`));
    }, timeout);
  });
}
export function waitForKvMapItem<T>(map: ReturnType<typeof createKvMap>, key: string, getItemFunc: () => void = () => { }, shouldRefresh = false, timeout = Number(ms("30s"))) {
  return new Promise((resolve, reject) => {
    (async () => {
      try {
        if (shouldRefresh) {
          await map.delete(key)
        }
        if (!shouldRefresh && await map.has(key)) {
          resolve(await map.get(key));
          return
        }
        getItemFunc()
        const checkInterval = setInterval(async () => {
          if (await map.has(key)) {
            clearInterval(checkInterval);
            clearTimeout(failureTimeout);
            resolve(await map.get(key));
          }
        }, 1000); // check every 1000ms

        const failureTimeout = setTimeout(() => {
          clearInterval(checkInterval);
          reject(new WaitTimeoutError(`Timeout waiting for item ${key}`));
        }, timeout);
      } catch (err) {
        reject(err)
      }
    })()
  });
}