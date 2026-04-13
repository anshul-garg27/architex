// ─────────────────────────────────────────────────────────────
// Architex — ML Design: Feature Store Architecture (MLD-021)
// ─────────────────────────────────────────────────────────────
//
// Simulation of a Feature Store architecture showing:
// 1. Raw data -> Feature computation pipeline (batch + stream)
// 2. Computed features -> Online store (Redis) + Offline store (S3)
// 3. Training reads from offline store (point-in-time correctness)
// 4. Serving reads from online store (real-time)
// ─────────────────────────────────────────────────────────────

export interface FeatureStoreState {
  onlineStore: Array<{
    key: string;
    features: Record<string, number>;
    ttl: number;
  }>;
  offlineStore: Array<{
    key: string;
    features: Record<string, number>;
    timestamp: string;
  }>;
  computationPipeline: Array<{
    name: string;
    type: "batch" | "stream";
    status: "running" | "completed";
  }>;
}

export interface FeatureStoreStep {
  tick: number;
  action: string;
  description: string;
  state: FeatureStoreState;
}

// ── Deterministic pseudo-random for reproducible demos ──────

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

/**
 * Simulates a Feature Store architecture lifecycle:
 *   tick 1 — Raw data ingestion (Kafka events + S3 batch files arrive)
 *   tick 2 — Stream feature computation kicks off
 *   tick 3 — Batch feature computation kicks off
 *   tick 4 — Online store populated (Redis, low-latency features)
 *   tick 5 — Offline store populated (S3, historical features)
 *   tick 6 — Training job reads from offline store (point-in-time join)
 *   tick 7 — Serving request reads from online store (real-time lookup)
 *   tick 8 — Full loop: new event triggers incremental update
 */
export function simulateFeatureStore(): FeatureStoreStep[] {
  const rand = seededRandom(42);

  const steps: FeatureStoreStep[] = [];

  // Helper: generate a random feature vector
  const feat = () => ({
    click_rate_7d: parseFloat((rand() * 0.3).toFixed(4)),
    avg_session_s: parseFloat((30 + rand() * 300).toFixed(1)),
    purchase_count: Math.floor(rand() * 20),
    recency_score: parseFloat((rand()).toFixed(4)),
  });

  // Tick 1 — Data Ingestion
  steps.push({
    tick: 1,
    action: "data-ingestion",
    description:
      "Raw events arrive from Kafka (click-stream, purchases) and batch files land on S3 (daily user profiles).",
    state: {
      onlineStore: [],
      offlineStore: [],
      computationPipeline: [
        { name: "click-stream-processor", type: "stream", status: "running" },
        { name: "daily-profile-aggregator", type: "batch", status: "running" },
      ],
    },
  });

  // Tick 2 — Stream Feature Computation
  steps.push({
    tick: 2,
    action: "stream-computation",
    description:
      "Stream pipeline (Flink) computes real-time features: click_rate_7d, recency_score from the event stream.",
    state: {
      onlineStore: [],
      offlineStore: [],
      computationPipeline: [
        { name: "click-stream-processor", type: "stream", status: "completed" },
        { name: "daily-profile-aggregator", type: "batch", status: "running" },
      ],
    },
  });

  // Tick 3 — Batch Feature Computation
  const batchFeats = [
    { key: "user:1001", features: feat(), timestamp: "2025-01-15T00:00:00Z" },
    { key: "user:1002", features: feat(), timestamp: "2025-01-15T00:00:00Z" },
    { key: "user:1003", features: feat(), timestamp: "2025-01-15T00:00:00Z" },
  ];

  steps.push({
    tick: 3,
    action: "batch-computation",
    description:
      "Batch pipeline (Spark) computes aggregate features: avg_session_s, purchase_count from historical data.",
    state: {
      onlineStore: [],
      offlineStore: [],
      computationPipeline: [
        { name: "click-stream-processor", type: "stream", status: "completed" },
        { name: "daily-profile-aggregator", type: "batch", status: "completed" },
      ],
    },
  });

  // Tick 4 — Online Store Population
  const onlineEntries = batchFeats.map((bf) => ({
    key: bf.key,
    features: bf.features,
    ttl: 3600,
  }));

  steps.push({
    tick: 4,
    action: "online-store-write",
    description:
      "Computed features are written to Redis (online store) with TTL for low-latency serving (<5ms p99).",
    state: {
      onlineStore: onlineEntries,
      offlineStore: [],
      computationPipeline: [
        { name: "click-stream-processor", type: "stream", status: "completed" },
        { name: "daily-profile-aggregator", type: "batch", status: "completed" },
      ],
    },
  });

  // Tick 5 — Offline Store Population
  const offlineEntries = batchFeats.map((bf) => ({
    key: bf.key,
    features: bf.features,
    timestamp: bf.timestamp,
  }));

  steps.push({
    tick: 5,
    action: "offline-store-write",
    description:
      "Features are also written to S3/Parquet (offline store) with timestamps for point-in-time correctness.",
    state: {
      onlineStore: onlineEntries,
      offlineStore: offlineEntries,
      computationPipeline: [
        { name: "click-stream-processor", type: "stream", status: "completed" },
        { name: "daily-profile-aggregator", type: "batch", status: "completed" },
      ],
    },
  });

  // Tick 6 — Training Read
  steps.push({
    tick: 6,
    action: "training-read",
    description:
      "Training job performs point-in-time join from offline store, ensuring no data leakage from future features.",
    state: {
      onlineStore: onlineEntries,
      offlineStore: [
        ...offlineEntries,
        { key: "user:1001", features: feat(), timestamp: "2025-01-14T00:00:00Z" },
        { key: "user:1002", features: feat(), timestamp: "2025-01-14T00:00:00Z" },
      ],
      computationPipeline: [
        { name: "click-stream-processor", type: "stream", status: "completed" },
        { name: "daily-profile-aggregator", type: "batch", status: "completed" },
      ],
    },
  });

  // Tick 7 — Serving Read
  steps.push({
    tick: 7,
    action: "serving-read",
    description:
      "Model serving endpoint fetches features from online store (Redis) in <5ms for real-time inference.",
    state: {
      onlineStore: onlineEntries.map((e) => ({ ...e, ttl: e.ttl - 600 })),
      offlineStore: offlineEntries,
      computationPipeline: [
        { name: "click-stream-processor", type: "stream", status: "completed" },
        { name: "daily-profile-aggregator", type: "batch", status: "completed" },
      ],
    },
  });

  // Tick 8 — Incremental Update
  const newStreamFeat = feat();
  steps.push({
    tick: 8,
    action: "incremental-update",
    description:
      "New click event triggers stream pipeline update. Online store refreshed; offline store appends new version.",
    state: {
      onlineStore: [
        { key: "user:1001", features: newStreamFeat, ttl: 3600 },
        ...onlineEntries.slice(1),
      ],
      offlineStore: [
        ...offlineEntries,
        { key: "user:1001", features: newStreamFeat, timestamp: "2025-01-15T01:00:00Z" },
      ],
      computationPipeline: [
        { name: "click-stream-processor", type: "stream", status: "running" },
        { name: "daily-profile-aggregator", type: "batch", status: "completed" },
      ],
    },
  });

  return steps;
}
