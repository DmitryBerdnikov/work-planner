import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import { getMigrations } from "better-auth/db/migration";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { createAuth } from "../auth/auth.js";
import { env } from "../config/env.js";

const moduleDir = dirname(fileURLToPath(import.meta.url));
const migrationsFolder = resolve(moduleDir, "../../drizzle");

export async function migrateDatabase(databasePath = env.DATABASE_PATH) {
  mkdirSync(dirname(databasePath), { recursive: true });

  const sqlite = new Database(databasePath);
  try {
    sqlite.pragma("journal_mode = WAL");
    sqlite.pragma("foreign_keys = ON");
    const authMigrations = await getMigrations(createAuth(sqlite).options);
    await authMigrations.runMigrations();
    migrate(drizzle(sqlite), { migrationsFolder });
  } finally {
    sqlite.close();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await migrateDatabase();
}
