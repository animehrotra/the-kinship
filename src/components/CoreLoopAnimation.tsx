import { useEffect, useState } from "react";
import { UserPlus, CalendarClock, Bell, CheckCircle2, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { label: "Add a contact", icon: UserPlus },
  { label: "Set frequency", icon: CalendarClock },
  { label: "Get nudged", icon: Bell },
  { label: "Log connection", icon: CheckCircle2 },
];

const STEP_MS = 2800;

export function CoreLoopAnimation() {
  const [step, setStep] = useState(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    if (mq.matches) return;
    const id = setInterval(() => setStep((s) => (s + 1) % STEPS.length), STEP_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col md:flex-row items-center justify-center gap-10 md:gap-16">
      {/* Phone frame */}
      <div className="relative shrink-0">
        <div
          className="relative w-[260px] h-[520px] rounded-[44px] border border-primary/20 bg-card overflow-hidden"
          style={{ boxShadow: "0 30px 60px -20px hsl(var(--primary) / 0.25), 0 10px 25px -10px hsl(0 0% 0% / 0.15)" }}
        >
          {/* Notch */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-5 rounded-full bg-foreground/80 z-20" />

          {/* Screens */}
          <div className="absolute inset-0 pt-10 px-4 pb-6">
            <ScreenAdd active={step === 0} />
            <ScreenFrequency active={step === 1} />
            <ScreenNudge active={step === 2} />
            <ScreenLog active={step === 3} />
          </div>

          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary/10">
            <div
              key={`${step}-${reduced}`}
              className="h-full bg-primary"
              style={{
                width: reduced ? "100%" : "0%",
                animation: reduced ? undefined : `coreLoopGrow ${STEP_MS}ms linear forwards`,
              }}
            />
          </div>
        </div>
        <style>{`@keyframes coreLoopGrow { from { width: 0% } to { width: 100% } }`}</style>
      </div>

      {/* Step labels */}
      <ol className="flex md:flex-col gap-2 md:gap-4 flex-wrap justify-center md:justify-start">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const active = i === step;
          return (
            <li
              key={s.label}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300",
                active ? "bg-primary/10" : "opacity-60"
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-md flex items-center justify-center transition-colors",
                  active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span
                className={cn(
                  "text-sm transition-colors",
                  active ? "font-semibold text-foreground" : "text-muted-foreground"
                )}
              >
                {i + 1}. {s.label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* ---------------- Mock screens ---------------- */

function ScreenWrap({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "absolute inset-0 pt-10 px-4 pb-6 transition-all duration-500",
        active ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
      )}
      aria-hidden={!active}
    >
      {children}
    </div>
  );
}

function ScreenAdd({ active }: { active: boolean }) {
  return (
    <ScreenWrap active={active}>
      <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">New contact</div>
      <div className="space-y-3">
        <div>
          <div className="text-[10px] text-muted-foreground mb-1">Name</div>
          <div className="h-9 rounded-md border border-border bg-background px-3 flex items-center text-sm">
            <span>Priya</span>
            {active && <span className="ml-0.5 inline-block w-[1px] h-4 bg-foreground animate-pulse" />}
          </div>
        </div>
        <div>
          <div className="text-[10px] text-muted-foreground mb-1">Circle</div>
          <div className="grid grid-cols-2 gap-2">
            {["Inner", "Close", "Casual", "Reconnect"].map((t) => (
              <div
                key={t}
                className={cn(
                  "h-8 rounded-md border text-xs flex items-center justify-center transition-all",
                  t === "Close"
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-border text-muted-foreground"
                )}
              >
                {t}
              </div>
            ))}
          </div>
        </div>
        <div className="h-9 rounded-md bg-primary text-primary-foreground text-sm flex items-center justify-center font-medium mt-4">
          Add contact
        </div>
      </div>
    </ScreenWrap>
  );
}

function ScreenFrequency({ active }: { active: boolean }) {
  return (
    <ScreenWrap active={active}>
      <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Cadence</div>
      <div className="rounded-lg border border-border p-3 space-y-3 bg-background">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center text-primary text-sm font-semibold">
            P
          </div>
          <div className="text-sm font-medium">Priya</div>
        </div>
        <div>
          <div className="text-[10px] text-muted-foreground mb-1">Reach out every</div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md border border-border flex items-center justify-center text-muted-foreground">−</div>
            <div className="flex-1 h-8 rounded-md border border-primary bg-primary/5 flex items-center justify-center text-sm font-semibold text-primary">
              <span
                key={active ? "two" : "one"}
                className={active ? "inline-block animate-[fade-in_0.4s_ease-out]" : ""}
              >
                {active ? "2 weeks" : "1 week"}
              </span>
            </div>
            <div className="w-8 h-8 rounded-md border border-primary bg-primary/10 flex items-center justify-center text-primary font-semibold">
              +
            </div>
          </div>
        </div>
        <div>
          <div className="text-[10px] text-muted-foreground mb-1">Nudge start date</div>
          <div className="h-8 rounded-md border border-border bg-background px-3 flex items-center text-xs">
            Today
          </div>
        </div>
      </div>
    </ScreenWrap>
  );
}

function ScreenNudge({ active }: { active: boolean }) {
  return (
    <ScreenWrap active={active}>
      <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Today</div>
      <div className="space-y-2 opacity-50">
        <div className="h-10 rounded-md bg-muted/50" />
        <div className="h-10 rounded-md bg-muted/50" />
      </div>
      <div
        className={cn(
          "absolute left-3 right-3 top-12 rounded-xl border border-primary/30 bg-card p-3 shadow-lg transition-all duration-500",
          active ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"
        )}
        style={{ boxShadow: "0 10px 30px -10px hsl(var(--primary) / 0.4)" }}
      >
        <div className="flex items-start gap-2">
          <div className="w-8 h-8 rounded-md bg-primary/15 flex items-center justify-center shrink-0">
            <Bell className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-foreground">Kinship</div>
            <div className="text-xs text-foreground leading-snug">
              Time to reach out to Priya
              <Heart className="inline-block w-3 h-3 ml-1 text-primary fill-primary" />
            </div>
            <div className="text-[10px] text-muted-foreground mt-1">now</div>
          </div>
        </div>
      </div>
    </ScreenWrap>
  );
}

function ScreenLog({ active }: { active: boolean }) {
  return (
    <ScreenWrap active={active}>
      <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Nudges</div>
      <div
        className={cn(
          "rounded-lg border border-border bg-background p-3 transition-all duration-700",
          active ? "translate-x-[110%] opacity-0" : "translate-x-0 opacity-100"
        )}
        style={{ transitionDelay: active ? "900ms" : "0ms" }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-primary text-xs font-semibold">
            P
          </div>
          <div className="text-sm font-medium flex-1">Priya</div>
          <div className="text-[10px] text-amber-600">Today</div>
        </div>
        <div
          className={cn(
            "h-8 rounded-md text-xs flex items-center justify-center font-medium transition-all",
            active ? "bg-primary text-primary-foreground scale-95" : "bg-primary/90 text-primary-foreground"
          )}
        >
          Log connection
        </div>
      </div>
      <div
        className={cn(
          "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2 transition-all duration-500",
          active ? "opacity-100 scale-100 delay-[1400ms]" : "opacity-0 scale-75"
        )}
      >
        <div className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-primary" />
        </div>
        <div className="text-xs text-muted-foreground">Logged · see you soon</div>
      </div>
    </ScreenWrap>
  );
}
