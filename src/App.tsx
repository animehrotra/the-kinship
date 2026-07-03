import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { AppLayout } from "@/components/AppLayout";
import LandingPage from "./pages/LandingPage";
import Index from "./pages/Index";
import People from "./pages/People";
import ContactDetail from "./pages/ContactDetail";
import ArchivePage from "./pages/ArchivePage";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import ResetPassword from "./pages/ResetPassword";
import AdminFeedback from "./pages/AdminFeedback";
import AdminAppreciation from "./pages/AdminAppreciation";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Settings from "./pages/Settings";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Index />} />
              <Route path="/people" element={<People />} />
              <Route path="/people/:id" element={<ContactDetail />} />
              <Route path="/archive" element={<ArchivePage />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/admin/feedback" element={<AdminFeedback />} />
              <Route path="/admin/appreciation" element={<AdminAppreciation />} />

            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
