// ─────────────────────────────────────────────────────────────
// Architex — ML Design: Pipeline Templates
// ─────────────────────────────────────────────────────────────
//
// Pre-built ML pipeline templates modelling real-world systems
// (Spotify recommendations, TikTok ranking, fraud detection).
// Each template defines a directed graph of pipeline stages
// with typed connections.
// ─────────────────────────────────────────────────────────────

export type PipelineStageType =
  | "ingestion"
  | "feature-eng"
  | "training"
  | "evaluation"
  | "serving";

export interface PipelineStage {
  id: string;
  name: string;
  type: PipelineStageType;
  description: string;
  config: Record<string, string | number>;
  inputSchema?: string;
  outputSchema?: string;
}

export interface MLPipeline {
  id: string;
  name: string;
  description: string;
  stages: PipelineStage[];
  connections: Array<{ from: string; to: string }>;
}

// ── Spotify Recommendation Pipeline ──────────────────────────

const spotifyPipeline: MLPipeline = {
  id: "spotify-rec",
  name: "Spotify Recommendation",
  description:
    "End-to-end music recommendation pipeline: ingests listening history, " +
    "engineers audio and collaborative features, trains a two-tower retrieval " +
    "model, evaluates with offline metrics, and serves via an approximate " +
    "nearest-neighbour index.",
  stages: [
    {
      id: "sp-ingest",
      name: "Listening History Ingestion",
      type: "ingestion",
      description:
        "Streams user listening events from Kafka into a feature store. " +
        "Captures track ID, duration, skip flag, timestamp, and device type.",
      config: {
        source: "kafka://listen-events",
        format: "avro",
        partitions: 128,
        retention_hours: 168,
      },
      outputSchema: "{ userId, trackId, durationMs, skipped, ts }",
    },
    {
      id: "sp-features",
      name: "Audio + Collab Features",
      type: "feature-eng",
      description:
        "Combines pre-computed audio embeddings (tempo, key, energy) with " +
        "collaborative signals (co-listen counts, playlist co-occurrence). " +
        "Applies log-scaling and z-score normalisation.",
      config: {
        audio_dim: 128,
        collab_dim: 64,
        normalisation: "z-score",
        window_days: 28,
      },
      inputSchema: "{ userId, trackId, durationMs, skipped, ts }",
      outputSchema: "{ userId, trackId, featureVec[192] }",
    },
    {
      id: "sp-train",
      name: "Two-Tower Retrieval Model",
      type: "training",
      description:
        "Trains a two-tower model (user tower + item tower) with in-batch " +
        "negatives. Produces 128-d embeddings for ANN lookup.",
      config: {
        model: "two-tower",
        embedding_dim: 128,
        batch_size: 4096,
        epochs: 5,
        optimizer: "adam",
        learning_rate: 0.001,
      },
      inputSchema: "{ userId, trackId, featureVec[192] }",
      outputSchema: "{ userEmbed[128], itemEmbed[128] }",
    },
    {
      id: "sp-eval",
      name: "Offline Evaluation",
      type: "evaluation",
      description:
        "Evaluates retrieval quality with Recall@K, NDCG, and hit-rate " +
        "on a held-out test split. Checks for popularity bias.",
      config: {
        metrics: "recall@50,ndcg@50,hit-rate@50",
        test_split: 0.1,
        bias_check: "popularity",
      },
      inputSchema: "{ userEmbed[128], itemEmbed[128] }",
      outputSchema: "{ recall, ndcg, hitRate, biasScore }",
    },
    {
      id: "sp-serve",
      name: "ANN Serving Index",
      type: "serving",
      description:
        "Exports item embeddings to an HNSW index. Serves top-K candidates " +
        "with sub-10ms p99 latency. Refreshed daily.",
      config: {
        index: "hnsw",
        ef_construction: 200,
        M: 16,
        top_k: 100,
        refresh_interval: "daily",
      },
      inputSchema: "{ userEmbed[128] }",
      outputSchema: "{ trackId, score }[]",
    },
  ],
  connections: [
    { from: "sp-ingest", to: "sp-features" },
    { from: "sp-features", to: "sp-train" },
    { from: "sp-train", to: "sp-eval" },
    { from: "sp-eval", to: "sp-serve" },
  ],
};

