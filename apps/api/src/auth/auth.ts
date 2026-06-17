import { betterAuth } from "better-auth";
import type Database from "better-sqlite3";
import { env } from "../config/env.js";
import { sqlite } from "../db/client.js";
import { ensureProfileForUser } from "./ensure-profile.js";

export function createAuth(database: Database.Database = sqlite) {
  return betterAuth({
    baseURL: env.API_BASE_URL,
    secret: env.AUTH_SECRET,
    database,
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false
    },
    trustedOrigins: [env.WEB_ORIGIN],
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            await ensureProfileForUser(user.id, user.email);
          }
        }
      }
    }
  });
}

export const auth = createAuth();

export type AuthSession = typeof auth.$Infer.Session;
