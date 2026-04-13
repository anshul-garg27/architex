"use client";

// ─────────────────────────────────────────────────────────────
// Architex — COL-009 Community Gallery
// ─────────────────────────────────────────────────────────────

import { useCallback, useMemo, useState } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import {
  Search,
  ArrowUpDown,
  Filter,
  Heart,
  GitFork,
  ArrowLeft,
  TrendingUp,
  Clock,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { duration, easing, getStaggerDelay, slideUp } from "@/lib/constants/motion";
import { toast } from "@/components/ui/toast";
import { MiniArchitectureSVG } from "@/components/gallery/MiniArchitectureSVG";

// ── Types ─────────────────────────────────────────────────────

type GalleryCategory = "All" | "Microservices" | "Data Pipeline" | "Real-Time" | "E-Commerce" | "Social" | "Infrastructure";
type SortMode = "recent" | "popular" | "trending";

interface GalleryEntry {
  id: string;
  title: string;
  author: string;
  category: GalleryCategory;
  upvotes: number;
  nodeCount: number;
  createdAt: string;
  description: string;
  thumbnailGradient: string;
  tags: string[];
}

// ── Mock Data (12 entries) ────────────────────────────────────

const MOCK_GALLERY: GalleryEntry[] = [
  {
    id: "g-001",
    title: "Netflix-Scale Video Streaming",
    author: "Sarah Chen",
    category: "Microservices",
    upvotes: 342,
    nodeCount: 24,
    createdAt: "2026-04-10T14:30:00Z",
    description: "CDN-backed video transcoding pipeline with adaptive bitrate streaming",
    thumbnailGradient: "from-violet-500/20 to-purple-600/20",
    tags: ["CDN", "transcoding", "HLS"],
  },
  {
    id: "g-002",
    title: "Real-Time Chat System",
    author: "Marcus Rivera",
    category: "Real-Time",
    upvotes: 218,
    nodeCount: 16,
    createdAt: "2026-04-09T09:15:00Z",
    description: "WebSocket-based messaging with presence detection and message persistence",
    thumbnailGradient: "from-blue-500/20 to-cyan-500/20",
    tags: ["WebSocket", "Redis", "presence"],
  },
  {
    id: "g-003",
    title: "E-Commerce Order Pipeline",
    author: "Priya Patel",
    category: "E-Commerce",
    upvotes: 187,
    nodeCount: 20,
    createdAt: "2026-04-08T16:45:00Z",
    description: "Event-driven order processing with inventory management and payment gateway",
    thumbnailGradient: "from-emerald-500/20 to-green-500/20",
    tags: ["CQRS", "Kafka", "payments"],
  },
  {
    id: "g-004",
    title: "Twitter Feed Architecture",
    author: "Alex Kim",
    category: "Social",
    upvotes: 296,
    nodeCount: 18,
    createdAt: "2026-04-07T11:20:00Z",
    description: "Fan-out on write timeline with celebrity exception handling",
    thumbnailGradient: "from-sky-500/20 to-blue-400/20",
    tags: ["fan-out", "cache", "timeline"],
  },
  {
    id: "g-005",
    title: "ML Feature Store Pipeline",
    author: "Jordan Lee",
    category: "Data Pipeline",
    upvotes: 156,
    nodeCount: 22,
    createdAt: "2026-04-06T08:00:00Z",
    description: "Offline/online feature computation with point-in-time correctness",
    thumbnailGradient: "from-pink-500/20 to-rose-500/20",
    tags: ["ML", "Spark", "feature-store"],
  },
  {
    id: "g-006",
    title: "Kubernetes Auto-Scaler",
    author: "Dev Sharma",
    category: "Infrastructure",
    upvotes: 134,
    nodeCount: 14,
    createdAt: "2026-04-05T13:30:00Z",
    description: "HPA + VPA with custom metrics and predictive scaling",
    thumbnailGradient: "from-orange-500/20 to-amber-500/20",
    tags: ["K8s", "HPA", "autoscaling"],
  },
  {
    id: "g-007",
    title: "Uber Ride Matching",
    author: "Fatima Al-Hassan",
    category: "Real-Time",
    upvotes: 412,
    nodeCount: 28,
    createdAt: "2026-04-04T10:00:00Z",
    description: "Geospatial matching with surge pricing and ETA prediction",
    thumbnailGradient: "from-teal-500/20 to-emerald-400/20",
    tags: ["geospatial", "matching", "surge"],
  },
  {
    id: "g-008",
    title: "Distributed Rate Limiter",
    author: "Liam O'Brien",
    category: "Infrastructure",
    upvotes: 189,
    nodeCount: 10,
    createdAt: "2026-04-03T15:45:00Z",
    description: "Token bucket with Redis sliding window and circuit breaker",
    thumbnailGradient: "from-red-500/20 to-orange-400/20",
    tags: ["rate-limit", "Redis", "circuit-breaker"],
  },
  {
    id: "g-009",
    title: "Notification Delivery System",
    author: "Emma Zhang",
    category: "Microservices",
    upvotes: 167,
    nodeCount: 15,
    createdAt: "2026-04-02T12:00:00Z",
    description: "Multi-channel notifications with priority queues and dedup",
    thumbnailGradient: "from-indigo-500/20 to-violet-400/20",
    tags: ["push", "email", "SMS", "SQS"],
  },
  {
    id: "g-010",
    title: "Payment Processing Platform",
    author: "Carlos Mendez",
    category: "E-Commerce",
    upvotes: 231,
    nodeCount: 19,
    createdAt: "2026-04-01T09:30:00Z",
    description: "PCI-compliant payment flow with idempotency and reconciliation",
    thumbnailGradient: "from-yellow-500/20 to-amber-400/20",
    tags: ["PCI", "idempotency", "Stripe"],
  },
  {
    id: "g-011",
    title: "Social Media Content Feed",
    author: "Anika Roy",
    category: "Social",
    upvotes: 275,
    nodeCount: 21,
    createdAt: "2026-03-30T14:00:00Z",
    description: "ML-ranked feed with engagement prediction and content moderation",
    thumbnailGradient: "from-fuchsia-500/20 to-pink-400/20",
    tags: ["ranking", "ML", "moderation"],
  },
  {
    id: "g-012",
    title: "Real-Time Analytics Pipeline",
    author: "Noah Williams",
    category: "Data Pipeline",
    upvotes: 198,
    nodeCount: 26,
    createdAt: "2026-03-28T07:00:00Z",
    description: "Lambda architecture with Kafka Streams and ClickHouse for sub-second queries",
    thumbnailGradient: "from-cyan-500/20 to-blue-400/20",
    tags: ["Kafka", "ClickHouse", "lambda"],
  },
];

const CATEGORIES: GalleryCategory[] = [
  "All",
  "Microservices",
  "Data Pipeline",
  "Real-Time",
  "E-Commerce",
  "Social",
  "Infrastructure",
];

const SORT_OPTIONS: { value: SortMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: "recent", label: "Recent", icon: Clock },
  { value: "popular", label: "Popular", icon: Heart },
  { value: "trending", label: "Trending", icon: TrendingUp },
];

