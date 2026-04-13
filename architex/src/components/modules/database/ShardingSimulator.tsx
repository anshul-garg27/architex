"use client";

import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useReducedMotion } from "@/providers/ReducedMotionProvider";
import {
  Database,
  Shuffle,
  BarChart3,
  AlertTriangle,
  Zap,
  Plus,
  Minus,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────

type ShardStrategy = "hash" | "range" | "directory" | "consistent";

interface ShardInfo {
  id: number;
  label: string;
  count: number;
  records: number[];
}

interface SampleRecord {
  id: number;
  key: string;
  numericKey: number;
}

// ── Sample Data ────────────────────────────────────────────────

function generateRecords(count: number): SampleRecord[] {
  const records: SampleRecord[] = [];
  for (let i = 0; i < count; i++) {
    // Skewed distribution: some keys are "hot"
    const hotBias = Math.random() < 0.3 ? Math.floor(Math.random() * 100) : Math.floor(Math.random() * count);
    records.push({
      id: i,
      key: `user_${hotBias}`,
      numericKey: hotBias,
    });
  }
  return records;
}

// ── Sharding Logic ─────────────────────────────────────────────

function hashShard(key: string, shardCount: number): number {
  // Simple hash
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const ch = key.charCodeAt(i);
    hash = ((hash << 5) - hash + ch) | 0;
  }
  return Math.abs(hash) % shardCount;
}

function rangeShard(numericKey: number, shardCount: number, maxKey: number): number {
  const rangeSize = Math.ceil(maxKey / shardCount);
  return Math.min(Math.floor(numericKey / rangeSize), shardCount - 1);
}

function directoryShard(key: string, shardCount: number): number {
  // Directory-based: use a static mapping (simulated)
  const dirMap = new Map<string, number>();
  // First N keys go to shard 0, etc.
  const existing = dirMap.get(key);
  if (existing !== undefined) return existing;
  // Random assignment for demo
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = ((hash << 3) + key.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % shardCount;
}

// ── Consistent Hashing ────────────────────────────────────────

const HASH_RING_MAX = 360; // Use 360 for angle-based ring

interface RingNode {
  id: number;
  label: string;
  position: number; // 0..359
  isVirtual: boolean;
  physicalId: number;
}

interface ConsistentHashResult {
  ringNodes: RingNode[];
  shards: ShardInfo[];
  keyPositions: { key: string; position: number; assignedNode: number }[];
}

function simpleHash(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) - h + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % HASH_RING_MAX;
}

function buildConsistentHashRing(
  nodeCount: number,
  virtualNodesPerNode: number,
): RingNode[] {
  const nodes: RingNode[] = [];
  for (let i = 0; i < nodeCount; i++) {
    if (virtualNodesPerNode <= 1) {
      nodes.push({
        id: i,
        label: `N${i}`,
        position: simpleHash(`node-${i}`),
        isVirtual: false,
        physicalId: i,
      });
    } else {
      for (let v = 0; v < virtualNodesPerNode; v++) {
        nodes.push({
          id: i * virtualNodesPerNode + v,
          label: `N${i}${v > 0 ? `v${v}` : ""}`,
          position: simpleHash(`node-${i}-vn-${v}`),
          isVirtual: v > 0,
          physicalId: i,
        });
      }
    }
  }
  return nodes.sort((a, b) => a.position - b.position);
}

function assignKeyToRing(keyPosition: number, ringNodes: RingNode[]): number {
  if (ringNodes.length === 0) return 0;
  for (const node of ringNodes) {
    if (node.position >= keyPosition) return node.physicalId;
  }
  // Wrap around to first node
  return ringNodes[0].physicalId;
}

function distributeConsistentHash(
  records: SampleRecord[],
  nodeCount: number,
  virtualNodesPerNode: number,
): ConsistentHashResult {
  const ringNodes = buildConsistentHashRing(nodeCount, virtualNodesPerNode);
  const shards: ShardInfo[] = [];
  for (let i = 0; i < nodeCount; i++) {
    shards.push({ id: i, label: `Shard ${i}`, count: 0, records: [] });
  }

  const keyPositions: ConsistentHashResult["keyPositions"] = [];
  for (const record of records) {
    const pos = simpleHash(record.key);
    const nodeId = assignKeyToRing(pos, ringNodes);
    shards[nodeId].count++;
    if (shards[nodeId].records.length < 20) {
      shards[nodeId].records.push(record.id);
    }
    if (keyPositions.length < 50) {
      keyPositions.push({ key: record.key, position: pos, assignedNode: nodeId });
    }
  }

  return { ringNodes, shards, keyPositions };
}

