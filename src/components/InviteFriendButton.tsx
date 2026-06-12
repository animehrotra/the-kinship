import { Share2 } from "lucide-react";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";

const SHARE_URL = "https://the-kinship.lovable.app";
const SHARE_TITLE = "Kinship";
const SHARE_TEXT = "Never lose touch with the people you love";

interface InviteFriendButtonProps {
  collapsed?: boolean;
}

export function InviteFriendButton({ collapsed }: InviteFriendButtonProps) {
  const { toast } = useToast();

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title: SHARE_TITLE, text: SHARE_TEXT, url: SHARE_URL });
        return;
      } catch (err) {
        // User cancelled or share failed; fall through to clipboard fallback only on failure
        if ((err as Error)?.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(SHARE_URL);
      toast({
        title: "Link copied",
        description: "Paste it anywhere to share Kinship with a friend.",
      });
    } catch {
      toast({
        title: "Couldn't copy link",
        description: SHARE_URL,
        variant: "destructive",
      });
    }
  };

  return (
    <SidebarMenuButton
      onClick={handleShare}
      className="text-muted-foreground hover:text-foreground"
    >
      <Share2 className="mr-2 h-4 w-4" />
      {!collapsed && <span>Invite a friend</span>}
    </SidebarMenuButton>
  );
}
