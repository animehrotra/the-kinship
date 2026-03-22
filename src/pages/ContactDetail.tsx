import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useContact, useInteractions, useLifeEvents, useLogInteraction, useCreateLifeEvent, useUpdateContact, useContactTags, useAddContactTag, useRemoveContactTag } from "@/lib/hooks";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, MessageSquare, Phone, Video, Users, Calendar, Archive, Plus } from "lucide-react";
import { formatDistanceToNow, format, isPast, differenceInDays } from "date-fns";
import type { Database } from "@/integrations/supabase/types";
import TagPicker from "@/components/TagPicker";

const circleLabels: Record<string, string> = {
  inner_circle: "Inner Circle",
  close_friends: "Close Friends",
  extended: "Extended",
};

const interactionMeta: Record<string, { icon: typeof MessageSquare; label: string }> = {
  texted: { icon: MessageSquare, label: "Texted" },
  called: { icon: Phone, label: "Called" },
  met_up: { icon: Users, label: "Met up" },
  video_call: { icon: Video, label: "Video call" },
};

type InteractionType = Database["public"]["Enums"]["interaction_type"];

export default function ContactDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: contact, isLoading } = useContact(id!);
  const { data: interactions = [] } = useInteractions(id!);
  const { data: lifeEvents = [] } = useLifeEvents(id!);
  const logInteraction = useLogInteraction();
  const createLifeEvent = useCreateLifeEvent();
  const updateContact = useUpdateContact();

  const [logType, setLogType] = useState<InteractionType>("texted");
  const [logSheetOpen, setLogSheetOpen] = useState(false);

  const [eventForm, setEventForm] = useState({ title: "", description: "", event_date: "", recurring: false });
  const [eventDialogOpen, setEventDialogOpen] = useState(false);

  if (isLoading || !contact) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="h-8 w-32 bg-muted animate-pulse rounded mb-4" />
        <div className="h-48 bg-muted animate-pulse rounded-xl" />
      </div>
    );
  }

  const overdue = contact.next_nudge_at && isPast(new Date(contact.next_nudge_at));
  const daysUntilNudge = contact.next_nudge_at
    ? differenceInDays(new Date(contact.next_nudge_at), new Date())
    : null;

  const handleLog = async () => {
    await logInteraction.mutateAsync({
      contactId: contact.id,
      type: logType,
      nudgeFrequency: contact.nudge_frequency,
    });
    setLogSheetOpen(false);
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    await createLifeEvent.mutateAsync({
      contact_id: contact.id,
      title: eventForm.title,
      description: eventForm.description || undefined,
      event_date: eventForm.event_date,
      recurring: eventForm.recurring,
    });
    setEventForm({ title: "", description: "", event_date: "", recurring: false });
    setEventDialogOpen(false);
  };

  const handleArchive = async () => {
    await updateContact.mutateAsync({ id: contact.id, archived: !contact.archived });
    navigate("/people");
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button
          onClick={() => navigate(-1)}
          className="mt-1 p-1.5 rounded-lg hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-serif truncate">{contact.name}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge variant="secondary">{circleLabels[contact.circle]}</Badge>
            {overdue && (
              <Badge className="bg-amber/15 text-amber-foreground border-amber/30 text-[10px]">
                Overdue
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Last seen</p>
            <p className="font-medium text-sm mt-0.5">
              {contact.last_interaction_at
                ? formatDistanceToNow(new Date(contact.last_interaction_at), { addSuffix: true })
                : "Never"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Next nudge</p>
            <p className="font-medium text-sm mt-0.5">
              {daysUntilNudge !== null
                ? daysUntilNudge <= 0
                  ? "Now"
                  : `In ${daysUntilNudge} days`
                : "Not set"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Contact info */}
      {(contact.phone || contact.email || contact.birthday) && (
        <Card className="border-border/50">
          <CardContent className="p-4 space-y-1.5 text-sm">
            {contact.phone && <p><span className="text-muted-foreground">Phone:</span> {contact.phone}</p>}
            {contact.email && <p><span className="text-muted-foreground">Email:</span> {contact.email}</p>}
            {contact.birthday && (
              <p><span className="text-muted-foreground">Birthday:</span> {format(new Date(contact.birthday), "MMM d, yyyy")}</p>
            )}
            {contact.notes && <p className="text-muted-foreground italic">{contact.notes}</p>}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Sheet open={logSheetOpen} onOpenChange={setLogSheetOpen}>
          <SheetTrigger asChild>
            <Button className="flex-1 gap-2">
              <MessageSquare className="w-4 h-4" />
              Log interaction
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl">
            <SheetHeader>
              <SheetTitle>Log interaction with {contact.name}</SheetTitle>
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

        <Button variant="outline" size="icon" onClick={handleArchive} title={contact.archived ? "Unarchive" : "Archive"}>
          <Archive className="w-4 h-4" />
        </Button>
      </div>

      {/* Interaction history */}
      {interactions.length > 0 && (
        <section>
          <h2 className="font-medium mb-3">History</h2>
          <div className="space-y-2">
            {interactions.slice(0, 10).map((i) => {
              const meta = interactionMeta[i.type];
              const Icon = meta?.icon || MessageSquare;
              return (
                <div key={i.id} className="flex items-center gap-3 text-sm py-1.5">
                  <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="font-medium">{meta?.label || i.type}</span>
                  <span className="text-muted-foreground ml-auto text-xs">
                    {format(new Date(i.created_at), "MMM d, yyyy")}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Life events */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium">Life events</h2>
          <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1">
                <Plus className="w-3.5 h-3.5" />
                Add
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Add life event</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddEvent} className="space-y-3">
                <div className="space-y-2">
                  <Label>What happened?</Label>
                  <Input
                    value={eventForm.title}
                    onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                    placeholder="Started new job, moved to NYC..."
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={eventForm.event_date}
                    onChange={(e) => setEventForm({ ...eventForm, event_date: e.target.value })}
                    required
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="recurring"
                    checked={eventForm.recurring}
                    onChange={(e) => setEventForm({ ...eventForm, recurring: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="recurring" className="text-sm">Recurring yearly (e.g. birthday)</Label>
                </div>
                <Button type="submit" className="w-full" disabled={createLifeEvent.isPending}>
                  {createLifeEvent.isPending ? "Saving..." : "Add event"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        {lifeEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No life events recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {lifeEvents.map((event) => (
              <div key={event.id} className="flex items-start gap-3 text-sm py-1.5">
                <Calendar className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium">{event.title}</span>
                  {event.description && <p className="text-muted-foreground text-xs">{event.description}</p>}
                </div>
                <span className="text-muted-foreground ml-auto text-xs shrink-0">
                  {format(new Date(event.event_date), "MMM d, yyyy")}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
