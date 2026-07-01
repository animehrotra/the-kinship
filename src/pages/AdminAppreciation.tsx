import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";

type AppreciationRow = {
  id: string;
  user_id: string;
  sentiment: string;
  response_text: string | null;
  source: string;
  is_testimonial_candidate: boolean;
  created_at: string;
};

type Profile = { id: string; display_name: string | null };

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function sourceBadge(source: string) {
  if (source === "spontaneous") {
    return <Badge className="bg-green-100 text-green-800 border-green-200">💚 Spontaneous</Badge>;
  }
  const label = source.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return <Badge className="bg-amber-100 text-amber-800 border-amber-200">🔔 {label}</Badge>;
}

function sentimentBadge(sentiment: string) {
  if (sentiment === "positive") {
    return <Badge className="bg-green-100 text-green-800 border-green-200">♥ Loved it</Badge>;
  }
  return <Badge variant="secondary" className="bg-stone-100 text-stone-600">Not really</Badge>;
}

export default function AdminAppreciation() {
  const { isAdmin, loading: roleLoading } = useIsAdmin();
  const [rows, setRows] = useState<AppreciationRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await (supabase.from("appreciation_responses") as any)
          .select("*")
          .order("created_at", { ascending: false });
        if (error) {
          console.error("Failed to load appreciation responses:", error);
          setRows([]);
          return;
        }
        const list = (data as AppreciationRow[]) || [];
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

        localStorage.setItem("last_viewed_appreciation_at", new Date().toISOString());
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isAdmin]);

  const toggleTestimonial = async (row: AppreciationRow) => {
    const newVal = !row.is_testimonial_candidate;
    const { error } = await (supabase.from("appreciation_responses") as any)
      .update({ is_testimonial_candidate: newVal })
      .eq("id", row.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setRows((rs) => rs.map((r) => r.id === row.id ? { ...r, is_testimonial_candidate: newVal } : r));
  };

  if (roleLoading) return <div className="p-6 text-muted-foreground">Loading…</div>;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const totalResponses = rows.length;
  const positiveCount = rows.filter((r) => r.sentiment === "positive").length;
  const spontaneousCount = rows.filter((r) => r.source === "spontaneous").length;
  const testimonialCount = rows.filter((r) => r.is_testimonial_candidate).length;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="font-serif text-2xl tracking-tight">Appreciation ♥</h1>
        <p className="text-sm text-muted-foreground mt-1">
          See how Kinship is making a difference
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-lg border bg-card p-4 text-center">
          <p className="text-2xl font-semibold">{totalResponses}</p>
          <p className="text-xs text-muted-foreground mt-1">Total Responses</p>
        </div>
        <div className="rounded-lg border bg-card p-4 text-center">
          <p className="text-2xl font-semibold text-green-600">{positiveCount}</p>
          <p className="text-xs text-muted-foreground mt-1">Positive</p>
        </div>
        <div className="rounded-lg border bg-card p-4 text-center">
          <p className="text-2xl font-semibold">{spontaneousCount}</p>
          <p className="text-xs text-muted-foreground mt-1">Spontaneous</p>
        </div>
        <div className="rounded-lg border bg-card p-4 text-center">
          <p className="text-2xl font-semibold text-amber-600">{testimonialCount}</p>
          <p className="text-xs text-muted-foreground mt-1">Testimonial Candidates</p>
        </div>
      </div>

      {loading ? (
        <div className="text-muted-foreground">Loading appreciation responses…</div>
      ) : rows.length === 0 ? (
        <div className="text-muted-foreground py-12 text-center border rounded-lg bg-card">
          No appreciation responses yet. Keep nurturing those relationships ♥
        </div>
      ) : (
        <div className="rounded-lg border bg-card overflow-x-auto">
          <Table className="min-w-[700px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Date</TableHead>
                <TableHead className="w-[120px]">User</TableHead>
                <TableHead className="w-[140px]">Source</TableHead>
                <TableHead className="w-[120px]">Sentiment</TableHead>
                <TableHead>Message</TableHead>
                <TableHead className="w-[100px] text-center">Testimonial</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {formatDate(r.created_at)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm">
                    {profiles[r.user_id] || r.user_id.slice(0, 8)}
                  </TableCell>
                  <TableCell>{sourceBadge(r.source)}</TableCell>
                  <TableCell>{sentimentBadge(r.sentiment)}</TableCell>
                  <TableCell className="text-sm whitespace-pre-wrap">
                    {r.response_text || <span className="text-muted-foreground italic">No message</span>}
                  </TableCell>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={r.is_testimonial_candidate}
                      onCheckedChange={() => toggleTestimonial(r)}
                    />
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
