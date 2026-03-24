import { useState } from "react";
import { useContacts } from "@/lib/hooks";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow, isPast } from "date-fns";
import { circleLabels, circleOptions } from "@/lib/constants";
import AddContactDialog from "@/components/AddContactDialog";

export default function People() {
  const { data: contacts = [], isLoading } = useContacts();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [circleFilter, setCircleFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);

  const filtered = contacts.filter((c) => {
    const matchName = c.name.toLowerCase().includes(search.toLowerCase());
    const matchCircle = circleFilter === "all" || c.circle === circleFilter;
    return matchName && matchCircle;
  });

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
