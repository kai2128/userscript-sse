import { Hono } from "@kyiro/hono";
import { logger, cors } from "@kyiro/hono/middleware"
import { showRoutes } from '@kyiro/hono/dev'
import { serverConfig } from "@/config.ts"
import { exampleRoutes } from "./example.ts"
import { serverRoutes } from "./server.ts"
import { clientRoutes } from "./client.ts"

const app = new Hono();

export function startServer() {
  if (serverConfig.VERBOSE) {
    // @ts-ignore No overload for this call
    app.use('*', logger())
  }
  // @ts-ignore No overload
  app.use('*', cors())
  app.route("server", serverRoutes)
  app.route("client", clientRoutes)

  // add more data routes here
  app.route("example", exampleRoutes)

  // @ts-ignore path is not in the type definition
  showRoutes(app)
  Deno.serve({ port: serverConfig.PORT }, app.fetch);
}