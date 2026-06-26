import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { ONBOARDING_TIPS, TIP_THROTTLE_DAYS, type OnboardingTip } from "@/lib/onboardingTips";

export type OnboardingState = {
  user_id: string;
  tour_completed_at: string | null;
  tour_skipped: boolean;
  seen_tips: string[];
  last_tip_shown_at: string | null;
};

export function useOnboarding() {
  const { user } = useAuth();
  const [state, setState] = useState<OnboardingState | null>(null);
  const [loading, setLoading] = useState(true);

  // Load or create the row
  useEffect(() => {
    if (!user) {
      setState(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("onboarding_state")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (data) {
        setState(data as OnboardingState);
      } else {
        const { data: inserted } = await supabase
          .from("onboarding_state")
          .insert({ user_id: user.id })
          .select()
          .maybeSingle();
        if (!cancelled && inserted) setState(inserted as OnboardingState);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const patch = useCallback(
    async (changes: Partial<OnboardingState>) => {
      if (!user) return;
      setState((prev) => (prev ? { ...prev, ...changes } : prev));
      await supabase
        .from("onboarding_state")
        .update(changes)
        .eq("user_id", user.id);
    },
    [user],
  );

  const completeTour = useCallback(
    () => patch({ tour_completed_at: new Date().toISOString(), tour_skipped: false }),
    [patch],
  );
  const skipTour = useCallback(
    () => patch({ tour_completed_at: new Date().toISOString(), tour_skipped: true }),
    [patch],
  );
  const replayTour = useCallback(
    () => patch({ tour_completed_at: null, tour_skipped: false }),
    [patch],
  );
  const dismissTip = useCallback(
    (tipId: string) => {
      if (!state) return Promise.resolve();
      const seen = Array.from(new Set([...(state.seen_tips || []), tipId]));
      return patch({ seen_tips: seen, last_tip_shown_at: new Date().toISOString() });
    },
    [state, patch],
  );

  const shouldShowTour = !!state && !state.tour_completed_at && !state.tour_skipped;

  const nextTip: OnboardingTip | null = (() => {
    if (!state) return null;
    if (shouldShowTour) return null;
    const seen = new Set(state.seen_tips || []);
    const candidate = ONBOARDING_TIPS.find((t) => !seen.has(t.id));
    if (!candidate) return null;
    if (state.last_tip_shown_at) {
      const ageMs = Date.now() - new Date(state.last_tip_shown_at).getTime();
      if (ageMs < TIP_THROTTLE_DAYS * 86400000) return null;
    }
    return candidate;
  })();

  return {
    state,
    loading,
    shouldShowTour,
    nextTip,
    completeTour,
    skipTour,
    replayTour,
    dismissTip,
  };
}
