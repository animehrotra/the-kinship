import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import People from "./People";
import { contacts } from "@/test/fixtures";

const mockUseContacts = vi.fn();
const mockCreateContact = { mutateAsync: vi.fn(), isPending: false };
const mockLogCompletedConnection = { mutateAsync: vi.fn().mockResolvedValue(undefined), isPending: false };

vi.mock("@/lib/hooks", () => ({
  useContacts: () => mockUseContacts(),
  useCreateContact: () => mockCreateContact,
  useAllContactTags: () => ({ data: {} }),
  useDeleteContact: () => ({ mutateAsync: vi.fn(), isPending: false }),
  getContactStatus: () => "on-track",
  useAddContactTag: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useCreateLifeEvent: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useTags: () => ({ data: [] }),
  useLogInteraction: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useLogCompletedConnection: () => mockLogCompletedConnection,
}));

vi.mock("@/lib/auth", () => ({
  useAuth: () => ({ user: { id: "user-1" }, session: {}, loading: false }),
}));

function renderPeople() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <People />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("People Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseContacts.mockReturnValue({ data: contacts, isLoading: false });
  });

  // Happy path: renders contacts
  it("renders contact names and circle badges", () => {
    renderPeople();
    expect(screen.getByText("Alice Johnson")).toBeInTheDocument();
    expect(screen.getByText("Bob Smith")).toBeInTheDocument();
    expect(screen.getByText("Carol Davis")).toBeInTheDocument();
  });

  it("logs a backdated connection for a non-overdue person and keeps all people visible", async () => {
    renderPeople();
    const bob = screen.getByText("Bob Smith").closest(".cursor-pointer");
    expect(bob).not.toBeNull();
    fireEvent.click(bob!.querySelector('[title="Log connection"]')!);
    fireEvent.change(screen.getByLabelText("When did this happen?"), { target: { value: "2025-01-15" } });
    fireEvent.click(screen.getByRole("button", { name: "Called" }));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(mockLogCompletedConnection.mutateAsync).toHaveBeenCalledWith({
      contactId: "c2",
      type: "called",
      notes: undefined,
      interactionDate: new Date("2025-01-15T12:00:00"),
    }));
    expect(screen.getByText("Alice Johnson")).toBeInTheDocument();
    expect(screen.getByText("Bob Smith")).toBeInTheDocument();
    expect(screen.getByText("Carol Davis")).toBeInTheDocument();
  });

  // Happy path: search
  it("filters contacts by search text", () => {
    renderPeople();
    fireEvent.change(screen.getByPlaceholderText(/search people/i), { target: { value: "alice" } });
    expect(screen.getByText("Alice Johnson")).toBeInTheDocument();
    expect(screen.queryByText("Bob Smith")).not.toBeInTheDocument();
  });

  // Happy path: has add button
  it("renders Add someone button", () => {
    renderPeople();
    expect(screen.getByText(/add someone/i)).toBeInTheDocument();
  });

  // Happy path: loading
  it("shows skeleton placeholders while loading", () => {
    mockUseContacts.mockReturnValue({ data: [], isLoading: true });
    const { container } = renderPeople();
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });

  // Negative: no matches
  it("shows 'No matches found' when search yields nothing", () => {
    renderPeople();
    fireEvent.change(screen.getByPlaceholderText(/search people/i), { target: { value: "zzzzz" } });
    expect(screen.getByText(/no matches found/i)).toBeInTheDocument();
  });

  // Negative: empty contact list
  it("shows empty state when no contacts exist", () => {
    mockUseContacts.mockReturnValue({ data: [], isLoading: false });
    renderPeople();
    expect(screen.getByText(/no contacts yet/i)).toBeInTheDocument();
  });

  // Negative: special characters in search don't crash
  it("handles special characters in search without errors", () => {
    renderPeople();
    fireEvent.change(screen.getByPlaceholderText(/search people/i), { target: { value: ".*+?^${}()|[]" } });
    expect(screen.getByText(/no matches found/i)).toBeInTheDocument();
  });

  // Negative: contact with no last_interaction_at
  it("shows 'No interactions yet' for contacts without last_interaction_at", () => {
    renderPeople();
    // Carol Davis has null last_interaction_at
    expect(screen.getByText(/no connections yet/i)).toBeInTheDocument();
  });
});
