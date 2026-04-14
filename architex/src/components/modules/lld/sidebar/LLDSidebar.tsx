"use client";

/**
 * LLD Sidebar — Pattern browser, class palette, SOLID browser, problems, sequences, state machines, code-to-diagram.
 * Split from LLDModule.tsx (LLD-037).
 */

import React, { memo, useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  ChevronDown,
  Box,
  Diamond,
  Hexagon,
  Component,
  GripVertical,
  Layers,
  ArrowRightLeft,
  Timer,
  Circle,
  GitBranch,
  FileCode,
  AlertTriangle,
  BookOpen,
  Trophy,
  Search,
  Loader2,
  BarChart3,
  Network,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  UMLClass,
  UMLRelationship,
  DesignPattern,
  PatternCategory,
  SOLIDDemo,
  LLDProblem,
} from "@/lib/lld";
import {
  parseTypeScriptCode,
  parsePythonCode,
} from "@/lib/lld";
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  CATEGORY_TOOLTIPS,
  STEREOTYPE_BORDER_COLOR,
  PRINCIPLE_COLORS,
  DIFFICULTY_COLORS,
  type SidebarMode,
  type PracticeTimerOption,
} from "../constants";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { StreakCounter } from "../panels/StreakCounter";
import { useDueReviews } from "@/hooks/use-due-reviews";
import { useSearch, type SearchResult } from "@/hooks/use-search";
import { LearningPathMap } from "./LearningPathMap";
import { PatternGraph } from "./PatternGraph";

// ── Pattern Browser ──────────────────────────────────────

interface PatternBrowserProps {
  activePatternId: string | null;
  onSelect: (pattern: DesignPattern) => void;
  patterns: DesignPattern[];
}

const PatternBrowser = memo(function PatternBrowser({
  activePatternId,
  onSelect,
  patterns,
}: PatternBrowserProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    creational: true,
    structural: true,
    behavioral: true,
    modern: true,
  });

  const toggle = useCallback((cat: string) => {
    setExpanded((prev) => ({ ...prev, [cat]: !prev[cat] }));
  }, []);

  return (
    <TooltipProvider delayDuration={300}>
    <div className="space-y-1">
      {CATEGORY_ORDER.map((cat) => {
        const catPatterns = patterns.filter((p) => p.category === cat);
        const isOpen = expanded[cat];
        return (
          <div key={cat}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => toggle(cat)}
                  className="flex w-full items-center gap-1.5 rounded-xl px-2 py-1.5 text-left text-[11px] font-semibold uppercase tracking-wider text-foreground-muted transition-colors hover:bg-accent/50 hover:shadow-[0_0_10px_rgba(110,86,207,0.08)]"
                >
                  {isOpen ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                  {CATEGORY_LABELS[cat]}
                  <span className="ml-auto text-[10px] font-normal rounded-full border border-border/30 bg-elevated/50 backdrop-blur-sm px-1.5 py-0.5 text-foreground-subtle">
                    {catPatterns.length}
                  </span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-[240px] text-xs">
                {CATEGORY_TOOLTIPS[cat]}
              </TooltipContent>
            </Tooltip>
            {isOpen && (
              <div className="ml-3 space-y-0.5">
                {catPatterns.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => onSelect(p)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-xl border px-2 py-1.5 text-left text-xs transition-all",
                      activePatternId === p.id
                        ? "border-primary/30 bg-primary/10 text-primary shadow-[0_0_15px_rgba(110,86,207,0.15)]"
                        : "border-border/30 bg-elevated/50 text-foreground-muted hover:bg-elevated hover:text-foreground",
                    )}
                  >
                    <Layers className="h-3 w-3 shrink-0 opacity-60" />
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
    </TooltipProvider>
  );
});

// ── Class Palette ────────────────────────────────────────

const CLASS_PALETTE_ITEMS = [
  { type: "class" as const, label: "Class", icon: Box },
  { type: "interface" as const, label: "Interface", icon: Component },
  { type: "abstract" as const, label: "Abstract Class", icon: Diamond },
  { type: "enum" as const, label: "Enum", icon: Hexagon },
];

interface ClassPaletteProps {
  onAddClass: (stereotype: UMLClass["stereotype"]) => void;
}

const ClassPalette = memo(function ClassPalette({
  onAddClass,
}: ClassPaletteProps) {
  return (
    <div className="space-y-1">
      <p className="px-2 text-[10px] text-foreground-subtle">
        Click to add a new element to the canvas.
      </p>
      {CLASS_PALETTE_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.type}
            onClick={() => onAddClass(item.type)}
            className="flex w-full items-center gap-2 rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm px-2 py-2 text-xs text-foreground-muted transition-all hover:bg-elevated hover:text-foreground hover:shadow-[0_0_10px_rgba(110,86,207,0.08)]"
          >
            <GripVertical className="h-3 w-3 shrink-0 opacity-40" />
            <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: STEREOTYPE_BORDER_COLOR[item.type] }} />
            {item.label}
          </button>
        );
      })}
    </div>
  );
});

