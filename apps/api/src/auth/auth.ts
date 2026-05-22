import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import Database from "better-sqlite3";
import { betterAuth } from "better-auth";
import { env } from "../config/env.js";

mkdirSync(dirname(env.DATABASE_PATH), { recursive: true });

export const auth = betterAuth({
  baseURL: env.API_BASE_URL,
  secret: env.AUTH_SECRET,
  database: new Database(env.DATABASE_PATH),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false
  },
  trustedOrigins: [env.WEB_ORIGIN]
});

export type AuthSession = typeof auth.$Infer.Session;
