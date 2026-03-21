import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Auth from "./Auth";

// Mock auth
const mockUseAuth = vi.fn();
vi.mock("@/lib/auth", () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock supabase
const mockSignUp = vi.fn();
const mockSignIn = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      signUp: (...args: any[]) => mockSignUp(...args),
      signInWithPassword: (...args: any[]) => mockSignIn(...args),
    },
  },
}));

vi.mock("@/hooks/use-toast", () => ({
  toast: vi.fn(),
}));

function renderAuth() {
  return render(
    <MemoryRouter initialEntries={["/auth"]}>
      <Auth />
    </MemoryRouter>
  );
}

describe("Auth Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ session: null, loading: false });
    mockSignIn.mockResolvedValue({ error: null });
    mockSignUp.mockResolvedValue({ error: null });
  });

  // Happy path
  it("renders sign-in form with email, password, and submit button", () => {
    renderAuth();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("toggles to sign-up and shows name field", () => {
    renderAuth();
    fireEvent.click(screen.getByText(/need an account/i));
    expect(screen.getByLabelText(/your name/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
  });

  it("shows loading state", () => {
    mockUseAuth.mockReturnValue({ session: null, loading: true });
    renderAuth();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  // Negative: error from sign-in
  it("shows error toast on sign-in failure", async () => {
    const { toast } = await import("@/hooks/use-toast");
    mockSignIn.mockResolvedValue({ error: { message: "Invalid credentials" } });
    renderAuth();
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "a@b.com" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "wrongpass" } });
    fireEvent.submit(screen.getByRole("button", { name: /sign in/i }));
    await vi.waitFor(() => {
      expect(toast).toHaveBeenCalledWith(expect.objectContaining({ variant: "destructive" }));
    });
  });

  // Negative: error from sign-up
  it("shows error toast on sign-up failure", async () => {
    const { toast } = await import("@/hooks/use-toast");
    mockSignUp.mockResolvedValue({ error: { message: "User already registered" } });
    renderAuth();
    fireEvent.click(screen.getByText(/need an account/i));
    fireEvent.change(screen.getByLabelText(/your name/i), { target: { value: "Test" } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "a@b.com" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "password123" } });
    fireEvent.submit(screen.getByRole("button", { name: /create account/i }));
    await vi.waitFor(() => {
      expect(toast).toHaveBeenCalledWith(expect.objectContaining({ variant: "destructive" }));
    });
  });

  // Negative: submit button disabled during submission
  it("disables submit button while submitting", async () => {
    // Make signIn hang
    mockSignIn.mockReturnValue(new Promise(() => {}));
    renderAuth();
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "a@b.com" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "password" } });
    fireEvent.submit(screen.getByRole("button", { name: /sign in/i }));
    await vi.waitFor(() => {
      expect(screen.getByRole("button", { name: /please wait/i })).toBeDisabled();
    });
  });

  // Negative: password min length enforced by HTML
  it("requires minimum 6 character password via HTML attribute", () => {
    renderAuth();
    const pw = screen.getByLabelText(/password/i);
    expect(pw).toHaveAttribute("minLength", "8");
  });

  // Negative: email required via HTML
  it("email input has required attribute", () => {
    renderAuth();
    expect(screen.getByLabelText(/email/i)).toBeRequired();
  });
});
