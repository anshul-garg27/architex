"use client";

import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Database,
  Server,
  Globe,
  ChevronRight,
  Layers,
  Timer,
  Cpu,
  HardDrive,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";

// ── Types ──────────────────────────────────────────────────────

interface SystemRole {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  metrics: { label: string; value: string; color: string }[];
  nodes: { id: string; label: string; x: number; y: number; highlighted?: boolean }[];
  edges: { from: string; to: string }[];
}

interface DataStructureConfig {
  id: string;
  name: string;
  roles: SystemRole[];
}

// ── Sample Data ────────────────────────────────────────────────

const DS_CONFIGS: DataStructureConfig[] = [
  {
    id: "hash-map",
    name: "Hash Map",
    roles: [
      {
        id: "cache-index",
        name: "Cache Index",
        description: "In-memory lookup table mapping cache keys to stored values. Provides O(1) average lookup enabling sub-ms cache hits.",
        icon: <Database className="h-4 w-4" />,
        metrics: [
          { label: "Read Latency", value: "~0.1μs", color: "var(--state-success)" },
          { label: "Memory", value: "16B/entry", color: "var(--state-warning)" },
          { label: "Throughput", value: "10M ops/s", color: "var(--state-success)" },
        ],
        nodes: [
          { id: "client", label: "Client", x: 30, y: 50 },
          { id: "cache", label: "Cache (HashMap)", x: 180, y: 50, highlighted: true },
          { id: "db", label: "Database", x: 350, y: 50 },
        ],
        edges: [
          { from: "client", to: "cache" },
          { from: "cache", to: "db" },
        ],
      },
      {
        id: "routing-table",
        name: "Routing Table",
        description: "Maps request paths or service IDs to backend handlers. Critical in API gateways and load balancers for fast route resolution.",
        icon: <Globe className="h-4 w-4" />,
        metrics: [
          { label: "Lookup", value: "O(1)", color: "var(--state-success)" },
          { label: "Routes", value: "~10K", color: "var(--foreground-muted)" },
          { label: "Update", value: "O(1) amortized", color: "var(--state-success)" },
        ],
        nodes: [
          { id: "req", label: "Request", x: 30, y: 50 },
          { id: "gw", label: "Gateway (HashMap)", x: 180, y: 50, highlighted: true },
          { id: "svc-a", label: "Service A", x: 350, y: 25 },
          { id: "svc-b", label: "Service B", x: 350, y: 75 },
        ],
        edges: [
          { from: "req", to: "gw" },
          { from: "gw", to: "svc-a" },
          { from: "gw", to: "svc-b" },
        ],
      },
      {
        id: "session-store",
        name: "Session Store",
        description: "Stores user session data keyed by session ID. Enables stateless servers by providing O(1) session lookup in Redis-like stores.",
        icon: <Server className="h-4 w-4" />,
        metrics: [
          { label: "Read", value: "~0.5ms", color: "var(--state-success)" },
          { label: "Write", value: "~1ms", color: "var(--state-warning)" },
          { label: "TTL Support", value: "Yes", color: "var(--state-success)" },
        ],
        nodes: [
          { id: "lb", label: "Load Balancer", x: 30, y: 50 },
          { id: "sess", label: "Session (HashMap)", x: 180, y: 50, highlighted: true },
          { id: "srv1", label: "Server 1", x: 350, y: 25 },
          { id: "srv2", label: "Server 2", x: 350, y: 75 },
        ],
        edges: [
          { from: "lb", to: "sess" },
          { from: "sess", to: "srv1" },
          { from: "sess", to: "srv2" },
        ],
      },
    ],
  },
  {
    id: "b-tree",
    name: "B-Tree",
    roles: [
      {
        id: "db-index",
        name: "Database Index",
        description: "Disk-resident sorted structure enabling range queries and point lookups in O(log n). The backbone of relational database indexes.",
        icon: <HardDrive className="h-4 w-4" />,
        metrics: [
          { label: "Point Lookup", value: "O(log n)", color: "var(--state-success)" },
          { label: "Range Scan", value: "O(log n + k)", color: "var(--state-warning)" },
          { label: "Fan-out", value: "100-500", color: "var(--foreground-muted)" },
        ],
        nodes: [
          { id: "query", label: "Query", x: 30, y: 50 },
          { id: "idx", label: "B-Tree Index", x: 180, y: 50, highlighted: true },
          { id: "pages", label: "Data Pages", x: 350, y: 50 },
        ],
        edges: [
          { from: "query", to: "idx" },
          { from: "idx", to: "pages" },
        ],
      },
      {
        id: "filesystem",
        name: "Filesystem Metadata",
        description: "Stores directory entries and file metadata in sorted order. Enables efficient directory listing and file lookup in ext4/NTFS/APFS.",
        icon: <Layers className="h-4 w-4" />,
        metrics: [
          { label: "Lookup", value: "O(log n)", color: "var(--state-success)" },
          { label: "Insert", value: "O(log n)", color: "var(--state-success)" },
          { label: "Disk I/O", value: "3-4 reads", color: "var(--state-warning)" },
        ],
        nodes: [
          { id: "os", label: "OS", x: 30, y: 50 },
          { id: "btree", label: "B-Tree (FS)", x: 180, y: 50, highlighted: true },
          { id: "disk", label: "Disk Blocks", x: 350, y: 50 },
        ],
        edges: [
          { from: "os", to: "btree" },
          { from: "btree", to: "disk" },
        ],
      },
    ],
  },
  {
    id: "bloom-filter",
    name: "Bloom Filter",
    roles: [
      {
        id: "cache-guard",
        name: "Cache Guard",
        description: "Probabilistic filter placed before cache to avoid unnecessary lookups for non-existent keys. Saves cache misses and DB hits.",
        icon: <Cpu className="h-4 w-4" />,
        metrics: [
          { label: "FP Rate", value: "~1%", color: "var(--state-warning)" },
          { label: "Lookup", value: "O(k)", color: "var(--state-success)" },
          { label: "Memory", value: "1.2B/entry", color: "var(--state-success)" },
        ],
        nodes: [
          { id: "req", label: "Request", x: 30, y: 50 },
          { id: "bloom", label: "Bloom Filter", x: 160, y: 50, highlighted: true },
          { id: "cache", label: "Cache", x: 290, y: 50 },
          { id: "db", label: "DB", x: 400, y: 50 },
        ],
        edges: [
          { from: "req", to: "bloom" },
          { from: "bloom", to: "cache" },
          { from: "cache", to: "db" },
        ],
      },
      {
        id: "lsm-compaction",
        name: "LSM-Tree Compaction Guard",
        description: "Used in LSM-tree storage engines (LevelDB, RocksDB) to skip SSTables that definitely don't contain a key during reads.",
        icon: <HardDrive className="h-4 w-4" />,
        metrics: [
          { label: "Disk Reads Saved", value: "~90%", color: "var(--state-success)" },
          { label: "Per-SSTable", value: "~10KB", color: "var(--foreground-muted)" },
          { label: "Check Time", value: "~1μs", color: "var(--state-success)" },
        ],
        nodes: [
          { id: "read", label: "Read", x: 30, y: 50 },
          { id: "memtable", label: "Memtable", x: 150, y: 25 },
          { id: "bf", label: "Bloom Filters", x: 150, y: 75, highlighted: true },
          { id: "sst", label: "SSTables", x: 300, y: 50 },
        ],
        edges: [
          { from: "read", to: "memtable" },
          { from: "read", to: "bf" },
          { from: "bf", to: "sst" },
        ],
      },
    ],
  },
];

