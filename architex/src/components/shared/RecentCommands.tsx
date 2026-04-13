"use client";

import { memo } from "react";
import { Clock } from "lucide-react";
import { Command } from "cmdk";
import { useRecentCommands } from "@/hooks/useRecentCommands";

interface RecentCommandsSectionProps {
  /** Called when a recent command is selected. Receives the command id. */
  onSelect: (commandId: string) => void;
  /** Whether to show on mobile (larger hit targets) */
  isMobile?: boolean;
}

/**
 * RecentCommands -- renders a "Recent" section at the top of the command
 * palette results showing the last 10 used commands from localStorage.
 */
export const RecentCommandsSection = memo(function RecentCommandsSection({
  onSelect,
  isMobile = false,
}: RecentCommandsSectionProps) {
  const { recent } = useRecentCommands();

  if (recent.length === 0) return null;

  return (
    <Command.Group
      heading="Recent"
      className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-foreground-muted"
    >
      {recent.map((cmd) => (
        <Command.Item
          key={`recent-${cmd.id}`}
          value={`recent: ${cmd.label}`}
          onSelect={() => onSelect(cmd.id)}
          className={
            isMobile
              ? "flex min-h-[44px] cursor-pointer items-center gap-3 rounded-lg px-3 py-3 text-base text-foreground transition-colors aria-selected:bg-accent"
              : "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground transition-colors aria-selected:bg-accent"
          }
        >
          <Clock
            className={
              isMobile
                ? "h-5 w-5 shrink-0 text-foreground-muted"
                : "h-4 w-4 shrink-0 text-foreground-muted"
            }
          />
          <span className="flex-1">{cmd.label}</span>
        </Command.Item>
      ))}
    </Command.Group>
  );
});
