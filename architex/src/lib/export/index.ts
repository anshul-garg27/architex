// ─────────────────────────────────────────────────────────────
// Export — barrel file
// ─────────────────────────────────────────────────────────────

export { exportToJSON, importFromJSON, downloadJSON } from './to-json';
export type { DiagramJSON } from './to-json';

export { exportToMermaid, copyMermaidToClipboard } from './to-mermaid';

export { exportToPlantUML, copyPlantUMLToClipboard } from './to-plantuml';

export { exportToTerraform } from './to-terraform';

export { encodeToURL, decodeFromURL, generateShareableURL } from './to-url';

export { exportToPNG, downloadPNG, blobToDataURL } from './to-png';
export type { PNGExportOptions } from './to-png';

export { exportToSVG, downloadSVG } from './to-svg';
export type { SVGExportOptions } from './to-svg';

export { exportToPDF, downloadPDF } from './to-pdf';
export type { PDFExportOptions } from './to-pdf';

export { exportToDrawio, downloadDrawio } from './to-drawio';

export { GifRecorder, downloadRecording } from './gif-recorder';
export type { RecorderOptions, RecorderState, RecorderEvent } from './gif-recorder';

export { exportToTerraformHCL, previewTerraformMapping } from './terraform-exporter';

export { exportToC4, previewC4Elements } from './c4-exporter';
export type { C4ExportOptions, C4OutputFormat } from './c4-exporter';

export { exportToExcalidraw, exportToExcalidrawJSON } from './excalidraw-exporter';
export type { ExcalidrawData } from './excalidraw-exporter';

export { ExportManager, EXPORT_FORMATS } from './export-manager';
export type { ExportFormat, ExportFormatInfo } from './export-manager';
