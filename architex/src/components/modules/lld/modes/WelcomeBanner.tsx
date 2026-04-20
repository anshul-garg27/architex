"use client";

import { memo, useEffect } from "react";
import { X } from "lucide-react";
import { useUIStore, type LLDMode } from "@/stores/ui-store";
import {
  track,
  lldWelcomeBannerDismissed,
  lldWelcomeBannerShown,
} from "@/lib/analytics/lld-events";
import { cn } from "@/lib/utils";

interface PathChoice {
  mode: LLDMode;
  icon: string;
  label: string;
  description: string;
  accent: string;
}

const PATHS: readonly PathChoice[] = [
  {
    mode: "learn",
    icon: "📖",
    label: "Teach me",
    description: "Start with guided lessons",
    accent: "emerald",
  },
  {
    mode: "build",
    icon: "🎨",
    label: "Let me build",
    description: "Open canvas, explore freely",
    accent: "blue",
  },
  {
    mode: "drill",
    icon: "⏱",
    label: "Drill me",
    description: "Timed interview problems",
    accent: "red",
  },
] as const;

export const WelcomeBanner = memo(function WelcomeBanner() {
  const dismissed = useUIStore((s) => s.lldWelcomeBannerDismissed);
  const setMode = useUIStore((s) => s.setLLDMode);
  const dismiss = useUIStore((s) => s.dismissLLDWelcomeBanner);

  useEffect(() => {
    if (!dismissed) {
      void track(lldWelcomeBannerShown());
    }
    // Only fire on first show.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (dismissed) return null;

  const pick = (mode: LLDMode) => {
    setMode(mode);
    dismiss();
    void track(
      lldWelcomeBannerDismissed({
        method: `pick_${mode}` as
          | "pick_learn"
          | "pick_build"
          | "pick_drill",
      }),
    );
  };

  return (
    <div
      role="banner"
      className="relative rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 via-transparent to-fuchsia-500/5 backdrop-blur-sm p-4 m-3"
    >
      <button
        aria-label="Dismiss welcome banner"
        onClick={() => {
          dismiss();
          void track(lldWelcomeBannerDismissed({ method: "dismiss" }));
        }}
        className="absolute top-2 right-2 text-foreground-muted hover:text-foreground transition-colors"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3">
        <div className="text-2xl">👋</div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-foreground">
            First time with Low-Level Design? Pick your path.
          </div>
          <div className="text-xs text-foreground-muted mt-0.5">
            You can switch modes anytime from the top-right pill.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-3">
        {PATHS.map((p) => (
          <button
            key={p.mode}
            onClick={() => pick(p.mode)}
            className={cn(
              "text-left rounded-lg border p-3 transition-colors",
              "border-border/30 bg-elevated/50 hover:bg-elevated/80",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
            )}
          >
            <div className="text-lg">{p.icon}</div>
            <div className="text-xs font-semibold text-foreground mt-1">
              {p.label}
            </div>
            <div className="text-[10px] text-foreground-muted mt-0.5">
              {p.description}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
});