function computeKeysMoved(
  records: SampleRecord[],
  oldNodeCount: number,
  newNodeCount: number,
  virtualNodesPerNode: number,
): { consistent: number; naive: number } {
  const oldRing = buildConsistentHashRing(oldNodeCount, virtualNodesPerNode);
  const newRing = buildConsistentHashRing(newNodeCount, virtualNodesPerNode);

  let consistentMoved = 0;
  let naiveMoved = 0;

  for (const record of records) {
    const pos = simpleHash(record.key);
    const oldNode = assignKeyToRing(pos, oldRing);
    const newNode = assignKeyToRing(pos, newRing);
    if (oldNode !== newNode) consistentMoved++;

    // Naive: key % N vs key % (N+1)
    const oldNaive = Math.abs(simpleHash(record.key)) % oldNodeCount;
    const newNaive = Math.abs(simpleHash(record.key)) % newNodeCount;
    if (oldNaive !== newNaive) naiveMoved++;
  }

  return { consistent: consistentMoved, naive: naiveMoved };
}

function distributeRecords(
  records: SampleRecord[],
  strategy: ShardStrategy,
  shardCount: number,
): ShardInfo[] {
  const shards: ShardInfo[] = [];
  for (let i = 0; i < shardCount; i++) {
    shards.push({ id: i, label: `Shard ${i}`, count: 0, records: [] });
  }

  const maxKey = Math.max(...records.map((r) => r.numericKey), 1);

  for (const record of records) {
    let shardIdx: number;
    switch (strategy) {
      case "hash":
        shardIdx = hashShard(record.key, shardCount);
        break;
      case "range":
        shardIdx = rangeShard(record.numericKey, shardCount, maxKey);
        break;
      case "directory":
        shardIdx = directoryShard(record.key, shardCount);
        break;
      case "consistent":
        // Consistent hashing uses its own distribution function
        shardIdx = hashShard(record.key, shardCount);
        break;
    }
    shards[shardIdx].count++;
    if (shards[shardIdx].records.length < 20) {
      shards[shardIdx].records.push(record.id);
    }
  }

  return shards;
}

function computeImbalance(shards: ShardInfo[]): number {
  const counts = shards.map((s) => s.count);
  const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
  const variance = counts.reduce((sum, c) => sum + (c - mean) ** 2, 0) / counts.length;
  return Math.sqrt(variance);
}

function getImbalanceColor(stdDev: number, totalRecords: number): string {
  const ratio = stdDev / (totalRecords / 4);
  if (ratio < 0.1) return "var(--state-success)";
  if (ratio < 0.3) return "var(--state-warning)";
  return "var(--state-error)";
}

// ── Component ──────────────────────────────────────────────────

const RECORD_COUNT = 1000;
const SHARD_COUNTS = [2, 3, 4, 6, 8];

const STRATEGY_INFO: Record<ShardStrategy, { name: string; description: string }> = {
  hash: { name: "Hash-Based", description: "Imagine assigning residents to neighborhoods by hashing their name. Even distribution — but neighbors aren't near each other. Good distribution but no range queries across shards." },
  range: { name: "Range-Based", description: "Like zip codes — assign by key range. Neighbors stay close (great for range queries) but some neighborhoods get overcrowded if keys are skewed." },
  directory: { name: "Directory-Based", description: "A central registry decides where everything goes. Maximum flexibility but the registry itself becomes a bottleneck." },
  consistent: { name: "Consistent Hash", description: "Maps nodes and keys onto a hash ring. Adding/removing a node only redistributes nearby keys. Virtual nodes improve balance." },
};

// ── Hash Ring Visualization ────────────────────────────────────

const NODE_COLORS = [
  "var(--primary)",
  "var(--state-success)",
  "var(--state-warning)",
  "var(--state-error)",
  "var(--viz-seq-high)",
  "var(--node-storage)",
  "var(--node-cache)",
  "var(--node-queue)",
];

