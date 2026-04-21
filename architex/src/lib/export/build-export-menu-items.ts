/**
 * Registry of Build-mode export actions. Each entry wires an existing
 * exporter from `src/lib/export/*` to a user-facing menu item.
 *
 * Adapted to the actual exporter signatures:
 * - downloadPNG(filename, options)
 * - downloadSVG(filename, options)
 * - downloadJSON(diagram: DiagramJSON, filename)
 * - copyMermaidToClipboard(nodes, edges)
 * - copyPlantUMLToClipboard(nodes, edges)
 */

import {
  downloadPNG,
  downloadSVG,
  downloadJSON,
  exportToJSON,
  copyMermaidToClipboard,
  copyPlantUMLToClipboard,
} from "@/lib/export";
import type { Node, Edge } from "@xyflow/react";

export interface BuildExportMenuItem {
  id: "png" | "svg" | "mermaid" | "plantuml" | "json";
  label: string;
  description: string;
  hotkey?: string;
  run: (args: {
    nodes: Node[];
    edges: Edge[];
    filename: string;
  }) => Promise<void>;
}

export const BUILD_EXPORT_MENU_ITEMS: readonly BuildExportMenuItem[] = [
  {
    id: "png",
    label: "Export as PNG",
    description: "Raster image, 2x resolution.",
    hotkey: "Cmd+Shift+P",
    run: async ({ filename }) => {
      await downloadPNG(`${filename}.png`, { scale: 2 });
    },
  },
  {
    id: "svg",
    label: "Export as SVG",
    description: "Vector image, infinitely scalable.",
    run: async ({ filename }) => {
      downloadSVG(`${filename}.svg`);
    },
  },
  {
    id: "mermaid",
    label: "Copy Mermaid",
    description: "Mermaid class-diagram source to clipboard.",
    hotkey: "Cmd+Shift+M",
    run: async ({ nodes, edges }) => {
      await copyMermaidToClipboard(nodes, edges);
    },
  },
  {
    id: "plantuml",
    label: "Copy PlantUML",
    description: "PlantUML source to clipboard.",
    run: async ({ nodes, edges }) => {
      await copyPlantUMLToClipboard(nodes, edges);
    },
  },
  {
    id: "json",
    label: "Export as JSON",
    description: "Full canvas state, re-importable.",
    run: async ({ nodes, edges, filename }) => {
      const diagram = exportToJSON(nodes, edges, filename);
      downloadJSON(diagram, `${filename}.json`);
    },
  },
] as const;
