import { useState } from "react";
import { Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

const categories = [
  { value: "suggestion", label: "Suggestion" },
  { value: "bug", label: "Bug Report" },
  { value: "other", label: "Other" },
];

export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("suggestion");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async () => {
    if (!message.trim() || !user) return;

    setSubmitting(true);
    const { error } = await supabase.from("feedback").insert({
      user_id: user.id,
      category,
      message: message.trim(),
    });
    setSubmitting(false);

    if (error) {
      toast.error("Failed to submit feedback");
      return;
    }

    toast.success("Thanks for your feedback!");
    setMessage("");
    setCategory("suggestion");
    setOpen(false);
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="icon"
        className="fixed bottom-20 right-4 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-xl hover:bg-primary/90 md:bottom-6"
        aria-label="Send feedback"
      >
        <Megaphone className="h-6 w-6" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Feedback</DialogTitle>
            <DialogDescription>
              Let us know how we can improve Kinship.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="feedback-category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="feedback-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedback-message">Message</Label>
              <Textarea
                id="feedback-message"
                placeholder="Tell us what's on your mind…"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={1000}
                rows={4}
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!message.trim() || submitting}
              className="w-full"
            >
              {submitting ? "Sending…" : "Submit"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