// ── TikTok Ranking Pipeline ──────────────────────────────────

const tiktokPipeline: MLPipeline = {
  id: "tiktok-rank",
  name: "TikTok Video Ranking",
  description:
    "Multi-stage ranking pipeline for short-form video: collects engagement " +
    "signals, builds real-time features, trains a multi-task ranking model, " +
    "evaluates with online simulation, and serves behind an A/B gateway.",
  stages: [
    {
      id: "tt-ingest",
      name: "Engagement Signal Collection",
      type: "ingestion",
      description:
        "Captures watch-time, likes, shares, comments, and replays from the " +
        "event stream. De-duplicates and sessionises within 30-minute windows.",
      config: {
        source: "kafka://engagement",
        session_gap_min: 30,
        dedup: "event-id",
        lag_tolerance_sec: 5,
      },
      outputSchema: "{ userId, videoId, watchPct, liked, shared, commented, replayed }",
    },
    {
      id: "tt-features",
      name: "Real-time Feature Store",
      type: "feature-eng",
      description:
        "Merges real-time engagement counts with batch features: creator " +
        "stats, video embeddings (CLIP), and user interest profiles. " +
        "Supports point-in-time joins to avoid data leakage.",
      config: {
        realtime_ttl_sec: 300,
        batch_refresh: "hourly",
        embedding_model: "CLIP-ViT-B/32",
        feature_count: 256,
      },
      inputSchema:
        "{ userId, videoId, watchPct, liked, shared, commented, replayed }",
      outputSchema: "{ userId, videoId, featureVec[256] }",
    },
    {
      id: "tt-train",
      name: "Multi-task Ranking Model",
      type: "training",
      description:
        "Trains a shared-bottom multi-task network predicting watch-time, " +
        "like probability, and share probability simultaneously. Uses MMOE " +
        "gates to balance tasks.",
      config: {
        model: "mmoe",
        tasks: 3,
        expert_count: 8,
        hidden_units: 512,
        batch_size: 8192,
        epochs: 3,
        learning_rate: 0.0003,
      },
      inputSchema: "{ userId, videoId, featureVec[256] }",
      outputSchema: "{ pWatch, pLike, pShare }",
    },
    {
      id: "tt-eval",
      name: "Online Simulation Eval",
      type: "evaluation",
      description:
        "Replays recent traffic through the candidate model and computes " +
        "engagement lift, diversity, and freshness metrics against the " +
        "current production model.",
      config: {
        replay_hours: 24,
        metrics: "engagement-lift,diversity,freshness",
        baseline: "prod-v4",
      },
      inputSchema: "{ pWatch, pLike, pShare }",
      outputSchema: "{ lift, diversityIdx, freshnessIdx }",
    },
    {
      id: "tt-serve",
      name: "A/B Gateway Serving",
      type: "serving",
      description:
        "Routes traffic through an experimentation gateway. Supports " +
        "gradual rollout from 1% to 100% with automatic rollback on " +
        "engagement regression.",
      config: {
        gateway: "experimentation-service",
        initial_traffic_pct: 1,
        rollout_steps: "1,5,25,50,100",
        rollback_threshold: -0.02,
      },
      inputSchema: "{ userId, candidateVideoIds[] }",
      outputSchema: "{ rankedVideoIds[], modelVersion }",
    },
  ],
  connections: [
    { from: "tt-ingest", to: "tt-features" },
    { from: "tt-features", to: "tt-train" },
    { from: "tt-train", to: "tt-eval" },
    { from: "tt-eval", to: "tt-serve" },
  ],
};

// ── Fraud Detection Pipeline ─────────────────────────────────

