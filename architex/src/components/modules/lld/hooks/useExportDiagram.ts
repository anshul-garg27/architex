"use client";

/**
 * useExportDiagram -- Hook for exporting the LLD canvas as PNG or SVG.
 *
 * Uses only browser APIs (no external dependencies). Produces clean
 * output by stripping the grid background, vignette overlay, and
 * inlining CSS custom properties.
 */

import { useState, useCallback } from "react";

// ── CSS custom property resolution ──────────────────────────

/**
 * Map of LLD CSS custom properties to their resolved values.
 * Falls back to sensible defaults if getComputedStyle is unavailable.
 */
const LLD_CSS_VARS = [
  "--lld-canvas-bg",
  "--lld-canvas-bg-deep",
  "--lld-canvas-text",
  "--lld-canvas-text-muted",
  "--lld-canvas-text-subtle",
  "--lld-canvas-border",
  "--lld-canvas-edge",
  "--lld-canvas-selected",
  "--lld-canvas-abstract",
  "--lld-stereo-interface",
  "--lld-stereo-abstract",
  "--lld-stereo-enum",
  "--lld-stereo-class",
  "--lld-solid-srp",
  "--lld-solid-ocp",
  "--lld-solid-lsp",
  "--lld-solid-isp",
  "--lld-solid-dip",
  "--lld-diff-easy",
  "--lld-diff-medium",
  "--lld-diff-hard",
  "--lld-diff-expert",
  // General theme vars often used in the SVG
  "--foreground",
  "--foreground-muted",
  "--foreground-subtle",
  "--background",
  "--border",
  "--card",
  "--primary",
  "--accent",
] as const;

function resolveVar(varName: string): string {
  if (typeof window === "undefined") return "";
  return getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();
}

/**
 * Replace all `var(--xxx)` references in an SVG string with resolved values.
 */
function inlineCSSVariables(svgString: string): string {
  let result = svgString;
  for (const varName of LLD_CSS_VARS) {
    const resolved = resolveVar(varName);
    if (resolved) {
      // Match var(--name) and var(--name, fallback)
      const pattern = new RegExp(
        `var\\(${varName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:\\s*,\\s*[^)]+)?\\)`,
        "g",
      );
      result = result.replace(pattern, resolved);
    }
  }
  return result;
}

// ── SVG cleanup ─────────────────────────────────────────────

/**
 * Clone an SVG element and prepare it for export:
 * - Remove the grid background pattern and its fill rect
 * - Remove the vignette overlay
 * - Set a white background rect
 * - Inline CSS custom properties
 */
function prepareCleanSVG(svgElement: SVGSVGElement): string {
  const clone = svgElement.cloneNode(true) as SVGSVGElement;

  // Set xmlns for standalone SVG
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");

  // Remove grid pattern definition
  const gridPattern = clone.querySelector("#lld-grid");
  if (gridPattern) gridPattern.remove();

  // Remove vignette gradient definition
  const vignetteGrad = clone.querySelector("#lld-canvas-vignette");
  if (vignetteGrad) vignetteGrad.remove();

  // Remove rects that use the grid or vignette as fill
  const rects = clone.querySelectorAll("rect");
  rects.forEach((rect) => {
    const fill = rect.getAttribute("fill");
    if (fill === "url(#lld-grid)" || fill === "url(#lld-canvas-vignette)") {
      rect.remove();
    }
  });

  // Read the viewBox to add a white background
  const viewBox = clone.getAttribute("viewBox");
  if (viewBox) {
    const [vx, vy, vw, vh] = viewBox.split(" ").map(Number);
    const bgRect = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "rect",
    );
    bgRect.setAttribute("x", String(vx));
    bgRect.setAttribute("y", String(vy));
    bgRect.setAttribute("width", String(vw));
    bgRect.setAttribute("height", String(vh));
    bgRect.setAttribute("fill", "#ffffff");
    // Insert as first child so it's behind everything
    clone.insertBefore(bgRect, clone.firstChild);
  }

  // Add a title element
  const titleEl = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "title",
  );
  titleEl.textContent = "UML Class Diagram";
  clone.insertBefore(titleEl, clone.firstChild);

  // Serialize and inline CSS variables
  const serialized = new XMLSerializer().serializeToString(clone);
  return inlineCSSVariables(serialized);
}

// ── Download helper ─────────────────────────────────────────

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9-_ ]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase();
}

// ── Hook ────────────────────────────────────────────────────

export function useExportDiagram() {
  const [isExporting, setIsExporting] = useState(false);

  const exportAsSVG = useCallback(
    (svgElement: SVGSVGElement, filename?: string) => {
      const cleanSVG = prepareCleanSVG(svgElement);
      const blob = new Blob([cleanSVG], {
        type: "image/svg+xml;charset=utf-8",
      });
      const name = sanitizeFilename(filename ?? "diagram") + ".svg";
      triggerDownload(blob, name);
    },
    [],
  );

  const exportAsPNG = useCallback(
    async (svgElement: SVGSVGElement, filename?: string) => {
      setIsExporting(true);

      try {
        const cleanSVG = prepareCleanSVG(svgElement);
        const svgBlob = new Blob([cleanSVG], {
          type: "image/svg+xml;charset=utf-8",
        });
        const url = URL.createObjectURL(svgBlob);

        await new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            const retinaScale = 2;
            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth * retinaScale;
            canvas.height = img.naturalHeight * retinaScale;

            const ctx = canvas.getContext("2d");
            if (!ctx) {
              URL.revokeObjectURL(url);
              reject(new Error("Could not get canvas 2d context"));
              return;
            }

            ctx.scale(retinaScale, retinaScale);
            ctx.drawImage(img, 0, 0);

            canvas.toBlob(
              (pngBlob) => {
                if (!pngBlob) {
                  URL.revokeObjectURL(url);
                  reject(new Error("Canvas toBlob returned null"));
                  return;
                }
                const name =
                  sanitizeFilename(filename ?? "diagram") + ".png";
                triggerDownload(pngBlob, name);
                URL.revokeObjectURL(url);
                resolve();
              },
              "image/png",
            );
          };

          img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error("Failed to load SVG as image"));
          };

          img.src = url;
        });
      } finally {
        setIsExporting(false);
      }
    },
    [],
  );

  return { exportAsPNG, exportAsSVG, isExporting };
}
