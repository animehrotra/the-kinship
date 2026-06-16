import { useEffect, useState } from "react";
import { Bell, BellOff, BellRing, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

function isIosSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) && /Safari/.test(ua) && !/CriOS|FxiOS/.test(ua);
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  // iOS uses navigator.standalone; others use display-mode media query
  return (
    (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
    // @ts-expect-error iOS-only
    window.navigator.standalone === true
  );
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const formatHour = (h: number) => {
  const period = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:00 ${period}`;
};

export function NotificationSettings() {
  const { user } = useAuth();
  const { state, subscribe, unsubscribe } = usePushNotifications();
  const [hour, setHour] = useState<number>(9);
  const [tz, setTz] = useState<string>("UTC");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  // Load prefs
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("notify_hour, notify_timezone")
        .eq("id", user.id)
        .maybeSingle();
      if (data) {
        setHour(data.notify_hour ?? 9);
        setTz(data.notify_timezone || detectTimezone());
      }
    })();
  }, [user]);

  const handleToggle = async () => {
    if (state === "subscribed") {
      await unsubscribe();
      toast({ title: "Notifications disabled" });
      return;
    }
    const ok = await subscribe();
    if (ok) {
      // Capture browser tz on first opt-in
      const detected = detectTimezone();
      if (user) {
        await supabase
          .from("profiles")
          .update({ notify_timezone: detected })
          .eq("id", user.id);
        setTz(detected);
      }
      toast({ title: "Notifications enabled", description: "You'll get a daily nudge summary on this device." });
    } else {
      toast({
        title: "Couldn't enable notifications",
        description: "Allow notifications in your browser settings, and make sure you're using the published app (not the in-editor preview).",
        variant: "destructive",
      });
    }
  };

  const saveHour = async (newHour: number) => {
    setHour(newHour);
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ notify_hour: newHour, notify_timezone: tz || detectTimezone() })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast({ title: "Couldn't save", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved", description: `You'll be nudged around ${formatHour(newHour)} (${tz}).` });
    }
  };

  const sendTest = async () => {
    if (!user) return;
    setTesting(true);
    const { data, error } = await supabase.functions.invoke("send-push", {
      body: {
        user_id: user.id,
        title: "Kinship test notification",
        body: "If you can see this, push notifications are working!",
        url: "/dashboard",
      },
    });
    setTesting(false);
    if (error) {
      toast({ title: "Test failed", description: error.message, variant: "destructive" });
      return;
    }
    const sent = (data as { sent?: number } | null)?.sent ?? 0;
    if (sent > 0) {
      toast({ title: "Test sent", description: `Delivered to ${sent} device${sent > 1 ? "s" : ""}.` });
    } else {
      toast({
        title: "No devices subscribed",
        description: "Enable notifications on this device first.",
        variant: "destructive",
      });
    }
  };

  if (state === "unsupported") {
    return (
      <div className="rounded-lg border border-border/60 bg-card p-3 text-xs text-muted-foreground">
        Notifications aren't available in this browser. Open the published app on a supported device to enable them.
      </div>
    );
  }

  const showIosHint = isIosSafari() && !isStandalone();

  return (
    <div className="rounded-lg border border-border/60 bg-card p-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs font-medium">Daily nudge reminder</Label>
        <Button
          variant={state === "subscribed" ? "secondary" : "outline"}
          size="sm"
          onClick={handleToggle}
          disabled={state === "loading" || state === "denied"}
          className="gap-1.5 h-7 text-xs"
        >
          {state === "subscribed" ? (
            <><BellRing className="h-3.5 w-3.5" /> On</>
          ) : state === "denied" ? (
            <><BellOff className="h-3.5 w-3.5" /> Blocked</>
          ) : (
            <><Bell className="h-3.5 w-3.5" /> Enable</>
          )}
        </Button>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Send time</Label>
        <Select value={String(hour)} onValueChange={(v) => saveHour(parseInt(v, 10))} disabled={saving}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {HOURS.map((h) => (
              <SelectItem key={h} value={String(h)} className="text-xs">
                {formatHour(h)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-[10px] text-muted-foreground">Timezone: {tz}</p>
      </div>

      {state === "subscribed" && (
        <Button
          variant="ghost"
          size="sm"
          onClick={sendTest}
          disabled={testing}
          className="w-full gap-1.5 h-7 text-xs"
        >
          <Send className="h-3.5 w-3.5" /> {testing ? "Sending…" : "Send test notification"}
        </Button>
      )}

      {showIosHint && (
        <p className="text-[10px] text-muted-foreground leading-snug">
          On iPhone, add Kinship to your Home Screen first, then open it from there to enable notifications.
        </p>
      )}
    </div>
  );
}
