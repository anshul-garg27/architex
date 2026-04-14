"use client";

/**
 * AlignmentToolbar -- Floating toolbar for aligning and distributing
 * selected UML classes on the canvas.
 *
 * Appears when 2+ classes are selected (via multi-select, built by
 * another agent). Provides alignment (left/right/top/bottom/center-h/
 * center-v) and distribution (horizontal/vertical) operations.
 *
 * ## Wiring Guide
 *
 * This component expects a `selectedClassIds: Set<string>` in the parent
 * state. To integrate:
 *
 * 1. In `useLLDModuleImpl.tsx`, add:
 *    ```ts
 *    const [selectedClassIds, setSelectedClassIds] = useState<Set<string>>(new Set());
 *    ```
 *
 * 2. Derive `selectedClasses` from `classes` and `selectedClassIds`:
 *    ```ts
 *    const selectedClasses = useMemo(
 *      () => classes.filter(c => selectedClassIds.has(c.id)),
 *      [classes, selectedClassIds],
 *    );
 *    ```
 *
 * 3. Add an `onUpdateClasses` handler that batch-updates positions:
 *    ```ts
 *    const handleAlignClasses = useCallback((updated: UMLClass[]) => {
 *      pushUndo();
 *      setClasses(prev => {
 *        const map = new Map(updated.map(c => [c.id, c]));
 *        return prev.map(c => map.get(c.id) ?? c);
 *      });
 *      setIsDirty(true);
 *    }, [pushUndo]);
 *    ```
 *
 * 4. Render in LLDCanvas.tsx after the ZoomToolbar:
 *    ```tsx
 *    {selectedClasses.length >= 2 && (
 *      <AlignmentToolbar
 *        selectedClasses={selectedClasses}
 *        onUpdateClasses={handleAlignClasses}
 *      />
 *    )}
 *    ```
 */

import React, { memo, useCallback } from "react";
import {
  AlignStartVertical,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignEndHorizontal,
  AlignCenterVertical,
  AlignCenterHorizontal,
  GripHorizontal,
  GripVertical,
} from "lucide-react";
import type { UMLClass } from "@/lib/lld";
import { classBoxHeight, classBoxWidth } from "../constants";

// ── Props ───────────────────────────────────────────────────

interface AlignmentToolbarProps {
  selectedClasses: UMLClass[];
  onUpdateClasses: (updated: UMLClass[]) => void;
}

// ── Component ───────────────────────────────────────────────

