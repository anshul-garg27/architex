import { create } from "zustand";
import { persist } from "zustand/middleware";

// ─────────────────────────────────────────────────────────────
// Notification Store
// ─────────────────────────────────────────────────────────────

export type NotificationType =
  | "info"
  | "success"
  | "warning"
  | "error"
  | "achievement"
  | "streak"
  | "challenge"
  | "system"
  | "tip";

export interface NotificationAction {
  label: string;
  onClick: () => void;
}

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  icon?: string;
  action?: NotificationAction;
}

const MAX_NOTIFICATIONS = 100;

interface NotificationState {
  notifications: AppNotification[];
  addNotification: (
    n: Omit<AppNotification, "id" | "read" | "createdAt">,
  ) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  dismiss: (id: string) => void;
  clearAll: () => void;
  unreadCount: () => number;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],

      addNotification: (n) =>
        set((s) => {
          const notification: AppNotification = {
            ...n,
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            read: false,
            createdAt: new Date().toISOString(),
          };
          const updated = [notification, ...s.notifications];
          // Enforce max limit -- remove oldest beyond the cap
          return {
            notifications:
              updated.length > MAX_NOTIFICATIONS
                ? updated.slice(0, MAX_NOTIFICATIONS)
                : updated,
          };
        }),

      markRead: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n,
          ),
        })),

      markAllRead: () =>
        set((s) => ({
          notifications: s.notifications.map((n) => ({ ...n, read: true })),
        })),

      dismiss: (id) =>
        set((s) => ({
          notifications: s.notifications.filter((n) => n.id !== id),
        })),

      clearAll: () => set({ notifications: [] }),

      unreadCount: () => get().notifications.filter((n) => !n.read).length,
    }),
    {
      name: "architex-notifications",
      partialize: (state) => ({
        notifications: state.notifications.map((n) => ({
          ...n,
          // Strip non-serializable action callbacks before persisting
          action: undefined,
        })),
      }),
    },
  ),
);
