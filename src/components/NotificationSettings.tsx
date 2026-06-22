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
import { usePushNotifications, isPreviewContext } from "@/hooks/usePushNotifications";
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
  return (
    (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
    // @ts-expect-error iOS-only
    window.navigator.standalone === true
  );
}

// Half-hour slots: 0:00, 0:30, 1:00, ... 23:30
const SLOTS: { hour: number; minute: number }[] = [];
for (let h = 0; h < 24; h++) {
  SLOTS.push({ hour: h, minute: 0 });
  SLOTS.push({ hour: h, minute: 30 });
}

const formatSlot = (h: number, m: number) => {
  const period = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${period}`;
};

const slotValue = (h: number, m: number) => `${h}:${m}`;

export function NotificationSettings() {
  const { user } = useAuth();
  const { state, subscribe, unsubscribe } = usePushNotifications();
  const [hour, setHour] = useState<number>(8);
  const [minute, setMinute] = useState<number>(30);
  const [tz, setTz] = useState<string>("UTC");
  const [windowDays, setWindowDays] = useState<number>(7);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("notify_hour, notify_minute, notify_timezone")
        .eq("id", user.id)
        .maybeSingle();
      if (data) {
        setHour(data.notify_hour ?? 8);
        setMinute((data.notify_minute ?? 30) >= 30 ? 30 : 0);
        const stored = data.notify_timezone;
        const detected = detectTimezone();
        if ((!stored || stored === "UTC") && detected && detected !== "UTC") {
          await supabase
            .from("profiles")
            .update({ notify_timezone: detected })
            .eq("id", user.id);
          setTz(detected);
        } else {
          setTz(stored || detected);
        }
      }
    })();
  }, [user]);

  const handleToggle = async () => {
    if (state === "subscribed") {
      await unsubscribe();
      toast({ title: "Notifications disabled" });
      return;
    }
    const result = await subscribe();
    if (result.ok === true) {
      const detected = detectTimezone();
      if (user) {
        await supabase
          .from("profiles")
          .update({ notify_timezone: detected })
          .eq("id", user.id);
        setTz(detected);
      }
      toast({ title: "Notifications enabled", description: "You'll get a daily nudge summary on this device." });
      return;
    }


    console.error("[NotificationSettings] subscribe failed", result);

    switch (result.reason) {
      case "preview":
        toast({
          title: "Open the published app",
          description: "Push notifications only work on the published site (the-kinship.lovable.app), not the in-editor preview.",
        });
        break;
      case "permission-denied":
        toast({
          title: "Notifications are blocked",
          description: "Tap the lock icon in your browser's address bar and allow notifications for this site, then try again.",
          variant: "destructive",
        });
        break;
      case "permission-dismissed":
        toast({
          title: "Permission not granted",
          description: "You dismissed the prompt. Tap Enable again and choose Allow.",
        });
        break;
      case "no-vapid-key":
        toast({
          title: "Server not configured",
          description: "Push keys aren't set up on the server yet. Please contact support.",
          variant: "destructive",
        });
        break;
      case "sw-register-failed":
        toast({
          title: "Couldn't install background worker",
          description: result.message || "Service worker registration failed.",
          variant: "destructive",
        });
        break;
      case "subscribe-failed":
        toast({
          title: "Push subscription failed",
          description: result.message || "The browser's push service rejected the subscription.",
          variant: "destructive",
        });
        break;
      case "db-failed":
        toast({
          title: "Couldn't save subscription",
          description: result.message || "We got the push token but failed to save it.",
          variant: "destructive",
        });
        break;
      case "not-authenticated":
        toast({
          title: "Sign in first",
          description: "Log in before enabling notifications.",
          variant: "destructive",
        });
        break;
      case "unsupported":
      default:
        toast({
          title: "Not supported here",
          description: "This browser doesn't support push notifications. On iPhone, install the app to your Home Screen first.",
          variant: "destructive",
        });
    }
  };


  const saveSlot = async (value: string) => {
    const [hStr, mStr] = value.split(":");
    const newHour = parseInt(hStr, 10);
    const newMinute = parseInt(mStr, 10);
    setHour(newHour);
    setMinute(newMinute);
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        notify_hour: newHour,
        notify_minute: newMinute,
        notify_timezone: tz || detectTimezone(),
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast({ title: "Couldn't save", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved", description: `You'll be nudged around ${formatSlot(newHour, newMinute)} (${tz}).` });
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
  const showPreviewHint = isPreviewContext();

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
        <Select value={slotValue(hour, minute)} onValueChange={saveSlot} disabled={saving}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SLOTS.map((s) => (
              <SelectItem key={slotValue(s.hour, s.minute)} value={slotValue(s.hour, s.minute)} className="text-xs">
                {formatSlot(s.hour, s.minute)}
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

      {showPreviewHint && (
        <p className="text-[10px] text-muted-foreground leading-snug">
          You're in the editor preview — push only works in the published app. Open the-kinship.lovable.app on your phone.
        </p>
      )}

      {showIosHint && (
        <p className="text-[10px] text-muted-foreground leading-snug">
          On iPhone, add Kinship to your Home Screen first, then open it from there to enable notifications.
        </p>
      )}
    </div>
  );
}
