"use client";

import { memo, useCallback, useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { Command } from "cmdk";
import { useIsMobile } from "@/hooks/use-media-query";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { animations, duration, easing, reducedMotion } from "@/lib/constants/motion";
import {
  LayoutDashboard,
  Binary,
  Boxes,
  PenTool,
  Database,
  Network,
  Globe,
  Cpu,
  Layers,
  ShieldCheck,
  Brain,
  Trophy,
  Sun,
  Moon,
  Monitor,
  PanelLeft,
  PanelBottom,
  PanelRight,
  Play,
  Pause,
  Square,
  RotateCcw,
  Download,
  Upload,
  Keyboard,
  LayoutTemplate,
  BookOpen,
  Zap,
  Server,
  HardDrive,
  ListOrdered,
  Shield,
  Globe2,
  Share2,
  Trash2,
} from "lucide-react";
import { useUIStore, type ModuleType } from "@/stores/ui-store";
import { useSimulationStore } from "@/stores/simulation-store";
import { useCanvasStore } from "@/stores/canvas-store";
import { RecentCommandsSection } from "@/components/shared/RecentCommands";
import { useRecentCommands } from "@/hooks/useRecentCommands";

interface CommandItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  action: () => void;
  group: string;
}

function useCommands(): CommandItem[] {
  const setActiveModule = useUIStore((s) => s.setActiveModule);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const toggleBottomPanel = useUIStore((s) => s.toggleBottomPanel);
  const togglePropertiesPanel = useUIStore((s) => s.togglePropertiesPanel);
  const setTheme = useUIStore((s) => s.setTheme);
  const simStatus = useSimulationStore((s) => s.status);
  const play = useSimulationStore((s) => s.play);
  const pause = useSimulationStore((s) => s.pause);
  const stop = useSimulationStore((s) => s.stop);
  const reset = useSimulationStore((s) => s.reset);

  const moduleCmd = (id: ModuleType, label: string, icon: typeof LayoutDashboard, shortcut?: string): CommandItem => ({
    id: `module-${id}`,
    label: `Switch to ${label}`,
    icon,
    shortcut,
    action: () => setActiveModule(id),
    group: "Modules",
  });

  return useMemo(() => [
    // Modules
    moduleCmd("system-design", "System Design", LayoutDashboard, "⌘1"),
    moduleCmd("algorithms", "Algorithms", Binary, "⌘2"),
    moduleCmd("data-structures", "Data Structures", Boxes, "⌘3"),
    moduleCmd("lld", "Low-Level Design", PenTool, "⌘4"),
    moduleCmd("database", "Database", Database, "⌘5"),
    moduleCmd("distributed", "Distributed Systems", Network, "⌘6"),
    moduleCmd("networking", "Networking", Globe, "⌘7"),
    moduleCmd("os", "OS Concepts", Cpu, "⌘8"),
    moduleCmd("concurrency", "Concurrency", Layers, "⌘9"),
    moduleCmd("security", "Security", ShieldCheck),
    moduleCmd("ml-design", "ML Design", Brain),
    moduleCmd("interview", "Interview", Trophy),
    moduleCmd("knowledge-graph", "Knowledge Graph", Share2),

    // Distributed Systems — individual simulations
    // NOTE: Deep-linking to a specific simulation within the distributed module
    // requires DIS-111. For now, these items switch to the distributed module;
    // the user can then select the specific sim from the sidebar.
    ...[
      { simId: "raft", name: "Raft Consensus" },
      { simId: "consistent-hashing", name: "Consistent Hashing" },
      { simId: "vector-clocks", name: "Vector Clocks" },
      { simId: "gossip", name: "Gossip Protocol" },
      { simId: "crdts", name: "CRDTs" },
      { simId: "cap-theorem", name: "CAP Theorem" },
      { simId: "two-phase-commit", name: "Two-Phase Commit" },
      { simId: "saga", name: "Saga Pattern" },
      { simId: "map-reduce", name: "MapReduce" },
      { simId: "lamport-timestamps", name: "Lamport Timestamps" },
      { simId: "paxos", name: "Paxos" },
    ].map(({ simId, name }): CommandItem => ({
      id: `distributed-${simId}`,
      label: name,
      icon: Network,
      action: () => setActiveModule("distributed"),
      group: "Distributed Systems",
    })),

    // File
    {
      id: "import-diagram",
      label: "Import Diagram",
      icon: Upload,
      shortcut: "⌘I",
      action: () => useUIStore.getState().setImportDialogOpen(true),
      group: "File",
    },
    {
      id: "export-diagram",
      label: "Export Diagram",
      icon: Download,
      shortcut: "⌘E",
      action: () => useUIStore.getState().setExportDialogOpen(true),
      group: "File",
    },
    {
      id: "load-template",
      label: "Browse Templates",
      icon: LayoutTemplate,
      shortcut: "⌘T",
      action: () => useUIStore.getState().setTemplateGalleryOpen(true),
      group: "File",
    },
    {
      id: "browse-playbooks",
      label: "Browse Playbooks",
      icon: BookOpen,
      action: () => useUIStore.getState().setPlaybookGalleryOpen(true),
      group: "File",
    },
    {
      id: "clear-canvas",
      label: "Clear Canvas",
      icon: Trash2,
      action: () => useUIStore.getState().setClearCanvasConfirmOpen(true),
      group: "File",
    },

    // Theme
    {
      id: "theme-dark",
      label: "Theme: Dark",
      icon: Moon,
      action: () => setTheme("dark"),
      group: "Appearance",
    },
    {
      id: "theme-light",
      label: "Theme: Light",
      icon: Sun,
      action: () => setTheme("light"),
      group: "Appearance",
    },
    {
      id: "theme-system",
      label: "Theme: System",
      icon: Monitor,
      action: () => setTheme("system"),
      group: "Appearance",
    },

    // Panels
    {
      id: "toggle-sidebar",
      label: "Toggle Sidebar",
      icon: PanelLeft,
      shortcut: "⌘B",
      action: toggleSidebar,
      group: "View",
    },
    {
      id: "toggle-bottom",
      label: "Toggle Bottom Panel",
      icon: PanelBottom,
      shortcut: "⌘J",
      action: toggleBottomPanel,
      group: "View",
    },
    {
      id: "toggle-properties",
      label: "Toggle Properties Panel",
      icon: PanelRight,
      shortcut: "⌘⇧B",
      action: togglePropertiesPanel,
      group: "View",
    },

    // Simulation
    ...(simStatus !== "running"
      ? [{
          id: "sim-play",
          label: "Start Simulation",
          icon: Play,
          shortcut: "Space",
          action: play,
          group: "Simulation",
        }]
      : [{
          id: "sim-pause",
          label: "Pause Simulation",
          icon: Pause,
          shortcut: "Space",
          action: pause,
          group: "Simulation",
        }]),
    {
      id: "sim-stop",
      label: "Stop Simulation",
      icon: Square,
      action: stop,
      group: "Simulation",
    },
    {
      id: "sim-reset",
      label: "Reset Simulation",
      icon: RotateCcw,
      action: reset,
      group: "Simulation",
    },

    // Add System Design Components
    {
      id: "add-web-server",
      label: "Add Web Server",
      icon: Server,
      action: () => {
        const { addNode } = useCanvasStore.getState();
        addNode({
          id: `node-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          type: "web-server",
          position: { x: 400 + Math.random() * 200, y: 300 + Math.random() * 200 },
          data: { label: "Web Server", category: "compute", componentType: "web-server", icon: "Globe", config: { instances: 1, maxConnections: 10000, processingTimeMs: 5 }, metrics: {}, state: "idle" },
        });
      },
      group: "Add Component",
    },
    {
      id: "add-load-balancer",
      label: "Add Load Balancer",
      icon: Network,
      action: () => {
        const { addNode } = useCanvasStore.getState();
        addNode({
          id: `node-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          type: "load-balancer",
          position: { x: 400 + Math.random() * 200, y: 300 + Math.random() * 200 },
          data: { label: "Load Balancer (L7)", category: "load-balancing", componentType: "load-balancer", icon: "GitBranch", config: { algorithm: "round-robin", healthCheckInterval: 10, maxConnections: 50000 }, metrics: {}, state: "idle" },
        });
      },
      group: "Add Component",
    },
    {
      id: "add-database",
      label: "Add Database",
      icon: Database,
      action: () => {
        const { addNode } = useCanvasStore.getState();
        addNode({
          id: `node-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          type: "database",
          position: { x: 400 + Math.random() * 200, y: 300 + Math.random() * 200 },
          data: { label: "Relational DB (SQL)", category: "storage", componentType: "database", icon: "Database", config: { type: "postgresql", replicas: 1, maxConnections: 100, storageGB: 100 }, metrics: {}, state: "idle" },
        });
      },
      group: "Add Component",
    },
    {
      id: "add-cache",
      label: "Add Cache (Redis)",
      icon: Zap,
      action: () => {
        const { addNode } = useCanvasStore.getState();
        addNode({
          id: `node-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          type: "cache",
          position: { x: 400 + Math.random() * 200, y: 300 + Math.random() * 200 },
          data: { label: "Cache (Redis)", category: "storage", componentType: "cache", icon: "Zap", config: { type: "redis", memoryGB: 8, evictionPolicy: "lru", ttlSeconds: 3600 }, metrics: {}, state: "idle" },
        });
      },
      group: "Add Component",
    },
    {
      id: "add-message-queue",
      label: "Add Message Queue",
      icon: ListOrdered,
      action: () => {
        const { addNode } = useCanvasStore.getState();
        addNode({
          id: `node-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          type: "message-queue",
          position: { x: 400 + Math.random() * 200, y: 300 + Math.random() * 200 },
          data: { label: "Message Queue", category: "messaging", componentType: "message-queue", icon: "ListOrdered", config: { type: "kafka", partitions: 3, replicationFactor: 3, retentionHours: 168 }, metrics: {}, state: "idle" },
        });
      },
      group: "Add Component",
    },
    {
      id: "add-api-gateway",
      label: "Add API Gateway",
      icon: Shield,
      action: () => {
        const { addNode } = useCanvasStore.getState();
        addNode({
          id: `node-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          type: "api-gateway",
          position: { x: 400 + Math.random() * 200, y: 300 + Math.random() * 200 },
          data: { label: "API Gateway", category: "load-balancing", componentType: "api-gateway", icon: "Shield", config: { rateLimitRps: 10000, authType: "jwt", timeoutMs: 30000 }, metrics: {}, state: "idle" },
        });
      },
      group: "Add Component",
    },
    {
      id: "add-cdn",
      label: "Add CDN",
      icon: Globe2,
      action: () => {
        const { addNode } = useCanvasStore.getState();
        addNode({
          id: `node-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          type: "reverse-proxy",
          position: { x: 400 + Math.random() * 200, y: 300 + Math.random() * 200 },
          data: { label: "CDN / Reverse Proxy", category: "load-balancing", componentType: "reverse-proxy", icon: "Globe2", config: { cacheHitRate: 0.85, ttlSeconds: 86400, edgeLocations: 50 }, metrics: {}, state: "idle" },
        });
      },
      group: "Add Component",
    },
    {
      id: "add-storage",
      label: "Add Object Storage (S3)",
      icon: HardDrive,
      action: () => {
        const { addNode } = useCanvasStore.getState();
        addNode({
          id: `node-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          type: "object-storage",
          position: { x: 400 + Math.random() * 200, y: 300 + Math.random() * 200 },
          data: { label: "Object Storage (S3)", category: "storage", componentType: "object-storage", icon: "HardDrive", config: { storageTB: 10, replication: 3 }, metrics: {}, state: "idle" },
        });
      },
      group: "Add Component",
    },

    // Tools
    {
      id: "capacity-calculator",
      label: "Capacity Calculator",
      icon: Server,
      shortcut: "⌘⇧C",
      action: () => useUIStore.getState().setCapacityCalculatorOpen(true),
      group: "Tools",
    },

    // Shortcuts
    {
      id: "show-shortcuts",
      label: "Keyboard Shortcuts",
      icon: Keyboard,
      shortcut: "?",
      action: () => useUIStore.getState().setShortcutsDialogOpen(true),
      group: "Help",
    },
  ], [simStatus, setActiveModule, toggleSidebar, toggleBottomPanel, togglePropertiesPanel, setTheme, play, pause, stop, reset]); // eslint-disable-line react-hooks/exhaustive-deps
}

