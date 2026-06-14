import { useEffect, useMemo, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useUnreadFeedback } from "@/hooks/useUnreadFeedback";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type FeedbackRow = {
  id: string;
  user_id: string;
  category: string;
  message: string;
  page_url: string | null;
  user_agent: string | null;
  viewport: string | null;
  app_version: string | null;
  created_at: string;
  closed_at: string | null;
};

type Profile = { id: string; display_name: string | null };

function shortUA(ua: string | null) {
  if (!ua) return "—";
  const os = /iPhone|iPad/.test(ua)
    ? "iOS"
    : /Android/.test(ua)
    ? "Android"
    : /Mac OS X/.test(ua)
    ? "macOS"
    : /Windows/.test(ua)
    ? "Windows"
    : "Other";
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /Chrome\//.test(ua)
    ? "Chrome"
    : /Firefox\//.test(ua)
    ? "Firefox"
    : /Safari\//.test(ua)
    ? "Safari"
    : "Browser";
  return `${os} · ${browser}`;
}

export default function AdminFeedback() {
  const { isAdmin, loading: roleLoading } = useIsAdmin();
  const { markAllRead } = useUnreadFeedback();
  const [rows, setRows] = useState<FeedbackRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [closedOpen, setClosedOpen] = useState(false);

  const load = async () => {
    const { data, error } = await supabase
      .from("feedback")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Failed to load feedback:", error);
      setRows([]);
      return;
    }
    const list = (data as FeedbackRow[]) || [];
    setRows(list);
    const userIds = [...new Set(list.map((r) => r.user_id))];
    if (userIds.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", userIds);
      const map: Record<string, string> = {};
      (profs as Profile[] | null)?.forEach((p) => {
        map[p.id] = p.display_name || "Unknown";
      });
      setProfiles(map);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    (async () => {
      try {
        await load();
      } finally {
        if (!cancelled) {
          setLoading(false);
          markAllRead();
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const toggleClosed = async (row: FeedbackRow) => {
    const newClosedAt = row.closed_at ? null : new Date().toISOString();
    const { error } = await supabase
      .from("feedback")
      .update({ closed_at: newClosedAt })
      .eq("id", row.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, closed_at: newClosedAt } : r)));
    toast({ title: newClosedAt ? "Marked closed" : "Reopened" });
  };

  const { open, closed } = useMemo(() => {
    const filtered = filter === "all" ? rows : rows.filter((r) => r.category === filter);
    return {
      open: filtered.filter((r) => !r.closed_at),
      closed: filtered.filter((r) => !!r.closed_at),
    };
  }, [rows, filter]);

  if (roleLoading) return <div className="p-6 text-muted-foreground">Loading…</div>;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const renderTable = (list: FeedbackRow[], isClosed: boolean) => (
    <div className="rounded-lg border bg-card overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>From</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Message</TableHead>
            <TableHead>Page</TableHead>
            <TableHead>Device</TableHead>
            <TableHead>Version</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                {new Date(r.created_at).toLocaleString()}
              </TableCell>
              <TableCell className="text-sm">
                {profiles[r.user_id] || r.user_id.slice(0, 8)}
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{r.category}</Badge>
              </TableCell>
              <TableCell className="max-w-md whitespace-pre-wrap text-sm">
                {r.message}
              </TableCell>
              <TableCell className="text-xs">
                {r.page_url ? (
                  <Link to={r.page_url} className="text-primary underline underline-offset-2">
                    {r.page_url}
                  </Link>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground" title={r.user_agent || ""}>
                {shortUA(r.user_agent)}
                {r.viewport && ` · ${r.viewport}`}
              </TableCell>
              <TableCell className="text-xs font-mono text-muted-foreground">
                {r.app_version || "—"}
              </TableCell>
              <TableCell className="text-right">
                <Button size="sm" variant="outline" onClick={() => toggleClosed(r)}>
                  {isClosed ? "Reopen" : "Mark closed"}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-2xl tracking-tight">Feedback</h1>
          <p className="text-sm text-muted-foreground">
            {open.length} open · {closed.length} closed
          </p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            <SelectItem value="suggestion">Suggestion</SelectItem>
            <SelectItem value="bug">Bug Report</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-muted-foreground">Loading feedback…</div>
      ) : (
        <>
          <section className="space-y-2">
            <h2 className="text-sm font-medium text-muted-foreground">
              Open ({open.length})
            </h2>
            {open.length === 0 ? (
              <div className="text-muted-foreground py-8 text-center border rounded-lg bg-card">
                No open feedback.
              </div>
            ) : (
              renderTable(open, false)
            )}
          </section>

          <Collapsible open={closedOpen} onOpenChange={setClosedOpen}>
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                {closedOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                Closed ({closed.length})
                <span className="text-xs text-muted-foreground/70 font-normal">
                  · auto-deleted after 30 days
                </span>
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3">
              {closed.length === 0 ? (
                <div className="text-muted-foreground py-8 text-center border rounded-lg bg-card">
                  No closed feedback.
                </div>
              ) : (
                renderTable(closed, true)
              )}
            </CollapsibleContent>
          </Collapsible>
        </>
      )}
    </div>
  );
}
