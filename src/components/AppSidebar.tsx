import { Heart, Users, Archive, LogOut, MessageSquare } from "lucide-react";
import { NotificationToggle } from "@/components/NotificationToggle";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
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
      </SidebarContent>

      <SidebarFooter className="p-2">
        {!collapsed && (
          <div className="px-2 mb-2">
            <NotificationToggle />
          </div>
        )}
        {!collapsed && user && (
          <p className="text-xs text-muted-foreground px-2 truncate mb-1">{user.email}</p>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOut} className="text-muted-foreground hover:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              {!collapsed && <span>Sign out</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
