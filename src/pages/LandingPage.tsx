import { useEffect } from "react";
import { Heart, Users, Bell, ArchiveRestore, ArrowRight } from "lucide-react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";

const features = [
  {
    icon: Users,
    title: "Organize your circles",
    description:
      "Group the people who matter into Inner Circle, Friends, Family, Acquaintances, and more — so your energy always goes to the right people.",
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
      "Log calls, texts, meetups, and video chats. Every conversation remembered, so no one ever feels forgotten.",
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
    <div
      className="min-h-screen text-foreground relative"
      style={{
        backgroundImage:
          "linear-gradient(to bottom, hsl(30 25% 97.5%) 0%, hsl(30 30% 95.5%) 100%)",
      }}
    >
      {/* Subtle paper-grain texture overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 opacity-[0.045] mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.2  0 0 0 0 0.18  0 0 0 0 0.14  0 0 0 0.9 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        }}
      />
      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-6 pt-20 pb-16 text-center max-w-3xl mx-auto relative">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#e9ede9] mb-6">
          <Heart className="w-7 h-7 text-primary" />
        </div>
        <h2 className="font-serif tracking-tight mb-2 text-4xl text-[#55916b] font-thin">Kinship</h2>
        <h1 className="font-serif tracking-tight mb-4 text-3xl md:text-3xl">
          Never lose touch with the people you love
        </h1>
        <p className="text-lg text-muted-foreground max-w-lg mb-8">
          Life gets busy. People drift. Kinship quietly reminds you to show up — before the distance becomes too hard to close.
        </p>
        <button
          onClick={() => navigate("/auth")}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors text-base"
        >
          Start reconnecting <ArrowRight className="w-4 h-4" />
        </button>
      </section>

      {/* How it works */}
      <section className="px-6 pb-20 max-w-4xl mx-auto">
        <h2 className="uppercase tracking-widest text-muted-foreground text-center mb-10 font-sans text-xl font-bold">
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

      {/* Why Kinship — full-bleed sage band for section differentiation */}
      <section
        className="px-6 py-20 relative"
        style={{ backgroundColor: "hsl(140 18% 94%)" }}
      >
        <div className="max-w-3xl mx-auto">
          <h2 className="uppercase tracking-widest text-muted-foreground text-center mb-10 font-sans text-xl font-bold">
            Why Kinship
          </h2>
          <blockquote className="text-center">
            <p className="font-serif italic text-xl text-foreground leading-relaxed mb-4 opacity-90 font-medium md:text-xl">
              "The people we mean to call. The birthdays we almost forgot. The friends we keep saying we'll catch up with."
            </p>
            <footer className="text-muted-foreground">Kinship is for all of them.</footer>
          </blockquote>
        </div>
      </section>

      {/* Privacy */}
      <section className="px-6 pb-20 max-w-3xl mx-auto text-center">
        <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground mb-6">
          Your data. Your relationships.
        </h2>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          Private by design. Kinship will never sell your data, show you ads, or share your contacts with anyone.
        </p>
        <button
          onClick={() => navigate("/auth")}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors text-base"
        >
          Start reconnecting <ArrowRight className="w-4 h-4" />
        </button>
      </section>

      {/* Footer */}
      <section className="border-t border-border px-6 py-12 text-center">
        <p className="text-muted-foreground text-sm italic">
          Your relationships are private. So is your data.
        </p>
      </section>
    </div>
  );
}
