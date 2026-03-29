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
      const intervalValue = (data as any).nudge_interval_value || 1;
      const intervalUnit = (data as any).nudge_interval_unit || "month";
      const nextNudge = calcNextNudge(
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
    mutationFn: async ({ contactId, type, notes, nudgeFrequency, intervalValue, intervalUnit }: {
      contactId: string;
      type: Database["public"]["Enums"]["interaction_type"];
      notes?: string;
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
      });
      if (intError) throw intError;

      const { error: upErr } = await supabase
        .from("contacts")
        .update({ last_interaction_at: now, next_nudge_at: nextNudge })
        .eq("id", contactId);
      if (upErr) throw upErr;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["contacts"] });
      qc.invalidateQueries({ queryKey: ["contact", vars.contactId] });
      qc.invalidateQueries({ queryKey: ["interactions", vars.contactId] });
      toast({ title: "Interaction logged" });
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

export function useUpcomingEvents() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["upcoming_events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("life_events")
        .select("*, contacts(name, id)")
        .eq("user_id", user!.id)
        .gte("event_date", new Date().toISOString().split("T")[0])
        .lte("event_date", new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0])
        .order("event_date");
      if (error) throw error;
      return data;
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
