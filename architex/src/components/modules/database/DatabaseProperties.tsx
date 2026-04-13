"use client";

import React, { memo, useState } from "react";
import {
  Play,
  Plus,
  Trash2,
  AlertTriangle,
  TreePine,
  Hash,
  Layers,
  ChevronDown,
  ChevronRight,
  Columns,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  EREntity,
  ERAttribute,
  BTreeStep,
  HashIndexState,
  HashIndexStep,
  QueryPlanNode,
  LSMVizState,
  LSMVizStep,
  MVCCStep,
  ARIESStep,
  JoinAlgorithm,
  JoinStep,
} from "@/lib/database";
import type { TransactionStep, NormalizationResult } from "@/lib/database";
import type { ACIDProperty, ACIDStep } from "./canvases/ACIDCanvas";
import type { CAPDatabase, CAPPartitionStep } from "./canvases/CAPTheoremCanvas";
import { CAP_DATABASES } from "./canvases/CAPTheoremCanvas";
import type { DatabaseMode } from "./useDatabaseModule";
import type { RowColumnQueryType } from "./canvases/RowColumnCanvas";

/** Recursive component to render plan node details in the properties panel. */
const PlanNodeDetails = memo(function PlanNodeDetails({
  node,
  depth = 0,
}: {
  node: QueryPlanNode;
  depth?: number;
}) {
  return (
    <div style={{ marginLeft: depth * 12 }}>
      <div className="mb-2 rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm p-2.5">
        <div className="mb-1 flex items-center gap-2">
          <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-bold text-primary shadow-[0_0_8px_rgba(110,86,207,0.1)]">
            {node.type}
          </span>
          {node.table && (
            <span className="font-mono text-[10px] text-foreground-muted">
              {node.table}
            </span>
          )}
        </div>
        <p className="mb-1 text-[11px] text-foreground-muted">
          {node.description}
        </p>
        <div className="flex gap-3 text-[10px] text-foreground-subtle">
          <span>Cost: {node.cost.toFixed(2)}</span>
          <span>Rows: {node.rows}</span>
        </div>
      </div>
      {node.children.map((child) => (
        <PlanNodeDetails key={child.id} node={child} depth={depth + 1} />
      ))}
    </div>
  );
});

// ── Pseudocode definitions ─────────────────────────────────────

interface PseudocodeLine {
  lineNum: number;
  text: string;
  indent: number;
  isKeyword?: boolean;
  isComment?: boolean;
}

interface PseudocodeBlock {
  title: string;
  lines: PseudocodeLine[];
}

const BTREE_INSERT_PSEUDOCODE: PseudocodeBlock = {
  title: "B-Tree INSERT",
  lines: [
    { lineNum: 1, text: "BTREE-INSERT(T, k):", indent: 0, isKeyword: true },
    { lineNum: 2, text: "if T.root is full:", indent: 1, isKeyword: true },
    { lineNum: 3, text: "split root, create new root", indent: 2 },
    { lineNum: 4, text: "INSERT-NONFULL(T.root, k)", indent: 1 },
    { lineNum: 5, text: "", indent: 0 },
    { lineNum: 6, text: "INSERT-NONFULL(node, k):", indent: 0, isKeyword: true },
    { lineNum: 7, text: "if node is leaf:", indent: 1, isKeyword: true },
    { lineNum: 8, text: "insert k in sorted position", indent: 2 },
    { lineNum: 9, text: "else:", indent: 1, isKeyword: true },
    { lineNum: 10, text: "find child i where keys[i-1] < k \u2264 keys[i]", indent: 2 },
    { lineNum: 11, text: "if child[i] is full:", indent: 2, isKeyword: true },
    { lineNum: 12, text: "SPLIT-CHILD(node, i)", indent: 3 },
    { lineNum: 13, text: "INSERT-NONFULL(child[i], k)", indent: 2 },
  ],
};

const BTREE_SEARCH_PSEUDOCODE: PseudocodeBlock = {
  title: "B-Tree SEARCH",
  lines: [
    { lineNum: 1, text: "BTREE-SEARCH(node, k):", indent: 0, isKeyword: true },
    { lineNum: 2, text: "i = 1", indent: 1 },
    { lineNum: 3, text: "while i \u2264 node.n and k > node.keys[i]:", indent: 1, isKeyword: true },
    { lineNum: 4, text: "i = i + 1", indent: 2 },
    { lineNum: 5, text: "if i \u2264 node.n and k = node.keys[i]:", indent: 1, isKeyword: true },
    { lineNum: 6, text: "return (node, i)", indent: 2 },
    { lineNum: 7, text: "if node is leaf:", indent: 1, isKeyword: true },
    { lineNum: 8, text: "return NOT-FOUND", indent: 2 },
    { lineNum: 9, text: "return BTREE-SEARCH(node.child[i], k)", indent: 1 },
  ],
};

const HASH_INSERT_PSEUDOCODE: PseudocodeBlock = {
  title: "Hash INSERT",
  lines: [
    { lineNum: 1, text: "HASH-INSERT(table, key, value):", indent: 0, isKeyword: true },
    { lineNum: 2, text: "bucket = hash(key) mod table.size", indent: 1 },
    { lineNum: 3, text: "if key exists in bucket chain:", indent: 1, isKeyword: true },
    { lineNum: 4, text: "update value", indent: 2 },
    { lineNum: 5, text: "else:", indent: 1, isKeyword: true },
    { lineNum: 6, text: "append (key, value) to bucket", indent: 2 },
    { lineNum: 7, text: "if load_factor > 0.75:", indent: 2, isKeyword: true },
    { lineNum: 8, text: "RESIZE(table)", indent: 3 },
  ],
};

const HASH_SEARCH_PSEUDOCODE: PseudocodeBlock = {
  title: "Hash SEARCH",
  lines: [
    { lineNum: 1, text: "HASH-SEARCH(table, key):", indent: 0, isKeyword: true },
    { lineNum: 2, text: "bucket = hash(key) mod table.size", indent: 1 },
    { lineNum: 3, text: "for each entry in bucket chain:", indent: 1, isKeyword: true },
    { lineNum: 4, text: "if entry.key = key:", indent: 2, isKeyword: true },
    { lineNum: 5, text: "return entry.value", indent: 3 },
    { lineNum: 6, text: "return NOT-FOUND", indent: 1 },
  ],
};

const LSM_WRITE_PSEUDOCODE: PseudocodeBlock = {
  title: "LSM WRITE",
  lines: [
    { lineNum: 1, text: "LSM-WRITE(tree, key, value):", indent: 0, isKeyword: true },
    { lineNum: 2, text: "append to WAL", indent: 1, isComment: true },
    { lineNum: 3, text: "insert into memtable (sorted)", indent: 1, isComment: true },
    { lineNum: 4, text: "if memtable.size \u2265 capacity:", indent: 1, isKeyword: true },
    { lineNum: 5, text: "freeze memtable \u2192 immutable", indent: 2 },
    { lineNum: 6, text: "flush immutable \u2192 new L0 SSTable", indent: 2 },
    { lineNum: 7, text: "if L0.count \u2265 threshold:", indent: 2, isKeyword: true },
    { lineNum: 8, text: "COMPACT(L0 \u2192 L1)", indent: 3 },
  ],
};

const LSM_READ_PSEUDOCODE: PseudocodeBlock = {
  title: "LSM READ",
  lines: [
    { lineNum: 1, text: "LSM-READ(tree, key):", indent: 0, isKeyword: true },
    { lineNum: 2, text: "if key in memtable:", indent: 1, isKeyword: true },
    { lineNum: 3, text: "return memtable[key]", indent: 2 },
    { lineNum: 4, text: "if key in immutable memtable:", indent: 1, isKeyword: true },
    { lineNum: 5, text: "return immutable[key]", indent: 2 },
    { lineNum: 6, text: "for level in [L0, L1, L2, ...]:", indent: 1, isKeyword: true },
    { lineNum: 7, text: "for sstable in level (newest first):", indent: 2, isKeyword: true },
    { lineNum: 8, text: "if bloom_filter says NOT present: skip", indent: 3 },
    { lineNum: 9, text: "if key in sstable: return value", indent: 3, isKeyword: true },
    { lineNum: 10, text: "return NOT-FOUND", indent: 1 },
  ],
};

/** Maps B-Tree step operations to approximate pseudocode line numbers. */
function getBtreeHighlightLine(step: BTreeStep | undefined): number | null {
  if (!step) return null;
  switch (step.operation) {
    case "insert": return 8;   // insert k in sorted position
    case "search": return 6;   // return (node, i) -- found
    case "split": return 12;   // SPLIT-CHILD
    default: return null;
  }
}

/** Maps Hash step operations to approximate pseudocode line numbers. */
function getHashHighlightLine(step: HashIndexStep | undefined): number | null {
  if (!step) return null;
  switch (step.operation) {
    case "hash": return 2;       // bucket = hash(key) mod table.size
    case "insert": return 6;     // append (key, value)
    case "collision": return 3;  // key exists in bucket chain
    case "resize": return 8;     // RESIZE(table)
    case "search": return 5;     // return entry.value
    case "delete": return 3;     // find in bucket chain
    default: return null;
  }
}

/** Maps LSM step operations to approximate pseudocode line numbers. */
function getLsmHighlightLine(step: LSMVizStep | undefined): number | null {
  if (!step) return null;
  switch (step.operation) {
    case "write": return 3;      // insert into memtable
    case "flush": return 6;      // flush immutable -> SSTable
    case "compact": return 8;    // COMPACT(L0 -> L1)
    case "read": return 2;       // check memtable
    case "checkpoint": return 6; // flush-related
    default: return null;
  }
}

