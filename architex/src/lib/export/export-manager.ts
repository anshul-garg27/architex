import type { Node, Edge } from '@xyflow/react';
import { exportToJSON } from './to-json';
import type { DiagramJSON } from './to-json';
import { exportToMermaid } from './to-mermaid';
import { exportToPlantUML } from './to-plantuml';
import { exportToTerraform } from './to-terraform';
import { exportToDrawio } from './to-drawio';
import { exportToPNG } from './to-png';
import type { PNGExportOptions } from './to-png';
import { exportToSVG } from './to-svg';
import type { SVGExportOptions } from './to-svg';
import { exportToTerraformHCL } from './terraform-exporter';
import { exportToC4 } from './c4-exporter';
import type { C4ExportOptions } from './c4-exporter';
import { exportToExcalidraw, exportToExcalidrawJSON } from './excalidraw-exporter';
import type { ExcalidrawData } from './excalidraw-exporter';

// ─────────────────────────────────────────────────────────────
// Export Manager (IO-006)
// Unified coordinator for all export formats. Provides a
// single class with methods for every supported output format.
// ─────────────────────────────────────────────────────────────

/** All supported export format identifiers. */
export type ExportFormat =
  | 'json'
  | 'mermaid'
  | 'plantuml'
  | 'terraform'
  | 'terraform-hcl'
  | 'drawio'
  | 'c4-structurizr'
  | 'c4-plantuml'
  | 'excalidraw'
  | 'png'
  | 'svg';

/** Metadata about an export format. */
export interface ExportFormatInfo {
  id: ExportFormat;
  label: string;
  description: string;
  fileExtension: string;
  mimeType: string;
  /** Whether the export requires a DOM context (e.g., PNG/SVG). */
  requiresDOM: boolean;
}

/** All available export formats with their metadata. */
export const EXPORT_FORMATS: ExportFormatInfo[] = [
  {
    id: 'json',
    label: 'JSON',
    description: 'Architex native JSON format (lossless round-trip)',
    fileExtension: '.json',
    mimeType: 'application/json',
    requiresDOM: false,
  },
  {
    id: 'mermaid',
    label: 'Mermaid',
    description: 'Mermaid flowchart syntax for docs and wikis',
    fileExtension: '.mmd',
    mimeType: 'text/plain',
    requiresDOM: false,
  },
  {
    id: 'plantuml',
    label: 'PlantUML',
    description: 'PlantUML component diagram',
    fileExtension: '.puml',
    mimeType: 'text/plain',
    requiresDOM: false,
  },
  {
    id: 'terraform',
    label: 'Terraform (basic)',
    description: 'Terraform HCL skeleton (basic mapper)',
    fileExtension: '.tf',
    mimeType: 'text/plain',
    requiresDOM: false,
  },
  {
    id: 'terraform-hcl',
    label: 'Terraform HCL',
    description: 'Terraform HCL with full resource mapping',
    fileExtension: '.tf',
    mimeType: 'text/plain',
    requiresDOM: false,
  },
  {
    id: 'drawio',
    label: 'draw.io',
    description: 'draw.io / diagrams.net mxGraph XML',
    fileExtension: '.drawio',
    mimeType: 'application/xml',
    requiresDOM: false,
  },
  {
    id: 'c4-structurizr',
    label: 'C4 (Structurizr)',
    description: 'C4 model in Structurizr DSL format',
    fileExtension: '.dsl',
    mimeType: 'text/plain',
    requiresDOM: false,
  },
  {
    id: 'c4-plantuml',
    label: 'C4 (PlantUML)',
    description: 'C4 model in PlantUML C4 format',
    fileExtension: '.puml',
    mimeType: 'text/plain',
    requiresDOM: false,
  },
  {
    id: 'excalidraw',
    label: 'Excalidraw',
    description: 'Excalidraw JSON for collaborative whiteboarding',
    fileExtension: '.excalidraw',
    mimeType: 'application/json',
    requiresDOM: false,
  },
  {
    id: 'png',
    label: 'PNG Image',
    description: 'Rasterized PNG image of the canvas',
    fileExtension: '.png',
    mimeType: 'image/png',
    requiresDOM: true,
  },
  {
    id: 'svg',
    label: 'SVG Image',
    description: 'Scalable vector graphic of the canvas',
    fileExtension: '.svg',
    mimeType: 'image/svg+xml',
    requiresDOM: true,
  },
];

/**
 * Unified export manager that coordinates all available export formats.
 *
 * Usage:
 * ```ts
 * const manager = new ExportManager(nodes, edges);
 * const terraform = manager.toTerraform();
 * const c4 = manager.toC4();
 * const json = manager.toJSON('My Diagram');
 * ```
 */
export class ExportManager {
  private readonly nodes: Node[];
  private readonly edges: Edge[];

  constructor(nodes: Node[], edges: Edge[]) {
    this.nodes = nodes;
    this.edges = edges;
  }

  // ── String-based exports (no DOM required) ──────────────