// ── Mini Diagram ───────────────────────────────────────────────

function RoleDiagram({ role }: { role: SystemRole }) {
  const nodeMap = useMemo(() => {
    const m = new Map<string, (typeof role.nodes)[0]>();
    for (const n of role.nodes) m.set(n.id, n);
    return m;
  }, [role.nodes]);

  return (
    <svg viewBox="0 0 460 100" className="w-full h-auto" style={{ maxHeight: 90 }}>
      <defs>
        <marker id="role-arrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <path d="M0,0 L8,3 L0,6 Z" fill="var(--gray-7)" />
        </marker>
      </defs>
      {role.edges.map((e) => {
        const from = nodeMap.get(e.from);
        const to = nodeMap.get(e.to);
        if (!from || !to) return null;
        return (
          <line
            key={`${e.from}-${e.to}`}
            x1={from.x + 50}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke="var(--gray-7)"
            strokeWidth={1.5}
            markerEnd="url(#role-arrow)"
          />
        );
      })}
      {role.nodes.map((n) => {
        const hl = n.highlighted;
        return (
          <g key={n.id}>
            <rect
              x={n.x}
              y={n.y - 16}
              width={100}
              height={32}
              rx={6}
              fill={hl ? "var(--violet-3)" : "var(--gray-4)"}
              stroke={hl ? "var(--primary)" : "var(--gray-6)"}
              strokeWidth={hl ? 2 : 1}
            />
            <text
              x={n.x + 50}
              y={n.y + 1}
              textAnchor="middle"
              fontSize={10}
              fill={hl ? "var(--primary)" : "var(--foreground-muted)"}
            >
              {n.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Component ──────────────────────────────────────────────────

export default function SystemRoleSelector() {
  const setActiveModule = useUIStore((s) => s.setActiveModule);
  const [dsId, setDsId] = useState(DS_CONFIGS[0].id);
  const [roleId, setRoleId] = useState(DS_CONFIGS[0].roles[0].id);

  const dsConfig = useMemo(
    () => DS_CONFIGS.find((d) => d.id === dsId) ?? DS_CONFIGS[0],
    [dsId],
  );

  const currentRole = useMemo(
    () => dsConfig.roles.find((r) => r.id === roleId) ?? dsConfig.roles[0],
    [dsConfig, roleId],
  );

  const handleDsChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newDs = DS_CONFIGS.find((d) => d.id === e.target.value) ?? DS_CONFIGS[0];
      setDsId(newDs.id);
      setRoleId(newDs.roles[0].id);
    },
    [],
  );

  return (
    <div
      className={cn(
        "rounded-lg border p-5",
        "bg-[var(--surface)] border-[var(--border)]",
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Layers className="h-5 w-5" style={{ color: "var(--primary)" }} />
        <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
          System Role Selector
        </h3>
      </div>

      {/* DS Selector */}
      <div className="mb-3">
        <label className="block text-xs mb-1.5" style={{ color: "var(--foreground-muted)" }}>
          Data Structure
        </label>
        <select
          value={dsId}
          onChange={handleDsChange}
          className={cn(
            "w-full rounded-md border px-3 py-2 text-sm",
            "bg-[var(--surface-elevated)] border-[var(--border)]",
            "focus:outline-none focus:ring-2 focus:ring-[var(--ring)]",
          )}
          style={{ color: "var(--foreground)" }}
        >
          {DS_CONFIGS.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      {/* Role buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        {dsConfig.roles.map((role) => (
          <motion.button
            key={role.id}
            whileTap={{ scale: 0.97 }}
            onClick={() => setRoleId(role.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors",
            )}
            style={{
              background: role.id === roleId ? "var(--violet-3)" : "var(--gray-3)",
              borderColor: role.id === roleId ? "var(--primary)" : "var(--border)",
              color: role.id === roleId ? "var(--primary)" : "var(--foreground-muted)",
            }}
          >
            {role.icon}
            {role.name}
          </motion.button>
        ))}
      </div>

      {/* Diagram */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentRole.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="rounded-md border p-3 mb-4"
          style={{ background: "var(--gray-3)", borderColor: "var(--border)" }}
        >
          <RoleDiagram role={currentRole} />
        </motion.div>
      </AnimatePresence>

      {/* Description */}
      <p className="text-xs mb-3 leading-relaxed" style={{ color: "var(--foreground-muted)" }}>
        {currentRole.description}
      </p>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {currentRole.metrics.map((m) => (
          <div
            key={m.label}
            className="rounded-md border p-2 text-center"
            style={{ background: "var(--gray-3)", borderColor: "var(--border)" }}
          >
            <p className="text-[10px] mb-0.5" style={{ color: "var(--foreground-muted)" }}>
              {m.label}
            </p>
            <p className="text-xs font-semibold" style={{ color: m.color }}>
              {m.value}
            </p>
          </div>
        ))}
      </div>

      {/* Bridge */}
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "w-full flex items-center justify-center gap-2",
          "rounded-md px-4 py-2.5 text-sm font-medium",
          "bg-[var(--primary)] text-[var(--primary-foreground)]",
          "hover:bg-[var(--primary-hover)] transition-colors",
        )}
        onClick={() => {
          setActiveModule("system-design");
        }}
      >
        Switch to System Design &rarr;
        <ChevronRight className="h-4 w-4" />
      </motion.button>
    </div>
  );
}