// ── SOLID Browser ────────────────────────────────────────

interface SOLIDBrowserProps {
  activeDemoId: string | null;
  onSelect: (demo: SOLIDDemo) => void;
  demos: SOLIDDemo[];
}

const SOLIDBrowser = memo(function SOLIDBrowser({
  activeDemoId,
  onSelect,
  demos,
}: SOLIDBrowserProps) {
  return (
    <div className="space-y-1">
      <p className="px-2 text-[10px] text-foreground-subtle">
        Compare before/after class diagrams for each SOLID principle.
      </p>
      {demos.map((demo) => (
        <button
          key={demo.id}
          onClick={() => onSelect(demo)}
          className={cn(
            "flex w-full items-center gap-2 rounded-xl border px-2 py-2 text-left text-xs transition-all",
            activeDemoId === demo.id
              ? "border-primary/30 bg-primary/10 text-primary shadow-[0_0_15px_rgba(110,86,207,0.15)]"
              : "border-border/30 bg-elevated/50 text-foreground-muted hover:bg-elevated hover:text-foreground",
          )}
        >
          <span
            className="inline-flex h-5 w-8 shrink-0 items-center justify-center rounded-full border text-[9px] font-bold backdrop-blur-sm"
            style={{
              color: PRINCIPLE_COLORS[demo.principle],
              backgroundColor: `${PRINCIPLE_COLORS[demo.principle]}18`,
              borderColor: `${PRINCIPLE_COLORS[demo.principle]}30`,
              boxShadow: `0 0 8px ${PRINCIPLE_COLORS[demo.principle]}1a`,
            }}
          >
            {demo.principle}
          </span>
          <span className="truncate">{demo.name}</span>
        </button>
      ))}
    </div>
  );
});

// ── Problems Browser ─────────────────────────────────────

interface ProblemsBrowserProps {
  activeProblemId: string | null;
  onSelect: (problem: LLDProblem) => void;
  onStartPractice: (problem: LLDProblem, minutes: PracticeTimerOption) => void;
  practiceActive: boolean;
  problems: LLDProblem[];
}

