"use client";

import { memo, useState, useCallback, useRef, useEffect } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSound } from "@/hooks/useSound";

export const SoundToggle = memo(function SoundToggle() {
  const { play, enabled, setEnabled, volume, setVolume } = useSound();
  const [expanded, setExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggle = useCallback(() => {
    const next = !enabled;
    setEnabled(next);
    if (next) {
      // Give the engine a moment to enable, then play feedback
      requestAnimationFrame(() => play("click"));
    }
  }, [enabled, setEnabled, play]);

  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setVolume(Number(e.target.value));
    },
    [setVolume],
  );

  // Close slider when clicking outside
  useEffect(() => {
    if (!expanded) return;
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setExpanded(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [expanded]);

  const Icon = enabled ? Volume2 : VolumeX;

  return (
    <div ref={containerRef} className="relative flex items-center">
      <button
        onClick={toggle}
        onMouseEnter={() => setExpanded(true)}
        className={cn(
          "flex h-6 w-6 items-center justify-center rounded-md transition-colors",
          "text-foreground-muted hover:bg-accent hover:text-foreground",
        )}
        aria-label={enabled ? "Mute sound" : "Enable sound"}
        title={enabled ? "Mute sound" : "Enable sound"}
      >
        <Icon className="h-3.5 w-3.5" />
      </button>

      {/* Volume slider — appears on hover/expand */}
      {expanded && enabled && (
        <div
          className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded-lg border border-border bg-popover px-3 py-2 shadow-lg"
          onMouseLeave={() => setExpanded(false)}
        >
          <label className="flex flex-col items-center gap-1.5">
            <span className="text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
              Volume
            </span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={handleVolumeChange}
              className="h-1 w-24 cursor-pointer appearance-none rounded-full bg-muted accent-primary"
              aria-label="Sound volume"
            />
            <span className="text-[10px] tabular-nums text-foreground-muted">
              {Math.round(volume * 100)}%
            </span>
          </label>
        </div>
      )}
    </div>
  );
});
