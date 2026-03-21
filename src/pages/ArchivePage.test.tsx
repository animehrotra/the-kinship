import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ArchivePage from "./ArchivePage";
import { archivedContacts } from "@/test/fixtures";

const mockUseContacts = vi.fn();
const mockUpdateContact = { mutateAsync: vi.fn(), isPending: false };

vi.mock("@/lib/hooks", () => ({
  useContacts: (archived: boolean) => mockUseContacts(archived),
  useUpdateContact: () => mockUpdateContact,
}));

vi.mock("@/lib/auth", () => ({
  useAuth: () => ({ user: { id: "user-1" }, session: {}, loading: false }),
}));

function renderArchive() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <ArchivePage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("ArchivePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseContacts.mockReturnValue({ data: archivedContacts, isLoading: false });
  });

  // Happy path
  it("renders archived contacts with Restore button", () => {
    renderArchive();
    expect(screen.getByText("Dave Archived")).toBeInTheDocument();
    expect(screen.getByText(/restore/i)).toBeInTheDocument();
  });

  it("renders Archive heading", () => {
    renderArchive();
    expect(screen.getByText("Archive")).toBeInTheDocument();
  });

  // Negative: empty archive
  it("shows 'No archived contacts' when list is empty", () => {
    mockUseContacts.mockReturnValue({ data: [], isLoading: false });
    renderArchive();
    expect(screen.getByText(/no archived contacts/i)).toBeInTheDocument();
  });

  // Loading
  it("shows skeletons while loading", () => {
    mockUseContacts.mockReturnValue({ data: [], isLoading: true });
    const { container } = renderArchive();
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });
});
