"use client";

import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { motion, AnimatePresence } from "motion/react";
import { Pencil, Copy, Trash2, Cable } from "lucide-react";
import { springs } from "@/lib/constants/motion";

// ── Types ──────────────────────────────────────────────────────────

export type LongPressAction = "edit" | "duplicate" | "delete" | "connect";

export interface LongPressMenuProps {
  children: ReactNode;
  /** Called when an action is selected. */
  onAction: (action: LongPressAction) => void;
  /** Duration in ms to trigger long-press. @default 500 */
  pressDelay?: number;
  /** Disable the menu entirely (e.g. on desktop). */
  disabled?: boolean;
}

interface MenuPosition {
  x: number;
  y: number;
}

// ── Action config ──────────────────────────────────────────────────

const ACTIONS: { id: LongPressAction; label: string; icon: React.ComponentType<{ className?: string }>; destructive?: boolean }[] = [
  { id: "edit", label: "Edit", icon: Pencil },
  { id: "duplicate", label: "Duplicate", icon: Copy },
  { id: "delete", label: "Delete", icon: Trash2, destructive: true },
  { id: "connect", label: "Connect", icon: Cable },
];

// ── Haptic helper ──────────────────────────────────────────────────

function triggerHaptic() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(15);
  }
}

// ── Component ──────────────────────────────────────────────────────

export const LongPressMenu = memo(function LongPressMenu({
  children,
  onAction,
  pressDelay = 500,
  disabled = false,
}: LongPressMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [position, setPosition] = useState<MenuPosition>({ x: 0, y: 0 });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartPos = useRef<MenuPosition>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const handleAction = useCallback(
    (action: LongPressAction) => {
      onAction(action);
      setMenuOpen(false);
    },
    [onAction],
  );

  // ── Touch handlers ─────────────────────────────────────────────

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled) return;
      const touch = e.touches[0];
      touchStartPos.current = { x: touch.clientX, y: touch.clientY };

      timerRef.current = setTimeout(() => {
        triggerHaptic();

        // Clamp position so menu stays within viewport
        const menuWidth = 160;
        const menuHeight = 200;
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const x = Math.min(touch.clientX, vw - menuWidth - 8);
        const y = Math.min(touch.clientY, vh - menuHeight - 8);

        setPosition({ x: Math.max(8, x), y: Math.max(8, y) });
        setMenuOpen(true);
      }, pressDelay);
    },
    [disabled, pressDelay],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      // Cancel if finger moves more than 10px (it's a drag, not a press)
      const touch = e.touches[0];
      const dx = touch.clientX - touchStartPos.current.x;
      const dy = touch.clientY - touchStartPos.current.y;
      if (Math.sqrt(dx * dx + dy * dy) > 10) {
        clearTimer();
      }
    },
    [clearTimer],
  );

  const handleTouchEnd = useCallback(() => {
    clearTimer();
  }, [clearTimer]);

  // Close menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return;

    function handleClickOutside(e: MouseEvent | TouchEvent) {
      const target = e.target as Node;
      const menuEl = document.getElementById("longpress-context-menu");
      if (menuEl && !menuEl.contains(target)) {
        setMenuOpen(false);
      }
    }

    // Delay to avoid the same touch that opened the menu from closing it
    const timer = setTimeout(() => {
      document.addEventListener("touchstart", handleClickOutside, { passive: true });
      document.addEventListener("mousedown", handleClickOutside);
    }, 50);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  return (
    <>
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        {children}
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="longpress-context-menu"
            role="menu"
            aria-label="Context menu"
            className="fixed z-50 min-w-[160px] overflow-hidden rounded-xl border border-border bg-popover shadow-2xl"
            style={{ left: position.x, top: position.y }}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={springs.bouncy}
          >
            {ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  role="menuitem"
                  onClick={() => handleAction(action.id)}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-accent ${
                    action.destructive
                      ? "text-red-400 hover:text-red-300"
                      : "text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{action.label}</span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
});
