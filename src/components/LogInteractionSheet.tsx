import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageSquare, Phone, Video, Users, Share2 } from "lucide-react";
import { useLogInteraction } from "@/lib/hooks";
import type { Database } from "@/integrations/supabase/types";

type InteractionType = Database["public"]["Enums"]["interaction_type"];

const interactionMeta: Record<string, { icon: React.ComponentType<{ className?: string }>; label: string }> = {
  texted: { icon: MessageSquare, label: "Texted" },
  social: { icon: Share2, label: "Social" },
  called: { icon: Phone, label: "Called" },
  video_call: { icon: Video, label: "Video call" },
  met_up: { icon: Users, label: "Met up" },
};

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

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
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(todayISO());
  const [open, setOpen] = useState(false);
  const logInteraction = useLogInteraction();

  const handleLog = async () => {
    await logInteraction.mutateAsync({
      contactId,
      type: logType,
      notes: notes.trim() || undefined,
      interactionDate: new Date(date + "T12:00:00"),
      nudgeFrequency,
      intervalValue,
      intervalUnit,
    });
    setOpen(false);
    setLogType("texted");
    setNotes("");
    setDate(todayISO());
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md p-5">
        <DialogHeader>
          <DialogTitle className="text-base">Log interaction with {contactName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">How did you connect?</Label>
            <div className="grid grid-cols-5 gap-2">
              {(Object.entries(interactionMeta) as [InteractionType, typeof interactionMeta[string]][]).map(
                ([type, { icon: Icon, label }]) => (
                  <button
                    key={type}
                    onClick={() => setLogType(type)}
                    className={`px-1 py-2.5 rounded-lg border transition-all flex flex-col items-center gap-1 ${
                      logType === type
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-[11px] font-medium leading-tight">{label}</span>
                  </button>
                )
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="interaction-notes" className="text-xs text-muted-foreground mb-1.5 block">Note (optional)</Label>
            <Textarea
              id="interaction-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. wished happy birthday"
              className="resize-none min-h-0"
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="interaction-date" className="text-xs text-muted-foreground mb-1.5 block">When did this happen?</Label>
            <Input
              id="interaction-date"
              type="date"
              value={date}
              max={todayISO()}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <Button
            onClick={handleLog}
            className="w-full"
            disabled={logInteraction.isPending}
          >
            {logInteraction.isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
