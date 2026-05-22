import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { DashboardPage } from "./dashboard-page.js";

describe("DashboardPage", () => {
  it("renders the primary dashboard headings", () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <DashboardPage />
      </QueryClientProvider>
    );

    expect(screen.getByText("План записей и личного времени")).toBeInTheDocument();
    expect(screen.getByText("Зарплата за месяц")).toBeInTheDocument();
  });
});

