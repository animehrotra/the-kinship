import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { releases } from "@/lib/releases";

type Props = {
  userId: string;
  accountCreatedAt: string;
  lastSeenRelease: string | null;
};

export function WhatsNewBanner({ userId, accountCreatedAt, lastSeenRelease }: Props) {
  const navigate = useNavigate();
  const [hidden, setHidden] = useState(false);
  const [saving, setSaving] = useState(false);
  const accountDate = accountCreatedAt.slice(0, 10);
  const unseen = releases
    .filter((release) => release.date >= accountDate && (!lastSeenRelease || release.id > lastSeenRelease))
    .slice(0, 3);

  if (hidden || unseen.length === 0) return null;

  const dismiss = async (link?: string) => {
    if (saving) return;
    setSaving(true);
    // Hide for this visit even if the write fails; next page load will retry.
    setHidden(true);
    try {
      await supabase.from("profiles").update({ last_seen_release: unseen[0].id }).eq("id", userId);
    } catch {
      // Deliberately silent: the next dashboard load can offer the release again.
    } finally {
      setSaving(false);
      if (link) navigate(link);
    }
  };

  return (
    <Card role="region" aria-label="What's new in Kinship" className="border-primary/30 p-4 sm:p-5">
      <h2 className="font-serif text-xl mb-2">What's new</h2>
      <div className="divide-y divide-border">
        {unseen.map((release) => (
          <div key={release.id} className="py-3 first:pt-0 last:pb-0">
            <h3 className="font-semibold text-sm">{release.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{release.description}</p>
            {release.link && (
              <div className="flex justify-end mt-2">
                <Button size="sm" variant="link" onClick={() => void dismiss(release.link)} disabled={saving}>
                  Take me there
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-end mt-3 pt-3 border-t">
        <Button size="sm" variant="outline" onClick={() => void dismiss()} disabled={saving}>Got it</Button>
      </div>
    </Card>
  );
}
