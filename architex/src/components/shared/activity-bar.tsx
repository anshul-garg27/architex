"use client";

import { memo, useState, useCallback, useRef } from "react";
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
  Share2,
  Settings,
  MoreHorizontal,
  X,
  LogIn,
} from "lucide-react";
// Clerk auth — uncomment when @clerk/nextjs is installed:
// import { UserButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { useUIStore, type ModuleType } from "@/stores/ui-store";
import { useIsMobile } from "@/hooks/use-media-query";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { NotificationBell } from "./notification-bell";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ModuleItem {
  id: ModuleType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut: string;
}

const modules: ModuleItem[] = [
  { id: "system-design", label: "System Design", icon: LayoutDashboard, shortcut: "1" },
  { id: "algorithms", label: "Algorithms", icon: Binary, shortcut: "2" },
  { id: "data-structures", label: "Data Structures", icon: Boxes, shortcut: "3" },
  { id: "lld", label: "Low-Level Design", icon: PenTool, shortcut: "4" },
  { id: "database", label: "Database", icon: Database, shortcut: "5" },
  { id: "distributed", label: "Distributed Systems", icon: Network, shortcut: "6" },
  { id: "networking", label: "Networking", icon: Globe, shortcut: "7" },
  { id: "os", label: "OS Concepts", icon: Cpu, shortcut: "8" },
  { id: "concurrency", label: "Concurrency", icon: Layers, shortcut: "9" },
  { id: "security", label: "Security", icon: ShieldCheck, shortcut: "" },
  { id: "ml-design", label: "ML Design", icon: Brain, shortcut: "" },
  { id: "interview", label: "Interview", icon: Trophy, shortcut: "" },
  { id: "knowledge-graph", label: "Knowledge Graph", icon: Share2, shortcut: "" },
];

/** The first 5 modules shown in the mobile bottom bar. */
const MOBILE_VISIBLE_COUNT = 5;

// ── Desktop Activity Bar (vertical sidebar) ──────────────────────

const DesktopActivityBar = memo(function DesktopActivityBar() {
  const activeModule = useUIStore((s) => s.activeModule);
  const setActiveModule = useUIStore((s) => s.setActiveModule);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const setSettingsPanelOpen = useUIStore((s) => s.setSettingsPanelOpen);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const count = modules.length;
      let nextIndex = focusedIndex;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          nextIndex = focusedIndex < count - 1 ? focusedIndex + 1 : 0;
          break;
        case "ArrowUp":
          e.preventDefault();
          nextIndex = focusedIndex > 0 ? focusedIndex - 1 : count - 1;
          break;
        case "Home":
          e.preventDefault();
          nextIndex = 0;
          break;
        case "End":
          e.preventDefault();
          nextIndex = count - 1;
          break;
        case "Enter":
          e.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < count) {
            setActiveModule(modules[focusedIndex].id);
          }
          return;
        default:
          return;
      }

      setFocusedIndex(nextIndex);
      buttonRefs.current[nextIndex]?.focus();
    },
    [focusedIndex, setActiveModule],
  );

  return (
    <TooltipProvider delayDuration={200}>
      <nav id="navigation" aria-label="Module navigation" data-onboarding="activity-bar" className="flex h-full w-12 flex-col items-center border-r border-border bg-sidebar py-2">
        <ul
          role="listbox"
          aria-label="Modules"
          className="flex flex-1 flex-col items-center gap-1 list-none p-0 m-0"
          onKeyDown={handleKeyDown}
        >
          {modules.map((mod, index) => {
            const Icon = mod.icon;
            const isActive = activeModule === mod.id;
            const isFocused = focusedIndex === index;
            const tooltipLabel = `${mod.label}${mod.shortcut ? ` (⌘${mod.shortcut})` : ""}`;
            return (
              <li key={mod.id} role="option" aria-selected={isActive}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      ref={(el) => { buttonRefs.current[index] = el; }}
                      onClick={() => {
                        if (activeModule === mod.id) {
                          toggleSidebar();
                        } else {
                          setActiveModule(mod.id);
                        }
                      }}
                      onFocus={() => setFocusedIndex(index)}
                      aria-label={tooltipLabel}
                      tabIndex={isFocused || (focusedIndex === -1 && index === 0) ? 0 : -1}
                      className={cn(
                        "relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-sidebar",
                        isActive
                          ? "bg-primary/15 text-primary"
                          : "text-foreground-muted hover:bg-sidebar-accent hover:text-foreground",
                      )}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-primary" />
                      )}
                      <Icon className="h-5 w-5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>
                    {tooltipLabel}
                  </TooltipContent>
                </Tooltip>
              </li>
            );
          })}
        </ul>

        <div className="flex flex-col items-center gap-1 pb-2">
          <NotificationBell />
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                aria-label="Settings"
                onClick={() => setSettingsPanelOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-foreground-muted transition-colors hover:bg-sidebar-accent hover:text-foreground"
              >
                <Settings className="h-5 w-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              Settings
            </TooltipContent>
          </Tooltip>
          {/* Uncomment when @clerk/nextjs is installed:
          <SignedIn>
            <div className="flex h-10 w-10 items-center justify-center">
              <UserButton appearance={{ elements: { avatarBox: "h-7 w-7" } }} />
            </div>
          </SignedIn>
          <SignedOut>
            <a href="/sign-in" aria-label="Sign in" title="Sign in"
              className="flex h-10 w-10 items-center justify-center rounded-lg text-foreground-muted transition-colors hover:bg-sidebar-accent hover:text-foreground">
              <LogIn className="h-5 w-5" />
            </a>
          </SignedOut>
          */}
        </div>
      </nav>
    </TooltipProvider>
  );
});

