"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRight,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Sparkles,
  AlertTriangle,
  Brain,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CodeBlock } from "./_Primitives";
import {
  ENTITIES,
  ANTI_PATTERNS,
  EDGE_CASES,
  PATTERN_FIT,
  RETRIEVAL_CARDS,
  type AntiPattern,
  type EdgeCase,
  type PatternFitSituation,
  type RetrievalCard,
} from "./_data";

// ─────────────────────────────────────────────────────────────────────────────
//  Predict-before-reveal — real input + fuzzy match against canonical entities
// ─────────────────────────────────────────────────────────────────────────────

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, "").replace(/s$/, "");
}

const ENTITY_KEYS = ENTITIES.map((e) => normalize(e.name));

interface PredictionResult {
  hits: ReadonlyArray<string>;
  misses: ReadonlyArray<string>;
  extras: ReadonlyArray<string>;
}

function gradePrediction(input: string): PredictionResult {
  const tokens = input
    .split(/[,\n;|]/)
    .map((t) => t.trim())
    .filter(Boolean);
  const normalized = tokens.map((t) => ({ raw: t, norm: normalize(t) }));
  const hits = normalized.filter((t) => ENTITY_KEYS.includes(t.norm));
  const extras = normalized.filter((t) => !ENTITY_KEYS.includes(t.norm));
  const hitNorms = new Set(hits.map((h) => h.norm));
  const misses = ENTITIES.filter((e) => !hitNorms.has(normalize(e.name))).map((e) => e.name);
  const seen = new Set<string>();
  const dedupHits = hits
    .map((h) => ENTITIES.find((e) => normalize(e.name) === h.norm)?.name)
    .filter((n): n is string => !!n && (!seen.has(n) ? (seen.add(n), true) : false));
  return { hits: dedupHits, misses, extras: extras.map((e) => e.raw) };
}

