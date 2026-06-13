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

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      const { data } = await supabase
        .from("feedback")
        .select("*")
        .order("created_at", { ascending: false });
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
      setLoading(false);
      markAllRead();
    })();
  }, [isAdmin, markAllRead]);

  const filtered = useMemo(
    () => (filter === "all" ? rows : rows.filter((r) => r.category === filter)),
    [rows, filter],
  );

  if (roleLoading) return <div className="p-6 text-muted-foreground">Loading…</div>;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-2xl tracking-tight">Feedback</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "entry" : "entries"}
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
      ) : filtered.length === 0 ? (
        <div className="text-muted-foreground py-12 text-center">No feedback yet.</div>
      ) : (
        <div className="rounded-lg border bg-card">
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
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
                      <Link
                        to={r.page_url}
                        className="text-primary underline underline-offset-2"
                      >
                        {r.page_url}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell
                    className="text-xs text-muted-foreground"
                    title={r.user_agent || ""}
                  >
                    {shortUA(r.user_agent)}
                    {r.viewport && ` · ${r.viewport}`}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground">
                    {r.app_version || "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
