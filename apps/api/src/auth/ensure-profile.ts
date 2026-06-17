import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { profiles } from "../db/schema.js";

export async function ensureProfileForUser(userId: string, email: string) {
  const existing = await db.query.profiles.findFirst({
    where: eq(profiles.userId, userId)
  });

  if (existing) {
    return existing;
  }

  const now = new Date().toISOString();

  await db.insert(profiles).values({
    userId,
    email,
    status: "pending",
    activatedAt: null,
    createdAt: now,
    updatedAt: now
  });

  const created = await db.query.profiles.findFirst({
    where: eq(profiles.userId, userId)
  });

  if (!created) {
    throw new Error("Failed to create profile");
  }

  return created;
}
