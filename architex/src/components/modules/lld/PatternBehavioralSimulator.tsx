"use client";

import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Shield,
  RotateCcw,
  Play,
  Pause,
  Settings,
  Activity,
  ChevronRight,
  Zap,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────

type PatternId = "circuit-breaker" | "retry" | "bulkhead" | "rate-limiter";
type CBState = "closed" | "open" | "half-open";

interface PatternConfig {
  id: PatternId;
  name: string;
  icon: React.ReactNode;
  description: string;
  params: { key: string; label: string; min: number; max: number; step: number; defaultValue: number }[];
  scenarios: { id: string; name: string; failRate: number; burstSize: number; description: string }[];
}

interface SimMetrics {
  totalRequests: number;
  successCount: number;
  failCount: number;
  rejectedCount: number;
  avgLatencyMs: number;
  currentState: string;
  tokens: number;
  openedAtStep: number;
}

// ── Pattern Definitions ────────────────────────────────────────

const PATTERNS: PatternConfig[] = [
  {
    id: "circuit-breaker",
    name: "Circuit Breaker",
    icon: <Shield className="h-4 w-4" />,
    description: "Opens after threshold failures, blocks requests during cooldown, then tries half-open probes.",
    params: [
      { key: "failThreshold", label: "Failure Threshold", min: 1, max: 20, step: 1, defaultValue: 5 },
      { key: "cooldownMs", label: "Cooldown (ms)", min: 500, max: 10000, step: 500, defaultValue: 3000 },
      { key: "probeCount", label: "Half-Open Probes", min: 1, max: 5, step: 1, defaultValue: 2 },
    ],
    scenarios: [
      { id: "normal", name: "Normal Traffic", failRate: 0.05, burstSize: 1, description: "5% failure rate, steady traffic" },
      { id: "degraded", name: "Degraded Service", failRate: 0.4, burstSize: 1, description: "40% failure rate triggers circuit" },
      { id: "outage", name: "Full Outage", failRate: 1.0, burstSize: 3, description: "100% failures, circuit opens immediately" },
    ],
  },
  {
    id: "retry",
    name: "Retry with Backoff",
    icon: <RotateCcw className="h-4 w-4" />,
    description: "Retries failed requests with exponential backoff and jitter. Limits total retry count.",
    params: [
      { key: "maxRetries", label: "Max Retries", min: 1, max: 10, step: 1, defaultValue: 3 },
      { key: "baseDelayMs", label: "Base Delay (ms)", min: 100, max: 5000, step: 100, defaultValue: 1000 },
      { key: "jitterPct", label: "Jitter (%)", min: 0, max: 50, step: 5, defaultValue: 20 },
    ],
    scenarios: [
      { id: "transient", name: "Transient Failures", failRate: 0.3, burstSize: 1, description: "30% transient errors, retries recover" },
      { id: "flaky", name: "Flaky Dependency", failRate: 0.6, burstSize: 2, description: "60% fail rate, exhausts retries often" },
      { id: "thundering", name: "Thundering Herd", failRate: 0.2, burstSize: 10, description: "Burst of 10 concurrent retries" },
    ],
  },
  {
    id: "bulkhead",
    name: "Bulkhead",
    icon: <Activity className="h-4 w-4" />,
    description: "Limits concurrent requests per partition. Excess requests are queued or rejected to prevent cascade failures.",
    params: [
      { key: "maxConcurrent", label: "Max Concurrent", min: 1, max: 50, step: 1, defaultValue: 10 },
      { key: "queueSize", label: "Queue Size", min: 0, max: 100, step: 5, defaultValue: 20 },
      { key: "timeoutMs", label: "Timeout (ms)", min: 500, max: 10000, step: 500, defaultValue: 3000 },
    ],
    scenarios: [
      { id: "steady", name: "Steady Load", failRate: 0.05, burstSize: 5, description: "Under capacity, all requests served" },
      { id: "spike", name: "Traffic Spike", failRate: 0.1, burstSize: 30, description: "Burst exceeds capacity, queue fills" },
      { id: "slow", name: "Slow Downstream", failRate: 0.0, burstSize: 15, description: "No failures but slow responses fill slots" },
    ],
  },
  {
    id: "rate-limiter",
    name: "Rate Limiter",
    icon: <Clock className="h-4 w-4" />,
    description: "Token bucket algorithm: refills tokens at fixed rate, each request consumes a token. Excess is rejected.",
    params: [
      { key: "bucketSize", label: "Bucket Size", min: 1, max: 100, step: 1, defaultValue: 20 },
      { key: "refillRate", label: "Refill Rate (tok/s)", min: 1, max: 50, step: 1, defaultValue: 10 },
      { key: "costPerReq", label: "Cost per Request", min: 1, max: 10, step: 1, defaultValue: 1 },
    ],
    scenarios: [
      { id: "within-limit", name: "Within Limit", failRate: 0.0, burstSize: 5, description: "Traffic under rate limit" },
      { id: "burst", name: "Burst Traffic", failRate: 0.0, burstSize: 25, description: "Short burst drains bucket" },
      { id: "sustained", name: "Sustained Overload", failRate: 0.0, burstSize: 15, description: "Continuous over-limit traffic" },
    ],
  },
];

