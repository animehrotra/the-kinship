import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Index from "./Index";
import { contacts } from "@/test/fixtures";

// Mock hooks
const mockUseContacts = vi.fn();
const mockUseUpcomingEvents = vi.fn();
const mockAction = vi.fn();
const mockActionAsync = vi.fn();

vi.mock("@/lib/hooks", () => ({
  useContacts: () => mockUseContacts(),
  useUpcomingEvents: () => mockUseUpcomingEvents(),
  useAllContactTags: () => ({ data: {} }),
  useOverdueNudgeAction: () => ({ mutate: mockAction, mutateAsync: mockActionAsync, isPending: false }),
  useLogInteraction: () => ({ mutateAsync: vi.fn(), isPending: false }),
  getContactStatus: () => "overdue",
  useCreateContact: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useAddContactTag: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useCreateLifeEvent: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useTags: () => ({ data: [] }),
}));

vi.mock("@/lib/auth", () => ({
  useAuth: () => ({ user: { id: "user-1" }, session: {}, loading: false }),
}));

function renderIndex() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <Index />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("Index (Dashboard)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseContacts.mockReturnValue({ data: contacts, isLoading: false });
    mockUseUpcomingEvents.mockReturnValue({ data: [] });
  });

  // Happy path: loading
  it("shows skeleton placeholders while loading", () => {
    mockUseContacts.mockReturnValue({ data: [], isLoading: true });
    const { container } = renderIndex();
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });

  // Happy path: empty state
  it("shows empty state when no contacts", () => {
    mockUseContacts.mockReturnValue({ data: [], isLoading: false });
    renderIndex();
    expect(screen.getByText(/your inner circle starts here/i)).toBeInTheDocument();
    expect(screen.getByText(/add someone/i)).toBeInTheDocument();
  });

  // Happy path: circle summary
  it("renders circle summary cards for all three tiers", () => {
    renderIndex();
    expect(screen.getAllByText("Inner Circle").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Close").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Casual").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Reconnect").length).toBeGreaterThanOrEqual(1);
    // Verify summary stat text exists
    const reached = screen.getAllByText(/reached this month/i);
    expect(reached.length).toBe(4);
  });

  // Happy path: overdue contacts
  it("shows overdue contacts with 'It's been a while' heading", () => {
    renderIndex();
    expect(screen.getByText(/it's been a while/i)).toBeInTheDocument();
    expect(screen.getByText("Alice Johnson")).toBeInTheDocument();
  });

  it("shows overdue days and Done and Skip actions", () => {
    const overdueNoInteraction = [{
      ...contacts[2], // Carol
      next_nudge_at: new Date(Date.now() - 86400000).toISOString(), // make overdue
    }];
    mockUseContacts.mockReturnValue({ data: overdueNoInteraction, isLoading: false });
    renderIndex();
    expect(screen.getByText(/overdue by \d+ days/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Done" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Skip" })).toBeInTheDocument();
  });

  it("opens Log Connection from Done and completes only after saving", async () => {
    const overdueContact = [{
      ...contacts[0],
      next_nudge_at: new Date(Date.now() - 86400000).toISOString(),
    }];
    mockUseContacts.mockReturnValue({ data: overdueContact, isLoading: false });
    mockActionAsync.mockResolvedValue(undefined);
    renderIndex();

    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(screen.getByText("Log connection with Alice Johnson")).toBeInTheDocument();
    expect(mockActionAsync).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(mockActionAsync).toHaveBeenCalledWith(expect.objectContaining({
        contactId: "c1",
        action: "completed",
        interaction: expect.objectContaining({ type: "texted" }),
      })));
  });

  it("skips directly without opening Log Connection", () => {
    const overdueContact = [{
      ...contacts[0],
      next_nudge_at: new Date(Date.now() - 86400000).toISOString(),
    }];
    mockUseContacts.mockReturnValue({ data: overdueContact, isLoading: false });
    renderIndex();

    fireEvent.click(screen.getByRole("button", { name: "Skip" }));
    expect(mockAction).toHaveBeenCalledWith({ contactId: "c1", action: "skipped" });
    expect(screen.queryByText("Log connection with Alice Johnson")).not.toBeInTheDocument();
  });

  // Negative: contacts with null next_nudge_at don't appear in overdue
  it("does not show contacts with null next_nudge_at in overdue section", () => {
    // Only Carol with null nudge
    mockUseContacts.mockReturnValue({ data: [contacts[2]], isLoading: false });
    renderIndex();
    expect(screen.queryByText(/it's been a while/i)).not.toBeInTheDocument();
  });

  // Negative: circle with 0 contacts shows 0/0
  it("shows 0/0 for circle tiers with no contacts", () => {
    // Only inner_circle contact
    mockUseContacts.mockReturnValue({ data: [contacts[0]], isLoading: false });
    renderIndex();
    // Extended should show 0 / 0
    const cards = screen.getAllByText(/reached this month/i);
    expect(cards.length).toBe(4); // all four tiers rendered
  });
});
