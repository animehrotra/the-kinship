import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { WhatsNewBanner } from "./WhatsNewBanner";

const update = vi.fn();
const eq = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: () => ({ update: (...args: unknown[]) => update(...args) }) },
}));

describe("What's new banner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    update.mockReturnValue({ eq });
    eq.mockResolvedValue({ error: null });
  });

  const mount = (lastSeenRelease: string | null, accountCreatedAt = "2026-01-01T00:00:00Z") =>
    render(<MemoryRouter><WhatsNewBanner userId="user-1" accountCreatedAt={accountCreatedAt} lastSeenRelease={lastSeenRelease} /></MemoryRouter>);

  it("announces an unseen release and saves the newest marker on dismissal", async () => {
    mount(null);
    expect(screen.getByRole("region", { name: "What's new in Kinship" })).toBeInTheDocument();
    expect(screen.getByText("See what's new in Kinship right here when features ship.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Take me there" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Got it" }));
    await waitFor(() => expect(update).toHaveBeenCalledWith({ last_seen_release: "v1.1-phase-0" }));
    expect(eq).toHaveBeenCalledWith("id", "user-1");
    expect(screen.queryByRole("region", { name: "What's new in Kinship" })).not.toBeInTheDocument();
  });

  it("does not announce releases already seen or predating signup", () => {
    const seen = mount("v1.1-phase-0");
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
    seen.unmount();
    mount(null, "2026-10-04T00:00:00Z");
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });

  it("hides silently for the visit when saving fails", async () => {
    eq.mockResolvedValue({ error: { message: "offline" } });
    mount(null);
    fireEvent.click(screen.getByRole("button", { name: "Got it" }));
    await waitFor(() => expect(eq).toHaveBeenCalled());
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });
});
