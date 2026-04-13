"use client";

import React, { memo, useState, useCallback, useMemo } from "react";
import {
  Sparkles,
  Download,
  RefreshCw,
  Boxes,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { duration, easing } from "@/lib/constants/motion";
import {
  generateArchitecture,
  type GeneratedArchitecture,
} from "@/lib/ai/architecture-generator";

// ── Types ───────────────────────────────────────────────────────────

export interface GeneratedDiagramPreviewProps {
  /** Natural-language description of the desired system. */
  description: string;
  /** Callback invoked when the user clicks "Import to Canvas". */
  onImport?: (architecture: GeneratedArchitecture) => void;
  className?: string;
}

// ── Component ───────────────────────────────────────────────────────

const GeneratedDiagramPreview = memo(function GeneratedDiagramPreview({
  description,
  onImport,
  className,
}: GeneratedDiagramPreviewProps) {
  const [architecture, setArchitecture] =
    useState<GeneratedArchitecture | null>(() =>
      description.trim() ? generateArchitecture(description) : null,
    );
  const [isGenerating, setIsGenerating] = useState(false);

  const handleRegenerate = useCallback(() => {
    if (!description.trim()) return;
    setIsGenerating(true);
    // Simulate brief generation delay
    const timer = setTimeout(() => {
      setArchitecture(generateArchitecture(description));
      setIsGenerating(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [description]);

  const handleImport = useCallback(() => {
    if (architecture && onImport) {
      onImport(architecture);
    }
  }, [architecture, onImport]);

  const nodeCount = architecture?.nodes.length ?? 0;
  const edgeCount = architecture?.edges.length ?? 0;

  // Group nodes by category for the summary
  const categoryGroups = useMemo(() => {
    if (!architecture) return new Map<string, number>();
    const groups = new Map<string, number>();
    for (const node of architecture.nodes) {
      groups.set(node.category, (groups.get(node.category) ?? 0) + 1);
    }
    return groups;
  }, [architecture]);

  if (!architecture && !isGenerating) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-8",
          className,
        )}
      >
        <Boxes className="mb-3 h-10 w-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground text-center">
          Enter a system description to generate an architecture diagram.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border border-border bg-card shadow-lg overflow-hidden",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">
            {architecture?.name ?? "Generating..."}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" size="sm">
            {nodeCount} node{nodeCount !== 1 ? "s" : ""}
          </Badge>
          <Badge variant="secondary" size="sm">
            {edgeCount} edge{edgeCount !== 1 ? "s" : ""}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {isGenerating ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center py-12"
          >
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </motion.div>
        ) : architecture ? (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: duration.normal, ease: easing.out }}
            className="px-4 py-3 space-y-3"
          >
            {/* Description */}
            <p className="text-sm text-muted-foreground leading-relaxed">
              {architecture.description}
            </p>

            {/* Node summary by category */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">
                Components
              </p>
              <div className="flex flex-wrap gap-1.5">
                {architecture.nodes.map((node) => (
                  <Badge
                    key={node.id}
                    variant="outline"
                    size="sm"
                  >
                    {node.label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Category breakdown */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">
                Categories
              </p>
              <div className="flex flex-wrap gap-1.5">
                {Array.from(categoryGroups.entries()).map(
                  ([category, count]) => (
                    <Badge key={category} variant="secondary" size="sm">
                      {category} ({count})
                    </Badge>
                  ),
                )}
              </div>
            </div>

            {/* Reasoning */}
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Design Reasoning
              </p>
              <p className="text-sm leading-relaxed">{architecture.reasoning}</p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Actions */}
      {architecture && !isGenerating && (
        <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRegenerate}
            disabled={isGenerating}
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Regenerate
          </Button>
          <Button
            size="sm"
            onClick={handleImport}
            disabled={!onImport}
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Import to Canvas
          </Button>
        </div>
      )}
    </div>
  );
});

export { GeneratedDiagramPreview };
