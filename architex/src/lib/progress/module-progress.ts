// ─────────────────────────────────────────────────────────────
// Architex — Module Progress Tracking
// ─────────────────────────────────────────────────────────────
//
// Client-side progress tracking via localStorage.
// Tracks which features have been explored per module, activity
// history, and aggregated progress metrics.

import type { ModuleType } from "@/stores/ui-store";

// ── Types ──────────────────────────────────────────────────────

export interface ActivityEntry {
  id: string;
  action: string;
  moduleId: ModuleType;
  timestamp: string; // ISO date
  detail?: string;
}

export interface ModuleProgressData {
  moduleId: ModuleType;
  featuresExplored: string[];
  lastVisited: string | null; // ISO date
  visitCount: number;
}

export interface OverallProgress {
  modulesExplored: number;
  totalModules: number;
  challengesCompleted: number;
  totalFeaturesExplored: number;
  streakDays: number;
}

// ── Module feature maps ────────────────────────────────────────
// Each module defines which features exist. Progress = explored / total.

const MODULE_FEATURES: Record<ModuleType, string[]> = {
  "system-design": [
    "canvas-drag-drop",
    "component-palette",
    "edge-connections",
    "simulation-run",
    "template-gallery",
    "export-diagram",
    "properties-panel",
    "chaos-testing",
    "capacity-planner",
  ],
  algorithms: [
    "sorting-visualization",
    "graph-algorithms",
    "tree-traversals",
    "dynamic-programming",
    "string-algorithms",
    "playback-controls",
  ],
  "data-structures": [
    "array",
    "stack",
    "queue",
    "linked-list",
    "hash-table",
    "bst",
    "bloom-filter",
    "skip-list",
    "heap",
    "trie",
    "union-find",
    "lsm-tree",
    "consistent-hash",
    "merkle-tree",
    "count-min-sketch",
    "hyperloglog",
    "deque",
    "circular-buffer",
    "wal",
    "rope",
    "r-tree",
    "quadtree",
    "fibonacci-heap",
    "avl-tree",
    "red-black-tree",
    "segment-tree",
    "bplus-tree",
    "fenwick-tree",
    "splay-tree",
    "crdt",
    "vector-clock",
    "treap",
    "binomial-heap",
    "b-tree",
    "doubly-linked-list",
    "priority-queue",
    "lru-cache",
    "cuckoo-hash",
    "monotonic-stack",
  ],
  lld: [
    // ── Design Patterns (31) ──────────────────────────────────
    "pattern-singleton",
    "pattern-factory-method",
    "pattern-abstract-factory",
    "pattern-builder",
    "pattern-prototype",
    "pattern-adapter",
    "pattern-bridge",
    "pattern-composite",
    "pattern-decorator",
    "pattern-facade",
    "pattern-proxy",
    "pattern-observer",
    "pattern-strategy",
    "pattern-command",
    "pattern-state",
    "pattern-iterator",
    "pattern-mediator",
    "pattern-template-method",
    "pattern-chain-of-responsibility",
    "pattern-memento",
    "pattern-visitor",
    "pattern-repository",
    "pattern-cqrs",
    "pattern-event-sourcing",
    "pattern-saga",
    "pattern-circuit-breaker",
    "pattern-bulkhead",
    "pattern-retry",
    "pattern-rate-limiter",
    "pattern-thread-pool",
    "pattern-producer-consumer",
    // ── SOLID Principles (5) ──────────────────────────────────
    "solid-srp",
    "solid-ocp",
    "solid-lsp",
    "solid-isp",
    "solid-dip",
    // ── LLD Problems (25) ─────────────────────────────────────
    "problem-parking-lot",
    "problem-elevator",
    "problem-chess",
    "problem-vending-machine",
    "problem-library",
    "problem-atm",
    "problem-hotel",
    "problem-snake-ladder",
    "problem-file-system",
    "problem-lru-cache",
    "problem-movie-ticket-booking",
    "problem-restaurant-management",
    "problem-airline-booking",
    "problem-tic-tac-toe",
    "problem-snake-game",
    "problem-card-game",
    "problem-notification-service",
    "problem-logging-framework",
    "problem-cache-system",
    "problem-task-scheduler",
    "problem-pub-sub-system",
    "problem-rate-limiter",
    "problem-url-shortener",
    "problem-social-media-feed",
    "problem-spreadsheet",
    // ── Sequence Diagram Examples (5) ─────────────────────────
    "sequence-http-request",
    "sequence-oauth-login",
    "sequence-order-processing",
    "sequence-pub-sub",
    "sequence-cache-aside",
    // ── State Machines (3) ────────────────────────────────────
    "state-machine-order-lifecycle",
    "state-machine-tcp-connection",
    "state-machine-traffic-light",
    // ── Tools (3) ─────────────────────────────────────────────
    "code-to-diagram",
    "behavioral-simulator",
    "latency-overlay",
  ],
  database: [
    "normalization",
    "btree-visualization",
    "query-plan",
    "transaction-simulator",
    "indexing",
  ],
  distributed: [
    "cap-theorem",
    "consistent-hashing",
    "raft-consensus",
    "gossip-protocol",
    "vector-clocks",
    "crdt",
    "two-phase-commit",
    "saga-pattern",
    "map-reduce",
    "lamport-timestamps",
    "paxos",
  ],
  networking: [
    "tcp-state-machine",
    "tls-handshake",
    "http-comparison",
    "websocket-lifecycle",
    "cors-simulator",
  ],
  os: [
    "page-replacement",
    "memory-management",
    "deadlock-detection",
    "process-scheduling",
  ],
  concurrency: [
    "producer-consumer",
    "dining-philosophers",
    "event-loop",
    "thread-lifecycle",
    "goroutines",
  ],
  security: [
    "oauth-flows",
    "jwt-engine",
    "aes-encryption",
    "diffie-hellman",
    "jwt-attacks",
    "https-flow",
  ],
  "ml-design": [
    "neural-network",
    "pipeline-templates",
    "serving-patterns",
    "datasets",
  ],
  interview: [
    "challenge-attempt",
    "estimation-pad",
    "scoring-review",
    "hint-system",
    "leaderboard",
  ],
  "knowledge-graph": [
    "concept-explorer",
    "relationship-map",
    "search",
  ],
};

