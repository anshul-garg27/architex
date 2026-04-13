"use client";

import React, { memo, useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Award, X, Download } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { DS_CATALOG } from "@/lib/data-structures/catalog";
import type { DSCategory } from "@/lib/data-structures/types";
import { getModuleProgress } from "@/lib/progress/module-progress";

// ── Badge definitions ─────────────────────────────────────────

interface BadgeDef {
  id: string;
  title: string;
  category: DSCategory | "all";
  icon: string;
  color: string;
  bgColor: string;
  description: string;
}

const BADGE_DEFS: BadgeDef[] = [
  {
    id: "linear-explorer",
    title: "Linear Explorer",
    category: "linear",
    icon: "L",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    description: "Explore all linear data structures",
  },
  {
    id: "tree-master",
    title: "Tree Master",
    category: "tree",
    icon: "T",
    color: "text-green-400",
    bgColor: "bg-green-500/10",
    description: "Explore all tree data structures",
  },
  {
    id: "hash-expert",
    title: "Hash Expert",
    category: "hash",
    icon: "H",
    color: "text-pink-400",
    bgColor: "bg-pink-500/10",
    description: "Explore all hash data structures",
  },
  {
    id: "heap-pro",
    title: "Heap Pro",
    category: "heap",
    icon: "P",
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    description: "Explore all heap data structures",
  },
  {
    id: "probability-wizard",
    title: "Probability Wizard",
    category: "probabilistic",
    icon: "W",
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
    description: "Explore all probabilistic data structures",
  },
  {
    id: "system-architect",
    title: "System Architect",
    category: "system",
    icon: "S",
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
    description: "Explore all system data structures",
  },
  {
    id: "ds-master",
    title: "DS Master",
    category: "all",
    icon: "\u{1F3C6}",
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/10",
    description: "Explore all 39 data structures",
  },
];

// ── Badge computation ─────────────────────────────────────────

function getCategoryDSIds(category: DSCategory | "all"): string[] {
  if (category === "all") return DS_CATALOG.map((d) => d.id);
  return DS_CATALOG.filter((d) => d.category === category).map((d) => d.id);
}

interface BadgeStatus {
  badge: BadgeDef;
  earned: boolean;
  explored: number;
  total: number;
}

function computeBadgeStatuses(exploredSet: Set<string>): BadgeStatus[] {
  return BADGE_DEFS.map((badge) => {
    const dsIds = getCategoryDSIds(badge.category);
    const explored = dsIds.filter((id) => exploredSet.has(id)).length;
    return {
      badge,
      earned: explored >= dsIds.length,
      explored,
      total: dsIds.length,
    };
  });
}

// ── Certificate modal ─────────────────────────────────────────

