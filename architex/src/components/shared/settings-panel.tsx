"use client";

import { memo, useCallback } from "react";
import { X, ExternalLink, Moon, Sun, Monitor, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore, type Theme } from "@/stores/ui-store";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { resetTour } from "@/components/shared/onboarding-overlay";

const THEME_OPTIONS: { value: Theme; label: string; icon: typeof Moon }[] = [
  { value: "dark", label: "Dark", icon: Moon },
  { value: "light", label: "Light", icon: Sun },
  { value: "system", label: "System", icon: Monitor },
];

const THEME_PREVIEW_COLORS: Record<Theme, { bg: string; fg: string; accent: string }> = {
  dark: { bg: "bg-zinc-900", fg: "bg-zinc-300", accent: "bg-blue-500" },
  light: { bg: "bg-zinc-100", fg: "bg-zinc-700", accent: "bg-blue-500" },
  system: { bg: "bg-gradient-to-r from-zinc-900 to-zinc-100", fg: "bg-zinc-500", accent: "bg-blue-500" },
};

const LINKS = [
  { label: "GitHub", href: "https://github.com/architex" },
  { label: "Documentation", href: "https://docs.architex.dev" },
  { label: "Report Bug", href: "https://github.com/architex/issues/new" },
];

export const SettingsPanel = memo(function SettingsPanel() {
  const open = useUIStore((s) => s.settingsPanelOpen);
  const setOpen = useUIStore((s) => s.setSettingsPanelOpen);
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);

  const { containerRef, handleKeyDown: trapKeyDown } = useFocusTrap({
    active: open,
    onEscape: () => setOpen(false),
  });

  const handleBackdropClick = useCallback(() => setOpen(false), [setOpen]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label="Settings"
      ref={containerRef}
      onKeyDown={trapKeyDown}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleBackdropClick}
      />

      {/* Panel */}
      <div className="absolute left-1/2 top-[15%] w-full max-w-md -translate-x-1/2">
        <div className="overflow-hidden rounded-xl border border-border bg-popover shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-foreground">Settings</h2>
            <button
              onClick={() => setOpen(false)}
              className="flex h-6 w-6 items-center justify-center rounded-md text-foreground-muted transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-6 p-4">
            {/* Theme Selector */}
            <div>
              <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-foreground-muted">
                Theme
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {THEME_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const preview = THEME_PREVIEW_COLORS[opt.value];
                  const isActive = theme === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setTheme(opt.value)}
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-lg border p-3 transition-all",
                        isActive
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-foreground-muted hover:border-foreground-muted hover:text-foreground",
                      )}
                    >
                      {/* Preview square */}
                      <div
                        className={cn(
                          "h-10 w-full rounded-md border border-border/50",
                          preview.bg,
                        )}
                      >
                        <div className="flex h-full flex-col items-start justify-center gap-1 px-2">
                          <div className={cn("h-1 w-6 rounded-full", preview.fg)} />
                          <div className={cn("h-1 w-4 rounded-full", preview.accent)} />
                          <div className={cn("h-1 w-8 rounded-full opacity-50", preview.fg)} />
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Icon className="h-3.5 w-3.5" />
                        <span className="text-xs font-medium">{opt.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* About */}
            <div>
              <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-foreground-muted">
                About Architex
              </h3>
              <div className="rounded-lg border border-border bg-sidebar px-3 py-2.5">
                <p className="text-sm font-medium text-foreground">Architex</p>
                <p className="text-xs text-foreground-muted">
                  Version 0.1.0 &middot; Interactive System Design Studio
                </p>
              </div>
            </div>

            {/* Replay Tours */}
            <div>
              <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-foreground-muted">
                Guided Tours
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    resetTour("system-design");
                    useUIStore.getState().setOnboardingStep(0);
                    useUIStore.getState().setOnboardingActive(true);
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent/50"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-foreground-muted" />
                  <span>Replay System Design Tour</span>
                </button>
                <button
                  onClick={() => {
                    resetTour("lld");
                    useUIStore.getState().setActiveModule("lld");
                    useUIStore.getState().setOnboardingStep(0);
                    useUIStore.getState().setOnboardingActive(true);
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent/50"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-foreground-muted" />
                  <span>Replay LLD Studio Tour</span>
                </button>
                <button
                  onClick={() => {
                    localStorage.removeItem('architex-first-encounter-algorithm-module');
                    useUIStore.getState().setActiveModule("algorithms");
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent/50"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-foreground-muted" />
                  <span>Replay Algorithm Tour</span>
                </button>
              </div>
            </div>

            {/* Links */}
            <div>
              <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-foreground-muted">
                Links
              </h3>
              <div className="space-y-1">
                {LINKS.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-md px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent/50"
                  >
                    <span>{link.label}</span>
                    <ExternalLink className="h-3.5 w-3.5 text-foreground-muted" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
