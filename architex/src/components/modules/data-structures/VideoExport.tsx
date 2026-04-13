"use client";

import { useCallback } from "react";

/**
 * DST-103: Export the DS visualization canvas as SVG or trigger print dialog.
 *
 * Strategy:
 *  1. Look for an <svg> inside `[data-ds-canvas]`.
 *  2. If found, serialize it and download as `.svg`.
 *  3. If no SVG exists (e.g. purely DOM-based viz), fall back to `window.print()`.
 *
 * No external dependencies required.
 */

function downloadVisualizationSVG(): void {
  const svgEl = document.querySelector("[data-ds-canvas] svg");
  if (svgEl) {
    const serializer = new XMLSerializer();
    const svgData = serializer.serializeToString(svgEl);
    const blob = new Blob([svgData], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `ds-visualization-${Date.now()}.svg`;
    anchor.click();
    URL.revokeObjectURL(url);
    return;
  }

  // Fallback: open print dialog so the user can "Save as PDF"
  window.print();
}

/**
 * React hook that wraps the download utility so components
 * get a stable callback reference.
 */
export function useVisualizationExport() {
  const exportSVG = useCallback(() => {
    downloadVisualizationSVG();
  }, []);

  return { exportSVG };
}

export { downloadVisualizationSVG };
