import { Lightbulb, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useOnboarding } from "@/lib/useOnboarding";

export function DidYouKnowCard() {
  const { nextTip, dismissTip } = useOnboarding();
  if (!nextTip) return null;

  return (
    <Card className="p-4 flex items-start gap-3 bg-accent/40 border-accent">
      <div className="rounded-full bg-primary/10 p-2 shrink-0">
        <Lightbulb className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
          Did you know?
        </p>
        <h4 className="font-medium text-sm mb-1">{nextTip.title}</h4>
        <p className="text-sm text-muted-foreground">{nextTip.body}</p>
        <div className="mt-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => dismissTip(nextTip.id)}
          >
            Got it
          </Button>
        </div>
      </div>
      <button
        aria-label="Dismiss tip"
        onClick={() => dismissTip(nextTip.id)}
        className="text-muted-foreground hover:text-foreground shrink-0"
      >
        <X className="h-4 w-4" />
      </button>
    </Card>
  );
}
