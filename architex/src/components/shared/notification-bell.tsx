"use client";

import { memo, useMemo, useCallback } from "react";
import {
  Bell,
  Trophy,
  Flame,
  Zap,
  Info,
  Lightbulb,
  CheckCheck,
  Trash2,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Settings,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotificationStore } from "@/stores/notification-store";
import type { AppNotification, NotificationType } from "@/stores/notification-store";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

// ── Icon mapping by notification type ────────────────────────────

const TYPE_ICON: Record<NotificationType, LucideIcon> = {
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

const TYPE_COLOR: Record<NotificationType, string> = {
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

const TYPE_BG: Record<NotificationType, string> = {
  info: "bg-blue-500/15",
  success: "bg-emerald-500/15",
  warning: "bg-amber-500/15",
  error: "bg-red-500/15",
  achievement: "bg-amber-500/15",
  streak: "bg-orange-500/15",
  challenge: "bg-primary/15",
  system: "bg-blue-500/15",
  tip: "bg-emerald-500/15",
};

// ── Date grouping helpers ────────────────────────────────────────

function getDateGroup(isoString: string): "today" | "yesterday" | "older" {
  const date = new Date(isoString);
  const now = new Date();

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday.getTime() - 86_400_000);

  if (date >= startOfToday) return "today";
  if (date >= startOfYesterday) return "yesterday";
  return "older";
}

function groupNotifications(
  notifications: AppNotification[],
): { label: string; items: AppNotification[] }[] {
  const groups: Record<string, AppNotification[]> = {
    today: [],
    yesterday: [],
    older: [],
  };

  for (const n of notifications) {
    const group = getDateGroup(n.createdAt);
    groups[group].push(n);
  }

  const result: { label: string; items: AppNotification[] }[] = [];
  if (groups.today.length > 0) result.push({ label: "Today", items: groups.today });
  if (groups.yesterday.length > 0)
    result.push({ label: "Yesterday", items: groups.yesterday });
  if (groups.older.length > 0) result.push({ label: "Older", items: groups.older });

  return result;
}

// ── Time-ago helper ──────────────────────────────────────────────

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(isoString).toLocaleDateString();
}

// ── Single notification item ─────────────────────────────────────

const NotificationItem = memo(function NotificationItem({
  notification,
  onMarkRead,
  onDismiss,
}: {
  notification: AppNotification;
  onMarkRead: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  const Icon = TYPE_ICON[notification.type];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => {
        if (!notification.read) onMarkRead(notification.id);
        if (notification.action) notification.action.onClick();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (!notification.read) onMarkRead(notification.id);
          if (notification.action) notification.action.onClick();
        }
      }}
      className={cn(
        "group flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors cursor-pointer",
        notification.read
          ? "opacity-60 hover:bg-elevated/50"
          : "bg-elevated/30 hover:bg-elevated/60",
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          TYPE_BG[notification.type],
        )}
      >
        <Icon className={cn("h-4 w-4", TYPE_COLOR[notification.type])} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p
            className={cn(
              "truncate text-sm font-medium",
              notification.read ? "text-foreground-muted" : "text-foreground",
            )}
          >
            {notification.title}
          </p>
          {!notification.read && (
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
          )}
        </div>
        <p className="mt-0.5 text-xs leading-relaxed text-foreground-muted line-clamp-2">
          {notification.message}
        </p>
        {notification.action && (
          <span className="mt-1 inline-block text-xs font-medium text-primary">
            {notification.action.label}
          </span>
        )}
        <p className="mt-1 text-[10px] text-foreground-subtle">
          {timeAgo(notification.createdAt)}
        </p>
      </div>

      {/* Dismiss button (visible on hover) */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDismiss(notification.id);
        }}
        className="shrink-0 rounded-md p-1 text-foreground-subtle opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground-muted"
        aria-label="Dismiss notification"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
});

// ── Notification Bell (exported) ─────────────────────────────────

export const NotificationBell = memo(function NotificationBell() {
  const notifications = useNotificationStore((s) => s.notifications);
  const markRead = useNotificationStore((s) => s.markRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const dismiss = useNotificationStore((s) => s.dismiss);
  const clearAll = useNotificationStore((s) => s.clearAll);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  const groups = useMemo(
    () => groupNotifications(notifications),
    [notifications],
  );

  const handleMarkRead = useCallback(
    (id: string) => markRead(id),
    [markRead],
  );

  const handleDismiss = useCallback(
    (id: string) => dismiss(id),
    [dismiss],
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
          className="relative flex h-10 w-10 items-center justify-center rounded-lg text-foreground-muted transition-colors hover:bg-sidebar-accent hover:text-foreground"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        side="right"
        align="end"
        sideOffset={8}
        className="w-80 p-0"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold text-foreground">
            Notifications
          </h3>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                aria-label="Mark all as read"
                className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-foreground-muted transition-colors hover:bg-elevated hover:text-foreground"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Read all</span>
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={clearAll}
                aria-label="Clear all notifications"
                className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-foreground-muted transition-colors hover:bg-elevated hover:text-red-400"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Notification list -- grouped by today/yesterday/older */}
        {groups.length > 0 ? (
          <ScrollArea className="max-h-[400px]">
            <div className="flex flex-col gap-0.5 p-1">
              {groups.map((group) => (
                <div key={group.label}>
                  <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-foreground-subtle">
                    {group.label}
                  </p>
                  {group.items.map((n) => (
                    <NotificationItem
                      key={n.id}
                      notification={n}
                      onMarkRead={handleMarkRead}
                      onDismiss={handleDismiss}
                    />
                  ))}
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center gap-2 px-4 py-8">
            <Bell className="h-8 w-8 text-foreground-subtle" />
            <p className="text-sm font-medium text-foreground-muted">
              All caught up!
            </p>
            <p className="text-xs text-foreground-subtle">
              No notifications yet
            </p>
          </div>
        )}

        {/* Footer with count */}
        {notifications.length > 0 && (
          <div className="border-t border-border px-4 py-2 text-center text-[10px] text-foreground-subtle">
            {notifications.length} notification{notifications.length !== 1 ? "s" : ""}
            {unreadCount > 0 && ` (${unreadCount} unread)`}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
});
