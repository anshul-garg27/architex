"use client";

import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  X,
  Upload,
  ClipboardPaste,
  FileJson,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { importFromJSON, type ImportResult } from "@/lib/import/from-json";
import { useCanvasStore } from "@/stores/canvas-store";
import type { Node, Edge } from "@xyflow/react";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type Tab = "paste" | "upload";

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export const ImportDialog = memo(function ImportDialog({
  open,
  onClose,
}: ImportDialogProps) {
  const [activeTab, setActiveTab] = useState<Tab>("paste");
  const [pasteValue, setPasteValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{
    nodes: Node[];
    edges: Edge[];
  } | null>(null);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentNodes = useCanvasStore((s) => s.nodes);
  const setNodes = useCanvasStore((s) => s.setNodes);
  const setEdges = useCanvasStore((s) => s.setEdges);
  const clearCanvas = useCanvasStore((s) => s.clearCanvas);

  const canvasHasContent = currentNodes.length > 0;

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setPasteValue("");
      setError(null);
      setPreview(null);
      setConfirmReplace(false);
      setActiveTab("paste");
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // ── Validate & preview ──────────────────────────────────────
  const validateAndPreview = useCallback((input: string | object) => {
    setError(null);
    setPreview(null);
    setConfirmReplace(false);

    const result: ImportResult = importFromJSON(input);
    if ("error" in result) {
      setError(result.error);
      return;
    }

    setPreview(result);
  }, []);

  // ── Handle paste text change ────────────────────────────────
  const handlePasteChange = useCallback(
    (value: string) => {
      setPasteValue(value);
      if (value.trim().length === 0) {
        setError(null);
        setPreview(null);
        return;
      }
      validateAndPreview(value);
    },
    [validateAndPreview],
  );

  // ── Handle file upload ──────────────────────────────────────
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result;
        if (typeof text === "string") {
          setPasteValue(text);
          setActiveTab("paste");
          validateAndPreview(text);
        }
      };
      reader.onerror = () => {
        setError("Failed to read file.");
      };
      reader.readAsText(file);

      // Reset file input so the same file can be re-selected
      e.target.value = "";
    },
    [validateAndPreview],
  );

  // ── Apply import ────────────────────────────────────────────
  const applyImport = useCallback(() => {
    if (!preview) return;

    // If canvas has content and user hasn't confirmed yet, ask
    if (canvasHasContent && !confirmReplace) {
      setConfirmReplace(true);
      return;
    }

    clearCanvas();
    setNodes(preview.nodes);
    setEdges(preview.edges);
    onClose();
  }, [preview, canvasHasContent, confirmReplace, clearCanvas, setNodes, setEdges, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label="Import diagram"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="absolute left-1/2 top-1/2 w-full max-w-xl -translate-x-1/2 -translate-y-1/2">
        <div className="overflow-hidden rounded-xl border border-border bg-popover shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="text-lg font-semibold text-foreground">
              Import Diagram
            </h2>
            <button
              onClick={onClose}
              className="flex items-center justify-center rounded-md p-1.5 text-foreground-muted transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Tabs */}
          <div role="tablist" aria-label="Import method" className="flex border-b border-border">
            <button
              role="tab"
              aria-selected={activeTab === "paste"}
              onClick={() => setActiveTab("paste")}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors",
                activeTab === "paste"
                  ? "border-b-2 border-primary text-foreground"
                  : "text-foreground-muted hover:text-foreground",
              )}
            >
              <ClipboardPaste className="h-4 w-4" />
              Paste JSON
            </button>
            <button
              role="tab"
              aria-selected={activeTab === "upload"}
              onClick={() => setActiveTab("upload")}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors",
                activeTab === "upload"
                  ? "border-b-2 border-primary text-foreground"
                  : "text-foreground-muted hover:text-foreground",
              )}
            >
              <Upload className="h-4 w-4" />
              Upload File
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            {activeTab === "paste" ? (
              <textarea
                placeholder='Paste your diagram JSON here...'
                value={pasteValue}
                onChange={(e) => handlePasteChange(e.target.value)}
                rows={10}
                aria-label="Paste diagram JSON"
                aria-describedby={error ? "import-error" : undefined}
                className="w-full resize-none rounded-lg border border-border bg-background p-4 font-mono text-sm text-foreground outline-none placeholder:text-foreground-subtle focus:border-primary focus:ring-1 focus:ring-primary"
              />
            ) : (
              <div className="flex flex-col items-center gap-4 rounded-lg border-2 border-dashed border-border px-6 py-10 text-center">
                <FileJson className="h-10 w-10 text-foreground-muted" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Choose a JSON file
                  </p>
                  <p className="mt-1 text-xs text-foreground-muted">
                    Select a .json file exported from Architex
                  </p>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Browse Files
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  aria-label="Upload diagram JSON file"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            )}

            {/* Error */}
            {error && (
              <div id="import-error" role="alert" className="mt-4 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Preview */}
            {preview && !error && (
              <div className="mt-4 flex items-center gap-4 rounded-lg border border-border bg-accent/30 px-4 py-3">
                <FileJson className="h-5 w-5 shrink-0 text-primary" />
                <div className="flex-1 text-sm text-foreground">
                  <span className="font-medium">
                    {preview.nodes.length} node
                    {preview.nodes.length !== 1 ? "s" : ""}
                  </span>
                  {", "}
                  <span className="font-medium">
                    {preview.edges.length} edge
                    {preview.edges.length !== 1 ? "s" : ""}
                  </span>
                  {" ready to import"}
                </div>
              </div>
            )}

            {/* Confirmation warning */}
            {confirmReplace && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-400" />
                <p className="text-sm text-yellow-400">
                  This will replace your current canvas ({currentNodes.length}{" "}
                  node{currentNodes.length !== 1 ? "s" : ""}). Click
                  &ldquo;Import&rdquo; again to confirm.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
            <button
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-foreground-muted transition-colors hover:bg-accent hover:text-foreground"
            >
              Cancel
            </button>
            <button
              onClick={applyImport}
              disabled={!preview || !!error}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                preview && !error
                  ? confirmReplace
                    ? "bg-yellow-600 text-white hover:bg-yellow-600/90"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "cursor-not-allowed bg-accent text-foreground-muted",
              )}
            >
              <Upload className="h-4 w-4" />
              {confirmReplace ? "Replace & Import" : "Import"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
