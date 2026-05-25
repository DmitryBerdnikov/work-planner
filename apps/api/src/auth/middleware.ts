import type { MiddlewareHandler } from "hono";
import { eq } from "drizzle-orm";
import { env } from "../config/env";
import { db } from "../db/client";
import { profiles } from "../db/schema";
import { auth, type AuthSession } from "./auth";

type Variables = {
  user: AuthSession["user"] | null;
  session: AuthSession["session"] | null;
};

export type AppBindings = {
  Variables: Variables;
};

export const attachSession: MiddlewareHandler<AppBindings> = async (c, next) => {
  if (env.NODE_ENV === "test") {
    const testUserId = c.req.header("x-test-user-id");
    const testUserEmail = c.req.header("x-test-user-email") ?? "test@example.com";

    if (testUserId) {
      c.set("user", {
        id: testUserId,
        email: testUserEmail,
        name: testUserEmail,
        image: null,
        emailVerified: false,
        createdAt: new Date(0),
        updatedAt: new Date(0)
      });
      c.set("session", null);
      await next();
      return;
    }
  }

  if (!c.req.header("cookie") && !c.req.header("authorization")) {
    c.set("user", null);
    c.set("session", null);
    await next();
    return;
  }

  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  c.set("user", session?.user ?? null);
  c.set("session", session?.session ?? null);

  await next();
};

export const requireActiveProfile: MiddlewareHandler<AppBindings> = async (c, next) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "unauthorized" }, 401);
  }

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, user.id)
  });

  if (!profile || profile.status !== "active") {
    return c.json({ error: "account_not_active" }, 403);
  }

  await next();
};
