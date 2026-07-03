import { useState } from "react";
import { Heart, Users, Archive, LogOut, MessageSquare, Megaphone, HelpCircle, HeartHandshake } from "lucide-react";
import { NotificationSettings } from "@/components/NotificationSettings";
import { InviteFriendButton } from "@/components/InviteFriendButton";
import { FeedbackDialog } from "@/components/FeedbackWidget";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useUnreadFeedback } from "@/hooks/useUnreadFeedback";
import { useUnreadAppreciation } from "@/hooks/useUnreadAppreciation";
import { useOnboarding } from "@/lib/useOnboarding";
import { openSpontaneousAppreciation } from "@/hooks/useAppreciationPrompt";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Nudges", url: "/dashboard", icon: Heart },
  { title: "People", url: "/people", icon: Users },
  { title: "Archive", url: "/archive", icon: Archive },
];

const adminItems = [
  { title: "Feedback", url: "/admin/feedback", icon: MessageSquare },
  { title: "Appreciation ♥", url: "/admin/appreciation", icon: HeartHandshake },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { signOut, user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { count: unreadFeedback } = useUnreadFeedback();
  const { count: unreadAppreciation } = useUnreadAppreciation();
  const { replayTour } = useOnboarding();
  const navigate = useNavigate();
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  return (
    <Sidebar collapsible="icon">
      <div className={`p-4 ${collapsed ? "px-2" : ""} shrink-0`}>
        <div className="flex items-center gap-2">
          <img src="/favicon.png" alt="Kinship logo" className="w-8 h-8 rounded-xl shrink-0" />
          {!collapsed && <span className="font-serif text-lg tracking-tight">Kinship</span>}
        </div>
      </div>

      <SidebarGroup className="shrink-0">
        <SidebarGroupContent>
          <SidebarMenu data-tour="nav">
            {items.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <NavLink
                    to={item.url}
                    end={item.url === "/dashboard"}
                    className="hover:bg-sidebar-accent/50"
                    activeClassName="bg-sidebar-accent text-primary font-medium"
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {!collapsed && <span>{item.title}</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      {isAdmin && (
        <SidebarGroup className="shrink-0">
          {!collapsed && <SidebarGroupLabel>Admin</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span className="flex-1">{item.title}</span>}
                      {item.title === "Feedback" && unreadFeedback > 0 && (
                        <Badge
                          variant="destructive"
                          className={collapsed ? "absolute top-1 right-1 h-4 min-w-4 px-1 text-[10px]" : "ml-auto h-5 min-w-5 px-1.5 text-xs"}
                        >
                          {unreadFeedback > 99 ? "99+" : unreadFeedback}
                        </Badge>
                      )}
                      {item.title === "Appreciation ♥" && unreadAppreciation > 0 && (
                        <Badge
                          className={`bg-green-600 text-white ${collapsed ? "absolute top-1 right-1 h-4 min-w-4 px-1 text-[10px]" : "ml-auto h-5 min-w-5 px-1.5 text-xs"}`}
                        >
                          {unreadAppreciation > 99 ? "99+" : unreadAppreciation}
                        </Badge>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}

      <SidebarContent>
        {!collapsed && (
          <div className="px-2 my-2">
            <NotificationSettings />
          </div>
        )}
      </SidebarContent>

      <SidebarFooter className="p-2 shrink-0">
        <SidebarMenu>
          <SidebarMenuItem>
            <InviteFriendButton collapsed={collapsed} />
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => setFeedbackOpen(true)}
              className="text-muted-foreground hover:text-foreground"
            >
              <Megaphone className="mr-2 h-4 w-4" />
              {!collapsed && <span>Share feedback</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={openSpontaneousAppreciation}
              className="text-green-600 hover:text-green-700 hover:bg-green-50"
            >
              <HeartHandshake className="mr-2 h-4 w-4" />
              {!collapsed && <span>Share Love ♥</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={async () => {
                await replayTour();
                navigate("/dashboard");
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <HelpCircle className="mr-2 h-4 w-4" />
              {!collapsed && <span>Replay tour</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOut} className="text-muted-foreground hover:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              {!collapsed && <span>Sign out</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {!collapsed && user && (
          <p className="text-xs text-muted-foreground px-2 pt-1 truncate">{user.email}</p>
        )}
      </SidebarFooter>
      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </Sidebar>
  );
}
