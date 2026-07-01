import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";

export function useUnreadAppreciation() {
  const { isAdmin } = useIsAdmin();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isAdmin) return;
    const lastViewed = localStorage.getItem("last_viewed_appreciation_at");
    (async () => {
      let query = (supabase.from("appreciation_responses") as any)
        .select("id", { count: "exact", head: true });
      if (lastViewed) {
        query = query.gt("created_at", lastViewed);
      }
      const { count: c } = await query;
      setCount(c ?? 0);
    })();
  }, [isAdmin]);

  return { count };
}
