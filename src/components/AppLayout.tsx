import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { MobileNav } from "@/components/MobileNav";
import { FeedbackWidget } from "@/components/FeedbackWidget";

export function AppLayout() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!session) return <Navigate to="/auth" replace />;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <div className="hidden md:block">
          <AppSidebar />
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 flex items-center border-b px-4 bg-card/50 backdrop-blur-sm hidden md:flex">
            <SidebarTrigger />
          </header>
          <main className="flex-1 pb-16 md:pb-0">
            <Outlet />
          </main>
          <MobileNav />
        </div>
      </div>
    </SidebarProvider>
  );
}
