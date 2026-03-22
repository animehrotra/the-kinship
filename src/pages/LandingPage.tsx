import { useEffect } from "react";
import { Heart, Users, Bell, ArchiveRestore, ArrowRight } from "lucide-react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";

const features = [
  {
    icon: Users,
    title: "Organize your circles",
    description:
      "Group the people who matter into Inner Circle, Close Friends, and Extended — so you know where to focus.",
  },
  {
    icon: Bell,
    title: "Timely nudges",
    description:
      "Set a cadence for each person. Kinship gently reminds you when it's time to reach out.",
  },
  {
    icon: ArchiveRestore,
    title: "Track every touchpoint",
    description:
      "Log calls, texts, meetups, and video chats. See your relationship history at a glance.",
  },
];

export default function LandingPage() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (window.location.hash.includes("access_token")) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (session) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-6 pt-20 pb-16 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-6">
          <Heart className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-4xl md:text-5xl font-serif tracking-tight mb-4">
          Nurture the relationships&nbsp;that&nbsp;matter
        </h1>
        <p className="text-lg text-muted-foreground max-w-lg mb-8">
          Life gets busy, friendships fade. Kinship is a personal CRM that helps you stay close to the people you care about — with gentle reminders, not guilt.
        </p>
        <button
          onClick={() => navigate("/auth")}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors text-base"
        >
          Get started <ArrowRight className="w-4 h-4" />
        </button>
      </section>

      {/* How it works */}
      <section className="px-6 pb-20 max-w-4xl mx-auto">
        <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground text-center mb-10">
          How it works
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {features.map((f) => (
            <div key={f.title} className="flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <f.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-medium text-base">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="border-t border-border px-6 py-12 text-center">
        <p className="text-muted-foreground text-sm">
          Free &amp; private. Your data stays yours.
        </p>
      </section>
    </div>
  );
}