import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { app } from "../app.js";

const outputPath = fileURLToPath(new URL("../../openapi.json", import.meta.url));
const response = await app.request("/api/openapi.json");

if (!response.ok) {
  throw new Error(`Failed to generate OpenAPI document: ${response.status}`);
}

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(await response.json(), null, 2)}\n`);
