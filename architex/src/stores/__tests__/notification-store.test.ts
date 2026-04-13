import { describe, it, expect, beforeEach } from "vitest";
import { useNotificationStore } from "../notification-store";
import type { NotificationType } from "../notification-store";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function addSample(
  type: NotificationType = "info",
  title = "Test",
  message = "Test message",
) {
  useNotificationStore.getState().addNotification({ type, title, message });
}

function getState() {
  return useNotificationStore.getState();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("notification-store", () => {
  beforeEach(() => {
    getState().clearAll();
  });

  // ── Initial state ────────────────────────────────────────────────────

  it("starts with an empty notification list", () => {
    expect(getState().notifications).toHaveLength(0);
  });

  it("unreadCount returns 0 when empty", () => {
    expect(getState().unreadCount()).toBe(0);
  });

  // ── addNotification ──────────────────────────────────────────────────

  it("adds a notification with auto-generated id and timestamp", () => {
    addSample("success", "Hello", "World");

    const { notifications } = getState();
    expect(notifications).toHaveLength(1);
    expect(notifications[0].type).toBe("success");
    expect(notifications[0].title).toBe("Hello");
    expect(notifications[0].message).toBe("World");
    expect(notifications[0].read).toBe(false);
    expect(notifications[0].id).toBeTruthy();
    expect(notifications[0].createdAt).toBeTruthy();
  });

  it("prepends new notifications (newest first)", () => {
    addSample("info", "First");
    addSample("info", "Second");

    const { notifications } = getState();
    expect(notifications[0].title).toBe("Second");
    expect(notifications[1].title).toBe("First");
  });

  it("generates unique ids for each notification", () => {
    addSample();
    addSample();
    addSample();

    const ids = getState().notifications.map((n) => n.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(3);
  });

  it("enforces max 100 notifications via FIFO eviction", () => {
    for (let i = 0; i < 105; i++) {
      addSample("info", `Notification ${i}`);
    }

    expect(getState().notifications).toHaveLength(100);
    // Newest should be first
    expect(getState().notifications[0].title).toBe("Notification 104");
  });

  // ── markRead ─────────────────────────────────────────────────────────

  it("marks a specific notification as read", () => {
    addSample();
    const id = getState().notifications[0].id;

    getState().markRead(id);

    expect(getState().notifications[0].read).toBe(true);
  });

  it("does not affect other notifications when marking one read", () => {
    addSample("info", "First");
    addSample("info", "Second");

    const firstId = getState().notifications[1].id; // First added is at index 1
    getState().markRead(firstId);

    expect(getState().notifications[0].read).toBe(false); // Second
    expect(getState().notifications[1].read).toBe(true); // First
  });

  it("handles marking a non-existent id gracefully", () => {
    addSample();
    getState().markRead("non-existent-id");
    expect(getState().notifications[0].read).toBe(false);
  });

  // ── markAllRead ──────────────────────────────────────────────────────

  it("marks all notifications as read", () => {
    addSample();
    addSample();
    addSample();

    getState().markAllRead();

    const allRead = getState().notifications.every((n) => n.read);
    expect(allRead).toBe(true);
  });

  it("markAllRead on empty list does not throw", () => {
    expect(() => getState().markAllRead()).not.toThrow();
  });

  // ── dismiss ──────────────────────────────────────────────────────────

  it("removes a notification by id", () => {
    addSample("info", "Keep");
    addSample("error", "Remove");

    const removeId = getState().notifications[0].id; // "Remove" is newest
    getState().dismiss(removeId);

    const { notifications } = getState();
    expect(notifications).toHaveLength(1);
    expect(notifications[0].title).toBe("Keep");
  });

  it("dismiss with non-existent id does not remove anything", () => {
    addSample();
    getState().dismiss("non-existent-id");
    expect(getState().notifications).toHaveLength(1);
  });

  // ── clearAll ─────────────────────────────────────────────────────────

  it("removes all notifications", () => {
    addSample();
    addSample();

    getState().clearAll();

    expect(getState().notifications).toHaveLength(0);
  });

  // ── unreadCount ──────────────────────────────────────────────────────

  it("returns correct unread count", () => {
    addSample();
    addSample();
    addSample();

    expect(getState().unreadCount()).toBe(3);

    getState().markRead(getState().notifications[0].id);
    expect(getState().unreadCount()).toBe(2);

    getState().markAllRead();
    expect(getState().unreadCount()).toBe(0);
  });

  // ── notification types ───────────────────────────────────────────────

  it("supports all notification types", () => {
    const types: NotificationType[] = [
      "info",
      "success",
      "warning",
      "error",
      "achievement",
      "streak",
      "challenge",
      "system",
      "tip",
    ];

    for (const type of types) {
      addSample(type, `Type: ${type}`);
    }

    expect(getState().notifications).toHaveLength(types.length);

    const storedTypes = getState().notifications.map((n) => n.type);
    for (const type of types) {
      expect(storedTypes).toContain(type);
    }
  });

  // ── action field ─────────────────────────────────────────────────────

  it("stores optional action on a notification", () => {
    const action = { label: "View", onClick: () => {} };
    getState().addNotification({
      type: "info",
      title: "With action",
      message: "Has an action button",
      action,
    });

    const n = getState().notifications[0];
    expect(n.action).toBeDefined();
    expect(n.action?.label).toBe("View");
  });

  // ── icon field ───────────────────────────────────────────────────────

  it("stores optional icon on a notification", () => {
    getState().addNotification({
      type: "achievement",
      title: "Badge",
      message: "You did it",
      icon: "Trophy",
    });

    expect(getState().notifications[0].icon).toBe("Trophy");
  });
});
