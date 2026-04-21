"use client";

import { useEffect, useRef } from "react";
import { useUIStore, type ModuleType } from "@/stores/ui-store";
import { useSimulationStore, type SimulationStatus } from "@/stores/simulation-store";
import { useNotificationStore } from "@/stores/notification-store";

// ── Module labels for tip notifications ─────────────────────────

const MODULE_LABELS: Record<ModuleType, string> = {
  "system-design": "System Design",
  algorithms: "Algorithms",
  "data-structures": "Data Structures",
  lld: "Low-Level Design",
  blueprint: "Blueprint",
  database: "Database",
  distributed: "Distributed Systems",
  networking: "Networking",
  os: "OS Concepts",
  concurrency: "Concurrency",
  security: "Security",
  "ml-design": "ML Design",
  interview: "Interview",
  "knowledge-graph": "Knowledge Graph",
};

const STORAGE_KEY_VISITED = "architex-visited-modules";

function getVisitedModules(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY_VISITED);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function markModuleVisited(module: string): void {
  const visited = getVisitedModules();
  visited.add(module);
  try {
    localStorage.setItem(STORAGE_KEY_VISITED, JSON.stringify([...visited]));
  } catch {
    // ignore quota errors
  }
}

// ── Hook: module-visit tips ─────────────────────────────────────

/**
 * Fires a "Welcome to [module]" tip notification the first time a user
 * navigates to each module.
 */
export function useModuleVisitNotifications() {
  const activeModule = useUIStore((s) => s.activeModule);
  const addNotification = useNotificationStore((s) => s.addNotification);
  const prevModuleRef = useRef<string | null>(null);

  useEffect(() => {
    // Only trigger on actual navigation, not the initial mount
    if (prevModuleRef.current === null) {
      prevModuleRef.current = activeModule;
      // But still check if it's a first-ever visit
      const visited = getVisitedModules();
      if (!visited.has(activeModule)) {
        markModuleVisited(activeModule);
        addNotification({
          type: "tip",
          title: `Welcome to ${MODULE_LABELS[activeModule]}!`,
          message: `You're exploring the ${MODULE_LABELS[activeModule]} module for the first time. Check out the sidebar for available components and tools.`,
          icon: "Lightbulb",
        });
      }
      return;
    }

    if (activeModule === prevModuleRef.current) return;
    prevModuleRef.current = activeModule;

    const visited = getVisitedModules();
    if (visited.has(activeModule)) return;

    markModuleVisited(activeModule);
    addNotification({
      type: "tip",
      title: `Welcome to ${MODULE_LABELS[activeModule]}!`,
      message: `You're exploring the ${MODULE_LABELS[activeModule]} module for the first time. Check out the sidebar for available components and tools.`,
      icon: "Lightbulb",
    });
  }, [activeModule, addNotification]);
}

// ── Helper: push achievement notification ────────────────────────

/**
 * Call this from InterviewModule (or anywhere) when achievements are unlocked.
 */
export function notifyAchievementUnlocked(
  name: string,
  xpReward: number,
  icon?: string,
) {
  useNotificationStore.getState().addNotification({
    type: "achievement",
    title: `Achievement Unlocked: ${name}`,
    message: `You earned "${name}" and gained +${xpReward} XP! Keep up the great work.`,
    icon: icon ?? "Trophy",
  });
}

// ── Helper: push streak milestone notification ───────────────────

export function notifyStreakMilestone(streakDays: number) {
  const milestones = [7, 30, 100];
  if (!milestones.includes(streakDays)) return;

  const labels: Record<number, string> = {
    7: "One Week",
    30: "One Month",
    100: "Hundred Days",
  };

  useNotificationStore.getState().addNotification({
    type: "streak",
    title: `${labels[streakDays]} Streak!`,
    message: `Incredible! You've practiced for ${streakDays} consecutive days. Your dedication is paying off.`,
    icon: "Flame",
  });
}

// ── Helper: push daily challenge notification ────────────────────

export function notifyDailyChallengeAvailable(challengeTitle: string) {
  useNotificationStore.getState().addNotification({
    type: "challenge",
    title: "Daily Challenge Available",
    message: `Today's challenge is ready: "${challengeTitle}". Head to the Interview module to start!`,
    icon: "Zap",
  });
}

// ── Hook: simulation lifecycle notifications ────────────────────

/**
 * Fires notifications when a simulation completes or errors.
 */
export function useSimulationNotifications() {
  const status = useSimulationStore((s) => s.status);
  const metrics = useSimulationStore((s) => s.metrics);
  const addNotification = useNotificationStore((s) => s.addNotification);
  const prevStatusRef = useRef<SimulationStatus>("idle");

  useEffect(() => {
    const prev = prevStatusRef.current;
    prevStatusRef.current = status;

    // Only trigger on actual transitions, not the initial mount
    if (prev === status) return;

    if (status === "completed") {
      addNotification({
        type: "success",
        title: "Simulation Complete",
        message: `Finished with ${metrics.totalRequests.toLocaleString()} requests at ${metrics.throughputRps.toFixed(0)} rps. Average latency: ${metrics.avgLatencyMs.toFixed(1)}ms.`,
        icon: "CheckCircle",
      });
    }

    if (status === "error") {
      addNotification({
        type: "error",
        title: "Simulation Error",
        message: `Simulation encountered an error after ${metrics.totalRequests.toLocaleString()} requests. Error rate: ${(metrics.errorRate * 100).toFixed(1)}%.`,
        icon: "AlertCircle",
      });
    }
  }, [status, metrics, addNotification]);
}

// ── Helper: push export-complete notification ───────────────────

export function notifyExportComplete(format: string, fileName?: string) {
  useNotificationStore.getState().addNotification({
    type: "success",
    title: "Export Complete",
    message: fileName
      ? `Successfully exported "${fileName}" as ${format.toUpperCase()}.`
      : `Successfully exported diagram as ${format.toUpperCase()}.`,
    icon: "CheckCircle",
  });
}

// ── Helper: push generic error notification ─────────────────────

export function notifyError(title: string, message: string) {
  useNotificationStore.getState().addNotification({
    type: "error",
    title,
    message,
    icon: "AlertCircle",
  });
}
