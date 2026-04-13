"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FileJson,
  GitBranch,
  FileCode,
  Cloud,
  Link2,
  X,
  Copy,
  Check,
  Download,
  Image,
  FileImage,
  FileText,
  Share2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCanvasStore } from "@/stores/canvas-store";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import {
  exportToJSON,
  downloadJSON,
  exportToMermaid,
  exportToPlantUML,
  exportToTerraform,
  generateShareableURL,
  downloadPNG,
  downloadSVG,
  downloadPDF,
  downloadDrawio,
} from "@/lib/export";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type ExportFormat = "json" | "png" | "svg" | "pdf" | "mermaid" | "plantuml" | "terraform" | "drawio" | "share";

interface FormatCard {
  id: ExportFormat;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const FORMATS: FormatCard[] = [
  {
    id: "json",
    name: "JSON",
    description: "Portable diagram file for import/export",
    icon: FileJson,
  },
  {
    id: "png",
    name: "PNG Image",
    description: "High-resolution raster image (2x retina)",
    icon: Image,
  },
  {
    id: "svg",
    name: "SVG Image",
    description: "Scalable vector graphic with embedded styles",
    icon: FileImage,
  },
  {
    id: "pdf",
    name: "PDF Document",
    description: "Portable document with title page and diagram",
    icon: FileText,
  },
  {
    id: "mermaid",
    name: "Mermaid",
    description: "Flowchart syntax for docs and markdown",
    icon: GitBranch,
  },
  {
    id: "plantuml",
    name: "PlantUML",
    description: "Component diagram for architecture docs",
    icon: FileCode,
  },
  {
    id: "terraform",
    name: "Terraform",
    description: "AWS infrastructure as code (approximate)",
    icon: Cloud,
  },
  {
    id: "drawio",
    name: "draw.io",
    description: "Editable diagram for diagrams.net / draw.io",
    icon: Share2,
  },
  {
    id: "share",
    name: "Share Link",
    description: "Shareable URL with embedded diagram",
    icon: Link2,
  },
];

// ─────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export const ExportDialog = memo(function ExportDialog({
  open,
  onClose,
}: ExportDialogProps) {
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);

  const [activeFormat, setActiveFormat] = useState<ExportFormat | null>(null);
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const { containerRef, handleKeyDown: trapKeyDown } = useFocusTrap({
    active: open,
    onEscape: onClose,
  });

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setActiveFormat(null);
      setCopied(false);
      setExporting(false);
      setExportError(null);
    }
  }, [open]);

  // Generate preview content for the active format
  const previewContent = useMemo(() => {
    if (!activeFormat) return "";
    switch (activeFormat) {
      case "mermaid":
        return exportToMermaid(nodes, edges);
      case "plantuml":
        return exportToPlantUML(nodes, edges);
      case "terraform":
        return exportToTerraform(nodes, edges);
      case "share":
        return generateShareableURL(nodes, edges);
      default:
        return "";
    }
  }, [activeFormat, nodes, edges]);

  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup copy timer on unmount or dialog close
  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const handleCopy = useCallback(async () => {
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    try {
      await navigator.clipboard.writeText(previewContent);
      setCopied(true);
      copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for non-secure contexts
      const textarea = document.createElement("textarea");
      textarea.value = previewContent;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
    }
  }, [previewContent]);

  const handleExport = useCallback(
    async (format: ExportFormat) => {
      setExportError(null);

      if (format === "json") {
        const diagram = exportToJSON(nodes, edges);
        downloadJSON(diagram);
        return;
      }

      if (format === "png") {
        setExporting(true);
        try {
          await downloadPNG();
        } catch (err) {
          setExportError(
            err instanceof Error ? err.message : "PNG export failed.",
          );
        } finally {
          setExporting(false);
        }
        return;
      }

      if (format === "svg") {
        try {
          downloadSVG();
        } catch (err) {
          setExportError(
            err instanceof Error ? err.message : "SVG export failed.",
          );
        }
        return;
      }

      if (format === "pdf") {
        setExporting(true);
        try {
          await downloadPDF();
        } catch (err) {
          setExportError(
            err instanceof Error ? err.message : "PDF export failed.",
          );
        } finally {
          setExporting(false);
        }
        return;
      }

      if (format === "drawio") {
        try {
          downloadDrawio(nodes, edges);
        } catch (err) {
          setExportError(
            err instanceof Error ? err.message : "draw.io export failed.",
          );
        }
        return;
      }

      // For text formats and share link, show preview
      setActiveFormat(format);
      setCopied(false);
    },
    [nodes, edges],
  );

  const handleBack = useCallback(() => {
    setActiveFormat(null);
    setCopied(false);
  }, []);

  if (!open) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label="Export diagram"
      onKeyDown={trapKeyDown}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="absolute left-1/2 top-1/2 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2">
        <div className="overflow-hidden rounded-xl border border-border bg-popover shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div className="flex items-center gap-3">
              {activeFormat && (
                <button
                  onClick={handleBack}
                  className="flex items-center justify-center rounded-md p-1 text-foreground-muted transition-colors hover:bg-accent hover:text-foreground"
                  aria-label="Back to format selection"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M10 12L6 8L10 4" />
                  </svg>
                </button>
              )}
              <h2 className="text-lg font-semibold text-foreground">
                {activeFormat
                  ? `Export as ${FORMATS.find((f) => f.id === activeFormat)?.name ?? ""}`
                  : "Export Diagram"}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="flex items-center justify-center rounded-md p-1.5 text-foreground-muted transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            {activeFormat === null ? (
              /* ── Format selection cards ── */
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {FORMATS.map((format) => {
                    const Icon = format.icon;
                    return (
                      <button
                        key={format.id}
                        onClick={() => handleExport(format.id)}
                        disabled={exporting}
                        className={cn(
                          "group flex items-start gap-4 rounded-lg border border-border p-4 text-left transition-all",
                          "hover:border-primary/50 hover:bg-accent/50",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-popover",
                          exporting && "pointer-events-none opacity-50",
                        )}
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-foreground-muted transition-colors group-hover:bg-primary/15 group-hover:text-primary">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">
                              {format.name}
                            </span>
                            {(format.id === "json" ||
                              format.id === "png" ||
                              format.id === "svg" ||
                              format.id === "pdf" ||
                              format.id === "drawio") && (
                              <Download className="h-3.5 w-3.5 text-foreground-muted" />
                            )}
                          </div>
                          <p className="mt-0.5 text-sm text-foreground-muted">
                            {format.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {exporting && (
                  <p className="mt-3 text-sm text-foreground-muted animate-pulse">
                    Generating export...
                  </p>
                )}
                {exportError && (
                  <p className="mt-3 text-sm text-red-400">
                    {exportError}
                  </p>
                )}
              </>
            ) : activeFormat === "share" ? (
              /* ── Share link view ── */
              <div className="space-y-4">
                <p className="text-sm text-foreground-muted">
                  Anyone with this link can view your diagram.
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={previewContent}
                    aria-label="Shareable diagram link"
                    className="h-10 flex-1 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    onFocus={(e) => e.currentTarget.select()}
                  />
                  <button
                    onClick={handleCopy}
                    className={cn(
                      "flex h-10 shrink-0 items-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors",
                      copied
                        ? "bg-green-600/20 text-green-400"
                        : "bg-primary text-primary-foreground hover:bg-primary/90",
                    )}
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* ── Text preview (Mermaid / PlantUML / Terraform) ── */
              <div className="space-y-4">
                <textarea
                  readOnly
                  value={previewContent}
                  rows={14}
                  aria-label="Export preview"
                  className="w-full resize-none rounded-lg border border-border bg-background p-4 font-mono text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  onFocus={(e) => e.currentTarget.select()}
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleCopy}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                      copied
                        ? "bg-green-600/20 text-green-400"
                        : "bg-primary text-primary-foreground hover:bg-primary/90",
                    )}
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4" />
                        Copied to clipboard
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy to Clipboard
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {activeFormat === null && (
            <div className="border-t border-border px-6 py-3">
              <p className="text-xs text-foreground-subtle">
                {nodes.length} node{nodes.length !== 1 ? "s" : ""},{" "}
                {edges.length} edge{edges.length !== 1 ? "s" : ""} in diagram
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
