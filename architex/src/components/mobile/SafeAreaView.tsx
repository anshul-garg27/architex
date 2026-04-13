"use client";

import { memo, useMemo, type ReactNode, type CSSProperties } from "react";
import { useSafeAreaInsets } from "@/hooks/useSafeAreaInsets";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────

export type SafeAreaEdge = "top" | "bottom" | "left" | "right";

export interface SafeAreaViewProps {
  children: ReactNode;
  /**
   * Which edges to apply safe-area padding to.
   *
   * - `"all"` (default) — all four edges
   * - `"top"` — only top
   * - `"bottom"` — only bottom
   * - `"both"` — top + bottom
   * - `SafeAreaEdge[]` — explicit list
   */
  edges?: "all" | "top" | "bottom" | "both" | SafeAreaEdge[];
  className?: string;
  style?: CSSProperties;
}

// ── Component ────────────────────────────────────────────────

export const SafeAreaView = memo(function SafeAreaView({
  children,
  edges = "all",
  className,
  style,
}: SafeAreaViewProps) {
  const insets = useSafeAreaInsets();

  const resolvedEdges: SafeAreaEdge[] = useMemo(() => {
    if (edges === "all") return ["top", "bottom", "left", "right"];
    if (edges === "top") return ["top"];
    if (edges === "bottom") return ["bottom"];
    if (edges === "both") return ["top", "bottom"];
    return edges;
  }, [edges]);

  const padding: CSSProperties = useMemo(() => {
    const p: CSSProperties = {};
    if (resolvedEdges.includes("top") && insets.top > 0)
      p.paddingTop = insets.top;
    if (resolvedEdges.includes("bottom") && insets.bottom > 0)
      p.paddingBottom = insets.bottom;
    if (resolvedEdges.includes("left") && insets.left > 0)
      p.paddingLeft = insets.left;
    if (resolvedEdges.includes("right") && insets.right > 0)
      p.paddingRight = insets.right;
    return p;
  }, [resolvedEdges, insets]);

  return (
    <div className={cn("safe-area-view", className)} style={{ ...padding, ...style }}>
      {children}
    </div>
  );
});
