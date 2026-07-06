import { Share2 } from "lucide-react";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";

const SHARE_URL = "https://the-kinship.lovable.app";
const SHARE_TITLE = "Kinship";
const SHARE_TEXT = "Never lose touch with the people you love";

interface InviteFriendButtonProps {
  collapsed?: boolean;
  variant?: "sidebar" | "mobile";
}

export function InviteFriendButton({ collapsed, variant = "sidebar" }: InviteFriendButtonProps) {
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

  if (variant === "mobile") {
    return (
      <button
        type="button"
        onClick={handleShare}
        className="flex flex-col items-center gap-0.5 px-3 py-1.5 text-muted-foreground transition-colors hover:text-primary"
        aria-label="Invite a friend"
      >
        <Share2 className="h-5 w-5" />
        <span className="text-[10px] font-medium">Invite</span>
      </button>
    );
  }

  return (
    <SidebarMenuButton
      onClick={handleShare}
      className="text-muted-foreground hover:text-foreground"
    >
      <Share2 className="mr-2 h-4 w-4" />
      {!collapsed && <span>Invite a Friend</span>}
    </SidebarMenuButton>
  );
}
