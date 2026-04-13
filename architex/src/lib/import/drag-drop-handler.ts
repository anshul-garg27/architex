import type { Node, Edge } from "@xyflow/react";
import { detectFormat, type DiagramFormat } from "./format-detector";
import { parseMermaidDiagram } from "./mermaid-parser";
import { parseArchitexJSON } from "./json-parser";
import { parseDrawioXML } from "./drawio-parser";
import { parseYAMLArchitecture } from "./yaml-parser";
import { toast } from "@/components/ui/toast";

// ─────────────────────────────────────────────────────────────
// Drag & Drop File Handler (INF-017)
// Reads dropped files, auto-detects format, and parses into
// Architex canvas nodes and edges.
// ─────────────────────────────────────────────────────────────

/** Successful file drop import result. */
export interface FileDropResult {
  nodes: Node[];
  edges: Edge[];
  format: DiagramFormat;
  fileName: string;
}

/** Extensions we accept for diagram import. */
const ACCEPTED_EXTENSIONS = new Set([
  ".json",
  ".drawio",
  ".xml",
  ".md",
  ".mmd",
  ".yaml",
  ".yml",
]);

/**
 * Handle files dropped onto the canvas.
 *
 * Accepts `.json`, `.drawio`, `.xml`, `.md`, `.mmd`, `.yaml`, and `.yml`.
 * Reads file content via `FileReader`, auto-detects the format, and
 * routes to the correct parser. Shows toast notifications on success
 * or failure.
 *
 * Only processes the first valid file in the list.
 *
 * @returns Parsed diagram data or `null` if no valid file was found.
 */
export async function handleFileDrop(
  files: FileList | File[],
): Promise<FileDropResult | null> {
  const fileArray = Array.from(files);

  if (fileArray.length === 0) {
    return null;
  }

  // Find the first file with an accepted extension
  const file = fileArray.find((f) => {
    const ext = getExtension(f.name);
    return ACCEPTED_EXTENSIONS.has(ext);
  });

  if (!file) {
    const extensions = [...ACCEPTED_EXTENSIONS].join(", ");
    toast(
      "error",
      `Unsupported file type. Accepted: ${extensions}`,
    );
    return null;
  }

  // Read file content
  let content: string;
  try {
    content = await readFileAsText(file);
  } catch {
    toast("error", `Failed to read file "${file.name}".`);
    return null;
  }

  if (!content || content.trim().length === 0) {
    toast("error", `File "${file.name}" is empty.`);
    return null;
  }

  // Detect format — use extension as a hint, then fall back to content detection
  const format = detectFormatWithHint(file.name, content);

  if (format === "unknown") {
    toast(
      "error",
      `Could not detect diagram format in "${file.name}".`,
    );
    return null;
  }

  // Parse
  const result = parseDiagramContent(content, format);

  if (result) {
    toast(
      "success",
      `Imported ${result.nodes.length} node${result.nodes.length !== 1 ? "s" : ""} from "${file.name}" (${format})`,
    );
    return { ...result, format, fileName: file.name };
  }

  toast("error", `Failed to parse "${file.name}" as ${format}.`);
  return null;
}

// ── Helpers ───────────────────────────────────────────────────

function getExtension(name: string): string {
  const dotIdx = name.lastIndexOf(".");
  if (dotIdx === -1) return "";
  return name.slice(dotIdx).toLowerCase();
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("FileReader did not return a string."));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

/**
 * Detect format using the file extension as a strong hint,
 * falling back to content-based detection.
 */
function detectFormatWithHint(fileName: string, content: string): DiagramFormat {
  const ext = getExtension(fileName);

  switch (ext) {
    case ".json":
      return "json";
    case ".drawio":
    case ".xml":
      return "drawio";
    case ".mmd":
      return "mermaid";
    case ".md": {
      // Markdown files might contain a mermaid code block — extract it
      const mermaidBlock = extractMermaidFromMarkdown(content);
      if (mermaidBlock) return "mermaid";
      // Fall through to content detection
      return detectFormat(content);
    }
    case ".yaml":
    case ".yml":
      return "yaml";
    default:
      return detectFormat(content);
  }
}

/**
 * Extract a mermaid code block from markdown content.
 * Returns the inner content if found, otherwise null.
 */
function extractMermaidFromMarkdown(content: string): string | null {
  const match = /```mermaid\s*\n([\s\S]*?)```/.exec(content);
  return match ? match[1].trim() : null;
}

// ── Parser Router ─────────────────────────────────────────────

function parseDiagramContent(
  content: string,
  format: DiagramFormat,
): { nodes: Node[]; edges: Edge[] } | null {
  // For markdown files, extract the mermaid block first
  let text = content;
  if (format === "mermaid") {
    const extracted = extractMermaidFromMarkdown(content);
    if (extracted) {
      text = extracted;
    }
  }

  switch (format) {
    case "json": {
      const r = parseArchitexJSON(text);
      return r.ok ? { nodes: r.data.nodes, edges: r.data.edges } : null;
    }
    case "drawio": {
      const r = parseDrawioXML(text);
      return r.ok ? { nodes: r.nodes, edges: r.edges } : null;
    }
    case "mermaid": {
      const r = parseMermaidDiagram(text);
      return r.ok ? { nodes: r.nodes, edges: r.edges } : null;
    }
    case "yaml": {
      const r = parseYAMLArchitecture(text);
      return r.ok ? { nodes: r.nodes, edges: r.edges } : null;
    }
    default:
      return null;
  }
}
