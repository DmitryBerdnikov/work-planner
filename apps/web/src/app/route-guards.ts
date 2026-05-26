import { redirect } from "@tanstack/react-router";
import { fetchSession, type SessionResponse } from "@shared/api/generated/work-planner-api";
import { ApiError } from "@shared/api/http";

const activeSessionStorageKey = "work-planner:last-active-session";

export const requireActiveProfile = async (): Promise<SessionResponse> => {
  const session = await loadSession({ allowOfflineActiveFallback: true });

  if (session.profile.status === "pending" || session.profile.status === "blocked") {
    clearActiveSession();
    throw redirect({ to: "/pending" });
  }

  writeActiveSession(session);
  return session;
};

export const requirePendingProfile = async (): Promise<SessionResponse> => {
  const session = await loadSession();

  if (session.profile.status === "active") {
    throw redirect({ to: "/" });
  }

  return session;
};

export const redirectUnauthorized = async <T>(request: Promise<T>): Promise<T> => {
  try {
    return await request;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      clearActiveSession();
      throw redirect({ to: "/auth" });
    }

    throw error;
  }
};

const loadSession = async (options: { allowOfflineActiveFallback?: boolean } = {}): Promise<SessionResponse> => {
  try {
    return await fetchSession();
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      throw redirect({ to: "/auth" });
    }

    if (options.allowOfflineActiveFallback && isOfflineError(error)) {
      const cachedSession = readActiveSession();

      if (cachedSession) {
        return cachedSession;
      }
    }

    throw error;
  }
};

function isOfflineError(error: unknown): boolean {
  return !(error instanceof ApiError) && globalThis.navigator?.onLine === false;
}

function readActiveSession(): SessionResponse | null {
  try {
    const storedSession = globalThis.localStorage?.getItem(activeSessionStorageKey);
    return storedSession ? JSON.parse(storedSession) as SessionResponse : null;
  } catch {
    return null;
  }
}

function writeActiveSession(session: SessionResponse): void {
  try {
    globalThis.localStorage?.setItem(activeSessionStorageKey, JSON.stringify(session));
  } catch {
    // Offline local-first routes should still render if storage is unavailable.
  }
}

function clearActiveSession(): void {
  try {
    globalThis.localStorage?.removeItem(activeSessionStorageKey);
  } catch {
    // Auth fallback cache is best-effort only.
  }
}
