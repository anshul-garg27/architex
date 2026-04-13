"use client";

import React, { memo, lazy, Suspense, useState, useCallback, useMemo, useEffect } from "react";
import {
  Globe,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Shield,
  Zap,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TCPConnection } from "@/lib/networking/tcp-state-machine";
import type { TCPEvent } from "@/lib/networking/tcp-state-machine";
import { TLSHandshake } from "@/lib/networking/tls-handshake";
import type { TLSMessage } from "@/lib/networking/tls-handshake";
import {
  TLS13_HANDSHAKE_MESSAGES,
  TLS13_0RTT_MESSAGES,
  tls13ToSequenceMessages,
  tls13RowBackground,
  TLS13_RTT_BRACKETS,
  TLS13_0RTT_BRACKETS,
} from "@/lib/networking/tls13-handshake";
import type { TLS13Message } from "@/lib/networking/tls13-handshake";
import { DNSResolver } from "@/lib/networking/dns-resolution";
import {
  dnsToSequenceMessages,
  dnsRowBackground,
  DNS_SCENARIOS,
} from "@/lib/networking/dns-resolution";
import type { DNSQuery, DNSScenario } from "@/lib/networking/dns-resolution";
import { compareHTTPVersions } from "@/lib/networking/http-comparison";
import type { HTTPRequest } from "@/lib/networking/http-comparison";
import { WebSocketSimulation } from "@/lib/networking/websocket-lifecycle";
import type { WebSocketEvent } from "@/lib/networking/websocket-lifecycle";
import { simulateCORS } from "@/lib/networking/cors-simulator";
import type { CORSConfig, CORSStep } from "@/lib/networking/cors-simulator";
import { simulateCDNFlow, cdnToSequenceMessages, cdnRowBackground, CDN_SCENARIOS, CDN_SEQUENCE_COLUMNS } from "@/lib/networking/cdn-flow";
import type { CDNStep, CDNScenario } from "@/lib/networking/cdn-flow";
import { compareAPIs, getAPIQualitativeMetrics, getAPIRequestExamples, getAPIOperationDescriptions } from "@/lib/networking/api-comparison";
import type { APIOperation } from "@/lib/networking/api-comparison";
import { compareSerializationFormats, SAMPLE_USER_DATA } from "@/lib/networking/serialization-comparison";
import { useUIStore } from "@/stores/ui-store";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

// ── LEARN Panel Components (lazy) ────────────────────────────
const PacketJourneySimulator = lazy(() => import("@/components/modules/networking/PacketJourneySimulator"));
const ConnectionPoolVisualization = lazy(() => import("@/components/modules/networking/ConnectionPoolVisualization"));

// ── Protocol Definitions ────────────────────────────────────

type Protocol =
  | "tcp-handshake"
  | "tls-1.3"
  | "dns-resolution"
  | "http-comparison"
  | "websocket"
  | "cors"
  | "cdn-flow"
  | "api-comparison"
  | "serialization";

function assertNever(x: never): never {
  throw new Error(`Unexpected protocol: ${x}`);
}

interface ProtocolDef {
  id: Protocol;
  name: string;
  description: string;
}

const PROTOCOLS: ProtocolDef[] = [
  {
    id: "tcp-handshake",
    name: "TCP Handshake",
    description: "3-way handshake, data transfer, 4-way teardown.",
  },
  {
    id: "tls-1.3",
    name: "TLS 1.3",
    description: "1-RTT handshake with key exchange and certificate verification.",
  },
  {
    id: "dns-resolution",
    name: "DNS Resolution",
    description: "Recursive DNS lookup chain from stub to authoritative.",
  },
  {
    id: "http-comparison",
    name: "HTTP Comparison",
    description: "HTTP/1.1 vs HTTP/2 vs HTTP/3 request flows.",
  },
  {
    id: "websocket",
    name: "WebSocket",
    description: "Upgrade handshake and full-duplex communication.",
  },
  {
    id: "cors",
    name: "CORS",
    description: "Cross-Origin Resource Sharing preflight flow.",
  },
  {
    id: "cdn-flow",
    name: "CDN Flow",
    description: "CDN request lifecycle: cache hit vs cache miss paths.",
  },
  {
    id: "api-comparison",
    name: "REST vs GraphQL vs gRPC",
    description: "Side-by-side API protocol comparison for the same operation.",
  },
  {
    id: "serialization",
    name: "Serialization",
    description: "JSON vs Protobuf vs MessagePack vs Avro format comparison.",
  },
];

// ── Shared Sequence Diagram ────────────────────────────────

interface SequenceMessage {
  from: string;
  to: string;
  label: string;
  description: string;
  highlighted?: boolean;
  fromState?: string;
  toState?: string;
}

