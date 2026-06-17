import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Database from "better-sqlite3";
import { afterEach, describe, expect, it } from "vitest";
import { migrateDatabase } from "./migrate.js";

const tempDirs: string[] = [];

describe("migrateDatabase", () => {
  afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
      rmSync(dir, { force: true, recursive: true });
    }
  });

  it("applies bundled migrations to the selected SQLite file", async () => {
    const dir = mkdtempSync(join(tmpdir(), "work-planner-migrate-"));
    tempDirs.push(dir);
    const databasePath = join(dir, "app.sqlite");

    await migrateDatabase(databasePath);

    expect(existsSync(databasePath)).toBe(true);

    const sqlite = new Database(databasePath);
    try {
      const tableNames = sqlite
        .prepare("select name from sqlite_master where type = 'table' order by name")
        .all()
        .map((row) => (row as { name: string }).name);

      expect(tableNames).toEqual(
        expect.arrayContaining([
          "account",
          "appointments",
          "clients",
          "profiles",
          "session",
          "user",
          "verification"
        ])
      );
    } finally {
      sqlite.close();
    }
  });
});
