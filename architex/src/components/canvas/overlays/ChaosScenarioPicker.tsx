'use client';

/**
 * ChaosScenarioPicker (Survive This Incident)
 *
 * Pre-run overlay listing the active template's chaos scenarios
 * (v2 simulation metadata). Arming a scenario stores it in the
 * scenario store and starts the simulation; an internal effect
 * attaches the scenario-runner to the fresh orchestrator so chaos
 * injections fire at the planned sim-times.
 *
 * While the run is live, a slim banner shows the armed scenario and
 * a countdown to the next injection (derived from the sim tick, so
 * it pauses and re-times with playback speed for free).
 *
 * Renders null when the template has no chaos scenarios.
 */

import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Crosshair, Play, Radiation, ShieldAlert, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSimulationStore } from '@/stores/simulation-store';
import { useTemplateMetaStore } from '@/stores/template-meta-store';
import { useScenarioStore } from '@/stores/scenario-store';
import type { ChaosScenario } from '@/lib/templates/types';
import {
  buildInjectionPlan,
  getActiveInjection,
  getNextInjection,
  runScenario,
  SIM_TICK_MS,
} from '@/lib/simulation/scenario-runner';

// ---------------------------------------------------------------------------
// Severity presentation (template severity is 1-5)
// ---------------------------------------------------------------------------

const SEVERITY_CHIP: Record<number, string> = {
  1: 'bg-severity-low/15 text-severity-low',
  2: 'bg-severity-low/15 text-severity-low',
  3: 'bg-severity-medium/15 text-severity-medium',
  4: 'bg-severity-high/15 text-severity-high',
  5: 'bg-severity-critical/15 text-severity-critical',
};

function severityChipClass(severity: number): string {
  return SEVERITY_CHIP[severity] ?? SEVERITY_CHIP[3];
}

// ---------------------------------------------------------------------------
// Runner binding — attaches the scenario-runner to each fresh orchestrator
// ---------------------------------------------------------------------------

function useScenarioRunnerBinding(): void {
  const orchestratorRef = useSimulationStore((s) => s.orchestratorRef);
  const armedScenario = useScenarioStore((s) => s.armedScenario);
  const activeTemplate = useTemplateMetaStore((s) => s.activeTemplate);

  useEffect(() => {
    if (!orchestratorRef || !armedScenario) return;

    const sim = activeTemplate?.simulation;
    const scenarioStore = useScenarioStore.getState();
    scenarioStore.clearInjections();
    scenarioStore.setVerdict(null);

    return runScenario(
      armedScenario,
      orchestratorRef,
      sim?.slaDefinitions ?? [],
      sim?.performanceTargets ?? null,
      {
        onInjection: (injection, firedAtSimMs) =>
          useScenarioStore
            .getState()
            .recordInjection({ ...injection, firedAtSimMs }),
        onVerdict: (verdict) => useScenarioStore.getState().setVerdict(verdict),
      },
    );
  }, [orchestratorRef, armedScenario, activeTemplate]);
}

// ---------------------------------------------------------------------------
// Scenario row
// ---------------------------------------------------------------------------

interface ScenarioRowProps {
  scenario: ChaosScenario;
  selected: boolean;
  onSelect: (id: string) => void;
}

