import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";

const STORAGE_KEY = "feedback_last_seen_at";

export function useUnreadFeedback() {
  const { isAdmin } = useIsAdmin();
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!isAdmin) {
      setCount(0);
      return;
    }
    const lastSeen = localStorage.getItem(STORAGE_KEY) || "1970-01-01T00:00:00Z";
    const { count: c } = await supabase
      .from("feedback")
      .select("id", { count: "exact", head: true })
      .gt("created_at", lastSeen);
    setCount(c ?? 0);
  }, [isAdmin]);

  useEffect(() => {
    refresh();
    if (!isAdmin) return;
    const channel = supabase
      .channel("feedback-unread")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "feedback" },
        () => refresh(),
      )
      .subscribe();
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("focus", onFocus);
    };
  }, [isAdmin, refresh]);

  const markAllRead = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    setCount(0);
  }, []);

  return { count, markAllRead, refresh };
}
