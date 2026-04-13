"use client";

import { memo, useCallback, useEffect, useState } from "react";
import { ArrowRight, LayoutDashboard } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import type { ModuleType } from "@/stores/ui-store";
import {
  getLastActiveModule,
  getRecentActivity,
} from "@/lib/progress/module-progress";

// ── Module display labels ─────────────────────────────────────

const MODULE_LABELS: Record<ModuleType, string> = {
  "system-design": "System Design",
  algorithms: "Algorithms",
  "data-structures": "Data Structures",
  lld: "Low-Level Design",
  database: "Database",
  distributed: "Distributed Systems",
  networking: "Networking",
  os: "OS Concepts",
  concurrency: "Concurrency",
  security: "Security",
  "ml-design": "ML Design",
  interview: "Interview",
  "knowledge-graph": "Knowledge Graph",
};

// ── Relative time formatter ───────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}

// ── Continue Card ─────────────────────────────────────────────

function ContinueCard({
  moduleId,
  lastTopic,
  lastTime,
  onContinue,
}: {
  moduleId: ModuleType;
  lastTopic: string | null;
  lastTime: string | null;
  onContinue: () => void;
}) {
  return (
    <div className="w-full max-w-sm rounded-lg border border-[var(--primary)]/30 bg-[var(--surface)] p-4">
      <p className="mb-1 text-xs font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
        Continue where you left off
      </p>
      <p className="text-base font-semibold text-[var(--foreground)]">
        {MODULE_LABELS[moduleId]}
      </p>
      {lastTopic && (
        <p className="mt-0.5 truncate text-sm text-[var(--foreground-muted)]">
          {lastTopic}
        </p>
      )}
      {lastTime && (
        <p className="mt-0.5 text-xs text-[var(--foreground-subtle)]">
          {timeAgo(lastTime)}
        </p>
      )}
      <button
        onClick={onContinue}
        className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-[var(--primary)] bg-[var(--primary)] px-4 py-2 text-sm text-[var(--primary-foreground)] transition-colors hover:opacity-90"
      >
        Continue
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────

export const EmptyState = memo(function EmptyState() {
  const setTemplateGalleryOpen = useUIStore((s) => s.setTemplateGalleryOpen);
  const setCommandPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const setActiveModule = useUIStore((s) => s.setActiveModule);

  const [lastModule, setLastModule] = useState<ModuleType | null>(null);
  const [lastTopic, setLastTopic] = useState<string | null>(null);
  const [lastTime, setLastTime] = useState<string | null>(null);

  useEffect(() => {
    const mod = getLastActiveModule();
    setLastModule(mod);

    // Get the most recent activity entry to show the last topic
    const recent = getRecentActivity(1);
    if (recent.length > 0) {
      setLastTopic(recent[0].detail ?? recent[0].action);
      setLastTime(recent[0].timestamp);
    }
  }, []);

  const openTemplateGallery = useCallback(() => {
    setTemplateGalleryOpen(true);
  }, [setTemplateGalleryOpen]);

  const openCommandPalette = useCallback(() => {
    setCommandPaletteOpen(true);
  }, [setCommandPaletteOpen]);

  const handleContinue = useCallback(() => {
    if (lastModule) {
      setActiveModule(lastModule);
    }
  }, [lastModule, setActiveModule]);

  return (
    <div className="pointer-events-auto absolute inset-0 z-10 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center">
        <LayoutDashboard className="h-16 w-16 text-[var(--foreground-subtle)]" />
        <h3 className="text-lg font-medium text-[var(--foreground)]">
          Start Building
        </h3>
        <p className="max-w-md text-sm text-[var(--foreground-muted)]">
          Drag components from the sidebar, load a template, or use Cmd+K to
          search
        </p>

        {/* Continue card -- only shown when user has previous activity */}
        {lastModule && (
          <ContinueCard
            moduleId={lastModule}
            lastTopic={lastTopic}
            lastTime={lastTime}
            onContinue={handleContinue}
          />
        )}

        <div className="flex gap-3">
          <button
            onClick={openTemplateGallery}
            className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]"
          >
            Browse Templates
          </button>
          <button
            onClick={openCommandPalette}
            className="rounded-md border border-[var(--primary)] bg-[var(--primary)] px-4 py-2 text-sm text-[var(--primary-foreground)] transition-colors hover:opacity-90"
          >
            Cmd+K
          </button>
        </div>
      </div>
    </div>
  );
});
