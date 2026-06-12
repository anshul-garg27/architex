"use client";

// ---------------------------------------------------------------------------
// IncidentReplay — cinematic, scrubbable replay of a real-world outage.
//
// Read-only React Flow canvas inside its OWN ReactFlowProvider (deliberately
// independent of the workspace canvas-store) with node colors driven by the
// active timeline keyframe. A scrubber + play/pause auto-advance walks the
// beats; a narrative panel tells the story. Ends on lessons + a CTA into the
// workspace. Keyframe transitions animate color/opacity only.
// ---------------------------------------------------------------------------

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Background,
  BackgroundVariant,
  Handle,
  Position,
  ReactFlow,
  ReactFlowProvider,
  type Edge,
  type Node,
  type NodeProps,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  AppWindow,
  ArrowRight,
  Boxes,
  Building2,
  DoorClosed,
  ExternalLink,
  Globe,
  KeyRound,
  Network,
  Pause,
  Play,
  RotateCcw,
  Route,
  Server,
  Signpost,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  IncidentNodeKind,
  IncidentReplay as IncidentReplayData,
  NodeHealth,
} from "@/lib/incidents";

// ── Constants ────────────────────────────────────────────────

const BEAT_DURATION_MS = 4000;

const KIND_ICONS: Record<IncidentNodeKind, LucideIcon> = {
  client: Users,
  resolver: Globe,
  dns: Signpost,
  router: Route,
  backbone: Network,
  edge: Boxes,
  datacenter: Building2,
  frontend: AppWindow,
  service: Server,
  auth: KeyRound,
  tooling: Wrench,
  physical: DoorClosed,
};

const HEALTH_STYLES: Record<
  NodeHealth,
  { border: string; glow: string; dot: string; opacity: number }
> = {
  healthy: {
    border: "rgba(255,255,255,0.14)",
    glow: "none",
    dot: "var(--state-success)",
    opacity: 1,
  },
  degraded: {
    border: "rgba(245,158,11,0.65)",
    glow: "0 0 18px rgba(245,158,11,0.18)",
    dot: "var(--state-warning)",
    opacity: 1,
  },
  down: {
    border: "rgba(239,68,68,0.7)",
    glow: "0 0 22px rgba(239,68,68,0.22)",
    dot: "var(--state-error)",
    opacity: 0.55,
  },
};

const HEALTH_LABELS: Record<NodeHealth, string> = {
  healthy: "healthy",
  degraded: "degraded",
  down: "down",
};

// ── Helpers ──────────────────────────────────────────────────

function formatOffset(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `T+${h}:${mm}:${ss}` : `T+${mm}:${ss}`;
}

function formatUsers(count: number): string {
  if (count >= 1_000_000_000) return `${(count / 1_000_000_000).toFixed(1)}B`;
  if (count >= 1_000_000) return `${Math.round(count / 1_000_000)}M`;
  if (count === 0) return "0";
  return count.toLocaleString();
}

function errorRateColor(rate: number): string {
  if (rate <= 5) return "var(--state-success)";
  if (rate < 50) return "var(--state-warning)";
  return "var(--state-error)";
}

function worstHealth(a: NodeHealth, b: NodeHealth): NodeHealth {
  if (a === "down" || b === "down") return "down";
  if (a === "degraded" || b === "degraded") return "degraded";
  return "healthy";
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

// ── Custom React Flow node ───────────────────────────────────

type ReplayNodeData = {
  label: string;
  kind: IncidentNodeKind;
  health: NodeHealth;
  reducedMotion: boolean;
};

type ReplayNode = Node<ReplayNodeData, "incident">;

const HIDDEN_HANDLE = "!h-0 !w-0 !min-h-0 !min-w-0 !border-0 !bg-transparent";

function IncidentFlowNode({ data }: NodeProps<ReplayNode>) {
  const Icon = KIND_ICONS[data.kind];
  const style = HEALTH_STYLES[data.health];

  return (
    <div
      className="flex w-[168px] items-center gap-2.5 rounded-lg bg-[var(--surface-elevated)] px-3 py-2.5"
      style={{
        border: `1px solid ${style.border}`,
        boxShadow: style.glow,
        opacity: style.opacity,
        transition: data.reducedMotion
          ? "none"
          : "border-color 600ms ease, box-shadow 600ms ease, opacity 600ms ease",
      }}
    >
      <Handle id="l" type="target" position={Position.Left} className={HIDDEN_HANDLE} />
      <Handle id="t" type="target" position={Position.Top} className={HIDDEN_HANDLE} />
      <Handle id="r" type="source" position={Position.Right} className={HIDDEN_HANDLE} />
      <Handle id="b" type="source" position={Position.Bottom} className={HIDDEN_HANDLE} />
      <Icon className="h-4 w-4 shrink-0 text-[var(--foreground-muted)]" aria-hidden />
      <span className="flex-1 truncate text-xs font-medium text-[var(--foreground)]">
        {data.label}
      </span>
      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{
          backgroundColor: style.dot,
          transition: data.reducedMotion ? "none" : "background-color 600ms ease",
        }}
        role="img"
        aria-label={HEALTH_LABELS[data.health]}
      />
    </div>
  );
}