const SequenceDiagram = memo(function SequenceDiagram({
  columns,
  messages,
  currentIndex,
  rowBgFn,
  rttBrackets,
  ariaLabel,
}: {
  columns: string[];
  messages: SequenceMessage[];
  currentIndex: number;
  rowBgFn?: (index: number) => string | undefined;
  rttBrackets?: Array<{ startIdx: number; endIdx: number; label: string; color: string }>;
  ariaLabel?: string;
}) {
  const colWidth = 200;
  const headerHeight = 50;
  const rowHeight = 50;
  const totalWidth = columns.length * colWidth;
  const totalHeight = headerHeight + messages.length * rowHeight + 40;

  const colPositions = columns.map((_, i) => (i + 0.5) * colWidth);

  return (
    <svg
      viewBox={`0 0 ${totalWidth + 40} ${totalHeight}`}
      className="mx-auto h-full w-full"
      style={{ maxHeight: Math.min(totalHeight, 600) }}
      role="img"
      aria-label={ariaLabel ?? "Sequence diagram showing protocol message flow"}
    >
      {/* Row backgrounds */}
      {rowBgFn &&
        messages.map((_, i) => {
          const bg = rowBgFn(i);
          if (!bg) return null;
          const y = headerHeight + i * rowHeight;
          return (
            <rect
              key={`bg-${i}`}
              x={0}
              y={y}
              width={totalWidth + 40}
              height={rowHeight}
              fill={bg}
              opacity={i <= currentIndex ? 0.15 : 0.05}
            />
          );
        })}

      {/* RTT brackets */}
      {rttBrackets?.map((bracket, bi) => {
        const y1 = headerHeight + bracket.startIdx * rowHeight + 10;
        const y2 = headerHeight + bracket.endIdx * rowHeight + rowHeight - 10;
        const x = totalWidth + 10;
        const isActive = bracket.endIdx <= currentIndex;
        return (
          <g key={`bracket-${bi}`} opacity={isActive ? 1 : 0.3}>
            <line x1={x} y1={y1} x2={x} y2={y2} stroke={bracket.color} strokeWidth={2} />
            <line x1={x - 6} y1={y1} x2={x} y2={y1} stroke={bracket.color} strokeWidth={2} />
            <line x1={x - 6} y1={y2} x2={x} y2={y2} stroke={bracket.color} strokeWidth={2} />
            <text
              x={x + 6}
              y={(y1 + y2) / 2 + 4}
              fill={bracket.color}
              fontSize="10"
              fontWeight="600"
            >
              {bracket.label}
            </text>
          </g>
        );
      })}

      {/* Column headers */}
      {columns.map((col, i) => (
        <g key={col}>
          <rect
            x={colPositions[i] - 50}
            y={8}
            width={100}
            height={30}
            rx={6}
            fill="#1e293b"
            stroke="#334155"
            strokeWidth="1"
          />
          <text
            x={colPositions[i]}
            y={28}
            textAnchor="middle"
            fill="#e2e8f0"
            fontSize="12"
            fontWeight="600"
          >
            {col}
          </text>
          {/* Lifeline */}
          <line
            x1={colPositions[i]}
            y1={headerHeight}
            x2={colPositions[i]}
            y2={totalHeight - 10}
            stroke="#334155"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        </g>
      ))}

      {/* Messages */}
      {messages.map((msg, i) => {
        const fromIdx = columns.indexOf(msg.from);
        const toIdx = columns.indexOf(msg.to);
        if (fromIdx === -1 || toIdx === -1) return null;

        const y = headerHeight + i * rowHeight + 25;
        const x1 = colPositions[fromIdx];
        const x2 = colPositions[toIdx];
        const isActive = i <= currentIndex;
        const isCurrent = i === currentIndex;

        // Self-message (same column)
        if (fromIdx === toIdx) {
          return (
            <g key={i} opacity={isActive ? 1 : 0.25}>
              <path
                d={`M ${x1 + 8} ${y - 4} Q ${x1 + 40} ${y - 4} ${x1 + 40} ${y + 8} Q ${x1 + 40} ${y + 16} ${x1 + 8} ${y + 16}`}
                fill="none"
                stroke={isCurrent ? "#3b82f6" : "#6b7280"}
                strokeWidth={isCurrent ? 2 : 1}
              />
              <polygon
                points={`${x1 + 12},${y + 12} ${x1 + 8},${y + 16} ${x1 + 12},${y + 20}`}
                fill={isCurrent ? "#3b82f6" : "#6b7280"}
              />
              <text
                x={x1 + 46}
                y={y + 8}
                textAnchor="start"
                fill={isCurrent ? "#60a5fa" : "#9ca3af"}
                fontSize="10"
                fontWeight={isCurrent ? "600" : "400"}
              >
                {msg.label}
              </text>
            </g>
          );
        }

        const isLeftToRight = x2 > x1;

        return (
          <g key={i} opacity={isActive ? 1 : 0.25}>
            {/* Arrow line */}
            <line
              x1={x1 + (isLeftToRight ? 8 : -8)}
              y1={y}
              x2={x2 + (isLeftToRight ? -12 : 12)}
              y2={y}
              stroke={isCurrent ? "#3b82f6" : "#6b7280"}
              strokeWidth={isCurrent ? 2 : 1}
            />
            {/* Arrowhead */}
            <polygon
              points={
                isLeftToRight
                  ? `${x2 - 12},${y - 4} ${x2 - 4},${y} ${x2 - 12},${y + 4}`
                  : `${x2 + 12},${y - 4} ${x2 + 4},${y} ${x2 + 12},${y + 4}`
              }
              fill={isCurrent ? "#3b82f6" : "#6b7280"}
            />
            {/* Label */}
            <text
              x={(x1 + x2) / 2}
              y={y - 8}
              textAnchor="middle"
              fill={isCurrent ? "#60a5fa" : "#9ca3af"}
              fontSize="10"
              fontWeight={isCurrent ? "600" : "400"}
            >
              {msg.label}
            </text>
            {/* State labels */}
            {msg.fromState && (
              <text
                x={x1 + (isLeftToRight ? -12 : 12)}
                y={y + 4}
                textAnchor={isLeftToRight ? "end" : "start"}
                fill="#6b7280"
                fontSize="10"
              >
                {msg.fromState}
              </text>
            )}
            {msg.toState && (
              <text
                x={x2 + (isLeftToRight ? 12 : -12)}
                y={y + 4}
                textAnchor={isLeftToRight ? "start" : "end"}
                fill="#6b7280"
                fontSize="10"
              >
                {msg.toState}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
});

// ── TCP to SequenceMessage converter ────────────────────────

function tcpEventsToMessages(events: TCPEvent[]): SequenceMessage[] {
  return events.map((e) => ({
    from: e.from === "client" ? "Client" : "Server",
    to: e.to === "client" ? "Client" : "Server",
    label: buildTcpLabel(e),
    description: e.description,
    fromState: e.from === "client" ? e.clientState : e.serverState,
    toState: e.to === "client" ? e.clientState : e.serverState,
  }));
}

function buildTcpLabel(e: TCPEvent): string {
  const flags: string[] = [];
  if (e.segment.syn) flags.push("SYN");
  if (e.segment.ack) flags.push("ACK");
  if (e.segment.fin) flags.push("FIN");
  if (e.segment.rst) flags.push("RST");
  if (e.segment.data) flags.push("DATA");
  const flagStr = flags.join("+");
  return `${flagStr} seq=${e.segment.seqNum}${e.segment.ack ? ` ack=${e.segment.ackNum}` : ""}`;
}

// ── TLS Visualization ──────────────────────────────────────

function tlsToMessages(events: TLSMessage[]): SequenceMessage[] {
  return events.map((m) => ({
    from: m.from === "client" ? "Client" : "Server",
    to: m.to === "client" ? "Client" : "Server",
    label: `${m.encrypted ? "🔒 " : ""}${m.type}`,
    description: m.description,
  }));
}

function tls13DataToMessages(messages: TLS13Message[]): SequenceMessage[] {
  return tls13ToSequenceMessages(messages);
}

const TLSVisualization = memo(function TLSVisualization({
  stepIndex,
  showTLS12,
  show0RTT,
}: {
  stepIndex: number;
  showTLS12: boolean;
  show0RTT: boolean;
}) {
  // Use the new data-oriented TLS 1.3 messages
  const tls13Messages = useMemo(
    () => tls13DataToMessages(TLS13_HANDSHAKE_MESSAGES),
    [],
  );

  const tls13_0rttMessages = useMemo(
    () => tls13DataToMessages(TLS13_0RTT_MESSAGES),
    [],
  );

  const tls12Data = useMemo(() => {
    const tls = new TLSHandshake();
    return tls.performTLS12Handshake();
  }, []);

  const tls12Messages = useMemo(() => tlsToMessages(tls12Data), [tls12Data]);

  const tls13RowBg = useCallback(
    (index: number) => tls13RowBackground(TLS13_HANDSHAKE_MESSAGES, index),
    [],
  );

  const tls13_0rttRowBg = useCallback(
    (index: number) => tls13RowBackground(TLS13_0RTT_MESSAGES, index),
    [],
  );

  const tls12RowBg = useCallback(
    (index: number) => {
      const msg = tls12Data[index];
      if (!msg) return undefined;
      return msg.encrypted ? "#22c55e" : "#ef4444";
    },
    [tls12Data],
  );

  const tls13Brackets = useMemo(() => TLS13_RTT_BRACKETS, []);
  const tls13_0rttBrackets = useMemo(() => TLS13_0RTT_BRACKETS, []);

  const tls12Brackets = useMemo(
    () => [
      { startIdx: 0, endIdx: 4, label: "RTT 1", color: "#f59e0b" },
      { startIdx: 5, endIdx: 7, label: "RTT 2", color: "#f59e0b" },
    ],
    [],
  );

  // 0-RTT resumption view
  if (show0RTT) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex flex-wrap items-center gap-4 border-b border-border px-4 py-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
            TLS 1.3 0-RTT Resumption
          </span>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-sm bg-red-500/20 ring-1 ring-red-500/40" />
            <span className="text-[11px] text-foreground-muted">Plaintext</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-sm bg-green-500/20 ring-1 ring-green-500/40" />
            <span className="text-[11px] text-foreground-muted">Encrypted</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-sm bg-amber-500/20 ring-1 ring-amber-500/40" />
            <span className="text-[11px] text-foreground-muted">0-RTT (early data)</span>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-2">
          <SequenceDiagram
            columns={["Client", "Server"]}
            messages={tls13_0rttMessages}
            currentIndex={stepIndex}
            rowBgFn={tls13_0rttRowBg}
            rttBrackets={tls13_0rttBrackets}
            ariaLabel="Sequence diagram showing TLS 1.3 0-RTT resumption message flow"
          />
        </div>
      </div>
    );
  }

  if (!showTLS12) {
    return (
      <div className="flex h-full flex-col">
        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 border-b border-border px-4 py-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
            TLS 1.3 Handshake (1-RTT)
          </span>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-sm bg-red-500/20 ring-1 ring-red-500/40" />
            <span className="text-[11px] text-foreground-muted">Plaintext</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-sm bg-green-500/20 ring-1 ring-green-500/40" />
            <span className="text-[11px] text-foreground-muted">Encrypted</span>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-2">
          <SequenceDiagram
            columns={["Client", "Server"]}
            messages={tls13Messages}
            currentIndex={stepIndex}
            rowBgFn={tls13RowBg}
            rttBrackets={tls13Brackets}
            ariaLabel="Sequence diagram showing TLS 1.3 message flow"
          />
        </div>
      </div>
    );
  }

  // Side-by-side TLS 1.3 vs TLS 1.2
  return (
    <div className="flex h-full flex-col">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 border-b border-border px-4 py-2">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-red-500/20 ring-1 ring-red-500/40" />
          <span className="text-[11px] text-foreground-muted">Plaintext</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-green-500/20 ring-1 ring-green-500/40" />
          <span className="text-[11px] text-foreground-muted">Encrypted</span>
        </div>
      </div>
      <div className="grid flex-1 grid-cols-2 divide-x divide-border overflow-auto">
        <div className="flex flex-col">
          <div className="border-b border-border bg-green-500/5 px-3 py-1.5 text-center">
            <span className="text-xs font-semibold text-green-400">TLS 1.3 (1-RTT)</span>
          </div>
          <div className="flex-1 overflow-auto p-1">
            <SequenceDiagram
              columns={["Client", "Server"]}
              messages={tls13Messages}
              currentIndex={stepIndex}
              rowBgFn={tls13RowBg}
              rttBrackets={tls13Brackets}
              ariaLabel="Sequence diagram showing TLS 1.3 message flow"
            />
          </div>
        </div>
        <div className="flex flex-col">
          <div className="border-b border-border bg-amber-500/5 px-3 py-1.5 text-center">
            <span className="text-xs font-semibold text-amber-400">TLS 1.2 (2-RTT)</span>
          </div>
          <div className="flex-1 overflow-auto p-1">
            <SequenceDiagram
              columns={["Client", "Server"]}
              messages={tls12Messages}
              currentIndex={stepIndex}
              rowBgFn={tls12RowBg}
              rttBrackets={tls12Brackets}
              ariaLabel="Sequence diagram showing TLS 1.2 message flow"
            />
          </div>
        </div>
      </div>
    </div>
  );
});

// ── DNS Visualization ──────────────────────────────────────

const DNS_COLUMNS = ["Client", "Recursive", "Root NS", "TLD NS", "Auth NS"];

function dnsToMessages(events: DNSQuery[]): SequenceMessage[] {
  return dnsToSequenceMessages(events);
}

const DNSVisualization = memo(function DNSVisualization({
  stepIndex,
  scenario,
}: {
  stepIndex: number;
  scenario: DNSScenario;
}) {
  const [showCachedView, setShowCachedView] = useState(false);

  const { firstPassEvents, cachedEvents, hasCacheHit } = useMemo(() => {
    const resolver = new DNSResolver();
    // First resolve to populate cache
    resolver.resolve(scenario.domain, scenario.queryType);
    // Second resolve to show cache hit
    const secondEvents = resolver.resolve(scenario.domain, scenario.queryType);
    const allEvents = resolver.getQueryLog();
    const firstPassLength = allEvents.length - secondEvents.length;
    return {
      firstPassEvents: allEvents.slice(0, firstPassLength),
      cachedEvents: secondEvents,
      hasCacheHit: secondEvents.some((e) => e.cached),
    };
  }, [scenario]);

  const events = showCachedView ? cachedEvents : firstPassEvents;

  const messages = useMemo(() => dnsToMessages(events), [events]);

  const rowBgFn = useCallback(
    (index: number) => dnsRowBackground(events, index),
    [events],
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-4 border-b border-border px-4 py-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
          DNS Resolution: {scenario.queryType} {scenario.domain}
        </span>
        {hasCacheHit && (
          <button
            onClick={() => setShowCachedView((prev) => !prev)}
            className={cn(
              "rounded-md px-2 py-0.5 text-[10px] font-semibold ring-1 transition-colors",
              showCachedView
                ? "bg-green-500/20 text-green-400 ring-green-500/40"
                : "bg-elevated text-foreground-muted ring-border hover:bg-background",
            )}
          >
            {showCachedView ? "Cached Lookup" : "First Lookup"}
          </button>
        )}
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-blue-500/20 ring-1 ring-blue-500/40" />
          <span className="text-[11px] text-foreground-muted">Response</span>
        </div>
        {showCachedView && (
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-sm bg-green-500/20 ring-1 ring-green-500/40" />
            <span className="text-[11px] text-foreground-muted">Cache Hit</span>
          </div>
        )}
      </div>
      <div className="flex-1 overflow-auto p-2">
        <SequenceDiagram
          columns={DNS_COLUMNS}
          messages={messages}
          currentIndex={stepIndex}
          rowBgFn={rowBgFn}
          ariaLabel="Sequence diagram showing DNS Resolution message flow"
        />
      </div>
    </div>
  );
});

// ── HTTP Comparison Visualization ───────────────────────────

const HTTP_RESOURCES = [
  { method: "GET", path: "/index.html", sizeKB: 10 },
  { method: "GET", path: "/style.css", sizeKB: 25 },
  { method: "GET", path: "/app.js", sizeKB: 150 },
  { method: "GET", path: "/hero.png", sizeKB: 200 },
  { method: "GET", path: "/logo.svg", sizeKB: 5 },
  { method: "GET", path: "/font.woff2", sizeKB: 40 },
];

const HTTPComparisonVisualization = memo(function HTTPComparisonVisualization({
  stepIndex,
}: {
  stepIndex: number;
}) {
  const comparison = useMemo(
    () => compareHTTPVersions(HTTP_RESOURCES, 50),
    [],
  );

  const maxTime = useMemo(
    () =>
      Math.max(
        comparison.totalTime.http11,
        comparison.totalTime.http2,
        comparison.totalTime.http3,
      ),
    [comparison],
  );

  const versions: Array<{
    key: string;
    label: string;
    events: HTTPRequest[];
    total: number;
    color: string;
    badgeColor: string;
  }> = useMemo(
    () => [
      {
        key: "1.1",
        label: "HTTP/1.1",
        events: comparison.http11,
        total: comparison.totalTime.http11,
        color: "#3b82f6",
        badgeColor: "bg-blue-500/20 text-blue-400 ring-blue-500/30",
      },
      {
        key: "2",
        label: "HTTP/2",
        events: comparison.http2,
        total: comparison.totalTime.http2,
        color: "#8b5cf6",
        badgeColor: "bg-violet-500/20 text-violet-400 ring-violet-500/30",
      },
      {
        key: "3",
        label: "HTTP/3",
        events: comparison.http3,
        total: comparison.totalTime.http3,
        color: "#14b8a6",
        badgeColor: "bg-teal-500/20 text-teal-400 ring-teal-500/30",
      },
    ],
    [comparison],
  );

  // How many resources to reveal based on step index
  // Steps: 0..5 = reveal resources one at a time, 6 = show totals bar
  const revealedCount = Math.min(stepIndex + 1, HTTP_RESOURCES.length);
  const showTotals = stepIndex >= HTTP_RESOURCES.length;

  return (
    <div className="flex h-full flex-col overflow-auto">
      {/* Header legend */}
      <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
          Loading {HTTP_RESOURCES.length} Resources
        </span>
        {versions.map((v) => (
          <span
            key={v.key}
            className={cn(
              "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold ring-1",
              v.badgeColor,
            )}
          >
            {v.label}
          </span>
        ))}
      </div>

      {/* 3-column comparison */}
      <div className="grid flex-1 grid-cols-3 divide-x divide-border">
        {versions.map((v) => (
          <div key={v.key} className="flex flex-col">
            <div
              className="border-b border-border px-3 py-1.5 text-center"
              style={{ backgroundColor: `${v.color}08` }}
            >
              <span className="text-xs font-semibold" style={{ color: v.color }}>
                {v.label}
              </span>
            </div>
            <div className="flex-1 space-y-1 overflow-auto px-2 py-2">
              {v.events.slice(0, revealedCount).map((req, ri) => {
                const barWidth = maxTime > 0 ? (req.latencyMs / maxTime) * 100 : 0;
                return (
                  <div key={ri} className="group relative">
                    <div className="mb-0.5 flex items-center gap-1.5">
                      <span className="truncate font-mono text-[11px] text-foreground-muted">
                        {req.path}
                      </span>
                      {req.blocked && (
                        <span className="whitespace-nowrap rounded bg-red-500/20 px-1 text-[11px] font-medium text-red-400">
                          HOL
                        </span>
                      )}
                      {req.multiplexed && (
                        <span className="whitespace-nowrap rounded bg-green-500/20 px-1 text-[11px] font-medium text-green-400">
                          MUX
                        </span>
                      )}
                    </div>
                    <div className="h-4 w-full overflow-hidden rounded-sm bg-elevated">
                      <div
                        className="flex h-full items-center rounded-sm px-1 transition-all duration-500"
                        style={{
                          width: `${barWidth}%`,
                          backgroundColor: `${v.color}30`,
                          borderLeft: `3px solid ${v.color}`,
                        }}
                      >
                        <span
                          className="whitespace-nowrap text-[11px] font-medium"
                          style={{ color: v.color }}
                        >
                          {req.latencyMs}ms
                        </span>
                      </div>
                    </div>
                    {req.streamId !== undefined && (
                      <span className="mt-0.5 block text-[11px] text-foreground-subtle">
                        Stream {req.streamId} / Conn {req.connectionId}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Total load time comparison bar */}
      {showTotals && (
        <div className="border-t border-border px-4 py-3">
          <span className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
            Total Load Time
          </span>
          <div className="space-y-1.5">
            {versions.map((v) => {
              const barWidth = maxTime > 0 ? (v.total / maxTime) * 100 : 0;
              return (
                <div key={v.key} className="flex items-center gap-2">
                  <span className="w-16 text-right text-[10px] font-medium" style={{ color: v.color }}>
                    {v.label}
                  </span>
                  <div className="h-5 flex-1 overflow-hidden rounded-sm bg-elevated">
                    <div
                      className="flex h-full items-center rounded-sm px-2 transition-all duration-700"
                      style={{
                        width: `${barWidth}%`,
                        backgroundColor: `${v.color}25`,
                        borderLeft: `3px solid ${v.color}`,
                      }}
                    >
                      <span
                        className="whitespace-nowrap text-[10px] font-semibold"
                        style={{ color: v.color }}
                      >
                        {v.total}ms
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});

// ── WebSocket Visualization ────────────────────────────────

function wsToMessages(events: WebSocketEvent[]): SequenceMessage[] {
  return events.map((e) => ({
    from: e.from === "client" ? "Client" : "Server",
    to: e.to === "client" ? "Client" : "Server",
    label: wsLabel(e),
    description: e.description,
  }));
}

function wsLabel(e: WebSocketEvent): string {
  switch (e.type) {
    case "http-upgrade":
      return "GET /ws (Upgrade: websocket)";
    case "upgrade-response":
      return "101 Switching Protocols";
    case "message":
      return `Text: "${e.data ?? ""}"`;
    case "ping":
      return "Ping (0x9)";
    case "pong":
      return "Pong (0xA)";
    case "close-request":
      return `Close (${e.data ?? "1000"})`;
    case "close-response":
      return `Close Ack (${e.data ?? "1000"})`;
    default:
      return e.type;
  }
}

const WebSocketVisualization = memo(function WebSocketVisualization({
  stepIndex,
}: {
  stepIndex: number;
}) {
  const wsEvents = useMemo(() => {
    const ws = new WebSocketSimulation();
    ws.connect();
    ws.sendMessage("client", "Hello server!");
    ws.sendMessage("server", "Hello client!");
    ws.sendMessage("client", "{ action: subscribe }");
    ws.sendMessage("server", "{ status: subscribed }");
    ws.heartbeat();
    ws.close("client");
    return ws.getEvents();
  }, []);

  const messages = useMemo(() => wsToMessages(wsEvents), [wsEvents]);

  // Phase-based color coding
  const rowBgFn = useCallback(
    (index: number) => {
      const ev = wsEvents[index];
      if (!ev) return undefined;
      switch (ev.type) {
        case "http-upgrade":
        case "upgrade-response":
          return "#f59e0b"; // amber for handshake
        case "message":
          return "#3b82f6"; // blue for data
        case "ping":
        case "pong":
          return "#8b5cf6"; // purple for heartbeat
        case "close-request":
        case "close-response":
          return "#ef4444"; // red for close
        default:
          return undefined;
      }
    },
    [wsEvents],
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-4 border-b border-border px-4 py-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
          WebSocket Lifecycle
        </span>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-amber-500/20 ring-1 ring-amber-500/40" />
          <span className="text-[11px] text-foreground-muted">Upgrade</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-blue-500/20 ring-1 ring-blue-500/40" />
          <span className="text-[11px] text-foreground-muted">Messages</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-purple-500/20 ring-1 ring-purple-500/40" />
          <span className="text-[11px] text-foreground-muted">Heartbeat</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-red-500/20 ring-1 ring-red-500/40" />
          <span className="text-[11px] text-foreground-muted">Close</span>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-2">
        <SequenceDiagram
          columns={["Client", "Server"]}
          messages={messages}
          currentIndex={stepIndex}
          rowBgFn={rowBgFn}
          ariaLabel="Sequence diagram showing WebSocket message flow"
        />
      </div>
    </div>
  );
});

// ── CORS Visualization ─────────────────────────────────────

const DEFAULT_CORS_CONFIG: CORSConfig = {
  origin: "https://app.example.com",
  targetOrigin: "https://api.example.com",
  method: "PUT",
  headers: ["Content-Type", "Authorization"],
  credentials: true,
};

const DEFAULT_SERVER_CONFIG = {
  allowedOrigins: ["https://app.example.com"],
  allowedMethods: ["GET", "POST", "PUT"],
  allowedHeaders: ["Content-Type", "Authorization"],
  allowCredentials: true,
  maxAge: 86400,
};

function corsStepIcon(step: CORSStep) {
  switch (step.type) {
    case "check-same-origin":
      return <Globe className="h-3.5 w-3.5" />;
    case "check-simple-request":
      return <Shield className="h-3.5 w-3.5" />;
    case "preflight-options":
      return <ArrowRight className="h-3.5 w-3.5" />;
    case "preflight-response":
      return step.success ? (
        <CheckCircle2 className="h-3.5 w-3.5" />
      ) : (
        <XCircle className="h-3.5 w-3.5" />
      );
    case "actual-request":
      return <Zap className="h-3.5 w-3.5" />;
    case "actual-response":
      return step.success ? (
        <CheckCircle2 className="h-3.5 w-3.5" />
      ) : (
        <XCircle className="h-3.5 w-3.5" />
      );
    case "error":
      return <XCircle className="h-3.5 w-3.5" />;
    default:
      return null;
  }
}

function corsStepLabel(step: CORSStep): string {
  switch (step.type) {
    case "check-same-origin":
      return "Same-Origin Check";
    case "check-simple-request":
      return "Simple Request Check";
    case "preflight-options":
      return "OPTIONS Preflight";
    case "preflight-response":
      return "Preflight Response";
    case "actual-request":
      return "Actual Request";
    case "actual-response":
      return "Actual Response";
    case "error":
      return "CORS Error";
    default:
      return step.type;
  }
}

const CORSVisualization = memo(function CORSVisualization({
  stepIndex,
  corsConfig,
}: {
  stepIndex: number;
  corsConfig: CORSConfig;
}) {
  const steps = useMemo(
    () => simulateCORS(corsConfig, DEFAULT_SERVER_CONFIG),
    [corsConfig],
  );

  const revealedSteps = steps.slice(0, stepIndex + 1);

  return (
    <div className="flex h-full flex-col overflow-auto">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
          CORS Flow
        </span>
        <span className="rounded bg-elevated px-1.5 py-0.5 font-mono text-[11px] text-foreground-muted">
          {corsConfig.origin}
        </span>
        <ArrowRight className="h-3 w-3 text-foreground-subtle" />
        <span className="rounded bg-elevated px-1.5 py-0.5 font-mono text-[11px] text-foreground-muted">
          {corsConfig.targetOrigin}
        </span>
      </div>

      {/* Decision tree / step flow */}
      <div className="flex-1 overflow-auto px-4 py-3">
        <div className="space-y-2">
          {revealedSteps.map((step, i) => {
            const isCurrent = i === stepIndex;
            const isError = step.type === "error";
            return (
              <div key={i} className="flex gap-3">
                {/* Vertical line connector */}
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-2",
                      isError
                        ? "bg-red-500/20 text-red-400 ring-red-500/40"
                        : step.success
                          ? isCurrent
                            ? "bg-primary/20 text-primary ring-primary/40"
                            : "bg-green-500/20 text-green-400 ring-green-500/40"
                          : "bg-red-500/20 text-red-400 ring-red-500/40",
                    )}
                  >
                    {corsStepIcon(step)}
                  </div>
                  {i < revealedSteps.length - 1 && (
                    <div className="h-full w-px bg-border" />
                  )}
                </div>

                {/* Step content */}
                <div
                  className={cn(
                    "mb-1 flex-1 rounded-md border p-2.5",
                    isCurrent
                      ? "border-primary/40 bg-primary/5"
                      : isError
                        ? "border-red-500/30 bg-red-500/5"
                        : "border-border bg-elevated/50",
                  )}
                >
                  <div className="mb-1 flex items-center gap-2">
                    <span
                      className={cn(
                        "text-xs font-semibold",
                        isError
                          ? "text-red-400"
                          : step.success
                            ? "text-foreground"
                            : "text-red-400",
                      )}
                    >
                      {corsStepLabel(step)}
                    </span>
                    {step.success ? (
                      <span className="rounded bg-green-500/15 px-1.5 py-0.5 text-[11px] font-medium text-green-400">
                        PASS
                      </span>
                    ) : (
                      <span className="rounded bg-red-500/15 px-1.5 py-0.5 text-[11px] font-medium text-red-400">
                        FAIL
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] leading-relaxed text-foreground-muted">
                    {step.description}
                  </p>
                  {step.headers && Object.keys(step.headers).length > 0 && (
                    <div className="mt-1.5 rounded-md bg-background/60 p-1.5">
                      {Object.entries(step.headers).map(([k, v]) => (
                        <div key={k} className="font-mono text-[11px]">
                          <span className="text-primary">{k}</span>
                          <span className="text-foreground-subtle">: </span>
                          <span className="text-foreground-muted">{v}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

// ── CDN Flow Visualization ─────────────────────────────────

function cdnToMessages(steps: CDNStep[]): SequenceMessage[] {
  const seqMsgs = cdnToSequenceMessages(steps);
  return seqMsgs.map((s) => ({
    from: s.from,
    to: s.to,
    label: s.label,
    description: s.description,
    highlighted: s.highlighted,
  }));
}

function cdnStepColor(action: CDNStep["action"]): string | undefined {
  return cdnRowBackground(action);
}

const CDNVisualization = memo(function CDNVisualization({
  stepIndex,
  scenario,
}: {
  stepIndex: number;
  scenario: CDNScenario;
}) {
  const activeSteps = useMemo(() => simulateCDNFlow(scenario), [scenario]);
  const messages = useMemo(() => cdnToMessages(activeSteps), [activeSteps]);

  const scenarioDef = CDN_SCENARIOS.find((s) => s.id === scenario);

  const rowBgFn = useCallback(
    (index: number) => {
      const step = activeSteps[index];
      if (!step) return undefined;
      return cdnStepColor(step.action);
    },
    [activeSteps],
  );

  // Compute cumulative latency for display
  const cumulativeLatency = useMemo(() => {
    let total = 0;
    return activeSteps.map((s) => {
      total += s.latencyMs;
      return total;
    });
  }, [activeSteps]);

  return (
    <div className="flex h-full flex-col overflow-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-4 border-b border-border px-4 py-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
          CDN Request Flow — {scenarioDef?.name ?? scenario}
        </span>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-green-500/20 ring-1 ring-green-500/40" />
          <span className="text-[11px] text-foreground-muted">Cache Hit</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-red-500/20 ring-1 ring-red-500/40" />
          <span className="text-[11px] text-foreground-muted">Cache Miss / Purge</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-amber-500/20 ring-1 ring-amber-500/40" />
          <span className="text-[11px] text-foreground-muted">Origin Fetch / Stale</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-violet-500/20 ring-1 ring-violet-500/40" />
          <span className="text-[11px] text-foreground-muted">Cache Store / Revalidate</span>
        </div>
      </div>

      {/* Sequence diagram */}
      <div className="flex-1 overflow-auto p-2">
        <SequenceDiagram
          columns={CDN_SEQUENCE_COLUMNS}
          messages={messages}
          currentIndex={stepIndex}
          rowBgFn={rowBgFn}
          ariaLabel="Sequence diagram showing CDN Flow message flow"
        />
      </div>

      {/* Cache-Control headers for current step */}
      {activeSteps[stepIndex]?.headers && (
        <div className="border-t border-border px-4 py-2">
          <div className="rounded-md bg-background/60 p-2">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-foreground-subtle">
              HTTP Headers
            </span>
            {Object.entries(activeSteps[stepIndex].headers!).map(([k, v]) => (
              <div key={k} className="font-mono text-[11px]">
                <span className="text-primary">{k}</span>
                <span className="text-foreground-subtle">: </span>
                <span className="text-foreground-muted">{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Latency timeline */}
      <div className="border-t border-border px-4 py-2">
        <div className="flex flex-wrap items-center gap-2">
          {activeSteps.map((step, i) => {
            const isActive = i <= stepIndex;
            return (
              <div key={i} className="flex items-center gap-1">
                <div
                  className={cn(
                    "rounded px-1.5 py-0.5 text-[11px] font-medium transition-opacity",
                    isActive ? "opacity-100" : "opacity-30",
                  )}
                  style={{
                    backgroundColor: `${cdnStepColor(step.action) ?? "#6b7280"}20`,
                    color: cdnStepColor(step.action) ?? "#6b7280",
                  }}
                >
                  +{step.latencyMs}ms
                </div>
                {i < activeSteps.length - 1 && (
                  <ArrowRight className="h-2.5 w-2.5 text-foreground-subtle" />
                )}
              </div>
            );
          })}
          {stepIndex >= activeSteps.length - 1 && (
            <span className="ml-auto text-[11px] font-semibold text-foreground-muted">
              Total: {cumulativeLatency[cumulativeLatency.length - 1]}ms
            </span>
          )}
        </div>
      </div>
    </div>
  );
});

// ── API Comparison Visualization ───────────────────────────

const API_OPERATIONS: { id: APIOperation; label: string }[] = [
  { id: "list-users", label: "List Users" },
  { id: "get-user-by-id", label: "Get User by ID" },
  { id: "create-user", label: "Create User" },
  { id: "stream-updates", label: "Stream Updates" },
];

interface APIBarProps {
  label: string;
  value: number;
  maxValue: number;
  color: string;
  unit: string;
}

const APIBar = memo(function APIBar({ label, value, maxValue, color, unit }: APIBarProps) {
  const barWidth = maxValue > 0 ? (value / maxValue) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="w-16 text-right text-[10px] font-medium" style={{ color }}>
        {label}
      </span>
      <div className="h-5 flex-1 overflow-hidden rounded-sm bg-elevated">
        <div
          className="flex h-full items-center rounded-sm px-2 transition-all duration-500"
          style={{
            width: `${Math.max(barWidth, 8)}%`,
            backgroundColor: `${color}25`,
            borderLeft: `3px solid ${color}`,
          }}
        >
          <span
            className="whitespace-nowrap text-[10px] font-semibold"
            style={{ color }}
          >
            {value.toLocaleString()}{unit}
          </span>
        </div>
      </div>
    </div>
  );
});

const RATING_LABELS: Record<string, { text: string; color: string }> = {
  none: { text: "None", color: "#ef4444" },
  limited: { text: "Limited", color: "#f59e0b" },
  partial: { text: "Partial", color: "#3b82f6" },
  full: { text: "Full", color: "#22c55e" },
  low: { text: "Low", color: "#22c55e" },
  medium: { text: "Medium", color: "#f59e0b" },
  high: { text: "High", color: "#ef4444" },
};

const APIComparisonVisualization = memo(function APIComparisonVisualization({
  stepIndex,
  operation,
}: {
  stepIndex: number;
  operation: APIOperation;
}) {
  const result = useMemo(() => compareAPIs(operation), [operation]);
  const qualMetrics = useMemo(() => getAPIQualitativeMetrics(), []);
  const examples = useMemo(() => getAPIRequestExamples(operation), [operation]);
  const descriptions = useMemo(() => getAPIOperationDescriptions(operation), [operation]);

  const protocols = useMemo(
    () => [
      { key: "rest" as const, label: "REST", color: "#3b82f6", badgeColor: "bg-blue-500/20 text-blue-400 ring-blue-500/30" },
      { key: "graphql" as const, label: "GraphQL", color: "#ec4899", badgeColor: "bg-pink-500/20 text-pink-400 ring-pink-500/30" },
      { key: "grpc" as const, label: "gRPC", color: "#14b8a6", badgeColor: "bg-teal-500/20 text-teal-400 ring-teal-500/30" },
    ],
    [],
  );

  const maxRequests = Math.max(result.rest.requests, result.graphql.requests, result.grpc.requests);
  const maxBytes = Math.max(result.rest.totalBytes, result.graphql.totalBytes, result.grpc.totalBytes);
  const maxLatency = Math.max(result.rest.latencyMs, result.graphql.latencyMs, result.grpc.latencyMs);

  // Steps: 0 = requests, 1 = bytes, 2 = latency, 3 = qualitative, 4 = request examples, 5 = descriptions
  const showRequests = stepIndex >= 0;
  const showBytes = stepIndex >= 1;
  const showLatency = stepIndex >= 2;
  const showQualitative = stepIndex >= 3;
  const showExamples = stepIndex >= 4;
  const showDescriptions = stepIndex >= 5;

  return (
    <div className="flex h-full flex-col overflow-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
          API Comparison: {API_OPERATIONS.find((o) => o.id === operation)?.label}
        </span>
        {protocols.map((p) => (
          <span
            key={p.key}
            className={cn(
              "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold ring-1",
              p.badgeColor,
            )}
          >
            {p.label}
          </span>
        ))}
      </div>

      {/* Metrics sections */}
      <div className="flex-1 overflow-auto px-4 py-3 space-y-5">
        {/* Requests */}
        {showRequests && (
          <div>
            <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
              Requests Required
            </h4>
            <div className="space-y-1.5">
              {protocols.map((p) => (
                <APIBar
                  key={p.key}
                  label={p.label}
                  value={result[p.key].requests}
                  maxValue={maxRequests}
                  color={p.color}
                  unit=""
                />
              ))}
            </div>
          </div>
        )}

        {/* Bytes */}
        {showBytes && (
          <div>
            <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
              Total Bytes Transferred
            </h4>
            <div className="space-y-1.5">
              {protocols.map((p) => (
                <APIBar
                  key={p.key}
                  label={p.label}
                  value={result[p.key].totalBytes}
                  maxValue={maxBytes}
                  color={p.color}
                  unit=" B"
                />
              ))}
            </div>
          </div>
        )}

        {/* Latency */}
        {showLatency && (
          <div>
            <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
              End-to-End Latency
            </h4>
            <div className="space-y-1.5">
              {protocols.map((p) => (
                <APIBar
                  key={p.key}
                  label={p.label}
                  value={result[p.key].latencyMs}
                  maxValue={maxLatency}
                  color={p.color}
                  unit="ms"
                />
              ))}
            </div>
          </div>
        )}

        {/* Qualitative feature matrix */}
        {showQualitative && (
          <div>
            <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
              Feature Comparison
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-1.5 pr-3 text-left font-semibold text-foreground-muted">Feature</th>
                    {protocols.map((p) => (
                      <th key={p.key} className="pb-1.5 px-2 text-center font-semibold" style={{ color: p.color }}>
                        {p.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {(["streamingSupport", "browserSupport", "codeGeneration", "schemaEnforcement", "learningCurve"] as const).map((feature) => (
                    <tr key={feature}>
                      <td className="py-1.5 pr-3 text-foreground-muted capitalize">
                        {feature.replace(/([A-Z])/g, " $1").trim()}
                      </td>
                      {qualMetrics.map((m) => {
                        const val = m[feature];
                        const rating = RATING_LABELS[val] ?? { text: val, color: "#6b7280" };
                        return (
                          <td key={m.protocol} className="py-1.5 px-2 text-center">
                            <span
                              className="inline-flex rounded-full px-1.5 py-0.5 text-[11px] font-semibold"
                              style={{
                                backgroundColor: `${rating.color}15`,
                                color: rating.color,
                              }}
                            >
                              {rating.text}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  <tr>
                    <td className="py-1.5 pr-3 text-foreground-muted">Payload Efficiency</td>
                    {qualMetrics.map((m) => (
                      <td key={m.protocol} className="py-1.5 px-2 text-center font-mono text-foreground-muted">
                        {m.payloadEfficiency}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Request/Response Examples */}
        {showExamples && (
          <div className="space-y-3">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
              Request / Response Examples
            </h4>
            {protocols.map((p) => {
              const ex = examples[p.key];
              return (
                <div
                  key={p.key}
                  className="rounded-md border p-2.5"
                  style={{
                    borderColor: `${p.color}30`,
                    backgroundColor: `${p.color}05`,
                  }}
                >
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-xs font-semibold" style={{ color: p.color }}>
                      {p.label}
                    </span>
                    <span className="font-mono text-[11px] text-foreground-subtle">
                      ~{ex.payloadBytes.toLocaleString()} bytes
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <div>
                      <span className="mb-0.5 block text-[11px] font-semibold uppercase text-foreground-subtle">Request</span>
                      <pre className="overflow-x-auto whitespace-pre-wrap rounded bg-background/80 p-1.5 font-mono text-[11px] leading-relaxed text-foreground-muted">
                        {ex.request}
                      </pre>
                    </div>
                    <div>
                      <span className="mb-0.5 block text-[11px] font-semibold uppercase text-foreground-subtle">Response</span>
                      <pre className="overflow-x-auto whitespace-pre-wrap rounded bg-background/80 p-1.5 font-mono text-[11px] leading-relaxed text-foreground-muted">
                        {ex.response}
                      </pre>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Protocol descriptions */}
        {showDescriptions && (
          <div className="space-y-2">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
              How Each Protocol Handles This
            </h4>
            {protocols.map((p) => (
              <div
                key={p.key}
                className="rounded-md border p-2.5"
                style={{
                  borderColor: `${p.color}30`,
                  backgroundColor: `${p.color}05`,
                }}
              >
                <span
                  className="mb-1 block text-xs font-semibold"
                  style={{ color: p.color }}
                >
                  {p.label}
                </span>
                <p className="text-[11px] leading-relaxed text-foreground-muted">
                  {descriptions[p.key]}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

// ── Serialization Comparison Visualization ────────────────

const SerializationVisualization = memo(function SerializationVisualization({
  stepIndex,
  sampleData,
}: {
  stepIndex: number;
  sampleData: object;
}) {
  const results = useMemo(
    () => compareSerializationFormats(sampleData),
    [sampleData],
  );

  const maxSize = useMemo(
    () => Math.max(...results.map((r) => r.sizeBytes)),
    [results],
  );
  const maxSerTime = useMemo(
    () => Math.max(...results.map((r) => r.serializeTimeMs)),
    [results],
  );
  const maxDeserTime = useMemo(
    () => Math.max(...results.map((r) => r.deserializeTimeMs)),
    [results],
  );

  // Steps: 0 = format cards, 1 = size chart, 2 = speed chart, 3 = feature matrix, 4 = schema/data detail
  const showCards = stepIndex >= 0;
  const showSize = stepIndex >= 1;
  const showSpeed = stepIndex >= 2;
  const showFeatures = stepIndex >= 3;
  const showDetail = stepIndex >= 4;

  return (
    <div className="flex h-full flex-col overflow-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
          Serialization Format Comparison
        </span>
        {results.map((r) => (
          <span
            key={r.format}
            className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold ring-1"
            style={{
              backgroundColor: `${r.color}20`,
              color: r.color,
              boxShadow: `inset 0 0 0 1px ${r.color}30`,
            }}
          >
            {r.displayName}
          </span>
        ))}
      </div>

      <div className="flex-1 overflow-auto px-4 py-3 space-y-5">
        {/* Format cards - side by side */}
        {showCards && (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {results.map((r) => (
              <div
                key={r.format}
                className="rounded-lg border p-3"
                style={{
                  borderColor: `${r.color}30`,
                  backgroundColor: `${r.color}05`,
                }}
              >
                <div className="mb-2 flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: r.color }}
                  />
                  <span
                    className="text-xs font-semibold"
                    style={{ color: r.color }}
                  >
                    {r.displayName}
                  </span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-foreground-subtle">Size</span>
                    <span className="font-mono text-[11px] font-semibold text-foreground-muted">
                      {r.sizeBytes}B
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-foreground-subtle">Serialize</span>
                    <span className="font-mono text-[11px] font-semibold text-foreground-muted">
                      {r.serializeTimeMs}ms
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-foreground-subtle">Deserialize</span>
                    <span className="font-mono text-[11px] font-semibold text-foreground-muted">
                      {r.deserializeTimeMs}ms
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-foreground-subtle">Readable</span>
                    <span className="text-[11px]">
                      {r.humanReadable ? (
                        <CheckCircle2 className="inline h-3.5 w-3.5 text-green-400" />
                      ) : (
                        <XCircle className="inline h-3.5 w-3.5 text-red-400" />
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-foreground-subtle">Schema</span>
                    <span className="text-[11px]">
                      {r.schemaRequired ? (
                        <span className="rounded bg-amber-500/15 px-1 text-[11px] font-medium text-amber-400">
                          Required
                        </span>
                      ) : (
                        <span className="rounded bg-green-500/15 px-1 text-[11px] font-medium text-green-400">
                          Optional
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Size comparison bar chart */}
        {showSize && (
          <div>
            <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
              Serialized Size (bytes)
            </h4>
            <div className="space-y-1.5">
              {results.map((r) => (
                <APIBar
                  key={r.format}
                  label={r.displayName}
                  value={r.sizeBytes}
                  maxValue={maxSize}
                  color={r.color}
                  unit="B"
                />
              ))}
            </div>
            <p className="mt-1.5 text-[11px] text-foreground-subtle">
              Protobuf achieves ~{Math.round((1 - results[1].sizeBytes / results[0].sizeBytes) * 100)}% reduction vs JSON through numeric field tags and varint encoding.
            </p>
          </div>
        )}

        {/* Speed comparison bar chart */}
        {showSpeed && (
          <div>
            <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
              Serialization Speed (lower is faster)
            </h4>
            <div className="mb-3 space-y-1.5">
              {results.map((r) => (
                <APIBar
                  key={`ser-${r.format}`}
                  label={r.displayName}
                  value={r.serializeTimeMs}
                  maxValue={maxSerTime}
                  color={r.color}
                  unit="ms"
                />
              ))}
            </div>
            <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
              Deserialization Speed (lower is faster)
            </h4>
            <div className="space-y-1.5">
              {results.map((r) => (
                <APIBar
                  key={`deser-${r.format}`}
                  label={r.displayName}
                  value={r.deserializeTimeMs}
                  maxValue={maxDeserTime}
                  color={r.color}
                  unit="ms"
                />
              ))}
            </div>
          </div>
        )}

        {/* Feature matrix */}
        {showFeatures && (
          <div>
            <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
              Feature Comparison
            </h4>
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-border bg-elevated/50">
                    <th className="px-2.5 py-1.5 text-left font-medium text-foreground-muted">Feature</th>
                    {results.map((r) => (
                      <th
                        key={r.format}
                        className="px-2.5 py-1.5 text-center font-semibold"
                        style={{ color: r.color }}
                      >
                        {r.displayName}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/50">
                    <td className="px-2.5 py-1.5 text-foreground-muted">Human Readable</td>
                    {results.map((r) => (
                      <td key={r.format} className="px-2.5 py-1.5 text-center">
                        {r.humanReadable ? (
                          <CheckCircle2 className="mx-auto h-3.5 w-3.5 text-green-400" />
                        ) : (
                          <XCircle className="mx-auto h-3.5 w-3.5 text-red-400" />
                        )}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="px-2.5 py-1.5 text-foreground-muted">Schema Required</td>
                    {results.map((r) => (
                      <td key={r.format} className="px-2.5 py-1.5 text-center">
                        {r.schemaRequired ? (
                          <CheckCircle2 className="mx-auto h-3.5 w-3.5 text-amber-400" />
                        ) : (
                          <XCircle className="mx-auto h-3.5 w-3.5 text-foreground-subtle" />
                        )}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="px-2.5 py-1.5 text-foreground-muted">Schema Evolution</td>
                    {(['limited', 'excellent', 'limited', 'excellent'] as const).map((level, i) => (
                      <td key={results[i].format} className="px-2.5 py-1.5 text-center">
                        <span className={cn(
                          "rounded px-1 text-[11px] font-medium",
                          level === 'excellent'
                            ? "bg-green-500/15 text-green-400"
                            : "bg-amber-500/15 text-amber-400",
                        )}>
                          {level}
                        </span>
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="px-2.5 py-1.5 text-foreground-muted">Browser Native</td>
                    {([true, false, false, false] as const).map((native, i) => (
                      <td key={results[i].format} className="px-2.5 py-1.5 text-center">
                        {native ? (
                          <CheckCircle2 className="mx-auto h-3.5 w-3.5 text-green-400" />
                        ) : (
                          <XCircle className="mx-auto h-3.5 w-3.5 text-foreground-subtle" />
                        )}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-2.5 py-1.5 text-foreground-muted">Streaming Support</td>
                    {([false, true, false, true] as const).map((streaming, i) => (
                      <td key={results[i].format} className="px-2.5 py-1.5 text-center">
                        {streaming ? (
                          <CheckCircle2 className="mx-auto h-3.5 w-3.5 text-green-400" />
                        ) : (
                          <XCircle className="mx-auto h-3.5 w-3.5 text-foreground-subtle" />
                        )}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Detailed serialized output + descriptions */}
        {showDetail && (
          <div className="space-y-3">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
              Serialized Output
            </h4>
            {results.map((r) => (
              <div
                key={r.format}
                className="rounded-lg border p-3"
                style={{
                  borderColor: `${r.color}30`,
                  backgroundColor: `${r.color}05`,
                }}
              >
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="text-xs font-semibold" style={{ color: r.color }}>
                    {r.displayName}
                  </span>
                  <span className="rounded bg-elevated px-1.5 py-0.5 font-mono text-[11px] text-foreground-subtle">
                    {r.sizeBytes} bytes
                  </span>
                  {r.humanReadable ? (
                    <span className="rounded bg-green-500/15 px-1 text-[11px] font-medium text-green-400">
                      human-readable
                    </span>
                  ) : (
                    <span className="rounded bg-red-500/15 px-1 text-[11px] font-medium text-red-400">
                      binary
                    </span>
                  )}
                </div>
                <pre className="max-h-32 overflow-auto rounded-md bg-background/60 p-2 font-mono text-[11px] leading-relaxed text-foreground-muted">
                  {r.serialized}
                </pre>
                <p className="mt-2 text-[11px] leading-relaxed text-foreground-muted">
                  {r.description}
                </p>
                {r.schemaDefinition && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-[11px] font-medium text-foreground-subtle hover:text-foreground-muted">
                      View Schema Definition
                    </summary>
                    <pre className="mt-1 max-h-40 overflow-auto rounded-md bg-background/60 p-2 font-mono text-[11px] leading-relaxed text-foreground-muted">
                      {r.schemaDefinition}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

// ── Sidebar ─────────────────────────────────────────────────

const NetworkingSidebar = memo(function NetworkingSidebar({
  active,
  onSelect,
  stepIndex,
  totalSteps,
  onStep,
  onPrevStep,
  onPlay,
  onPause,
  onReset,
  isPlaying,
}: {
  active: Protocol;
  onSelect: (p: Protocol) => void;
  stepIndex: number;
  totalSteps: number;
  onStep: () => void;
  onPrevStep: () => void;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  isPlaying: boolean;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-sidebar-border px-3 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
          Network Protocols
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {PROTOCOLS.map((p) => (
          <button
            key={p.id}
            onClick={() => onSelect(p.id)}
            aria-current={active === p.id ? "true" : undefined}
            title={p.description}
            className={cn(
              "mb-1 w-full rounded-md px-3 py-2.5 text-left transition-colors",
              active === p.id
                ? "bg-primary/15 text-primary"
                : "text-foreground-muted hover:bg-elevated hover:text-foreground",
            )}
          >
            <span className="block text-sm font-medium">{p.name}</span>
            <span className="block text-[11px] text-foreground-subtle">
              {p.description}
            </span>
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t border-sidebar-border px-3 py-2">
        <button
          onClick={onPrevStep}
          disabled={stepIndex <= 0}
          title="Previous step (Left Arrow)"
          className="flex h-7 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-elevated disabled:opacity-40"
        >
          <SkipBack className="h-3 w-3" /> Prev
        </button>
        <button
          onClick={onStep}
          disabled={stepIndex >= totalSteps - 1}
          title="Next step (Right Arrow)"
          className="flex h-7 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-elevated disabled:opacity-40"
        >
          <SkipForward className="h-3 w-3" /> Step
        </button>
        {isPlaying ? (
          <button
            onClick={onPause}
            title="Pause (Space)"
            className="flex h-7 items-center gap-1.5 rounded-md bg-amber-600 px-2.5 text-xs font-medium text-white transition-colors hover:bg-amber-700"
          >
            <Pause className="h-3 w-3" /> Pause
          </button>
        ) : (
          <button
            onClick={onPlay}
            disabled={stepIndex >= totalSteps - 1}
            title="Play all steps (Space)"
            className="flex h-7 items-center gap-1.5 rounded-md bg-primary px-2.5 text-xs font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-40"
          >
            <Play className="h-3 w-3" /> Play All
          </button>
        )}
        <button
          onClick={onReset}
          title="Reset to first step (R)"
          className="flex h-7 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-elevated"
        >
          <RotateCcw className="h-3 w-3" /> Reset
        </button>
        <span className="ml-auto font-mono text-[11px] text-foreground-subtle" aria-live="polite">
          {stepIndex + 1}/{totalSteps}
        </span>
      </div>
    </div>
  );
});

// ── Properties Panel ────────────────────────────────────────

const NetworkingProperties = memo(function NetworkingProperties({
  active,
  messages,
  stepIndex,
  showTLS12,
  onToggleTLS12,
  show0RTT,
  onToggle0RTT,
  dnsScenario,
  onDnsScenarioChange,
  corsConfig,
  onCorsConfigChange,
  cdnScenario,
  onCdnScenarioChange,
  apiOperation,
  onApiOperationChange,
  sampleDataJson,
  onSampleDataJsonChange,
  sampleDataError,
}: {
  active: Protocol;
  messages: SequenceMessage[];
  stepIndex: number;
  showTLS12: boolean;
  onToggleTLS12: () => void;
  show0RTT: boolean;
  onToggle0RTT: () => void;
  dnsScenario: DNSScenario;
  onDnsScenarioChange: (scenario: DNSScenario) => void;
  corsConfig: CORSConfig;
  onCorsConfigChange: (config: CORSConfig) => void;
  cdnScenario: CDNScenario;
  onCdnScenarioChange: (scenario: CDNScenario) => void;
  apiOperation: APIOperation;
  onApiOperationChange: (op: APIOperation) => void;
  sampleDataJson: string;
  onSampleDataJsonChange: (json: string) => void;
  sampleDataError: string | null;
}) {
  const protoDef = PROTOCOLS.find((p) => p.id === active);
  const currentMsg = messages[stepIndex];

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-sidebar-border px-3 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
          Protocol Details
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <h3 className="mb-1 text-sm font-medium text-foreground">
          {protoDef?.name}
        </h3>
        <p className="mb-3 text-xs text-foreground-muted">
          {protoDef?.description}
        </p>

        {/* TLS comparison toggles */}
        {active === "tls-1.3" && (
          <div className="mb-3 space-y-2 rounded-md border border-border bg-elevated p-2">
            <div className="flex items-center gap-2" title="Show TLS 1.2 handshake side-by-side for comparison">
              <Switch
                checked={showTLS12}
                onCheckedChange={onToggleTLS12}
                id="tls-compare"
              />
              <Label htmlFor="tls-compare" className="cursor-pointer text-xs text-foreground-muted">
                Compare with TLS 1.2
              </Label>
            </div>
            <div className="flex items-center gap-2" title="Show 0-RTT resumption with pre-shared key">
              <Switch
                checked={show0RTT}
                onCheckedChange={onToggle0RTT}
                id="tls-0rtt"
              />
              <Label htmlFor="tls-0rtt" className="cursor-pointer text-xs text-foreground-muted">
                Show 0-RTT Resumption
              </Label>
            </div>
          </div>
        )}

        {/* DNS scenario selector */}
        {active === "dns-resolution" && (
          <div className="mb-3 space-y-2 rounded-md border border-border bg-elevated p-2">
            <Label className="mb-0.5 block text-[11px] text-foreground-subtle">
              Record Type Scenario
            </Label>
            {DNS_SCENARIOS.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => onDnsScenarioChange(scenario)}
                title={`${scenario.queryType} lookup for ${scenario.domain}`}
                className={cn(
                  "w-full rounded-md px-2.5 py-1.5 text-left text-xs transition-colors",
                  dnsScenario.id === scenario.id
                    ? "bg-primary/15 text-primary font-medium"
                    : "text-foreground-muted hover:bg-background hover:text-foreground",
                )}
              >
                <span className="font-medium">{scenario.name}</span>
                <span className="ml-1 text-[11px] text-foreground-subtle">{scenario.domain}</span>
              </button>
            ))}
          </div>
        )}

        {/* CDN scenario selector */}
        {active === "cdn-flow" && (
          <div className="mb-3 space-y-2 rounded-md border border-border bg-elevated p-2">
            <Label className="mb-0.5 block text-[11px] text-foreground-subtle">
              CDN Scenario
            </Label>
            {CDN_SCENARIOS.map((s) => (
              <button
                key={s.id}
                onClick={() => onCdnScenarioChange(s.id)}
                title={s.description}
                className={cn(
                  "w-full rounded-md px-2.5 py-1.5 text-left text-xs transition-colors",
                  cdnScenario === s.id
                    ? "bg-primary/15 text-primary font-medium"
                    : "text-foreground-muted hover:bg-background hover:text-foreground",
                )}
              >
                <span className="font-medium">{s.name}</span>
                <span className="ml-1 text-[11px] text-foreground-subtle">{s.description}</span>
              </button>
            ))}
          </div>
        )}

        {/* API operation selector */}
        {active === "api-comparison" && (
          <div className="mb-3 space-y-2 rounded-md border border-border bg-elevated p-2">
            <Label className="mb-0.5 block text-[11px] text-foreground-subtle">
              Operation
            </Label>
            {API_OPERATIONS.map((op) => (
              <button
                key={op.id}
                onClick={() => onApiOperationChange(op.id)}
                className={cn(
                  "w-full rounded-md px-2.5 py-1.5 text-left text-xs transition-colors",
                  apiOperation === op.id
                    ? "bg-primary/15 text-primary font-medium"
                    : "text-foreground-muted hover:bg-background hover:text-foreground",
                )}
              >
                {op.label}
              </button>
            ))}
          </div>
        )}

        {/* CORS config inputs */}
        {active === "cors" && (
          <div className="mb-3 space-y-2 rounded-md border border-border bg-elevated p-2">
            <div>
              <Label className="mb-0.5 block text-[11px] text-foreground-subtle">
                Origin URL
              </Label>
              <Input
                inputSize="sm"
                value={corsConfig.origin}
                onChange={(e) =>
                  onCorsConfigChange({ ...corsConfig, origin: e.target.value })
                }
              />
            </div>
            <div>
              <Label className="mb-0.5 block text-[11px] text-foreground-subtle">
                Target URL
              </Label>
              <Input
                inputSize="sm"
                value={corsConfig.targetOrigin}
                onChange={(e) =>
                  onCorsConfigChange({
                    ...corsConfig,
                    targetOrigin: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <Label className="mb-0.5 block text-[11px] text-foreground-subtle">
                Method
              </Label>
              <Input
                inputSize="sm"
                value={corsConfig.method}
                onChange={(e) =>
                  onCorsConfigChange({ ...corsConfig, method: e.target.value })
                }
              />
            </div>
            <div>
              <Label className="mb-0.5 block text-[11px] text-foreground-subtle">
                Headers (comma-separated)
              </Label>
              <Input
                inputSize="sm"
                value={corsConfig.headers.join(", ")}
                onChange={(e) =>
                  onCorsConfigChange({
                    ...corsConfig,
                    headers: e.target.value
                      .split(",")
                      .map((h) => h.trim())
                      .filter(Boolean),
                  })
                }
              />
            </div>
            <div className="flex items-center gap-2" title="Include cookies and auth headers in the request">
              <Switch
                checked={corsConfig.credentials}
                onCheckedChange={(checked) =>
                  onCorsConfigChange({
                    ...corsConfig,
                    credentials: checked,
                  })
                }
                id="cors-creds"
              />
              <Label
                htmlFor="cors-creds"
                className="cursor-pointer text-xs text-foreground-muted"
              >
                Include Credentials
              </Label>
            </div>
          </div>
        )}

        {/* Serialization sample data editor */}
        {active === "serialization" && (
          <div className="mb-3 space-y-2 rounded-md border border-border bg-elevated p-2">
            <Label className="mb-0.5 block text-[11px] text-foreground-subtle">
              Sample Data (JSON)
            </Label>
            <textarea
              className="w-full rounded-md border border-border bg-background p-2 font-mono text-[11px] leading-relaxed text-foreground-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              rows={10}
              value={sampleDataJson}
              onChange={(e) => onSampleDataJsonChange(e.target.value)}
            />
            {sampleDataError && (
              <p className="text-[11px] text-red-400">{sampleDataError}</p>
            )}
            <button
              onClick={() => onSampleDataJsonChange(JSON.stringify(SAMPLE_USER_DATA, null, 2))}
              className="w-full rounded-md border border-border bg-background px-2 py-1 text-[11px] font-medium text-foreground-muted transition-colors hover:bg-elevated"
            >
              Reset to Default
            </button>
          </div>
        )}

        {currentMsg && (
          <div className="mb-3 rounded-md border border-border bg-elevated p-2">
            <div className="mb-1 flex items-center gap-1.5 text-xs text-foreground-muted">
              <span className="font-medium text-foreground">
                {currentMsg.from}
              </span>
              <ArrowRight className="h-3 w-3" />
              <span className="font-medium text-foreground">
                {currentMsg.to}
              </span>
            </div>
            <p className="mb-1 font-mono text-xs font-medium text-primary">
              {currentMsg.label}
            </p>
            <p className="text-xs text-foreground-muted">
              {currentMsg.description}
            </p>
          </div>
        )}

        {/* Step list */}
        <div>
          <h4 className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-foreground-muted">
            All Steps
          </h4>
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "mb-1 rounded-md px-2 py-1.5 text-xs transition-colors",
                i === stepIndex
                  ? "bg-primary/15 text-primary"
                  : i <= stepIndex
                    ? "text-foreground-muted"
                    : "text-foreground-subtle opacity-50",
              )}
            >
              <span className="font-mono">{i + 1}.</span> {msg.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

// ── Bottom Panel ────────────────────────────────────────────

// ── Completion summaries per protocol ─────────────────────────
const PROTOCOL_SUMMARIES: Record<Protocol, string> = {
  "tcp-handshake": "You traced the full TCP lifecycle: handshake \u2192 data transfer \u2192 teardown.",
  "tls-1.3": "You followed the TLS 1.3 key exchange, certificate verification, and encrypted channel setup.",
  "dns-resolution": "You walked through the recursive DNS lookup chain from stub resolver to authoritative nameserver.",
  "http-comparison": "You compared HTTP/1.1, HTTP/2, and HTTP/3 request flows and saw how multiplexing reduces latency.",
  "websocket": "You traced the WebSocket upgrade handshake, full-duplex messaging, heartbeat, and graceful close.",
  "cors": "You followed the CORS preflight flow: same-origin check, OPTIONS request, and response validation.",
  "cdn-flow": "You traced the CDN request lifecycle through edge cache, origin fetch, and cache storage.",
  "api-comparison": "You compared REST, GraphQL, and gRPC across requests, payload size, latency, and features.",
  "serialization": "You compared JSON, Protobuf, MessagePack, and Avro across size, speed, and features.",
};

const NetworkingBottomPanel = memo(function NetworkingBottomPanel({
  messages,
  stepIndex,
  active,
  onReset,
  onSelectProtocol,
}: {
  messages: SequenceMessage[];
  stepIndex: number;
  active: Protocol;
  onReset: () => void;
  onSelectProtocol: (p: Protocol) => void;
}) {
  const [bottomTab, setBottomTab] = useState<"steps" | "learn">("steps");
  const current = messages[stepIndex];
  const isComplete = stepIndex >= messages.length - 1 && messages.length > 0;

  const tabBtnClass = (isActive: boolean) =>
    cn(
      "flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold uppercase tracking-wider transition-colors",
      isActive
        ? "bg-primary/15 text-primary"
        : "text-foreground-muted hover:text-foreground",
    );

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2">
        <button onClick={() => setBottomTab("steps")} className={tabBtnClass(bottomTab === "steps")}>
          Step Description
        </button>
        {bottomTab === "steps" && active === "http-comparison" && (
          <span className="ml-auto text-[11px] text-foreground-subtle">
            Step {stepIndex + 1}: {stepIndex < HTTP_RESOURCES.length ? `Loading ${HTTP_RESOURCES[stepIndex]?.path}` : "Total comparison"}
          </span>
        )}
        <button onClick={() => setBottomTab("learn")} className={tabBtnClass(bottomTab === "learn")}>
          <BookOpen className="h-3 w-3" />
          Learn
        </button>
      </div>

      {bottomTab === "learn" ? (
        <div className="flex-1 overflow-auto px-4 py-3">
          <Suspense fallback={<div className="py-4 text-center text-xs text-foreground-subtle">Loading...</div>}>
            <div className="flex flex-col gap-6">
              <PacketJourneySimulator />
              <ConnectionPoolVisualization />
            </div>
          </Suspense>
        </div>
      ) : (
        <div className="flex-1 overflow-auto px-4 py-2" aria-live="polite">
          {isComplete && bottomTab === "steps" ? (
            (() => {
              const protoDef = PROTOCOLS.find((p) => p.id === active);
              const currentIdx = PROTOCOLS.findIndex((p) => p.id === active);
              const nextProto = currentIdx < PROTOCOLS.length - 1 ? PROTOCOLS[currentIdx + 1] : null;
              return (
                <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <h3 className="text-sm font-semibold text-foreground">
                      You&apos;ve completed the {protoDef?.name ?? active}!
                    </h3>
                  </div>
                  <p className="mb-3 text-sm text-foreground-muted">
                    {PROTOCOL_SUMMARIES[active]}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={onReset}
                      className="flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-elevated"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Replay
                    </button>
                    {nextProto && (
                      <button
                        onClick={() => onSelectProtocol(nextProto.id)}
                        className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary/90"
                      >
                        Next Protocol: {nextProto.name}
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })()
          ) : current ? (
            <div>
              <div className="mb-1 flex items-center gap-2 text-sm">
                <span className="font-medium text-foreground">
                  {current.from}
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-foreground-subtle" />
                <span className="font-medium text-foreground">{current.to}</span>
                <span className="ml-2 font-mono text-xs text-primary">
                  {current.label}
                </span>
              </div>
              <p className="text-sm text-foreground-muted">
                {current.description}
              </p>
            </div>
          ) : (
            <p className="text-sm text-foreground-subtle">
              Step through the protocol to see details.
            </p>
          )}
        </div>
      )}
    </div>
  );
});

// ── Module Hook ─────────────────────────────────────────────

export function useNetworkingModule() {
  const [active, setActive] = useState<Protocol>("tcp-handshake");
  const [stepIndex, setStepIndex] = useState(0);
  const [showTLS12, setShowTLS12] = useState(false);
  const [show0RTT, setShow0RTT] = useState(false);
  const [dnsScenario, setDnsScenario] = useState<DNSScenario>(DNS_SCENARIOS[0]);
  const [corsConfig, setCorsConfig] = useState<CORSConfig>(DEFAULT_CORS_CONFIG);
  const [cdnScenario, setCdnScenario] = useState<CDNScenario>("cache-hit");
  const [apiOperation, setApiOperation] = useState<APIOperation>("list-users");
  const [sampleDataJson, setSampleDataJson] = useState(() => JSON.stringify(SAMPLE_USER_DATA, null, 2));
  const [sampleDataError, setSampleDataError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const setBottomPanelOpen = useUIStore((s) => s.setBottomPanelOpen);

  const activeModule = useUIStore((s) => s.activeModule);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Auto-open bottom panel on first Networking visit
  useEffect(() => {
    const key = "architex-networking-first-visit";
    if (!localStorage.getItem(key)) {
      setBottomPanelOpen(true);
      localStorage.setItem(key, "true");
    }
  }, [setBottomPanelOpen]);

  const initTcp = useCallback(() => {
    const conn = new TCPConnection();
    conn.connect();
    conn.sendData("client", "Hello!");
    conn.sendData("server", "Hi there!");
    conn.close("client");
    return conn.getAllEvents();
  }, []);

  // ── TLS data (use new data-oriented module) ───────────────
  const tls13Data = useMemo(
    () => show0RTT ? TLS13_0RTT_MESSAGES : TLS13_HANDSHAKE_MESSAGES,
    [show0RTT],
  );

  const tls12Data = useMemo(() => {
    const tls = new TLSHandshake();
    return tls.performTLS12Handshake();
  }, []);

  // ── DNS data ──────────────────────────────────────────────
  const dnsData = useMemo(() => {
    const resolver = new DNSResolver();
    return resolver.resolve(dnsScenario.domain, dnsScenario.queryType);
  }, [dnsScenario]);

  // ── HTTP data ─────────────────────────────────────────────
  const httpComparison = useMemo(
    () => compareHTTPVersions(HTTP_RESOURCES, 50),
    [],
  );

  // ── WebSocket data ────────────────────────────────────────
  const wsEvents = useMemo(() => {
    const ws = new WebSocketSimulation();
    ws.connect();
    ws.sendMessage("client", "Hello server!");
    ws.sendMessage("server", "Hello client!");
    ws.sendMessage("client", "{ action: subscribe }");
    ws.sendMessage("server", "{ status: subscribed }");
    ws.heartbeat();
    ws.close("client");
    return ws.getEvents();
  }, []);

  // ── CORS data ─────────────────────────────────────────────
  const corsSteps = useMemo(
    () => simulateCORS(corsConfig, DEFAULT_SERVER_CONFIG),
    [corsConfig],
  );

  // ── CDN data ──────────────────────────────────────────────
  const cdnSteps = useMemo(
    () => simulateCDNFlow(cdnScenario),
    [cdnScenario],
  );

  // ── API comparison data ───────────────────────────────────
  const apiResult = useMemo(
    () => compareAPIs(apiOperation),
    [apiOperation],
  );

  // ── Serialization comparison data ────────────────────────
  const sampleData = useMemo((): object => {
    try {
      const parsed = JSON.parse(sampleDataJson);
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed;
      }
      return SAMPLE_USER_DATA;
    } catch {
      return SAMPLE_USER_DATA;
    }
  }, [sampleDataJson]);

  const serializationResults = useMemo(
    () => compareSerializationFormats(sampleData),
    [sampleData],
  );

  // Get messages for properties panel step list (the shared format)
  const messages = useMemo((): SequenceMessage[] => {
    switch (active) {
      case "tcp-handshake": {
        const events = initTcp();
        return tcpEventsToMessages(events);
      }
      case "tls-1.3": {
        const tls13Messages = tls13DataToMessages(tls13Data);
        if (showTLS12) {
          const tls12Messages = tlsToMessages(tls12Data);
          const maxLen = Math.max(tls13Messages.length, tls12Messages.length);
          // Pad the shorter array so the step counter covers both protocols
          const padded = [...tls13Messages];
          for (let i = tls13Messages.length; i < maxLen; i++) {
            padded.push(tls12Messages[i] ?? {
              from: "Client",
              to: "Server",
              label: `TLS 1.2 Step ${i + 1}`,
              description: tls12Messages[i]?.description ?? "",
            });
          }
          return padded;
        }
        return tls13Messages;
      }
      case "dns-resolution":
        return dnsToMessages(dnsData);
      case "http-comparison": {
        // One "message" per resource + 1 for the totals bar
        const resourceMsgs: SequenceMessage[] = HTTP_RESOURCES.map((r, i) => ({
          from: "Client",
          to: "Server",
          label: `Load ${r.path} (${r.sizeKB}KB)`,
          description: `Requesting ${r.path}. HTTP/1.1: ${httpComparison.http11[i]?.latencyMs ?? "?"}ms, HTTP/2: ${httpComparison.http2[i]?.latencyMs ?? "?"}ms, HTTP/3: ${httpComparison.http3[i]?.latencyMs ?? "?"}ms.`,
        }));
        resourceMsgs.push({
          from: "Summary",
          to: "Summary",
          label: "Total Load Time Comparison",
          description: `HTTP/1.1: ${httpComparison.totalTime.http11}ms, HTTP/2: ${httpComparison.totalTime.http2}ms, HTTP/3: ${httpComparison.totalTime.http3}ms.`,
        });
        return resourceMsgs;
      }
      case "websocket":
        return wsToMessages(wsEvents);
      case "cors":
        return corsSteps.map((step) => ({
          from: step.type.includes("response") || step.type.includes("error")
            ? "Server"
            : "Browser",
          to: step.type.includes("response") || step.type.includes("error")
            ? "Browser"
            : "Server",
          label: corsStepLabel(step),
          description: step.description,
        }));
      case "cdn-flow":
        return cdnToMessages(cdnSteps);
      case "api-comparison": {
        // 6 steps: requests, bytes, latency, qualitative, examples, descriptions
        const opLabel = API_OPERATIONS.find((o) => o.id === apiOperation)?.label ?? apiOperation;
        return [
          {
            from: "Client",
            to: "Server",
            label: "Request Count",
            description: `${opLabel}: REST=${apiResult.rest.requests}, GraphQL=${apiResult.graphql.requests}, gRPC=${apiResult.grpc.requests} requests.`,
          },
          {
            from: "Client",
            to: "Server",
            label: "Bytes Transferred",
            description: `${opLabel}: REST=${apiResult.rest.totalBytes.toLocaleString()}B, GraphQL=${apiResult.graphql.totalBytes.toLocaleString()}B, gRPC=${apiResult.grpc.totalBytes.toLocaleString()}B.`,
          },
          {
            from: "Client",
            to: "Server",
            label: "End-to-End Latency",
            description: `${opLabel}: REST=${apiResult.rest.latencyMs}ms, GraphQL=${apiResult.graphql.latencyMs}ms, gRPC=${apiResult.grpc.latencyMs}ms.`,
          },
          {
            from: "Summary",
            to: "Summary",
            label: "Feature Comparison",
            description: "Qualitative comparison: streaming support, browser support, code generation, schema enforcement, learning curve, and payload efficiency.",
          },
          {
            from: "Client",
            to: "Server",
            label: "Request/Response Examples",
            description: `Actual request and response formats for the "${opLabel}" operation in REST, GraphQL, and gRPC.`,
          },
          {
            from: "Summary",
            to: "Summary",
            label: "Protocol Descriptions",
            description: `Detailed comparison of how REST, GraphQL, and gRPC each handle the "${opLabel}" operation.`,
          },
        ];
      }
      case "serialization": {
        // 5 steps: cards, size chart, speed chart, feature matrix, detail
        const jsonResult = serializationResults[0];
        const protobufResult = serializationResults[1];
        const msgpackResult = serializationResults[2];
        const avroResult = serializationResults[3];
        return [
          {
            from: "Encoder",
            to: "Format",
            label: "Format Overview",
            description: `Comparing 4 formats: JSON (${jsonResult.sizeBytes}B), Protobuf (${protobufResult.sizeBytes}B), MessagePack (${msgpackResult.sizeBytes}B), Avro (${avroResult.sizeBytes}B).`,
          },
          {
            from: "Encoder",
            to: "Wire",
            label: "Size Comparison",
            description: `Protobuf is ${Math.round((1 - protobufResult.sizeBytes / jsonResult.sizeBytes) * 100)}% smaller than JSON. MessagePack saves ${Math.round((1 - msgpackResult.sizeBytes / jsonResult.sizeBytes) * 100)}%. Avro saves ${Math.round((1 - avroResult.sizeBytes / jsonResult.sizeBytes) * 100)}%.`,
          },
          {
            from: "Encoder",
            to: "Decoder",
            label: "Speed Comparison",
            description: `Serialize: JSON=${jsonResult.serializeTimeMs}ms, Protobuf=${protobufResult.serializeTimeMs}ms, MsgPack=${msgpackResult.serializeTimeMs}ms, Avro=${avroResult.serializeTimeMs}ms. Deserialize: JSON=${jsonResult.deserializeTimeMs}ms, Protobuf=${protobufResult.deserializeTimeMs}ms.`,
          },
          {
            from: "Summary",
            to: "Summary",
            label: "Feature Matrix",
            description: "Comparing human readability, schema requirements, schema evolution, browser support, and streaming support across all four formats.",
          },
          {
            from: "Summary",
            to: "Summary",
            label: "Serialized Output",
            description: "View the actual serialized representation of the data in each format, including schema definitions for Protobuf and Avro.",
          },
        ];
      }
    }
    return assertNever(active);
  }, [active, initTcp, tls13Data, tls12Data, showTLS12, dnsData, httpComparison, wsEvents, corsSteps, cdnSteps, apiOperation, apiResult, serializationResults]);

  const columns = useMemo((): string[] => {
    switch (active) {
      case "tcp-handshake":
      case "tls-1.3":
      case "websocket":
        return ["Client", "Server"];
      case "dns-resolution":
        return DNS_COLUMNS;
      case "http-comparison":
        return ["Client", "Server"];
      case "cors":
        return ["Browser", "Server"];
      case "cdn-flow":
        return CDN_SEQUENCE_COLUMNS;
      case "api-comparison":
        return ["Client", "Server"];
      case "serialization":
        return ["Encoder", "Wire", "Decoder"];
    }
    return assertNever(active);
  }, [active]);

  const handleSelect = useCallback((p: Protocol) => {
    setActive(p);
    setStepIndex(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const handleStep = useCallback(() => {
    setStepIndex((prev) => Math.min(prev + 1, messages.length - 1));
  }, [messages.length]);

  const handlePrevStep = useCallback(() => {
    setStepIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const handlePlay = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setIsPlaying(true);
    timerRef.current = setInterval(() => {
      setStepIndex((prev) => {
        if (prev >= messages.length - 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = null;
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 600);
  }, [messages.length]);

  const handlePause = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const handleReset = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsPlaying(false);
    setStepIndex(0);
  }, []);

  // ── NET-023: Keyboard shortcuts ────────────────────────────
  useEffect(() => {
    if (activeModule !== "networking") return;

    const onKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      switch (e.key) {
        case "ArrowRight":
          e.preventDefault();
          handleStep();
          break;
        case "ArrowLeft":
          e.preventDefault();
          handlePrevStep();
          break;
        case " ":
          e.preventDefault();
          // Toggle play/pause — read current isPlaying state from updater
          setIsPlaying((prev) => {
            if (prev) {
              // Currently playing → pause
              if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
              }
              return false;
            }
            // Currently paused → start playing
            // We cannot call handlePlay here (it also calls setIsPlaying),
            // so we duplicate the timer logic inline.
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = setInterval(() => {
              setStepIndex((prevStep) => {
                if (prevStep >= messages.length - 1) {
                  if (timerRef.current) clearInterval(timerRef.current);
                  timerRef.current = null;
                  setIsPlaying(false);
                  return prevStep;
                }
                return prevStep + 1;
              });
            }, 600);
            return true;
          });
          break;
        case "r":
        case "R":
          e.preventDefault();
          handleReset();
          break;
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [activeModule, handleStep, handlePrevStep, handleReset, messages.length]);

  const handleToggleTLS12 = useCallback(() => {
    setShowTLS12((prev) => !prev);
    setShow0RTT(false);
    setStepIndex(0);
  }, []);

  const handleToggle0RTT = useCallback(() => {
    setShow0RTT((prev) => !prev);
    setShowTLS12(false);
    setStepIndex(0);
  }, []);

  const handleDnsScenarioChange = useCallback((scenario: DNSScenario) => {
    setDnsScenario(scenario);
    setStepIndex(0);
  }, []);

  const handleCorsConfigChange = useCallback((config: CORSConfig) => {
    setCorsConfig(config);
    setStepIndex(0);
  }, []);

  const handleCdnScenarioChange = useCallback((s: CDNScenario) => {
    setCdnScenario(s);
    setStepIndex(0);
  }, []);

  const handleApiOperationChange = useCallback((op: APIOperation) => {
    setApiOperation(op);
    setStepIndex(0);
  }, []);

  const handleSampleDataJsonChange = useCallback((json: string) => {
    setSampleDataJson(json);
    try {
      const parsed = JSON.parse(json);
      if (typeof parsed !== 'object' || parsed === null) {
        setSampleDataError('Must be a JSON object');
      } else {
        setSampleDataError(null);
      }
    } catch (e) {
      setSampleDataError(e instanceof Error ? e.message : 'Invalid JSON');
    }
    setStepIndex(0);
  }, []);

  // Build the canvas based on active protocol
  const canvas = useMemo(() => {
    switch (active) {
      case "tcp-handshake":
        return (
          <div className="flex h-full w-full items-center justify-center bg-background p-4">
            <SequenceDiagram
              columns={columns}
              messages={messages}
              currentIndex={stepIndex}
              ariaLabel="Sequence diagram showing TCP Handshake message flow"
            />
          </div>
        );
      case "tls-1.3":
        return (
          <div className="h-full w-full bg-background">
            <TLSVisualization stepIndex={stepIndex} showTLS12={showTLS12} show0RTT={show0RTT} />
          </div>
        );
      case "dns-resolution":
        return (
          <div className="h-full w-full bg-background">
            <DNSVisualization stepIndex={stepIndex} scenario={dnsScenario} />
          </div>
        );
      case "http-comparison":
        return (
          <div className="h-full w-full bg-background">
            <HTTPComparisonVisualization stepIndex={stepIndex} />
          </div>
        );
      case "websocket":
        return (
          <div className="h-full w-full bg-background">
            <WebSocketVisualization stepIndex={stepIndex} />
          </div>
        );
      case "cors":
        return (
          <div className="h-full w-full bg-background">
            <CORSVisualization stepIndex={stepIndex} corsConfig={corsConfig} />
          </div>
        );
      case "cdn-flow":
        return (
          <div className="h-full w-full bg-background">
            <CDNVisualization stepIndex={stepIndex} scenario={cdnScenario} />
          </div>
        );
      case "api-comparison":
        return (
          <div className="h-full w-full bg-background">
            <APIComparisonVisualization stepIndex={stepIndex} operation={apiOperation} />
          </div>
        );
      case "serialization":
        return (
          <div className="h-full w-full bg-background">
            <SerializationVisualization stepIndex={stepIndex} sampleData={sampleData} />
          </div>
        );
      default: {
        // Exhaustive check: this ensures a compile error if a new Protocol member is added
        const _exhaustiveCheck: never = active;
        return (
          <div className="flex h-full w-full items-center justify-center bg-background p-4">
            <div className="text-center">
              <Globe className="mx-auto mb-3 h-16 w-16 text-foreground-subtle opacity-30" />
              <p className="text-sm text-foreground-muted">
                Select a protocol to visualize.
              </p>
            </div>
          </div>
        );
      }
    }
  }, [active, columns, messages, stepIndex, showTLS12, show0RTT, dnsScenario, corsConfig, cdnScenario, apiOperation, sampleData]);

  return {
    sidebar: (
      <NetworkingSidebar
        active={active}
        onSelect={handleSelect}
        stepIndex={stepIndex}
        totalSteps={messages.length}
        onStep={handleStep}
        onPrevStep={handlePrevStep}
        onPlay={handlePlay}
        onPause={handlePause}
        onReset={handleReset}
        isPlaying={isPlaying}
      />
    ),
    canvas,
    properties: (
      <NetworkingProperties
        active={active}
        messages={messages}
        stepIndex={stepIndex}
        showTLS12={showTLS12}
        onToggleTLS12={handleToggleTLS12}
        show0RTT={show0RTT}
        onToggle0RTT={handleToggle0RTT}
        dnsScenario={dnsScenario}
        onDnsScenarioChange={handleDnsScenarioChange}
        corsConfig={corsConfig}
        onCorsConfigChange={handleCorsConfigChange}
        cdnScenario={cdnScenario}
        onCdnScenarioChange={handleCdnScenarioChange}
        apiOperation={apiOperation}
        onApiOperationChange={handleApiOperationChange}
        sampleDataJson={sampleDataJson}
        onSampleDataJsonChange={handleSampleDataJsonChange}
        sampleDataError={sampleDataError}
      />
    ),
    bottomPanel: (
      <NetworkingBottomPanel
        messages={messages}
        stepIndex={stepIndex}
        active={active}
        onReset={handleReset}
        onSelectProtocol={handleSelect}
      />
    ),
  };
}

export const NetworkingModule = memo(function NetworkingModule() {
  return null;
});
