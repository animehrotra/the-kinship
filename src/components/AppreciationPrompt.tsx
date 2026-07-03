import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import type { AppreciationSource } from "@/hooks/useAppreciationPrompt";
import type { Database } from "@/integrations/supabase/types";

interface AppreciationPromptProps {
  open: boolean;
  onClose: () => void;
  source: AppreciationSource;
}

const MILESTONE_FIELD: Record<string, string> = {
  milestone_1: "milestone_1_seen",
  milestone_2: "milestone_2_seen",
  milestone_3: "milestone_3_seen",
};

export default function AppreciationPrompt({ open, onClose, source }: AppreciationPromptProps) {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [sentiment, setSentiment] = useState<"positive" | "negative" | null>(null);
  const [text, setText] = useState("");
  const [testimonialConsent, setTestimonialConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setSentiment(null);
    setText("");
  };

  const markMilestoneSeen = async (setPositive: boolean) => {
    if (!user) return;
    const field = MILESTONE_FIELD[source];
    if (!field) return;
    const update: Database["public"]["Tables"]["onboarding_state"]["Update"] = {
      [field]: true,
      updated_at: new Date().toISOString(),
    };
    if (setPositive) update.positive_response = true;
    await supabase.from("onboarding_state").update(update).eq("user_id", user.id);
  };

  const submit = async (skipText = false) => {
    if (!user || !sentiment) return;
    setSubmitting(true);
    try {
      await supabase.from("appreciation_responses").insert({
        user_id: user.id,
        sentiment: sentiment === "positive" ? "positive" : "negative",
        response_text: skipText ? null : text.trim() || null,
        source,
      });

      if (source !== "spontaneous") {
        await markMilestoneSeen(sentiment === "positive");
      } else if (sentiment === "positive") {
        await supabase
          .from("onboarding_state")
          .update({ positive_response: true, updated_at: new Date().toISOString() })
          .eq("user_id", user.id);
      }
    } finally {
      setSubmitting(false);
      reset();
      onClose();
    }
  };

  const dismiss = async () => {
    if (!user) return;
    if (source !== "spontaneous") {
      await markMilestoneSeen(false);
    }
    reset();
    onClose();
  };

  const sentimentTitle = "Loving Kinship?";
  const sentimentDesc = "Has Kinship helped you stay closer to someone?";
  const followupTitle = sentiment === "positive" ? "That's wonderful!" : "We hear you";
  const followupPlaceholder =
    sentiment === "positive"
      ? "What's changed for you since using Kinship? (optional)"
      : "What could be better? (optional)";

  if (!sentiment) {
    if (isMobile) {
      return (
        <Drawer open={open} onOpenChange={(o) => { if (!o) dismiss(); }}>
          <DrawerContent>
            <DrawerHeader className="text-center pb-2">
              <DrawerTitle className="text-xl font-serif">{sentimentTitle}</DrawerTitle>
              <DrawerDescription className="text-base mt-1">{sentimentDesc}</DrawerDescription>
            </DrawerHeader>
            <DrawerFooter className="flex-row gap-3 pb-8">
              <Button variant="ghost" className="flex-1 text-muted-foreground" onClick={() => setSentiment("negative")}>
                Not really
              </Button>
              <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={() => setSentiment("positive")}>
                Yes, it has ♥
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      );
    }
    return (
      <Dialog open={open} onOpenChange={(o) => { if (!o) dismiss(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl font-serif">{sentimentTitle}</DialogTitle>
            <DialogDescription className="text-base mt-1">{sentimentDesc}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-3 sm:justify-center">
            <Button variant="ghost" className="flex-1 text-muted-foreground" onClick={() => setSentiment("negative")}>
              Not really
            </Button>
            <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={() => setSentiment("positive")}>
              Yes, it has ♥
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={(o) => { if (!o) submit(true); }}>
        <DrawerContent>
          <DrawerHeader className="text-center pb-2">
            <DrawerTitle className="text-lg font-serif">{followupTitle}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4">
            <Textarea placeholder={followupPlaceholder} value={text} onChange={(e) => setText(e.target.value)} rows={3} />
          </div>
          <DrawerFooter className="pb-8">
            <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => submit(false)} disabled={submitting}>
              Submit
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) submit(true); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <DialogTitle className="text-lg font-serif">{followupTitle}</DialogTitle>
        </DialogHeader>
        <Textarea placeholder={followupPlaceholder} value={text} onChange={(e) => setText(e.target.value)} rows={3} />
        <DialogFooter>
          <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => submit(false)} disabled={submitting}>
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
