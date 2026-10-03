import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type Contact = Database["public"]["Tables"]["contacts"]["Row"];
type ContactInsert = Database["public"]["Tables"]["contacts"]["Insert"];
type Interaction = Database["public"]["Tables"]["interactions"]["Row"];
type LifeEvent = Database["public"]["Tables"]["life_events"]["Row"];
type Tag = Database["public"]["Tables"]["tags"]["Row"];

// Helper to calculate next nudge date (supports both old enum and new interval format)
export function calcNextNudge(
  frequency: string,
  from: Date = new Date(),
  intervalValue?: number,
  intervalUnit?: string
): string {
  const d = new Date(from);
  if (intervalValue && intervalUnit) {
    switch (intervalUnit) {
      case "day": d.setDate(d.getDate() + intervalValue); break;
      case "week": d.setDate(d.getDate() + intervalValue * 7); break;
      case "month": d.setMonth(d.getMonth() + intervalValue); break;
    }
  } else {
    switch (frequency) {
      case "weekly": d.setDate(d.getDate() + 7); break;
      case "biweekly": d.setDate(d.getDate() + 14); break;
      case "monthly": d.setMonth(d.getMonth() + 1); break;
      case "quarterly": d.setMonth(d.getMonth() + 3); break;
    }
  }
  return d.toISOString();
}

export function getContactStatus(c: Contact): "on-track" | "overdue" | "drifting" {
  if (!c.next_nudge_at || new Date(c.next_nudge_at) > new Date()) return "on-track";
  let intervalMs: number;
  if (c.nudge_interval_value && c.nudge_interval_unit) {
    const daysMap: Record<string, number> = { day: 1, week: 7, month: 30 };
    intervalMs = c.nudge_interval_value * (daysMap[c.nudge_interval_unit] || 30) * 86400000;
  } else {
    const daysMap: Record<string, number> = { weekly: 7, biweekly: 14, monthly: 30, quarterly: 90 };
    intervalMs = (daysMap[c.nudge_frequency] || 30) * 86400000;
  }
  return Date.now() - new Date(c.next_nudge_at).getTime() > intervalMs ? "drifting" : "overdue";
}

export function useContacts(archived = false) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["contacts", archived],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .eq("user_id", user!.id)
        .eq("archived", archived)
        .order("name");
      if (error) throw error;
      return data as Contact[];
    },
    enabled: !!user,
  });
}

export function useContact(id: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["contact", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .eq("id", id)
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data as Contact;
    },
    enabled: !!user && !!id,
  });
}

export function useCreateContact() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<ContactInsert, "user_id">) => {
      const intervalValue = data.nudge_interval_value || 1;
      const intervalUnit = data.nudge_interval_unit || "month";
      const rawStart = data.nudge_start_date;
      // If user picked a start date, the first nudge IS that date.
      // Otherwise, schedule the first nudge one interval from today.
      const nextNudge = rawStart
        ? new Date(rawStart + "T09:00:00").toISOString()
        : calcNextNudge(
            data.nudge_frequency || "monthly",
            new Date(),
            intervalValue,
            intervalUnit
          );
      const { data: row, error } = await supabase.from("contacts").insert({
        ...data,
        user_id: user!.id,
        next_nudge_at: nextNudge,
      }).select().single();
      if (error) throw error;
      return row as Contact;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contacts"] });
      toast({ title: "Contact added" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useUpdateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Contact> & { id: string }) => {
      const { error } = await supabase.from("contacts").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["contacts"] });
      qc.invalidateQueries({ queryKey: ["contact", vars.id] });
      toast({ title: "Contact updated" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useDeleteContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contacts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contacts"] });
      toast({ title: "Contact deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useOverdueNudgeAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ contactId, action, interaction }: {
      contactId: string;
      action: "skipped" | "completed";
      interaction?: {
        type: Database["public"]["Enums"]["interaction_type"];
        notes?: string;
        interactionDate: Date;
      };
    }) => {
      const { error } = await supabase.rpc("act_on_overdue_nudge", {
        p_contact_id: contactId,
        p_action: action,
        ...(interaction ? {
          p_interaction_type: interaction.type,
          p_notes: interaction.notes,
          p_interaction_at: interaction.interactionDate.toISOString(),
        } : {}),
      });
      if (error) throw error;
    },
    onSuccess: (_, { contactId, action }) => {
      qc.invalidateQueries({ queryKey: ["contacts"] });
      qc.invalidateQueries({ queryKey: ["contact", contactId] });
      qc.invalidateQueries({ queryKey: ["interactions", contactId] });
      toast({ title: action === "skipped" ? "Next nudge scheduled" : "Connection logged" });
    },
    onError: (error: Error) => toast({ title: "Could not update nudge", description: error.message, variant: "destructive" }),
  });
}

export function useLogCompletedConnection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ contactId, type, notes, interactionDate }: {
      contactId: string;
      type: Database["public"]["Enums"]["interaction_type"];
      notes?: string;
      interactionDate: Date;
    }) => {
      const { error } = await supabase.rpc("log_contact_connection", {
        p_contact_id: contactId,
        p_interaction_type: type,
        p_notes: notes ?? null,
        p_interaction_at: interactionDate.toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: (_, { contactId }) => {
      qc.invalidateQueries({ queryKey: ["contacts"] });
      qc.invalidateQueries({ queryKey: ["contact", contactId] });
      qc.invalidateQueries({ queryKey: ["interactions", contactId] });
      toast({ title: "Connection logged" });
      window.dispatchEvent(new CustomEvent("interaction-logged"));
    },
    onError: (error: Error) => toast({ title: "Could not log connection", description: error.message, variant: "destructive" }),
  });
}