  /**
   * Export as Architex native JSON format.
   * Supports lossless round-tripping with importFromJSON.
   */
  toJSON(name?: string): DiagramJSON {
    return exportToJSON(this.nodes, this.edges, name);
  }

  /**
   * Export as a JSON string (stringified DiagramJSON).
   */
  toJSONString(name?: string): string {
    return JSON.stringify(this.toJSON(name), null, 2);
  }

  /**
   * Export as Mermaid flowchart syntax.
   */
  toMermaid(): string {
    return exportToMermaid(this.nodes, this.edges);
  }

  /**
   * Export as PlantUML component diagram.
   */
  toPlantUML(): string {
    return exportToPlantUML(this.nodes, this.edges);
  }

  /**
   * Export as Terraform HCL (basic mapper from to-terraform.ts).
   */
  toTerraformBasic(): string {
    return exportToTerraform(this.nodes, this.edges);
  }

  /**
   * Export as Terraform HCL with full resource mapping.
   */
  toTerraform(): string {
    return exportToTerraformHCL(this.nodes, this.edges);
  }

  /**
   * Export as draw.io / diagrams.net mxGraph XML.
   */
  toDrawio(): string {
    return exportToDrawio(this.nodes, this.edges);
  }

  /**
   * Export as C4 model in Structurizr DSL or PlantUML C4 format.
   */
  toC4(options?: C4ExportOptions): string {
    return exportToC4(this.nodes, this.edges, options);
  }

  /**
   * Export as Excalidraw scene data object.
   */
  toExcalidraw(): ExcalidrawData {
    return exportToExcalidraw(this.nodes, this.edges);
  }

  /**
   * Export as Excalidraw JSON string.
   */
  toExcalidrawJSON(): string {
    return exportToExcalidrawJSON(this.nodes, this.edges);
  }

  // ── DOM-dependent exports ─────────────────────────────────

  /**
   * Export as PNG image blob.
   * Requires a DOM context with a rendered React Flow canvas.
   */
  async toPNG(options?: PNGExportOptions): Promise<Blob> {
    return exportToPNG(options ?? {});
  }

  /**
   * Export as self-contained SVG string.
   * Requires a DOM context with a rendered React Flow canvas.
   */
  toSVG(options?: SVGExportOptions): string {
    return exportToSVG(options);
  }

  // ── Generic export by format ID ───────────────────────────

  /**
   * Export the diagram in the specified format.
   *
   * Returns a string for text-based formats, or a Promise<Blob> for
   * binary formats (PNG). Throws if the format requires DOM and DOM
   * is not available.
   */
  exportAs(format: ExportFormat): string | DiagramJSON | ExcalidrawData | Promise<Blob> {
    switch (format) {
      case 'json':
        return this.toJSON();
      case 'mermaid':
        return this.toMermaid();
      case 'plantuml':
        return this.toPlantUML();
      case 'terraform':
        return this.toTerraformBasic();
      case 'terraform-hcl':
        return this.toTerraform();
      case 'drawio':
        return this.toDrawio();
      case 'c4-structurizr':
        return this.toC4({ format: 'structurizr' });
      case 'c4-plantuml':
        return this.toC4({ format: 'plantuml' });
      case 'excalidraw':
        return this.toExcalidraw();
      case 'png':
        return this.toPNG();
      case 'svg':
        return this.toSVG();
      default: {
        const _exhaustive: never = format;
        throw new Error(`Unknown export format: ${_exhaustive}`);
      }
    }
  }

  // ── Utility methods ───────────────────────────────────────

  /**
   * Returns the list of available export formats.
   */
  static getFormats(): ExportFormatInfo[] {
    return EXPORT_FORMATS;
  }

  /**
   * Returns only formats that do not require a DOM context
   * (safe for server-side or worker usage).
   */
  static getServerSafeFormats(): ExportFormatInfo[] {
    return EXPORT_FORMATS.filter((f) => !f.requiresDOM);
  }

  /**
   * Get metadata for a specific format.
   */
  static getFormatInfo(format: ExportFormat): ExportFormatInfo | undefined {
    return EXPORT_FORMATS.find((f) => f.id === format);
  }

  /**
   * Generate a suggested filename for the given format and diagram name.
   */
  static suggestFilename(format: ExportFormat, diagramName?: string): string {
    const info = ExportManager.getFormatInfo(format);
    const ext = info?.fileExtension ?? '.txt';
    const baseName = (diagramName ?? 'architex-diagram')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    return `${baseName}${ext}`;
  }

  /**
   * Trigger a browser download for a text-based export.
   * For PNG, use toPNG() and handle the blob manually.
   */
  download(format: Exclude<ExportFormat, 'png'>, diagramName?: string): void {
    const content = this.exportAs(format);

    if (content instanceof Promise) {
      throw new Error(
        `Format "${format}" returns a Promise — use toPNG() for binary formats.`,
      );
    }

    const text = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
    const info = ExportManager.getFormatInfo(format);
    const mimeType = info?.mimeType ?? 'text/plain';
    const filename = ExportManager.suggestFilename(format, diagramName);

    const blob = new Blob([text], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();

    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }
}