function HashRingViz({
  ringNodes,
  keyPositions,
  nodeCount,
}: {
  ringNodes: RingNode[];
  keyPositions: ConsistentHashResult["keyPositions"];
  nodeCount: number;
}) {
  const prefersReducedMotion = useReducedMotion();
  const noMotion = { duration: 0 } as const;
  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 80;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
      {/* Ring circle */}
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke="var(--border)"
        strokeWidth={1.5}
        strokeDasharray="4 2"
      />

      {/* Key positions (small dots) */}
      {keyPositions.slice(0, 30).map((kp, i) => {
        const angle = (kp.position / HASH_RING_MAX) * 2 * Math.PI - Math.PI / 2;
        const kr = radius - 6;
        const x = cx + kr * Math.cos(angle);
        const y = cy + kr * Math.sin(angle);
        return (
          <motion.circle
            key={`key-${i}`}
            cx={x}
            cy={y}
            r={1.5}
            fill="var(--foreground-muted)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ delay: i * 0.01 }}
          />
        );
      })}

      {/* Node positions */}
      {ringNodes.map((node, i) => {
        const angle = (node.position / HASH_RING_MAX) * 2 * Math.PI - Math.PI / 2;
        const x = cx + radius * Math.cos(angle);
        const y = cy + radius * Math.sin(angle);
        const color = NODE_COLORS[node.physicalId % NODE_COLORS.length];
        const nodeRadius = node.isVirtual ? 4 : 7;

        return (
          <motion.g key={`ring-node-${node.id}`}>
            <motion.circle
              cx={x}
              cy={y}
              r={nodeRadius}
              fill={color}
              stroke={node.isVirtual ? "none" : "#fff"}
              strokeWidth={node.isVirtual ? 0 : 1.5}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={prefersReducedMotion ? noMotion : { delay: i * 0.03, type: "spring", stiffness: 300 }}
            />
            {!node.isVirtual && (
              <text
                x={cx + (radius + 16) * Math.cos(angle)}
                y={cy + (radius + 16) * Math.sin(angle)}
                textAnchor="middle"
                dominantBaseline="central"
                fill="var(--foreground-muted)"
                fontSize={8}
                fontFamily="monospace"
              >
                {node.label}
              </text>
            )}
          </motion.g>
        );
      })}

      {/* Center label */}
      <text
        x={cx}
        y={cy - 6}
        textAnchor="middle"
        fill="var(--foreground)"
        fontSize={10}
        fontWeight="bold"
      >
        {nodeCount} nodes
      </text>
      <text
        x={cx}
        y={cy + 8}
        textAnchor="middle"
        fill="var(--foreground-muted)"
        fontSize={8}
      >
        {ringNodes.length} positions
      </text>
    </svg>
  );
}

// ── Main Component ────────────────────────────────────────────

