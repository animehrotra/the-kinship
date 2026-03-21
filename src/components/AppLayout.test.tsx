import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AppLayout } from "./AppLayout";

const mockUseAuth = vi.fn();
vi.mock("@/lib/auth", () => ({
  useAuth: () => mockUseAuth(),
}));

// Minimal sidebar mock to avoid complex UI deps
vi.mock("@/components/AppSidebar", () => ({
  AppSidebar: () => <div data-testid="sidebar">Sidebar</div>,
}));

vi.mock("@/components/MobileNav", () => ({
  MobileNav: () => <div data-testid="mobilenav">MobileNav</div>,
}));

function renderLayout() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<div>Home Content</div>} />
        </Route>
        <Route path="/auth" element={<div>Auth Page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("AppLayout", () => {
  it("redirects to /auth when no session", () => {
    mockUseAuth.mockReturnValue({ session: null, loading: false });
    renderLayout();
    expect(screen.getByText("Auth Page")).toBeInTheDocument();
    expect(screen.queryByText("Home Content")).not.toBeInTheDocument();
  });

  it("renders child content when authenticated", () => {
    mockUseAuth.mockReturnValue({ session: { user: { id: "1" } }, loading: false });
    renderLayout();
    expect(screen.getByText("Home Content")).toBeInTheDocument();
  });

  it("shows loading state", () => {
    mockUseAuth.mockReturnValue({ session: null, loading: true });
    renderLayout();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});
