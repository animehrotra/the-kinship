import { useState } from "react";
import { Heart, Users, Archive, LogOut, MessageSquare, Megaphone } from "lucide-react";
import { NotificationSettings } from "@/components/NotificationSettings";
import { InviteFriendButton } from "@/components/InviteFriendButton";
import { FeedbackDialog } from "@/components/FeedbackWidget";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useUnreadFeedback } from "@/hooks/useUnreadFeedback";
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
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { signOut, user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { count: unreadFeedback } = useUnreadFeedback();
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className={`p-4 ${collapsed ? "px-2" : ""}`}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Heart className="w-4 h-4 text-primary" />
            </div>
            {!collapsed && <span className="font-serif text-lg tracking-tight">Kinship</span>}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
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
          <SidebarGroup>
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
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-2">
        {!collapsed && (
          <div className="px-2 my-2">
            <NotificationSettings />
          </div>
        )}
        {!collapsed && user && (
          <p className="text-xs text-muted-foreground px-2 truncate mb-1">{user.email}</p>
        )}
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
            <SidebarMenuButton onClick={signOut} className="text-muted-foreground hover:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              {!collapsed && <span>Sign out</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </Sidebar>
  );
}
