import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export type AppreciationSource = "spontaneous" | "milestone_1" | "milestone_2" | "milestone_3";

const MILESTONES: { threshold: number; field: string; source: AppreciationSource }[] = [
  { threshold: 5, field: "milestone_1_seen", source: "milestone_1" },
  { threshold: 15, field: "milestone_2_seen", source: "milestone_2" },
  { threshold: 30, field: "milestone_3_seen", source: "milestone_3" },
];

export function useAppreciationPrompt() {
  const { user } = useAuth();
  const [showPrompt, setShowPrompt] = useState(false);
  const [promptSource, setPromptSource] = useState<AppreciationSource>("milestone_1");

  const checkAndShow = useCallback(async () => {
    if (!user) return;

    const { data: state } = await supabase
      .from("onboarding_state")
      .select("positive_response, milestone_1_seen, milestone_2_seen, milestone_3_seen")
      .eq("user_id", user.id)
      .single();

    if (!state) return;
    if ((state as any).positive_response) return;

    const { count } = await supabase
      .from("interactions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (count === null) return;

    for (const m of MILESTONES) {
      if (count >= m.threshold && !(state as any)[m.field]) {
        setPromptSource(m.source);
        setShowPrompt(true);
        return;
      }
    }
  }, [user]);

  useEffect(() => {
    const interactionHandler = () => {
      setTimeout(checkAndShow, 1000);
    };
    const spontaneousHandler = () => {
      setPromptSource("spontaneous");
      setShowPrompt(true);
    };
    window.addEventListener("interaction-logged", interactionHandler);
    window.addEventListener("open-appreciation-spontaneous", spontaneousHandler);
    return () => {
      window.removeEventListener("interaction-logged", interactionHandler);
      window.removeEventListener("open-appreciation-spontaneous", spontaneousHandler);
    };
  }, [checkAndShow]);

  return { showPrompt, setShowPrompt, promptSource, checkAndShow };
}

export function openSpontaneousAppreciation() {
  window.dispatchEvent(new CustomEvent("open-appreciation-spontaneous"));
}
