import { config } from "../config.js";

export async function fetchHealth() {
  const response = await fetch(`${config.apiBaseUrl}/api/health`, {
    credentials: "include"
  });

  if (!response.ok) {
    throw new Error("Health request failed");
  }

  return response.json() as Promise<{ ok: boolean; environment: string; version: string }>;
}

