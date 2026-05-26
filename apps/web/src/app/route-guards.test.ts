import { describe, expect, it, vi, afterEach } from "vitest";
import { ApiError } from "@shared/api/http";
import {
  redirectUnauthorized,
  requireActiveProfile,
  requirePendingProfile
} from "./route-guards";

const mocks = vi.hoisted(() => ({
  fetchSession: vi.fn()
}));

vi.mock("@tanstack/react-router", () => ({
  redirect: (options: { to: string }) => ({
    redirect: true,
    ...options
  })
}));

vi.mock("@shared/api/generated/work-planner-api", () => ({
  fetchSession: mocks.fetchSession
}));

describe("route guards", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("allows active users into protected routes", async () => {
    const session = sessionWithStatus("active");
    mocks.fetchSession.mockResolvedValue(session);

    await expect(requireActiveProfile()).resolves.toEqual(session);
  });

  it("redirects pending users from protected routes to pending page", async () => {
    mocks.fetchSession.mockResolvedValue(sessionWithStatus("pending"));

    await expect(requireActiveProfile()).rejects.toMatchObject({ to: "/pending" });
  });

  it("redirects unauthorized users from protected routes to auth page", async () => {
    mocks.fetchSession.mockRejectedValue(new ApiError(401, "unauthorized"));

    await expect(requireActiveProfile()).rejects.toMatchObject({ to: "/auth" });
  });

  it("uses the last active session for protected routes when offline", async () => {
    const session = sessionWithStatus("active");
    mocks.fetchSession.mockResolvedValueOnce(session);
    await expect(requireActiveProfile()).resolves.toEqual(session);

    vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    mocks.fetchSession.mockRejectedValueOnce(new TypeError("Failed to fetch"));

    await expect(requireActiveProfile()).resolves.toEqual(session);
  });

  it("does not allow offline protected routes without a cached active session", async () => {
    const offlineError = new TypeError("Failed to fetch");
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    mocks.fetchSession.mockRejectedValue(offlineError);

    await expect(requireActiveProfile()).rejects.toEqual(offlineError);
  });

  it("allows pending and blocked users on pending page", async () => {
    const pendingSession = sessionWithStatus("pending");
    mocks.fetchSession.mockResolvedValue(pendingSession);

    await expect(requirePendingProfile()).resolves.toEqual(pendingSession);

    const blockedSession = sessionWithStatus("blocked");
    mocks.fetchSession.mockResolvedValue(blockedSession);

    await expect(requirePendingProfile()).resolves.toEqual(blockedSession);
  });

  it("redirects active users away from pending page", async () => {
    mocks.fetchSession.mockResolvedValue(sessionWithStatus("active"));

    await expect(requirePendingProfile()).rejects.toMatchObject({ to: "/" });
  });

  it("redirects unauthorized requests to auth page", async () => {
    const request = Promise.reject(new ApiError(401, "unauthorized"));

    await expect(redirectUnauthorized(request)).rejects.toMatchObject({ to: "/auth" });
  });
});

function sessionWithStatus(status: "pending" | "active" | "blocked") {
  return {
    user: {
      id: "550e8400-e29b-41d4-a716-446655440000",
      email: `${status}@example.com`,
      name: `${status}@example.com`,
      image: null,
      emailVerified: false
    },
    profile: {
      status,
      activatedAt: status === "active" ? "2026-05-25T10:00:00.000Z" : null
    }
  };
}