export function PredictBeforeReveal() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<PredictionResult | null>(null);

  const submit = useCallback(() => {
    if (!input.trim()) return;
    setResult(gradePrediction(input));
  }, [input]);

  return (
    <div className="rounded-xl border border-dashed border-border bg-surface/30 p-6">
      <div className="mb-3 flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-[hsl(258_85%_76%)]">
        <Brain aria-hidden className="size-3.5" />
        Predict before you read on
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        List every object you'd put in a parking-lot system. Comma-separated, freeform —
        we'll grade it against the canonical set.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder="Vehicle, ParkingSpot, Ticket, …"
          className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-[hsl(258_78%_64%)] focus:outline-none focus:ring-2 focus:ring-[hsl(258_78%_64%)]/30"
          aria-label="Your entity prediction"
        />
        <Button onClick={submit} disabled={!input.trim()}>
          Grade my list
        </Button>
      </div>
      <AnimatePresence>
        {result ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-5 space-y-4"
          >
            <div className="flex flex-wrap gap-3 text-xs">
              <span className="rounded-md bg-[hsl(140_60%_45%)]/10 px-2.5 py-1 text-[hsl(140_60%_70%)]">
                ✓ {result.hits.length} hit{result.hits.length === 1 ? "" : "s"}
              </span>
              <span className="rounded-md bg-[hsl(35_90%_55%)]/10 px-2.5 py-1 text-[hsl(35_90%_70%)]">
                ◐ {result.misses.length} missed
              </span>
              {result.extras.length > 0 ? (
                <span className="rounded-md bg-muted px-2.5 py-1 text-muted-foreground">
                  + {result.extras.length} extra
                </span>
              ) : null}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {ENTITIES.map((e) => {
                const isHit = result.hits.includes(e.name);
                return (
                  <div
                    key={e.name}
                    className={cn(
                      "rounded-lg border p-3 transition-colors",
                      isHit
                        ? "border-[hsl(140_60%_45%)]/40 bg-[hsl(140_60%_45%)]/5"
                        : "border-border bg-surface/60",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-foreground">{e.name}</h3>
                      {isHit ? (
                        <CheckCircle2 aria-hidden className="size-3.5 text-[hsl(140_60%_60%)]" />
                      ) : (
                        <span aria-hidden className="text-[10px] text-muted-foreground">missed</span>
                      )}
                    </div>
                    <div className="my-2 h-px w-full bg-border" />
                    <ul className="space-y-0.5 font-mono text-[10.5px] text-muted-foreground">
                      {e.attrs.map((a) => (
                        <li key={a}>· {a}</li>
                      ))}
                    </ul>
                    {e.hint ? (
                      <p className="mt-2 text-[10.5px] italic text-foreground/60">{e.hint}</p>
                    ) : null}
                  </div>
                );
              })}
            </div>
            {result.extras.length > 0 ? (
              <p className="text-xs text-muted-foreground">
                <span className="font-mono">extras you listed:</span>{" "}
                {result.extras.map((e, i) => (
                  <span key={i}>
                    <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">{e}</span>{" "}
                  </span>
                ))}
                — possibly fine, possibly outside this bounded context.
              </p>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Retrieval check — mini FSRS-style flashcard with grade buttons
// ─────────────────────────────────────────────────────────────────────────────

type FsrsGrade = "again" | "hard" | "good" | "easy";

function loadCardState(cardId: string): { grade?: FsrsGrade } {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(`fsrs:parking-lot:${cardId}`);
    return raw ? (JSON.parse(raw) as { grade: FsrsGrade }) : {};
  } catch {
    return {};
  }
}

function saveCardState(cardId: string, grade: FsrsGrade) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      `fsrs:parking-lot:${cardId}`,
      JSON.stringify({ grade, at: Date.now() }),
    );
  } catch {
    // best-effort
  }
}

export function RetrievalCheck({ card }: { card: RetrievalCard }) {
  const [picked, setPicked] = useState<number | null>(null);
  const [graded, setGraded] = useState<FsrsGrade | null>(() => loadCardState(card.id).grade ?? null);

  const correctIdx = card.options.findIndex((o) => o.correct);
  const isCorrect = picked !== null && picked === correctIdx;

  return (
    <div
      role="region"
      aria-label="Retrieval check"
      className="rounded-xl border border-[hsl(258_78%_64%)]/30 bg-gradient-to-br from-[hsl(258_78%_64%)]/5 via-surface to-background p-6"
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-[hsl(258_85%_76%)]">
          <Sparkles aria-hidden className="size-3" />
          Retrieval check
        </span>
        {graded ? (
          <span className="font-mono text-[10px] text-muted-foreground">
            last graded · {graded}
          </span>
        ) : null}
      </div>
      <p className="mb-4 text-[15px] text-foreground/90">{card.prompt}</p>
      <ul className="space-y-2">
        {card.options.map((opt, i) => {
          const isPicked = picked === i;
          const showResult = picked !== null;
          const isThisCorrect = i === correctIdx;
          return (
            <li key={i}>
              <button
                type="button"
                onClick={() => setPicked(i)}
                disabled={picked !== null}
                aria-pressed={isPicked}
                className={cn(
                  "group flex w-full items-center gap-3 rounded-lg border px-4 py-2.5 text-left text-sm transition-all",
                  !showResult && "border-border bg-elevated/40 hover:border-[hsl(258_78%_64%)]/40 hover:bg-elevated",
                  showResult && isThisCorrect && "border-[hsl(140_60%_45%)]/50 bg-[hsl(140_60%_45%)]/10 text-foreground",
                  showResult && !isThisCorrect && isPicked && "border-destructive/50 bg-destructive/10 text-foreground/70",
                  showResult && !isThisCorrect && !isPicked && "border-border/40 bg-surface/40 text-muted-foreground",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-mono",
                    isPicked && !showResult && "border-[hsl(258_78%_64%)] bg-[hsl(258_78%_64%)]/20",
                    showResult && isThisCorrect && "border-[hsl(140_60%_45%)] bg-[hsl(140_60%_45%)]/20",
                    showResult && !isThisCorrect && isPicked && "border-destructive bg-destructive/20",
                  )}
                >
                  {showResult ? (
                    isThisCorrect ? <CheckCircle2 className="size-3 text-[hsl(140_60%_70%)]" /> : isPicked ? <XCircle className="size-3 text-destructive" /> : ""
                  ) : (
                    String.fromCharCode(65 + i)
                  )}
                </span>
                <span className="flex-1">{opt.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <AnimatePresence>
        {picked !== null ? (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-4 space-y-3"
          >
            <p className={cn("rounded-md border px-3 py-2 text-[13px]", isCorrect ? "border-[hsl(140_60%_45%)]/40 bg-[hsl(140_60%_45%)]/5 text-foreground/90" : "border-destructive/40 bg-destructive/5 text-foreground/90")}>
              {isCorrect ? "Correct. " : "Not quite. "}
              {card.why}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                grade your recall
              </span>
              {(["again", "hard", "good", "easy"] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => {
                    setGraded(g);
                    saveCardState(card.id, g);
                  }}
                  className={cn(
                    "rounded-md border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors",
                    graded === g
                      ? "border-[hsl(258_78%_64%)] bg-[hsl(258_78%_64%)]/15 text-[hsl(258_85%_76%)]"
                      : "border-border bg-surface/40 text-muted-foreground hover:border-[hsl(258_78%_64%)]/40",
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Pattern-fit judge — Bloom's "Evaluate" level
// ─────────────────────────────────────────────────────────────────────────────

function PatternFitCard({ situation }: { situation: PatternFitSituation }) {
  const [picked, setPicked] = useState<number | null>(null);
  const correctIdx = situation.options.findIndex((o) => o.correct);
  return (
    <div className="rounded-xl border border-border bg-surface/40 p-5">
      <p className="mb-4 text-[14.5px] leading-relaxed text-foreground/90">{situation.prompt}</p>
      <div className="grid gap-2 sm:grid-cols-3">
        {situation.options.map((opt, i) => {
          const showResult = picked !== null;
          const isThisCorrect = i === correctIdx;
          const isPicked = picked === i;
          return (
            <button
              key={i}
              type="button"
              onClick={() => setPicked(i)}
              disabled={showResult}
              aria-pressed={isPicked}
              className={cn(
                "rounded-lg border px-3 py-2 text-left text-[13px] transition-all",
                !showResult && "border-border bg-elevated/40 hover:border-[hsl(258_78%_64%)]/40",
                showResult && isThisCorrect && "border-[hsl(140_60%_45%)]/50 bg-[hsl(140_60%_45%)]/10",
                showResult && !isThisCorrect && isPicked && "border-destructive/50 bg-destructive/10",
                showResult && !isThisCorrect && !isPicked && "border-border/40 bg-surface/40 opacity-70",
              )}
            >
              <span className="font-medium text-foreground">{opt.label}</span>
            </button>
          );
        })}
      </div>
      <AnimatePresence>
        {picked !== null ? (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-4 space-y-2"
          >
            {situation.options.map((opt, i) => (
              <div
                key={i}
                className={cn(
                  "rounded-md border-l-2 px-3 py-2 text-[12.5px] leading-relaxed",
                  opt.correct ? "border-[hsl(140_60%_45%)] bg-[hsl(140_60%_45%)]/5" : "border-border bg-elevated/40",
                )}
              >
                <span className={cn("mr-1.5 font-mono text-[10px] uppercase tracking-wider", opt.correct ? "text-[hsl(140_60%_70%)]" : "text-muted-foreground")}>
                  {opt.correct ? "✓ correct" : "× tempting but no"}
                </span>
                <span className="font-medium text-foreground">{opt.label}.</span>{" "}
                <span className="text-foreground/80">{opt.rationale}</span>
              </div>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function PatternFitJudge() {
  return (
    <div className="space-y-3">
      {PATTERN_FIT.map((s) => (
        <PatternFitCard key={s.id} situation={s} />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Anti-pattern museum — side-by-side diff (no toggle)
// ─────────────────────────────────────────────────────────────────────────────

export function AntiPatternMuseum() {
  return (
    <div className="space-y-6">
      {ANTI_PATTERNS.map((ap) => (
        <AntiPatternRow key={ap.id} ap={ap} />
      ))}
    </div>
  );
}

function AntiPatternRow({ ap }: { ap: AntiPattern }) {
  return (
    <div className="overflow-hidden rounded-xl border-2 border-destructive/30 bg-surface/40">
      <div className="border-b border-destructive/20 bg-destructive/5 px-5 py-3">
        <div className="mb-1 flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-[hsl(0_75%_75%)]">
          <AlertTriangle aria-hidden className="size-3" />
          Failed design
        </div>
        <h3 className="text-base font-semibold text-foreground">{ap.name}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{ap.smell}</p>
      </div>
      <div className="grid gap-3 p-4 lg:grid-cols-2">
        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-destructive">
            before · the smell
          </p>
          <CodeBlock language="ts" lines={ap.before} />
        </div>
        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-[hsl(140_60%_70%)]">
            after · the fix
          </p>
          <CodeBlock language="ts" lines={ap.after} />
        </div>
      </div>
      <div className="border-t border-border/60 px-5 py-3 text-xs text-muted-foreground">
        <span className="font-medium text-foreground/85">Why it works:</span> {ap.fix}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Edge case accordion — proper aria-controls + aria-expanded
// ─────────────────────────────────────────────────────────────────────────────

export function EdgeCasesList() {
  return (
    <div className="space-y-2">
      {EDGE_CASES.map((ec) => (
        <EdgeCaseRow key={ec.id} ec={ec} />
      ))}
    </div>
  );
}

function EdgeCaseRow({ ec }: { ec: EdgeCase }) {
  const [open, setOpen] = useState(false);
  const panelId = `ec-${ec.id}`;
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface/40">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center justify-between gap-4 px-5 py-3 text-left transition-colors hover:bg-surface min-h-[44px]"
      >
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">{ec.title}</p>
          {!open ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{ec.symptom}</p>
          ) : null}
        </div>
        <ChevronDown
          aria-hidden
          className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            id={panelId}
            role="region"
            aria-labelledby={`${panelId}-label`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border/60 px-5 py-4">
              <div className="mb-2 text-[10px] font-medium uppercase tracking-wider text-[hsl(35_90%_70%)]">
                Symptom
              </div>
              <p className="mb-4 text-sm text-foreground/80">{ec.symptom}</p>
              <div className="mb-2 text-[10px] font-medium uppercase tracking-wider text-[hsl(258_85%_76%)]">
                System response
              </div>
              <p className="text-sm text-foreground/85">{ec.response}</p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  State machine widget — accessible (role=status, live region)
// ─────────────────────────────────────────────────────────────────────────────

type SpotState = "VACANT" | "OCCUPIED" | "MAINTENANCE";

interface Transition {
  from: SpotState;
  to: SpotState;
  label: string;
}

const TRANSITIONS: ReadonlyArray<Transition> = [
  { from: "VACANT", to: "OCCUPIED", label: "car parks" },
  { from: "OCCUPIED", to: "VACANT", label: "car exits" },
  { from: "VACANT", to: "MAINTENANCE", label: "manual close" },
  { from: "MAINTENANCE", to: "VACANT", label: "issue resolved" },
  { from: "OCCUPIED", to: "MAINTENANCE", label: "incident" },
];

const STATE_META: Record<SpotState, { glow: string; ring: string; label: string }> = {
  VACANT: {
    glow: "shadow-[0_0_60px_-10px_hsl(140_60%_45%/0.6)]",
    ring: "border-[hsl(140_60%_45%)] text-[hsl(140_60%_75%)]",
    label: "spot is available",
  },
  OCCUPIED: {
    glow: "shadow-[0_0_60px_-10px_hsl(258_78%_64%/0.7)]",
    ring: "border-[hsl(258_78%_64%)] text-[hsl(258_85%_76%)]",
    label: "vehicle present",
  },
  MAINTENANCE: {
    glow: "shadow-[0_0_60px_-10px_hsl(35_90%_55%/0.6)]",
    ring: "border-[hsl(35_90%_55%)] text-[hsl(35_90%_70%)]",
    label: "out of service",
  },
};

export function StateMachineWidget() {
  const [state, setState] = useState<SpotState>("VACANT");
  const validTransitions = useMemo(
    () => TRANSITIONS.filter((t) => t.from === state),
    [state],
  );

  return (
    <div className="rounded-xl border border-border bg-surface/40 p-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Current state
          </p>
          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl border-2 bg-background/40 p-8 transition-all duration-500",
              STATE_META[state].ring,
              STATE_META[state].glow,
            )}
          >
            <p className="font-mono text-2xl font-bold tracking-tight">{state}</p>
            <p className="text-xs text-muted-foreground">
              <span className="sr-only">Status: </span>
              {STATE_META[state].label}
            </p>
          </div>
        </div>
        <div aria-hidden className="hidden lg:block" />
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Valid transitions
          </p>
          {validTransitions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No transitions from this state.</p>
          ) : (
            <ul className="space-y-2">
              {validTransitions.map((t) => (
                <li key={`${t.from}-${t.to}`}>
                  <button
                    type="button"
                    onClick={() => setState(t.to)}
                    aria-label={`Trigger transition: ${t.label}, from ${t.from} to ${t.to}`}
                    className="group flex w-full min-h-[44px] items-center justify-between rounded-lg border border-border bg-elevated/40 px-4 py-3 text-left transition-all hover:border-[hsl(258_78%_64%)]/50 hover:bg-elevated"
                  >
                    <div>
                      <p className="font-mono text-xs text-muted-foreground">{t.label}</p>
                      <p className="mt-0.5 text-sm">
                        <span className="text-foreground/70">{t.from}</span>
                        <span aria-hidden className="mx-2 text-[hsl(258_85%_76%)]">→</span>
                        <span className="sr-only"> transitions to </span>
                        <span className="font-medium text-foreground">{t.to}</span>
                      </p>
                    </div>
                    <ArrowRight aria-hidden className="size-4 text-[hsl(258_85%_76%)] opacity-0 transition-opacity group-hover:opacity-100" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {state !== "VACANT" ? (
            <button
              type="button"
              onClick={() => setState("VACANT")}
              className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-[hsl(258_78%_64%)]/40 hover:text-foreground min-h-[24px]"
            >
              reset to VACANT
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Helper export
// ─────────────────────────────────────────────────────────────────────────────

export { RETRIEVAL_CARDS };
