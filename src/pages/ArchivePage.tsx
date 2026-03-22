import { useContacts, useUpdateContact } from "@/lib/hooks";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArchiveRestore } from "lucide-react";
import { circleLabels } from "@/lib/constants";

export default function ArchivePage() {
  const { data: contacts = [], isLoading } = useContacts(true);
  const updateContact = useUpdateContact();

  const handleRestore = async (id: string) => {
    await updateContact.mutateAsync({ id, archived: false });
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-serif">Archive</h1>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : contacts.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">No archived contacts.</p>
      ) : (
        <div className="space-y-2">
          {contacts.map((c) => (
            <Card key={c.id} className="border-border/50">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <span className="font-medium">{c.name}</span>
                  <Badge variant="secondary" className="ml-2 text-[10px] px-1.5 py-0">
                    {circleLabels[c.circle]}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-primary"
                  onClick={() => handleRestore(c.id)}
                >
                  <ArchiveRestore className="w-4 h-4" />
                  Restore
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
