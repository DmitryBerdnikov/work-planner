import { betterAuth } from "better-auth";
import { env } from "../config/env";
import { sqlite } from "../db/client";
import { ensureProfileForUser } from "./ensure-profile";

export const auth = betterAuth({
  baseURL: env.API_BASE_URL,
  secret: env.AUTH_SECRET,
  database: sqlite,
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

export type AuthSession = typeof auth.$Infer.Session;