// ── Storage Keys ───────────────────────────────────────────────

const STORAGE_KEY_PROGRESS = "architex-module-progress";
const STORAGE_KEY_ACTIVITY = "architex-activity-log";
const MAX_ACTIVITY_ENTRIES = 200;

// ── Helpers ────────────────────────────────────────────────────

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable — silently degrade
  }
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ── Progress Per Module ────────────────────────────────────────

function readAllProgress(): Record<string, ModuleProgressData> {
  return readStorage<Record<string, ModuleProgressData>>(
    STORAGE_KEY_PROGRESS,
    {},
  );
}

function writeAllProgress(data: Record<string, ModuleProgressData>): void {
  writeStorage(STORAGE_KEY_PROGRESS, data);
}

/**
 * Returns the progress data for a single module.
 * Includes explored feature count, percentage, and visit info.
 */
export function getModuleProgress(moduleId: ModuleType): {
  explored: number;
  total: number;
  percentage: number;
  featuresExplored: string[];
  lastVisited: string | null;
  visitCount: number;
} {
  const all = readAllProgress();
  const data = all[moduleId];
  const totalFeatures = MODULE_FEATURES[moduleId]?.length ?? 0;
  const explored = data?.featuresExplored?.length ?? 0;

  return {
    explored,
    total: totalFeatures,
    percentage: totalFeatures > 0 ? Math.round((explored / totalFeatures) * 100) : 0,
    featuresExplored: data?.featuresExplored ?? [],
    lastVisited: data?.lastVisited ?? null,
    visitCount: data?.visitCount ?? 0,
  };
}

/**
 * Mark a feature as explored within a module.
 * Idempotent: re-exploring the same feature is a no-op.
 */
export function markFeatureExplored(
  moduleId: ModuleType,
  featureId: string,
): void {
  const all = readAllProgress();
  const existing = all[moduleId] ?? {
    moduleId,
    featuresExplored: [],
    lastVisited: null,
    visitCount: 0,
  };

  if (!existing.featuresExplored.includes(featureId)) {
    existing.featuresExplored = [...existing.featuresExplored, featureId];
  }

  all[moduleId] = existing;
  writeAllProgress(all);
}

/**
 * Record a module visit. Increments visit count and updates lastVisited.
 */
export function recordModuleVisit(moduleId: ModuleType): void {
  const all = readAllProgress();
  const existing = all[moduleId] ?? {
    moduleId,
    featuresExplored: [],
    lastVisited: null,
    visitCount: 0,
  };

  existing.visitCount += 1;
  existing.lastVisited = new Date().toISOString();
  all[moduleId] = existing;
  writeAllProgress(all);
}

// ── Streak Computation ────────────────────────────────────────

/**
 * Compute the number of consecutive calendar days (ending today) that
 * have at least one activity entry. Missing a calendar day resets the
 * streak to 0.
 */
function computeStreakDays(): number {
  const entries = readActivityLog();
  if (entries.length === 0) return 0;

  // Collect unique calendar-day strings (YYYY-MM-DD in local time)
  const daySet = new Set<string>();
  for (const entry of entries) {
    const d = new Date(entry.timestamp);
    if (Number.isNaN(d.getTime())) continue;
    daySet.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  }

  if (daySet.size === 0) return 0;

  // Sort days descending (most recent first)
  const sortedDays = Array.from(daySet).sort().reverse();

  // Check whether the most recent activity day is today or yesterday.
  // If neither, the streak is 0.
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  if (sortedDays[0] !== todayStr && sortedDays[0] !== yesterdayStr) {
    return 0;
  }

  // Walk backwards from the most recent activity day counting consecutive days
  let streak = 1;
  for (let i = 1; i < sortedDays.length; i++) {
    const prev = new Date(sortedDays[i - 1] + 'T00:00:00');
    const curr = new Date(sortedDays[i] + 'T00:00:00');
    const diffMs = prev.getTime() - curr.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      streak += 1;
    } else {
      break;
    }
  }

  return streak;
}

