"use client";

import React, { memo } from "react";
import { Table } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FunctionalDependency, NormalizationResult } from "@/lib/database";

export type { NormalizationResult };

const NormalizationCanvas = memo(function NormalizationCanvas({
  result,
  showDecomposition,
  onLoadSample,
}: {
  result: NormalizationResult | null;
  showDecomposition: boolean;
  onLoadSample?: () => void;
}) {
  if (!result) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-elevated/80 to-background">
        <div className="text-center max-w-sm">
          <Table className="mx-auto mb-3 h-16 w-16 text-foreground-subtle opacity-30" />
          <p className="mb-2 text-sm font-medium text-foreground">
            Analyze functional dependencies to find normal forms.
          </p>
          <p className="mb-4 text-xs text-foreground-muted">
            Enter a relation and functional dependencies, then click Analyze.
          </p>
          {onLoadSample && (
            <button
              onClick={onLoadSample}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[0_0_20px_rgba(110,86,207,0.4)] transition-all hover:bg-primary/90 hover:shadow-[0_0_30px_rgba(110,86,207,0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Load example: Student-Course schema
            </button>
          )}
        </div>
      </div>
    );
  }

  const nfColors: Record<string, string> = {
    "1NF": "text-red-500 bg-red-500/10 border-red-500/30 shadow-[0_0_8px_rgba(239,68,68,0.1)]",
    "2NF": "text-orange-500 bg-orange-500/10 border-orange-500/30 shadow-[0_0_8px_rgba(249,115,22,0.1)]",
    "3NF": "text-green-500 bg-green-500/10 border-green-500/30 shadow-[0_0_8px_rgba(34,197,94,0.1)]",
    BCNF: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.1)]",
  };

  return (
    <div
      role="img"
      aria-label={`Normalization result showing ${result.currentNF} normal form`}
      className="h-full w-full overflow-auto bg-gradient-to-b from-elevated/80 to-background p-6"
    >
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Normal Form Badge */}
        <div className="text-center">
          <span
            className={cn(
              "inline-block rounded-full border px-4 py-1.5 text-sm font-bold",
              nfColors[result.currentNF],
            )}
          >
            Current: {result.currentNF}
          </span>
        </div>

        {/* Candidate Keys */}
        <div className="rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm p-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            Candidate Keys
          </h3>
          <div className="flex flex-wrap gap-2">
            {result.candidateKeys.map((ck, i) => (
              <span
                key={i}
                className="rounded-full border border-blue-500/30 bg-blue-500/10 backdrop-blur-sm px-2.5 py-1 font-mono text-xs font-semibold text-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.1)]"
              >
                {"{"}{ck.join(", ")}{"}"}
              </span>
            ))}
          </div>
        </div>

        {/* Attribute Closure */}
        <div className="rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm p-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            Attribute Closure (from first candidate key)
          </h3>
          <p className="font-mono text-xs text-foreground-muted">
            {"{"}{result.closure.join(", ")}{"}"}
            <sup>+</sup> = {"{"}{result.closure.join(", ")}{"}"}
          </p>
        </div>

        {/* Decomposition */}
        {showDecomposition && result.decomposition.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
              3NF Decomposition
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {result.decomposition.map((rel, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm p-4"
                  style={{
                    animation: `fadeSlideIn 0.3s ease ${i * 0.15}s both`,
                  }}
                >
                  <h4 className="mb-1 text-sm font-semibold text-foreground">
                    {rel.name}
                  </h4>
                  <p className="mb-2 font-mono text-xs text-foreground-muted">
                    ({rel.attributes.join(", ")})
                  </p>
                  {rel.fds.length > 0 && (
                    <div className="space-y-0.5">
                      {rel.fds.map((fd, j) => (
                        <p
                          key={j}
                          className="font-mono text-[11px] text-foreground-subtle"
                        >
                          {fd.lhs.join(", ")} {"->"} {fd.rhs.join(", ")}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
});

export default NormalizationCanvas;
