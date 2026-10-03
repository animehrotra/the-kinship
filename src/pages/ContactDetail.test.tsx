import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ContactDetail from "./ContactDetail";
import { contacts, interactions, lifeEvents } from "@/test/fixtures";

const mockUseContact = vi.fn();
const mockUseInteractions = vi.fn();
const mockUseLifeEvents = vi.fn();
const mockUseContactTags = vi.fn();
const mockUseTags = vi.fn();
const mockLogInteraction = { mutateAsync: vi.fn(), isPending: false };
const mockCreateLifeEvent = { mutateAsync: vi.fn(), isPending: false };
const mockUpdateLifeEvent = { mutateAsync: vi.fn(), isPending: false };
const mockDeleteLifeEvent = { mutateAsync: vi.fn(), isPending: false };
const mockUpdateContact = { mutateAsync: vi.fn(), isPending: false };
const mockAddContactTag = { mutateAsync: vi.fn(), isPending: false };
const mockRemoveContactTag = { mutateAsync: vi.fn(), isPending: false };
const mockCreateTag = { mutateAsync: vi.fn(), isPending: false };

vi.mock("@/lib/hooks", () => ({
  useContact: (id: string) => mockUseContact(id),
  useInteractions: (id: string) => mockUseInteractions(id),
  useLifeEvents: (id: string) => mockUseLifeEvents(id),
  useContactTags: (id: string) => mockUseContactTags(id),
  useTags: () => mockUseTags(),
  useLogInteraction: () => mockLogInteraction,
  useCreateLifeEvent: () => mockCreateLifeEvent,
  useUpdateLifeEvent: () => mockUpdateLifeEvent,
  useDeleteLifeEvent: () => mockDeleteLifeEvent,
  useUpdateContact: () => mockUpdateContact,
  useAddContactTag: () => mockAddContactTag,
  useRemoveContactTag: () => mockRemoveContactTag,
  useCreateTag: () => mockCreateTag,
  useDeleteContact: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock("@/lib/auth", () => ({
  useAuth: () => ({ user: { id: "user-1" }, session: {}, loading: false }),
}));

function renderDetail(id = "c1") {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[`/people/${id}`]}>
        <Routes>
          <Route path="/people/:id" element={<ContactDetail />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("ContactDetail Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseContact.mockReturnValue({ data: contacts[0], isLoading: false });
    mockUseInteractions.mockReturnValue({ data: interactions });
    mockUseLifeEvents.mockReturnValue({ data: lifeEvents });
    mockUseContactTags.mockReturnValue({ data: [] });
    mockUseTags.mockReturnValue({ data: [] });
  });

  // Happy path: renders contact info
  it("displays contact name and circle badge", () => {
    renderDetail();
    expect(screen.getByText("Alice Johnson")).toBeInTheDocument();
    expect(screen.getByText("Inner Circle")).toBeInTheDocument();
  });

  // Happy path: quick stats
  it("renders Last seen and Next nudge cards", () => {
    renderDetail();
    expect(screen.getByText("Last seen")).toBeInTheDocument();
    expect(screen.getByText("Next nudge")).toBeInTheDocument();
  });

  // Happy path: log interaction button
  it("renders Log connection button", () => {
    renderDetail();
    expect(screen.getByText(/log connection/i)).toBeInTheDocument();
  });

  // Happy path: interaction history
  it("shows interaction history entries", () => {
    renderDetail();
    expect(screen.getByText("History")).toBeInTheDocument();
    expect(screen.getByText("Texted")).toBeInTheDocument();
    expect(screen.getByText("Called")).toBeInTheDocument();
  });

  // Happy path: life events
  it("shows life events", () => {
    renderDetail();
    expect(screen.getByText("Life events")).toBeInTheDocument();
    expect(screen.getByText("Started new job")).toBeInTheDocument();
    expect(screen.getByText("Birthday")).toBeInTheDocument();
  });

  // Negative: loading state
  it("shows loading skeleton when contact is loading", () => {
    mockUseContact.mockReturnValue({ data: undefined, isLoading: true });
    const { container } = renderDetail();
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });

  // Negative: contact with no interactions
  it("shows 'Never' for last seen when no interactions", () => {
    mockUseContact.mockReturnValue({ data: contacts[2], isLoading: false }); // Carol, null last_interaction_at
    mockUseInteractions.mockReturnValue({ data: [] });
    mockUseLifeEvents.mockReturnValue({ data: [] });
    renderDetail("c3");
    expect(screen.getByText("Never")).toBeInTheDocument();
  });

  // Negative: no life events
  it("shows 'No life events recorded yet' when empty", () => {
    mockUseLifeEvents.mockReturnValue({ data: [] });
    renderDetail();
    expect(screen.getByText(/no life events recorded yet/i)).toBeInTheDocument();
  });

  // Negative: contact with no next_nudge_at
  it("shows 'Not set' when next_nudge_at is null", () => {
    mockUseContact.mockReturnValue({ data: contacts[2], isLoading: false }); // Carol
    mockUseInteractions.mockReturnValue({ data: [] });
    mockUseLifeEvents.mockReturnValue({ data: [] });
    renderDetail("c3");
    expect(screen.getByText("Not set")).toBeInTheDocument();
  });
});
