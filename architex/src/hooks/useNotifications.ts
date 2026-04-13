"use client";

import { useCallback, useMemo } from "react";
import { useNotificationStore } from "@/stores/notification-store";
import type { NotificationType, NotificationAction } from "@/stores/notification-store";

// ─────────────────────────────────────────────────────────────
// useNotifications — convenience hook for notification dispatch
// ─────────────────────────────────────────────────────────────

export function useNotifications() {
  const notifications = useNotificationStore((s) => s.notifications);
  const addNotification = useNotificationStore((s) => s.addNotification);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  /** Generic notification dispatch */
  const notify = useCallback(
    (
      type: NotificationType,
      title: string,
      message: string,
      action?: NotificationAction,
    ) => {
      addNotification({ type, title, message, action });
    },
    [addNotification],
  );

  /** Shorthand for success notifications */
  const notifySuccess = useCallback(
    (title: string, message: string, action?: NotificationAction) => {
      addNotification({ type: "success", title, message, action });
    },
    [addNotification],
  );

  /** Shorthand for error notifications */
  const notifyError = useCallback(
    (title: string, message: string, action?: NotificationAction) => {
      addNotification({ type: "error", title, message, action });
    },
    [addNotification],
  );

  /** Shorthand for warning notifications */
  const notifyWarning = useCallback(
    (title: string, message: string, action?: NotificationAction) => {
      addNotification({ type: "warning", title, message, action });
    },
    [addNotification],
  );

  /** Shorthand for info notifications */
  const notifyInfo = useCallback(
    (title: string, message: string, action?: NotificationAction) => {
      addNotification({ type: "info", title, message, action });
    },
    [addNotification],
  );

  return {
    notify,
    notifySuccess,
    notifyError,
    notifyWarning,
    notifyInfo,
    unreadCount,
  } as const;
}
