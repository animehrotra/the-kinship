import { useState } from "react";
import { Check, Copy, Eye, EyeOff, Plug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const projectUrl = import.meta.env.VITE_SUPABASE_URL;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export function BackendConnectionPanel() {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState<"url" | "key" | null>(null);
  const { toast } = useToast();

  if (!projectUrl || !publishableKey) return null;

  async function copy(value: string, field: "url" | "key") {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(field);
      toast({ title: `${field === "url" ? "Project URL" : "Publishable key"} copied` });
      window.setTimeout(() => setCopied((current) => current === field ? null : current), 2000);
    } catch {
      toast({ title: "Couldn't copy", description: "Please select and copy the value manually.", variant: "destructive" });
    }
  }

  return (
    <section className="space-y-3" aria-labelledby="backend-connection-heading">
      <div className="flex items-center gap-2">
        <Plug className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <h2 id="backend-connection-heading" className="text-sm font-medium text-muted-foreground">Backend connection</h2>
      </div>
      <Card className="border-border/50">
        <CardContent className="space-y-4 p-4">
          <div className="space-y-2">
            <Label htmlFor="backend-project-url">Project URL</Label>
            <div className="flex min-w-0 gap-2">
              <Input id="backend-project-url" value={projectUrl} readOnly className="min-w-0 font-mono text-xs" onFocus={(event) => event.target.select()} />
              <Button variant="outline" size="icon" type="button" aria-label="Copy project URL" title="Copy project URL" onClick={() => copy(projectUrl, "url")}>
                {copied === "url" ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="backend-publishable-key">Publishable key</Label>
            <div className="flex min-w-0 gap-2">
              <Input id="backend-publishable-key" type={revealed ? "text" : "password"} value={publishableKey} readOnly className="min-w-0 font-mono text-xs" onFocus={(event) => event.target.select()} />
              <Button variant="outline" size="icon" type="button" aria-label={revealed ? "Hide publishable key" : "Show publishable key"} title={revealed ? "Hide publishable key" : "Show publishable key"} onClick={() => setRevealed((current) => !current)}>
                {revealed ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
              </Button>
              <Button variant="outline" size="icon" type="button" aria-label="Copy publishable key" title="Copy publishable key" onClick={() => copy(publishableKey, "key")}>
                {copied === "key" ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">These values are safe to use in client tools. Your data remains protected by access rules; sign in with your Kinship account to access it.</p>
          <p className="text-xs text-muted-foreground">The service role key and database password are not available on Lovable Cloud.</p>
        </CardContent>
      </Card>
    </section>
  );
}