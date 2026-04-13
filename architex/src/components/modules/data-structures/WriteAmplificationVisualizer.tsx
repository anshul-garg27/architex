"use client";

import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { HardDrive, Play, Pause, RotateCcw, Layers, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────

type TreeType = "lsm-tree" | "b-tree" | "b-plus-tree";

interface LayerState {
  id: string;
  label: string;
  writes: number;
  capacity: number;
  level: number;
}

interface TreeProfile {
  id: TreeType;
  name: string;
  description: string;
  baseAmplification: number;
  layers: LayerState[];
  /** How compaction ratio affects amplification */
  compactionEffect: (ratio: number) => number;
}

// ── Sample Data ────────────────────────────────────────────────

const TREE_PROFILES: TreeProfile[] = [
  {
    id: "lsm-tree",
    name: "LSM-Tree",
    description:
      "Writes go to memtable, flush to L0, then cascade via compaction through L1-L3. Each level amplifies writes by the size ratio.",
    baseAmplification: 10,
    layers: [
      { id: "memtable", label: "Memtable", writes: 0, capacity: 64, level: 0 },
      { id: "l0", label: "L0 (SST)", writes: 0, capacity: 256, level: 1 },
      { id: "l1", label: "L1", writes: 0, capacity: 2560, level: 2 },
      { id: "l2", label: "L2", writes: 0, capacity: 25600, level: 3 },
      { id: "l3", label: "L3", writes: 0, capacity: 256000, level: 4 },
    ],
    compactionEffect: (ratio) => Math.max(2, ratio * 10),
  },
  {
    id: "b-tree",
    name: "B-Tree",
    description:
      "Each write updates a page in-place. Page splits cascade upward. WAL + page write = 2x minimum amplification.",
    baseAmplification: 3,
    layers: [
      { id: "wal", label: "WAL", writes: 0, capacity: 100, level: 0 },
      { id: "root", label: "Root Page", writes: 0, capacity: 1, level: 1 },
      { id: "internal", label: "Internal Pages", writes: 0, capacity: 100, level: 2 },
      { id: "leaf", label: "Leaf Pages", writes: 0, capacity: 10000, level: 3 },
    ],
    compactionEffect: (ratio) => Math.max(2, 1 + ratio * 3),
  },
  {
    id: "b-plus-tree",
    name: "B+ Tree",
    description:
      "Similar to B-Tree but data only in leaves. Splits happen less often but each leaf page write is larger. WAL overhead persists.",
    baseAmplification: 4,
    layers: [
      { id: "wal", label: "WAL", writes: 0, capacity: 100, level: 0 },
      { id: "root", label: "Root", writes: 0, capacity: 1, level: 1 },
      { id: "branch", label: "Branch Nodes", writes: 0, capacity: 50, level: 2 },
      { id: "leaf", label: "Leaf Nodes", writes: 0, capacity: 10000, level: 3 },
    ],
    compactionEffect: (ratio) => Math.max(2, 1.5 + ratio * 3.5),
  },
];

// ── Component ──────────────────────────────────────────────────

export default function WriteAmplificationVisualizer() {
  const [treeType, setTreeType] = useState<TreeType>("lsm-tree");
  const [compactionRatio, setCompactionRatio] = useState(0.5);
  const [isPlaying, setIsPlaying] = useState(false);
  const [diskIOCount, setDiskIOCount] = useState(0);
  const [cascadeStep, setCascadeStep] = useState(-1);
  const [layerWrites, setLayerWrites] = useState<number[]>([]);

  const profile = useMemo(
    () => TREE_PROFILES.find((t) => t.id === treeType) ?? TREE_PROFILES[0],
    [treeType],
  );

  const amplificationFactor = useMemo(
    () => profile.compactionEffect(compactionRatio),
    [profile, compactionRatio],
  );

  // Reset when tree type changes
  useEffect(() => {
    setLayerWrites(profile.layers.map(() => 0));
    setCascadeStep(-1);
    setDiskIOCount(0);
    setIsPlaying(false);
  }, [profile]);

  // Animation loop
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isPlaying) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setCascadeStep((prev) => {
        const next = prev + 1;
        if (next >= profile.layers.length) {
          setIsPlaying(false);
          return prev;
        }

        // Compute writes for this layer
        setLayerWrites((lw) => {
          const updated = [...lw];
          if (next === 0) {
            updated[0] = 1;
          } else {
            // Each layer amplifies by a factor
            const factor = Math.ceil(amplificationFactor / profile.layers.length);
            updated[next] = (updated[next - 1] || 1) * factor;
          }
          return updated;
        });

        setDiskIOCount((d) => {
          const factor = Math.ceil(amplificationFactor / profile.layers.length);
          return d + Math.max(1, Math.pow(factor, next));
        });

        return next;
      });
    }, 700);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, profile.layers.length, amplificationFactor]);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setCascadeStep(-1);
    setDiskIOCount(0);
    setLayerWrites(profile.layers.map(() => 0));
  }, [profile]);

  const handleStart = useCallback(() => {
    handleReset();
    // Start on next tick so reset takes effect
    setTimeout(() => setIsPlaying(true), 50);
  }, [handleReset]);

  return (
    <div
      className={cn(
        "rounded-lg border p-5",
        "bg-[var(--surface)] border-[var(--border)]",
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <HardDrive className="h-5 w-5" style={{ color: "var(--primary)" }} />
        <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
          Write Amplification Visualizer
        </h3>
      </div>

      {/* Tree type selector */}
      <div className="flex gap-2 mb-4">
        {TREE_PROFILES.map((tp) => (
          <motion.button
            key={tp.id}
            whileTap={{ scale: 0.97 }}
            onClick={() => setTreeType(tp.id)}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-medium border transition-colors",
            )}
            style={{
              background: tp.id === treeType ? "var(--violet-3)" : "var(--gray-3)",
              borderColor: tp.id === treeType ? "var(--primary)" : "var(--border)",
              color: tp.id === treeType ? "var(--primary)" : "var(--foreground-muted)",
            }}
          >
            {tp.name}
          </motion.button>
        ))}
      </div>

      {/* Description */}
      <p className="text-xs mb-4 leading-relaxed" style={{ color: "var(--foreground-muted)" }}>
        {profile.description}
      </p>

      {/* Cascade visualization */}
      <div className="space-y-2 mb-4">
        <AnimatePresence>
          {profile.layers.map((layer, i) => {
            const isActive = i <= cascadeStep;
            const writes = layerWrites[i] || 0;
            const fillPct = Math.min((writes / Math.max(layer.capacity, 1)) * 100, 100);

            return (
              <React.Fragment key={layer.id}>
                {i > 0 && (
                  <div className="flex justify-center">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: i <= cascadeStep ? 1 : 0.2 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ArrowDown
                        className="h-4 w-4"
                        style={{
                          color: i <= cascadeStep ? "var(--state-warning)" : "var(--gray-6)",
                        }}
                      />
                    </motion.div>
                  </div>
                )}
                <motion.div
                  initial={{ opacity: 0.5 }}
                  animate={{
                    opacity: isActive ? 1 : 0.5,
                    scale: i === cascadeStep ? 1.02 : 1,
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className={cn(
                    "rounded-md border p-3 flex items-center gap-3",
                    i === cascadeStep ? "ring-1 ring-[var(--state-warning)]" : "",
                  )}
                  style={{
                    background: isActive ? "var(--gray-4)" : "var(--gray-3)",
                    borderColor: i === cascadeStep ? "var(--state-warning)" : "var(--border)",
                  }}
                >
                  <Layers className="h-4 w-4 shrink-0" style={{ color: isActive ? "var(--state-warning)" : "var(--gray-8)" }} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium" style={{ color: "var(--foreground)" }}>
                        {layer.label}
                      </span>
                      <span className="text-[10px] font-mono" style={{ color: isActive ? "var(--state-warning)" : "var(--foreground-muted)" }}>
                        {writes > 0 ? `${writes} writes` : "--"}
                      </span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--gray-5)" }}>
                      <motion.div
                        className="h-full rounded-full"
                        animate={{ width: `${fillPct}%` }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        style={{
                          background: fillPct > 80 ? "var(--state-error)" : "var(--state-warning)",
                        }}
                      />
                    </div>
                  </div>
                </motion.div>
              </React.Fragment>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div
          className="rounded-md border p-3 text-center"
          style={{ background: "var(--gray-3)", borderColor: "var(--border)" }}
        >
          <p className="text-[10px] mb-0.5" style={{ color: "var(--foreground-muted)" }}>
            Amplification
          </p>
          <p className="text-sm font-bold font-mono" style={{ color: "var(--state-warning)" }}>
            {amplificationFactor.toFixed(1)}x
          </p>
        </div>
        <div
          className="rounded-md border p-3 text-center"
          style={{ background: "var(--gray-3)", borderColor: "var(--border)" }}
        >
          <p className="text-[10px] mb-0.5" style={{ color: "var(--foreground-muted)" }}>
            Disk I/O
          </p>
          <p className="text-sm font-bold font-mono" style={{ color: "var(--viz-seq-high)" }}>
            {diskIOCount}
          </p>
        </div>
        <div
          className="rounded-md border p-3 text-center"
          style={{ background: "var(--gray-3)", borderColor: "var(--border)" }}
        >
          <p className="text-[10px] mb-0.5" style={{ color: "var(--foreground-muted)" }}>
            Cascade Step
          </p>
          <p className="text-sm font-bold font-mono" style={{ color: "var(--foreground)" }}>
            {cascadeStep + 1}/{profile.layers.length}
          </p>
        </div>
      </div>

      {/* Compaction ratio slider */}
      <div className="mb-4">
        <label className="block text-xs mb-1.5" style={{ color: "var(--foreground-muted)" }}>
          Compaction Ratio: <span style={{ color: "var(--foreground)" }}>{(compactionRatio * 100).toFixed(0)}%</span>
        </label>
        <input
          type="range"
          min={0.1}
          max={1}
          step={0.05}
          value={compactionRatio}
          onChange={(e) => setCompactionRatio(Number(e.target.value))}
          className="w-full accent-[var(--primary)]"
        />
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleStart}
          className={cn(
            "flex-1 flex items-center justify-center gap-2",
            "rounded-md px-4 py-2 text-sm font-medium",
            "bg-[var(--primary)] text-[var(--primary-foreground)]",
            "hover:bg-[var(--primary-hover)] transition-colors",
          )}
        >
          <Play className="h-4 w-4" />
          Simulate Write
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleReset}
          className={cn(
            "flex items-center justify-center gap-2",
            "rounded-md px-4 py-2 text-sm font-medium border",
          )}
          style={{
            background: "var(--gray-3)",
            borderColor: "var(--border)",
            color: "var(--foreground-muted)",
          }}
        >
          <RotateCcw className="h-4 w-4" />
          Reset
        </motion.button>
      </div>
    </div>
  );
}