// Same cast the codebase uses for narrowed NodeProps components (ConceptGraph).
const NODE_TYPES: NodeTypes = { incident: IncidentFlowNode } as unknown as NodeTypes;

// ── Main component ───────────────────────────────────────────

interface IncidentReplayProps {
  incident: IncidentReplayData;
}

export function IncidentReplay({ incident }: IncidentReplayProps) {
  const { meta, timeline, lessons } = incident;
  const lastIndex = timeline.length - 1;

  const [frameIndex, setFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  const frame = timeline[frameIndex];

  // Auto-advance while playing (~4s per beat). Discrete, user-initiated
  // steps — reduced-motion users get instant (untransitioned) state changes.
  useEffect(() => {
    if (!isPlaying) return;
    const id = window.setInterval(() => {
      setFrameIndex((i) => Math.min(i + 1, lastIndex));
    }, BEAT_DURATION_MS);
    return () => window.clearInterval(id);
  }, [isPlaying, lastIndex]);

  // Stop at the final beat.
  useEffect(() => {
    if (frameIndex >= lastIndex) setIsPlaying(false);
  }, [frameIndex, lastIndex]);

  const isAtEnd = frameIndex >= lastIndex;

  const flowNodes: ReplayNode[] = useMemo(
    () =>
      incident.nodes.map((n) => ({
        id: n.id,
        type: "incident" as const,
        position: n.position,
        data: {
          label: n.label,
          kind: n.kind,
          health: frame.nodeStates[n.id] ?? "healthy",
          reducedMotion,
        },
        draggable: false,
        selectable: false,
        connectable: false,
      })),
    [incident.nodes, frame, reducedMotion],
  );

  const flowEdges: Edge[] = useMemo(
    () =>
      incident.edges.map((e) => {
        const health = worstHealth(
          frame.nodeStates[e.source] ?? "healthy",
          frame.nodeStates[e.target] ?? "healthy",
        );
        const stroke =
          health === "down"
            ? "rgba(239,68,68,0.4)"
            : health === "degraded"
              ? "rgba(245,158,11,0.4)"
              : "rgba(255,255,255,0.18)";
        return {
          id: e.id,
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle ?? "r",
          targetHandle: e.targetHandle ?? "l",
          label: e.label,
          animated: health === "healthy" && !reducedMotion,
          style: { stroke, strokeWidth: 1.5, transition: "stroke 600ms ease" },
          labelStyle: { fill: "var(--foreground-muted)", fontSize: 10 },
          labelBgStyle: { fill: "var(--surface)", fillOpacity: 0.9 },
          labelBgPadding: [4, 2] as [number, number],
          labelBgBorderRadius: 4,
        };
      }),
    [incident.edges, frame, reducedMotion],
  );

  const handlePlayPause = () => {
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }
    if (isAtEnd) setFrameIndex(0);
    setIsPlaying(true);
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
        {/* ── Header ──────────────────────────────────────── */}
        <header className="mb-8 lg:mb-12">
          <p className="mb-3 font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--primary)]">
            Incident replay · {meta.company} · {meta.date}
          </p>
          <h1 className="max-w-3xl text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            {meta.title}
          </h1>
          <p className="mt-4 max-w-2xl text-base text-[var(--foreground-muted)] sm:text-lg">
            {meta.tagline}
          </p>
        </header>

        {/* ── Canvas + narrative ──────────────────────────── */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0">
            {/* Read-only replay canvas in its own provider — never the
                workspace canvas-store. */}
            <div className="h-[340px] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] sm:h-[440px] lg:h-[540px]">
              <ReactFlowProvider>
                <ReactFlow
                  nodes={flowNodes}
                  edges={flowEdges}
                  nodeTypes={NODE_TYPES}
                  fitView
                  fitViewOptions={{ padding: 0.12 }}
                  nodesDraggable={false}
                  nodesConnectable={false}
                  elementsSelectable={false}
                  panOnDrag={false}
                  zoomOnScroll={false}
                  zoomOnPinch={false}
                  zoomOnDoubleClick={false}
                  preventScrolling={false}
                  proOptions={{ hideAttribution: true }}
                >
                  <Background
                    variant={BackgroundVariant.Dots}
                    gap={24}
                    size={1}
                    color="rgba(255,255,255,0.06)"
                  />
                </ReactFlow>
              </ReactFlowProvider>
            </div>

            {/* ── Timeline scrubber ─────────────────────── */}
            <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3.5">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={handlePlayPause}
                  aria-label={
                    isPlaying ? "Pause replay" : isAtEnd ? "Replay from start" : "Play replay"
                  }
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] transition-colors hover:bg-[var(--primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4" aria-hidden />
                  ) : isAtEnd ? (
                    <RotateCcw className="h-4 w-4" aria-hidden />
                  ) : (
                    <Play className="ml-0.5 h-4 w-4" aria-hidden />
                  )}
                </button>

                <div className="relative flex-1 py-2">
                  {/* Keyframe markers */}
                  <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2">
                    {timeline.map((kf, i) => (
                      <span
                        key={kf.atSeconds}
                        className={cn(
                          "absolute top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors",
                          i <= frameIndex ? "bg-[var(--primary)]" : "bg-white/25",
                        )}
                        style={{ left: `${(i / lastIndex) * 100}%` }}
                      />
                    ))}
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={lastIndex}
                    step={1}
                    value={frameIndex}
                    onChange={(e) => {
                      setIsPlaying(false);
                      setFrameIndex(Number(e.target.value));
                    }}
                    aria-label="Incident timeline"
                    aria-valuetext={`${formatOffset(frame.atSeconds)} — ${frame.headline}`}
                    className={cn(
                      "relative z-10 h-1 w-full cursor-pointer appearance-none rounded-full bg-white/10 outline-none",
                      "[&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[var(--background)] [&::-webkit-slider-thumb]:bg-[var(--primary)] [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(120,62,232,0.5)]",
                      "[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[var(--background)] [&::-moz-range-thumb]:bg-[var(--primary)]",
                      "focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]",
                    )}
                  />
                </div>

                <span className="w-24 shrink-0 text-right font-mono text-xs tabular-nums text-[var(--foreground-muted)]">
                  {formatOffset(frame.atSeconds)}
                </span>
              </div>
              <div className="mt-1.5 flex justify-between pl-[52px] font-mono text-[10px] text-[var(--foreground-muted)]">
                <span>T+00:00</span>
                <span>{meta.durationLabel}</span>
              </div>
            </div>
          </div>

          {/* ── Narrative panel ───────────────────────────── */}
          <aside
            className="flex flex-col rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6"
            aria-live="polite"
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="font-mono text-sm font-semibold tabular-nums text-[var(--primary)]">
                {formatOffset(frame.atSeconds)}
              </span>
              <span className="font-mono text-[11px] text-[var(--foreground-muted)]">
                Beat {frameIndex + 1} / {timeline.length}
              </span>
            </div>

            <h2 className="text-2xl font-semibold leading-tight tracking-tight lg:text-[1.75rem]">
              {frame.headline}
            </h2>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-[var(--foreground-muted)]">
              {frame.narrative}
            </p>

            {/* Metrics readout */}
            <div className="mt-6 grid grid-cols-2 gap-3 border-t border-[var(--border)] pt-5">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
                  Global error rate
                </p>
                <p
                  className="mt-1 font-mono text-3xl font-bold tabular-nums"
                  style={{
                    color: errorRateColor(frame.metrics.globalErrorRate),
                    transition: reducedMotion ? "none" : "color 600ms ease",
                  }}
                >
                  {frame.metrics.globalErrorRate}%
                </p>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
                  Users affected
                </p>
                <p className="mt-1 font-mono text-3xl font-bold tabular-nums text-[var(--foreground)]">
                  {formatUsers(frame.metrics.affectedUsers)}
                </p>
              </div>
            </div>

            {isAtEnd && (
              <a
                href="#lessons"
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--primary)] transition-colors hover:text-[var(--primary-hover)]"
              >
                Read the lessons <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </a>
            )}
          </aside>
        </div>

        {/* ── Lessons ─────────────────────────────────────── */}
        <section id="lessons" aria-labelledby="lessons-heading" className="mt-16 lg:mt-24">
          <p className="mb-2 font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--primary)]">
            Postmortem
          </p>
          <h2 id="lessons-heading" className="text-3xl font-semibold tracking-tight sm:text-4xl">
            What this outage teaches
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {lessons.map((lesson, i) => (
              <article
                key={lesson.title}
                className="group rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 transition-colors hover:border-[var(--primary)]/40"
              >
                <span className="font-mono text-xs text-[var(--foreground-muted)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-2 text-lg font-semibold leading-snug tracking-tight">
                  {lesson.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--foreground-muted)]">
                  {lesson.body}
                </p>
              </article>
            ))}
          </div>

          {/* ── CTA ─────────────────────────────────────── */}
          <div className="mt-12 overflow-hidden rounded-2xl border border-[var(--primary)]/30 bg-gradient-to-br from-[var(--primary)]/15 via-[var(--surface)] to-[var(--surface)] p-8 sm:p-12">
            <h2 className="max-w-2xl text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              Could <em className="not-italic text-[var(--primary)]">your</em> design survive
              this?
            </h2>
            <p className="mt-3 max-w-xl text-base text-[var(--foreground-muted)]">
              Rebuild this architecture in the Architex workspace, then let the chaos engine pull
              the same plug — and find out before production does.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <Link
                href="/?utm=incident"
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-[var(--primary-foreground)] transition-colors hover:bg-[var(--primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
              >
                Open the workspace <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <a
                href={meta.postmortemUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--foreground-muted)] transition-colors hover:text-[var(--foreground)]"
              >
                Read the official postmortem <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
