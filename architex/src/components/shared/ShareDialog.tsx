"use client";

// ─────────────────────────────────────────────────────────────
// Architex — Share Dialog (COL-008 UI)
// ─────────────────────────────────────────────────────────────

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Link2,
  X,
  Copy,
  Check,
  QrCode,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCanvasStore } from "@/stores/canvas-store";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { createShareableLink } from "@/lib/collaboration/shareable-links";
import type { ShareableDiagram } from "@/lib/collaboration/shareable-links";
import { toast } from "@/components/ui/toast";

/* Brand SVG icons (lucide-react removed brand icons in v0.300+) */
function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

// ── Props ─────────────────────────────────────────────────────

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
}

// ── Component ─────────────────────────────────────────────────

export const ShareDialog = memo(function ShareDialog({
  open,
  onClose,
  title = "Untitled Design",
}: ShareDialogProps) {
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);

  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { containerRef, handleKeyDown: trapKeyDown } = useFocusTrap({
    active: open,
    onEscape: onClose,
  });

  // Reset copied state when dialog closes
  useEffect(() => {
    if (!open) {
      setCopied(false);
    }
  }, [open]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  // Generate shareable link
  const linkResult = useMemo(() => {
    if (!open) return null;

    const diagram: ShareableDiagram = {
      title,
      nodes,
      edges,
      version: 1,
    };

    return createShareableLink(diagram);
  }, [open, title, nodes, edges]);

  const shareUrl = linkResult?.ok ? linkResult.url : "";
  const linkError = linkResult && !linkResult.ok ? linkResult.error : null;

  // Copy to clipboard
  const handleCopy = useCallback(async () => {
    if (!shareUrl) return;
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast("success", "Link copied to clipboard!");
      copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for non-secure contexts
      const textarea = document.createElement("textarea");
      textarea.value = shareUrl;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      toast("success", "Link copied to clipboard!");
      copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
    }
  }, [shareUrl]);

  // Social share handlers
  const handleShareTwitter = useCallback(() => {
    if (!shareUrl) return;
    const text = encodeURIComponent(`Check out my system design: "${title}" — built with Architex`);
    const url = encodeURIComponent(shareUrl);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank", "noopener");
  }, [shareUrl, title]);

  const handleShareLinkedIn = useCallback(() => {
    if (!shareUrl) return;
    const url = encodeURIComponent(shareUrl);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, "_blank", "noopener");
  }, [shareUrl]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        ref={containerRef as React.RefObject<HTMLDivElement>}
        role="dialog"
        aria-modal="true"
        aria-label="Share design"
        tabIndex={-1}
        onKeyDown={trapKeyDown}
        className={cn(
          "relative z-10 w-full max-w-md",
          "rounded-xl border border-border/50 bg-surface-elevated shadow-2xl",
          "p-6",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">
              Share Design
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-surface-hover hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Shareable link */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Shareable Link
            </label>

            {linkError ? (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                {linkError}
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className={cn(
                    "flex-1 rounded-lg border border-border/50 bg-surface px-3 py-2",
                    "text-sm text-foreground font-mono truncate",
                    "focus:outline-none focus:ring-2 focus:ring-primary/40",
                  )}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <button
                  onClick={handleCopy}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    copied
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-primary/10 text-primary hover:bg-primary/20",
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
            )}
          </div>

          {/* QR Code placeholder */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              QR Code
            </label>
            <div className="flex items-center justify-center rounded-lg border border-dashed border-border/50 bg-surface/50 p-8">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <QrCode className="h-10 w-10 opacity-40" />
                <span className="text-xs">QR Code — coming soon</span>
              </div>
            </div>
          </div>

          {/* Social share */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Share on Social
            </label>
            <div className="flex gap-2">
              <button
                onClick={handleShareTwitter}
                disabled={!!linkError}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  "bg-[#1DA1F2]/10 text-[#1DA1F2] hover:bg-[#1DA1F2]/20",
                  "disabled:opacity-40 disabled:cursor-not-allowed",
                )}
              >
                <TwitterIcon className="h-4 w-4" />
                Twitter
              </button>
              <button
                onClick={handleShareLinkedIn}
                disabled={!!linkError}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  "bg-[#0A66C2]/10 text-[#0A66C2] hover:bg-[#0A66C2]/20",
                  "disabled:opacity-40 disabled:cursor-not-allowed",
                )}
              >
                <LinkedInIcon className="h-4 w-4" />
                LinkedIn
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
