import { useState, useMemo } from "react";
import { useContacts, useUpcomingEvents } from "@/lib/hooks";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Clock, Calendar, Users, Bell, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow, isPast, isFuture, format } from "date-fns";
import { circleLabels, circleOptions } from "@/lib/constants";
import AddContactDialog from "@/components/AddContactDialog";
import { Button } from "@/components/ui/button";

export default function Index() {
  const { data: contacts = [], isLoading } = useContacts();
  const { data: upcomingEvents = [] } = useUpcomingEvents();
  const navigate = useNavigate();
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const overdueContacts = contacts
    .filter((c) => c.next_nudge_at && isPast(new Date(c.next_nudge_at)))
    .sort((a, b) => new Date(a.next_nudge_at!).getTime() - new Date(b.next_nudge_at!).getTime());

  const circleSummary = (() => {
    const now = new Date();
    const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);
    const groups: Record<string, { total: number; reached: number }> = {};
    for (const c of contacts) {
      if (!groups[c.circle]) groups[c.circle] = { total: 0, reached: 0 };
      groups[c.circle].total++;
      if (c.last_interaction_at && new Date(c.last_interaction_at) >= monthAgo) {
        groups[c.circle].reached++;
      }
    }
    return groups;
  })();

  if (isLoading) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <Heart className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-serif mb-2">Your inner circle starts here</h1>
        <p className="text-muted-foreground mb-6 max-w-sm">
          Add people you care about and Kinship will help you stay in touch.
        </p>
        <button
          onClick={() => setAddDialogOpen(true)}
          className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
        >
          Add someone
        </button>
        <AddContactDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-serif">Nudges</h1>

      {/* Circle Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {circleOptions.map(({ value: circle }) => {
          const stats = circleSummary[circle] || { total: 0, reached: 0 };
          return (
            <Card key={circle} className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{circleLabels[circle]}</span>
                </div>
                <p className="text-2xl font-serif">
                  {stats.reached}<span className="text-muted-foreground text-base font-sans"> / {stats.total}</span>
                </p>
                <p className="text-xs text-muted-foreground">reached this month</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Overdue */}
      {overdueContacts.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-amber" />
            <h2 className="font-medium">It's been a while</h2>
          </div>
          <div className="space-y-2">
            {overdueContacts.map((c) => (
              <Card
                key={c.id}
                className="border-border/50 cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98]"
                onClick={() => navigate(`/people/${c.id}`)}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber shrink-0" />
                      <span className="font-medium">{c.name}</span>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {circleLabels[c.circle]}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {c.last_interaction_at
                        ? `Last seen ${formatDistanceToNow(new Date(c.last_interaction_at), { addSuffix: true })}`
                        : "No interactions yet"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Upcoming Life Events */}
      {upcomingEvents.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-primary" />
            <h2 className="font-medium">Upcoming events</h2>
          </div>
          <div className="space-y-2">
            {upcomingEvents.map((event: any) => (
              <Card
                key={event.id}
                className="border-border/50 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => event.contacts?.id && navigate(`/people/${event.contacts.id}`)}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <span className="font-medium">{event.title}</span>
                    <p className="text-sm text-muted-foreground">
                      {event.contacts?.name} · {format(new Date(event.event_date), "MMM d")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
