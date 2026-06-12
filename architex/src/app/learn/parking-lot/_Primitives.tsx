"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useScroll } from "motion/react";
import * as Tooltip from "@radix-ui/react-tooltip";
import {
  Sparkles,
  AlertTriangle,
  ChevronRight,
  Clock,
  Info,
  ArrowRight,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { GLOSSARY, SECTIONS, ACTS, type SectionMeta } from "./_data";
import { useDifficulty } from "./_DifficultyContext";
import { DifficultyBadge } from "./_DifficultySelector";

// ─────────────────────────────────────────────────────────────────────────────
//  Reading progress bar (top of viewport, scroll-driven)
// ─────────────────────────────────────────────────────────────────────────────

export function ReadingProgressBar() {
  const { scrollYProgress } = useScroll();
  return (
    <div
      role="progressbar"
      aria-label="Reading progress"
      aria-valuemin={0}
      aria-valuemax={100}
      className="fixed left-0 right-0 top-0 z-40 h-[3px] bg-transparent"
    >
      <motion.div
        className="h-full origin-left bg-primary"
        style={{ scaleX: scrollYProgress }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Sticky breadcrumb header
// ─────────────────────────────────────────────────────────────────────────────

export function LessonHeader({ activeId }: { activeId: string }) {
  const active = SECTIONS.find((s) => s.id === activeId);
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-12 max-w-7xl items-center justify-between gap-4 px-6">
        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
          <span className="text-[hsl(258_85%_76%)]">LLD</span>
          <ChevronRight aria-hidden className="size-3 opacity-40" />
          <span className="hidden sm:inline">Patterns</span>
          <ChevronRight aria-hidden className="hidden size-3 opacity-40 sm:inline-block" />
          <span className="text-foreground">Parking Lot</span>
          {active ? (
            <>
              <ChevronRight aria-hidden className="size-3 opacity-40" />
              <span className="truncate text-foreground/70">{active.title}</span>
            </>
          ) : null}
        </nav>
        <div className="flex items-center gap-3">
          <DifficultyBadge />
          <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
            <Clock aria-hidden className="size-3.5" />
            <span>14 min</span>
          </div>
        </div>
      </div>
    </header>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Chapter masthead (hero) — replaces the gradient H1
// ─────────────────────────────────────────────────────────────────────────────

export function ChapterMasthead() {
  const { tier } = useDifficulty();
  const tierLabel = tier === "beginner" ? "BEGINNER" : tier === "senior" ? "SENIOR" : "PLACEMENT PREP";
  return (
    <section className="pt-10 pb-2">
      <div className="flex items-baseline justify-between border-b border-border/60 pb-5">
        <span className="font-mono text-[11px] tracking-[0.22em] text-muted-foreground">
          CHAPTER 01 · LLD · <span className="text-[hsl(258_85%_76%)]">{tierLabel}</span>
        </span>
        <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
          14 MIN · 14 SECTIONS
        </span>
      </div>
      <h1 className="mt-8 text-balance text-[64px] font-semibold leading-[0.96] tracking-[-0.03em] sm:text-[72px]">
        Parking Lot.
        <br />
        <span className="text-muted-foreground/60">
          Low-level design,
          <br />
          built from first principles.
        </span>
      </h1>
      <p className="mt-6 max-w-xl text-pretty text-[15px] leading-relaxed text-muted-foreground">
        {tier === "beginner"
          ? "The canonical LLD interview problem — built up gently from OOP basics. We'll explain every term, scaffold every choice, and pause where it gets tricky."
          : tier === "senior"
            ? "Skip the primers. Tradeoffs, concurrency primitives, anti-patterns, scaling boundaries — at depth, with the edges senior interviewers actually probe."
            : "Entities, hierarchies, relationships, behaviors, concurrency, patterns, anti-patterns, edge cases, scaling. The canonical LLD interview problem — done in depth, not in summary."}
      </p>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Spine TOC — continuous hairline + violet motion mark on active
// ─────────────────────────────────────────────────────────────────────────────

export function SpineToc({
  activeId,
  completedIds,
}: {
  activeId: string;
  completedIds: ReadonlySet<string>;
}) {
  return (
    <nav
      aria-labelledby="toc-heading"
      className="sticky top-16 hidden h-[calc(100vh-5rem)] overflow-y-auto pr-2 lg:block"
    >
      <h2 id="toc-heading" className="sr-only">
        Lesson sections
      </h2>
      <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        On this page
      </p>
      <div className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute left-[15px] top-2 bottom-2 w-px bg-border"
        />
        <ol className="space-y-0.5">
          {SECTIONS.map((s) => {
            const isActive = s.id === activeId;
            const isDone = completedIds.has(s.id);
            return (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  aria-current={isActive ? "location" : undefined}
                  className={cn(
                    "group relative grid grid-cols-[28px_1fr] items-center gap-2 py-2 text-xs transition-colors",
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "z-10 -ml-px bg-background pr-1 text-right font-mono tabular-nums",
                      isActive
                        ? "text-[hsl(258_85%_76%)]"
                        : isDone
                          ? "text-foreground/60"
                          : "text-muted-foreground/45",
                    )}
                  >
                    {s.num.toString().padStart(2, "0")}
                  </span>
                  <span className="truncate">{s.title}</span>
                  {isActive ? (
                    <motion.span
                      layoutId="toc-mark"
                      className="absolute left-[14px] top-1/2 h-5 w-[2px] -translate-y-1/2 bg-[hsl(258_85%_76%)]"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  ) : null}
                </a>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Section wrapper — IntersectionObserver registers active id; fade-in on scroll
// ─────────────────────────────────────────────────────────────────────────────

interface SectionProps {
  id: string;
  num: number;
  title: string;
  kicker?: string;
  children: React.ReactNode;
  registerActive: (id: string) => void;
}

export function Section({ id, num, title, kicker, children, registerActive }: SectionProps) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) registerActive(id);
        }
      },
      { rootMargin: "-30% 0px -55% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [id, registerActive]);

  return (
    <motion.section
      ref={ref}
      id={id}
      className="scroll-mt-24 py-14 first:pt-6"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-15%" }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="mb-7">
        {kicker ? (
          <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.22em] text-[hsl(258_85%_76%)]">
            {kicker}
          </p>
        ) : null}
        <div className="flex items-baseline gap-4">
          <span className="font-mono text-2xl tabular-nums text-muted-foreground">
            {num.toString().padStart(2, "0")}
          </span>
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-[34px]">
            {title}
          </h2>
        </div>
      </div>
      <div className="space-y-6 text-[15px] leading-relaxed text-foreground/85">
        {children}
      </div>
    </motion.section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Act break — full-bleed divider between acts (rhythm break)
// ─────────────────────────────────────────────────────────────────────────────

export function ActBreak({ act }: { act: 1 | 2 | 3 | 4 }) {
  const data = ACTS.find((a) => a.num === act);
  if (!data) return null;
  const sectionsInAct = SECTIONS.filter((s) => s.act === act).length;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="relative my-24 flex items-center gap-6"
      aria-hidden
    >
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className="text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          {data.tag}
        </p>
        <p className="mt-1 text-sm text-foreground/70">{data.title}</p>
        <p className="mt-0.5 font-mono text-[10px] tabular-nums text-muted-foreground/60">
          {sectionsInAct} sections
        </p>
      </div>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Generic prose helpers
// ─────────────────────────────────────────────────────────────────────────────

export function Lead({ children }: { children: React.ReactNode }) {
  return <p className="text-lg leading-relaxed text-foreground/90">{children}</p>;
}

export function Mark({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-medium text-foreground decoration-[hsl(258_85%_76%)] decoration-2 underline-offset-4">
      {children}
    </span>
  );
}

export function Callout({
  tone = "info",
  title,
  children,
}: {
  tone?: "info" | "warn" | "insight" | "danger";
  title?: string;
  children: React.ReactNode;
}) {
  const toneMap = {
    info: {
      border: "border-[hsl(258_78%_64%)]/40",
      bg: "bg-[hsl(258_78%_64%)]/5",
      text: "text-[hsl(258_85%_76%)]",
      Icon: Info,
    },
    insight: {
      border: "border-[hsl(258_78%_64%)]/40",
      bg: "bg-[hsl(258_78%_64%)]/5",
      text: "text-[hsl(258_85%_76%)]",
      Icon: Sparkles,
    },
    warn: {
      border: "border-[hsl(35_90%_55%)]/40",
      bg: "bg-[hsl(35_90%_55%)]/5",
      text: "text-[hsl(35_90%_70%)]",
      Icon: AlertTriangle,
    },
    danger: {
      border: "border-destructive/40",
      bg: "bg-destructive/5",
      text: "text-[hsl(0_75%_75%)]",
      Icon: AlertTriangle,
    },
  } as const;
  const t = toneMap[tone];
  return (
    <div role="note" className={cn("rounded-lg border-l-2 p-5 text-[14.5px] leading-relaxed", t.border, t.bg)}>
      <div className={cn("mb-1.5 flex items-center gap-2 text-xs font-medium uppercase tracking-wider", t.text)}>
        <t.Icon aria-hidden className="size-3.5" />
        {title ?? (tone === "warn" ? "Watch" : tone === "danger" ? "Failure mode" : "Notice")}
      </div>
      <div className="text-foreground/90">{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Glossary term — Radix Tooltip with accessible markup
// ─────────────────────────────────────────────────────────────────────────────

export function GlossaryTerm({
  term,
  children,
}: {
  term: keyof typeof GLOSSARY | string;
  children?: React.ReactNode;
}) {
  const def = GLOSSARY[term as keyof typeof GLOSSARY];
  const { tier } = useDifficulty();
  if (!def) return <>{children ?? term}</>;

  // SENIOR — render as plain text; no scaffolding for jargon
  if (tier === "senior") {
    return <>{children ?? term}</>;
  }

  const isBeginner = tier === "beginner";
  return (
    <Tooltip.Root delayDuration={isBeginner ? 0 : 120}>
      <Tooltip.Trigger asChild>
        <span
          tabIndex={0}
          className={cn(
            "cursor-help font-medium text-foreground underline decoration-dotted underline-offset-[5px] focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(258_85%_76%)]",
            isBeginner
              ? "decoration-[hsl(258_78%_64%)] decoration-2"
              : "decoration-[hsl(258_78%_64%)]/55",
          )}
        >
          {children ?? term}
          {isBeginner ? (
            <span aria-hidden className="ml-0.5 text-[10px] text-[hsl(258_85%_76%)]">
              ⓘ
            </span>
          ) : null}
        </span>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          side="top"
          sideOffset={6}
          className="z-50 max-w-xs rounded-lg border border-border bg-elevated px-3.5 py-2.5 text-[12.5px] leading-relaxed text-foreground/90 shadow-2xl"
        >
          <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-[hsl(258_85%_76%)]">
            {term}
          </p>
          {def}
          <Tooltip.Arrow className="fill-elevated" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Beginner note — only renders for BEGINNER tier (extra scaffolding)
// ─────────────────────────────────────────────────────────────────────────────

export function BeginnerNote({ title, children }: { title?: string; children: React.ReactNode }) {
  const { tier } = useDifficulty();
  if (tier !== "beginner") return null;
  return (
    <div className="rounded-lg border-l-2 border-[hsl(140_60%_45%)]/45 bg-[hsl(140_60%_45%)]/[0.04] px-5 py-4 text-[14px] leading-relaxed">
      <div className="mb-1.5 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-[hsl(140_60%_70%)]">
        <Sparkles aria-hidden className="size-3.5" />
        {title ?? "Beginner tip"}
      </div>
      <div className="text-foreground/85">{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Senior shortcut — only renders for SENIOR tier (skip-ahead links)
// ─────────────────────────────────────────────────────────────────────────────

export function SeniorShortcut({ to, label, children }: { to?: string; label?: string; children: React.ReactNode }) {
  const { tier } = useDifficulty();
  if (tier !== "senior") return null;
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-[hsl(258_78%_64%)]/30 bg-[hsl(258_78%_64%)]/[0.04] px-4 py-3 text-[13.5px]">
      <div>
        <span className="mr-2 font-mono text-[10px] uppercase tracking-wider text-[hsl(258_85%_76%)]">
          Senior shortcut
        </span>
        <span className="text-foreground/85">{children}</span>
      </div>
      {to ? (
        <a
          href={to}
          className="flex shrink-0 items-center gap-1 rounded-md border border-[hsl(258_78%_64%)]/40 bg-[hsl(258_78%_64%)]/10 px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-wider text-[hsl(258_85%_76%)] transition-colors hover:bg-[hsl(258_78%_64%)]/20"
        >
          {label ?? "Skip ahead"}
          <ArrowRight aria-hidden className="size-3" />
        </a>
      ) : null}
    </div>
  );
}

export function GlossaryProvider({ children }: { children: React.ReactNode }) {
  return <Tooltip.Provider delayDuration={120}>{children}</Tooltip.Provider>;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Code block with lightweight syntax tokenization
// ─────────────────────────────────────────────────────────────────────────────

const TS_KEYWORDS = new Set([
  "abstract", "async", "await", "break", "case", "catch", "class", "const", "continue",
  "default", "delete", "do", "else", "enum", "export", "extends", "false", "finally",
  "for", "from", "function", "if", "implements", "import", "in", "instanceof",
  "interface", "let", "new", "null", "of", "private", "protected", "public", "readonly",
  "return", "static", "super", "switch", "this", "throw", "true", "try", "type",
  "typeof", "undefined", "var", "void", "while", "yield",
]);

const SQL_KEYWORDS = new Set([
  "SELECT", "FROM", "WHERE", "AND", "OR", "ORDER", "BY", "LIMIT", "FOR", "UPDATE",
  "SKIP", "LOCKED", "INSERT", "INTO", "VALUES", "UPDATE", "SET", "BEGIN", "COMMIT",
  "ROLLBACK", "DELETE", "RETURNING",
]);

function tokenizeLine(line: string, lang: "ts" | "sql"): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  // strings
  const stringRegex = /(["'`])(?:(?=(\\?))\2.)*?\1/g;
  // line comments
  const commentRegex = /\/\/.*$/;
  // numbers
  const numberRegex = /\b\d+\b/g;

  // Comment first
  const commentMatch = line.match(commentRegex);
  let commentTail: React.ReactNode = null;
  if (commentMatch) {
    commentTail = (
      <span key="c" className="text-muted-foreground/70 italic">
        {commentMatch[0]}
      </span>
    );
    line = line.slice(0, commentMatch.index);
  }

  // Walk tokens by scanning chars; collect strings, then split rest by word boundary
  const segments: Array<{ kind: "str" | "rest"; text: string }> = [];
  let last = 0;
  for (const m of line.matchAll(stringRegex)) {
    const idx = m.index ?? 0;
    if (idx > last) segments.push({ kind: "rest", text: line.slice(last, idx) });
    segments.push({ kind: "str", text: m[0] });
    last = idx + m[0].length;
  }
  if (last < line.length) segments.push({ kind: "rest", text: line.slice(last) });
  if (segments.length === 0 && line.length > 0) segments.push({ kind: "rest", text: line });

  segments.forEach((seg, i) => {
    if (seg.kind === "str") {
      out.push(
        <span key={`s-${i}`} className="text-[hsl(140_50%_70%)]">
          {seg.text}
        </span>,
      );
      return;
    }
    // Split rest by word/non-word boundaries, preserve everything
    const parts = seg.text.split(/(\b)/);
    parts.forEach((p, j) => {
      const isWord = /^\w+$/.test(p);
      if (!isWord) {
        out.push(<span key={`p-${i}-${j}`}>{p}</span>);
        return;
      }
      const isKw =
        (lang === "ts" && TS_KEYWORDS.has(p)) ||
        (lang === "sql" && SQL_KEYWORDS.has(p.toUpperCase()));
      const isNum = numberRegex.test(p);
      numberRegex.lastIndex = 0;
      if (isKw) {
        out.push(
          <span key={`k-${i}-${j}`} className="text-[hsl(258_85%_78%)] font-medium">
            {p}
          </span>,
        );
      } else if (isNum) {
        out.push(
          <span key={`n-${i}-${j}`} className="text-[hsl(35_85%_70%)]">
            {p}
          </span>,
        );
      } else {
        out.push(
          <span key={`r-${i}-${j}`} className="text-foreground/85">
            {p}
          </span>,
        );
      }
    });
  });

  if (commentTail) out.push(commentTail);
  return out;
}

export function CodeBlock({
  language = "ts",
  lines,
  highlightAdded = [],
  highlightRemoved = [],
}: {
  language?: "ts" | "sql";
  lines: ReadonlyArray<string>;
  highlightAdded?: ReadonlyArray<number>;
  highlightRemoved?: ReadonlyArray<number>;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-[hsl(225_8%_8%)]">
      <div className="flex items-center justify-between border-b border-border/60 bg-surface px-3.5 py-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        <span>{language}</span>
        <span className="font-mono opacity-60">{lines.length} lines</span>
      </div>
      <pre className="overflow-x-auto px-4 py-3 font-mono text-[12.5px] leading-[1.7]">
        <code>
          {lines.map((line, i) => {
            const isAdded = highlightAdded.includes(i + 1);
            const isRemoved = highlightRemoved.includes(i + 1);
            return (
              <div
                key={i}
                className={cn(
                  "flex",
                  isAdded && "-mx-4 bg-[hsl(140_60%_45%)]/10 px-4",
                  isRemoved && "-mx-4 bg-destructive/10 px-4",
                )}
              >
                <span className="mr-4 inline-block w-6 select-none text-right tabular-nums text-muted-foreground/40">
                  {i + 1}
                </span>
                <span className="whitespace-pre">
                  {isAdded ? (
                    <span className="mr-1 text-[hsl(140_60%_60%)]">+</span>
                  ) : isRemoved ? (
                    <span className="mr-1 text-destructive">−</span>
                  ) : (
                    <span className="mr-1 text-transparent">·</span>
                  )}
                  {tokenizeLine(line, language)}
                </span>
              </div>
            );
          })}
        </code>
      </pre>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  UML primer card — collapsible legend for cardinality + UML reading
// ─────────────────────────────────────────────────────────────────────────────

export function UmlPrimer() {
  const { tier } = useDifficulty();
  const [open, setOpen] = useState(true);
  useEffect(() => {
    setOpen(tier !== "senior");
  }, [tier]);
  return (
    <div className="overflow-hidden rounded-lg border border-[hsl(258_78%_64%)]/30 bg-[hsl(258_78%_64%)]/5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="uml-primer-body"
        className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left transition-colors hover:bg-[hsl(258_78%_64%)]/10"
      >
        <span className="flex items-center gap-2 text-[12.5px] font-medium text-[hsl(258_85%_76%)]">
          <Info aria-hidden className="size-3.5" />
          Reading UML diagrams — 30-second primer
        </span>
        <span aria-hidden className="font-mono text-[10px] text-muted-foreground">
          {open ? "hide" : "show"}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            id="uml-primer-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="border-t border-[hsl(258_78%_64%)]/20 px-5 py-4 text-[13px] text-foreground/85">
              <dl className="grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="font-mono text-xs text-[hsl(258_85%_76%)]">[1..*]</dt>
                  <dd className="mt-0.5 text-foreground/80">one-or-many — at least one, no upper bound.</dd>
                </div>
                <div>
                  <dt className="font-mono text-xs text-[hsl(258_85%_76%)]">[0..1]</dt>
                  <dd className="mt-0.5 text-foreground/80">zero-or-one — optional reference.</dd>
                </div>
                <div>
                  <dt className="font-mono text-xs text-[hsl(258_85%_76%)]">[1..1]</dt>
                  <dd className="mt-0.5 text-foreground/80">exactly one — required and singular.</dd>
                </div>
                <div>
                  <dt className="font-mono text-xs text-[hsl(258_85%_76%)]">A USES-A B</dt>
                  <dd className="mt-0.5 text-foreground/80">A holds a reference to B (composition or association).</dd>
                </div>
                <div>
                  <dt className="font-mono text-xs text-[hsl(258_85%_76%)]">A HAS-MANY B</dt>
                  <dd className="mt-0.5 text-foreground/80">A owns a collection of B; B's lifetime tied to A.</dd>
                </div>
                <div>
                  <dt className="font-mono text-xs text-[hsl(258_85%_76%)]">A BELONGS-TO B</dt>
                  <dd className="mt-0.5 text-foreground/80">inverse — A is one of B's children; B is the parent.</dd>
                </div>
              </dl>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Section meta export for orchestrator convenience
// ─────────────────────────────────────────────────────────────────────────────

export type { SectionMeta };
export { SECTIONS };
