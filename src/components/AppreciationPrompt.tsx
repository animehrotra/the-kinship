import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import type { AppreciationSource } from "@/hooks/useAppreciationPrompt";

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
  const [sentiment, setSentiment] = useState<"positive" | "negative" | null>(null);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setSentiment(null);
    setText("");
  };

  const markMilestoneSeen = async (setPositive: boolean) => {
    if (!user) return;
    const field = MILESTONE_FIELD[source];
    if (!field) return;
    const update: Record<string, any> = {
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
      await (supabase.from("appreciation_responses") as any).insert({
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
          .update({ positive_response: true, updated_at: new Date().toISOString() } as any)
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

  if (!sentiment) {
    return (
      <Drawer open={open} onOpenChange={(o) => { if (!o) dismiss(); }}>
        <DrawerContent>
          <DrawerHeader className="text-center pb-2">
            <DrawerTitle className="text-xl font-serif">Loving Kinship?</DrawerTitle>
            <DrawerDescription className="text-base mt-1">
              Has Kinship helped you stay closer to someone?
            </DrawerDescription>
          </DrawerHeader>
          <DrawerFooter className="flex-row gap-3 pb-8">
            <Button
              variant="ghost"
              className="flex-1 text-muted-foreground"
              onClick={() => setSentiment("negative")}
            >
              Not really
            </Button>
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              onClick={() => setSentiment("positive")}
            >
              Yes, it has ♥
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Drawer open={open} onOpenChange={(o) => { if (!o) submit(true); }}>
      <DrawerContent>
        <DrawerHeader className="text-center pb-2">
          <DrawerTitle className="text-lg font-serif">
            {sentiment === "positive" ? "That's wonderful!" : "We hear you"}
          </DrawerTitle>
        </DrawerHeader>
        <div className="px-4">
          <Textarea
            placeholder={
              sentiment === "positive"
                ? "Would you like to share your story? (optional)"
                : "What could be better? (optional)"
            }
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
          />
        </div>
        <DrawerFooter className="pb-8">
          <Button
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={() => submit(false)}
            disabled={submitting}
          >
            Submit
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