export const AlignmentToolbar = memo(function AlignmentToolbar({
  selectedClasses,
  onUpdateClasses,
}: AlignmentToolbarProps) {
  const alignLeft = useCallback(() => {
    const minX = Math.min(...selectedClasses.map((c) => c.x));
    onUpdateClasses(selectedClasses.map((c) => ({ ...c, x: minX })));
  }, [selectedClasses, onUpdateClasses]);

  const alignRight = useCallback(() => {
    const maxRight = Math.max(
      ...selectedClasses.map((c) => c.x + classBoxWidth(c)),
    );
    onUpdateClasses(
      selectedClasses.map((c) => ({
        ...c,
        x: maxRight - classBoxWidth(c),
      })),
    );
  }, [selectedClasses, onUpdateClasses]);

  const alignTop = useCallback(() => {
    const minY = Math.min(...selectedClasses.map((c) => c.y));
    onUpdateClasses(selectedClasses.map((c) => ({ ...c, y: minY })));
  }, [selectedClasses, onUpdateClasses]);

  const alignBottom = useCallback(() => {
    const maxBottom = Math.max(
      ...selectedClasses.map((c) => c.y + classBoxHeight(c)),
    );
    onUpdateClasses(
      selectedClasses.map((c) => ({
        ...c,
        y: maxBottom - classBoxHeight(c),
      })),
    );
  }, [selectedClasses, onUpdateClasses]);

  const alignCenterH = useCallback(() => {
    const avgCx =
      selectedClasses.reduce((sum, c) => sum + c.x + classBoxWidth(c) / 2, 0) /
      selectedClasses.length;
    onUpdateClasses(
      selectedClasses.map((c) => ({
        ...c,
        x: avgCx - classBoxWidth(c) / 2,
      })),
    );
  }, [selectedClasses, onUpdateClasses]);

  const alignCenterV = useCallback(() => {
    const avgCy =
      selectedClasses.reduce(
        (sum, c) => sum + c.y + classBoxHeight(c) / 2,
        0,
      ) / selectedClasses.length;
    onUpdateClasses(
      selectedClasses.map((c) => ({
        ...c,
        y: avgCy - classBoxHeight(c) / 2,
      })),
    );
  }, [selectedClasses, onUpdateClasses]);

  const distributeH = useCallback(() => {
    if (selectedClasses.length < 3) return;
    const sorted = [...selectedClasses].sort((a, b) => a.x - b.x);
    const leftmost = sorted[0].x;
    const rightmost = sorted[sorted.length - 1].x + classBoxWidth(sorted[sorted.length - 1]);
    const totalContentWidth = sorted.reduce(
      (sum, c) => sum + classBoxWidth(c),
      0,
    );
    const gap =
      (rightmost - leftmost - totalContentWidth) /
      (sorted.length - 1);

    let currentX = leftmost;
    const updated = sorted.map((c) => {
      const newC = { ...c, x: currentX };
      currentX += classBoxWidth(c) + gap;
      return newC;
    });

    onUpdateClasses(updated);
  }, [selectedClasses, onUpdateClasses]);

  const distributeV = useCallback(() => {
    if (selectedClasses.length < 3) return;
    const sorted = [...selectedClasses].sort((a, b) => a.y - b.y);
    const topmost = sorted[0].y;
    const bottommost =
      sorted[sorted.length - 1].y +
      classBoxHeight(sorted[sorted.length - 1]);
    const totalContentHeight = sorted.reduce(
      (sum, c) => sum + classBoxHeight(c),
      0,
    );
    const gap =
      (bottommost - topmost - totalContentHeight) /
      (sorted.length - 1);

    let currentY = topmost;
    const updated = sorted.map((c) => {
      const h = classBoxHeight(c);
      const newC = { ...c, y: currentY };
      currentY += h + gap;
      return newC;
    });

    onUpdateClasses(updated);
  }, [selectedClasses, onUpdateClasses]);

  if (selectedClasses.length < 2) return null;

  const buttons: Array<{
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    disabled?: boolean;
  }> = [
    {
      icon: <AlignStartVertical className="h-3.5 w-3.5" />,
      label: "Align left",
      onClick: alignLeft,
    },
    {
      icon: <AlignCenterVertical className="h-3.5 w-3.5" />,
      label: "Align center horizontally",
      onClick: alignCenterH,
    },
    {
      icon: <AlignEndVertical className="h-3.5 w-3.5" />,
      label: "Align right",
      onClick: alignRight,
    },
    {
      icon: <AlignStartHorizontal className="h-3.5 w-3.5" />,
      label: "Align top",
      onClick: alignTop,
    },
    {
      icon: <AlignCenterHorizontal className="h-3.5 w-3.5" />,
      label: "Align center vertically",
      onClick: alignCenterV,
    },
    {
      icon: <AlignEndHorizontal className="h-3.5 w-3.5" />,
      label: "Align bottom",
      onClick: alignBottom,
    },
    {
      icon: <GripHorizontal className="h-3.5 w-3.5" />,
      label: "Distribute horizontally",
      onClick: distributeH,
      disabled: selectedClasses.length < 3,
    },
    {
      icon: <GripVertical className="h-3.5 w-3.5" />,
      label: "Distribute vertically",
      onClick: distributeV,
      disabled: selectedClasses.length < 3,
    },
  ];

  return (
    <div className="absolute left-1/2 top-3 z-20 -translate-x-1/2">
      <div className="flex items-center gap-0.5 rounded-lg border border-border/30 bg-gray-900/90 px-1.5 py-1 shadow-xl backdrop-blur">
        <span className="mr-1 text-[9px] font-medium uppercase tracking-wider text-foreground-subtle/60">
          {selectedClasses.length} selected
        </span>
        <div className="mx-0.5 h-4 w-px bg-border/30" />
        {buttons.map((btn) => (
          <button
            key={btn.label}
            onClick={btn.onClick}
            disabled={btn.disabled}
            className="flex h-6 w-6 items-center justify-center rounded text-foreground-muted transition-colors hover:bg-white/10 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
            title={btn.label}
            aria-label={btn.label}
          >
            {btn.icon}
          </button>
        ))}
      </div>
    </div>
  );
});

export default AlignmentToolbar;