// ── Mobile Activity Bar (horizontal bottom nav) ──────────────────

const MobileActivityBar = memo(function MobileActivityBar() {
  const activeModule = useUIStore((s) => s.activeModule);
  const setActiveModule = useUIStore((s) => s.setActiveModule);
  const setSettingsPanelOpen = useUIStore((s) => s.setSettingsPanelOpen);
  const [overflowOpen, setOverflowOpen] = useState(false);

  const visibleModules = modules.slice(0, MOBILE_VISIBLE_COUNT);
  const overflowModules = modules.slice(MOBILE_VISIBLE_COUNT);

  const handleModuleSelect = useCallback(
    (id: ModuleType) => {
      setActiveModule(id);
      setOverflowOpen(false);
    },
    [setActiveModule],
  );

  // AUD-063: Focus trap for the mobile overflow sheet
  const { containerRef: focusTrapRef, handleKeyDown: focusTrapKeyDown } = useFocusTrap({
    active: overflowOpen,
    onEscape: () => setOverflowOpen(false),
  });

  return (
    <>
      {/* Overflow sheet */}
      {overflowOpen && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="More modules">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOverflowOpen(false)}
          />
          <div ref={focusTrapRef} onKeyDown={focusTrapKeyDown} className="absolute bottom-14 left-0 right-0 rounded-t-2xl border-t border-border bg-surface px-4 pb-4 pt-3">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-medium text-foreground-muted">More Modules</span>
              <button
                aria-label="Close"
                onClick={() => setOverflowOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground-muted hover:bg-sidebar-accent"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <ul className="grid grid-cols-4 gap-2 list-none p-0 m-0">
              {overflowModules.map((mod) => {
                const Icon = mod.icon;
                const isActive = activeModule === mod.id;
                return (
                  <li key={mod.id}>
                    <button
                      onClick={() => handleModuleSelect(mod.id)}
                      aria-label={mod.label}
                      aria-selected={isActive}
                      className={cn(
                        "flex min-h-[44px] w-full flex-col items-center justify-center gap-1 rounded-lg px-1 py-2 transition-colors",
                        isActive
                          ? "bg-primary/15 text-primary"
                          : "text-foreground-muted hover:bg-sidebar-accent hover:text-foreground",
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-[10px] leading-tight">{mod.label}</span>
                    </button>
                  </li>
                );
              })}
              <li>
                <button
                  onClick={() => {
                    setOverflowOpen(false);
                    setSettingsPanelOpen(true);
                  }}
                  aria-label="Settings"
                  className="flex min-h-[44px] w-full flex-col items-center justify-center gap-1 rounded-lg px-1 py-2 text-foreground-muted transition-colors hover:bg-sidebar-accent hover:text-foreground"
                >
                  <Settings className="h-5 w-5" />
                  <span className="text-[10px] leading-tight">Settings</span>
                </button>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Bottom navigation bar */}
      <nav
        id="navigation"
        aria-label="Module navigation"
        data-onboarding="activity-bar"
        className="flex h-14 w-full shrink-0 items-center justify-around border-t border-border bg-sidebar px-1 pb-[env(safe-area-inset-bottom)]"
      >
        {visibleModules.map((mod) => {
          const Icon = mod.icon;
          const isActive = activeModule === mod.id;
          return (
            <button
              key={mod.id}
              onClick={() => handleModuleSelect(mod.id)}
              aria-label={mod.label}
              aria-selected={isActive}
              className={cn(
                "relative flex min-h-[44px] min-w-[44px] flex-col items-center justify-center rounded-lg px-2 py-1 transition-colors",
                isActive
                  ? "text-primary"
                  : "text-foreground-muted hover:text-foreground",
              )}
            >
              {isActive && (
                <div className="absolute top-0 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-b bg-primary" />
              )}
              <Icon className="h-5 w-5" />
              <span className="mt-0.5 text-[10px] leading-tight">{mod.label.split(" ")[0]}</span>
            </button>
          );
        })}
        <button
          onClick={() => setOverflowOpen((v) => !v)}
          aria-label="More modules"
          aria-expanded={overflowOpen}
          className={cn(
            "relative flex min-h-[44px] min-w-[44px] flex-col items-center justify-center rounded-lg px-2 py-1 transition-colors",
            overflowOpen
              ? "text-primary"
              : "text-foreground-muted hover:text-foreground",
          )}
        >
          <MoreHorizontal className="h-5 w-5" />
          <span className="mt-0.5 text-[10px] leading-tight">More</span>
        </button>
      </nav>
    </>
  );
});

// ── Exported ActivityBar (responsive) ────────────────────────────

export const ActivityBar = memo(function ActivityBar() {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <MobileActivityBar />;
  }

  return <DesktopActivityBar />;
});
