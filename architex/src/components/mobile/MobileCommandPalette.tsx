"use client";

import { memo, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Search } from "lucide-react";
import { Command } from "cmdk";
import { useUIStore } from "@/stores/ui-store";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { duration } from "@/lib/constants/motion";

// ── Types ────────────────────────────────────────────────────

interface MobileCommandItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  group: string;
}

export interface MobileCommandPaletteProps {
  commands: MobileCommandItem[];
  onSelectCommand?: (id: string) => void;
}

// ── Component ────────────────────────────────────────────────

export const MobileCommandPalette = memo(function MobileCommandPalette({
  commands,
  onSelectCommand,
}: MobileCommandPaletteProps) {
  const open = useUIStore((s) => s.commandPaletteOpen);
  const setOpen = useUIStore((s) => s.setCommandPaletteOpen);

  const closePalette = useCallback(() => setOpen(false), [setOpen]);

  const { containerRef, handleKeyDown: trapKeyDown } = useFocusTrap({
    active: open,
    onEscape: closePalette,
  });

  const handleSelect = useCallback(
    (id: string) => {
      const cmd = commands.find((c) => c.id === id);
      if (cmd) {
        cmd.action();
        onSelectCommand?.(id);
        setOpen(false);
      }
    },
    [commands, setOpen, onSelectCommand],
  );

  // Group commands
  const groups = useMemo(
    () =>
      commands.reduce<Record<string, MobileCommandItem[]>>((acc, cmd) => {
        if (!acc[cmd.group]) acc[cmd.group] = [];
        acc[cmd.group].push(cmd);
        return acc;
      }, {}),
    [commands],
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={containerRef}
          className="fixed inset-0 z-50 flex flex-col bg-background"
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
          onKeyDown={trapKeyDown}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: duration.fast }}
        >
          <Command className="flex flex-1 flex-col overflow-hidden">
            {/* Header with search + cancel */}
            <div className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2">
              <Search className="h-5 w-5 shrink-0 text-foreground-muted" />
              <Command.Input
                placeholder="Search commands..."
                className="h-12 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-foreground-muted"
                autoFocus
              />
              <button
                onClick={closePalette}
                className="shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-primary transition-colors active:bg-accent"
                aria-label="Cancel"
              >
                Cancel
              </button>
            </div>

            {/* Results */}
            <Command.List className="flex-1 overflow-y-auto px-3 py-2">
              <Command.Empty className="flex items-center justify-center py-12 text-sm text-foreground-muted">
                No commands found.
              </Command.Empty>

              {Object.entries(groups).map(([group, items]) => (
                <Command.Group
                  key={group}
                  heading={group}
                  className="[&_[cmdk-group-heading]]:px-1 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-foreground-muted"
                >
                  {items.map((cmd) => {
                    const Icon = cmd.icon;
                    return (
                      <Command.Item
                        key={cmd.id}
                        value={cmd.label}
                        onSelect={() => handleSelect(cmd.id)}
                        className="flex min-h-[48px] cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-base text-foreground transition-colors active:bg-accent aria-selected:bg-accent"
                      >
                        <Icon className="h-5 w-5 shrink-0 text-foreground-muted" />
                        <span className="flex-1">{cmd.label}</span>
                      </Command.Item>
                    );
                  })}
                </Command.Group>
              ))}
            </Command.List>
          </Command>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