export default function ShardingSimulator() {
  const prefersReducedMotion = useReducedMotion();
  const noMotion = { duration: 0 } as const;
  const [strategy, setStrategy] = useState<ShardStrategy>("hash");
  const [shardCount, setShardCount] = useState(4);
  const [virtualNodes, setVirtualNodes] = useState(false);
  const [consistentNodeCount, setConsistentNodeCount] = useState(4);

  const records = useMemo(() => generateRecords(RECORD_COUNT), []);

  // Standard sharding (hash/range/directory)
  const shards = useMemo(
    () => strategy !== "consistent" ? distributeRecords(records, strategy, shardCount) : [],
    [records, strategy, shardCount],
  );

  // Consistent hashing
  const vnPerNode = virtualNodes ? 5 : 1;

  const consistentResult = useMemo(
    () => strategy === "consistent"
      ? distributeConsistentHash(records, consistentNodeCount, vnPerNode)
      : null,
    [records, strategy, consistentNodeCount, vnPerNode],
  );

  const activeShards = strategy === "consistent" ? (consistentResult?.shards ?? []) : shards;
  const activeNodeCount = strategy === "consistent" ? consistentNodeCount : shardCount;

  const maxCount = useMemo(
    () => Math.max(...activeShards.map((s) => s.count), 1),
    [activeShards],
  );

  const imbalance = useMemo(() => computeImbalance(activeShards), [activeShards]);
  const imbalanceColor = getImbalanceColor(imbalance, RECORD_COUNT);

  const hotShards = useMemo(() => {
    const avg = RECORD_COUNT / activeNodeCount;
    return activeShards.filter((s) => s.count > avg * 1.5);
  }, [activeShards, activeNodeCount]);

  // Keys moved comparison (consistent vs naive) when adding a node
  const keysMoved = useMemo(() => {
    if (strategy !== "consistent" || consistentNodeCount < 2) return null;
    return computeKeysMoved(records, consistentNodeCount - 1, consistentNodeCount, vnPerNode);
  }, [records, strategy, consistentNodeCount, vnPerNode]);

  // Cross-shard query cost
  const crossShardCost = useMemo(() => {
    if (strategy === "consistent") return `O(log ${activeNodeCount}) ring lookup per key`;
    if (strategy === "range") return `O(${activeNodeCount}) range scan across all shards`;
    return `O(1) per key, O(${activeNodeCount}) for scatter-gather`;
  }, [strategy, activeNodeCount]);

  const strategyInfo = STRATEGY_INFO[strategy];

  const addNode = useCallback(() => {
    setConsistentNodeCount((c) => Math.min(c + 1, 8));
  }, []);

  const removeNode = useCallback(() => {
    setConsistentNodeCount((c) => Math.max(c - 1, 2));
  }, []);

  return (
    <div
      className={cn(
        "rounded-xl border p-5",
        "bg-[var(--surface)] border-[var(--border)]",
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <Shuffle className="h-5 w-5" style={{ color: "var(--primary)" }} />
        <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
          Sharding Simulator
        </h3>
        <span className="ml-auto text-[10px] px-2 py-0.5 rounded" style={{ background: "var(--gray-4)", color: "var(--foreground-muted)" }}>
          {RECORD_COUNT} records
        </span>
      </div>
      <p className="text-xs mb-4 leading-relaxed" style={{ color: "var(--foreground-muted)" }}>
        Your database has 1 billion rows. One server can&apos;t hold them all. How do you split the data?
      </p>

      {/* Strategy selector */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {(Object.keys(STRATEGY_INFO) as ShardStrategy[]).map((s) => (
          <motion.button
            key={s}
            whileTap={{ scale: 0.97 }}
            onClick={() => setStrategy(s)}
            className="flex-1 min-w-0 px-2 py-1.5 rounded-xl text-xs font-medium border transition-colors"
            style={{
              background: s === strategy ? "var(--violet-3)" : "var(--gray-3)",
              borderColor: s === strategy ? "var(--primary)" : "var(--border)",
              color: s === strategy ? "var(--primary)" : "var(--foreground-muted)",
            }}
          >
            {STRATEGY_INFO[s].name}
          </motion.button>
        ))}
      </div>

      {/* Description */}
      <p className="text-xs mb-4 leading-relaxed" style={{ color: "var(--foreground-muted)" }}>
        {strategyInfo.description}
      </p>

      {/* Controls: standard shard count or consistent hash controls */}
      {strategy !== "consistent" ? (
        <div className="mb-4">
          <label className="block text-xs mb-1.5" style={{ color: "var(--foreground-muted)" }}>
            Shard Count: <span style={{ color: "var(--foreground)" }}>{shardCount}</span>
          </label>
          <div className="flex gap-2">
            {SHARD_COUNTS.map((sc) => (
              <motion.button
                key={sc}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShardCount(sc)}
                className="flex-1 py-1 rounded-xl text-xs font-mono border"
                style={{
                  background: sc === shardCount ? "var(--violet-3)" : "var(--gray-3)",
                  borderColor: sc === shardCount ? "var(--primary)" : "var(--border)",
                  color: sc === shardCount ? "var(--primary)" : "var(--foreground-muted)",
                }}
              >
                {sc}
              </motion.button>
            ))}
          </div>
        </div>
      ) : (
        <div className="mb-4 space-y-3">
          {/* Node count with +/- buttons */}
          <div>
            <label className="block text-xs mb-1.5" style={{ color: "var(--foreground-muted)" }}>
              Nodes: <span style={{ color: "var(--foreground)" }}>{consistentNodeCount}</span>
            </label>
            <div className="flex items-center gap-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={removeNode}
                disabled={consistentNodeCount <= 2}
                className="flex items-center justify-center w-8 h-8 rounded-xl border text-xs"
                style={{
                  background: "var(--gray-3)",
                  borderColor: "var(--border)",
                  color: consistentNodeCount <= 2 ? "var(--foreground-muted)" : "var(--foreground)",
                  opacity: consistentNodeCount <= 2 ? 0.5 : 1,
                }}
              >
                <Minus className="h-3.5 w-3.5" />
              </motion.button>
              <div className="flex-1 flex gap-1">
                {Array.from({ length: consistentNodeCount }, (_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex-1 h-2 rounded-full"
                    style={{ background: NODE_COLORS[i % NODE_COLORS.length] }}
                  />
                ))}
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={addNode}
                disabled={consistentNodeCount >= 8}
                className="flex items-center justify-center w-8 h-8 rounded-xl border text-xs"
                style={{
                  background: "var(--gray-3)",
                  borderColor: "var(--border)",
                  color: consistentNodeCount >= 8 ? "var(--foreground-muted)" : "var(--foreground)",
                  opacity: consistentNodeCount >= 8 ? 0.5 : 1,
                }}
              >
                <Plus className="h-3.5 w-3.5" />
              </motion.button>
            </div>
          </div>

          {/* Virtual nodes toggle */}
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setVirtualNodes((v) => !v)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-medium border transition-colors"
              style={{
                background: virtualNodes ? "var(--violet-3)" : "var(--gray-3)",
                borderColor: virtualNodes ? "var(--primary)" : "var(--border)",
                color: virtualNodes ? "var(--primary)" : "var(--foreground-muted)",
              }}
            >
              {virtualNodes ? <ToggleRight className="h-3.5 w-3.5" /> : <ToggleLeft className="h-3.5 w-3.5" />}
              Virtual Nodes ({virtualNodes ? "5x" : "off"})
            </motion.button>
            <span className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>
              {virtualNodes ? "Better distribution with 5 virtual nodes per physical node" : "Each node has 1 position on the ring"}
            </span>
          </div>
        </div>
      )}

      {/* Consistent Hashing: Hash Ring Visualization */}
      <AnimatePresence mode="wait">
        {strategy === "consistent" && consistentResult && (
          <motion.div
            key="hash-ring"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4"
          >
            <div
              className="rounded-xl border p-3"
              style={{ background: "var(--gray-2)", borderColor: "var(--border)" }}
            >
              <p className="text-[10px] font-medium mb-2" style={{ color: "var(--foreground-muted)" }}>
                HASH RING
              </p>
              <HashRingViz
                ringNodes={consistentResult.ringNodes}
                keyPositions={consistentResult.keyPositions}
                nodeCount={consistentNodeCount}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shard distribution visualization (bar chart) */}
      <div className="space-y-2 mb-4">
        {activeShards.map((shard) => {
          const pct = (shard.count / maxCount) * 100;
          const isHot = hotShards.some((h) => h.id === shard.id);
          return (
            <div key={shard.id} className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 w-20 shrink-0">
                <Database className="h-3.5 w-3.5" style={{ color: isHot ? "var(--state-error)" : (strategy === "consistent" ? NODE_COLORS[shard.id % NODE_COLORS.length] : "var(--foreground-muted)") }} />
                <span className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>
                  {shard.label}
                </span>
              </div>
              <div className="flex-1 h-5 rounded-xl overflow-hidden relative" style={{ background: "var(--gray-5)" }}>
                <motion.div
                  className="h-full rounded"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: pct / 100 }}
                  transition={prefersReducedMotion ? noMotion : { type: "spring", stiffness: 300, damping: 30 }}
                  style={{
                    width: "100%",
                    transformOrigin: "left",
                    background: isHot ? "var(--state-error)" : (strategy === "consistent" ? NODE_COLORS[shard.id % NODE_COLORS.length] : "var(--node-storage)"),
                  }}
                />
                {isHot && (
                  <motion.div
                    className="absolute right-2 top-0.5"
                    animate={prefersReducedMotion ? { opacity: 1 } : { opacity: [0.5, 1, 0.5] }}
                    transition={prefersReducedMotion ? noMotion : { repeat: Infinity, duration: 1.5 }}
                  >
                    <AlertTriangle className="h-3.5 w-3.5" style={{ color: "var(--state-error)" }} />
                  </motion.div>
                )}
              </div>
              <span
                className="w-16 text-right text-[10px] font-mono shrink-0"
                style={{ color: isHot ? "var(--state-error)" : "var(--foreground-muted)" }}
              >
                {shard.count}
              </span>
            </div>
          );
        })}
      </div>

      {/* Stats */}
      <div className={cn("grid gap-3 mb-4", strategy === "consistent" ? "grid-cols-2" : "grid-cols-3")}>
        <div className="rounded-xl border p-3 text-center" style={{ background: "var(--gray-3)", borderColor: "var(--border)" }}>
          <p className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>Imbalance (Std Dev)</p>
          <p className="text-sm font-bold font-mono" style={{ color: imbalanceColor }}>
            {imbalance.toFixed(1)}
          </p>
        </div>
        <div className="rounded-xl border p-3 text-center" style={{ background: "var(--gray-3)", borderColor: "var(--border)" }}>
          <p className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>Hot Shards</p>
          <p className="text-sm font-bold font-mono" style={{ color: hotShards.length > 0 ? "var(--state-error)" : "var(--state-success)" }}>
            {hotShards.length}
          </p>
        </div>
        {strategy !== "consistent" && (
          <div className="rounded-xl border p-3 text-center" style={{ color: "var(--foreground-muted)", background: "var(--gray-3)", borderColor: "var(--border)" }}>
            <p className="text-[10px]">Cross-Shard Cost</p>
            <p className="text-[10px] font-mono mt-1" style={{ color: "var(--foreground)" }}>
              {crossShardCost}
            </p>
          </div>
        )}
      </div>

      {/* Consistent Hashing: Keys Moved Comparison */}
      <AnimatePresence>
        {strategy === "consistent" && keysMoved && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4"
          >
            <div
              className="rounded-xl border p-3"
              style={{ background: "var(--gray-2)", borderColor: "var(--border)" }}
            >
              <p className="text-[10px] font-medium mb-2" style={{ color: "var(--foreground-muted)" }}>
                KEYS MOVED: {consistentNodeCount - 1} → {consistentNodeCount} nodes
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border p-2 text-center" style={{ background: "var(--gray-3)", borderColor: "var(--border)" }}>
                  <p className="text-[9px] font-medium mb-1" style={{ color: "var(--state-success)" }}>
                    Consistent Hashing
                  </p>
                  <p className="text-sm font-bold font-mono" style={{ color: "var(--state-success)" }}>
                    {keysMoved.consistent}
                  </p>
                  <p className="text-[9px] font-mono" style={{ color: "var(--foreground-muted)" }}>
                    {((keysMoved.consistent / RECORD_COUNT) * 100).toFixed(1)}% of keys
                  </p>
                </div>
                <div className="rounded-xl border p-2 text-center" style={{ background: "var(--gray-3)", borderColor: "var(--border)" }}>
                  <p className="text-[9px] font-medium mb-1" style={{ color: "var(--state-error)" }}>
                    Naive Modular (key % N)
                  </p>
                  <p className="text-sm font-bold font-mono" style={{ color: "var(--state-error)" }}>
                    {keysMoved.naive}
                  </p>
                  <p className="text-[9px] font-mono" style={{ color: "var(--foreground-muted)" }}>
                    {((keysMoved.naive / RECORD_COUNT) * 100).toFixed(1)}% of keys
                  </p>
                </div>
              </div>
              {keysMoved.naive > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-2 text-center"
                >
                  <span
                    className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold"
                    style={{
                      background: "var(--state-success)",
                      color: "#fff",
                    }}
                  >
                    {((1 - keysMoved.consistent / keysMoved.naive) * 100).toFixed(0)}% fewer keys moved
                  </span>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bridge — disabled until canvas integration is implemented */}
      <div className="relative group">
        <motion.button
          disabled
          className={cn(
            "w-full flex items-center justify-center gap-2",
            "rounded-xl px-4 py-2.5 text-sm font-medium",
            "bg-[var(--primary)] text-[var(--primary-foreground)]",
            "opacity-50 cursor-not-allowed",
          )}
        >
          <Zap className="h-4 w-4" />
          Create Sharded Topology on Canvas
          <span className="text-[10px] ml-1 opacity-80">(Coming Soon)</span>
        </motion.button>
        <div
          className={cn(
            "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5",
            "rounded-xl text-xs whitespace-nowrap",
            "opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none",
          )}
          style={{ background: "var(--gray-2)", color: "var(--foreground-muted)", border: "1px solid var(--border)" }}
        >
          This feature is coming soon — it will create the topology on the System Design canvas.
        </div>
      </div>
    </div>
  );
}
