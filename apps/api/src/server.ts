import { serve } from "@hono/node-server";
import { app } from "./app.js";
import { env } from "./config/env.js";

serve(
  {
    fetch: app.fetch,
    hostname: env.API_HOST,
    port: env.API_PORT
  },
  (info) => {
    console.log(`Work Planner API listening on http://localhost:${info.port}`);
  }
);
