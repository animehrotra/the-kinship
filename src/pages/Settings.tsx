import { Bell, CalendarClock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { NotificationSettings, UpcomingNudgesSettings } from "@/components/NotificationSettings";

export default function Settings() {
  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-serif">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your notification preferences.</p>
      </div>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-medium text-muted-foreground">Notifications</h2>
        </div>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <NotificationSettings bare />
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-medium text-muted-foreground">Upcoming nudges</h2>
        </div>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <UpcomingNudgesSettings bare />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