// ── Simulation Engine ──────────────────────────────────────────

function simulateStep(
  patternId: PatternId,
  params: Record<string, number>,
  scenario: { failRate: number; burstSize: number },
  prevMetrics: SimMetrics,
): SimMetrics {
  const { totalRequests, successCount, failCount, rejectedCount } = prevMetrics;
  const requestCount = scenario.burstSize;
  let newSuccess = 0;
  let newFail = 0;
  let newRejected = 0;
  let state = prevMetrics.currentState;
  let openedAtStep = prevMetrics.openedAtStep;

  // Rate limiter: refill tokens at the start of each tick, capped at bucketSize
  const bucketSize = params.bucketSize ?? 20;
  const refillRate = params.refillRate ?? 10;
  let tokens = patternId === "rate-limiter"
    ? Math.min(bucketSize, prevMetrics.tokens + refillRate)
    : prevMetrics.tokens;

  for (let i = 0; i < requestCount; i++) {
    const fails = Math.random() < scenario.failRate;

    if (patternId === "circuit-breaker") {
      if (state === "open") {
        newRejected++;
        continue;
      }
      if (fails) {
        newFail++;
        if (failCount + newFail >= (params.failThreshold ?? 5) && state !== "open") {
          state = "open";
          openedAtStep = totalRequests + requestCount;
        }
      } else {
        newSuccess++;
        if (state === "half-open") state = "closed";
      }
    } else if (patternId === "retry") {
      let succeeded = false;
      const maxRetries = params.maxRetries ?? 3;
      for (let r = 0; r <= maxRetries; r++) {
        if (Math.random() >= scenario.failRate) {
          succeeded = true;
          break;
        }
      }
      if (succeeded) newSuccess++;
      else newFail++;
    } else if (patternId === "bulkhead") {
      const maxC = params.maxConcurrent ?? 10;
      const qSize = params.queueSize ?? 20;
      const currentLoad = totalRequests + i - (successCount + failCount + rejectedCount);
      if (currentLoad < maxC + qSize) {
        if (fails) newFail++;
        else newSuccess++;
      } else {
        newRejected++;
      }
    } else if (patternId === "rate-limiter") {
      const cost = params.costPerReq ?? 1;
      if (tokens >= cost) {
        tokens -= cost;
        if (fails) newFail++;
        else newSuccess++;
      } else {
        newRejected++;
      }
    }
  }

  // Transition from open to half-open after cooldown steps
  // Each tick is 400ms, so derive cooldown steps from cooldownMs param
  if (patternId === "circuit-breaker" && state === "open") {
    const cooldownMs = params.cooldownMs ?? 3000;
    const tickMs = 400;
    const cooldownSteps = Math.max(1, Math.round(cooldownMs / tickMs));
    const stepsSinceOpened = totalRequests + requestCount - openedAtStep;
    if (stepsSinceOpened >= cooldownSteps * scenario.burstSize) {
      state = "half-open";
    }
  }

  const latency = patternId === "retry"
    ? 50 + (newFail / Math.max(requestCount, 1)) * (params.baseDelayMs ?? 1000)
    : 20 + (newFail / Math.max(requestCount, 1)) * 100;

  return {
    totalRequests: totalRequests + requestCount,
    successCount: successCount + newSuccess,
    failCount: failCount + newFail,
    rejectedCount: rejectedCount + newRejected,
    avgLatencyMs: Math.round(latency),
    currentState: state,
    tokens,
    openedAtStep,
  };
}

// ── Component ──────────────────────────────────────────────────