/** Collapsible pseudocode panel */
const PseudocodePanel = memo(function PseudocodePanel({
  blocks,
  highlightLine,
  activeBlockIndex,
}: {
  blocks: PseudocodeBlock[];
  highlightLine: number | null;
  activeBlockIndex?: number;
}) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="border-t border-sidebar-border pt-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="mb-2 flex w-full items-center gap-1.5 text-left"
      >
        {isOpen ? (
          <ChevronDown className="h-3 w-3 text-foreground-muted" />
        ) : (
          <ChevronRight className="h-3 w-3 text-foreground-muted" />
        )}
        <span className="text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
          Pseudocode
        </span>
      </button>
      {isOpen && (
        <div className="space-y-3">
          {blocks.map((block, blockIdx) => (
            <div key={block.title}>
              <span className="mb-1 block text-[10px] font-bold text-primary">
                {block.title}
              </span>
              <div className="rounded-xl border border-border/30 bg-[#0d1117] p-2.5 font-mono text-[10px] leading-relaxed">
                {block.lines.map((line) => {
                  const isHighlighted =
                    highlightLine === line.lineNum &&
                    (activeBlockIndex === undefined || activeBlockIndex === blockIdx);
                  return (
                    <div
                      key={`${block.title}-${line.lineNum}`}
                      className={cn(
                        "flex transition-colors duration-200",
                        isHighlighted && "rounded bg-primary/20 -mx-1 px-1",
                      )}
                    >
                      <span className="mr-3 inline-block w-4 text-right text-foreground-subtle/50 select-none">
                        {line.text ? line.lineNum : ""}
                      </span>
                      <span style={{ paddingLeft: line.indent * 16 }}>
                        {line.isComment ? (
                          <span className="text-emerald-400/70">
                            {line.text.includes("//") ? (
                              <>
                                {line.text.split("//")[0]}
                                <span className="text-foreground-subtle/50">
                                  {"// "}{line.text.split("//").slice(1).join("//")}
                                </span>
                              </>
                            ) : (
                              line.text
                            )}
                          </span>
                        ) : line.isKeyword ? (
                          <span>
                            <span className="text-violet-400 font-bold">
                              {line.text.split(/(\s)/)[0]}
                            </span>
                            <span className="text-foreground-muted">
                              {line.text.slice(line.text.split(/(\s)/)[0].length)}
                            </span>
                          </span>
                        ) : (
                          <span className="text-foreground-muted">{line.text}</span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

/** Collapsible "Used in Production" panel (DBL-084) */
const UsedInProductionPanel = memo(function UsedInProductionPanel({
  entries,
}: {
  entries: Array<{ name: string; description: string }>;
}) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="border-t border-sidebar-border pt-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="mb-2 flex w-full items-center gap-1.5 text-left"
      >
        {isOpen ? (
          <ChevronDown className="h-3 w-3 text-foreground-muted" />
        ) : (
          <ChevronRight className="h-3 w-3 text-foreground-muted" />
        )}
        <span className="text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
          Used in Production
        </span>
      </button>
      {isOpen && (
        <div className="space-y-2">
          {entries.map((entry) => (
            <div
              key={entry.name}
              className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 backdrop-blur-sm p-2.5 shadow-[0_0_15px_rgba(16,185,129,0.05)]"
            >
              <span className="block text-[10px] font-bold text-emerald-400">
                {entry.name}
              </span>
              <p className="mt-0.5 text-[10px] text-foreground-subtle">
                {entry.description}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

const DatabaseProperties = memo(function DatabaseProperties({
  activeMode,
  // ER props
  selectedEntity,
  onUpdateEntity,
  onDeleteEntity,
  onAddAttribute,
  onUpdateAttribute,
  onDeleteAttribute,
  // Normalization props
  normRelation,
  normAttributes,
  normFdsText,
  onNormRelationChange,
  onNormAttributesChange,
  onNormFdsTextChange,
  onAnalyze,
  normResult,
  // Transaction props
  txSteps,
  txStepIndex,
  // B-Tree props
  btreeSteps,
  btreeStepIndex,
  btreeOrder,
  // Hash Index props
  hashState,
  hashSteps,
  hashStepIndex,
  // Query Plan props
  queryPlan,
  // LSM-Tree props
  lsmState,
  lsmSteps,
  lsmStepIndex,
  // ACID
  acidProperty,
  acidSteps,
  acidStepIndex,
  onSelectMode,
  // CAP
  capSelectedDb,
  capSimType,
  capSteps,
  capStepIndex,
  // MVCC
  mvccSteps,
  mvccStepIndex,
  // ARIES Recovery (DBL-091)
  ariesSteps,
  ariesStepIndex,
  // Row vs Column
  rowColQueryType,
  // SQL vs NoSQL
  sqlNoSqlUseCase,
  // Index Anti-Patterns
  indexAntiPattern,
  // Caching Patterns
  cachingPattern,
  // Join Algorithms (DBL-076)
  joinAlgorithm,
  joinSteps,
  joinStepIndex,
  // Star/Snowflake Schema (DBL-088)
  starSnowflakeType,
  // Connection Pooling (DBL-093)
  connPoolMode,
  connPoolSize,
}: {
  activeMode: DatabaseMode;
  selectedEntity: EREntity | null;
  onUpdateEntity: (id: string, updates: Partial<EREntity>) => void;
  onDeleteEntity: (id: string) => void;
  onAddAttribute: (entityId: string) => void;
  onUpdateAttribute: (
    entityId: string,
    attrId: string,
    updates: Partial<ERAttribute>,
  ) => void;
  onDeleteAttribute: (entityId: string, attrId: string) => void;
  normRelation: string;
  normAttributes: string;
  normFdsText: string;
  onNormRelationChange: (v: string) => void;
  onNormAttributesChange: (v: string) => void;
  onNormFdsTextChange: (v: string) => void;
  onAnalyze: () => void;
  normResult: NormalizationResult | null;
  txSteps: TransactionStep[];
  txStepIndex: number;
  btreeSteps: BTreeStep[];
  btreeStepIndex: number;
  btreeOrder: number;
  hashState: HashIndexState;
  hashSteps: HashIndexStep[];
  hashStepIndex: number;
  queryPlan: QueryPlanNode | null;
  lsmState: LSMVizState;
  lsmSteps: LSMVizStep[];
  lsmStepIndex: number;
  // ACID
  acidProperty: ACIDProperty;
  acidSteps: ACIDStep[];
  acidStepIndex: number;
  onSelectMode: (m: DatabaseMode) => void;
  // CAP
  capSelectedDb: CAPDatabase | null;
  capSimType: "cp" | "ap";
  capSteps: CAPPartitionStep[];
  capStepIndex: number;
  // MVCC
  mvccSteps: MVCCStep[];
  mvccStepIndex: number;
  // ARIES Recovery (DBL-091)
  ariesSteps?: ARIESStep[];
  ariesStepIndex?: number;
  // Row vs Column
  rowColQueryType?: RowColumnQueryType;
  // SQL vs NoSQL
  sqlNoSqlUseCase?: string | null;
  // Index Anti-Patterns
  indexAntiPattern?: string;
  // Caching Patterns
  cachingPattern?: string;
  // Join Algorithms (DBL-076)
  joinAlgorithm?: JoinAlgorithm;
  joinSteps?: JoinStep[];
  joinStepIndex?: number;
  // Star/Snowflake Schema (DBL-088)
  starSnowflakeType?: string;
  // Connection Pooling (DBL-093)
  connPoolMode?: string;
  connPoolSize?: number;
}) {
  // ── ER Entity Editor ──────────────────────────────────────
  if (activeMode === "er-diagram") {
    if (!selectedEntity) {
      return (
        <div className="flex h-full flex-col">
          <div className="border-b border-sidebar-border px-3 py-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
              Properties
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
            {/* Getting started guide */}
            <div className="rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm p-3">
              <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
                Getting Started
              </span>
              <div className="space-y-1.5 text-[11px] text-foreground-subtle">
                <p>
                  <strong className="text-foreground-muted">Entities</strong> are
                  the THINGS you track (Users, Orders, Products).
                </p>
                <p>
                  <strong className="text-foreground-muted">Attributes</strong> are
                  the FACTS about them (name, email, price).
                </p>
                <p>
                  <strong className="text-foreground-muted">Relationships</strong>{" "}
                  are the CONNECTIONS between them (a User places many Orders).
                </p>
              </div>
              <p className="mt-2 text-[11px] text-foreground-subtle">
                Click an entity on the canvas to edit it, or use the palette to
                add new ones.
              </p>
            </div>

            {/* Real-world */}
            <div className="border-t border-sidebar-border pt-3">
              <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
                Real-World Usage
              </span>
              <p className="text-[11px] text-foreground-subtle">
                Instagram{"\u2019"}s database started as a simple User{"\u2192"}Photo{"\u2192"}Comment
                schema. As the app grew, they added tables for Likes, Followers,
                Stories, Reels — each designed using ER modeling principles.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-sidebar-border px-3 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            Entity Properties
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
          {/* Entity name */}
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              Name
            </label>
            <input
              value={selectedEntity.name}
              onChange={(e) =>
                onUpdateEntity(selectedEntity.id, { name: e.target.value })
              }
              className="w-full rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm px-2 py-1.5 text-xs text-foreground outline-none focus:border-primary"
            />
          </div>

          {/* Weak entity toggle */}
          <label className="flex items-center gap-2 text-xs text-foreground-muted">
            <input
              type="checkbox"
              checked={selectedEntity.isWeak}
              onChange={(e) =>
                onUpdateEntity(selectedEntity.id, { isWeak: e.target.checked })
              }
              className="rounded border-border/30"
            />
            Weak entity
          </label>

          {/* Attributes */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
                Attributes
              </span>
              <button
                onClick={() => onAddAttribute(selectedEntity.id)}
                className="flex items-center gap-1 text-[10px] text-primary hover:underline"
              >
                <Plus className="h-3 w-3" /> Add
              </button>
            </div>
            <div className="space-y-2">
              {selectedEntity.attributes.map((attr) => (
                <div
                  key={attr.id}
                  className="rounded border border-border/30 bg-elevated/50 backdrop-blur-sm p-2"
                >
                  <div className="mb-1.5 flex items-center gap-1">
                    <input
                      value={attr.name}
                      onChange={(e) =>
                        onUpdateAttribute(selectedEntity.id, attr.id, {
                          name: e.target.value,
                        })
                      }
                      className="flex-1 rounded-xl border border-border/30 bg-background px-1.5 py-1 text-[11px] text-foreground outline-none focus:border-primary"
                      placeholder="name"
                    />
                    <button
                      onClick={() =>
                        onDeleteAttribute(selectedEntity.id, attr.id)
                      }
                      className="text-foreground-subtle hover:text-red-400"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      value={attr.type}
                      onChange={(e) =>
                        onUpdateAttribute(selectedEntity.id, attr.id, {
                          type: e.target.value,
                        })
                      }
                      className="w-20 rounded-xl border border-border/30 bg-background px-1.5 py-1 text-[11px] text-foreground outline-none focus:border-primary"
                      placeholder="type"
                    />
                    <label className="flex items-center gap-1 text-[10px] text-foreground-muted">
                      <input
                        type="checkbox"
                        checked={attr.isPK}
                        onChange={(e) =>
                          onUpdateAttribute(selectedEntity.id, attr.id, {
                            isPK: e.target.checked,
                          })
                        }
                      />
                      PK
                    </label>
                    <label className="flex items-center gap-1 text-[10px] text-foreground-muted">
                      <input
                        type="checkbox"
                        checked={attr.isFK}
                        onChange={(e) =>
                          onUpdateAttribute(selectedEntity.id, attr.id, {
                            isFK: e.target.checked,
                          })
                        }
                      />
                      FK
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delete entity */}
          <button
            onClick={() => onDeleteEntity(selectedEntity.id)}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/5 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/15"
          >
            <Trash2 className="h-3 w-3" /> Delete Entity
          </button>
        </div>
      </div>
    );
  }

  // ── Normalization Input ─────────────────────────────────────
  if (activeMode === "normalization") {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-sidebar-border px-3 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            Normalization Input
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              Relation Name
            </label>
            <input
              value={normRelation}
              onChange={(e) => onNormRelationChange(e.target.value)}
              className="w-full rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm px-2 py-1.5 text-xs text-foreground outline-none focus:border-primary"
              placeholder="e.g. StudentCourse"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              Attributes (comma-separated)
            </label>
            <input
              value={normAttributes}
              onChange={(e) => onNormAttributesChange(e.target.value)}
              className="w-full rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm px-2 py-1.5 font-mono text-xs text-foreground outline-none focus:border-primary"
              placeholder="e.g. A, B, C, D"
            />
          </div>
          <div data-onboarding="db-norm-fd">
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              Functional Dependencies (one per line)
            </label>
            <textarea
              value={normFdsText}
              onChange={(e) => onNormFdsTextChange(e.target.value)}
              rows={5}
              className="w-full rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm px-2 py-1.5 font-mono text-xs text-foreground outline-none focus:border-primary"
              placeholder={"A,B -> C,D\nC -> D"}
            />
          </div>
          <button
            onClick={onAnalyze}
            className="flex w-full items-center justify-center gap-1.5 rounded-full bg-primary px-3 py-2 text-xs font-medium text-white shadow-[0_0_20px_rgba(110,86,207,0.4)] transition-all hover:bg-primary/90 hover:shadow-[0_0_30px_rgba(110,86,207,0.6)]"
          >
            <Play className="h-3 w-3" /> Analyze
          </button>

          {normResult && (
            <div className="space-y-2 border-t border-sidebar-border pt-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
                  Normal Form:
                </span>
                <span className="font-mono text-xs font-bold text-primary">
                  {normResult.currentNF}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
                  Candidate Keys:
                </span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {normResult.candidateKeys.map((ck, i) => (
                    <span
                      key={i}
                      className="rounded bg-blue-500/10 px-1.5 py-0.5 font-mono text-[10px] text-blue-300"
                    >
                      {"{"}{ck.join(",")}{"}"}
                    </span>
                  ))}
                </div>
              </div>
              {normResult.decomposition.length > 0 && (
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
                    Decomposed Relations:
                  </span>
                  {normResult.decomposition.map((r, i) => (
                    <p
                      key={i}
                      className="mt-0.5 font-mono text-[10px] text-foreground-muted"
                    >
                      {r.name}({r.attributes.join(", ")})
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* How It Works */}
          <div className="border-t border-sidebar-border pt-3">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              How It Works
            </span>
            <div className="space-y-1.5 text-[11px] text-foreground-subtle">
              <p>
                <strong className="text-foreground-muted">Attribute Closure:</strong>{" "}
                Starting from a set of attributes, compute everything they can
                determine. If you know StudentID, you can determine StudentName
                (via the FD StudentID&rarr;StudentName). Keep applying FDs until
                no new attributes are found.
              </p>
              <p>
                <strong className="text-foreground-muted">Candidate Keys:</strong>{" "}
                The minimal set of attributes that determines ALL others. A
                relation can have multiple candidate keys, but each must be
                minimal — removing any attribute breaks the determination.
              </p>
              <p>
                <strong className="text-foreground-muted">Normal Forms:</strong>{" "}
                1NF = atomic values (no lists in cells). 2NF = no partial
                dependencies (every non-key attribute depends on the WHOLE key).
                3NF = no transitive dependencies (no non-key attribute depends
                on another non-key attribute).
              </p>
            </div>
          </div>
          {/* Real-world */}
          <div className="border-t border-sidebar-border pt-3">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              Real-World
            </span>
            <p className="text-[11px] text-foreground-subtle">
              Instagram&apos;s user table stores name once, not on every post.
              That&apos;s normalization. But their feed is denormalized for read
              speed — knowing when to break the rules is as important as knowing
              them.
            </p>
          </div>

          {/* When to Denormalize */}
          <div className="border-t border-sidebar-border pt-3">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              When to Denormalize
            </span>
            <p className="mb-2 text-[11px] text-foreground-subtle">
              Normalization prevents data redundancy — but sometimes redundancy
              is the point.
            </p>
            <div className="space-y-1.5 text-[11px] text-foreground-subtle">
              <p>
                <strong className="text-foreground-muted">Read:write ratio &gt; 10:1</strong>{" "}
                — when reads far outnumber writes, duplicating data avoids
                expensive JOINs on every request.
              </p>
              <p>
                <strong className="text-foreground-muted">JOIN queries are your bottleneck</strong>{" "}
                — pre-join data into one table so reads hit a single scan
                instead of combining multiple tables.
              </p>
              <p>
                <strong className="text-foreground-muted">Real-time analytics on combined data</strong>{" "}
                — dashboards and feeds that aggregate across tables benefit
                from pre-computed, denormalized structures.
              </p>
            </div>

            <div className="mt-3 space-y-1.5 text-[11px] text-foreground-subtle">
              <span className="block text-[10px] font-semibold text-foreground-muted">
                Examples:
              </span>
              <p>
                User profile with embedded address — avoids a JOIN on every
                page load.
              </p>
              <p>
                Pre-computed feed table — Instagram doesn&apos;t JOIN
                followers + posts on every refresh.
              </p>
              <p>
                Materialized views: controlled denormalization that
                auto-refreshes on a schedule.
              </p>
            </div>

            <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/5 backdrop-blur-sm p-2.5 shadow-[0_0_15px_rgba(245,158,11,0.05)]">
              <p className="text-[11px] text-amber-300/90">
                <strong className="text-amber-400">The rule:</strong> Normalize
                first for correctness. Denormalize selectively for performance.
                Measure before and after.
              </p>
            </div>
          </div>

          {/* Common Mistakes (DBL-085) */}
          <div className="rounded-xl border border-red-500/30 bg-red-500/5 backdrop-blur-sm p-3 shadow-[0_0_15px_rgba(239,68,68,0.05)]">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-red-400">
              Common Mistake
            </span>
            <p className="text-[11px] text-foreground-muted">
              Students often confuse 2NF with 3NF. <strong className="text-foreground">2NF</strong> = no partial
              deps on composite key. <strong className="text-foreground">3NF</strong> = no transitive deps.
              If your key is a single attribute, 2NF is automatically satisfied — focus on transitive dependencies instead.
            </p>
          </div>

          {/* Interview Tip (DBL-100) */}
          <div className="rounded-xl border border-primary/30 bg-primary/5 backdrop-blur-sm p-3 shadow-[0_0_15px_rgba(110,86,207,0.05)]">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-violet-400">
              Interview Tip
            </span>
            <p className="text-[11px] text-foreground-muted">
              Asked everywhere: normalize this schema to 3NF. Be ready to identify
              candidate keys, partial dependencies, and transitive dependencies
              step by step.
            </p>
          </div>

          {/* Used in Production (DBL-084) */}
          <UsedInProductionPanel
            entries={[
              { name: "Every relational database design", description: "Normalization is the foundation of relational schema design. Every production PostgreSQL, MySQL, or Oracle schema starts with normalized tables to ensure data integrity." },
              { name: "Instagram's schema evolution", description: "Instagram started with a normalized schema (users, photos, comments as separate tables). As they scaled, they selectively denormalized their feed table for read performance while keeping core tables normalized." },
            ]}
          />
        </div>
      </div>
    );
  }

  // ── Transaction Step Details ─────────────────────────────────
  if (activeMode === "transaction-isolation") {
    const currentStep = txSteps[txStepIndex] ?? null;
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-sidebar-border px-3 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            Step Details
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2">
          {currentStep ? (
            <>
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  Step {txStepIndex + 1}/{txSteps.length}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                    currentStep.tx === "T1"
                      ? "bg-blue-500/10 text-blue-300"
                      : "bg-purple-500/10 text-purple-300",
                  )}
                >
                  {currentStep.tx}
                </span>
              </div>
              <div className="mb-3 rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm px-2 py-1.5">
                <p className="font-mono text-xs text-foreground">
                  {currentStep.action}
                </p>
              </div>
              <p className="mb-3 text-xs text-foreground-muted">
                {currentStep.description}
              </p>
              {currentStep.anomaly && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/5 backdrop-blur-sm p-3">
                  <div className="mb-1 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
                    <span className="text-xs font-bold text-red-400">
                      Anomaly Detected
                    </span>
                  </div>
                  <p className="text-[11px] text-red-300/80">
                    {currentStep.anomaly === "dirty-read" &&
                      "A dirty read occurs when a transaction reads data written by another uncommitted transaction."}
                    {currentStep.anomaly === "non-repeatable-read" &&
                      "A non-repeatable read occurs when a transaction re-reads data and finds it has been modified by another committed transaction."}
                    {currentStep.anomaly === "phantom-read" &&
                      "A phantom read occurs when a transaction re-executes a range query and finds new rows that were inserted by another committed transaction."}
                  </p>
                </div>
              )}
            </>
          ) : (
            <p className="text-xs text-foreground-subtle">
              Step through the simulation to see details.
            </p>
          )}

          {/* Performance Tradeoff */}
          <div className="border-t border-sidebar-border pt-3 mt-3">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              Performance Tradeoff
            </span>
            <p className="text-[11px] text-foreground-subtle">
              Higher isolation = fewer bugs but slower. READ COMMITTED is 2-5x
              faster than SERIALIZABLE because it holds fewer locks and allows
              more concurrency. Most apps start with READ COMMITTED and only
              escalate when they hit specific anomalies.
            </p>
          </div>

          {/* Real-World Defaults */}
          <div className="border-t border-sidebar-border pt-3 mt-1">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              Real-World Defaults
            </span>
            <div className="space-y-1.5 text-[11px] text-foreground-subtle">
              <p>
                <strong className="text-foreground-muted">PostgreSQL</strong>{" "}
                defaults to READ COMMITTED — fast enough for most workloads,
                prevents dirty reads.
              </p>
              <p>
                <strong className="text-foreground-muted">MySQL InnoDB</strong>{" "}
                defaults to REPEATABLE READ — stricter, prevents non-repeatable
                reads via MVCC snapshots.
              </p>
              <p>
                <strong className="text-foreground-muted">Google Spanner</strong>{" "}
                uses SERIALIZABLE (via TrueTime) — the strongest guarantee, at
                global scale.
              </p>
            </div>
          </div>

          {/* Summary Table */}
          <div className="border-t border-sidebar-border pt-3 mt-1">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              Quick Reference
            </span>
            <div className="overflow-x-auto">
              <table className="w-full text-[10px] text-foreground-subtle">
                <thead>
                  <tr className="border-b border-border/30">
                    <th className="py-1 pr-2 text-left font-semibold text-foreground-muted">Level</th>
                    <th className="py-1 pr-2 text-left font-semibold text-foreground-muted">Prevents</th>
                    <th className="py-1 text-left font-semibold text-foreground-muted">Allows</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/50">
                    <td className="py-1 pr-2 font-mono">Read Uncommitted</td>
                    <td className="py-1 pr-2">Nothing</td>
                    <td className="py-1">Dirty, Non-repeatable, Phantom</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-1 pr-2 font-mono">Read Committed</td>
                    <td className="py-1 pr-2">Dirty reads</td>
                    <td className="py-1">Non-repeatable, Phantom</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-1 pr-2 font-mono">Repeatable Read</td>
                    <td className="py-1 pr-2">Dirty, Non-repeatable</td>
                    <td className="py-1">Phantom</td>
                  </tr>
                  <tr>
                    <td className="py-1 pr-2 font-mono">Serializable</td>
                    <td className="py-1 pr-2">All anomalies</td>
                    <td className="py-1">Nothing (safest, slowest)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Common Mistakes (DBL-085) */}
          <div className="rounded-xl border border-red-500/30 bg-red-500/5 backdrop-blur-sm p-3 shadow-[0_0_15px_rgba(239,68,68,0.05)]">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-red-400">
              Common Mistake
            </span>
            <p className="text-[11px] text-foreground-muted">
              READ COMMITTED doesn{"\u2019"}t prevent all problems. <strong className="text-foreground">Non-repeatable
              reads</strong> can still happen — if T2 commits between T1{"\u2019"}s two reads of the same row,
              T1 sees different values. You need REPEATABLE READ or higher to prevent this.
            </p>
          </div>

          {/* Interview Tip (DBL-100) */}
          <div className="rounded-xl border border-primary/30 bg-primary/5 backdrop-blur-sm p-3 shadow-[0_0_15px_rgba(110,86,207,0.05)]">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-violet-400">
              Interview Tip
            </span>
            <p className="text-[11px] text-foreground-muted">
              Asked at senior level: explain write skew and how to prevent it.
              Write skew occurs when two transactions read the same data, make
              decisions based on it, but write to different rows — row-level locks
              cannot help. Only SERIALIZABLE isolation prevents it.
            </p>
          </div>

          {/* Used in Production (DBL-084) */}
          <UsedInProductionPanel
            entries={[
              { name: "Banking systems", description: "Bank transfers use SERIALIZABLE isolation to prevent double-spending. A $100 transfer must either fully complete or fully rollback — partial state means lost money." },
              { name: "E-commerce checkout", description: "Stripe and Shopify use transaction isolation to prevent overselling inventory. Two concurrent purchases of the last item must be serialized so only one succeeds." },
              { name: "Ride-sharing payments", description: "Uber and Lyft use database transactions to ensure a rider is charged exactly once per trip, even with network retries and concurrent fare calculations." },
            ]}
          />
        </div>
      </div>
    );
  }

  // ── B-Tree Properties ────────────────────────────────────────
  if (activeMode === "btree-index") {
    const currentStep = btreeSteps[btreeStepIndex] as BTreeStep | undefined;
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-sidebar-border px-3 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            B-Tree Details
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
          <div className="rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm p-3">
            <div className="flex items-center gap-2 mb-2">
              <TreePine className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold text-foreground">
                Order {btreeOrder} B-Tree
              </span>
            </div>
            <p className="text-[11px] text-foreground-muted">
              Max keys per node: {btreeOrder - 1}
            </p>
            <p className="text-[11px] text-foreground-muted">
              Max children per node: {btreeOrder}
            </p>
          </div>

          {currentStep && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  Step {btreeStepIndex + 1}/{btreeSteps.length}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                    currentStep.operation === "insert"
                      ? "border border-green-500/30 bg-green-500/10 text-green-400 shadow-[0_0_8px_rgba(34,197,94,0.1)]"
                      : currentStep.operation === "split"
                        ? "border border-amber-500/30 bg-amber-500/10 text-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.1)]"
                        : "border border-blue-500/30 bg-blue-500/10 text-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.1)]",
                  )}
                >
                  {currentStep.operation}
                </span>
              </div>
              <p className="text-xs text-foreground-muted">
                {currentStep.description}
              </p>
              {currentStep.highlightKey !== undefined && (
                <div className="rounded border border-border/30 bg-elevated/50 backdrop-blur-sm px-2 py-1.5">
                  <p className="font-mono text-xs text-foreground">
                    Key: {currentStep.highlightKey}
                  </p>
                </div>
              )}
            </div>
          )}

          {!currentStep && btreeSteps.length === 0 && (
            <p className="text-xs text-foreground-subtle">
              Insert or search for keys to see step details.
            </p>
          )}

          {/* Quick reference */}
          <div className="border-t border-sidebar-border pt-3">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              How It Works
            </span>
            <div className="space-y-1.5 text-[11px] text-foreground-subtle">
              <p>
                <strong className="text-foreground-muted">Insert:</strong> Find
                the correct leaf by comparing keys at each level — like navigating
                a decision tree. Add the key in sorted position. If the leaf
                overflows, split it and promote the median key to maintain balance.
              </p>
              <p>
                <strong className="text-foreground-muted">Search:</strong> Start
                at the root. At each node, compare your key against the stored
                keys to decide which child to follow. Each level eliminates a
                large fraction of possibilities — that{"\u2019"}s why search is O(log n).
              </p>
              <p>
                <strong className="text-foreground-muted">Split:</strong> When a
                node has too many keys (more than order-1), it splits into two
                halves. The middle key moves up to the parent, keeping the tree
                balanced. This is what makes B-Trees self-balancing.
              </p>
            </div>
          </div>

          {/* Complexity */}
          <div className="border-t border-sidebar-border pt-3">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              Complexity
            </span>
            <div className="space-y-1.5 text-[11px] text-foreground-subtle">
              <p>
                <strong className="text-foreground-muted">Search: O(log n)</strong>{" "}
                — a tree with 1 billion keys has only ~10 levels. That{"\u2019"}s 10
                comparisons instead of 1 billion.
              </p>
              <p>
                <strong className="text-foreground-muted">Insert: O(log n)</strong>{" "}
                — same traversal plus possible splits.
              </p>
            </div>
          </div>

          {/* Real-world */}
          <div className="border-t border-sidebar-border pt-3">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              Real-World Usage
            </span>
            <p className="text-[11px] text-foreground-subtle">
              PostgreSQL creates a B-Tree for every{" "}
              <code className="rounded bg-elevated/50 backdrop-blur-sm px-1 py-0.5 text-[10px] font-mono text-foreground-muted">
                CREATE INDEX
              </code>{" "}
              statement. MySQL InnoDB uses B+ Trees (a variant) for both primary
              and secondary indexes.
            </p>
          </div>

          {/* Pseudocode */}
          <PseudocodePanel
            blocks={[BTREE_INSERT_PSEUDOCODE, BTREE_SEARCH_PSEUDOCODE]}
            highlightLine={getBtreeHighlightLine(btreeSteps[btreeStepIndex] as BTreeStep | undefined)}
            activeBlockIndex={
              btreeSteps[btreeStepIndex]?.operation === "search" ? 1 : 0
            }
          />

          {/* Common Mistakes (DBL-085) */}
          <div className="rounded-xl border border-red-500/30 bg-red-500/5 backdrop-blur-sm p-3 shadow-[0_0_15px_rgba(239,68,68,0.05)]">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-red-400">
              Common Mistake
            </span>
            <p className="text-[11px] text-foreground-muted">
              Don{"\u2019"}t confuse <strong className="text-foreground">B-Tree</strong> with{" "}
              <strong className="text-foreground">Binary Search Tree</strong>. B-Trees have{" "}
              <strong className="text-foreground">MULTIPLE keys per node</strong> and are
              optimized for disk I/O (wide and shallow), while BSTs have exactly one
              key per node and can become unbalanced (tall and thin).
            </p>
          </div>

          {/* Interview Tip (DBL-100) */}
          <div className="rounded-xl border border-primary/30 bg-primary/5 backdrop-blur-sm p-3 shadow-[0_0_15px_rgba(110,86,207,0.05)]">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-violet-400">
              Interview Tip
            </span>
            <p className="text-[11px] text-foreground-muted">
              Google asks: explain how range queries work with B+ Tree leaf chains.
              The key insight is that leaf nodes are connected via a linked list,
              so after finding the start key you just follow pointers — no need to
              re-traverse the tree.
            </p>
          </div>

          {/* Teaching vs Production (DBL-128) */}
          <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 backdrop-blur-sm shadow-[0_0_15px_rgba(6,182,212,0.05)] p-3">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-cyan-400">
              Teaching vs Production
            </span>
            <p className="text-[11px] text-foreground-muted">
              Our version is simplified. PostgreSQL adds: page-level locking,
              WAL integration, VACUUM cleanup, concurrent access via buffer
              manager, and right-link pointers for crash-safe splits.
            </p>
          </div>

          {/* Used in Production (DBL-084) */}
          <UsedInProductionPanel
            entries={[
              { name: "PostgreSQL", description: "Every CREATE INDEX statement creates a B-Tree by default. PostgreSQL's pg_index catalog tracks all B-Tree indexes in the system." },
              { name: "MySQL InnoDB", description: "Uses B+ Trees (a variant) for both primary (clustered) and secondary indexes. The primary key IS the table — data is stored in leaf nodes." },
              { name: "SQLite", description: "Uses B-Trees for all table storage and indexes. Every SQLite database file is essentially a collection of B-Trees on disk." },
            ]}
          />
        </div>
      </div>
    );
  }

  // ── B+ Tree Properties ───────────────────────────────────────
  if (activeMode === "bplus-tree") {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-sidebar-border px-3 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            B+ Tree Details
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
          <div className="rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm p-3">
            <div className="flex items-center gap-2 mb-2">
              <TreePine className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-semibold text-foreground">
                B+ Tree Index
              </span>
            </div>
            <p className="text-[11px] text-foreground-muted">
              Unlike B-Trees, B+ Trees store ALL keys in leaf nodes connected by
              a linked list. This makes range queries efficient — just follow the
              leaf chain.
            </p>
          </div>

          {/* B-Tree vs B+ Tree comparison */}
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 backdrop-blur-sm p-3 shadow-[0_0_15px_rgba(245,158,11,0.05)]">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-amber-400">
              B-Tree vs B+ Tree
            </span>
            <div className="space-y-1.5 text-[11px] text-foreground-muted">
              <p>
                <strong className="text-foreground">B-Trees</strong> store keys
                in all nodes. <strong className="text-foreground">B+ Trees</strong>{" "}
                store keys ONLY in leaves with internal nodes as guides.
              </p>
              <p>
                Real databases (PostgreSQL, MySQL InnoDB) use B+ Trees because the
                leaf linked list enables efficient range scans.
              </p>
            </div>
          </div>

          {/* How it works */}
          <div className="border-t border-sidebar-border pt-3">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              How It Works
            </span>
            <div className="space-y-1.5 text-[11px] text-foreground-subtle">
              <p>
                <strong className="text-foreground-muted">Insert:</strong> Find the
                correct leaf via internal guide keys. Add the key in sorted order.
                If the leaf overflows, split and promote a copy of the middle key upward.
              </p>
              <p>
                <strong className="text-foreground-muted">Search:</strong> Descend
                through internal nodes (which only guide — they do not store data)
                until you reach the leaf containing the key.
              </p>
              <p>
                <strong className="text-foreground-muted">Range Query:</strong> Find
                the starting leaf, then follow the linked-list pointers to collect
                all keys in the range. No need to re-traverse the tree.
              </p>
              <p>
                <strong className="text-foreground-muted">Delete:</strong> Remove
                the key from its leaf. If the leaf underflows, borrow from a sibling
                or merge. Internal guide keys may need updating.
              </p>
              <p>
                <strong className="text-foreground-muted">Leaf Chain:</strong> The
                green dashed arrows in the visualization show the linked list
                connecting leaf nodes left-to-right.
              </p>
            </div>
          </div>

          {/* Used in Production (DBL-084) */}
          <UsedInProductionPanel
            entries={[
              { name: "PostgreSQL B-tree indexes", description: "PostgreSQL's default index type is actually a B+ Tree variant — all data pointers live in leaf nodes connected by sibling pointers for efficient range scans." },
              { name: "MySQL InnoDB clustered index", description: "InnoDB stores the entire table as a B+ Tree keyed by the primary key. Secondary indexes point back to the primary key, not to row locations." },
            ]}
          />
        </div>
      </div>
    );
  }

  // ── Hash Index Properties ─────────────────────────────────────
  if (activeMode === "hash-index") {
    const currentStep = hashSteps[hashStepIndex] as HashIndexStep | undefined;
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-sidebar-border px-3 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            Hash Index Details
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
          <div className="rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm p-3">
            <div className="flex items-center gap-2 mb-2">
              <Hash className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold text-foreground">
                Hash Table
              </span>
            </div>
            <p className="text-[11px] text-foreground-muted">
              Buckets: {hashState.buckets.length}
            </p>
            <p className="text-[11px] text-foreground-muted">
              Entries: {hashState.size}
            </p>
            <p className="text-[11px] text-foreground-muted">
              Load factor: {hashState.loadFactor.toFixed(2)}
            </p>
          </div>

          {currentStep && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  Step {hashStepIndex + 1}/{hashSteps.length}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                    currentStep.operation === "insert"
                      ? "border border-green-500/30 bg-green-500/10 text-green-400 shadow-[0_0_8px_rgba(34,197,94,0.1)]"
                      : currentStep.operation === "hash"
                        ? "border border-violet-500/30 bg-violet-500/10 text-violet-400 shadow-[0_0_8px_rgba(139,92,246,0.1)]"
                        : currentStep.operation === "collision"
                          ? "border border-amber-500/30 bg-amber-500/10 text-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.1)]"
                          : currentStep.operation === "resize"
                            ? "bg-rose-500/10 text-rose-400"
                            : currentStep.operation === "delete"
                              ? "border border-red-500/30 bg-red-500/10 text-red-400 shadow-[0_0_8px_rgba(239,68,68,0.1)]"
                              : "border border-blue-500/30 bg-blue-500/10 text-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.1)]",
                  )}
                >
                  {currentStep.operation}
                </span>
              </div>
              <p className="text-xs text-foreground-muted">
                {currentStep.description}
              </p>
              {currentStep.highlightKey !== undefined && (
                <div className="rounded border border-border/30 bg-elevated/50 backdrop-blur-sm px-2 py-1.5">
                  <p className="font-mono text-xs text-foreground">
                    Key: {currentStep.highlightKey}
                  </p>
                </div>
              )}
            </div>
          )}

          {!currentStep && hashSteps.length === 0 && (
            <p className="text-xs text-foreground-subtle">
              Insert, search, or delete keys to see step details.
            </p>
          )}

          {/* How It Works — filing cabinet analogy */}
          <div className="border-t border-sidebar-border pt-3">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              How It Works
            </span>
            <p className="mb-2 text-[11px] text-foreground-subtle">
              Think of a hash table as a filing cabinet with labeled drawers.
              The hash function is the label system — it tells you exactly
              which drawer to open.
            </p>
            <div className="space-y-1.5 text-[11px] text-foreground-subtle">
              <p>
                <strong className="text-foreground-muted">Hash:</strong> The
                hash function converts any key into a drawer number (bucket
                index). A good function spreads keys evenly across drawers.
              </p>
              <p>
                <strong className="text-foreground-muted">Insert:</strong> Compute
                the drawer number, place the entry. If the drawer is full,
                create an overflow chain — like a stack of files in one drawer.
              </p>
              <p>
                <strong className="text-foreground-muted">Collision:</strong>{" "}
                Multiple keys mapping to the same drawer. Handled by chaining
                entries together. The fewer collisions, the faster your lookups.
              </p>
              <p>
                <strong className="text-foreground-muted">Resize:</strong> When
                the cabinet is 75% full, double the drawers and re-file
                everything. This maintains O(1) average lookup by keeping chains
                short.
              </p>
            </div>
          </div>

          {/* Complexity */}
          <div className="border-t border-sidebar-border pt-3">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              Complexity
            </span>
            <p className="text-[11px] text-foreground-subtle">
              <strong className="text-foreground-muted">O(1) average</strong> —
              but if everything lands in one drawer (worst case), it degrades to
              O(n). That{"\u2019"}s why good hash functions matter: they spread keys
              uniformly so no single bucket becomes a bottleneck.
            </p>
          </div>

          {/* Real-World */}
          <div className="border-t border-sidebar-border pt-3">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              Real-World
            </span>
            <p className="text-[11px] text-foreground-subtle">
              PostgreSQL hash indexes are used for equality-only lookups where
              B-Trees would be overkill. Python{"\u2019"}s{" "}
              <code className="rounded bg-elevated/50 backdrop-blur-sm px-1 py-0.5 text-[10px] font-mono text-foreground-muted">
                dict
              </code>{" "}
              and Java{"\u2019"}s{" "}
              <code className="rounded bg-elevated/50 backdrop-blur-sm px-1 py-0.5 text-[10px] font-mono text-foreground-muted">
                HashMap
              </code>{" "}
              use hash tables internally — every time you look up a key in a
              dictionary, you{"\u2019"}re using this exact data structure.
            </p>
          </div>

          {/* Hash vs B-Tree comparison */}
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 backdrop-blur-sm p-3 shadow-[0_0_15px_rgba(245,158,11,0.05)] mt-3">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-amber-400">
              Hash vs B-Tree
            </span>
            <div className="space-y-1.5 text-[11px] text-foreground-muted">
              <p>
                Use <strong className="text-foreground">Hash</strong> for equality
                lookups:{" "}
                <code className="rounded bg-elevated/50 backdrop-blur-sm px-1 py-0.5 text-[10px] font-mono">
                  WHERE email = {"\u0027"}alice@example.com{"\u0027"}
                </code>
              </p>
              <p>
                Use <strong className="text-foreground">B-Tree</strong> for ranges:{" "}
                <code className="rounded bg-elevated/50 backdrop-blur-sm px-1 py-0.5 text-[10px] font-mono">
                  WHERE age &gt; 25
                </code>
              </p>
              <p className="text-foreground-subtle">
                Hash indexes cannot support ORDER BY, range scans, or prefix
                matching. If you need any of those, use a B-Tree.
              </p>
            </div>
          </div>

          {/* Pseudocode */}
          <PseudocodePanel
            blocks={[HASH_INSERT_PSEUDOCODE, HASH_SEARCH_PSEUDOCODE]}
            highlightLine={getHashHighlightLine(hashSteps[hashStepIndex] as HashIndexStep | undefined)}
            activeBlockIndex={
              (hashSteps[hashStepIndex] as HashIndexStep | undefined)?.operation === "search"
                ? 1 : 0
            }
          />

          {/* Interview Tip (DBL-100) */}
          <div className="rounded-xl border border-primary/30 bg-primary/5 backdrop-blur-sm p-3 shadow-[0_0_15px_rgba(110,86,207,0.05)]">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-violet-400">
              Interview Tip
            </span>
            <p className="text-[11px] text-foreground-muted">
              Amazon asks: when would you use a hash index vs B-tree?
              Answer: hash for exact equality lookups (O(1) vs O(log n)),
              B-tree for ranges, sorting, and prefix matching. Most systems
              default to B-tree because it handles both.
            </p>
          </div>

          {/* Teaching vs Production (DBL-128) */}
          <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 backdrop-blur-sm shadow-[0_0_15px_rgba(6,182,212,0.05)] p-3">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-cyan-400">
              Teaching vs Production
            </span>
            <p className="text-[11px] text-foreground-muted">
              Our version uses separate chaining. Python dict uses open addressing
              with random probing. PostgreSQL uses linear hashing with overflow
              pages and WAL-logged splits for crash safety.
            </p>
          </div>

          {/* Used in Production (DBL-084) */}
          <UsedInProductionPanel
            entries={[
              { name: "PostgreSQL hash indexes", description: "PostgreSQL supports hash indexes for equality-only lookups (WHERE key = value). Rebuilt in v10 to be crash-safe via WAL logging." },
              { name: "Python dict / Java HashMap", description: "Every Python dictionary and Java HashMap is a hash table. When you write d['key'] = value, the runtime computes hash('key') % table_size." },
              { name: "Redis", description: "Redis uses hash tables as its primary data structure for key-value storage. It performs incremental rehashing to avoid latency spikes during resizes." },
            ]}
          />
        </div>
      </div>
    );
  }

  // ── Query Plan Properties ─────────────────────────────────────
  if (activeMode === "query-plans") {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-sidebar-border px-3 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            Plan Details
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
          {queryPlan ? (
            <PlanNodeDetails node={queryPlan} />
          ) : (
            <p className="text-xs text-foreground-subtle">
              Analyze a query to see plan details.
            </p>
          )}

          {/* Reference */}
          <div className="border-t border-sidebar-border pt-3">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              Node Types
            </span>
            <div className="space-y-1.5 text-[11px] text-foreground-subtle">
              <p>
                <strong className="text-foreground-muted">SeqScan:</strong>{" "}
                Reading every row in the table. Like searching every house on
                every street for a person. Works, but very slow for large tables.
              </p>
              <p>
                <strong className="text-foreground-muted">IndexScan:</strong>{" "}
                Using an index to jump directly to matching rows. Like looking
                up a name in the phone book instead of calling every number.
              </p>
              <p>
                <strong className="text-foreground-muted">HashJoin:</strong>{" "}
                Building a hash table from one table, then probing it with rows
                from the other. Fast for large joins but needs memory.
              </p>
              <p>
                <strong className="text-foreground-muted">Sort:</strong>{" "}
                Ordering results. Needed for ORDER BY, but also used internally
                for Sort-Merge joins.
              </p>
              <p>
                <strong className="text-foreground-muted">Aggregate:</strong>{" "}
                Computing GROUP BY / COUNT / SUM / AVG. Processes groups of rows
                into summary values.
              </p>
            </div>
          </div>
          {/* Real-world */}
          <div className="border-t border-sidebar-border pt-3">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              Real-World
            </span>
            <p className="text-[11px] text-foreground-subtle">
              When you run EXPLAIN ANALYZE in PostgreSQL, you see this exact tree
              structure. Learning to read query plans is the #1 skill for
              database performance tuning.
            </p>
          </div>

          {/* Covering Indexes (DBL-094) */}
          <div className="border-t border-sidebar-border pt-3">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              Covering Indexes
            </span>
            <p className="text-[11px] text-foreground-subtle">
              A covering index includes ALL columns needed by the query.
              The database reads ONLY the index — never touches the table.
            </p>
            <div className="mt-2 rounded-xl border border-border/30 bg-[#0d1117] p-2.5 font-mono text-[10px] leading-relaxed text-emerald-300/90">
              <p>CREATE INDEX idx ON users(email) INCLUDE (name)</p>
              <p className="mt-1 text-foreground-subtle">-- Makes this an index-only scan:</p>
              <p>SELECT name FROM users WHERE email={"\u0027"}X{"\u0027"}</p>
            </div>
            <p className="mt-2 text-[11px] text-foreground-subtle">
              Without INCLUDE, the database finds the row via the index but
              must then go to the table (heap) to fetch the{" "}
              <code className="rounded bg-elevated/50 backdrop-blur-sm px-1 py-0.5 text-[10px]">name</code>{" "}
              column. With a covering index, the entire query is satisfied from
              the index alone — significantly faster for read-heavy workloads.
            </p>
          </div>

          {/* Interview Tip (DBL-100) */}
          <div className="rounded-xl border border-primary/30 bg-primary/5 backdrop-blur-sm p-3 shadow-[0_0_15px_rgba(110,86,207,0.05)]">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-violet-400">
              Interview Tip
            </span>
            <p className="text-[11px] text-foreground-muted">
              Meta asks: optimize this slow query using EXPLAIN. The key
              pattern: look for SeqScan on large tables, missing indexes,
              and unnecessary sorts. Suggest covering indexes when the query
              only needs a few columns.
            </p>
          </div>

          {/* Used in Production (DBL-084) */}
          <UsedInProductionPanel
            entries={[
              { name: "PostgreSQL EXPLAIN", description: "PostgreSQL's query planner generates execution plans with cost estimates, row counts, and timing. EXPLAIN ANALYZE actually runs the query and shows real vs estimated metrics." },
              { name: "MySQL EXPLAIN", description: "MySQL's EXPLAIN shows the optimizer's chosen access paths, join orders, and index usage. The FORMAT=TREE option gives a tree view similar to PostgreSQL." },
              { name: "Oracle execution plans", description: "Oracle's cost-based optimizer (CBO) generates execution plans visible via EXPLAIN PLAN or V$SQL_PLAN. It uses table statistics to choose between nested loops, hash joins, and sort-merge joins." },
            ]}
          />
        </div>
      </div>
    );
  }

  // ── LSM-Tree Properties ─────────────────────────────────────
  if (activeMode === "lsm-tree") {
    const currentStep = lsmSteps[lsmStepIndex] as LSMVizStep | undefined;
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-sidebar-border px-3 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            LSM-Tree Details
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
          <div className="rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm p-3">
            <div className="flex items-center gap-2 mb-2">
              <Layers className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold text-foreground">
                LSM-Tree State
              </span>
            </div>
            <p className="text-[11px] text-foreground-muted">
              WAL: {lsmState.wal.length} entries
            </p>
            <p className="text-[11px] text-foreground-muted">
              Memtable: {lsmState.memtable.length} entries
            </p>
            <p className="text-[11px] text-foreground-muted">
              Immutable: {lsmState.immutableMemtable ? lsmState.immutableMemtable.length + " entries" : "none"}
            </p>
            {lsmState.levels.map((level) => (
              <p key={level.level} className="text-[11px] text-foreground-muted">
                L{level.level}: {level.sstables.length} SSTable(s)
                {level.sstables.length > 0 && (
                  <span className="text-foreground-subtle">
                    {" "}({level.sstables.reduce((s, t) => s + t.keys.length, 0)} keys)
                  </span>
                )}
              </p>
            ))}
            <p className="text-[11px] text-foreground-muted mt-1">
              Total writes: {lsmState.writeCount}
            </p>
            <p className="text-[11px] text-foreground-muted">
              Bloom filter: {lsmState.bloomEnabled ? "enabled" : "disabled"}
            </p>
          </div>

          {currentStep && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  Step {lsmStepIndex + 1}/{lsmSteps.length}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                    currentStep.operation === "write"
                      ? "border border-green-500/30 bg-green-500/10 text-green-400 shadow-[0_0_8px_rgba(34,197,94,0.1)]"
                      : currentStep.operation === "flush"
                        ? "border border-amber-500/30 bg-amber-500/10 text-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.1)]"
                        : currentStep.operation === "compact"
                          ? "border border-violet-500/30 bg-violet-500/10 text-violet-400 shadow-[0_0_8px_rgba(139,92,246,0.1)]"
                          : currentStep.operation === "checkpoint"
                            ? "border border-orange-500/30 bg-orange-500/10 text-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.1)]"
                            : "border border-blue-500/30 bg-blue-500/10 text-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.1)]",
                  )}
                >
                  {currentStep.operation}
                </span>
              </div>
              <p className="text-xs text-foreground-muted">
                {currentStep.description}
              </p>
            </div>
          )}

          {!currentStep && lsmSteps.length === 0 && (
            <p className="text-xs text-foreground-subtle">
              Write keys to populate the LSM-Tree and see step details.
            </p>
          )}

          {/* Quick reference */}
          <div className="border-t border-sidebar-border pt-3">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              How It Works
            </span>
            <div className="space-y-1.5 text-[11px] text-foreground-subtle">
              <p>
                <strong className="text-foreground-muted">WAL (Write-Ahead Log):</strong>{" "}
                Every write goes here FIRST — even before the memtable. This
                guarantees durability: if the system crashes, the WAL replays
                uncommitted writes on recovery. The WAL is append-only, making
                it extremely fast.
              </p>
              <p>
                <strong className="text-foreground-muted">Write:</strong> After
                the WAL, insert into the sorted, in-memory memtable — like
                writing on a notepad on your desk. Sequential memory writes are
                much faster than random disk I/O. O(log n) per entry.
              </p>
              <p>
                <strong className="text-foreground-muted">Flush:</strong> When
                your desk is full (memtable reaches capacity), freeze everything
                and file it away as a sorted SSTable on disk. The new memtable
                starts empty. WAL entries for flushed data are discarded.
              </p>
              <p>
                <strong className="text-foreground-muted">Compact:</strong>{" "}
                Too many filed drawers slows down searching. Compaction
                merge-sorts SSTables into fewer, larger files — reducing the
                number of places a read must check.
              </p>
              <p>
                <strong className="text-foreground-muted">Read:</strong> Check
                your desk (memtable) first, then the most recent filing (L0,
                newest first), then older filings (L1, L2). This top-to-bottom
                search is why writes are fast but reads can be slower.
              </p>
              <p>
                <strong className="text-foreground-muted">Bloom Filter:</strong>{" "}
                A probabilistic data structure that can tell you &ldquo;definitely
                NOT here&rdquo; or &ldquo;maybe here&rdquo; in O(1). Each SSTable has
                a bloom filter. When reading, we check the bloom first — if it
                says no, we skip the entire SSTable without reading from disk.
              </p>
              <p>
                <strong className="text-foreground-muted">Checkpoint:</strong>{" "}
                Explicitly truncates the WAL once all data has been safely
                flushed to SSTables. This reclaims disk space and speeds up
                crash recovery (less log to replay).
              </p>
            </div>
          </div>
          {/* Real-world */}
          <div className="border-t border-sidebar-border pt-3">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              Real-World
            </span>
            <p className="text-[11px] text-foreground-subtle">
              RocksDB (used by CockroachDB, TiKV), Cassandra, and LevelDB all
              use LSM-Trees. That&apos;s why they&apos;re called
              &ldquo;write-optimized&rdquo; databases. Every production LSM-Tree
              uses a WAL for crash recovery and bloom filters to minimize read
              amplification.
            </p>
          </div>

          {/* Pseudocode */}
          <PseudocodePanel
            blocks={[LSM_WRITE_PSEUDOCODE, LSM_READ_PSEUDOCODE]}
            highlightLine={getLsmHighlightLine(lsmSteps[lsmStepIndex] as LSMVizStep | undefined)}
            activeBlockIndex={
              (lsmSteps[lsmStepIndex] as LSMVizStep | undefined)?.operation === "read" ? 1 : 0
            }
          />

          {/* Interview Tip (DBL-100) */}
          <div className="rounded-xl border border-primary/30 bg-primary/5 backdrop-blur-sm p-3 shadow-[0_0_15px_rgba(110,86,207,0.05)]">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-violet-400">
              Interview Tip
            </span>
            <p className="text-[11px] text-foreground-muted">
              Storage infra teams ask: compare write amplification of LSM vs B-Tree.
              LSM has higher write amplification (data rewritten during compaction)
              but faster sequential writes. B-Tree has lower write amplification but
              requires random I/O for updates.
            </p>
          </div>

          {/* Teaching vs Production (DBL-128) */}
          <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 backdrop-blur-sm shadow-[0_0_15px_rgba(6,182,212,0.05)] p-3">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-cyan-400">
              Teaching vs Production
            </span>
            <p className="text-[11px] text-foreground-muted">
              Our version shows the core pipeline. RocksDB adds: WAL with group
              commit, bloom filters per SSTable block, block cache (LRU), snappy/zstd
              compression, rate limiting for compaction I/O, and column families
              for logical data separation.
            </p>
          </div>

          {/* Used in Production (DBL-084) */}
          <UsedInProductionPanel
            entries={[
              { name: "RocksDB (CockroachDB, TiKV)", description: "RocksDB is the most widely-used LSM-Tree engine. CockroachDB and TiKV use it as their storage layer for write-heavy distributed workloads." },
              { name: "Apache Cassandra", description: "Cassandra's storage engine is an LSM-Tree. It writes to a memtable, flushes to SSTables, and runs compaction strategies (SizeTiered, Leveled) to manage read amplification." },
              { name: "LevelDB / Google BigTable", description: "LevelDB (created by Google) pioneered the leveled compaction strategy. BigTable, Google's internal database, uses the same LSM-Tree architecture at massive scale." },
            ]}
          />
        </div>
      </div>
    );
  }

  // ── ACID Properties Panel ────────────────────────────────────
  if (activeMode === "acid") {
    const currentStep = acidSteps[acidStepIndex] ?? null;
    const propertyDescriptions: Record<ACIDProperty, string> = {
      atomicity:
        "All operations in a transaction succeed, or none do. If any part fails, the entire transaction is rolled back — no partial updates, no data corruption.",
      consistency:
        "Every transaction moves the database from one valid state to another. Constraints, triggers, and rules are always enforced. Invalid data is rejected.",
      isolation:
        "Concurrent transactions don't interfere with each other. Each transaction sees a consistent snapshot of the database, as if it were the only one running.",
      durability:
        "Once a transaction is committed, the data is permanent — even if the server crashes, loses power, or the disk fails. This is achieved through Write-Ahead Logging (WAL).",
    };

    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-sidebar-border px-3 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            ACID Details
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
          <div className="rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm p-3">
            <h3 className="mb-1 text-sm font-bold capitalize text-foreground">
              {acidProperty}
            </h3>
            <p className="text-[11px] text-foreground-muted">
              {propertyDescriptions[acidProperty]}
            </p>
          </div>

          {currentStep && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  Step {acidStepIndex + 1}/{acidSteps.length}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                    currentStep.status === "crash"
                      ? "border border-red-500/30 bg-red-500/10 text-red-400 shadow-[0_0_8px_rgba(239,68,68,0.1)]"
                      : currentStep.status === "failure"
                        ? "border border-red-500/30 bg-red-500/10 text-red-400 shadow-[0_0_8px_rgba(239,68,68,0.1)]"
                        : currentStep.status === "success"
                          ? "border border-green-500/30 bg-green-500/10 text-green-400 shadow-[0_0_8px_rgba(34,197,94,0.1)]"
                          : "border border-blue-500/30 bg-blue-500/10 text-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.1)]",
                  )}
                >
                  {currentStep.status}
                </span>
              </div>
              <p className="text-xs text-foreground-muted">
                {currentStep.description}
              </p>
            </div>
          )}

          {acidProperty === "isolation" && (
            <button
              onClick={() => onSelectMode("transaction-isolation")}
              className="w-full rounded-xl border border-violet-500/30 bg-violet-500/5 p-3 text-left transition-colors hover:bg-violet-500/10"
            >
              <span className="text-xs font-bold text-violet-400">
                See isolation levels in detail &rarr;
              </span>
              <p className="mt-0.5 text-[10px] text-foreground-subtle">
                Step through all four isolation levels and their anomalies.
              </p>
            </button>
          )}

          {/* Quick reference */}
          <div className="border-t border-sidebar-border pt-3">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              Interview Tip
            </span>
            <div className="space-y-1.5 text-[11px] text-foreground-subtle">
              <p>
                ACID is asked in &gt;50% of database interviews. Be ready to explain
                each property with a <strong className="text-foreground-muted">real-world example</strong>:
              </p>
              <p>
                <strong className="text-foreground-muted">A:</strong> Bank transfer (all-or-nothing)
              </p>
              <p>
                <strong className="text-foreground-muted">C:</strong> CHECK constraints, foreign keys
              </p>
              <p>
                <strong className="text-foreground-muted">I:</strong> Two users booking the same seat
              </p>
              <p>
                <strong className="text-foreground-muted">D:</strong> WAL + fsync = survives crash
              </p>
            </div>
          </div>

          {/* Used in Production (DBL-084) */}
          <UsedInProductionPanel
            entries={[
              { name: "Banking systems", description: "Atomicity ensures bank transfers are all-or-nothing. If debiting account A succeeds but crediting account B fails, the entire transaction rolls back — no money disappears." },
              { name: "E-commerce checkout", description: "Consistency constraints prevent selling more inventory than exists. CHECK constraints and foreign keys enforce business rules at the database level, not just the application." },
              { name: "PostgreSQL WAL", description: "Durability is achieved through Write-Ahead Logging. PostgreSQL writes every change to the WAL before modifying data pages, ensuring crash recovery can replay committed transactions." },
            ]}
          />
        </div>
      </div>
    );
  }

  // ── CAP Theorem Properties Panel ─────────────────────────────
  if (activeMode === "cap-theorem") {
    const currentStep = capSteps[capStepIndex] ?? null;
    const dbInfo = capSelectedDb
      ? CAP_DATABASES.find((d) => d.id === capSelectedDb) ?? null
      : null;

    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-sidebar-border px-3 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            CAP Theorem Details
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
          {/* Current simulation info */}
          <div className="rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm p-3">
            <h3 className="mb-1 text-sm font-bold text-foreground">
              {capSimType === "cp" ? "CP System" : "AP System"} Simulation
            </h3>
            <p className="text-[11px] text-foreground-muted">
              {capSimType === "cp"
                ? "A CP system prioritizes Consistency over Availability. During a network partition, it will reject writes rather than risk inconsistency."
                : "An AP system prioritizes Availability over Consistency. During a network partition, it accepts writes but nodes may temporarily diverge."}
            </p>
          </div>

          {currentStep && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  Step {capStepIndex + 1}/{capSteps.length}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                    currentStep.status === "partition"
                      ? "border border-red-500/30 bg-red-500/10 text-red-400 shadow-[0_0_8px_rgba(239,68,68,0.1)]"
                      : currentStep.status === "cp-response"
                        ? "border border-blue-500/30 bg-blue-500/10 text-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.1)]"
                        : currentStep.status === "ap-response"
                          ? "border border-green-500/30 bg-green-500/10 text-green-400 shadow-[0_0_8px_rgba(34,197,94,0.1)]"
                          : currentStep.status === "resolution"
                            ? "border border-violet-500/30 bg-violet-500/10 text-violet-400 shadow-[0_0_8px_rgba(139,92,246,0.1)]"
                            : "bg-neutral-800/30 text-foreground-muted",
                  )}
                >
                  {currentStep.status}
                </span>
              </div>
              <p className="text-xs text-foreground-muted">
                {currentStep.description}
              </p>
            </div>
          )}

          {/* Selected database info */}
          {dbInfo && (
            <div
              className={cn(
                "rounded-xl border p-3",
                dbInfo.category === "CP"
                  ? "border-blue-500/30 bg-blue-500/5"
                  : "border-emerald-500/30 bg-emerald-500/5 backdrop-blur-sm",
              )}
            >
              <h4 className="mb-1 text-xs font-bold text-foreground">
                {dbInfo.name}{" "}
                <span
                  className={cn(
                    "font-mono text-[10px]",
                    dbInfo.category === "CP" ? "text-blue-400" : "text-green-400",
                  )}
                >
                  ({dbInfo.category})
                </span>
              </h4>
              <p className="text-[11px] text-foreground-muted">{dbInfo.tradeoff}</p>
              {dbInfo.configurable && (
                <p className="mt-1 text-[10px] italic text-foreground-subtle">
                  {dbInfo.configurable}
                </p>
              )}
            </div>
          )}

          {/* Quick reference */}
          <div className="border-t border-sidebar-border pt-3">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              Key Insight
            </span>
            <div className="space-y-1.5 text-[11px] text-foreground-subtle">
              <p>
                In a distributed system, <strong className="text-foreground-muted">network partitions will happen</strong>.
                So the real choice is between <strong className="text-blue-400">CP</strong> (consistency during partition)
                and <strong className="text-green-400">AP</strong> (availability during partition).
              </p>
              <p>
                <strong className="text-foreground-muted">CP:</strong> PostgreSQL, MongoDB (default), HBase, Redis Cluster
              </p>
              <p>
                <strong className="text-foreground-muted">AP:</strong> Cassandra, DynamoDB (default), CouchDB, Riak
              </p>
              <p className="mt-1 italic">
                Many modern databases are configurable (e.g., DynamoDB supports both
                eventually consistent and strongly consistent reads).
              </p>
            </div>
          </div>

          {/* Used in Production (DBL-084) */}
          <UsedInProductionPanel
            entries={[
              { name: "DynamoDB (configurable)", description: "DynamoDB lets you choose per-read: eventually consistent (AP, faster, cheaper) or strongly consistent (CP, latest data). Default is eventually consistent." },
              { name: "Cassandra (tunable)", description: "Cassandra's consistency level is tunable per query (ONE, QUORUM, ALL). Writing at QUORUM and reading at QUORUM gives strong consistency; lower levels trade consistency for speed." },
              { name: "Google Spanner (strong)", description: "Spanner achieves strong consistency at global scale using TrueTime (atomic clocks + GPS). It's a CP system that minimizes availability loss through extremely precise clock synchronization." },
            ]}
          />
        </div>
      </div>
    );
  }

  // ── MVCC Properties ──────────────────────────────────────────
  if (activeMode === "mvcc") {
    const currentStep = mvccSteps[mvccStepIndex] ?? null;

    const operationBadge: Record<string, string> = {
      begin: "border border-blue-500/30 bg-blue-500/10 text-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.1)]",
      read: "bg-emerald-500/10 text-emerald-400",
      write: "border border-amber-500/30 bg-amber-500/10 text-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.1)]",
      commit: "border border-green-500/30 bg-green-500/10 text-green-400 shadow-[0_0_8px_rgba(34,197,94,0.1)]",
      abort: "border border-red-500/30 bg-red-500/10 text-red-400 shadow-[0_0_8px_rgba(239,68,68,0.1)]",
      snapshot: "border border-violet-500/30 bg-violet-500/10 text-violet-400 shadow-[0_0_8px_rgba(139,92,246,0.1)]",
    };

    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-sidebar-border px-3 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            MVCC Details
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
          {/* Concept explanation */}
          <div className="rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm p-3">
            <h3 className="mb-1 text-sm font-bold text-foreground">
              Multi-Version Concurrency Control
            </h3>
            <p className="text-[11px] text-foreground-muted">
              Instead of locking rows, MVCC keeps multiple versions of each row.
              Each transaction sees a consistent snapshot — as if the database was
              frozen at the moment the transaction began. Writers never block readers,
              and readers never block writers.
            </p>
          </div>

          {/* Current step info */}
          {currentStep && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  Step {mvccStepIndex + 1}/{mvccSteps.length}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                    operationBadge[currentStep.operation] ?? "bg-neutral-800/30 text-foreground-muted",
                  )}
                >
                  {currentStep.operation}
                </span>
              </div>
              <p className="text-xs text-foreground-muted">
                {currentStep.description}
              </p>
            </div>
          )}

          {/* MVCC vs Locking */}
          <div className="border-t border-sidebar-border pt-3">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              MVCC vs Locking
            </span>
            <div className="space-y-2">
              <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-2.5">
                <span className="block text-[10px] font-bold text-violet-400">MVCC (PostgreSQL, Oracle)</span>
                <p className="mt-0.5 text-[10px] text-foreground-subtle">
                  Keeps old row versions. Readers see a snapshot and are never blocked
                  by writers. Higher storage cost but excellent concurrency.
                </p>
              </div>
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-2.5">
                <span className="block text-[10px] font-bold text-amber-400">Two-Phase Locking (MySQL/InnoDB)</span>
                <p className="mt-0.5 text-[10px] text-foreground-subtle">
                  Acquires locks on rows. Writers block readers (and vice versa).
                  Simpler to implement but can cause deadlocks and reduced throughput.
                </p>
              </div>
            </div>
          </div>

          {/* Key concepts */}
          <div className="border-t border-sidebar-border pt-3">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              Key Concepts
            </span>
            <div className="space-y-1.5 text-[11px] text-foreground-subtle">
              <p>
                <strong className="text-foreground-muted">xmin</strong> — The transaction ID
                that created this row version.
              </p>
              <p>
                <strong className="text-foreground-muted">xmax</strong> — The transaction ID
                that deleted/superseded this version (null = still alive).
              </p>
              <p>
                <strong className="text-foreground-muted">Snapshot</strong> — A frozen view
                of which transactions had committed at the time your transaction began.
              </p>
              <p>
                <strong className="text-foreground-muted">Visibility Rule</strong> — A version
                is visible if xmin committed before your snapshot AND (xmax is null OR
                xmax committed after your snapshot).
              </p>
            </div>
          </div>

          {/* Interview tip */}
          <div className="border-t border-sidebar-border pt-3">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              Interview Tip
            </span>
            <p className="text-[11px] text-foreground-subtle">
              When asked &quot;how does PostgreSQL handle concurrent reads and writes?&quot;, explain
              MVCC: each transaction gets a snapshot, old versions are kept until no
              transaction needs them (vacuum), and writers create new versions instead of
              overwriting. This is why <strong className="text-foreground-muted">SELECT never blocks
              in PostgreSQL</strong>.
            </p>
          </div>

          {/* Used in Production (DBL-084) */}
          <UsedInProductionPanel
            entries={[
              { name: "PostgreSQL", description: "PostgreSQL's MVCC implementation keeps old row versions (tuples) with xmin/xmax transaction IDs. The VACUUM process reclaims space from dead tuples no longer visible to any transaction." },
              { name: "MySQL InnoDB", description: "InnoDB implements MVCC using undo logs. Each row modification creates an undo record, and consistent reads reconstruct old versions by applying undo records in reverse." },
              { name: "CockroachDB", description: "CockroachDB extends MVCC across a distributed cluster. Each key-value pair is versioned with a hybrid logical clock timestamp, enabling serializable isolation at global scale." },
              { name: "Oracle", description: "Oracle pioneered MVCC in commercial databases. Its undo tablespace stores before-images of modified blocks, enabling consistent reads without blocking writers." },
            ]}
          />
        </div>
      </div>
    );
  }

  // ── ARIES Recovery Properties (DBL-091) ──────────────────────
  if (activeMode === "aries-recovery") {
    const currentStep = ariesSteps?.[ariesStepIndex ?? 0] ?? null;

    const phaseBadge: Record<string, string> = {
      normal: "border border-blue-500/30 bg-blue-500/10 text-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.1)]",
      crash: "border border-red-500/30 bg-red-500/10 text-red-400 shadow-[0_0_8px_rgba(239,68,68,0.1)]",
      analysis: "border border-violet-500/30 bg-violet-500/10 text-violet-400 shadow-[0_0_8px_rgba(139,92,246,0.1)]",
      redo: "border border-amber-500/30 bg-amber-500/10 text-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.1)]",
      undo: "bg-rose-500/10 text-rose-400",
      complete: "border border-green-500/30 bg-green-500/10 text-green-400 shadow-[0_0_8px_rgba(34,197,94,0.1)]",
    };

    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-sidebar-border px-3 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            ARIES Recovery Details
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
          {/* Concept explanation */}
          <div className="rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm p-3">
            <h3 className="mb-1 text-sm font-bold text-foreground">
              ARIES Recovery Protocol
            </h3>
            <p className="text-[11px] text-foreground-muted">
              ARIES (Algorithm for Recovery and Isolation Exploiting Semantics) is the
              standard crash recovery protocol. It uses a Write-Ahead Log (WAL) and
              3 recovery phases to guarantee both durability and atomicity.
            </p>
          </div>

          {/* Current step info */}
          {currentStep && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  Step {(ariesStepIndex ?? 0) + 1}/{ariesSteps?.length ?? 0}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                    phaseBadge[currentStep.phase] ?? "bg-neutral-800/30 text-foreground-muted",
                  )}
                >
                  {currentStep.phase}
                </span>
              </div>
              <p className="text-xs text-foreground-muted">
                {currentStep.description}
              </p>
            </div>
          )}

          {/* Three Phases */}
          <div className="border-t border-sidebar-border pt-3">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              The 3 Recovery Phases
            </span>
            <div className="space-y-2">
              <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-2.5">
                <span className="block text-[10px] font-bold text-violet-400">Phase 1: Analysis</span>
                <p className="mt-0.5 text-[10px] text-foreground-subtle">
                  Scan WAL from the last checkpoint to reconstruct the dirty page table
                  and transaction table. Determines which transactions were active at crash
                  time and which pages might need redo.
                </p>
              </div>
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-2.5">
                <span className="block text-[10px] font-bold text-amber-400">Phase 2: Redo</span>
                <p className="mt-0.5 text-[10px] text-foreground-subtle">
                  Replay ALL logged operations from the earliest dirty page recLSN forward.
                  Even uncommitted transactions are redone because we repeat history
                  to bring the database to the exact pre-crash state. Ensures durability.
                </p>
              </div>
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-2.5">
                <span className="block text-[10px] font-bold text-rose-400">Phase 3: Undo</span>
                <p className="mt-0.5 text-[10px] text-foreground-subtle">
                  Roll back uncommitted transactions by traversing their WAL entries in
                  reverse and writing Compensation Log Records (CLRs). CLRs make undo
                  idempotent. Ensures atomicity.
                </p>
              </div>
            </div>
          </div>

          {/* Key Concepts */}
          <div className="border-t border-sidebar-border pt-3">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              Key Concepts
            </span>
            <div className="space-y-1.5 text-[11px] text-foreground-subtle">
              <p>
                <strong className="text-foreground-muted">WAL (Write-Ahead Log)</strong> — Every
                change is logged BEFORE being applied to the database. If we crash, the WAL
                is our recovery lifeline.
              </p>
              <p>
                <strong className="text-foreground-muted">Checkpoint</strong> — A snapshot of the
                dirty page table and transaction table. Recovery starts scanning from the last
                checkpoint instead of the beginning of the WAL.
              </p>
              <p>
                <strong className="text-foreground-muted">recLSN</strong> — The LSN of the first
                log record that made a page dirty. Redo starts from the minimum recLSN across
                all dirty pages.
              </p>
              <p>
                <strong className="text-foreground-muted">CLR (Compensation Log Record)</strong> — Written
                during undo to record that an operation has been reversed. Prevents double-undo
                if we crash during recovery.
              </p>
            </div>
          </div>

          {/* Interview tip */}
          <div className="border-t border-sidebar-border pt-3">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              Interview Tip
            </span>
            <p className="text-[11px] text-foreground-subtle">
              &quot;Analysis finds what&apos;s dirty. Redo ensures durability. Undo ensures atomicity.&quot;
              This one-liner captures the essence of ARIES. Remember: redo replays EVERYTHING
              (even uncommitted work), then undo rolls back only what was not committed.
              The key insight is &quot;repeating history&quot; before selective undo.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Row vs Column Store Properties ────────────────────────────
  if (activeMode === "row-vs-column") {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-sidebar-border px-3 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            Row vs Column Store
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
          {/* Current query context */}
          <div className="rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm p-3">
            <div className="flex items-center gap-2 mb-2">
              <Columns className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold text-foreground">
                Storage Model Comparison
              </span>
            </div>
            <p className="text-[11px] text-foreground-muted">
              {rowColQueryType === "olap"
                ? "OLAP query: aggregating a single column across all rows. Column store wins because it only reads the relevant column."
                : "OLTP query: fetching a complete row by primary key. Row store wins because the entire row is stored contiguously."}
            </p>
          </div>

          {/* When to use each */}
          <div className="border-t border-sidebar-border pt-3">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              When to Use Each
            </span>
            <div className="space-y-2">
              <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-2.5">
                <span className="block text-[10px] font-bold text-blue-400">
                  OLTP (banking, e-commerce)
                </span>
                <p className="mt-0.5 text-[10px] text-foreground-subtle">
                  Row store: PostgreSQL, MySQL. Transactions read/write full rows.
                  Row-oriented storage keeps related data together for fast point lookups.
                </p>
              </div>
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 backdrop-blur-sm p-2.5">
                <span className="block text-[10px] font-bold text-green-400">
                  OLAP (analytics, dashboards)
                </span>
                <p className="mt-0.5 text-[10px] text-foreground-subtle">
                  Column store: ClickHouse, BigQuery, Redshift. Analytical queries scan
                  few columns across millions of rows. Columnar layout reads only what{"'"}s needed.
                </p>
              </div>
              <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-2.5">
                <span className="block text-[10px] font-bold text-violet-400">
                  Hybrid (HTAP)
                </span>
                <p className="mt-0.5 text-[10px] text-foreground-subtle">
                  TiDB, AlloyDB, SingleStore. Run both transactional and analytical
                  workloads on the same database using hybrid storage engines.
                </p>
              </div>
            </div>
          </div>

          {/* Key Insight */}
          <div className="border-t border-sidebar-border pt-3">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              Why It Matters
            </span>
            <div className="space-y-1.5 text-[11px] text-foreground-subtle">
              <p>
                <strong className="text-foreground-muted">Compression:</strong> Column
                stores compress 5-10x better because adjacent values in a column have
                the same type and often similar values (e.g., all ages are 20-65).
              </p>
              <p>
                <strong className="text-foreground-muted">CPU cache:</strong> Reading
                a single column means sequential memory access, which is much faster
                than jumping between fields in different rows.
              </p>
              <p>
                <strong className="text-foreground-muted">SIMD:</strong> Modern CPUs
                can process column vectors in parallel using SIMD instructions,
                making aggregations like SUM/AVG extremely fast.
              </p>
            </div>
          </div>

          {/* Real-world */}
          <div className="border-t border-sidebar-border pt-3">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              Real-World
            </span>
            <p className="text-[11px] text-foreground-subtle">
              Google BigQuery processes petabytes using columnar storage (Capacitor format).
              Uber switched their analytics from PostgreSQL (row) to Apache Pinot (columnar)
              and saw 100x query speedup for dashboard queries.
            </p>
          </div>

          {/* Used in Production (DBL-084) */}
          <UsedInProductionPanel
            entries={[
              { name: "ClickHouse (Yandex)", description: "ClickHouse is a columnar OLAP database that powers Yandex Metrica (second-largest web analytics after Google Analytics), processing billions of events per day." },
              { name: "BigQuery (Google)", description: "BigQuery uses Capacitor columnar format with Dremel execution engine. It can scan petabytes in seconds by reading only the columns needed for a query." },
              { name: "PostgreSQL + Redshift", description: "PostgreSQL is the classic row store for OLTP. Amazon Redshift (based on PartiQL) is its columnar counterpart for analytics, often used together in the same data pipeline." },
            ]}
          />
        </div>
      </div>
    );
  }

  // ── SQL vs NoSQL Properties (DBL-070) ────────────────────────
  if (activeMode === "sql-vs-nosql") {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-sidebar-border px-3 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            SQL vs NoSQL Guide
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
          {/* Overview */}
          <div className="rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm p-3">
            <span className="block text-xs font-semibold text-foreground mb-1">
              How to Choose
            </span>
            <p className="text-[11px] text-foreground-muted">
              The right database depends on your data model, consistency requirements,
              and scale. There is no universal winner -- most production systems use both.
            </p>
          </div>

          {/* SQL strengths */}
          <div className="border-t border-sidebar-border pt-3">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              SQL Strengths
            </span>
            <div className="space-y-1.5 text-[11px] text-foreground-subtle">
              <p>
                <strong className="text-blue-400">ACID transactions:</strong> Atomicity guarantees
                that money transfers either fully complete or fully roll back.
              </p>
              <p>
                <strong className="text-blue-400">Complex queries:</strong> JOINs, subqueries,
                window functions, and CTEs make analytical queries expressive.
              </p>
              <p>
                <strong className="text-blue-400">Data integrity:</strong> Foreign keys, unique
                constraints, and check constraints enforce rules at the database level.
              </p>
            </div>
          </div>

          {/* NoSQL strengths */}
          <div className="border-t border-sidebar-border pt-3">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              NoSQL Strengths
            </span>
            <div className="space-y-1.5 text-[11px] text-foreground-subtle">
              <p>
                <strong className="text-green-400">Horizontal scaling:</strong> Add nodes to
                distribute data. Cassandra scales to millions of writes/sec across data centers.
              </p>
              <p>
                <strong className="text-green-400">Flexible schema:</strong> No migrations needed.
                Each document can have different fields -- great for evolving products.
              </p>
              <p>
                <strong className="text-green-400">High write throughput:</strong> LSM-tree
                storage engines and partition-key routing make writes extremely fast.
              </p>
            </div>
          </div>

          {/* Common misconceptions */}
          <div className="border-t border-sidebar-border pt-3">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              Common Misconceptions
            </span>
            <div className="space-y-1.5 text-[11px] text-foreground-subtle">
              <p>
                <strong className="text-foreground-muted">{'"'}NoSQL scales better{'"'}:</strong> PostgreSQL
                with Citus or CockroachDB scales horizontally too. The gap is narrowing.
              </p>
              <p>
                <strong className="text-foreground-muted">{'"'}SQL is slow{'"'}:</strong> A properly
                indexed PostgreSQL query runs in microseconds. Most performance issues are
                missing indexes, not the database engine.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Index Anti-Patterns Properties (DBL-087) ────────────────
  if (activeMode === "index-anti-patterns") {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-sidebar-border px-3 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            Index Anti-Patterns
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
          {/* Overview */}
          <div className="rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm p-3">
            <span className="block text-xs font-semibold text-foreground mb-1">
              Why Indexes Fail
            </span>
            <p className="text-[11px] text-foreground-muted">
              Creating an index does not guarantee the database will use it.
              The query planner evaluates cost and may choose a sequential scan
              if the index cannot help or if it would read too much of the table.
            </p>
          </div>

          {/* How to diagnose */}
          <div className="border-t border-sidebar-border pt-3">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              How to Diagnose
            </span>
            <div className="space-y-1.5 text-[11px] text-foreground-subtle">
              <p>
                <strong className="text-foreground-muted">EXPLAIN ANALYZE:</strong> Run{" "}
                <code className="rounded bg-background px-1 py-0.5 text-[10px]">
                  EXPLAIN ANALYZE SELECT ...
                </code>{" "}
                to see the actual execution plan with timing.
              </p>
              <p>
                <strong className="text-foreground-muted">Look for SeqScan:</strong> If you
                expected an IndexScan but see SeqScan, one of these anti-patterns may be
                the cause.
              </p>
              <p>
                <strong className="text-foreground-muted">pg_stat_user_indexes:</strong> Query
                this system view to find indexes with zero scans -- candidates for removal.
              </p>
            </div>
          </div>

          {/* Quick reference */}
          <div className="border-t border-sidebar-border pt-3">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              Quick Reference
            </span>
            <div className="space-y-2">
              <div className="rounded-xl border border-red-500/30 bg-red-500/5 backdrop-blur-sm p-2.5 shadow-[0_0_15px_rgba(239,68,68,0.05)]">
                <span className="block text-[10px] font-bold text-red-400">
                  #1 Function on Column
                </span>
                <p className="mt-0.5 text-[10px] text-foreground-subtle">
                  WHERE YEAR(col) = ... -- use range condition instead
                </p>
              </div>
              <div className="rounded-xl border border-red-500/30 bg-red-500/5 backdrop-blur-sm p-2.5 shadow-[0_0_15px_rgba(239,68,68,0.05)]">
                <span className="block text-[10px] font-bold text-red-400">
                  #2 Type Coercion
                </span>
                <p className="mt-0.5 text-[10px] text-foreground-subtle">
                  WHERE int_col = {`'`}string{`'`} -- match types exactly
                </p>
              </div>
              <div className="rounded-xl border border-red-500/30 bg-red-500/5 backdrop-blur-sm p-2.5 shadow-[0_0_15px_rgba(239,68,68,0.05)]">
                <span className="block text-[10px] font-bold text-red-400">
                  #3 Leading Wildcard
                </span>
                <p className="mt-0.5 text-[10px] text-foreground-subtle">
                  WHERE col LIKE {`'`}%suffix{`'`} -- use trailing wildcard or trigram index
                </p>
              </div>
              <div className="rounded-xl border border-red-500/30 bg-red-500/5 backdrop-blur-sm p-2.5 shadow-[0_0_15px_rgba(239,68,68,0.05)]">
                <span className="block text-[10px] font-bold text-red-400">
                  #4 Low Cardinality
                </span>
                <p className="mt-0.5 text-[10px] text-foreground-subtle">
                  WHERE gender = {`'`}M{`'`} -- use composite index for better selectivity
                </p>
              </div>
              <div className="rounded-xl border border-red-500/30 bg-red-500/5 backdrop-blur-sm p-2.5 shadow-[0_0_15px_rgba(239,68,68,0.05)]">
                <span className="block text-[10px] font-bold text-red-400">
                  #5 Over-Indexing
                </span>
                <p className="mt-0.5 text-[10px] text-foreground-subtle">
                  10 indexes on one table -- audit and drop unused indexes
                </p>
              </div>
            </div>
          </div>

          {/* Pro tip */}
          <div className="border-t border-sidebar-border pt-3">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              Pro Tip
            </span>
            <p className="text-[11px] text-foreground-subtle">
              PostgreSQL{`'`}s <code className="rounded bg-background px-1 py-0.5 text-[10px]">
              auto_explain</code> module can automatically log slow query plans.
              Set <code className="rounded bg-background px-1 py-0.5 text-[10px]">
              auto_explain.log_min_duration = 100ms</code> to catch queries
              that take over 100ms.
            </p>
          </div>
        </div>
      </div>
    );
  }


  // ── Caching Patterns Properties (DBL-079) ──────────────────────
  if (activeMode === "caching-patterns") {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-sidebar-border px-3 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            Caching Patterns Guide
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
          {/* Current pattern context */}
          <div className="rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm p-3">
            <span className="block text-xs font-semibold text-foreground mb-1">
              {cachingPattern === "cache-aside"
                ? "Cache-Aside (Lazy Loading)"
                : cachingPattern === "write-through"
                  ? "Write-Through"
                  : "Write-Behind (Write-Back)"}
            </span>
            <p className="text-[11px] text-foreground-muted">
              {cachingPattern === "cache-aside"
                ? "The application checks the cache first. On a miss, it reads from the database and populates the cache. Most common pattern for read-heavy workloads."
                : cachingPattern === "write-through"
                  ? "Every write goes to both cache and database synchronously. Ensures strong consistency between cache and DB at the cost of write latency."
                  : "Writes go to cache only; a background process flushes to DB asynchronously. Fastest writes, but risks data loss if the cache crashes before flushing."}
            </p>
          </div>

          {/* When to use each */}
          <div className="border-t border-sidebar-border pt-3">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              When to Use Each
            </span>
            <div className="space-y-2">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-2.5">
                <span className="block text-[10px] font-bold text-emerald-400">
                  Cache-Aside
                </span>
                <p className="mt-0.5 text-[10px] text-foreground-subtle">
                  Best for: read-heavy workloads where stale data is acceptable for short periods.
                  Used by: most web applications, REST APIs, session stores.
                </p>
              </div>
              <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-2.5">
                <span className="block text-[10px] font-bold text-blue-400">
                  Write-Through
                </span>
                <p className="mt-0.5 text-[10px] text-foreground-subtle">
                  Best for: data that must be consistent between cache and DB at all times.
                  Used by: banking systems, payment processing, inventory management.
                </p>
              </div>
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 backdrop-blur-sm p-2.5 shadow-[0_0_15px_rgba(245,158,11,0.05)]">
                <span className="block text-[10px] font-bold text-amber-400">
                  Write-Behind
                </span>
                <p className="mt-0.5 text-[10px] text-foreground-subtle">
                  Best for: write-heavy workloads where speed matters more than durability.
                  Used by: gaming leaderboards, real-time analytics, IoT sensor ingestion.
                </p>
              </div>
            </div>
          </div>

          {/* Redis examples */}
          <div className="border-t border-sidebar-border pt-3">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              Redis Examples
            </span>
            <div className="space-y-2">
              <div className="rounded-xl bg-black/50 p-2.5">
                <span className="block text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                  Cache-Aside Read
                </span>
                <pre className="whitespace-pre-wrap font-mono text-[10px] text-emerald-400">
{`val = redis.get("user:123")
if val is None:
  val = db.query("SELECT * FROM users WHERE id=123")
  redis.setex("user:123", 300, val)
return val`}
                </pre>
              </div>
              <div className="rounded-xl bg-black/50 p-2.5">
                <span className="block text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                  Write-Through
                </span>
                <pre className="whitespace-pre-wrap font-mono text-[10px] text-blue-400">
{`def update_user(id, data):
  redis.set(f"user:{id}", data)
  db.execute("UPDATE users SET ... WHERE id=?", id)
  # Both always in sync`}
                </pre>
              </div>
              <div className="rounded-xl bg-black/50 p-2.5">
                <span className="block text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                  Write-Behind
                </span>
                <pre className="whitespace-pre-wrap font-mono text-[10px] text-amber-400">
{`def update_user(id, data):
  redis.set(f"user:{id}", data)
  redis.xadd("db_sync", {"id": id})
  # Background worker flushes to DB`}
                </pre>
              </div>
            </div>
          </div>

          {/* Invalidation strategies */}
          <div className="border-t border-sidebar-border pt-3">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              Invalidation Strategies
            </span>
            <div className="space-y-1.5 text-[11px] text-foreground-subtle">
              <p>
                <strong className="text-foreground-muted">TTL:</strong>{" "}
                SET key value EX 300 -- auto-expires after 5 min. Simple but stale window.
              </p>
              <p>
                <strong className="text-foreground-muted">Event-based:</strong>{" "}
                On DB write, DEL the cache key. Near-real-time but complex infrastructure.
              </p>
              <p>
                <strong className="text-foreground-muted">Manual:</strong>{" "}
                Application explicitly deletes cache on update. Full control but error-prone.
              </p>
            </div>
          </div>

          {/* Interview framing */}
          <div className="border-t border-sidebar-border pt-3">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              Interview Framing
            </span>
            <p className="text-[11px] text-foreground-subtle">
              You will be asked this in system design rounds. The interviewer wants to hear:
              (1) which pattern you choose and why, (2) how you handle invalidation,
              (3) what happens on cache failure, (4) how you prevent thundering herd
              (cache stampede). Mention Redis, TTL, and write-behind trade-offs.
            </p>
          </div>

          {/* Real-world */}
          <div className="border-t border-sidebar-border pt-3">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              Used in Production
            </span>
            <div className="space-y-2">
              <div className="rounded-xl border border-border/30 bg-background p-2.5">
                <span className="block text-[10px] font-bold text-foreground">
                  Facebook (Meta)
                </span>
                <p className="mt-0.5 text-[10px] text-foreground-subtle">
                  Uses Memcached with cache-aside. TAO (The Associations and Objects) system
                  caches social graph queries with event-based invalidation via MySQL binlog.
                </p>
              </div>
              <div className="rounded-xl border border-border/30 bg-background p-2.5">
                <span className="block text-[10px] font-bold text-foreground">
                  Twitter (X)
                </span>
                <p className="mt-0.5 text-[10px] text-foreground-subtle">
                  Uses Redis + write-behind for timeline fanout. Tweets are written to Redis
                  first, then async-flushed to Manhattan (KV store). Write-behind enables
                  real-time tweet delivery at scale.
                </p>
              </div>
              <div className="rounded-xl border border-border/30 bg-background p-2.5">
                <span className="block text-[10px] font-bold text-foreground">
                  Amazon DynamoDB DAX
                </span>
                <p className="mt-0.5 text-[10px] text-foreground-subtle">
                  DAX is a write-through cache for DynamoDB. Every write updates both DAX
                  and DynamoDB, ensuring reads from DAX are always consistent.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  // ── Join Algorithms (DBL-076) ──────────────────────────────
  if (activeMode === "join-algorithms") {
    const currentStep = joinSteps?.[joinStepIndex ?? 0] as JoinStep | undefined;
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-sidebar-border px-3 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            Join Algorithms
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
          {/* Current step */}
          {currentStep && (
            <div className="rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm p-3">
              <span className="block text-xs font-semibold text-foreground mb-1">
                Step {(joinStepIndex ?? 0) + 1}/{joinSteps?.length ?? 0}
              </span>
              <p className="text-[11px] text-foreground-muted leading-relaxed">
                {currentStep.description}
              </p>
              <div className="mt-2 flex gap-3 text-[10px] text-foreground-subtle">
                <span>Comparisons: {currentStep.state.comparisons}</span>
                <span>Matches: {currentStep.state.matches.length}</span>
              </div>
            </div>
          )}

          {/* Algorithm comparison */}
          <div className="border-t border-sidebar-border pt-3">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              Complexity Comparison
            </span>
            <div className="space-y-2">
              <div className={cn(
                "rounded-xl border p-2.5",
                joinAlgorithm === "nested-loop" ? "border-primary bg-primary/5" : "border-border/30 bg-elevated/50 backdrop-blur-sm",
              )}>
                <span className="block text-[10px] font-bold text-red-400">
                  Nested Loop Join
                </span>
                <p className="mt-0.5 text-[10px] text-foreground-subtle">
                  O(n * m) -- for each outer row, scan ALL inner rows. Simple but slow.
                  Used when one table is very small or no suitable index/hash is available.
                </p>
              </div>
              <div className={cn(
                "rounded-xl border p-2.5",
                joinAlgorithm === "sort-merge" ? "border-primary bg-primary/5" : "border-border/30 bg-elevated/50 backdrop-blur-sm",
              )}>
                <span className="block text-[10px] font-bold text-amber-400">
                  Sort-Merge Join
                </span>
                <p className="mt-0.5 text-[10px] text-foreground-subtle">
                  O(n log n + m log m) -- sort both tables, then merge with two pointers.
                  Efficient when data is already sorted or an index provides order.
                </p>
              </div>
              <div className={cn(
                "rounded-xl border p-2.5",
                joinAlgorithm === "hash-join" ? "border-primary bg-primary/5" : "border-border/30 bg-elevated/50 backdrop-blur-sm",
              )}>
                <span className="block text-[10px] font-bold text-green-400">
                  Hash Join
                </span>
                <p className="mt-0.5 text-[10px] text-foreground-subtle">
                  O(n + m) -- build hash table on smaller table, probe with larger.
                  Fastest for equi-joins when memory fits the hash table.
                </p>
              </div>
            </div>
          </div>

          {/* When optimizer chooses each */}
          <div className="border-t border-sidebar-border pt-3">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              When The Optimizer Chooses Each
            </span>
            <div className="space-y-1.5 text-[11px] text-foreground-subtle">
              <p>
                <strong className="text-foreground-muted">Nested Loop:</strong> When the inner
                table has an index on the join key, or when one table has very few rows
                (e.g., a lookup table with 5 rows).
              </p>
              <p>
                <strong className="text-foreground-muted">Sort-Merge:</strong> When both tables
                are already sorted by the join key (e.g., from a clustered index), or for
                non-equi joins like range conditions (a.date BETWEEN b.start AND b.end).
              </p>
              <p>
                <strong className="text-foreground-muted">Hash Join:</strong> Default choice for
                large equi-joins. PostgreSQL and most databases prefer this when the smaller
                table fits in work_mem. Falls back to Grace Hash Join for larger tables.
              </p>
            </div>
          </div>

          {/* Interview tip */}
          <div className="border-t border-sidebar-border pt-3">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              Interview Tip
            </span>
            <p className="text-[11px] text-foreground-subtle">
              In system design interviews, mention that the choice of join algorithm
              affects query latency. If you are designing a system with frequent joins,
              consider denormalization or pre-computed join tables to avoid expensive
              runtime joins at scale.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Star/Snowflake Schema (DBL-088) ────────────────────────
  if (activeMode === "star-snowflake") {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-sidebar-border px-3 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            Star &amp; Snowflake Schema
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
          <div className="rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm p-3">
            <span className="block text-xs font-semibold text-foreground mb-1">
              {starSnowflakeType === "star" ? "Star Schema" : "Snowflake Schema"}
            </span>
            <p className="text-[11px] text-foreground-muted">
              {starSnowflakeType === "star"
                ? "All dimension tables connect directly to the central fact table. Denormalized dimensions trade storage for query speed."
                : "Dimension tables are normalized into sub-tables. Reduces redundancy but requires more JOINs for analytics queries."}
            </p>
          </div>

          <div className="border-t border-sidebar-border pt-3">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              OLAP vs OLTP
            </span>
            <div className="space-y-1.5 text-[11px] text-foreground-subtle">
              <p>
                <strong className="text-foreground-muted">OLAP (Analytics):</strong> Star/Snowflake
                schemas are designed for analytical queries (SUM, COUNT, AVG over millions of rows).
                Used in data warehouses like Snowflake, BigQuery, Redshift.
              </p>
              <p>
                <strong className="text-foreground-muted">OLTP (Transactions):</strong> Your production
                database uses normalized 3NF schemas optimized for INSERT/UPDATE/DELETE operations.
              </p>
            </div>
          </div>

          <div className="border-t border-sidebar-border pt-3">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              Key Tradeoff
            </span>
            <div className="space-y-1.5 text-[11px] text-foreground-subtle">
              <p>
                <strong className="text-primary">Star:</strong> Fewer JOINs = faster queries.
                More redundancy = more storage. Hard to update dimension data.
              </p>
              <p>
                <strong className="text-violet-400">Snowflake:</strong> Normalized dimensions = less
                storage. But analytics queries need more JOINs through the hierarchy.
              </p>
            </div>
          </div>

          <div className="border-t border-sidebar-border pt-3">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              Interview Tip
            </span>
            <p className="text-[11px] text-foreground-subtle">
              Modern data warehouses (Snowflake, BigQuery) use columnar storage that makes
              denormalized star schemas very efficient. When asked about data modeling for
              analytics, default to star schema unless dimension data changes frequently.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Connection Pooling (DBL-093) ──────────────────────────────
  if (activeMode === "connection-pooling") {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-sidebar-border px-3 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            Connection Pooling
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
          <div className="rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm p-3">
            <span className="block text-xs font-semibold text-foreground mb-1">
              {connPoolMode === "no-pooling" ? "Without Pooling" : "With Pooling"}
            </span>
            <p className="text-[11px] text-foreground-muted">
              {connPoolMode === "no-pooling"
                ? "Each request opens a new TCP connection, negotiates TLS, authenticates, runs the query, then closes everything. At scale, this overwhelms the database."
                : `Pre-warmed pool of ${connPoolSize ?? 10} connections. Requests borrow a connection, run the query, and return it. Eliminates connection setup overhead.`}
            </p>
          </div>

          <div className="border-t border-sidebar-border pt-3">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              Why It Matters
            </span>
            <div className="space-y-1.5 text-[11px] text-foreground-subtle">
              <p>
                Every database has a connection limit. PostgreSQL defaults to
                <strong className="text-foreground-muted"> max_connections = 100</strong>.
                Without pooling, 100 concurrent requests exhaust all connections.
              </p>
              <p>
                With pooling, those 100 requests share 10-20 connections.
                Each request holds a connection for ~2ms (query time), so
                a pool of 10 can serve 5,000 req/sec.
              </p>
            </div>
          </div>

          <div className="border-t border-sidebar-border pt-3">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              Pool Sizing Rule of Thumb
            </span>
            <div className="space-y-1.5 text-[11px] text-foreground-subtle">
              <p>
                <strong className="text-amber-400">Too small:</strong> Requests queue,
                latency spikes. Users experience timeouts.
              </p>
              <p>
                <strong className="text-red-400">Too large:</strong> Each connection
                uses ~10MB of PostgreSQL memory. 200 connections = 2GB just for connections.
              </p>
              <p>
                <strong className="text-emerald-400">Optimal:</strong> connections =
                (2 * CPU cores) + disk spindles. For SSD: ~10-20 for most workloads.
              </p>
            </div>
          </div>

          <div className="border-t border-sidebar-border pt-3">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              Common Tools
            </span>
            <div className="space-y-1.5 text-[11px] text-foreground-subtle">
              <p><strong className="text-foreground-muted">PgBouncer:</strong> Lightweight PostgreSQL pooler. Transaction mode is most common.</p>
              <p><strong className="text-foreground-muted">HikariCP:</strong> Java connection pool. Used by Spring Boot and most JVM apps.</p>
              <p><strong className="text-foreground-muted">Prisma:</strong> Built-in connection pool for Node.js. Configurable pool size.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
});

export default DatabaseProperties;
export { PlanNodeDetails };
