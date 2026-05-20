import { useState, type ComponentType } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useContact, useInteractions, useLifeEvents, useCreateLifeEvent, useUpdateContact, useContactTags, useAddContactTag, useRemoveContactTag } from "@/lib/hooks";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, MessageSquare, Phone, Video, Users, Calendar, Archive, Plus } from "lucide-react";
import { formatDistanceToNow, format, isPast, differenceInDays } from "date-fns";
import type { Database } from "@/integrations/supabase/types";
import TagPicker from "@/components/TagPicker";
import LogInteractionSheet from "@/components/LogInteractionSheet";
import { circleLabels } from "@/lib/constants";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

const interactionMeta: Record<string, { icon: ComponentType<{ className?: string }>; label: string }> = {
  texted: { icon: MessageSquare, label: "Texted" },
  called: { icon: Phone, label: "Called" },
  met_up: { icon: Users, label: "Met up" },
  video_call: { icon: Video, label: "Video call" },
  whatsapp: { icon: WhatsAppIcon, label: "WhatsApp" },
};

type InteractionType = Database["public"]["Enums"]["interaction_type"];

export default function ContactDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: contact, isLoading } = useContact(id!);
  const { data: interactions = [] } = useInteractions(id!);
  const { data: lifeEvents = [] } = useLifeEvents(id!);
  const { data: contactTagsData = [] } = useContactTags(id!);
  const createLifeEvent = useCreateLifeEvent();
  const updateContact = useUpdateContact();
  const addContactTag = useAddContactTag();
  const removeContactTag = useRemoveContactTag();

  const contactTagIds = contactTagsData.map((ct: any) => ct.tag_id);
  const contactTags = contactTagsData.map((ct: any) => ct.tags).filter(Boolean);

  const [eventForm, setEventForm] = useState({ title: "", description: "", month: "", day: "", recurring: false });
  const [eventType, setEventType] = useState<"birthday" | "anniversary" | "custom">("custom");
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

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    const eventDate = `2000-${eventForm.month.padStart(2, "0")}-${eventForm.day.padStart(2, "0")}`;
    await createLifeEvent.mutateAsync({
      contact_id: contact.id,
      title: eventForm.title,
      description: eventForm.description || undefined,
      event_date: eventDate,
      recurring: eventForm.recurring,
    });
    setEventForm({ title: "", description: "", month: "", day: "", recurring: false });
    setEventType("custom");
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
                  {format(new Date(event.event_date), "MMM d")}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