function ScenarioRow({ scenario, selected, onSelect }: ScenarioRowProps) {
  const plan = useMemo(() => buildInjectionPlan(scenario), [scenario]);

  return (
    <button
      type="button"
      onClick={() => onSelect(scenario.id)}
      aria-pressed={selected}
      className={cn(
        'group w-full rounded-lg border px-3 py-2.5 text-left transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
        selected
          ? 'border-primary/60 bg-primary/10'
          : 'border-border bg-surface/40 hover:border-primary/30 hover:bg-elevated',
      )}
    >
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate text-xs font-semibold text-foreground">
          {scenario.name}
        </span>
        <span
          className={cn(
            'shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide',
            severityChipClass(scenario.severity),
          )}
        >
          Sev {scenario.severity}
        </span>
      </div>

      <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-foreground-muted">
        {scenario.description}
      </p>

      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[9px] font-medium">
        <span className="rounded bg-muted px-1.5 py-0.5 font-mono uppercase text-foreground-muted">
          {scenario.faultType}
        </span>
        <span className="flex items-center gap-0.5 rounded bg-muted px-1.5 py-0.5 text-foreground-muted">
          <Crosshair className="h-2.5 w-2.5" />
          {scenario.targetNodes.length}{' '}
          {scenario.targetNodes.length === 1 ? 'node' : 'nodes'}
        </span>
        {plan.map((injection) => (
          <span
            key={injection.wave}
            className="flex items-center gap-0.5 rounded bg-muted px-1.5 py-0.5 text-foreground-muted"
          >
            <Timer className="h-2.5 w-2.5" />
            {injection.wave === 'aftershock' ? 'aftershock ' : ''}@{' '}
            {Math.round(injection.atMs / 1000)}s
          </span>
        ))}
      </div>

      {selected && (
        <p className="mt-2 border-t border-border/60 pt-2 text-[10px] leading-snug text-foreground-muted">
          <span className="font-semibold text-foreground">Expected:</span>{' '}
          {scenario.expectedBehavior}
        </p>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Running banner
// ---------------------------------------------------------------------------

function ArmedScenarioBanner({ scenario }: { scenario: ChaosScenario }) {
  const currentTick = useSimulationStore((s) => s.currentTick);
  const totalTicks = useSimulationStore((s) => s.totalTicks);

  const plan = useMemo(
    () =>
      buildInjectionPlan(
        scenario,
        totalTicks > 0 ? totalTicks * SIM_TICK_MS : undefined,
      ),
    [scenario, totalTicks],
  );

  const simMs = currentTick * SIM_TICK_MS;
  const next = getNextInjection(plan, simMs);
  const active = getActiveInjection(plan, simMs);

  return (
    <div className="pointer-events-none absolute left-1/2 top-16 z-20 -translate-x-1/2">
      <div
        className={cn(
          'flex items-center gap-2.5 rounded-full border px-3.5 py-1.5 shadow-lg backdrop-blur-sm',
          active
            ? 'border-severity-critical/50 bg-severity-critical/10'
            : 'border-border bg-background/90',
        )}
      >
        <Radiation
          className={cn(
            'h-3.5 w-3.5',
            active ? 'animate-pulse text-severity-critical' : 'text-primary',
          )}
        />
        <span className="max-w-44 truncate text-[11px] font-semibold text-foreground">
          {scenario.name}
        </span>
        <span className="h-3 w-px bg-border" aria-hidden />
        {active ? (
          <span className="text-[11px] font-medium text-severity-critical">
            {active.eventName} active
          </span>
        ) : next ? (
          <span className="font-mono text-[11px] tabular-nums text-foreground-muted">
            next injection in {Math.max(0, Math.ceil((next.atMs - simMs) / 1000))}s
          </span>
        ) : (
          <span className="text-[11px] text-foreground-muted">
            holding — verdict at end of run
          </span>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ChaosScenarioPicker
// ---------------------------------------------------------------------------

export const ChaosScenarioPicker = memo(function ChaosScenarioPicker() {
  const activeTemplate = useTemplateMetaStore((s) => s.activeTemplate);
  const status = useSimulationStore((s) => s.status);
  const play = useSimulationStore((s) => s.play);
  const armedScenario = useScenarioStore((s) => s.armedScenario);
  const arm = useScenarioStore((s) => s.arm);

  useScenarioRunnerBinding();

  const scenarios = activeTemplate?.simulation?.chaosScenarios;
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = useMemo(() => {
    if (!scenarios?.length) return null;
    return scenarios.find((s) => s.id === selectedId) ?? scenarios[0];
  }, [scenarios, selectedId]);

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  const handleRun = useCallback(() => {
    if (!selected) return;
    arm(selected);
    play();
  }, [selected, arm, play]);

  if (!scenarios?.length) return null;

  // Live run: slim banner instead of the full picker.
  if (status === 'running' || status === 'paused') {
    return armedScenario ? <ArmedScenarioBanner scenario={armedScenario} /> : null;
  }

  // Completed runs hand off to the ScenarioVerdictCard in the report.
  if (status !== 'idle') return null;

  return (
    <aside
      aria-label="Chaos scenario picker"
      className="pointer-events-auto absolute right-4 top-4 z-30 w-[324px] overflow-hidden rounded-xl border border-border bg-background/95 shadow-xl backdrop-blur-sm"
    >
      {/* Header */}
      <header className="flex items-center gap-2.5 border-b border-border bg-elevated/60 px-3.5 py-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/15">
          <ShieldAlert className="h-4 w-4 text-primary" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-xs font-semibold leading-tight text-foreground">
            Survive this incident
          </h2>
          <p className="text-[10px] leading-tight text-foreground-muted">
            Pick a chaos drill — SLA verdict at the end
          </p>
        </div>
        <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-foreground-muted">
          {scenarios.length}
        </span>
      </header>

      {/* Scenario list */}
      <div className="max-h-72 space-y-1.5 overflow-y-auto p-2">
        {scenarios.map((scenario) => (
          <ScenarioRow
            key={scenario.id}
            scenario={scenario}
            selected={selected?.id === scenario.id}
            onSelect={handleSelect}
          />
        ))}
      </div>

      {/* Footer */}
      <footer className="border-t border-border p-2">
        <button
          type="button"
          onClick={handleRun}
          disabled={!selected}
          className={cn(
            'flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2',
            'text-xs font-semibold text-primary-foreground transition-colors',
            'hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
            'disabled:cursor-not-allowed disabled:opacity-50',
          )}
        >
          <Play className="h-3.5 w-3.5" />
          Run scenario
        </button>
      </footer>
    </aside>
  );
});
