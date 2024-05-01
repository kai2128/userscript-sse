// import { Hono } from "@kyiro/hono";
// import { useClientDB } from "@/db/client.ts";
// import { waitForKvMapItem } from "@/utils.ts";
// import { WaitTimeoutError } from "@/utils.ts";
// import { createKvMap } from "@/db/index.ts";
// import { ms } from "https://raw.githubusercontent.com/denolib/ms/master/ms.ts";

// replace placeholder with <> with desired name
// const app = new Hono()
// export {
//   app as <TYPE>Routes
// };

// const kvData = createKvMap("<TYPE>")
// // export const <TYPE>DataMap = kvData

// app.post('get-<data>', async (c) => {
//   const { <payload> } = await c.req.json()
//   const clientDb = useClientDB()
//   try {
//     const details = await waitForKvMapItem(kvData, <KEY>, () => {
//       console.log(`waiting for ${<payload>} details...`)
//       clientDb.sendEventToClientByType('<TYPE>', false, {
//         url: 'example/save-<data>',
//         payload: { query }
//       })
//     }, shouldRefresh == 1, Number(ms('1m')))
//     return c.json(details)
//   } catch (error) {
//     if (error instanceof WaitTimeoutError) {
//       console.error("wait timeout")
//       return c.json({ code: 0, msg: "wait timeout" })
//     } else
//       console.error(error)
//     return c.json({ code: -1, msg: "Error", error })
//   }
// })
// app.post('save-<data>', async (c) => {
//   const body = await c.req.json()
//   kvData.set(body.<KEY>, body) // the key is the query and data to be saved is the body
//   return c.json({ code: 1 })
// })