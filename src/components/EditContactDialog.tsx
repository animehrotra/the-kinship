import { useState, useEffect } from "react";
import { useUpdateContact } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";
import { circleOptions, intervalUnitOptions } from "@/lib/constants";

type CircleTier = Database["public"]["Enums"]["circle_tier"];
type Contact = Database["public"]["Tables"]["contacts"]["Row"];

interface EditContactDialogProps {
  contact: Contact;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditContactDialog({ contact, open, onOpenChange }: EditContactDialogProps) {
  const updateContact = useUpdateContact();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    notes: "",
    circle: "inner_circle" as CircleTier,
    nudge_interval_value: 1,
    nudge_interval_unit: "month",
    nudge_start_date: undefined as Date | undefined,
    nudge_end_date: undefined as Date | undefined,
  });

  useEffect(() => {
    if (open && contact) {
      setForm({
        name: contact.name,
        phone: contact.phone || "",
        email: contact.email || "",
        notes: contact.notes || "",
        circle: contact.circle,
        nudge_interval_value: contact.nudge_interval_value,
        nudge_interval_unit: contact.nudge_interval_unit,
        nudge_start_date: contact.nudge_start_date ? new Date(contact.nudge_start_date + "T00:00:00") : undefined,
        nudge_end_date: contact.nudge_end_date ? new Date(contact.nudge_end_date + "T00:00:00") : undefined,
      });
    }
  }, [open, contact]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateContact.mutateAsync({
      id: contact.id,
      name: form.name,
      phone: form.phone || null,
      email: form.email || null,
      notes: form.notes || null,
      circle: form.circle,
      nudge_interval_value: form.nudge_interval_value,
      nudge_interval_unit: form.nudge_interval_unit,
      nudge_start_date: form.nudge_start_date ? format(form.nudge_start_date, "yyyy-MM-dd") : null,
      nudge_end_date: form.nudge_end_date ? format(form.nudge_end_date, "yyyy-MM-dd") : null,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit contact</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-4">
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

          <div className="space-y-2">
            <Label>Nudge every *</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                max={365}
                value={Number.isFinite(form.nudge_interval_value) ? form.nudge_interval_value : ""}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === "") {
                    setForm({ ...form, nudge_interval_value: NaN as unknown as number });
                  } else {
                    const n = parseInt(raw, 10);
                    setForm({ ...form, nudge_interval_value: Number.isNaN(n) ? (NaN as unknown as number) : n });
                  }
                }}
                onBlur={(e) => {
                  const n = parseInt(e.target.value, 10);
                  setForm({ ...form, nudge_interval_value: Number.isNaN(n) ? 1 : Math.min(365, Math.max(1, n)) });
                }}
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Nudge Start Date</Label>
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

          <Button type="submit" className="w-full" disabled={updateContact.isPending}>
            {updateContact.isPending ? "Saving..." : "Save changes"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
