import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "@/hooks/use-toast";
import { Loader2, Mail } from "lucide-react";
import { NotificationToggle } from "@/components/NotificationToggle";

type Frequency = "daily" | "weekly";

const WEEKDAYS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

const HOURS = Array.from({ length: 24 }, (_, h) => ({
  value: h,
  label: new Date(2000, 0, 1, h, 0).toLocaleTimeString([], { hour: "numeric", hour12: true }),
}));

export default function ReminderSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [frequency, setFrequency] = useState<Frequency>("daily");
  const [hour, setHour] = useState(8);
  const [weekday, setWeekday] = useState(1);
  const [timezone, setTimezone] = useState("UTC");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setEmailEnabled(data.email_enabled);
        setFrequency(data.frequency as Frequency);
        setHour(data.preferred_hour);
        setWeekday(data.preferred_weekday);
        setTimezone(data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
      } else {
        setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
      }
      setLoading(false);
    })();
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    const { error } = await supabase.from("notification_preferences").upsert({
      user_id: user.id,
      email_enabled: emailEnabled,
      frequency,
      preferred_hour: hour,
      preferred_weekday: weekday,
      timezone: tz,
    });
    setTimezone(tz);
    setSaving(false);
    if (error) {
      toast({ title: "Couldn't save", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Reminder preferences saved" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="font-serif text-3xl tracking-tight">Reminders</h1>
        <p className="text-muted-foreground mt-1">
          Choose how and when Kinship nudges you to reach out.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Email reminders
          </CardTitle>
          <CardDescription>
            We'll email you a summary of who to reach out to, on your schedule.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="email-toggle" className="text-base">Send me reminder emails</Label>
            <Switch id="email-toggle" checked={emailEnabled} onCheckedChange={setEmailEnabled} />
          </div>

          {emailEnabled && (
            <>
              <div className="space-y-2">
                <Label>Cadence</Label>
                <Select value={frequency} onValueChange={(v) => setFrequency(v as Frequency)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily (only on days with nudges due)</SelectItem>
                    <SelectItem value="weekly">Weekly catch-up</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {frequency === "weekly" && (
                <div className="space-y-2">
                  <Label>Day of week</Label>
                  <Select value={String(weekday)} onValueChange={(v) => setWeekday(parseInt(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {WEEKDAYS.map((d) => (
                        <SelectItem key={d.value} value={String(d.value)}>{d.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Preferred time</Label>
                <Select value={String(hour)} onValueChange={(v) => setHour(parseInt(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {HOURS.map((h) => (
                      <SelectItem key={h.value} value={String(h.value)}>{h.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Your timezone: {timezone}
                </p>
              </div>
            </>
          )}

          <Button onClick={save} disabled={saving} className="w-full sm:w-auto">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save preferences
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Push notifications</CardTitle>
          <CardDescription>
            Get a browser notification on this device when nudges are due.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NotificationToggle />
        </CardContent>
      </Card>
    </div>
  );
}
