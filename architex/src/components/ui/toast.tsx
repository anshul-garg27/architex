"use client";

import { create } from "zustand";
import { memo, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { animations, duration, easing } from "@/lib/constants/motion";

// ── Toast Types ──────────────────────────────────────────────────

/** Semantic type controlling the toast icon and color. */
type ToastType = "success" | "error" | "warning" | "info";

/** A single toast notification instance. */
interface Toast {
  /** Unique identifier generated on creation. */
  id: string;
  /** Semantic type controlling icon and styling. */
  type: ToastType;
  /** Text content displayed in the toast. */
  message: string;
  /** Auto-dismiss delay in milliseconds. Falls back to type-specific defaults. */
  duration?: number;
}

/** Zustand store shape for managing active toasts. */
interface ToastState {
  /** Currently visible toasts (max 3 rendered). */
  toasts: Toast[];
  /** Add a toast; id is generated automatically. */
  addToast: (toast: Omit<Toast, "id">) => void;
  /** Remove a toast by its id. */
  removeToast: (id: string) => void;
}

// ── Toast Store ──────────────────────────────────────────────────

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (toast) =>
    set((s) => ({
      toasts: [
        ...s.toasts.slice(-2),
        { ...toast, id: Date.now().toString() },
      ],
    })),
  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

// ── Helper ───────────────────────────────────────────────────────

/** Convenience function to show a toast from anywhere (no hook needed). */
export function toast(type: ToastType, message: string, duration?: number) {
  useToastStore.getState().addToast({ type, message, duration });
}

// ── Config ───────────────────────────────────────────────────────

const DEFAULT_DURATIONS: Record<ToastType, number> = {
  success: 3000,
  info: 4000,
  warning: 6000,
  error: 8000,
};

const ICON_MAP: Record<ToastType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const COLOR_MAP: Record<ToastType, string> = {
  success: "text-state-success",
  error: "text-state-error",
  warning: "text-state-warning",
  info: "text-state-active",
};

// ── Toast Item ───────────────────────────────────────────────────

const ToastItem = memo(function ToastItem({
  toast: t,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  const autoDismiss = t.duration ?? DEFAULT_DURATIONS[t.type];

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(t.id), autoDismiss);
    return () => clearTimeout(timer);
  }, [t.id, autoDismiss, onDismiss]);

  const Icon = ICON_MAP[t.type];

  return (
    <motion.div
      layout
      initial={animations.toast.enter.initial}
      animate={animations.toast.enter.animate}
      exit={animations.toast.exit.exit}
      transition={{ duration: duration.normal, ease: easing.in }}
    >
      <div
        className={cn(
          "pointer-events-auto flex w-80 items-start gap-3 rounded-lg border border-border bg-surface p-3 shadow-lg",
        )}
      >
        <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", COLOR_MAP[t.type])} />
        <p className="flex-1 text-sm text-foreground">{t.message}</p>
        <button
          onClick={() => onDismiss(t.id)}
          className="shrink-0 rounded p-0.5 text-foreground-muted hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  );
});

// ── Toast Container ──────────────────────────────────────────────

/** Renders the floating toast stack. Mount once in the root layout. */
export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  const handleDismiss = useCallback(
    (id: string) => removeToast(id),
    [removeToast],
  );

  return (
    <div
      className="pointer-events-none fixed bottom-16 right-4 flex flex-col-reverse gap-2"
      style={{ zIndex: "var(--z-toast)" }}
    >
      <AnimatePresence mode="popLayout">
        {toasts.slice(-3).map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={handleDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}
