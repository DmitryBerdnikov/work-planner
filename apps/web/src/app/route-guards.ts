import { redirect } from "@tanstack/react-router";
import { fetchCurrentUser } from "@shared/api/generated/work-planner-api";
import { ApiError } from "@shared/api/http";

export const requireActiveProfile = async () => {
  await redirectUnauthorized(fetchCurrentUser());
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
