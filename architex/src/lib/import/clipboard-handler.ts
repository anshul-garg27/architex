import type { Node, Edge } from "@xyflow/react";
import { detectFormat } from "./format-detector";
import { parseMermaidDiagram } from "./mermaid-parser";
import { parseArchitexJSON } from "./json-parser";
import { parseDrawioXML } from "./drawio-parser";
import { parseYAMLArchitecture } from "./yaml-parser";
import { toast } from "@/components/ui/toast";

// ─────────────────────────────────────────────────────────────
// Clipboard Paste Handler (INF-016)
// Reads diagram data from clipboard and auto-detects format.
// ─────────────────────────────────────────────────────────────

/** Successful clipboard import result. */
export interface ClipboardImportResult {
  nodes: Node[];
  edges: Edge[];
  format: string;
}

/**
 * Handle a paste event, attempting to parse diagram data from
 * the clipboard.
 *
 * Reads `text/plain` and `text/html` MIME types, auto-detects
 * the format, and routes to the correct parser.
 *
 * Shows a toast notification on success or failure.
 *
 * @returns Parsed diagram data or `null` if the clipboard content
 *          is not a recognised diagram format.
 */
export async function handleClipboardPaste(
  event: ClipboardEvent,
): Promise<ClipboardImportResult | null> {
  const clipboardData = event.clipboardData;
  if (!clipboardData) {
    return null;
  }

  // Prefer text/plain; fall back to text/html (some apps paste HTML)
  let content = clipboardData.getData("text/plain");
  if (!content) {
    const html = clipboardData.getData("text/html");
    if (html) {
      // Strip HTML tags to get raw text
      content = html.replace(/<[^>]*>/g, "").trim();
    }
  }

  if (!content || content.trim().length === 0) {
    return null;
  }

  const format = detectFormat(content);

  if (format === "unknown") {
    // Not a diagram — let the browser handle the paste normally
    return null;
  }

  // Prevent default browser paste since we're handling it
  event.preventDefault();

  const result = parseDiagramContent(content, format);

  if (result) {
    toast(
      "success",
      `Imported ${result.nodes.length} node${result.nodes.length !== 1 ? "s" : ""} from clipboard (${format})`,
    );
    return { ...result, format };
  }

  toast("error", `Failed to parse ${format} diagram from clipboard.`);
  return null;
}

// ── Internal ──────────────────────────────────────────────────

function parseDiagramContent(
  content: string,
  format: string,
): { nodes: Node[]; edges: Edge[] } | null {
  switch (format) {
    case "json": {
      const r = parseArchitexJSON(content);
      return r.ok ? { nodes: r.data.nodes, edges: r.data.edges } : null;
    }
    case "drawio": {
      const r = parseDrawioXML(content);
      return r.ok ? { nodes: r.nodes, edges: r.edges } : null;
    }
    case "mermaid": {
      const r = parseMermaidDiagram(content);
      return r.ok ? { nodes: r.nodes, edges: r.edges } : null;
    }
    case "yaml": {
      const r = parseYAMLArchitecture(content);
      return r.ok ? { nodes: r.nodes, edges: r.edges } : null;
    }
    default:
      return null;
  }
}
