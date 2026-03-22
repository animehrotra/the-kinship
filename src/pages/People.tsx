import { useState } from "react";
import { useContacts, useCreateContact, useAddContactTag } from "@/lib/hooks";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow, isPast } from "date-fns";
import type { Database } from "@/integrations/supabase/types";
import TagPicker from "@/components/TagPicker";
import { circleLabels, circleOptions } from "@/lib/constants";

type CircleTier = Database["public"]["Enums"]["circle_tier"];

export default function People() {
  const { data: contacts = [], isLoading } = useContacts();
  const createContact = useCreateContact();
  const addContactTag = useAddContactTag();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [circleFilter, setCircleFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);

  // New contact form
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    birthday: "",
    notes: "",
    circle: "others" as CircleTier,
    nudge_frequency: "monthly" as Database["public"]["Enums"]["nudge_frequency"],
  });
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  const filtered = contacts.filter((c) => {
    const matchName = c.name.toLowerCase().includes(search.toLowerCase());
    const matchCircle = circleFilter === "all" || c.circle === circleFilter;
    return matchName && matchCircle;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const newContact = await createContact.mutateAsync({
      name: form.name,
      phone: form.phone || null,
      email: form.email || null,
      birthday: form.birthday || null,
      notes: form.notes || null,
      circle: form.circle,
      nudge_frequency: form.nudge_frequency,
    });
    // Associate selected tags
    for (const tagId of selectedTagIds) {
      await addContactTag.mutateAsync({ contactId: newContact.id, tagId });
    }
    setForm({ name: "", phone: "", email: "", birthday: "", notes: "", circle: "extended", nudge_frequency: "monthly" });
    setSelectedTagIds([]);
    setDialogOpen(false);
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-serif">People</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" />
              Add someone
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add someone</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Circle *</Label>
                  <Select value={form.circle} onValueChange={(v) => setForm({ ...form, circle: v as CircleTier })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inner_circle">Inner Circle</SelectItem>
                      <SelectItem value="close_friends">Close Friends</SelectItem>
                      <SelectItem value="extended">Extended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Nudge every</Label>
                  <Select value={form.nudge_frequency} onValueChange={(v: any) => setForm({ ...form, nudge_frequency: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Week</SelectItem>
                      <SelectItem value="biweekly">2 Weeks</SelectItem>
                      <SelectItem value="monthly">Month</SelectItem>
                      <SelectItem value="quarterly">Quarter</SelectItem>
                    </SelectContent>
                  </Select>
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
                <Label>Birthday</Label>
                <div className="relative">
                  <Input
                    type="date"
                    value={form.birthday}
                    onChange={(e) => setForm({ ...form, birthday: e.target.value })}
                  />
                  {form.birthday && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, birthday: "" })}
                      className="absolute right-8 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted text-muted-foreground"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
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
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search people..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={circleFilter} onValueChange={setCircleFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Circles</SelectItem>
            <SelectItem value="inner_circle">Inner Circle</SelectItem>
            <SelectItem value="close_friends">Close Friends</SelectItem>
            <SelectItem value="extended">Extended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Contact Cards */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {contacts.length === 0 ? "No contacts yet. Add someone to get started!" : "No matches found."}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => {
            const overdue = c.next_nudge_at && isPast(new Date(c.next_nudge_at));
            return (
              <Card
                key={c.id}
                className="border-border/50 cursor-pointer hover:shadow-md transition-all active:scale-[0.98]"
                onClick={() => navigate(`/people/${c.id}`)}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${overdue ? "bg-amber" : "bg-emerald"}`} />
                      <span className="font-medium truncate">{c.name}</span>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                        {circleLabels[c.circle]}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5 ml-4">
                      {c.last_interaction_at
                        ? formatDistanceToNow(new Date(c.last_interaction_at), { addSuffix: true })
                        : "No interactions yet"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
