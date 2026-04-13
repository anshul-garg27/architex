"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Info,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Trophy,
  Flame,
  Zap,
  Settings,
  Lightbulb,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotificationStore } from "@/stores/notification-store";
import type { AppNotification, NotificationType } from "@/stores/notification-store";
import { animations, springs, duration, easing } from "@/lib/constants/motion";

// ── Constants ────────────────────────────────────────────────────

const MAX_VISIBLE_TOASTS = 3;
const DEFAULT_DISMISS_MS = 5000;

// ── Type icon/color maps ─────────────────────────────────────────

const TOAST_ICON: Record<NotificationType, LucideIcon> = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
  achievement: Trophy,
  streak: Flame,
  challenge: Zap,
  system: Settings,
  tip: Lightbulb,
};

const TOAST_ACCENT: Record<NotificationType, string> = {
  info: "border-l-blue-500",
  success: "border-l-emerald-500",
  warning: "border-l-amber-500",
  error: "border-l-red-500",
  achievement: "border-l-amber-500",
  streak: "border-l-orange-500",
  challenge: "border-l-primary",
  system: "border-l-blue-500",
  tip: "border-l-emerald-500",
};

const TOAST_ICON_COLOR: Record<NotificationType, string> = {
  info: "text-blue-400",
  success: "text-emerald-400",
  warning: "text-amber-400",
  error: "text-red-400",
  achievement: "text-amber-400",
  streak: "text-orange-400",
  challenge: "text-primary",
  system: "text-blue-400",
  tip: "text-emerald-400",
};

// ── Single Toast ─────────────────────────────────────────────────

interface ToastItemProps {
  notification: AppNotification;
  onDismiss: (id: string) => void;
  autoDismissMs: number;
}

const ToastItem = memo(function ToastItem({
  notification,
  onDismiss,
  autoDismissMs,
}: ToastItemProps) {
  const Icon = TOAST_ICON[notification.type];
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const startXRef = useRef<number | null>(null);

  // Auto-dismiss timer
  useEffect(() => {
    timerRef.current = setTimeout(() => {
      onDismiss(notification.id);
    }, autoDismissMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [notification.id, autoDismissMs, onDismiss]);

  // Swipe-to-dismiss handlers
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    startXRef.current = e.clientX;
  }, []);

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (startXRef.current !== null) {
        const deltaX = e.clientX - startXRef.current;
        if (deltaX > 80) {
          onDismiss(notification.id);
        }
        startXRef.current = null;
      }
    },
    [notification.id, onDismiss],
  );

  return (
    <motion.div
      layout
      initial={animations.toast.enter.initial}
      animate={animations.toast.enter.animate}
      exit={animations.toast.exit.exit}
      transition={springs.snappy}
      className={cn(
        "pointer-events-auto relative w-80 overflow-hidden rounded-lg border border-l-4 border-border",
        "bg-zinc-900/95 shadow-lg backdrop-blur-sm",
        TOAST_ACCENT[notification.type],
      )}
      role="alert"
      aria-live="polite"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      <div className="flex items-start gap-3 p-3">
        {/* Icon */}
        <Icon
          className={cn(
            "mt-0.5 h-4 w-4 shrink-0",
            TOAST_ICON_COLOR[notification.type],
          )}
        />

        {/* Content */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-zinc-100">
            {notification.title}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-zinc-400 line-clamp-2">
            {notification.message}
          </p>
          {notification.action && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                notification.action?.onClick();
                onDismiss(notification.id);
              }}
              className="mt-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            >
              {notification.action.label}
            </button>
          )}
        </div>

        {/* Dismiss */}
        <button
          onClick={() => onDismiss(notification.id)}
          className="shrink-0 rounded-md p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Auto-dismiss progress bar */}
      <motion.div
        className="absolute bottom-0 left-0 h-0.5 bg-white/10"
        initial={{ width: "100%" }}
        animate={{ width: "0%" }}
        transition={{ duration: autoDismissMs / 1000, ease: "linear" }}
      />
    </motion.div>
  );
});

// ── Toast Queue Container ────────────────────────────────────────

interface NotificationToastProps {
  /** Auto-dismiss time in ms. Default: 5000 */
  autoDismissMs?: number;
}

export const NotificationToast = memo(function NotificationToast({
  autoDismissMs = DEFAULT_DISMISS_MS,
}: NotificationToastProps) {
  const notifications = useNotificationStore((s) => s.notifications);
  const dismiss = useNotificationStore((s) => s.dismiss);

  // Track which notification IDs we have already shown as toasts
  // so we only show newly added ones.
  const seenIdsRef = useRef<Set<string>>(new Set());
  const [toastQueue, setToastQueue] = useState<AppNotification[]>([]);

  useEffect(() => {
    const newToasts: AppNotification[] = [];
    for (const n of notifications) {
      if (!seenIdsRef.current.has(n.id)) {
        seenIdsRef.current.add(n.id);
        newToasts.push(n);
      }
    }
    if (newToasts.length > 0) {
      setToastQueue((prev) => [...newToasts, ...prev]);
    }
  }, [notifications]);

  // Dismiss removes from both toast queue and notification store
  const handleDismiss = useCallback(
    (id: string) => {
      setToastQueue((prev) => prev.filter((t) => t.id !== id));
      // Mark as read in store rather than removing entirely
      const store = useNotificationStore.getState();
      const notification = store.notifications.find((n) => n.id === id);
      if (notification && !notification.read) {
        store.markRead(id);
      }
    },
    [],
  );

  // Only show the newest MAX_VISIBLE_TOASTS
  const visibleToasts = toastQueue.slice(0, MAX_VISIBLE_TOASTS);

  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col-reverse gap-2 sm:bottom-6 sm:right-6"
      aria-label="Notifications"
    >
      <AnimatePresence mode="popLayout">
        {visibleToasts.map((toast) => (
          <ToastItem
            key={toast.id}
            notification={toast}
            onDismiss={handleDismiss}
            autoDismissMs={autoDismissMs}
          />
        ))}
      </AnimatePresence>
    </div>
  );
});
