"use client";

import * as React from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { useSound } from "@/hooks/useSound";
import { cn } from "@/lib/utils";

/**
 * A small glassmorphism toggle button for sound effects.
 * Uses the global soundEngine singleton via the useSound hook.
 */
export function SoundToggle({ className }: { className?: string }) {
  const { enabled, setEnabled } = useSound();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => setEnabled(!enabled)}
            aria-label={enabled ? "Mute sound effects" : "Unmute sound effects"}
            aria-pressed={enabled}
            className={cn(
              "inline-flex h-8 w-8 items-center justify-center rounded-lg",
              "bg-background/60 backdrop-blur-md border border-border/30",
              "text-foreground-muted hover:text-foreground",
              "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
              className,
            )}
          >
            {enabled ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Toggle sound effects</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