export const CommandPalette = memo(function CommandPalette() {
  const open = useUIStore((s) => s.commandPaletteOpen);
  const setOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const commands = useCommands();
  const isMobile = useIsMobile();
  const { add: addRecentCommand } = useRecentCommands();
  const prefersReducedMotion = useReducedMotion();

  const closePalette = useCallback(() => setOpen(false), [setOpen]);
  const { containerRef, handleKeyDown: trapKeyDown } = useFocusTrap({
    active: open,
    onEscape: closePalette,
  });

  const handleSelect = useCallback(
    (id: string) => {
      const cmd = commands.find((c) => c.id === id);
      if (cmd) {
        addRecentCommand(cmd.id, cmd.label);
        cmd.action();
        setOpen(false);
      }
    },
    [commands, setOpen, addRecentCommand],
  );

  // Group commands (memoized so it doesn't block AnimatePresence exit)
  const groups = useMemo(
    () =>
      commands.reduce<Record<string, CommandItem[]>>((acc, cmd) => {
        if (!acc[cmd.group]) acc[cmd.group] = [];
        acc[cmd.group].push(cmd);
        return acc;
      }, {}),
    [commands],
  );

  return (
    <AnimatePresence mode="wait">
      {open && (
        <motion.div
          key="command-palette-root"
          ref={containerRef}
          className="fixed inset-0 z-50"
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
          onKeyDown={trapKeyDown}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: prefersReducedMotion ? 0 : duration.quick,
          }}
        >
          {/* Animated backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50"
            onClick={closePalette}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: prefersReducedMotion ? 0 : duration.fast,
            }}
          />

          {/* Command dialog — full-width from top on mobile, centered on desktop */}
          <motion.div
            className={
              isMobile
                ? "absolute inset-x-0 top-0 mx-0"
                : "absolute left-1/2 top-[20%] w-full max-w-lg -translate-x-1/2"
            }
            initial={
              prefersReducedMotion
                ? { opacity: 0 }
                : animations.commandPalette.open.initial
            }
            animate={
              prefersReducedMotion
                ? { opacity: 1 }
                : animations.commandPalette.open.animate
            }
            exit={
              prefersReducedMotion
                ? { opacity: 0 }
                : animations.commandPalette.close.exit
            }
            transition={
              prefersReducedMotion
                ? reducedMotion.instantTransition
                : animations.commandPalette.open.transition
            }
          >
            <Command
              className={
                isMobile
                  ? "overflow-hidden border-b border-border bg-popover shadow-2xl"
                  : "overflow-hidden rounded-xl border border-border bg-popover shadow-2xl"
              }
              onKeyDown={(e) => {
                if (e.key === "Escape") closePalette();
              }}
            >
              <Command.Input
                placeholder="Type a command or search..."
                aria-label="Command palette search"
                className={
                  isMobile
                    ? "h-14 w-full border-b border-border bg-transparent px-4 text-base text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring placeholder:text-foreground-muted"
                    : "h-12 w-full border-b border-border bg-transparent px-4 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring placeholder:text-foreground-muted"
                }
                autoFocus
              />
              <Command.List className={isMobile ? "max-h-[70vh] overflow-y-auto p-2" : "max-h-80 overflow-y-auto p-2"}>
                <Command.Empty className="py-6 text-center text-sm text-foreground-muted">
                  No results found.
                </Command.Empty>

                <RecentCommandsSection onSelect={handleSelect} isMobile={isMobile} />

                {Object.entries(groups).map(([group, items]) => (
                  <Command.Group
                    key={group}
                    heading={group}
                    className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-foreground-muted"
                  >
                    {items.map((cmd) => {
                      const Icon = cmd.icon;
                      return (
                        <Command.Item
                          key={cmd.id}
                          value={cmd.label}
                          onSelect={() => handleSelect(cmd.id)}
                          className={
                            isMobile
                              ? "flex min-h-[44px] cursor-pointer items-center gap-3 rounded-lg px-3 py-3 text-base text-foreground transition-colors aria-selected:bg-accent"
                              : "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground transition-colors aria-selected:bg-accent"
                          }
                        >
                          <Icon className={isMobile ? "h-5 w-5 shrink-0 text-foreground-muted" : "h-4 w-4 shrink-0 text-foreground-muted"} />
                          <span className="flex-1">{cmd.label}</span>
                          {cmd.shortcut && !isMobile && (
                            <kbd className="ml-auto rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground-subtle">
                              {cmd.shortcut}
                            </kbd>
                          )}
                        </Command.Item>
                      );
                    })}
                  </Command.Group>
                ))}
              </Command.List>
            </Command>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