export default function PatternBehavioralSimulator() {
  const [patternId, setPatternId] = useState<PatternId>("circuit-breaker");
  const [scenarioId, setScenarioId] = useState("normal");
  const [paramValues, setParamValues] = useState<Record<string, number>>({});
  const [isRunning, setIsRunning] = useState(false);
  const [metrics, setMetrics] = useState<SimMetrics>({
    totalRequests: 0,
    successCount: 0,
    failCount: 0,
    rejectedCount: 0,
    avgLatencyMs: 0,
    currentState: "closed",
    tokens: 20,
    openedAtStep: 0,
  });
  const [eventLog, setEventLog] = useState<string[]>([]);

  const pattern = useMemo(
    () => PATTERNS.find((p) => p.id === patternId) ?? PATTERNS[0],
    [patternId],
  );

  const scenario = useMemo(
    () => pattern.scenarios.find((s) => s.id === scenarioId) ?? pattern.scenarios[0],
    [pattern, scenarioId],
  );

  // Initialize params from pattern defaults
  useEffect(() => {
    const defaults: Record<string, number> = {};
    for (const p of pattern.params) {
      defaults[p.key] = p.defaultValue;
    }
    setParamValues(defaults);
    setMetrics({
      totalRequests: 0,
      successCount: 0,
      failCount: 0,
      rejectedCount: 0,
      avgLatencyMs: 0,
      currentState: "closed",
      tokens: defaults.bucketSize ?? 20,
      openedAtStep: 0,
    });
    setEventLog([]);
    setIsRunning(false);
  }, [pattern]);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setMetrics((prev) => {
        if (prev.totalRequests >= 100) {
          setIsRunning(false);
          return prev;
        }
        const next = simulateStep(patternId, paramValues, scenario, prev);
        setEventLog((log) => {
          const tokenInfo = patternId === "rate-limiter" ? ` | T:${next.tokens}` : "";
          const entry = `[${next.totalRequests}] +${scenario.burstSize}req | S:${next.successCount} F:${next.failCount} R:${next.rejectedCount} | ${next.currentState}${tokenInfo}`;
          return [...log.slice(-9), entry];
        });
        return next;
      });
    }, 400);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, patternId, paramValues, scenario]);

  const handleReset = useCallback(() => {
    setIsRunning(false);
    setMetrics({
      totalRequests: 0,
      successCount: 0,
      failCount: 0,
      rejectedCount: 0,
      avgLatencyMs: 0,
      currentState: "closed",
      tokens: paramValues.bucketSize ?? 20,
      openedAtStep: 0,
    });
    setEventLog([]);
  }, [paramValues]);

  const successRate =
    metrics.totalRequests > 0
      ? ((metrics.successCount / metrics.totalRequests) * 100).toFixed(1)
      : "0.0";

  return (
    <div
      className={cn(
        "rounded-lg border p-5",
        "bg-[var(--surface)] border-[var(--border)]",
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Shield className="h-5 w-5" style={{ color: "var(--primary)" }} />
        <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
          Pattern Behavioral Simulator
        </h3>
      </div>

      {/* Pattern selector */}
      <div className="flex flex-wrap gap-2 mb-4">
        {PATTERNS.map((p) => (
          <motion.button
            key={p.id}
            whileTap={{ scale: 0.97 }}
            onClick={() => { setPatternId(p.id); setScenarioId(PATTERNS.find((pp) => pp.id === p.id)?.scenarios[0]?.id ?? ""); }}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors",
            )}
            style={{
              background: p.id === patternId ? "var(--violet-3)" : "var(--gray-3)",
              borderColor: p.id === patternId ? "var(--primary)" : "var(--border)",
              color: p.id === patternId ? "var(--primary)" : "var(--foreground-muted)",
            }}
          >
            {p.icon}
            {p.name}
          </motion.button>
        ))}
      </div>

      {/* Description */}
      <p className="text-xs mb-4 leading-relaxed" style={{ color: "var(--foreground-muted)" }}>
        {pattern.description}
      </p>

      {/* Scenario selector */}
      <div className="mb-4">
        <label className="block text-xs mb-1.5" style={{ color: "var(--foreground-muted)" }}>
          Scenario
        </label>
        <select
          value={scenarioId}
          onChange={(e) => { setScenarioId(e.target.value); handleReset(); }}
          className={cn(
            "w-full rounded-md border px-3 py-2 text-sm",
            "bg-[var(--surface-elevated)] border-[var(--border)]",
            "focus:outline-none focus:ring-2 focus:ring-[var(--ring)]",
          )}
          style={{ color: "var(--foreground)" }}
        >
          {pattern.scenarios.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} — {s.description}
            </option>
          ))}
        </select>
      </div>

      {/* Parameters */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {pattern.params.map((p) => (
          <div key={p.key}>
            <label className="block text-[10px] mb-1" style={{ color: "var(--foreground-muted)" }}>
              {p.label}: <span style={{ color: "var(--foreground)" }}>{paramValues[p.key] ?? p.defaultValue}</span>
            </label>
            <input
              type="range"
              min={p.min}
              max={p.max}
              step={p.step}
              value={paramValues[p.key] ?? p.defaultValue}
              onChange={(e) =>
                setParamValues((prev) => ({ ...prev, [p.key]: Number(e.target.value) }))
              }
              className="w-full accent-[var(--primary)]"
            />
          </div>
        ))}
      </div>

      {/* State machine visualization */}
      {patternId === "circuit-breaker" && (
        <div className="flex items-center justify-center gap-3 mb-4">
          {(["closed", "open", "half-open"] as CBState[]).map((s) => (
            <motion.div
              key={s}
              animate={{
                scale: metrics.currentState === s ? 1.1 : 1,
                opacity: metrics.currentState === s ? 1 : 0.4,
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs"
              style={{
                background: metrics.currentState === s ? "var(--gray-4)" : "var(--gray-3)",
                borderColor: metrics.currentState === s
                  ? s === "closed" ? "var(--state-success)" : s === "open" ? "var(--state-error)" : "var(--state-warning)"
                  : "var(--border)",
                color: metrics.currentState === s
                  ? s === "closed" ? "var(--state-success)" : s === "open" ? "var(--state-error)" : "var(--state-warning)"
                  : "var(--foreground-muted)",
              }}
            >
              {s === "closed" && <CheckCircle2 className="h-3 w-3" />}
              {s === "open" && <XCircle className="h-3 w-3" />}
              {s === "half-open" && <AlertTriangle className="h-3 w-3" />}
              {s}
            </motion.div>
          ))}
        </div>
      )}

      {/* Metrics */}
      <div className={cn("grid gap-2 mb-4", patternId === "rate-limiter" ? "grid-cols-5" : "grid-cols-4")}>
        <div className="rounded-md border p-2 text-center" style={{ background: "var(--gray-3)", borderColor: "var(--border)" }}>
          <p className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>Requests</p>
          <p className="text-sm font-bold font-mono" style={{ color: "var(--foreground)" }}>{metrics.totalRequests}</p>
        </div>
        <div className="rounded-md border p-2 text-center" style={{ background: "var(--gray-3)", borderColor: "var(--border)" }}>
          <p className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>Success</p>
          <p className="text-sm font-bold font-mono" style={{ color: "var(--state-success)" }}>{successRate}%</p>
        </div>
        <div className="rounded-md border p-2 text-center" style={{ background: "var(--gray-3)", borderColor: "var(--border)" }}>
          <p className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>Failed</p>
          <p className="text-sm font-bold font-mono" style={{ color: "var(--state-error)" }}>{metrics.failCount}</p>
        </div>
        <div className="rounded-md border p-2 text-center" style={{ background: "var(--gray-3)", borderColor: "var(--border)" }}>
          <p className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>Rejected</p>
          <p className="text-sm font-bold font-mono" style={{ color: "var(--state-warning)" }}>{metrics.rejectedCount}</p>
        </div>
        {patternId === "rate-limiter" && (
          <div className="rounded-md border p-2 text-center" style={{ background: "var(--gray-3)", borderColor: "var(--border)" }}>
            <p className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>Tokens</p>
            <p className="text-sm font-bold font-mono" style={{ color: "var(--primary)" }}>{metrics.tokens}</p>
          </div>
        )}
      </div>

      {/* Event log */}
      <div
        className="rounded-md border p-3 mb-4 h-32 overflow-y-auto font-mono text-[10px]"
        style={{ background: "var(--gray-2)", borderColor: "var(--border)", color: "var(--foreground-muted)" }}
      >
        {eventLog.length === 0 ? (
          <span style={{ color: "var(--gray-8)" }}>Press Run to start simulation...</span>
        ) : (
          eventLog.map((entry, i) => (
            <div key={i} className="py-0.5">{entry}</div>
          ))
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsRunning((r) => !r)}
          className={cn(
            "flex-1 flex items-center justify-center gap-2",
            "rounded-md px-4 py-2 text-sm font-medium",
            "bg-[var(--primary)] text-[var(--primary-foreground)]",
            "hover:bg-[var(--primary-hover)] transition-colors",
          )}
        >
          {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {isRunning ? "Pause" : "Run"}
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
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
