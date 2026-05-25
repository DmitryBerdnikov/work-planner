import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AuthPage } from "./index";

const mocks = vi.hoisted(() => ({
  fetchSession: vi.fn(),
  navigate: vi.fn(),
  signInEmail: vi.fn(),
  signUpEmail: vi.fn()
}));

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual<typeof import("@tanstack/react-router")>("@tanstack/react-router");

  return {
    ...actual,
    useNavigate: () => mocks.navigate
  };
});

vi.mock("@shared/auth/auth-client", () => ({
  authClient: {
    signIn: {
      email: mocks.signInEmail
    },
    signUp: {
      email: mocks.signUpEmail
    }
  }
}));

vi.mock("@shared/api/generated/work-planner-api", () => ({
  fetchSession: mocks.fetchSession
}));

describe("AuthPage", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders login mode by default", () => {
    render(<AuthPage />);

    expect(screen.getByRole("heading", { name: "Вход в Work Planner" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Войти" })).toBeInTheDocument();
  });

  it("registers with email and password and redirects to pending", async () => {
    mocks.signUpEmail.mockResolvedValue({ data: {}, error: null });

    render(<AuthPage />);

    fireEvent.click(screen.getByRole("button", { name: "Регистрация" }));
    fillCredentials("new-user@example.com", "password123");
    fireEvent.click(screen.getByRole("button", { name: "Зарегистрироваться" }));

    await waitFor(() => {
      expect(mocks.signUpEmail).toHaveBeenCalledWith({
        email: "new-user@example.com",
        password: "password123",
        name: "new-user@example.com"
      });
    });
    expect(mocks.navigate).toHaveBeenCalledWith({ to: "/pending" });
  });

  it("logs in active users and redirects to dashboard", async () => {
    mocks.signInEmail.mockResolvedValue({ data: {}, error: null });
    mocks.fetchSession.mockResolvedValue(sessionWithStatus("active"));

    render(<AuthPage />);

    fillCredentials("active@example.com", "password123");
    fireEvent.click(screen.getByRole("button", { name: "Войти" }));

    await waitFor(() => {
      expect(mocks.signInEmail).toHaveBeenCalledWith({
        email: "active@example.com",
        password: "password123"
      });
    });
    expect(mocks.fetchSession).toHaveBeenCalledTimes(1);
    expect(mocks.navigate).toHaveBeenCalledWith({ to: "/" });
  });

  it("logs in pending users and redirects to pending", async () => {
    mocks.signInEmail.mockResolvedValue({ data: {}, error: null });
    mocks.fetchSession.mockResolvedValue(sessionWithStatus("pending"));

    render(<AuthPage />);

    fillCredentials("pending@example.com", "password123");
    fireEvent.click(screen.getByRole("button", { name: "Войти" }));

    await waitFor(() => {
      expect(mocks.navigate).toHaveBeenCalledWith({ to: "/pending" });
    });
  });

  it("shows auth errors from Better Auth", async () => {
    mocks.signInEmail.mockResolvedValue({
      data: null,
      error: {
        message: "Неверный email или пароль"
      }
    });

    render(<AuthPage />);

    fillCredentials("wrong@example.com", "password123");
    fireEvent.click(screen.getByRole("button", { name: "Войти" }));

    expect(await screen.findByText("Неверный email или пароль")).toBeInTheDocument();
    expect(mocks.navigate).not.toHaveBeenCalled();
  });
});

function fillCredentials(email: string, password: string) {
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: email } });
  fireEvent.change(screen.getByLabelText("Пароль"), { target: { value: password } });
}

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
