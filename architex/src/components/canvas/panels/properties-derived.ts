/**
 * Pure derivation logic for the Properties panel.
 *
 * Turns a node's raw config into human-readable field metadata
 * (title-cased labels + unit suffixes) and "derived insight" rows that
 * make the invisible implications of a config visible: rough capacity,
 * connection ceiling, memory footprint, cache offload, and estimated
 * infrastructure cost (via the simulation cost model).
 */

import { computeNodeCost } from "@/lib/simulation/cost-model";

// ── Config key → label / unit ──────────────────────────────

const UNIT_SUFFIXES: { re: RegExp; unit: string }[] = [
  { re: /Ms$/, unit: "ms" },
  { re: /Rps$/, unit: "req/s" },
  { re: /Mbps$/, unit: "Mb/s" },
  { re: /Gbps$/, unit: "Gb/s" },
  { re: /MB$/, unit: "MB" },
  { re: /GB$/, unit: "GB" },
  { re: /TB$/, unit: "TB" },
  { re: /Seconds$/, unit: "sec" },
  { re: /Minutes$/, unit: "min" },
  { re: /Hours$/, unit: "hr" },
  { re: /Days$/, unit: "days" },
];

const ACRONYMS = new Set([
  "ttl",
  "cidr",
  "mfa",
  "ssl",
  "mtls",
  "wal",
  "api",
  "cdn",
  "dns",
  "rps",
]);

export interface ConfigKeyInfo {
  /** Human label, e.g. "Processing Time". */
  label: string;
  /** Unit suffix stripped from the key, e.g. "ms". */
  unit?: string;
}

/** Parse a camelCase config key into a title-cased label plus unit. */
export function parseConfigKey(key: string): ConfigKeyInfo {
  let base = key;
  let unit: string | undefined;
  for (const { re, unit: u } of UNIT_SUFFIXES) {
    if (re.test(base) && base.replace(re, "").length > 0) {
      base = base.replace(re, "");
      unit = u;
      break;
    }
  }
  const label = base
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(" ")
    .map((word) =>
      ACRONYMS.has(word.toLowerCase())
        ? word.toUpperCase()
        : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(" ");
  return { label, unit };
}

// ── Number formatting ──────────────────────────────────────

/** Compact human formatting: 12500 → "12.5K", 2000000 → "2M". */
export function formatCompact(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${trimTrailingZero((value / 1_000_000).toFixed(1))}M`;
  if (abs >= 1_000) return `${trimTrailingZero((value / 1_000).toFixed(1))}K`;
  if (Number.isInteger(value)) return String(value);
  return trimTrailingZero(value.toFixed(1));
}

function trimTrailingZero(s: string): string {
  return s.replace(/\.0$/, "");
}

function formatDollars(value: number): string {
  if (value >= 100) {
    return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
  }
  return value.toFixed(2);
}

// ── Derived insights ───────────────────────────────────────

export interface DerivedInsight {
  /** Short row label, e.g. "Est. capacity". */
  label: string;
  /** Formatted headline value, e.g. "≈ 400 req/s". */
  value: string;
  /** How the value was derived, e.g. "20 × 20 req/s per instance". */
  formula?: string;
}

type ConfigValues = Record<string, string | number | boolean>;

function numericKey(config: ConfigValues, ...keys: string[]): number | undefined {
  for (const key of keys) {
    const v = config[key];
    if (typeof v === "number" && Number.isFinite(v)) return v;
  }
  return undefined;
}

/**
 * Compute live implications of a node's config. Every row is a rough,
 * directional estimate (deliberately queue-theory-free) so the panel can
 * show what a knob actually buys you as it changes.
 */
export function computeDerivedInsights(
  componentType: string,
  config: ConfigValues,
): DerivedInsight[] {
  const insights: DerivedInsight[] = [];

  const instances = numericKey(config, "instances", "replicas");
  const lanes = Math.max(1, instances ?? 1);

  // Rough capacity ≈ instances × (1000 / processingTimeMs) req/s.
  const processingTimeMs = numericKey(config, "processingTimeMs");
  if (processingTimeMs !== undefined && processingTimeMs > 0) {
    const perInstance = 1000 / processingTimeMs;
    insights.push({
      label: "Est. capacity",
      value: `≈ ${formatCompact(lanes * perInstance)} req/s`,
      formula:
        lanes > 1
          ? `${formatCompact(lanes)} × ${formatCompact(perInstance)} req/s each`
          : `1000ms ÷ ${formatCompact(processingTimeMs)}ms per request`,
    });
  }

  // Concurrent connection ceiling across all instances.
  const maxConnections = numericKey(config, "maxConnections");
  if (maxConnections !== undefined && maxConnections > 0) {
    insights.push({
      label: "Conn. ceiling",
      value: `${formatCompact(lanes * maxConnections)} concurrent`,
      formula:
        lanes > 1
          ? `${formatCompact(lanes)} × ${formatCompact(maxConnections)} per instance`
          : undefined,
    });
  }

  // Memory footprint across instances.
  const memoryGb = numericKey(config, "memoryGB");
  const memoryMb = numericKey(config, "memoryMB");
  if (memoryGb !== undefined || memoryMb !== undefined) {
    const perInstanceGb = memoryGb ?? (memoryMb as number) / 1024;
    insights.push({
      label: "Memory footprint",
      value: `${formatCompact(perInstanceGb * lanes)} GB`,
      formula:
        lanes > 1 ? `${formatCompact(lanes)} × ${formatCompact(perInstanceGb)} GB` : undefined,
    });
  }

  // Cache offload at steady state.
  const cacheHitRate = numericKey(config, "cacheHitRate");
  if (cacheHitRate !== undefined && cacheHitRate >= 0 && cacheHitRate <= 1) {
    insights.push({
      label: "Origin offload",
      value: `${Math.round(cacheHitRate * 100)}% of reads`,
      formula: "served from cache, skipping the backend",
    });
  }

  // Estimated infra cost via the simulation cost model.
  const storageTb = numericKey(config, "storageTB");
  const storageGb =
    numericKey(config, "storageGB") ?? (storageTb !== undefined ? storageTb * 1024 : 0);
  const shards = Math.max(1, numericKey(config, "shards") ?? 1);
  const breakdown = computeNodeCost({
    componentType,
    replicas: lanes,
    shards,
    storageGb,
    transferGbPerHour: 0,
    utilization: 0.5,
  });
  if (breakdown.totalPerMonth > 0) {
    insights.push({
      label: "Est. cost",
      value: `$${formatDollars(breakdown.totalPerMonth)}/mo`,
      formula: `$${breakdown.totalPerHour.toFixed(2)}/hr at 50% utilization`,
    });
  }

  return insights;
}