// ── Helpers ───────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}

/**
 * Trending score: upvotes weighted by recency.
 * More recent designs with high upvotes rank higher.
 */
function trendingScore(entry: GalleryEntry): number {
  const ageHours = (Date.now() - new Date(entry.createdAt).getTime()) / 3_600_000;
  return entry.upvotes / Math.pow(ageHours + 2, 1.5);
}

// ── Design Card ───────────────────────────────────────────────

function DesignCard({
  entry,
  index,
  voted,
  onUpvote,
  onFork,
}: {
  entry: GalleryEntry;
  index: number;
  voted: boolean;
  onUpvote: (id: string) => void;
  onFork: (id: string) => void;
}) {
  return (
    <motion.div
      initial={slideUp.initial}
      animate={slideUp.animate}
      transition={{
        duration: duration.normal,
        ease: easing.out,
        delay: getStaggerDelay("gridItems", index),
      }}
      className="group rounded-xl border border-border/50 bg-surface overflow-hidden hover:border-primary/30 transition-colors"
    >
      {/* Thumbnail */}
      <div className={cn("h-36 bg-gradient-to-br relative", entry.thumbnailGradient)}>
        <div className="absolute inset-0 flex items-center justify-center p-3">
          <MiniArchitectureSVG
            entryId={entry.id}
            className="h-full w-full"
          />
        </div>
        <div className="absolute bottom-2 right-2 rounded-md bg-black/40 px-2 py-0.5 text-xs text-white/80 backdrop-blur-sm">
          {entry.nodeCount} nodes
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-foreground text-sm leading-tight line-clamp-1">
            {entry.title}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            by {entry.author}
          </p>
        </div>

        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {entry.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {entry.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-surface-elevated px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Footer: upvotes + fork + time */}
        <div className="flex items-center justify-between pt-2 border-t border-border/30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onUpvote(entry.id)}
              className={cn(
                "flex items-center gap-1 text-xs transition-colors",
                voted ? "text-red-400" : "text-muted-foreground hover:text-red-400",
              )}
              aria-label={voted ? `Remove upvote from ${entry.title}` : `Upvote ${entry.title}`}
            >
              <Heart className="h-3.5 w-3.5" fill={voted ? "currentColor" : "none"} />
              <span>{entry.upvotes}</span>
            </button>

            <button
              onClick={() => onFork(entry.id)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
              aria-label={`Fork ${entry.title}`}
            >
              <GitFork className="h-3.5 w-3.5" />
              <span>Fork</span>
            </button>
          </div>

          <span className="text-[10px] text-muted-foreground">
            {timeAgo(entry.createdAt)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ── Gallery Page ──────────────────────────────────────────────

export default function GalleryPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<GalleryCategory>("All");
  const [sortMode, setSortMode] = useState<SortMode>("recent");
  const [upvotes, setUpvotes] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    for (const entry of MOCK_GALLERY) {
      map[entry.id] = entry.upvotes;
    }
    return map;
  });
  const [votedIds, setVotedIds] = useState<Set<string>>(() => new Set());

  // Toggle upvote: +1 when voting, -1 when unvoting
  const handleUpvote = useCallback((id: string) => {
    setVotedIds((prev) => {
      const next = new Set(prev);
      const wasVoted = next.has(id);

      if (wasVoted) {
        next.delete(id);
        setUpvotes((p) => ({ ...p, [id]: Math.max(0, (p[id] ?? 0) - 1) }));
        toast("info", "Upvote removed");
      } else {
        next.add(id);
        setUpvotes((p) => ({ ...p, [id]: (p[id] ?? 0) + 1 }));
        toast("success", "Upvoted!");
      }

      return next;
    });
  }, []);

  // Fork handler
  const handleFork = useCallback((id: string) => {
    const entry = MOCK_GALLERY.find((e) => e.id === id);
    if (entry) {
      toast("info", `Forking "${entry.title}" -- opening in canvas...`);
      // In a full implementation, this would navigate to / with forked design loaded
    }
  }, []);

  // Filtered and sorted entries
  const entries = useMemo(() => {
    let filtered = MOCK_GALLERY.map((e) => ({
      ...e,
      upvotes: upvotes[e.id] ?? e.upvotes,
    }));

    // Category filter
    if (category !== "All") {
      filtered = filtered.filter((e) => e.category === category);
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.author.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }

    // Sort
    switch (sortMode) {
      case "recent":
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case "popular":
        filtered.sort((a, b) => b.upvotes - a.upvotes);
        break;
      case "trending":
        filtered.sort((a, b) => trendingScore(b) - trendingScore(a));
        break;
    }

    return filtered;
  }, [search, category, sortMode, upvotes]);

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-border px-6 py-4">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Canvas
          </Link>
          <div className="h-5 w-px bg-border" />
          <div>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Community Gallery</h1>
            <p className="text-xs text-muted-foreground">
              Explore and fork system designs shared by the community
            </p>
          </div>
        </div>
      </header>

      {/* Toolbar: search + category filter + sort */}
      <div className="flex-shrink-0 border-b border-border/50 px-6 py-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search designs, authors, tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cn(
                "w-full rounded-lg border border-border/50 bg-surface pl-9 pr-3 py-2",
                "text-sm text-foreground placeholder:text-muted-foreground",
                "focus:outline-none focus:ring-2 focus:ring-primary/40",
              )}
            />
          </div>

          <div className="flex items-center gap-3">
            {/* Category filter */}
            <div className="flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              <div className="flex gap-1 overflow-x-auto">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={cn(
                      "whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                      category === cat
                        ? "bg-primary/15 text-primary"
                        : "text-muted-foreground hover:bg-surface-hover hover:text-foreground",
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-1 border-l border-border/50 pl-3">
              <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
              {SORT_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setSortMode(opt.value)}
                    className={cn(
                      "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                      sortMode === opt.value
                        ? "bg-primary/15 text-primary"
                        : "text-muted-foreground hover:bg-surface-hover hover:text-foreground",
                    )}
                  >
                    <Icon className="h-3 w-3" />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Gallery grid */}
      <main className="flex-1 overflow-y-auto px-6 py-6">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Search className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm font-medium">No designs found</p>
            <p className="text-xs mt-1">Try a different search or category</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {entries.map((entry, i) => (
              <DesignCard
                key={entry.id}
                entry={entry}
                index={i}
                voted={votedIds.has(entry.id)}
                onUpvote={handleUpvote}
                onFork={handleFork}
              />
            ))}
          </div>
        )}

        {/* Results count */}
        {entries.length > 0 && (
          <p className="text-xs text-muted-foreground mt-6 text-center">
            Showing {entries.length} of {MOCK_GALLERY.length} designs
          </p>
        )}
      </main>
    </div>
  );
}
