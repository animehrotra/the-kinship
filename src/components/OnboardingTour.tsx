import { useEffect, useLayoutEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export type TourStep = {
  selector: string;
  title: string;
  body: string;
  /** Fallback message if the target isn't currently on screen. */
  fallback?: boolean;
};

const STEPS: TourStep[] = [
  {
    selector: '[data-tour="nav"]',
    title: "Your navigation",
    body: "Jump between Nudges (your dashboard), People, and Archive from here.",
    fallback: true,
  },
  {
    selector: '[data-tour="add-contact"]',
    title: "Add someone you care about",
    body: "Tap here to add a person and set how often you'd like to stay in touch.",
    fallback: true,
  },
  {
    selector: '[data-tour="nudges"]',
    title: "Your nudges",
    body: "We'll quietly remind you when it's time to reach out — based on the cadence you set per person.",
    fallback: true,
  },
];

type Rect = { top: number; left: number; width: number; height: number };

const PADDING = 8;

function getRect(el: Element): Rect {
  const r = el.getBoundingClientRect();
  return {
    top: r.top - PADDING,
    left: r.left - PADDING,
    width: r.width + PADDING * 2,
    height: r.height + PADDING * 2,
  };
}

export function OnboardingTour({
  open,
  onComplete,
  onSkip,
}: {
  open: boolean;
  onComplete: () => void;
  onSkip: () => void;
}) {
  const [stepIdx, setStepIdx] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [vw, setVw] = useState(typeof window !== "undefined" ? window.innerWidth : 0);
  const [vh, setVh] = useState(typeof window !== "undefined" ? window.innerHeight : 0);

  useEffect(() => {
    if (!open) setStepIdx(0);
  }, [open]);

  const step = STEPS[stepIdx];

  useLayoutEffect(() => {
    if (!open || !step) return;
    let raf = 0;
    const update = () => {
      // Multiple elements can share a data-tour attribute (mobile + desktop
      // variants of the same nav/button). Pick the one that is actually
      // visible so the spotlight lines up with what the user sees.
      const candidates = Array.from(
        document.querySelectorAll<HTMLElement>(step.selector),
      );
      const el = candidates.find((node) => {
        if (node.offsetParent === null && getComputedStyle(node).position !== "fixed") {
          return false;
        }
        const r = node.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      });
      if (el) {
        // scroll into view if needed
        const r = el.getBoundingClientRect();
        if (r.top < 60 || r.bottom > window.innerHeight - 60) {
          el.scrollIntoView({ block: "center", behavior: "smooth" });
        }
        setRect(getRect(el));
      } else {
        setRect(null);
      }
      setVw(window.innerWidth);
      setVh(window.innerHeight);
    };
    update();
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    const interval = window.setInterval(update, 400); // re-poll for late-mounted targets
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
      cancelAnimationFrame(raf);
      window.clearInterval(interval);
    };
  }, [open, step]);

  if (!open || !step) return null;

  const isLast = stepIdx === STEPS.length - 1;

  // Tooltip placement: prefer below the spotlight; if no room, place above; if no rect, center.
  let tooltipStyle: React.CSSProperties = {};
  if (rect) {
    const tooltipWidth = Math.min(320, vw - 24);
    const spaceBelow = vh - (rect.top + rect.height);
    const placeBelow = spaceBelow > 200 || rect.top < 160;
    const top = placeBelow ? rect.top + rect.height + 12 : Math.max(12, rect.top - 12);
    const left = Math.min(
      Math.max(12, rect.left + rect.width / 2 - tooltipWidth / 2),
      vw - tooltipWidth - 12,
    );
    tooltipStyle = {
      top,
      left,
      width: tooltipWidth,
      transform: placeBelow ? undefined : "translateY(-100%)",
    };
  } else {
    tooltipStyle = {
      top: "50%",
      left: "50%",
      width: Math.min(320, vw - 24),
      transform: "translate(-50%, -50%)",
    };
  }

  // SVG mask creates a cut-out for the spotlight target.
  return (
    <div className="fixed inset-0 z-[100]" aria-modal="true" role="dialog">
      <svg
        className="absolute inset-0 w-full h-full pointer-events-auto"
        onClick={onSkip}
      >
        <defs>
          <mask id="kinship-tour-mask">
            <rect width="100%" height="100%" fill="white" />
            {rect && (
              <rect
                x={rect.left}
                y={rect.top}
                width={rect.width}
                height={rect.height}
                rx={12}
                ry={12}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(15, 23, 42, 0.55)"
          mask="url(#kinship-tour-mask)"
        />
        {rect && (
          <rect
            x={rect.left}
            y={rect.top}
            width={rect.width}
            height={rect.height}
            rx={12}
            ry={12}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            className="pointer-events-none"
          />
        )}
      </svg>

      <div
        className="absolute bg-card text-card-foreground rounded-xl shadow-xl border border-border p-4 pointer-events-auto"
        style={tooltipStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground">
            Step {stepIdx + 1} of {STEPS.length}
          </span>
          <button
            onClick={onSkip}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Skip tour
          </button>
        </div>
        <h3 className="font-serif text-lg mb-1">{step.title}</h3>
        <p className="text-sm text-muted-foreground mb-3">{step.body}</p>
        <div className="flex justify-end gap-2">
          {stepIdx > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setStepIdx((i) => i - 1)}>
              Back
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => {
              if (isLast) onComplete();
              else setStepIdx((i) => i + 1);
            }}
          >
            {isLast ? "Done" : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
}
