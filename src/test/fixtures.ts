import type { Database } from "@/integrations/supabase/types";

type Contact = Database["public"]["Tables"]["contacts"]["Row"];
type Interaction = Database["public"]["Tables"]["interactions"]["Row"];
type LifeEvent = Database["public"]["Tables"]["life_events"]["Row"];

const now = new Date();
const weekAgo = new Date(now.getTime() - 7 * 86400000);
const monthAgo = new Date(now.getTime() - 30 * 86400000);
const yesterday = new Date(now.getTime() - 86400000);
const inTenDays = new Date(now.getTime() + 10 * 86400000);

export const mockUser = {
  id: "user-1",
  email: "test@example.com",
  app_metadata: {},
  user_metadata: { display_name: "Test User" },
  aud: "authenticated",
  created_at: now.toISOString(),
};

export const mockSession = {
  access_token: "token",
  refresh_token: "refresh",
  expires_in: 3600,
  token_type: "bearer" as const,
  user: mockUser,
};

export const contacts: Contact[] = [
  {
    id: "c1",
    user_id: "user-1",
    name: "Alice Johnson",
    circle: "inner_circle",
    nudge_frequency: "weekly",
    nudge_interval_value: 1,
    nudge_interval_unit: "week",
    nudge_start_date: null,
    nudge_end_date: null,
    last_interaction_at: weekAgo.toISOString(),
    next_nudge_at: yesterday.toISOString(),
    archived: false,
    birthday: "1990-05-15",
    email: "alice@example.com",
    phone: "555-0001",
    notes: "Best friend",
    created_at: monthAgo.toISOString(),
    updated_at: now.toISOString(),
  },
  {
    id: "c2",
    user_id: "user-1",
    name: "Bob Smith",
    circle: "friends",
    nudge_frequency: "monthly",
    last_interaction_at: monthAgo.toISOString(),
    next_nudge_at: inTenDays.toISOString(), // not overdue
    archived: false,
    birthday: null,
    email: null,
    phone: null,
    notes: null,
    created_at: monthAgo.toISOString(),
    updated_at: now.toISOString(),
  },
  {
    id: "c3",
    user_id: "user-1",
    name: "Carol Davis",
    circle: "others",
    nudge_frequency: "quarterly",
    last_interaction_at: null, // never interacted
    next_nudge_at: null, // no nudge set
    archived: false,
    birthday: null,
    email: null,
    phone: null,
    notes: null,
    created_at: monthAgo.toISOString(),
    updated_at: now.toISOString(),
  },
];

export const archivedContacts: Contact[] = [
  {
    id: "c4",
    user_id: "user-1",
    name: "Dave Archived",
    circle: "others",
    nudge_frequency: "monthly",
    last_interaction_at: null,
    next_nudge_at: null,
    archived: true,
    birthday: null,
    email: null,
    phone: null,
    notes: null,
    created_at: monthAgo.toISOString(),
    updated_at: now.toISOString(),
  },
];

export const interactions: Interaction[] = [
  {
    id: "i1",
    contact_id: "c1",
    user_id: "user-1",
    type: "texted",
    notes: null,
    created_at: weekAgo.toISOString(),
  },
  {
    id: "i2",
    contact_id: "c1",
    user_id: "user-1",
    type: "called",
    notes: "Caught up about work",
    created_at: monthAgo.toISOString(),
  },
];

export const lifeEvents: LifeEvent[] = [
  {
    id: "le1",
    contact_id: "c1",
    user_id: "user-1",
    title: "Started new job",
    description: "At Acme Corp",
    event_date: inTenDays.toISOString().split("T")[0],
    recurring: false,
    created_at: now.toISOString(),
  },
  {
    id: "le2",
    contact_id: "c1",
    user_id: "user-1",
    title: "Birthday",
    description: null,
    event_date: "1990-05-15",
    recurring: true,
    created_at: now.toISOString(),
  },
];
