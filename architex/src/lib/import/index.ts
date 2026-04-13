// ─────────────────────────────────────────────────────────────
// Import — barrel file
// ─────────────────────────────────────────────────────────────

export { parseArchitexJSON } from "./json-parser";
export type { ParsedDiagram, ParsedMetadata, ParseError, ParseResult } from "./json-parser";

export { importFromJSON } from "./from-json";
export type { ImportResult } from "./from-json";

export { parseDrawioXML } from "./drawio-parser";
export type { DrawioParseResult } from "./drawio-parser";

export { importFromDrawio } from "./from-drawio";
export type { DrawioImportResult } from "./from-drawio";

export { parseYAMLArchitecture } from "./yaml-parser";
export type { YAMLParseResult } from "./yaml-parser";

export { parseMermaidDiagram } from "./mermaid-parser";
export type { MermaidParseResult } from "./mermaid-parser";

export { detectFormat } from "./format-detector";
export type { DiagramFormat } from "./format-detector";

export { handleClipboardPaste } from "./clipboard-handler";
export type { ClipboardImportResult } from "./clipboard-handler";

export { handleFileDrop } from "./drag-drop-handler";
export type { FileDropResult } from "./drag-drop-handler";

export { importFromExcalidraw, isExcalidrawFile } from "./excalidraw-importer";
export type { ExcalidrawImportResult } from "./excalidraw-importer";

export { importFromK8sYAML, isK8sYAML } from "./k8s-yaml-importer";
export type { K8sImportResult } from "./k8s-yaml-importer";
