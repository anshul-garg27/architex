'use client';

// ─────────────────────────────────────────────────────────────
// ProtocolDeepDive — Interactive Protocol Explorer
// ─────────────────────────────────────────────────────────────
//
// Features:
//   - Protocol selector with 10 protocols
//   - Header field breakdown as stacked coloured blocks
//   - Animated packet construction (fields slide in one by one)
//   - Side-by-side comparison mode (pick 2 protocols)
//   - Performance comparison bar chart
//   - Handshake step-through timeline
//
// Animation: motion spring for stacking, stagger for fields
// ─────────────────────────────────────────────────────────────

import { memo, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import {
  X,
  ChevronRight,
  ArrowLeftRight,
  Layers,
  Zap,
  Clock,
  BarChart3,
  Network,
} from 'lucide-react';
import {
  PROTOCOLS,
  PROTOCOL_SLUGS,
  compareProtocols,
  type ProtocolDefinition,
  type HeaderField,
  type HandshakeStep,
} from '@/lib/innovation/protocol-deep-dive';

// ── Types ──────────────────────────────────────────────────

export interface ProtocolDeepDiveProps {
  /** Initial protocol slug to display. */
  initialProtocol?: string;
  /** Whether the panel is visible. */
  open?: boolean;
  /** Called when the user closes the panel. */
  onClose?: () => void;
  className?: string;
}

type ViewMode = 'single' | 'compare';
type TabId = 'headers' | 'handshake' | 'performance' | 'usecases';

// ── Constants ──────────────────────────────────────────────

const FIELD_COLORS = [
  'bg-blue-500/80',
  'bg-emerald-500/80',
  'bg-amber-500/80',
  'bg-rose-500/80',
  'bg-violet-500/80',
  'bg-cyan-500/80',
  'bg-orange-500/80',
  'bg-pink-500/80',
  'bg-teal-500/80',
  'bg-indigo-500/80',
  'bg-lime-500/80',
  'bg-fuchsia-500/80',
];

const TABS: Array<{ id: TabId; label: string; icon: typeof Layers }> = [
  { id: 'headers', label: 'Headers', icon: Layers },
  { id: 'handshake', label: 'Handshake', icon: Network },
  { id: 'performance', label: 'Performance', icon: Zap },
  { id: 'usecases', label: 'Use Cases', icon: BarChart3 },
];

// ── Component ──────────────────────────────────────────────

export const ProtocolDeepDive = memo(function ProtocolDeepDive({
  initialProtocol = 'tcp',
  open = true,
  onClose,
  className,
}: ProtocolDeepDiveProps) {
  const [selectedSlug, setSelectedSlug] = useState(initialProtocol);
  const [compareSlug, setCompareSlug] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('single');
  const [activeTab, setActiveTab] = useState<TabId>('headers');
  const [animateHeaders, setAnimateHeaders] = useState(true);

  const protocol = PROTOCOLS[selectedSlug];
  const compareData = useMemo(
    () => (compareSlug ? compareProtocols(selectedSlug, compareSlug) : null),
    [selectedSlug, compareSlug],
  );

  const handleSelectProtocol = useCallback((slug: string) => {
    setSelectedSlug(slug);
    setAnimateHeaders(true);
  }, []);

  const handleSelectCompare = useCallback((slug: string) => {
    setCompareSlug(slug);
  }, []);

  const toggleCompareMode = useCallback(() => {
    setViewMode((prev) => {
      if (prev === 'single') {
        // Pick a sensible default for comparison
        const other = PROTOCOL_SLUGS.find((s) => s !== selectedSlug);
        if (other) setCompareSlug(other);
        return 'compare';
      }
      setCompareSlug(null);
      return 'single';
    });
  }, [selectedSlug]);

  if (!open || !protocol) return null;

  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden rounded-xl border border-zinc-700/60 bg-zinc-900/95 shadow-2xl backdrop-blur-sm',
        className,
      )}
    >
      {/* ── Title Bar ─────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-zinc-700/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <Network className="h-4 w-4 text-cyan-400" />
          <span className="text-sm font-semibold text-zinc-100">
            Protocol Deep-Dive
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleCompareMode}
            className={cn(
              'flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors',
              viewMode === 'compare'
                ? 'bg-cyan-600/30 text-cyan-300'
                : 'text-zinc-400 hover:text-zinc-200',
            )}
          >
            <ArrowLeftRight className="h-3 w-3" />
            Compare
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="rounded p-0.5 text-zinc-400 transition-colors hover:text-zinc-200"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── Protocol Selector ─────────────────────────── */}
      <div className="flex gap-1 overflow-x-auto border-b border-zinc-700/50 px-3 py-2">
        {PROTOCOL_SLUGS.map((slug) => (
          <button
            key={slug}
            onClick={() => handleSelectProtocol(slug)}
            className={cn(
              'shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
              slug === selectedSlug
                ? 'bg-cyan-600/30 text-cyan-300'
                : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200',
            )}
          >
            {PROTOCOLS[slug].name}
          </button>
        ))}
      </div>

      {/* ── Compare Selector (when in compare mode) ───── */}
      {viewMode === 'compare' && (
        <div className="flex gap-1 overflow-x-auto border-b border-zinc-700/50 bg-zinc-800/50 px-3 py-2">
          <span className="mr-1 shrink-0 self-center text-xs text-zinc-500">
            vs
          </span>
          {PROTOCOL_SLUGS.filter((s) => s !== selectedSlug).map((slug) => (
            <button
              key={slug}
              onClick={() => handleSelectCompare(slug)}
              className={cn(
                'shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                slug === compareSlug
                  ? 'bg-amber-600/30 text-amber-300'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200',
              )}
            >
              {PROTOCOLS[slug].name}
            </button>
          ))}
        </div>
      )}

      {/* ── Tabs ──────────────────────────────────────── */}
      <div className="flex gap-1 border-b border-zinc-700/50 px-3 py-1.5">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-1 rounded-md px-2.5 py-1 text-xs transition-colors',
                activeTab === tab.id
                  ? 'bg-zinc-700/60 text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-200',
              )}
            >
              <Icon className="h-3 w-3" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Content Area ──────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Layers */}
        <div className="mb-3 flex items-center gap-2">
          <span className="text-xs text-zinc-500">Layers:</span>
          {protocol.layers.map((layer) => (
            <span
              key={layer}
              className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300"
            >
              {layer}
            </span>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'headers' && (
            <motion.div
              key={`headers-${selectedSlug}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {viewMode === 'compare' && compareData ? (
                <CompareHeaders
                  protocolA={compareData.protocolA}
                  protocolB={compareData.protocolB}
                />
              ) : (
                <HeaderBreakdown
                  fields={protocol.headerFields}
                  animate={animateHeaders}
                  onAnimationComplete={() => setAnimateHeaders(false)}
                />
              )}
            </motion.div>
          )}

          {activeTab === 'handshake' && (
            <motion.div
              key={`handshake-${selectedSlug}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {viewMode === 'compare' && compareData ? (
                <CompareHandshake
                  protocolA={compareData.protocolA}
                  protocolB={compareData.protocolB}
                />
              ) : (
                <HandshakeTimeline steps={protocol.handshakeSteps} />
              )}
            </motion.div>
          )}

          {activeTab === 'performance' && (
            <motion.div
              key={`perf-${selectedSlug}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {viewMode === 'compare' && compareData ? (
                <ComparePerformance
                  protocolA={compareData.protocolA}
                  protocolB={compareData.protocolB}
                />
              ) : (
                <PerformancePanel protocol={protocol} />
              )}
            </motion.div>
          )}

          {activeTab === 'usecases' && (
            <motion.div
              key={`usecases-${selectedSlug}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {viewMode === 'compare' && compareData ? (
                <CompareUseCases
                  protocolA={compareData.protocolA}
                  protocolB={compareData.protocolB}
                />
              ) : (
                <UseCasesPanel protocol={protocol} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});

// ── Header Breakdown (Wireshark-style) ──────────────────────

interface HeaderBreakdownProps {
  fields: HeaderField[];
  animate: boolean;
  onAnimationComplete: () => void;
}

const HeaderBreakdown = memo(function HeaderBreakdown({
  fields,
  animate,
  onAnimationComplete,
}: HeaderBreakdownProps) {
  return (
    <div className="space-y-1.5">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
        Packet Header Fields
      </h3>
      {fields.map((field, i) => (
        <motion.div
          key={field.name}
          initial={animate ? { opacity: 0, x: -40, scaleX: 0.8 } : false}
          animate={{ opacity: 1, x: 0, scaleX: 1 }}
          transition={{
            delay: animate ? i * 0.08 : 0,
            type: 'spring',
            stiffness: 300,
            damping: 25,
          }}
          onAnimationComplete={i === fields.length - 1 ? onAnimationComplete : undefined}
          className={cn(
            'flex items-stretch overflow-hidden rounded-md border border-zinc-700/40',
            FIELD_COLORS[i % FIELD_COLORS.length],
          )}
        >
          {/* Colour swatch showing relative size */}
          <div
            className="flex shrink-0 items-center justify-center bg-black/20 px-2 text-[10px] font-mono text-white/80"
            style={{ minWidth: field.sizeBytes > 0 ? `${Math.max(36, field.sizeBytes * 12)}px` : '36px' }}
          >
            {field.sizeBytes > 0 ? `${field.sizeBytes}B` : 'var'}
          </div>
          <div className="flex min-w-0 flex-1 items-center justify-between gap-2 px-3 py-1.5">
            <div className="min-w-0">
              <span className="block text-xs font-semibold text-white">
                {field.name}
              </span>
              <span className="block truncate text-[10px] text-white/70">
                {field.purpose}
              </span>
            </div>
            <span className="shrink-0 rounded bg-black/20 px-1.5 py-0.5 font-mono text-[10px] text-white/80">
              {field.exampleValue}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
});

// ── Handshake Timeline ──────────────────────────────────────

interface HandshakeTimelineProps {
  steps: HandshakeStep[];
}

const HandshakeTimeline = memo(function HandshakeTimeline({
  steps,
}: HandshakeTimelineProps) {
  return (
    <div className="space-y-3">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
        Connection Handshake
      </h3>
      {steps.map((step, i) => (
        <motion.div
          key={step.step}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1, type: 'spring', stiffness: 260, damping: 22 }}
          className="relative flex gap-3 pl-6"
        >
          {/* Timeline dot + line */}
          <div className="absolute left-0 top-0 flex h-full flex-col items-center">
            <div className="mt-1.5 h-3 w-3 shrink-0 rounded-full border-2 border-cyan-400 bg-cyan-400/20" />
            {i < steps.length - 1 && (
              <div className="w-px flex-1 bg-zinc-700/60" />
            )}
          </div>

          <div className="min-w-0 pb-4">
            <div className="mb-1 flex items-center gap-2">
              <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono text-cyan-300">
                Step {step.step}
              </span>
              <span className="text-xs text-zinc-300">
                {step.sender}
              </span>
              <ChevronRight className="h-3 w-3 text-zinc-600" />
              <span className="text-xs text-zinc-300">
                {step.receiver}
              </span>
            </div>
            <div className="mb-1 text-xs font-semibold text-zinc-100">
              {step.message}
            </div>
            <p className="text-[11px] leading-relaxed text-zinc-400">
              {step.description}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
});

// ── Performance Panel ───────────────────────────────────────

interface PerformancePanelProps {
  protocol: ProtocolDefinition;
}

const PerformancePanel = memo(function PerformancePanel({
  protocol,
}: PerformancePanelProps) {
  const perf = protocol.performanceCharacteristics;
  const metrics = [
    { label: 'Latency', value: perf.latencyMs, icon: Clock },
    { label: 'Throughput', value: perf.throughput, icon: Zap },
    { label: 'Overhead', value: perf.overhead, icon: Layers },
    { label: 'Connection Setup', value: perf.connectionSetupTime, icon: Network },
  ];

  return (
    <div className="space-y-3">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
        Performance Characteristics
      </h3>
      {metrics.map((m, i) => {
        const Icon = m.icon;
        return (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="rounded-lg border border-zinc-700/40 bg-zinc-800/50 p-3"
          >
            <div className="mb-1 flex items-center gap-2">
              <Icon className="h-3.5 w-3.5 text-cyan-400" />
              <span className="text-xs font-semibold text-zinc-200">
                {m.label}
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-zinc-400">
              {m.value}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
});

// ── Use Cases Panel ─────────────────────────────────────────

interface UseCasesPanelProps {
  protocol: ProtocolDefinition;
}

const UseCasesPanel = memo(function UseCasesPanel({
  protocol,
}: UseCasesPanelProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Use Cases
        </h3>
        <ul className="space-y-1.5">
          {protocol.useCases.map((uc, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex items-start gap-2 text-xs text-zinc-300"
            >
              <span className="mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" />
              {uc}
            </motion.li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Tradeoffs
        </h3>
        <ul className="space-y-1.5">
          {protocol.tradeoffs.map((t, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 + 0.2 }}
              className="flex items-start gap-2 text-xs text-zinc-300"
            >
              <span className="mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
              {t}
            </motion.li>
          ))}
        </ul>
      </div>

      <div className="rounded-lg border border-zinc-700/40 bg-zinc-800/50 p-3">
        <h3 className="mb-1 text-xs font-semibold text-zinc-200">
          Comparison Notes
        </h3>
        <p className="text-[11px] leading-relaxed text-zinc-400">
          {protocol.comparisonNotes}
        </p>
      </div>
    </div>
  );
});

// ── Compare: Headers ────────────────────────────────────────

interface CompareProps {
  protocolA: ProtocolDefinition;
  protocolB: ProtocolDefinition;
}

const CompareHeaders = memo(function CompareHeaders({
  protocolA,
  protocolB,
}: CompareProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <h4 className="mb-2 text-xs font-semibold text-cyan-300">
          {protocolA.name}
        </h4>
        <HeaderBreakdown
          fields={protocolA.headerFields}
          animate={false}
          onAnimationComplete={() => {}}
        />
      </div>
      <div>
        <h4 className="mb-2 text-xs font-semibold text-amber-300">
          {protocolB.name}
        </h4>
        <HeaderBreakdown
          fields={protocolB.headerFields}
          animate={false}
          onAnimationComplete={() => {}}
        />
      </div>
    </div>
  );
});

// ── Compare: Handshake ──────────────────────────────────────

const CompareHandshake = memo(function CompareHandshake({
  protocolA,
  protocolB,
}: CompareProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <h4 className="mb-2 text-xs font-semibold text-cyan-300">
          {protocolA.name} ({protocolA.handshakeSteps.length} steps)
        </h4>
        <HandshakeTimeline steps={protocolA.handshakeSteps} />
      </div>
      <div>
        <h4 className="mb-2 text-xs font-semibold text-amber-300">
          {protocolB.name} ({protocolB.handshakeSteps.length} steps)
        </h4>
        <HandshakeTimeline steps={protocolB.handshakeSteps} />
      </div>
    </div>
  );
});

// ── Compare: Performance ────────────────────────────────────

const ComparePerformance = memo(function ComparePerformance({
  protocolA,
  protocolB,
}: CompareProps) {
  const metrics: Array<{ label: string; keyA: string; keyB: string }> = [
    {
      label: 'Latency',
      keyA: protocolA.performanceCharacteristics.latencyMs,
      keyB: protocolB.performanceCharacteristics.latencyMs,
    },
    {
      label: 'Throughput',
      keyA: protocolA.performanceCharacteristics.throughput,
      keyB: protocolB.performanceCharacteristics.throughput,
    },
    {
      label: 'Overhead',
      keyA: protocolA.performanceCharacteristics.overhead,
      keyB: protocolB.performanceCharacteristics.overhead,
    },
    {
      label: 'Setup Time',
      keyA: protocolA.performanceCharacteristics.connectionSetupTime,
      keyB: protocolB.performanceCharacteristics.connectionSetupTime,
    },
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
        Performance Comparison
      </h3>
      <div className="mb-3 flex items-center gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded bg-cyan-500" />
          {protocolA.name}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded bg-amber-500" />
          {protocolB.name}
        </span>
      </div>

      {metrics.map((m, i) => (
        <motion.div
          key={m.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          className="rounded-lg border border-zinc-700/40 bg-zinc-800/50 p-3"
        >
          <h4 className="mb-2 text-xs font-semibold text-zinc-200">
            {m.label}
          </h4>
          {/* Bar chart representation */}
          <div className="space-y-2">
            <div>
              <div className="mb-0.5 flex items-center justify-between">
                <span className="text-[10px] text-cyan-300">{protocolA.name}</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-zinc-700/40">
                <motion.div
                  className="h-full rounded-full bg-cyan-500/70"
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ delay: i * 0.08 + 0.1, duration: 0.5 }}
                />
              </div>
              <p className="mt-0.5 text-[10px] text-zinc-500">{m.keyA}</p>
            </div>
            <div>
              <div className="mb-0.5 flex items-center justify-between">
                <span className="text-[10px] text-amber-300">{protocolB.name}</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-zinc-700/40">
                <motion.div
                  className="h-full rounded-full bg-amber-500/70"
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ delay: i * 0.08 + 0.15, duration: 0.5 }}
                />
              </div>
              <p className="mt-0.5 text-[10px] text-zinc-500">{m.keyB}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
});

// ── Compare: Use Cases ──────────────────────────────────────

const CompareUseCases = memo(function CompareUseCases({
  protocolA,
  protocolB,
}: CompareProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <h4 className="mb-2 text-xs font-semibold text-cyan-300">
          {protocolA.name}
        </h4>
        <UseCasesPanel protocol={protocolA} />
      </div>
      <div>
        <h4 className="mb-2 text-xs font-semibold text-amber-300">
          {protocolB.name}
        </h4>
        <UseCasesPanel protocol={protocolB} />
      </div>
    </div>
  );
});
