import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_ENV: z.enum(["development", "staging", "production", "test"]).default("development"),
  API_HOST: z.string().min(1).default("127.0.0.1"),
  API_PORT: z.coerce.number().int().positive().default(3000),
  API_BASE_URL: z.url().default("http://127.0.0.1:3000"),
  WEB_ORIGIN: z.url().default("http://127.0.0.1:5173"),
  DATABASE_PATH: z.string().min(1).default(".data/work-planner.sqlite"),
  AUTH_SECRET: z.string().min(32).default("development-secret-change-me-32-chars")
});

export function parseEnv(input: NodeJS.ProcessEnv) {
  return envSchema.parse(input);
}

export const env = parseEnv(process.env);
