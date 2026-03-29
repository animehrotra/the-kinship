import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { MessageSquare, Phone, Video, Users } from "lucide-react";
import { useLogInteraction } from "@/lib/hooks";
import type { Database } from "@/integrations/supabase/types";

type InteractionType = Database["public"]["Enums"]["interaction_type"];

const interactionMeta: Record<string, { icon: typeof MessageSquare; label: string }> = {
  texted: { icon: MessageSquare, label: "Texted" },
  called: { icon: Phone, label: "Called" },
  met_up: { icon: Users, label: "Met up" },
  video_call: { icon: Video, label: "Video call" },
};

interface LogInteractionSheetProps {
  contactId: string;
  contactName: string;
  nudgeFrequency: string;
  intervalValue?: number;
  intervalUnit?: string;
  trigger: React.ReactNode;
}

export default function LogInteractionSheet({ contactId, contactName, nudgeFrequency, intervalValue, intervalUnit, trigger }: LogInteractionSheetProps) {
  const [logType, setLogType] = useState<InteractionType>("texted");
  const [open, setOpen] = useState(false);
  const logInteraction = useLogInteraction();

  const handleLog = async () => {
    await logInteraction.mutateAsync({
      contactId,
      type: logType,
      nudgeFrequency,
    });
    setOpen(false);
    setLogType("texted");
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>Log interaction with {contactName}</SheetTitle>
        </SheetHeader>
        <div className="grid grid-cols-2 gap-3 mt-4">
          {(Object.entries(interactionMeta) as [InteractionType, typeof interactionMeta[string]][]).map(
            ([type, { icon: Icon, label }]) => (
              <button
                key={type}
                onClick={() => setLogType(type)}
                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                  logType === type
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/30"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{label}</span>
              </button>
            )
          )}
        </div>
        <Button
          onClick={handleLog}
          className="w-full mt-4"
          disabled={logInteraction.isPending}
        >
          {logInteraction.isPending ? "Saving..." : "Save"}
        </Button>
      </SheetContent>
    </Sheet>
  );
}