const CertificateModal = memo(function CertificateModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const generateCertificate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = 800;
    const h = 560;
    canvas.width = w;
    canvas.height = h;

    // Background
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, w, h);

    // Border
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 4;
    ctx.strokeRect(16, 16, w - 32, h - 32);

    // Inner border
    ctx.strokeStyle = "#fbbf2440";
    ctx.lineWidth = 1;
    ctx.strokeRect(24, 24, w - 48, h - 48);

    // Title
    ctx.fillStyle = "#fbbf24";
    ctx.font = "bold 32px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("CERTIFICATE OF MASTERY", w / 2, 80);

    // Divider
    ctx.strokeStyle = "#fbbf2440";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(200, 100);
    ctx.lineTo(600, 100);
    ctx.stroke();

    // Trophy
    ctx.font = "48px serif";
    ctx.fillText("\u{1F3C6}", w / 2, 160);

    // Awarded to
    ctx.fillStyle = "#94a3b8";
    ctx.font = "16px system-ui, -apple-system, sans-serif";
    ctx.fillText("This certifies that", w / 2, 200);

    // Name
    ctx.fillStyle = "#f8fafc";
    ctx.font = "bold 28px system-ui, -apple-system, sans-serif";
    ctx.fillText(name || "Anonymous Learner", w / 2, 240);

    // Achievement
    ctx.fillStyle = "#94a3b8";
    ctx.font = "16px system-ui, -apple-system, sans-serif";
    ctx.fillText("has successfully explored and mastered all", w / 2, 290);

    ctx.fillStyle = "#fbbf24";
    ctx.font = "bold 36px system-ui, -apple-system, sans-serif";
    ctx.fillText("39 Data Structures", w / 2, 340);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "16px system-ui, -apple-system, sans-serif";
    ctx.fillText("in the Architex Data Structures Explorer", w / 2, 380);

    // Categories
    ctx.fillStyle = "#64748b";
    ctx.font = "12px system-ui, -apple-system, sans-serif";
    ctx.fillText(
      "Linear | Trees | Hash | Heaps | Probabilistic | System",
      w / 2,
      420,
    );

    // Date
    ctx.fillStyle = "#94a3b8";
    ctx.font = "14px system-ui, -apple-system, sans-serif";
    ctx.fillText(dateStr, w / 2, 470);

    // Architex branding
    ctx.fillStyle = "#475569";
    ctx.font = "12px system-ui, -apple-system, sans-serif";
    ctx.fillText("Architex -- System Design Learning Platform", w / 2, 520);
  }, [name, dateStr]);

  const handleDownload = useCallback(() => {
    generateCertificate();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "architex-ds-master-certificate.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, [generateCertificate]);

  // Generate preview when modal opens or name changes
  useEffect(() => {
    if (open) {
      // Small delay to let canvas mount
      const t = setTimeout(generateCertificate, 50);
      return () => clearTimeout(t);
    }
  }, [open, name, generateCertificate]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative mx-4 w-full max-w-2xl rounded-xl border border-border bg-elevated p-6 shadow-2xl"
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded p-1 text-foreground-muted hover:bg-accent/50 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Award className="h-5 w-5 text-yellow-400" />
          DS Master Certificate
        </h2>

        {/* Name input */}
        <div className="mb-4">
          <label className="block text-xs text-foreground-muted mb-1">
            Your name (for the certificate)
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name..."
            className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground-subtle focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Canvas preview */}
        <div className="mb-4 overflow-hidden rounded-lg border border-border">
          <canvas
            ref={canvasRef}
            className="w-full"
            style={{ aspectRatio: "800/560" }}
          />
        </div>

        {/* Download */}
        <button
          onClick={handleDownload}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-yellow-500/30 bg-yellow-500/10 px-4 py-2 text-sm font-medium text-yellow-400 transition-colors hover:bg-yellow-500/20 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-yellow-400"
        >
          <Download className="h-4 w-4" />
          Download Certificate (PNG)
        </button>
      </motion.div>
    </div>
  );
});

// ── Inline badge icon (for sidebar header) ────────────────────

const BadgeIcon = memo(function BadgeIcon({
  badge,
  earned,
  explored,
  total,
}: BadgeStatus) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div
        className={cn(
          "flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold transition-opacity",
          earned ? badge.bgColor : "bg-foreground-subtle/10",
          earned ? badge.color : "text-foreground-subtle opacity-40",
        )}
      >
        {badge.icon}
      </div>
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute left-1/2 top-full z-50 mt-1 -translate-x-1/2 whitespace-nowrap rounded bg-elevated border border-border px-2 py-1 text-[10px] shadow-lg"
          >
            <div className="font-medium text-foreground">
              {badge.title}
            </div>
            <div className="text-foreground-subtle">
              {explored}/{total} explored
              {earned ? " -- Earned!" : ""}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// ── Sidebar badge strip ───────────────────────────────────────

const BadgeStrip = memo(function BadgeStrip() {
  const [badgeStatuses, setBadgeStatuses] = useState<BadgeStatus[]>([]);
  const [showCert, setShowCert] = useState(false);

  useEffect(() => {
    const progress = getModuleProgress("data-structures");
    const exploredSet = new Set(progress.featuresExplored);
    setBadgeStatuses(computeBadgeStatuses(exploredSet));
  }, []);

  const earnedCount = badgeStatuses.filter((b) => b.earned).length;
  const isMaster = badgeStatuses.find((b) => b.badge.id === "ds-master")?.earned ?? false;

  if (badgeStatuses.length === 0) return null;

  return (
    <>
      <div className="flex items-center gap-1 mt-1">
        {badgeStatuses.map((status) => (
          <BadgeIcon key={status.badge.id} {...status} />
        ))}
        {isMaster && (
          <button
            onClick={() => setShowCert(true)}
            className="ml-1 rounded bg-yellow-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-yellow-400 hover:bg-yellow-500/20 transition-colors"
          >
            Certificate
          </button>
        )}
      </div>
      <AnimatePresence>
        {showCert && (
          <CertificateModal open={showCert} onClose={() => setShowCert(false)} />
        )}
      </AnimatePresence>
    </>
  );
});

export { BadgeStrip, BadgeIcon, BADGE_DEFS, computeBadgeStatuses };
