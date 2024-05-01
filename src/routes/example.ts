import { Hono } from "@kyiro/hono";
import { useClientDB } from "@/db/client.ts";
import { waitForKvMapItem } from "@/utils.ts";
import { WaitTimeoutError } from "@/utils.ts";
import { createKvMap } from "@/db/index.ts";
import { ms } from "https://raw.githubusercontent.com/denolib/ms/master/ms.ts";

const app = new Hono()
export {
  app as exampleRoutes
};

const kvData = createKvMap("example")
export const exampleKvData = kvData

/*
curl --request POST \
  --url http://localhost:8902/example/get-search \
  --data '{
	"query": "test",
	"shouldRefresh": 1
}'
*/
app.post('get-search', async (c) => {
  const { query, shouldRefresh } = await c.req.json()
  const clientDb = useClientDB()
  try {
    const details = await waitForKvMapItem(kvData, query, () => {
      console.log(`waiting for ${query} details...`)
      clientDb.sendEventToClientByType('example', false, {
        url: 'example/save-search', // callback url from the client to inform the server
        payload: { query } // the data to be sent to client
      })
    }, shouldRefresh == 1, Number(ms('1m'))) // wait for 1m before timeout, adjust as needed
    // the details is data retrieved from userscripts callback url
    return c.json(details)
  } catch (error) {
    if (error instanceof WaitTimeoutError) {
      console.error("wait timeout")
      return c.json({ code: 0, msg: "wait timeout" })
    } else
      console.error(error)
    return c.json({ code: -1, msg: "Error", error })
  }
})
app.post('save-search', async (c) => {
  const body = await c.req.json()
  kvData.set(body.query, body) // the key is the query and data to be saved is the body
  return c.json({ code: 1 })
})