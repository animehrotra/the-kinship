import { useState, type ComponentType } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useContact, useInteractions, useLifeEvents, useCreateLifeEvent, useUpdateLifeEvent, useDeleteLifeEvent, useUpdateContact, useDeleteContact, useContactTags, useAddContactTag, useRemoveContactTag } from "@/lib/hooks";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ArrowLeft, MessageSquare, Phone, Video, Users, Calendar, Archive, Plus, Share2, Pencil, Trash2 } from "lucide-react";
import { formatDistanceToNow, format, isPast, differenceInDays } from "date-fns";
import TagPicker from "@/components/TagPicker";
import LogInteractionSheet from "@/components/LogInteractionSheet";
import { circleLabels } from "@/lib/constants";

const interactionMeta: Record<string, { icon: ComponentType<{ className?: string }>; label: string }> = {
  texted: { icon: MessageSquare, label: "Texted" },
  social: { icon: Share2, label: "Social" },
  called: { icon: Phone, label: "Called" },
  video_call: { icon: Video, label: "Video call" },
  met_up: { icon: Users, label: "Met up" },
};

export default function ContactDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: contact, isLoading } = useContact(id!);
  const { data: interactions = [] } = useInteractions(id!);
  const { data: lifeEvents = [] } = useLifeEvents(id!);
  const { data: contactTagsData = [] } = useContactTags(id!);
  const createLifeEvent = useCreateLifeEvent();
  const updateLifeEvent = useUpdateLifeEvent();
  const deleteLifeEvent = useDeleteLifeEvent();
  const updateContact = useUpdateContact();
  const addContactTag = useAddContactTag();
  const removeContactTag = useRemoveContactTag();

  const contactTagIds = contactTagsData.map((ct: any) => ct.tag_id);
  const contactTags = contactTagsData.map((ct: any) => ct.tags).filter(Boolean);

  const [eventForm, setEventForm] = useState({ title: "", description: "", month: "", day: "", recurring: false });
  const [eventType, setEventType] = useState<"birthday" | "anniversary" | "custom">("custom");
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [deleteEventId, setDeleteEventId] = useState<string | null>(null);
  const [eventError, setEventError] = useState<string | null>(null);

  const hasBirthdayEvent = lifeEvents.some(
    (e) => e.title === "Birthday" && e.id !== editingEventId
  );

  const resetEventForm = () => {
    setEventForm({ title: "", description: "", month: "", day: "", recurring: false });
    setEventType("custom");
    setEditingEventId(null);
    setEventError(null);
  };

  const openEditDialog = (event: typeof lifeEvents[number]) => {
    const date = new Date(event.event_date + "T00:00:00");
    const type: "birthday" | "anniversary" | "custom" =
      event.title === "Birthday" ? "birthday" : event.title === "Anniversary" ? "anniversary" : "custom";
    setEventType(type);
    setEventForm({
      title: event.title,
      description: event.description || "",
      month: String(date.getMonth() + 1),
      day: String(date.getDate()),
      recurring: !!event.recurring,
    });
    setEditingEventId(event.id);
    setEventError(null);
    setEventDialogOpen(true);
  };

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

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (eventType === "birthday" && hasBirthdayEvent) {
      setEventError("A birthday has already been added for this contact");
      return;
    }
    const eventDate = `2000-${eventForm.month.padStart(2, "0")}-${eventForm.day.padStart(2, "0")}`;
    if (editingEventId) {
      await updateLifeEvent.mutateAsync({
        id: editingEventId,
        contact_id: contact.id,
        title: eventForm.title,
        description: eventForm.description || null,
        event_date: eventDate,
        recurring: eventForm.recurring,
      });
    } else {
      await createLifeEvent.mutateAsync({
        contact_id: contact.id,
        title: eventForm.title,
        description: eventForm.description || undefined,
        event_date: eventDate,
        recurring: eventForm.recurring,
      });
    }
    resetEventForm();
    setEventDialogOpen(false);
  };

  const handleDeleteEvent = async () => {
    if (deleteEventId) {
      await deleteLifeEvent.mutateAsync({ id: deleteEventId, contact_id: contact.id });
      setDeleteEventId(null);
    }
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
            {contactTags.map((tag: any) => (
              <Badge
                key={tag.id}
                variant="secondary"
                className="text-[10px]"
                style={tag.color ? { backgroundColor: tag.color, color: "#fff" } : undefined}
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Tags management */}
      <TagPicker
        selectedTagIds={contactTagIds}
        onChange={async (newTagIds) => {
          const added = newTagIds.filter((id) => !contactTagIds.includes(id));
          const removed = contactTagIds.filter((id: string) => !newTagIds.includes(id));
          for (const tagId of added) {
            await addContactTag.mutateAsync({ contactId: contact.id, tagId });
          }
          for (const tagId of removed) {
            await removeContactTag.mutateAsync({ contactId: contact.id, tagId });
          }
        }}
      />

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
        <LogInteractionSheet
          contactId={contact.id}
          contactName={contact.name}
          nudgeFrequency={contact.nudge_frequency}
          intervalValue={contact.nudge_interval_value}
          intervalUnit={contact.nudge_interval_unit}
          trigger={
            <Button className="flex-1 gap-2">
              <MessageSquare className="w-4 h-4" />
              Log connection
            </Button>
          }
        />

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
          <Dialog
            open={eventDialogOpen}
            onOpenChange={(open) => {
              setEventDialogOpen(open);
              if (!open) resetEventForm();
            }}
          >
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1">
                <Plus className="w-3.5 h-3.5" />
                Add
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>{editingEventId ? "Edit life event" : "Add life event"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddEvent} className="space-y-3">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <div className="flex gap-2">
                    {([
                      { key: "birthday", label: "🎂 Birthday" },
                      { key: "anniversary", label: "💍 Anniversary" },
                      { key: "custom", label: "✏️ Custom" },
                    ] as const).map(({ key, label }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setEventType(key);
                          setEventError(null);
                          if (key === "birthday") {
                            setEventForm({ ...eventForm, title: "Birthday", recurring: true });
                          } else if (key === "anniversary") {
                            setEventForm({ ...eventForm, title: "Anniversary", recurring: true });
                          } else {
                            setEventForm({ ...eventForm, title: "", recurring: false });
                          }
                        }}
                        className={`flex-1 px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                          eventType === key
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/30"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  {eventType === "birthday" && hasBirthdayEvent && !eventError && (
                    <p className="text-xs text-destructive">A birthday has already been added for this contact</p>
                  )}
                  {eventError && (
                    <p className="text-xs text-destructive" role="alert">{eventError}</p>
                  )}
                </div>
                {eventType === "custom" && (
                  <div className="space-y-2">
                    <Label>What happened?</Label>
                    <Input
                      value={eventForm.title}
                      onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                      placeholder="Started new job, moved to NYC..."
                      required
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Date</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={eventForm.month} onValueChange={(v) => setEventForm({ ...eventForm, month: v })}>
                      <SelectTrigger><SelectValue placeholder="Month" /></SelectTrigger>
                      <SelectContent>
                        {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m, idx) => (
                          <SelectItem key={m} value={String(idx + 1)}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={eventForm.day} onValueChange={(v) => setEventForm({ ...eventForm, day: v })}>
                      <SelectTrigger><SelectValue placeholder="Day" /></SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 31 }, (_, idx) => (
                          <SelectItem key={idx + 1} value={String(idx + 1)}>{idx + 1}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {eventType === "custom" && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="recurring"
                      checked={eventForm.recurring}
                      onChange={(e) => setEventForm({ ...eventForm, recurring: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor="recurring" className="text-sm">Recurring yearly</Label>
                  </div>
                )}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={
                    createLifeEvent.isPending ||
                    updateLifeEvent.isPending ||
                    (eventType === "birthday" && hasBirthdayEvent)
                  }
                >
                  {createLifeEvent.isPending || updateLifeEvent.isPending
                    ? "Saving..."
                    : editingEventId
                      ? "Save changes"
                      : "Add event"}
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
              <div key={event.id} className="flex items-start gap-3 text-sm py-1.5 group">
                <Calendar className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <span className="font-medium">{event.title}</span>
                  {event.description && <p className="text-muted-foreground text-xs">{event.description}</p>}
                </div>
                <span className="text-muted-foreground text-xs shrink-0 self-center">
                  {format(new Date(event.event_date), "MMM d")}
                </span>
                <div className="flex items-center gap-0.5 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => openEditDialog(event)}
                    title="Edit event"
                    aria-label={`Edit ${event.title}`}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => setDeleteEventId(event.id)}
                    title="Delete event"
                    aria-label={`Delete ${event.title}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <AlertDialog open={!!deleteEventId} onOpenChange={(open) => { if (!open) setDeleteEventId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this event?</AlertDialogTitle>
            <AlertDialogDescription>
              This life event will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEvent} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
