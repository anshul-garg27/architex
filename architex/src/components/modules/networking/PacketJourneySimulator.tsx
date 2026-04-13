"use client";

import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import {
  Globe,
  Play,
  Pause,
  RotateCcw,
  Shield,
  Server,
  Database,
  ArrowRight,
  Clock,
  Lock,
  Unlock,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────

type Protocol = "HTTP" | "HTTPS" | "gRPC";

interface HopStage {
  id: string;
  label: string;
  sublabel: string;
  layer: string;
  latencyMs: number;
  headerBytes: number;
  icon: "globe" | "lock" | "layers" | "server" | "shield" | "database";
  tlsRequired: boolean;
}

interface PacketState {
  currentHop: number;
  totalBytes: number;
  elapsedMs: number;
  headers: string[];
  direction: "request" | "response";
}

// ── Sample Data ────────────────────────────────────────────────

function buildHops(protocol: Protocol, useTLS: boolean): HopStage[] {
  const hops: HopStage[] = [
    { id: "dns", label: "DNS Resolution", sublabel: "Resolve domain to IP", layer: "Application", latencyMs: 20, headerBytes: 0, icon: "globe", tlsRequired: false },
    { id: "tcp-syn", label: "TCP SYN", sublabel: "3-way handshake (SYN)", layer: "Transport", latencyMs: 15, headerBytes: 20, icon: "layers", tlsRequired: false },
    { id: "tcp-synack", label: "TCP SYN-ACK", sublabel: "3-way handshake (SYN-ACK)", layer: "Transport", latencyMs: 15, headerBytes: 20, icon: "layers", tlsRequired: false },
    { id: "tcp-ack", label: "TCP ACK", sublabel: "3-way handshake (ACK)", layer: "Transport", latencyMs: 5, headerBytes: 20, icon: "layers", tlsRequired: false },
  ];

  if (useTLS || protocol === "HTTPS" || protocol === "gRPC") {
    hops.push(
      { id: "tls-hello", label: "TLS ClientHello", sublabel: "Cipher suite negotiation", layer: "TLS", latencyMs: 10, headerBytes: 200, icon: "lock", tlsRequired: true },
      { id: "tls-cert", label: "TLS Certificate", sublabel: "Server sends certificate chain", layer: "TLS", latencyMs: 25, headerBytes: 3000, icon: "lock", tlsRequired: true },
      { id: "tls-key", label: "TLS Key Exchange", sublabel: "ECDHE key derivation", layer: "TLS", latencyMs: 15, headerBytes: 128, icon: "lock", tlsRequired: true },
      { id: "tls-finish", label: "TLS Finished", sublabel: "Encrypted channel established", layer: "TLS", latencyMs: 5, headerBytes: 64, icon: "lock", tlsRequired: true },
    );
  }

  const httpHeaderSize = protocol === "gRPC" ? 50 : 300;
  const httpLabel = protocol === "gRPC" ? "gRPC Request" : `${protocol} Request`;

  hops.push(
    { id: "http-req", label: httpLabel, sublabel: "Headers + body sent", layer: "Application", latencyMs: 5, headerBytes: httpHeaderSize, icon: "globe", tlsRequired: false },
    { id: "lb", label: "Load Balancer", sublabel: "Route to healthy backend", layer: "Infrastructure", latencyMs: 2, headerBytes: 40, icon: "shield", tlsRequired: false },
    { id: "app", label: "App Server", sublabel: "Process request logic", layer: "Application", latencyMs: 50, headerBytes: 0, icon: "server", tlsRequired: false },
    { id: "db", label: "Database Query", sublabel: "Read/write data", layer: "Data", latencyMs: 10, headerBytes: 0, icon: "database", tlsRequired: false },
    { id: "resp-app", label: "App Response", sublabel: "Serialize response", layer: "Application", latencyMs: 5, headerBytes: httpHeaderSize, icon: "server", tlsRequired: false },
    { id: "resp-lb", label: "LB Forward", sublabel: "Return through load balancer", layer: "Infrastructure", latencyMs: 2, headerBytes: 40, icon: "shield", tlsRequired: false },
    { id: "resp-client", label: "Client Receives", sublabel: "Response arrives at client", layer: "Application", latencyMs: 15, headerBytes: 0, icon: "globe", tlsRequired: false },
  );

  return hops;
}

function getIconComponent(icon: HopStage["icon"]) {
  switch (icon) {
    case "globe": return Globe;
    case "lock": return Lock;
    case "layers": return Layers;
    case "server": return Server;
    case "shield": return Shield;
    case "database": return Database;
  }
}

function layerColor(layer: string): string {
  switch (layer) {
    case "Application": return "var(--primary)";
    case "Transport": return "var(--state-warning)";
    case "TLS": return "var(--state-success)";
    case "Infrastructure": return "var(--viz-seq-high)";
    case "Data": return "var(--node-storage)";
    default: return "var(--foreground-muted)";
  }
}

// ── Component ──────────────────────────────────────────────────

export default function PacketJourneySimulator() {
  const prefersReducedMotion = useReducedMotion();
  const [protocol, setProtocol] = useState<Protocol>("HTTPS");
  const [tlsEnabled, setTlsEnabled] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [packetState, setPacketState] = useState<PacketState>({
    currentHop: -1,
    totalBytes: 0,
    elapsedMs: 0,
    headers: [],
    direction: "request",
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const hops = useMemo(() => buildHops(protocol, tlsEnabled), [protocol, tlsEnabled]);

  const totalLatency = useMemo(
    () => hops.reduce((sum, h) => sum + h.latencyMs, 0),
    [hops],
  );

  const tlsOverhead = useMemo(
    () => hops.filter((h) => h.tlsRequired).reduce((sum, h) => sum + h.latencyMs, 0),
    [hops],
  );

  const handleReset = useCallback(() => {
    setIsRunning(false);
    setPacketState({ currentHop: -1, totalBytes: 0, elapsedMs: 0, headers: [], direction: "request" });
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    handleReset();
  }, [protocol, tlsEnabled, handleReset]);

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    let hopIdx = 0;
    setPacketState({
      currentHop: 0,
      totalBytes: hops[0].headerBytes,
      elapsedMs: hops[0].latencyMs,
      headers: hops[0].headerBytes > 0 ? [hops[0].label] : [],
      direction: "request",
    });

    intervalRef.current = setInterval(() => {
      hopIdx++;
      if (hopIdx >= hops.length) {
        setIsRunning(false);
        if (intervalRef.current) clearInterval(intervalRef.current);
        return;
      }

      const hop = hops[hopIdx];
      const isResponse = hopIdx >= hops.length - 3;

      setPacketState((prev) => ({
        currentHop: hopIdx,
        totalBytes: prev.totalBytes + hop.headerBytes,
        elapsedMs: prev.elapsedMs + hop.latencyMs,
        headers: hop.headerBytes > 0 ? [...prev.headers, hop.label] : prev.headers,
        direction: isResponse ? "response" : "request",
      }));
    }, 600);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, hops]);

  return (
    <div
      className={cn(
        "rounded-lg border p-5",
        "bg-[var(--surface)] border-[var(--border)]",
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Globe className="h-5 w-5" style={{ color: "var(--primary)" }} />
        <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
          Packet Journey Simulator
        </h3>
        <span className="ml-auto text-[10px] px-2 py-0.5 rounded font-mono" style={{ background: "var(--gray-4)", color: "var(--foreground-muted)" }}>
          {totalLatency}ms total
        </span>
      </div>

      {/* Protocol Selector */}
      <div className="flex gap-2 mb-3">
        {(["HTTP", "HTTPS", "gRPC"] as Protocol[]).map((p) => (
          <motion.button
            key={p}
            whileTap={prefersReducedMotion ? {} : { scale: 0.97 }}
            onClick={() => setProtocol(p)}
            className="flex-1 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors"
            style={{
              background: p === protocol ? "var(--violet-3)" : "var(--gray-3)",
              borderColor: p === protocol ? "var(--primary)" : "var(--border)",
              color: p === protocol ? "var(--primary)" : "var(--foreground-muted)",
            }}
          >
            {p}
          </motion.button>
        ))}
      </div>

      {/* TLS Toggle */}
      {protocol === "HTTP" && (
        <div className="flex items-center gap-2 mb-4">
          <motion.button
            whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
            onClick={() => setTlsEnabled((t) => !t)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-medium border"
            style={{
              background: tlsEnabled ? "var(--state-success)" : "var(--gray-3)",
              borderColor: tlsEnabled ? "var(--state-success)" : "var(--border)",
              color: tlsEnabled ? "#fff" : "var(--foreground-muted)",
            }}
          >
            {tlsEnabled ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
            TLS {tlsEnabled ? "ON" : "OFF"}
          </motion.button>
          {tlsEnabled && (
            <span className="text-[10px]" style={{ color: "var(--state-warning)" }}>
              +{tlsOverhead}ms overhead
            </span>
          )}
        </div>
      )}

      {/* Hop Timeline */}
      <div
        className="rounded-md border p-3 mb-4 space-y-1 max-h-[320px] overflow-y-auto"
        style={{ background: "var(--gray-2)", borderColor: "var(--border)" }}
      >
        {hops.map((hop, idx) => {
          const IconComp = getIconComponent(hop.icon);
          const isActive = idx === packetState.currentHop;
          const isPast = idx < packetState.currentHop;
          const color = layerColor(hop.layer);

          return (
            <motion.div
              key={hop.id}
              className="flex items-center gap-2 py-1.5 px-2 rounded-md"
              animate={prefersReducedMotion ? undefined : {
                background: isActive ? "var(--violet-3)" : "transparent",
                opacity: isPast ? 0.5 : 1,
              }}
              style={prefersReducedMotion ? {
                background: isActive ? "var(--violet-3)" : "transparent",
                opacity: isPast ? 0.5 : 1,
              } : undefined}
            >
              <div
                className="w-5 h-5 rounded flex items-center justify-center shrink-0"
                style={{ background: isActive ? color : "var(--gray-5)" }}
              >
                <IconComp className="h-3 w-3" style={{ color: isActive ? "#fff" : "var(--foreground-muted)" }} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-medium truncate" style={{ color: isActive ? color : "var(--foreground)" }}>
                    {hop.label}
                  </span>
                  <span className="text-[9px] px-1 rounded" style={{ background: "var(--gray-5)", color }}>
                    {hop.layer}
                  </span>
                </div>
                <p className="text-[9px] truncate" style={{ color: "var(--foreground-muted)" }}>
                  {hop.sublabel}
                </p>
              </div>

              <div className="flex flex-col items-end shrink-0">
                <span className="text-[9px] font-mono" style={{ color: "var(--foreground-muted)" }}>
                  {hop.latencyMs}ms
                </span>
                {hop.headerBytes > 0 && (
                  <span className="text-[8px] font-mono" style={{ color: "var(--foreground-muted)" }}>
                    +{hop.headerBytes}B
                  </span>
                )}
              </div>

              {isActive && (
                <motion.div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: color }}
                  animate={prefersReducedMotion ? { scale: 1 } : { scale: [1, 1.4, 1] }}
                  transition={prefersReducedMotion ? undefined : { repeat: Infinity, duration: 0.8 }}
                />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="rounded-md border p-3 text-center" style={{ background: "var(--gray-3)", borderColor: "var(--border)" }}>
          <Clock className="h-3.5 w-3.5 mx-auto mb-1" style={{ color: "var(--primary)" }} />
          <p className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>Elapsed</p>
          <p className="text-sm font-bold font-mono" style={{ color: "var(--foreground)" }}>
            {packetState.elapsedMs}ms
          </p>
        </div>
        <div className="rounded-md border p-3 text-center" style={{ background: "var(--gray-3)", borderColor: "var(--border)" }}>
          <Layers className="h-3.5 w-3.5 mx-auto mb-1" style={{ color: "var(--foreground-muted)" }} />
          <p className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>Headers</p>
          <p className="text-sm font-bold font-mono" style={{ color: "var(--foreground)" }}>
            {packetState.totalBytes}B
          </p>
        </div>
        <div className="rounded-md border p-3 text-center" style={{ background: "var(--gray-3)", borderColor: "var(--border)" }}>
          <ArrowRight className="h-3.5 w-3.5 mx-auto mb-1" style={{ color: packetState.direction === "response" ? "var(--state-success)" : "var(--state-warning)" }} />
          <p className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>Direction</p>
          <p className="text-sm font-bold font-mono capitalize" style={{ color: "var(--foreground)" }}>
            {packetState.direction}
          </p>
        </div>
      </div>

      {/* Encapsulation Stack */}
      {packetState.headers.length > 0 && (
        <div className="mb-4">
          <p className="text-[10px] font-medium mb-1.5" style={{ color: "var(--foreground-muted)" }}>
            ENCAPSULATION STACK
          </p>
          <div className="flex flex-wrap gap-1">
            {packetState.headers.map((h, i) => (
              <motion.span
                key={`${h}-${i}`}
                initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.9 }}
                animate={prefersReducedMotion ? undefined : { opacity: 1, scale: 1 }}
                className="text-[9px] px-1.5 py-0.5 rounded font-mono"
                style={{ background: "var(--gray-5)", color: "var(--foreground-muted)" }}
              >
                {h}
              </motion.span>
            ))}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-2">
        <motion.button
          whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
          onClick={() => {
            if (packetState.currentHop >= hops.length - 1) handleReset();
            setIsRunning((r) => !r);
          }}
          className={cn(
            "flex-1 flex items-center justify-center gap-2",
            "rounded-md px-4 py-2 text-sm font-medium",
            "bg-[var(--primary)] text-[var(--primary-foreground)]",
            "hover:bg-[var(--primary-hover)] transition-colors",
          )}
        >
          {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {isRunning ? "Pause" : packetState.currentHop >= hops.length - 1 ? "Restart" : "Send Packet"}
        </motion.button>
        <motion.button
          whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
          onClick={handleReset}
          className={cn(
            "flex items-center justify-center gap-2",
            "rounded-md px-4 py-2 text-sm font-medium border",
          )}
          style={{ background: "var(--gray-3)", borderColor: "var(--border)", color: "var(--foreground-muted)" }}
        >
          <RotateCcw className="h-4 w-4" />
          Reset
        </motion.button>
      </div>
    </div>
  );
}
