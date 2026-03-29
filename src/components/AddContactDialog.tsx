import { useState } from "react";
import { useCreateContact, useAddContactTag, useCreateLifeEvent } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Plus, Trash2, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";
import TagPicker from "@/components/TagPicker";
import { circleOptions, intervalUnitOptions } from "@/lib/constants";

type CircleTier = Database["public"]["Enums"]["circle_tier"];

type LifeEventEntry = {
  type: "birthday" | "anniversary" | "custom";
  title: string;
  month: string;
  day: string;
  recurring: boolean;
};

function emptyLifeEvent(): LifeEventEntry {
  return { type: "birthday", title: "Birthday", month: "", day: "", recurring: true };
}

interface AddContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export default function AddContactDialog({ open, onOpenChange, trigger }: AddContactDialogProps) {
  const createContact = useCreateContact();
  const addContactTag = useAddContactTag();
  const createLifeEvent = useCreateLifeEvent();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    notes: "",
    circle: "others" as CircleTier,
    nudge_interval_value: 1,
    nudge_interval_unit: "month",
    nudge_start_date: undefined as Date | undefined,
    nudge_end_date: undefined as Date | undefined,
  });
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [lifeEvents, setLifeEvents] = useState<LifeEventEntry[]>([]);

  const resetForm = () => {
    setForm({
      name: "", phone: "", email: "", notes: "", circle: "others",
      nudge_interval_value: 1, nudge_interval_unit: "month",
      nudge_start_date: undefined, nudge_end_date: undefined,
    });
    setSelectedTagIds([]);
    setLifeEvents([]);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const newContact = await createContact.mutateAsync({
      name: form.name,
      phone: form.phone || null,
      email: form.email || null,
      notes: form.notes || null,
      circle: form.circle,
      nudge_frequency: "monthly", // keep legacy field
      nudge_interval_value: form.nudge_interval_value,
      nudge_interval_unit: form.nudge_interval_unit,
      nudge_start_date: form.nudge_start_date ? format(form.nudge_start_date, "yyyy-MM-dd") : null,
      nudge_end_date: form.nudge_end_date ? format(form.nudge_end_date, "yyyy-MM-dd") : null,
    });
    for (const tagId of selectedTagIds) {
      await addContactTag.mutateAsync({ contactId: newContact.id, tagId });
    }
    for (const le of lifeEvents) {
      if (le.month && le.day) {
        const eventDate = `2000-${le.month.padStart(2, "0")}-${le.day.padStart(2, "0")}`;
        await createLifeEvent.mutateAsync({
          contact_id: newContact.id,
          title: le.title,
          event_date: eventDate,
          recurring: le.recurring,
        });
      }
    }
    resetForm();
    onOpenChange(false);
  };

  const updateLifeEvent = (index: number, updates: Partial<LifeEventEntry>) => {
    setLifeEvents((prev) =>
      prev.map((le, i) => (i === index ? { ...le, ...updates } : le))
    );
  };

  const setLifeEventType = (index: number, type: LifeEventEntry["type"]) => {
    if (type === "birthday") {
      updateLifeEvent(index, { type, title: "Birthday", recurring: true });
    } else if (type === "anniversary") {
      updateLifeEvent(index, { type, title: "Anniversary", recurring: true });
    } else {
      updateLifeEvent(index, { type, title: "", recurring: false });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add someone</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>Circle *</Label>
            <Select value={form.circle} onValueChange={(v) => setForm({ ...form, circle: v as CircleTier })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {circleOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Nudge frequency: "Every X days/weeks/months" */}
          <div className="space-y-2">
            <Label>Nudge every *</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                min={1}
                max={365}
                value={form.nudge_interval_value}
                onChange={(e) => setForm({ ...form, nudge_interval_value: Math.max(1, parseInt(e.target.value) || 1) })}
                className="w-20"
              />
              <Select value={form.nudge_interval_unit} onValueChange={(v) => setForm({ ...form, nudge_interval_unit: v })}>
                <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {intervalUnitOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Optional start / end dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Start date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !form.nudge_start_date && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.nudge_start_date ? format(form.nudge_start_date, "MMM d, yyyy") : "Optional"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={form.nudge_start_date} onSelect={(d) => setForm({ ...form, nudge_start_date: d || undefined })} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>End date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !form.nudge_end_date && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.nudge_end_date ? format(form.nudge_end_date, "MMM d, yyyy") : "Optional"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={form.nudge_end_date} onSelect={(d) => setForm({ ...form, nudge_end_date: d || undefined })} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
          </div>

          {/* Life Events */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Life events</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1 h-7 text-xs"
                onClick={() => setLifeEvents([...lifeEvents, emptyLifeEvent()])}
              >
                <Plus className="w-3 h-3" /> Add
              </Button>
            </div>
            {lifeEvents.map((le, i) => (
              <div key={i} className="border border-border/50 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex gap-1.5">
                    {([
                      { key: "birthday", label: "🎂" },
                      { key: "anniversary", label: "💍" },
                      { key: "custom", label: "✏️" },
                    ] as const).map(({ key, label }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setLifeEventType(i, key)}
                        className={`px-2.5 py-1 rounded-md border text-sm transition-all ${
                          le.type === key
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/30"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setLifeEvents(lifeEvents.filter((_, j) => j !== i))}
                    className="p-1 rounded hover:bg-muted text-muted-foreground"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                {le.type === "custom" && (
                  <Input
                    placeholder="Event title"
                    value={le.title}
                    onChange={(e) => updateLifeEvent(i, { title: e.target.value })}
                    required
                  />
                )}
                <div className="grid grid-cols-2 gap-2">
                  <Select value={le.month} onValueChange={(v) => updateLifeEvent(i, { month: v })}>
                    <SelectTrigger><SelectValue placeholder="Month" /></SelectTrigger>
                    <SelectContent>
                      {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m, idx) => (
                        <SelectItem key={m} value={String(idx + 1)}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={le.day} onValueChange={(v) => updateLifeEvent(i, { day: v })}>
                    <SelectTrigger><SelectValue placeholder="Day" /></SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 31 }, (_, idx) => (
                        <SelectItem key={idx + 1} value={String(idx + 1)}>{idx + 1}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <TagPicker selectedTagIds={selectedTagIds} onChange={setSelectedTagIds} />
          </div>
          <Button type="submit" className="w-full" disabled={createContact.isPending}>
            {createContact.isPending ? "Adding..." : "Add to your circle"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