const fraudPipeline: MLPipeline = {
  id: "fraud-detect",
  name: "Fraud Detection",
  description:
    "Real-time fraud scoring pipeline: ingests transaction events, " +
    "engineers velocity and graph features, trains a gradient-boosted " +
    "ensemble, evaluates with precision-recall analysis, and serves " +
    "with a low-latency decision engine.",
  stages: [
    {
      id: "fd-ingest",
      name: "Transaction Event Stream",
      type: "ingestion",
      description:
        "Consumes payment authorisation requests in real time. Enriches " +
        "with merchant category, geolocation, and device fingerprint.",
      config: {
        source: "kafka://txn-auth",
        enrichment: "merchant,geo,device",
        throughput_tps: 50000,
        max_latency_ms: 20,
      },
      outputSchema: "{ txnId, userId, amount, merchantCat, lat, lng, deviceFp, ts }",
    },
    {
      id: "fd-features",
      name: "Velocity + Graph Features",
      type: "feature-eng",
      description:
        "Computes sliding-window velocity features (txn count / amount in " +
        "last 1m/5m/1h/24h) and graph features from the payment network " +
        "(degree centrality, community ID).",
      config: {
        windows: "1m,5m,1h,24h",
        graph_features: "degree,community",
        feature_count: 64,
        cache: "redis",
      },
      inputSchema:
        "{ txnId, userId, amount, merchantCat, lat, lng, deviceFp, ts }",
      outputSchema: "{ txnId, featureVec[64] }",
    },
    {
      id: "fd-train",
      name: "Gradient-Boosted Ensemble",
      type: "training",
      description:
        "Trains XGBoost + LightGBM ensemble with SMOTE oversampling for " +
        "class imbalance. Optimises for precision at 95% recall.",
      config: {
        model: "xgboost+lightgbm",
        oversampling: "smote",
        target_recall: 0.95,
        n_estimators: 500,
        max_depth: 8,
        learning_rate: 0.05,
      },
      inputSchema: "{ txnId, featureVec[64] }",
      outputSchema: "{ txnId, fraudScore }",
    },
    {
      id: "fd-eval",
      name: "Precision-Recall Analysis",
      type: "evaluation",
      description:
        "Evaluates model on a stratified test set. Reports PR-AUC, " +
        "false-positive rate at operating threshold, and feature importance.",
      config: {
        metrics: "pr-auc,fpr@threshold,feature-importance",
        test_split: 0.2,
        stratify: "label",
      },
      inputSchema: "{ txnId, fraudScore }",
      outputSchema: "{ prAuc, fpr, topFeatures[] }",
    },
    {
      id: "fd-serve",
      name: "Low-latency Decision Engine",
      type: "serving",
      description:
        "Serves fraud scores with <5ms p99 via a sidecar container. " +
        "Hard-blocks scores above 0.95, soft-flags 0.7-0.95 for review.",
      config: {
        serving: "sidecar",
        hard_block_threshold: 0.95,
        soft_flag_threshold: 0.7,
        p99_target_ms: 5,
        model_refresh: "hourly",
      },
      inputSchema: "{ txnId, featureVec[64] }",
      outputSchema: "{ txnId, fraudScore, decision }",
    },
  ],
  connections: [
    { from: "fd-ingest", to: "fd-features" },
    { from: "fd-features", to: "fd-train" },
    { from: "fd-train", to: "fd-eval" },
    { from: "fd-eval", to: "fd-serve" },
  ],
};

// ── Exports ──────────────────────────────────────────────────

export const PIPELINE_TEMPLATES: MLPipeline[] = [
  spotifyPipeline,
  tiktokPipeline,
  fraudPipeline,
];

/** Colour associated with each stage type for visual rendering. */
export const STAGE_TYPE_COLORS: Record<PipelineStageType, string> = {
  ingestion: "#3b82f6",    // blue
  "feature-eng": "#8b5cf6", // purple
  training: "#f97316",      // orange
  evaluation: "#10b981",    // emerald
  serving: "#ef4444",       // red
};

/** Human-readable labels for stage types. */
export const STAGE_TYPE_LABELS: Record<PipelineStageType, string> = {
  ingestion: "Ingestion",
  "feature-eng": "Feature Engineering",
  training: "Training",
  evaluation: "Evaluation",
  serving: "Serving",
};
