"use client";

import { memo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  X,
  PlusCircle,
  LayoutTemplate,
  Play,
  Download,
} from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { springs } from "@/lib/constants/motion";

// ── Action definitions ─────────────────────────────────────────────

interface FabAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
}

function useFabActions(): FabAction[] {
  const setTemplateGalleryOpen = useUIStore((s) => s.setTemplateGalleryOpen);
  const setExportDialogOpen = useUIStore((s) => s.setExportDialogOpen);
  const toggleBottomPanel = useUIStore((s) => s.toggleBottomPanel);

  return [
    {
      id: "add-node",
      label: "Add Node",
      icon: PlusCircle,
      onClick: () => {
        // Open sidebar (component palette) on mobile via toggling
        useUIStore.getState().toggleSidebar();
      },
    },
    {
      id: "templates",
      label: "Templates",
      icon: LayoutTemplate,
      onClick: () => setTemplateGalleryOpen(true),
    },
    {
      id: "simulate",
      label: "Simulate",
      icon: Play,
      onClick: () => toggleBottomPanel(),
    },
    {
      id: "export",
      label: "Export",
      icon: Download,
      onClick: () => setExportDialogOpen(true),
    },
  ];
}

// ── FAB Component ──────────────────────────────────────────────────

export const FloatingActionButton = memo(function FloatingActionButton() {
  const [expanded, setExpanded] = useState(false);
  const actions = useFabActions();

  const toggle = useCallback(() => setExpanded((v) => !v), []);

  const handleAction = useCallback(
    (action: FabAction) => {
      action.onClick();
      setExpanded(false);
    },
    [],
  );

  return (
    // Hidden on md+ (desktop) — only visible on mobile
    <div className="fixed bottom-20 right-4 z-40 flex flex-col items-end gap-3 md:hidden">
      {/* Expanded action buttons */}
      <AnimatePresence>
        {expanded && (
          <>
            {actions.map((action, index) => {
              const Icon = action.icon;
              return (
                <motion.button
                  key={action.id}
                  initial={{ opacity: 0, scale: 0.3, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.3, y: 10 }}
                  transition={{
                    ...springs.snappy,
                    delay: index * 0.05,
                  }}
                  onClick={() => handleAction(action)}
                  className="flex items-center gap-2 rounded-full bg-surface border border-border px-4 py-2.5 shadow-lg transition-colors hover:bg-accent"
                  aria-label={action.label}
                >
                  <span className="text-xs font-medium text-foreground">{action.label}</span>
                  <Icon className="h-4 w-4 text-primary" />
                </motion.button>
              );
            })}
          </>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.button
        onClick={toggle}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl"
        whileTap={{ scale: 0.9 }}
        animate={{ rotate: expanded ? 45 : 0 }}
        transition={springs.snappy}
        aria-label={expanded ? "Close actions" : "Open quick actions"}
        aria-expanded={expanded}
      >
        {expanded ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      </motion.button>
    </div>
  );
});
