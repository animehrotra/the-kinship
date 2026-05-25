import { useState } from "react";
import { useContacts, useDeleteContact, getContactStatus } from "@/lib/hooks";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Search, Pencil, Trash2, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { circleLabels, circleOptions, formatNudgeInterval, nudgeFrequencyLabels } from "@/lib/constants";
import AddContactDialog from "@/components/AddContactDialog";
import EditContactDialog from "@/components/EditContactDialog";
import type { Database } from "@/integrations/supabase/types";

type Contact = Database["public"]["Tables"]["contacts"]["Row"];

export default function People() {
  const { data: contacts = [], isLoading } = useContacts();
  const deleteContact = useDeleteContact();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [circleFilter, setCircleFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);

  const [editContact, setEditContact] = useState<Contact | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = contacts.filter((c) => {
    const matchName = c.name.toLowerCase().includes(search.toLowerCase());
    const matchCircle = circleFilter === "all" || c.circle === circleFilter;
    return matchName && matchCircle;
  });

  const handleDelete = async () => {
    if (deleteId) {
      await deleteContact.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-serif">People</h1>
        <AddContactDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          trigger={
            <Button size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" />
              Add someone
            </Button>
          }
        />
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
            {circleOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
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
            const status = getContactStatus(c);
            const dotColor = { "on-track": "bg-emerald", "overdue": "bg-amber", "drifting": "bg-red-500" }[status];
            return (
              <Card
                key={c.id}
                className="border-border/50 cursor-pointer hover:shadow-md transition-all active:scale-[0.98]"
                onClick={() => navigate(`/people/${c.id}`)}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
                      <span className="font-medium truncate">{c.name}</span>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                        {circleLabels[c.circle]}
                      </Badge>
                    </div>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground/80 mt-0.5 ml-4">
                      <Clock className="w-3 h-3 shrink-0" />
                      <span className="truncate">
                        {c.nudge_interval_value && c.nudge_interval_unit
                          ? formatNudgeInterval(c.nudge_interval_value, c.nudge_interval_unit)
                          : nudgeFrequencyLabels[c.nudge_frequency] || c.nudge_frequency}
                      </span>
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5 ml-4">
                      {c.last_interaction_at
                        ? formatDistanceToNow(new Date(c.last_interaction_at), { addSuffix: true })
                        : "No connections yet"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditContact(c);
                      }}
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteId(c.id);
                      }}
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit dialog */}
      {editContact && (
        <EditContactDialog
          contact={editContact}
          open={!!editContact}
          onOpenChange={(open) => { if (!open) setEditContact(null); }}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete contact?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this contact and all their connections, life events, and tags. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
