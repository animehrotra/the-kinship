import { useState } from "react";
import { Heart, Users, Archive, Share2, LogOut, UserCircle, MessageSquare, Megaphone } from "lucide-react";
import { FeedbackDialog } from "@/components/FeedbackWidget";
import { NavLink } from "@/components/NavLink";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useUnreadFeedback } from "@/hooks/useUnreadFeedback";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";

const navItems = [
  { title: "Nudges", url: "/dashboard", icon: Heart },
  { title: "People", url: "/people", icon: Users },
  { title: "Archive", url: "/archive", icon: Archive },
];

const SHARE_URL = "https://the-kinship.lovable.app";
const SHARE_TITLE = "Kinship";
const SHARE_TEXT = "Never lose touch with the people you love";

export function MobileNav() {
  const { signOut, user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { count: unreadFeedback } = useUnreadFeedback();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title: SHARE_TITLE, text: SHARE_TEXT, url: SHARE_URL });
        return;
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(SHARE_URL);
      toast({ title: "Link copied", description: "Paste it anywhere to share Kinship with a friend." });
    } catch {
      toast({ title: "Couldn't copy link", description: SHARE_URL, variant: "destructive" });
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur-sm md:hidden">
      <div className="flex items-center justify-around h-14">
        {navItems.map((item) => (
          <NavLink
            key={item.title}
            to={item.url}
            end={item.url === "/dashboard"}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 text-muted-foreground transition-colors"
            activeClassName="text-primary"
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{item.title}</span>
          </NavLink>
        ))}

        <button
          type="button"
          onClick={handleShare}
          className="flex flex-col items-center gap-0.5 px-3 py-1.5 text-muted-foreground transition-colors hover:text-primary"
          aria-label="Invite a friend"
        >
          <Share2 className="h-5 w-5" />
          <span className="text-[10px] font-medium">Invite</span>
        </button>

        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className="relative flex flex-col items-center gap-0.5 px-3 py-1.5 text-muted-foreground transition-colors hover:text-primary"
              aria-label="More options"
            >
              <UserCircle className="h-5 w-5" />
              <span className="text-[10px] font-medium">More</span>
              {isAdmin && unreadFeedback > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute top-0 right-1 h-4 min-w-4 px-1 text-[10px]"
                >
                  {unreadFeedback > 99 ? "99+" : unreadFeedback}
                </Badge>
              )}
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl">
            <SheetHeader>
              <SheetTitle className="text-left">Account</SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-2">
              {user && (
                <p className="text-sm text-muted-foreground truncate pb-2">{user.email}</p>
              )}
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setFeedbackOpen(true);
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-foreground transition-colors hover:bg-muted"
              >
                <Megaphone className="h-5 w-5" />
                <span className="text-sm font-medium text-left">Send feedback</span>
              </button>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    navigate("/admin/feedback");
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-foreground transition-colors hover:bg-muted"
                >
                  <MessageSquare className="h-5 w-5" />
                  <span className="text-sm font-medium flex-1 text-left">Feedback</span>
                  {unreadFeedback > 0 && (
                    <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-xs">
                      {unreadFeedback > 99 ? "99+" : unreadFeedback}
                    </Badge>
                  )}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  signOut();
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-destructive transition-colors hover:bg-destructive/10"
              >
                <LogOut className="h-5 w-5" />
                <span className="text-sm font-medium">Sign out</span>
              </button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
