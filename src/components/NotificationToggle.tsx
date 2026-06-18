import { Bell, BellOff, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { toast } from "@/hooks/use-toast";

export function NotificationToggle() {
  const { state, subscribe, unsubscribe } = usePushNotifications();

  if (state === "unsupported") return null;

  const handleToggle = async () => {
    if (state === "subscribed") {
      await unsubscribe();
      toast({ title: "Notifications disabled", description: "You won't receive push reminders." });
    } else {
      const result = await subscribe();
      if (result.ok) {
        toast({ title: "Notifications enabled!", description: "You'll get nudge reminders on this device." });
      } else {
        toast({
          title: "Couldn't enable notifications",
          description: result.reason === "preview"
            ? "Open the published app — push doesn't work in the editor preview."
            : `${result.reason}${result.message ? `: ${result.message}` : ""}`,
          variant: "destructive",
        });
      }
    }
  };


  return (
    <Button
      variant={state === "subscribed" ? "secondary" : "outline"}
      size="sm"
      onClick={handleToggle}
      disabled={state === "loading" || state === "denied"}
      className="gap-2"
    >
      {state === "subscribed" ? (
        <>
          <BellRing className="h-4 w-4" />
          Notifications On
        </>
      ) : state === "denied" ? (
        <>
          <BellOff className="h-4 w-4" />
          Blocked
        </>
      ) : (
        <>
          <Bell className="h-4 w-4" />
          Enable Notifications
        </>
      )}
    </Button>
  );
}