export function useInteractions(contactId: string) {
  return useQuery({
    queryKey: ["interactions", contactId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("interactions")
        .select("*")
        .eq("contact_id", contactId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Interaction[];
    },
    enabled: !!contactId,
  });
}

export function useLogInteraction() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ contactId, type, notes, interactionDate, nudgeFrequency, intervalValue, intervalUnit }: {
      contactId: string;
      type: Database["public"]["Enums"]["interaction_type"];
      notes?: string;
      interactionDate?: Date;
      nudgeFrequency: string;
      intervalValue?: number;
      intervalUnit?: string;
    }) => {
      const now = new Date().toISOString();
      const nextNudge = calcNextNudge(nudgeFrequency, new Date(), intervalValue, intervalUnit);

      const { error: intError } = await supabase.from("interactions").insert({
        contact_id: contactId,
        user_id: user!.id,
        type,
        notes,
        ...(interactionDate ? { created_at: interactionDate.toISOString() } : {}),
      });
      if (intError) throw intError;

      const { error: upErr } = await supabase
        .from("contacts")
        .update({ last_interaction_at: now, next_nudge_at: nextNudge, renudge_count: 0, last_nudged_at: null, last_notified_for_nudge_at: null })
        .eq("id", contactId);
      if (upErr) throw upErr;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["contacts"] });
      qc.invalidateQueries({ queryKey: ["contact", vars.contactId] });
      qc.invalidateQueries({ queryKey: ["interactions", vars.contactId] });
      toast({ title: "Connection logged" });
      window.dispatchEvent(new CustomEvent("interaction-logged"));
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useLifeEvents(contactId: string) {
  return useQuery({
    queryKey: ["life_events", contactId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("life_events")
        .select("*")
        .eq("contact_id", contactId)
        .order("event_date", { ascending: false });
      if (error) throw error;
      return data as LifeEvent[];
    },
    enabled: !!contactId,
  });
}

export function useCreateLifeEvent() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { contact_id: string; title: string; description?: string; event_date: string; recurring?: boolean }) => {
      const { error } = await supabase.from("life_events").insert({
        ...data,
        user_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["life_events", vars.contact_id] });
      toast({ title: "Life event added" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useUpdateLifeEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, contact_id: _contactId, ...data }: { id: string; contact_id: string; title?: string; description?: string | null; event_date?: string; recurring?: boolean }) => {
      const { error } = await supabase.from("life_events").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["life_events", vars.contact_id] });
      toast({ title: "Life event updated" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useDeleteLifeEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, contact_id: _contactId }: { id: string; contact_id: string }) => {
      const { error } = await supabase.from("life_events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["life_events", vars.contact_id] });
      toast({ title: "Life event deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useTags() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tags")
        .select("*")
        .eq("user_id", user!.id)
        .order("name");
      if (error) throw error;
      return data as Tag[];
    },
    enabled: !!user,
  });
}

export function useContactTags(contactId: string) {
  return useQuery({
    queryKey: ["contact_tags", contactId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_tags")
        .select("tag_id, tags(id, name, color)")
        .eq("contact_id", contactId);
      if (error) throw error;
      return data;
    },
    enabled: !!contactId,
  });
}

export function useAllContactTags() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["all_contact_tags", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_tags")
        .select("contact_id, tags!inner(id, name, color, user_id)")
        .eq("tags.user_id", user!.id);
      if (error) throw error;
      const map: Record<string, { id: string; name: string; color: string | null }[]> = {};
      for (const row of (data as any[]) ?? []) {
        const t = row.tags;
        if (!t) continue;
        (map[row.contact_id] ||= []).push({ id: t.id, name: t.name, color: t.color });
      }
      return map;
    },
    enabled: !!user,
  });
}

export function useUpcomingEvents() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["upcoming_events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("life_events")
        .select("*, contacts(name, id)")
        .eq("user_id", user!.id)
        .order("event_date");
      if (error) throw error;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const in30 = new Date(today.getTime() + 30 * 86400000);

      return (data ?? [])
        .map((event) => {
          const d = new Date(event.event_date + "T00:00:00");
          let displayDate: string;
          if (event.recurring) {
            const thisYear = new Date(today.getFullYear(), d.getMonth(), d.getDate());
            displayDate = thisYear >= today
              ? thisYear.toISOString().split("T")[0]
              : new Date(today.getFullYear() + 1, d.getMonth(), d.getDate()).toISOString().split("T")[0];
          } else {
            displayDate = event.event_date;
          }
          const displayDateObj = new Date(displayDate + "T00:00:00");
          if (displayDateObj >= today && displayDateObj <= in30) {
            return { ...event, display_date: displayDate };
          }
          return null;
        })
        .filter((e): e is NonNullable<typeof e> => e !== null)
        .sort((a, b) => a.display_date.localeCompare(b.display_date));
    },
    enabled: !!user,
  });
}

export function useCreateTag() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, color }: { name: string; color?: string }) => {
      const { data, error } = await supabase.from("tags").insert({
        name,
        color: color || null,
        user_id: user!.id,
      }).select().single();
      if (error) throw error;
      return data as Tag;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tags"] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useAddContactTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ contactId, tagId }: { contactId: string; tagId: string }) => {
      const { error } = await supabase.from("contact_tags").insert({
        contact_id: contactId,
        tag_id: tagId,
      });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["contact_tags", vars.contactId] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useRemoveContactTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ contactId, tagId }: { contactId: string; tagId: string }) => {
      const { error } = await supabase.from("contact_tags")
        .delete()
        .eq("contact_id", contactId)
        .eq("tag_id", tagId);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["contact_tags", vars.contactId] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}