// ── Overall Progress ───────────────────────────────────────────

/**
 * Aggregate progress across all modules.
 */
export function getOverallProgress(): OverallProgress {
  const all = readAllProgress();
  const moduleIds = Object.keys(MODULE_FEATURES) as ModuleType[];

  let modulesExplored = 0;
  let totalFeaturesExplored = 0;

  for (const moduleId of moduleIds) {
    const data = all[moduleId];
    if (data && data.visitCount > 0) {
      modulesExplored += 1;
    }
    totalFeaturesExplored += data?.featuresExplored?.length ?? 0;
  }

  // Compute streak from activity log (consecutive calendar days)
  const streakDays = computeStreakDays();

  // Read challenge completions
  let challengesCompleted = 0;
  try {
    const progressStoreRaw = localStorage.getItem("architex-progress");
    if (progressStoreRaw) {
      const parsed = JSON.parse(progressStoreRaw);
      const attempts = parsed?.state?.attempts ?? [];
      const uniqueChallenges = new Set(
        (attempts as Array<{ challengeId: string }>).map((a) => a.challengeId),
      );
      challengesCompleted = uniqueChallenges.size;
    }
  } catch {
    // no-op
  }

  return {
    modulesExplored,
    totalModules: moduleIds.length,
    challengesCompleted,
    totalFeaturesExplored,
    streakDays,
  };
}

/**
 * Returns which modules have never been visited.
 */
export function getUnvisitedModules(): ModuleType[] {
  const all = readAllProgress();
  const moduleIds = Object.keys(MODULE_FEATURES) as ModuleType[];
  return moduleIds.filter((id) => !all[id] || all[id].visitCount === 0);
}

// ── Activity Log ───────────────────────────────────────────────

function readActivityLog(): ActivityEntry[] {
  return readStorage<ActivityEntry[]>(STORAGE_KEY_ACTIVITY, []);
}

function writeActivityLog(entries: ActivityEntry[]): void {
  writeStorage(STORAGE_KEY_ACTIVITY, entries);
}

/**
 * Log a user action to the activity timeline.
 */
export function logActivity(
  action: string,
  moduleId: ModuleType,
  detail?: string,
): void {
  const entries = readActivityLog();
  const entry: ActivityEntry = {
    id: generateId(),
    action,
    moduleId,
    timestamp: new Date().toISOString(),
    detail,
  };

  entries.unshift(entry);

  // Trim to max entries
  if (entries.length > MAX_ACTIVITY_ENTRIES) {
    entries.length = MAX_ACTIVITY_ENTRIES;
  }

  writeActivityLog(entries);
}

/**
 * Get the most recent N activity entries.
 */
export function getRecentActivity(count = 5): ActivityEntry[] {
  const entries = readActivityLog();
  return entries.slice(0, count);
}

/**
 * Returns all module IDs with their feature definitions.
 * Useful for the modules grid page.
 */
export function getAllModules(): Array<{
  id: ModuleType;
  featureCount: number;
}> {
  return (Object.keys(MODULE_FEATURES) as ModuleType[]).map((id) => ({
    id,
    featureCount: MODULE_FEATURES[id].length,
  }));
}

/**
 * Returns the most recently visited module ID, or null if none visited.
 */
export function getLastActiveModule(): ModuleType | null {
  const all = readAllProgress();
  let latest: { id: ModuleType; time: number } | null = null;

  for (const [id, data] of Object.entries(all)) {
    if (data.lastVisited) {
      const time = new Date(data.lastVisited).getTime();
      if (!latest || time > latest.time) {
        latest = { id: id as ModuleType, time };
      }
    }
  }

  return latest?.id ?? null;
}

// ── LLD Module Exploration Tracking ──────────────────────────
//
// Convenience utility for the LLD module to track feature exploration.
// The actual calling from UI hooks (useLLDModuleImpl) is a separate
// wiring task -- this function makes it easy for that hook to call.

/**
 * Track exploration of an LLD feature.
 * Calls markFeatureExplored('lld', featureKey) and logs the activity.
 *
 * @param featureKey - One of the keys defined in MODULE_FEATURES['lld'],
 *   e.g. "pattern-singleton", "problem-parking-lot", "sequence-http-request"
 */
export function trackLLDExploration(featureKey: string): void {
  markFeatureExplored("lld", featureKey);
  logActivity("explored", "lld", featureKey);
}