const ProblemsBrowser = memo(function ProblemsBrowser({
  activeProblemId,
  onSelect,
  onStartPractice,
  practiceActive,
  problems,
}: ProblemsBrowserProps) {
  const [setupProblemId, setSetupProblemId] = useState<string | null>(null);

  return (
    <div className="space-y-1">
      <p className="px-2 text-[10px] text-foreground-subtle">
        Pick a problem to load its starter diagram onto the canvas.
      </p>
      {problems.map((prob) => {
        const isActive = activeProblemId === prob.id;
        const showSetup = setupProblemId === prob.id;
        return (
          <div key={prob.id}>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onSelect(prob)}
                className={cn(
                  "flex flex-1 min-w-0 items-center gap-2 rounded-xl border px-2 py-2 text-left text-xs transition-all",
                  isActive
                    ? "border-primary/30 bg-primary/10 text-primary shadow-[0_0_15px_rgba(110,86,207,0.15)]"
                    : "border-border/30 bg-elevated/50 text-foreground-muted hover:bg-elevated hover:text-foreground",
                )}
              >
                <span
                  className="inline-flex shrink-0 items-center rounded-full border px-1.5 py-0.5 text-[9px] font-bold backdrop-blur-sm"
                  style={{
                    color: DIFFICULTY_COLORS[prob.difficulty],
                    backgroundColor: `${DIFFICULTY_COLORS[prob.difficulty]}18`,
                    borderColor: `${DIFFICULTY_COLORS[prob.difficulty]}30`,
                  }}
                >
                  {prob.difficulty}
                </span>
                <span className="truncate min-w-0">{prob.name}</span>
              </button>
              <button
                onClick={() => setSetupProblemId(showSetup ? null : prob.id)}
                className={cn(
                  "shrink-0 rounded-xl border p-1.5 transition-all",
                  practiceActive && isActive
                    ? "border-primary/30 text-primary bg-primary/10 shadow-[0_0_10px_rgba(110,86,207,0.15)]"
                    : "border-border/30 text-foreground-subtle hover:bg-elevated hover:text-foreground hover:shadow-[0_0_8px_rgba(110,86,207,0.08)]",
                )}
                title="Practice mode"
                aria-label={`Practice ${prob.name}`}
              >
                <Timer className="h-3 w-3" />
              </button>
            </div>
            {showSetup && !practiceActive && (
              <div className="mx-2 mt-1 mb-2">
                <PracticeModeSetup
                  problem={prob}
                  onStart={(minutes) => {
                    setSetupProblemId(null);
                    onStartPractice(prob, minutes);
                  }}
                  onCancel={() => setSetupProblemId(null)}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
});

// ── Practice Mode Setup ──────────────────────────────────

export const PracticeModeSetup = memo(function PracticeModeSetup({
  problem,
  onStart,
  onCancel,
}: {
  problem: LLDProblem;
  onStart: (minutes: PracticeTimerOption) => void;
  onCancel: () => void;
}) {
  const [minutes, setMinutes] = useState<PracticeTimerOption>(30);
  const options: PracticeTimerOption[] = [15, 30, 45, 60];

  return (
    <div className="space-y-3 rounded-xl border border-primary/30 bg-primary/5 backdrop-blur-sm p-3 shadow-[0_0_15px_rgba(110,86,207,0.1)]">
      <div className="flex items-center gap-2">
        <Timer className="h-3.5 w-3.5 text-primary" />
        <span className="text-[11px] font-semibold text-foreground">Practice Mode</span>
      </div>
      <p className="text-[10px] leading-relaxed text-foreground-muted">
        Start a timed practice session for <span className="font-medium text-foreground">{problem.name}</span>.
        The starter diagram will be hidden and you will build from scratch.
      </p>
      <div>
        <label className="mb-1 block text-[10px] font-medium text-foreground-subtle">
          Time Limit
        </label>
        <div className="flex gap-1">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => setMinutes(opt)}
              className={cn(
                "flex-1 rounded-xl py-1.5 text-[11px] font-medium transition-all",
                minutes === opt
                  ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(110,86,207,0.3)]"
                  : "bg-elevated/50 backdrop-blur-sm text-foreground-muted hover:bg-elevated hover:text-foreground",
              )}
            >
              {opt}m
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onStart(minutes)}
          className="flex-1 rounded-xl bg-primary px-3 py-2 text-[11px] font-semibold text-primary-foreground transition-all hover:bg-primary/90 shadow-[0_0_15px_rgba(110,86,207,0.3)] hover:shadow-[0_0_20px_rgba(110,86,207,0.4)]"
        >
          Start Practice
        </button>
        <button
          onClick={onCancel}
          className="rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm px-3 py-2 text-[11px] font-medium text-foreground-subtle transition-all hover:bg-elevated hover:text-foreground hover:shadow-[0_0_10px_rgba(110,86,207,0.08)]"
        >
          Cancel
        </button>
      </div>
    </div>
  );
});

// ── Sequence Browser ─────────────────────────────────────

interface SequenceBrowserProps {
  activeExampleId: string | null;
  onSelect: (example: SequenceExample) => void;
  examples: SequenceExample[];
}

const SequenceBrowser = memo(function SequenceBrowser({
  activeExampleId,
  onSelect,
  examples,
}: SequenceBrowserProps) {
  return (
    <div className="space-y-1">
      <p className="px-2 text-[10px] text-foreground-subtle">
        Select a sequence diagram to visualize message flow between participants.
      </p>
      {examples.map((ex) => (
        <button
          key={ex.id}
          onClick={() => onSelect(ex)}
          className={cn(
            "flex w-full items-center gap-2 rounded-xl border px-2 py-2 text-left text-xs transition-all",
            activeExampleId === ex.id
              ? "border-primary/30 bg-primary/10 text-primary shadow-[0_0_15px_rgba(110,86,207,0.15)]"
              : "border-border/30 bg-elevated/50 text-foreground-muted hover:bg-elevated hover:text-foreground",
          )}
        >
          <GitBranch className="h-3 w-3 shrink-0 opacity-60" />
          <span className="truncate">{ex.name}</span>
        </button>
      ))}
    </div>
  );
});

// ── State Machine Browser ────────────────────────────────

interface StateMachineBrowserProps {
  activeExampleId: string | null;
  onSelect: (example: StateMachineExample) => void;
  examples: StateMachineExample[];
}

const StateMachineBrowser = memo(function StateMachineBrowser({
  activeExampleId,
  onSelect,
  examples,
}: StateMachineBrowserProps) {
  return (
    <div className="space-y-1">
      <p className="px-2 text-[10px] text-foreground-subtle">
        Select a state machine to visualize states and transitions.
      </p>
      {examples.map((ex) => (
        <button
          key={ex.id}
          onClick={() => onSelect(ex)}
          className={cn(
            "flex w-full items-center gap-2 rounded-xl border px-2 py-2 text-left text-xs transition-all",
            activeExampleId === ex.id
              ? "border-primary/30 bg-primary/10 text-primary shadow-[0_0_15px_rgba(110,86,207,0.15)]"
              : "border-border/30 bg-elevated/50 text-foreground-muted hover:bg-elevated hover:text-foreground",
          )}
        >
          <Circle className="h-3 w-3 shrink-0 opacity-60" />
          <span className="truncate">{ex.name}</span>
        </button>
      ))}
    </div>
  );
});

// ── Code → Diagram Panel ─────────────────────────────────

interface CodeToDiagramPanelProps {
  onParseCode: (classes: UMLClass[], relationships: UMLRelationship[]) => void;
}

const SAMPLE_TS = `interface Animal {
  name: string;
  speak(): string;
}

abstract class Pet implements Animal {
  protected name: string;
  abstract speak(): string;
  public getName(): string;
}

class Dog extends Pet {
  private breed: string;
  public speak(): string;
  public fetch(): void;
}

class Cat extends Pet {
  private indoor: boolean;
  public speak(): string;
  public purr(): void;
}`;

const SAMPLE_PY = `from abc import ABC, abstractmethod

class Animal(ABC):
    def __init__(self, name: str):
        self.name = name

    @abstractmethod
    def speak(self) -> str:
        pass

class Dog(Animal):
    def __init__(self, name: str, breed: str):
        super().__init__(name)
        self.breed = breed

    def speak(self) -> str:
        return "Woof!"

    def fetch(self) -> None:
        pass

class Cat(Animal):
    def __init__(self, name: str, indoor: bool):
        super().__init__(name)
        self._indoor = indoor

    def speak(self) -> str:
        return "Meow!"

    def purr(self) -> None:
        pass`;

const CodeToDiagramPanel = memo(function CodeToDiagramPanel({
  onParseCode,
}: CodeToDiagramPanelProps) {
  const [lang, setLang] = useState<"typescript" | "python">("typescript");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleParse = useCallback(() => {
    setError(null);
    const trimmed = code.trim();
    if (!trimmed) {
      setError("Paste some code above first.");
      return;
    }
    try {
      const result =
        lang === "typescript"
          ? parseTypeScriptCode(trimmed)
          : parsePythonCode(trimmed);
      if (result.classes.length === 0) {
        setError(
          lang === "typescript"
            ? "No classes or interfaces found. Ensure your code uses `class` or `interface` declarations."
            : "No classes found. Ensure your code uses `class ClassName:` declarations.",
        );
        return;
      }
      onParseCode(result.classes, result.relationships);
    } catch {
      setError("Failed to parse code. Check syntax and try again.");
    }
  }, [code, lang, onParseCode]);

  const handleLoadSample = useCallback(() => {
    setCode(lang === "typescript" ? SAMPLE_TS : SAMPLE_PY);
    setError(null);
  }, [lang]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <FileCode className="h-4 w-4 text-primary" />
        <span className="text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
          Code to Diagram
        </span>
      </div>
      <p className="text-[11px] leading-relaxed text-foreground-subtle">
        Paste TypeScript or Python code containing class definitions.
        The parser will extract classes, attributes, methods, and
        inheritance relationships onto the canvas.
      </p>

      <div className="flex gap-1 rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm p-1">
        <button
          onClick={() => { setLang("typescript"); setError(null); }}
          className={cn(
            "flex-1 rounded-lg py-1.5 text-[11px] font-medium transition-all",
            lang === "typescript"
              ? "bg-primary/10 text-primary shadow-[0_0_10px_rgba(110,86,207,0.15)]"
              : "text-foreground-subtle hover:text-foreground",
          )}
        >
          TypeScript
        </button>
        <button
          onClick={() => { setLang("python"); setError(null); }}
          className={cn(
            "flex-1 rounded-lg py-1.5 text-[11px] font-medium transition-all",
            lang === "python"
              ? "bg-primary/10 text-primary shadow-[0_0_10px_rgba(110,86,207,0.15)]"
              : "text-foreground-subtle hover:text-foreground",
          )}
        >
          Python
        </button>
      </div>

      <textarea
        value={code}
        onChange={(e) => { setCode(e.target.value); setError(null); }}
        placeholder={
          lang === "typescript"
            ? "class Dog extends Animal {\n  private name: string;\n  bark(): void;\n}"
            : "class Dog(Animal):\n    def __init__(self, name):\n        self.name = name\n    def bark(self) -> None:\n        pass"
        }
        className="h-48 w-full resize-y rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm px-3 py-2 font-mono text-[11px] text-foreground placeholder:text-foreground-subtle/40 focus:border-primary/50 focus:outline-none focus:shadow-[0_0_15px_rgba(110,86,207,0.1)]"
        spellCheck={false}
      />

      {error && (
        <div className="flex items-start gap-1.5 rounded-xl border border-red-500/30 bg-red-500/5 backdrop-blur-sm px-2 py-1.5 shadow-[0_0_10px_rgba(239,68,68,0.08)]">
          <AlertTriangle className="mt-0.5 h-3 w-3 flex-shrink-0 text-red-400" />
          <span className="text-[10px] text-red-400">{error}</span>
        </div>
      )}

      <button
        onClick={handleParse}
        className="w-full rounded-xl bg-primary px-3 py-2 text-[11px] font-semibold text-primary-foreground transition-all hover:bg-primary/90 shadow-[0_0_15px_rgba(110,86,207,0.3)] hover:shadow-[0_0_20px_rgba(110,86,207,0.4)]"
      >
        Parse &amp; Load onto Canvas
      </button>
      <button
        onClick={handleLoadSample}
        className="w-full rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm px-3 py-1.5 text-[10px] font-medium text-foreground-subtle transition-all hover:bg-elevated hover:text-foreground hover:shadow-[0_0_10px_rgba(110,86,207,0.08)]"
      >
        Load Sample {lang === "typescript" ? "TypeScript" : "Python"}
      </button>
    </div>
  );
});

// ── Sidebar Search ──────────────────────────────────────

const CONTENT_TYPE_COLORS: Record<string, string> = {
  pattern: "text-violet-400 border-violet-500/30 bg-violet-500/10",
  problem: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  demo: "text-blue-400 border-blue-500/30 bg-blue-500/10",
  concept: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
};

function buildResultHref(r: SearchResult): string {
  switch (r.contentType) {
    case "pattern":
      return `/patterns/${r.slug}`;
    case "problem":
      return `/lld-problems/${r.slug}`;
    default:
      return `/${r.moduleId}/${r.slug}`;
  }
}

function HighlightSnippet({ text, query }: { text: string; query: string }) {
  if (!query || query.length < 2) return <>{text}</>;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <span key={i} className="font-semibold text-primary">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

const SidebarSearch = memo(function SidebarSearch() {
  const { query, setQuery, results, isSearching } = useSearch("lld");
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [showResults, setShowResults] = useState(false);

  // Show dropdown when there are results
  useEffect(() => {
    setShowResults(results.length > 0 && query.length >= 2);
  }, [results, query]);

  // Click outside to close
  useEffect(() => {
    if (!showResults) return;
    function handlePointerDown(e: PointerEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [showResults]);

  return (
    <div ref={wrapperRef} className="relative px-2 py-2 border-b border-border/30">
      <div className="relative">
        <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-foreground-subtle" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && query.length >= 2 && setShowResults(true)}
          placeholder="Search patterns, problems..."
          className="w-full rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm pl-7 pr-7 py-1.5 text-[11px] text-foreground placeholder:text-foreground-subtle/40 focus:border-primary/50 focus:outline-none focus:shadow-[0_0_15px_rgba(110,86,207,0.1)]"
        />
        {isSearching && (
          <Loader2 className="absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 animate-spin text-foreground-subtle" />
        )}
      </div>

      {showResults && (
        <div className="absolute left-2 right-2 top-full z-30 mt-1 max-h-64 overflow-y-auto rounded-xl border border-border/30 bg-background/90 backdrop-blur-xl shadow-2xl">
          {results.map((r) => (
            <button
              key={r.id}
              onClick={() => {
                setShowResults(false);
                setQuery("");
                router.push(buildResultHref(r));
              }}
              className="flex w-full flex-col gap-0.5 border-b border-border/20 px-3 py-2 text-left transition-colors last:border-0 hover:bg-accent/50"
            >
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-foreground truncate">
                  {r.name}
                </span>
                <span
                  className={cn(
                    "shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-medium backdrop-blur-sm capitalize",
                    CONTENT_TYPE_COLORS[r.contentType] ?? "text-foreground-subtle border-border/30 bg-elevated/50",
                  )}
                >
                  {r.contentType}
                </span>
              </div>
              {r.snippet && (
                <span className="text-[10px] leading-relaxed text-foreground-subtle line-clamp-2">
                  <HighlightSnippet text={r.snippet} query={query} />
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

// ── Main Sidebar Component ───────────────────────────────

const SIDEBAR_TABS: { mode: SidebarMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { mode: "patterns", label: "Patterns", icon: Layers },
  { mode: "progress", label: "Progress", icon: BarChart3 },
  { mode: "solid", label: "SOLID", icon: BookOpen },
  { mode: "problems", label: "Problems", icon: Trophy },
  { mode: "sequence", label: "Sequence", icon: GitBranch },
  { mode: "state-machine", label: "State", icon: Circle },
  { mode: "code-to-diagram", label: "Code", icon: FileCode },
  { mode: "palette", label: "Palette", icon: GripVertical },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SequenceExample = { id: string; name: string; [key: string]: any; };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StateMachineExample = { id: string; name: string; [key: string]: any; };

interface LLDSidebarProps {
  mode: SidebarMode;
  onModeChange: (mode: SidebarMode) => void;
  activePatternId: string | null;
  onSelectPattern: (pattern: DesignPattern) => void;
  onAddClass: (stereotype: UMLClass["stereotype"]) => void;
  activeDemoId: string | null;
  onSelectDemo: (demo: SOLIDDemo) => void;
  activeProblemId: string | null;
  onSelectProblem: (problem: LLDProblem) => void;
  onStartPractice: (problem: LLDProblem, minutes: PracticeTimerOption) => void;
  practiceActive: boolean;
  activeSequenceId: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSelectSequence: (example: any) => void;
  activeStateMachineId: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSelectStateMachine: (example: any) => void;
  onParseCode: (classes: UMLClass[], relationships: UMLRelationship[]) => void;
  // Data arrays passed from parent (useLLDData hook → API or static)
  patterns: DesignPattern[];
  solidDemos: SOLIDDemo[];
  problems: LLDProblem[];
  sequenceExamples: SequenceExample[];
  stateMachineExamples: StateMachineExample[];
}

export const LLDSidebar = memo(function LLDSidebar({
  mode,
  onModeChange,
  activePatternId,
  onSelectPattern,
  onAddClass,
  activeDemoId,
  onSelectDemo,
  activeProblemId,
  onSelectProblem,
  onStartPractice,
  practiceActive,
  activeSequenceId,
  onSelectSequence,
  activeStateMachineId,
  onSelectStateMachine,
  onParseCode,
  patterns,
  solidDemos,
  problems,
  sequenceExamples,
  stateMachineExamples,
}: LLDSidebarProps) {
  const tabBarRef = useRef<HTMLDivElement>(null);
  const [isNarrow, setIsNarrow] = useState(false);
  const [showGraph, setShowGraph] = useState(false);
  const { data: dueData } = useDueReviews("lld");
  const dueCount = dueData?.count ?? 0;

  const handleGraphSelectPattern = useCallback(
    (slug: string) => {
      const pattern = patterns.find((p) => p.id === slug);
      if (pattern) {
        onSelectPattern(pattern);
        setShowGraph(false);
      }
    },
    [patterns, onSelectPattern],
  );

  useEffect(() => {
    const el = tabBarRef.current?.parentElement;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setIsNarrow(entry.contentRect.width <= 300);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border/30 px-3 py-3">
        <div className="flex items-center gap-2">
          <h2 className="text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
            LLD Studio
          </h2>
          {dueCount > 0 && (
            <span
              className="inline-flex items-center rounded-full border border-violet-400/30 bg-violet-500/10 backdrop-blur-sm px-2 py-0.5 text-[9px] font-bold text-violet-400 shadow-[0_0_8px_rgba(139,92,246,0.1)]"
              title={`${dueCount} item${dueCount !== 1 ? "s" : ""} due for review`}
            >
              {dueCount} due
            </span>
          )}
        </div>
        <StreakCounter />
      </div>
      <div ref={tabBarRef} className="relative flex overflow-x-auto border-b border-border/30 scrollbar-none">
        <TooltipProvider delayDuration={200}>
          {SIDEBAR_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = mode === tab.mode;
            return (
              <Tooltip key={tab.mode}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onModeChange(tab.mode)}
                    className={cn(
                      "relative flex shrink-0 items-center justify-center gap-1.5 py-2 transition-all",
                      isNarrow ? "px-2.5" : "flex-1 px-1.5",
                      isActive
                        ? "text-primary"
                        : "text-foreground-muted hover:text-foreground",
                    )}
                    aria-label={tab.label}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {isActive && (
                      <span className="absolute bottom-0 left-1 right-1 h-0.5 rounded-full bg-gradient-to-r from-primary to-violet-400" />
                    )}
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    {!isNarrow && (
                      <span className="text-[11px] font-medium whitespace-nowrap">{tab.label}</span>
                    )}
                  </button>
                </TooltipTrigger>
                {isNarrow && (
                  <TooltipContent side="bottom" className="text-xs">
                    {tab.label}
                  </TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </div>
      <SidebarSearch />
      <div className="flex-1 overflow-y-auto px-2 py-3">
        {mode === "patterns" && (
          <div className="space-y-2">
            <button
              onClick={() => setShowGraph((p) => !p)}
              className={cn(
                "flex w-full items-center gap-2 rounded-xl border px-2 py-2 text-left text-xs transition-all",
                showGraph
                  ? "border-primary/30 bg-primary/10 text-primary shadow-[0_0_15px_rgba(110,86,207,0.15)]"
                  : "border-border/30 bg-elevated/50 text-foreground-muted hover:bg-elevated hover:text-foreground",
              )}
            >
              <Network className="h-3.5 w-3.5 shrink-0" />
              <span className="text-[11px] font-medium">Pattern Graph</span>
              {showGraph ? (
                <ChevronDown className="ml-auto h-3 w-3" />
              ) : (
                <ChevronRight className="ml-auto h-3 w-3" />
              )}
            </button>
            {showGraph && (
              <PatternGraph
                patterns={patterns}
                onSelectPattern={handleGraphSelectPattern}
                onClose={() => setShowGraph(false)}
              />
            )}
            <PatternBrowser
              activePatternId={activePatternId}
              onSelect={onSelectPattern}
              patterns={patterns}
            />
          </div>
        )}
        {mode === "progress" && (
          <LearningPathMap
            onSelectPattern={onSelectPattern}
            patterns={patterns}
            dueReviewCount={dueCount}
          />
        )}
        {mode === "palette" && <ClassPalette onAddClass={onAddClass} />}
        {mode === "solid" && (
          <SOLIDBrowser
            activeDemoId={activeDemoId}
            onSelect={onSelectDemo}
            demos={solidDemos}
          />
        )}
        {mode === "problems" && (
          <ProblemsBrowser
            activeProblemId={activeProblemId}
            onSelect={onSelectProblem}
            onStartPractice={onStartPractice}
            problems={problems}
            practiceActive={practiceActive}
          />
        )}
        {mode === "sequence" && (
          <SequenceBrowser
            activeExampleId={activeSequenceId}
            onSelect={onSelectSequence}
            examples={sequenceExamples}
          />
        )}
        {mode === "state-machine" && (
          <StateMachineBrowser
            activeExampleId={activeStateMachineId}
            onSelect={onSelectStateMachine}
            examples={stateMachineExamples}
          />
        )}
        {mode === "code-to-diagram" && (
          <CodeToDiagramPanel onParseCode={onParseCode} />
        )}
      </div>
    </div>
  );
});
