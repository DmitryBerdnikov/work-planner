import { redirect } from "@tanstack/react-router";
import { fetchSession, type SessionResponse } from "@shared/api/generated/work-planner-api";
import { ApiError } from "@shared/api/http";

export const requireActiveProfile = async (): Promise<SessionResponse> => {
  const session = await loadSession();

  if (session.profile.status === "pending" || session.profile.status === "blocked") {
    throw redirect({ to: "/pending" });
  }

  return session;
};

export const redirectAuthenticatedFromAuth = async () => {
  try {
    const session = await fetchSession();

    if (session.profile.status === "active") {
      throw redirect({ to: "/" });
    }

    throw redirect({ to: "/pending" });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return;
    }

    throw error;
  }
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
      throw redirect({ to: "/auth" });
    }

    throw error;
  }
};

const loadSession = async (): Promise<SessionResponse> => {
  try {
    return await fetchSession();
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      throw redirect({ to: "/auth" });
    }

    throw error;
  }
};
