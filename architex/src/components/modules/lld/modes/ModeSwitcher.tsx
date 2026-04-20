"use client";

import { memo, useEffect } from "react";
import { useUIStore, type LLDMode } from "@/stores/ui-store";
import { track, lldModeSwitched } from "@/lib/analytics/lld-events";
import { cn } from "@/lib/utils";

interface ModeOption {
  value: LLDMode;
  icon: string;
  label: string;
  shortcut: string;
}

const MODES: readonly ModeOption[] = [
  { value: "learn", icon: "📖", label: "Learn", shortcut: "⌘1" },
  { value: "build", icon: "🎨", label: "Build", shortcut: "⌘2" },
  { value: "drill", icon: "⏱", label: "Drill", shortcut: "⌘3" },
  { value: "review", icon: "🔁", label: "Review", shortcut: "⌘4" },
] as const;

export const ModeSwitcher = memo(function ModeSwitcher() {
  const mode = useUIStore((s) => s.lldMode) ?? "build";
  const setMode = useUIStore((s) => s.setLLDMode);

  // Keyboard shortcuts ⌘1..4
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!e.metaKey && !e.ctrlKey) return;
      const digit = e.key;
      if (digit < "1" || digit > "4") return;
      const idx = Number(digit) - 1;
      const target = MODES[idx];
      if (target && target.value !== mode) {
        e.preventDefault();
        setMode(target.value);
        void track(
          lldModeSwitched({
            from: mode,
            to: target.value,
            trigger: "keyboard",
          }),
        );
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [mode, setMode]);

  return (
    <nav
      role="tablist"
      aria-label="LLD mode"
      className="inline-flex items-center gap-0.5 rounded-full bg-background/60 p-1 backdrop-blur-sm border border-border/30"
    >
      {MODES.map((m) => {
        const active = m.value === mode;
        return (
          <button
            key={m.value}
            role="tab"
            aria-selected={active}
            aria-label={`${m.label} mode (${m.shortcut})`}
            onClick={() => {
              if (m.value !== mode) {
                setMode(m.value);
                void track(
                  lldModeSwitched({
                    from: mode,
                    to: m.value,
                    trigger: "click",
                  }),
                );
              }
            }}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              active
                ? "bg-primary/20 text-primary shadow-sm"
                : "text-foreground-muted hover:text-foreground hover:bg-foreground/5",
            )}
          >
            <span aria-hidden>{m.icon}</span>
            <span>{m.label}</span>
          </button>
        );
      })}
    </nav>
  );
});
