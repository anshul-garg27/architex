"use client";

import React, { memo, useState, useEffect, useRef, lazy, Suspense } from "react";
import { Code, BookOpen, Database } from "lucide-react";
import { cn } from "@/lib/utils";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import type { DatabaseMode } from "./useDatabaseModule";

// ── LEARN Panel Components (lazy) ────────────────────────────
const ReplicationLagVisualizer = lazy(() => import("@/components/modules/database/ReplicationLagVisualizer"));
const ShardingSimulator = lazy(() => import("@/components/modules/database/ShardingSimulator"));
const ConsistencyLevelDemo = lazy(() => import("@/components/modules/database/ConsistencyLevelDemo"));
const QueryPlanSimulation = lazy(() => import("@/components/modules/database/QueryPlanSimulation"));

const DatabaseBottomPanel = memo(function DatabaseBottomPanel({
  activeMode,
  logEntries,
  generatedSQL,
  generatedNoSQL,
}: {
  activeMode: DatabaseMode;
  logEntries: string[];
  generatedSQL: string;
  generatedNoSQL?: string;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  const [bottomTab, setBottomTab] = useState<"log" | "sql" | "mongodb" | "learn">(
    generatedSQL ? "sql" : "log",
  );

  // Switch to SQL tab when new SQL is generated
  useEffect(() => {
    if (generatedSQL) setBottomTab("sql");
  }, [generatedSQL]);

  useEffect(() => {
    if (bottomTab === "log") {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [logEntries.length, bottomTab]);

  const showSQLTab = activeMode === "er-diagram";

  const tabBtnClass = (active: boolean) =>
    cn(
      "flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-semibold uppercase tracking-wider transition-colors",
      active
        ? "border-primary/30 bg-primary/10 text-primary shadow-[0_0_15px_rgba(110,86,207,0.15)]"
        : "text-foreground-muted hover:text-foreground",
    );

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border/30 bg-elevated/30 backdrop-blur-sm px-4 py-2">
        <button onClick={() => setBottomTab("log")} className={tabBtnClass(bottomTab === "log")}>
          {showSQLTab ? "Log" : (
            <>
              {activeMode === "normalization" && "Normalization Log"}
              {activeMode === "transaction-isolation" && "Transaction Log"}
              {activeMode === "btree-index" && "B-Tree Log"}
              {activeMode === "hash-index" && "Hash Index Log"}
              {activeMode === "query-plans" && "Query Plan Log"}
              {activeMode === "lsm-tree" && "LSM-Tree Log"}
              {activeMode === "acid" && "ACID Log"}
              {activeMode === "cap-theorem" && "CAP Theorem Log"}
            </>
          )}
        </button>
        {showSQLTab && (
          <button onClick={() => setBottomTab("sql")} className={tabBtnClass(bottomTab === "sql")}>
            <Code className="h-3 w-3" />
            Generated SQL
          </button>
        )}
        {showSQLTab && (
          <button onClick={() => setBottomTab("mongodb")} className={tabBtnClass(bottomTab === "mongodb")}>
            <Database className="h-3 w-3" />
            MongoDB
          </button>
        )}
        <button onClick={() => setBottomTab("learn")} className={tabBtnClass(bottomTab === "learn")}>
          <BookOpen className="h-3 w-3" />
          Learn
        </button>
      </div>

      {/* Learn Panel */}
      {bottomTab === "learn" ? (
        <div className="flex-1 overflow-y-auto px-4 py-3">
          <ErrorBoundary label="DatabaseLearnPanel">
            <Suspense fallback={<div className="py-4 text-center text-xs text-foreground-subtle">Loading...</div>}>
              <div className="flex flex-col gap-6">
                <ErrorBoundary label="ReplicationLagVisualizer">
                  <ReplicationLagVisualizer />
                </ErrorBoundary>
                <ErrorBoundary label="ShardingSimulator">
                  <ShardingSimulator />
                </ErrorBoundary>
                <ErrorBoundary label="ConsistencyLevelDemo">
                  <ConsistencyLevelDemo />
                </ErrorBoundary>
                <ErrorBoundary label="QueryPlanSimulation">
                  <QueryPlanSimulation />
                </ErrorBoundary>
              </div>
            </Suspense>
          </ErrorBoundary>
        </div>
      ) : showSQLTab && bottomTab === "mongodb" ? (
        <div className="flex-1 overflow-y-auto bg-[var(--canvas-bg)] px-4 py-3">
          {generatedNoSQL ? (
            <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-amber-300/90">
              {generatedNoSQL}
            </pre>
          ) : (
            <span className="text-xs text-foreground-subtle">
              Add entities to your ER diagram to see the MongoDB schema.
            </span>
          )}
        </div>
      ) : showSQLTab && bottomTab === "sql" ? (
        <div className="flex-1 overflow-y-auto bg-[var(--canvas-bg)] px-4 py-3">
          {generatedSQL ? (
            <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-emerald-300/90">
              {generatedSQL}
            </pre>
          ) : (
            <span className="text-xs text-foreground-subtle">
              Click &quot;Generate SQL&quot; in the sidebar to generate CREATE TABLE statements from your ER diagram.
            </span>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 py-2 font-mono text-[11px] text-foreground-muted">
          {logEntries.length === 0 ? (
            <span className="text-foreground-subtle">
              Operations will appear here.
            </span>
          ) : (
            logEntries.map((entry, i) => (
              <div key={i} className="py-0.5">
                <span className="mr-2 text-foreground-subtle">
                  [{String(i + 1).padStart(3, "0")}]
                </span>
                {entry}
              </div>
            ))
          )}
          <div ref={endRef} />
        </div>
      )}
    </div>
  );
});

export default DatabaseBottomPanel;
