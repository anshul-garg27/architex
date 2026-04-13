"use client";

/**
 * Interview Countdown Study Plan (LLD-083).
 * User enters interview date, system generates a day-by-day plan
 * allocating SOLID (20%), Patterns (40%), Problems (30%), Review (10%).
 * Short plans (<=7 days) get compressed essentials; long plans (>=30 days)
 * get thorough coverage. Each day links to a specific pattern/problem.
 *
 * Integration: Add to LLDBottomPanelTabs in useLLDModuleImpl.tsx:
 *   import { StudyPlan } from "../panels/StudyPlan";
 *   // Add tab: { id: "study-plan", label: "Study Plan" }
 *   // Render: <StudyPlan /> in the matching tab case
 */

import React, { memo, useState, useCallback, useMemo } from "react";
import { Calendar, Download, ChevronRight, BookOpen, Layers, Code, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { DESIGN_PATTERNS } from "@/lib/lld";
import type { DesignPattern, PatternCategory } from "@/lib/lld";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "../constants";

// ── Study Topic Types ──────────────────────────────────────

type TopicType = "solid" | "pattern" | "problem" | "review";

interface StudyDay {
  dayNumber: number;
  date: Date;
  type: TopicType;
  title: string;
  description: string;
  patternId?: string;
}

const TOPIC_COLORS: Record<TopicType, string> = {
  solid: "var(--lld-solid-srp)",
  pattern: "var(--lld-stereo-interface)",
  problem: "var(--lld-stereo-abstract)",
  review: "var(--lld-stereo-enum)",
};

const TOPIC_LABELS: Record<TopicType, string> = {
  solid: "SOLID",
  pattern: "Pattern",
  problem: "Problem",
  review: "Review",
};

// ── SOLID Topics ───────────────────────────────────────────

const SOLID_TOPICS = [
  { title: "SRP -- Single Responsibility", description: "One class, one reason to change. Identify God classes and split them." },
  { title: "OCP -- Open/Closed Principle", description: "Extend behavior without modifying existing code. Use abstractions and polymorphism." },
  { title: "LSP -- Liskov Substitution", description: "Subtypes must be substitutable for their base types without breaking behavior." },
  { title: "ISP -- Interface Segregation", description: "Prefer many small interfaces over one fat interface. Clients should not depend on unused methods." },
  { title: "DIP -- Dependency Inversion", description: "Depend on abstractions, not concretions. High-level modules should not depend on low-level modules." },
];

// ── Problem Topics ─────────────────────────────────────────

const PROBLEM_TOPICS = [
  { title: "Design a Parking Lot", description: "Practice class modeling with Vehicle, ParkingSpot, ParkingLot hierarchies." },
  { title: "Design a Library System", description: "Model Book, Member, Loan with SOLID principles applied." },
  { title: "Design an Elevator System", description: "State pattern for elevator, Strategy for scheduling algorithms." },
  { title: "Design a Vending Machine", description: "State pattern practice -- idle, selecting, dispensing, refunding." },
  { title: "Design a Chess Game", description: "Complex class hierarchy with Piece polymorphism and Board composition." },
  { title: "Design a Hotel Booking", description: "Reservation, Room, Guest with Observer for notifications." },
  { title: "Design a File System", description: "Composite pattern for files/directories, Iterator for traversal." },
  { title: "Design a Task Scheduler", description: "Command pattern for tasks, Strategy for scheduling policies." },
  { title: "Design an ATM", description: "Chain of Responsibility for transaction processing, State for ATM modes." },
  { title: "Design a Notification Service", description: "Observer + Strategy + Decorator for multi-channel notifications." },
];

// ── Plan Generation ────────────────────────────────────────

function generatePlan(interviewDate: Date): StudyDay[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(interviewDate);
  target.setHours(0, 0, 0, 0);

  const diffMs = target.getTime() - today.getTime();
  const totalDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  // Allocation: SOLID 20%, Patterns 40%, Problems 30%, Review 10%
  const solidDays = Math.max(1, Math.round(totalDays * 0.2));
  const patternDays = Math.max(1, Math.round(totalDays * 0.4));
  const problemDays = Math.max(1, Math.round(totalDays * 0.3));
  const reviewDays = Math.max(1, totalDays - solidDays - patternDays - problemDays);

  const days: StudyDay[] = [];
  let dayIdx = 0;

  // Deterministic pattern ordering: prioritize by category order, then by difficulty
  const sortedPatterns = [...DESIGN_PATTERNS].sort((a, b) => {
    const catA = CATEGORY_ORDER.indexOf(a.category);
    const catB = CATEGORY_ORDER.indexOf(b.category);
    if (catA !== catB) return catA - catB;
    return a.difficulty - b.difficulty;
  });

  const isShortPlan = totalDays <= 7;

  // Essential patterns for short plans
  const essentialPatternIds = [
    "singleton", "factory-method", "observer", "strategy",
    "decorator", "adapter", "command", "state",
  ];
  const essentialPatterns = isShortPlan
    ? essentialPatternIds
        .map((id) => sortedPatterns.find((p) => p.id === id))
        .filter(Boolean) as DesignPattern[]
    : sortedPatterns;

  // ── Build SOLID days ──
  for (let i = 0; i < solidDays; i++) {
    const topic = SOLID_TOPICS[i % SOLID_TOPICS.length];
    const date = new Date(today);
    date.setDate(date.getDate() + dayIdx);
    days.push({
      dayNumber: dayIdx + 1,
      date,
      type: "solid",
      title: topic.title,
      description: isShortPlan
        ? `Quick review: ${topic.description}`
        : topic.description,
    });
    dayIdx++;
  }

  // ── Build Pattern days ──
  for (let i = 0; i < patternDays; i++) {
    const pattern = essentialPatterns[i % essentialPatterns.length];
    const date = new Date(today);
    date.setDate(date.getDate() + dayIdx);
    days.push({
      dayNumber: dayIdx + 1,
      date,
      type: "pattern",
      title: pattern.name,
      description: isShortPlan
        ? `${CATEGORY_LABELS[pattern.category]} -- study UML + code example`
        : `${CATEGORY_LABELS[pattern.category]} pattern. ${pattern.description.slice(0, 100)}...`,
      patternId: pattern.id,
    });
    dayIdx++;
  }

  // ── Build Problem days ──
  for (let i = 0; i < problemDays; i++) {
    const problem = PROBLEM_TOPICS[i % PROBLEM_TOPICS.length];
    const date = new Date(today);
    date.setDate(date.getDate() + dayIdx);
    days.push({
      dayNumber: dayIdx + 1,
      date,
      type: "problem",
      title: problem.title,
      description: isShortPlan
        ? `Timed practice: ${problem.title}`
        : problem.description,
    });
    dayIdx++;
  }

  // ── Build Review days ──
  for (let i = 0; i < reviewDays; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + dayIdx);
    const reviewTopics = isShortPlan
      ? "Quick recap of all SOLID + top patterns"
      : i === 0
        ? "Review SOLID principles -- write out each from memory"
        : i === reviewDays - 1
          ? "Final review: mock interview practice with timer"
          : "Review patterns covered so far. Redraw UML from memory.";
    days.push({
      dayNumber: dayIdx + 1,
      date,
      type: "review",
      title: `Review Day ${i + 1}`,
      description: reviewTopics,
    });
    dayIdx++;
  }

  // Sort by day number (already sorted, but be safe)
  days.sort((a, b) => a.dayNumber - b.dayNumber);

  return days;
}

// ── Text Export ─────────────────────────────────────────────

function exportAsText(days: StudyDay[], interviewDate: Date): void {
  const lines = [
    `LLD Interview Study Plan`,
    `Interview Date: ${interviewDate.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`,
    `Total Days: ${days.length}`,
    `Generated: ${new Date().toLocaleDateString()}`,
    "",
    "---",
    "",
  ];

  for (const day of days) {
    const dateStr = day.date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    lines.push(`Day ${day.dayNumber} (${dateStr}) [${TOPIC_LABELS[day.type]}]`);
    lines.push(`  ${day.title}`);
    lines.push(`  ${day.description}`);
    lines.push("");
  }

  lines.push("---");
  lines.push("Allocation: SOLID 20% | Patterns 40% | Problems 30% | Review 10%");
  lines.push("Generated by Architex LLD Studio");

  const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "lld-study-plan.txt";
  link.click();
  URL.revokeObjectURL(url);
}

// ── Component ──────────────────────────────────────────────

export const StudyPlan = memo(function StudyPlan() {
  const [interviewDate, setInterviewDate] = useState<string>("");
  const [plan, setPlan] = useState<StudyDay[] | null>(null);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  const daysUntil = useMemo(() => {
    if (!interviewDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(interviewDate + "T00:00:00");
    const diff = target.getTime() - today.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [interviewDate]);

  const handleGenerate = useCallback(() => {
    if (!interviewDate) return;
    const target = new Date(interviewDate + "T00:00:00");
    const generated = generatePlan(target);
    setPlan(generated);
    setExpandedDay(null);
  }, [interviewDate]);

  const handleExport = useCallback(() => {
    if (!plan || !interviewDate) return;
    exportAsText(plan, new Date(interviewDate + "T00:00:00"));
  }, [plan, interviewDate]);

  const handleReset = useCallback(() => {
    setPlan(null);
    setInterviewDate("");
    setExpandedDay(null);
  }, []);

  const toggleDay = useCallback((dayNumber: number) => {
    setExpandedDay((prev) => (prev === dayNumber ? null : dayNumber));
  }, []);

  // Allocation stats
  const stats = useMemo(() => {
    if (!plan) return null;
    const counts: Record<TopicType, number> = { solid: 0, pattern: 0, problem: 0, review: 0 };
    for (const day of plan) counts[day.type]++;
    return counts;
  }, [plan]);

  // ── Date Input Screen ─────────────────────────────────────

  if (!plan) {
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 1);
    const minDateStr = minDate.toISOString().split("T")[0];

    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="flex max-w-sm flex-col items-center gap-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 shadow-[0_0_20px_rgba(var(--primary-rgb),0.15)]">
            <Calendar className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-sm font-semibold bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
            Interview Study Plan
          </h3>
          <p className="text-xs leading-relaxed text-foreground-muted">
            Enter your interview date and get a personalized day-by-day LLD study
            plan. Covers SOLID principles, design patterns, practice problems, and
            review sessions.
          </p>

          <div className="flex flex-col items-center gap-3">
            <label className="text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              Interview Date
            </label>
            <input
              type="date"
              value={interviewDate}
              min={minDateStr}
              onChange={(e) => setInterviewDate(e.target.value)}
              className="rounded-md border border-border bg-surface px-3 py-2 text-xs text-foreground outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary/30"
            />
            {daysUntil !== null && daysUntil > 0 && (
              <p className="text-[11px] text-foreground-muted">
                <span className="font-bold text-primary">{daysUntil}</span> day{daysUntil !== 1 ? "s" : ""} until your interview
                {daysUntil <= 7 && (
                  <span className="ml-1 text-amber-400">-- compressed plan</span>
                )}
              </p>
            )}
          </div>

          <button
            onClick={handleGenerate}
            disabled={!interviewDate || (daysUntil !== null && daysUntil <= 0)}
            className={cn(
              "rounded-full px-4 py-2 text-[11px] font-semibold transition-colors",
              interviewDate && daysUntil && daysUntil > 0
                ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]"
                : "cursor-not-allowed bg-border text-foreground-subtle",
            )}
          >
            Generate Study Plan
          </button>

          <div className="flex gap-3 text-[9px] text-foreground-subtle">
            <span>SOLID 20%</span>
            <span>Patterns 40%</span>
            <span>Problems 30%</span>
            <span>Review 10%</span>
          </div>
        </div>
      </div>
    );
  }

  // ── Generated Plan View ───────────────────────────────────

  const isShort = plan.length <= 7;

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-3 border-b border-border/30 px-4 py-2">
        <Calendar className="h-3.5 w-3.5 text-primary" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
          {plan.length}-Day Plan
        </span>
        {isShort && (
          <span className="rounded-sm bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold text-amber-400">
            Compressed
          </span>
        )}
        <div className="flex-1" />

        {/* Allocation badges */}
        {stats && (
          <div className="flex gap-1.5">
            {(Object.keys(stats) as TopicType[]).map((type) => (
              <span
                key={type}
                className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-bold"
                style={{
                  color: TOPIC_COLORS[type],
                  backgroundColor: `color-mix(in srgb, ${TOPIC_COLORS[type]} 10%, transparent)`,
                }}
              >
                {TOPIC_LABELS[type]}: {stats[type]}
              </span>
            ))}
          </div>
        )}

        <button
          onClick={handleExport}
          className="flex items-center gap-1 rounded-xl border border-border/30 bg-elevated/50 px-2 py-1 text-[10px] font-medium text-foreground-subtle transition-colors hover:bg-accent hover:text-foreground"
          title="Export as text"
        >
          <Download className="h-3 w-3" />
          Export
        </button>
        <button
          onClick={handleReset}
          className="flex items-center gap-1 rounded-xl border border-border/30 bg-elevated/50 px-2 py-1 text-[10px] font-medium text-foreground-subtle transition-colors hover:bg-accent hover:text-foreground"
          title="Start over"
        >
          <RotateCcw className="h-3 w-3" />
        </button>
      </div>

      {/* Day list */}
      <div className="flex-1 overflow-auto">
        <div className="divide-y divide-border/30">
          {plan.map((day) => {
            const isExpanded = expandedDay === day.dayNumber;
            const dateStr = day.date.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            });
            const isToday =
              day.date.toDateString() === new Date().toDateString();
            const isPast = day.date < new Date() && !isToday;

            const TypeIcon =
              day.type === "solid"
                ? Code
                : day.type === "pattern"
                  ? Layers
                  : day.type === "problem"
                    ? BookOpen
                    : RotateCcw;

            return (
              <button
                key={day.dayNumber}
                onClick={() => toggleDay(day.dayNumber)}
                className={cn(
                  "flex w-full flex-col px-4 py-2.5 text-left transition-colors hover:bg-accent/50",
                  isToday && "bg-primary/5",
                  isPast && "opacity-60",
                )}
              >
                <div className="flex items-center gap-3">
                  {/* Day number */}
                  <span
                    className={cn(
                      "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                      isToday
                        ? "bg-primary text-primary-foreground"
                        : "bg-border text-foreground-subtle",
                    )}
                  >
                    {day.dayNumber}
                  </span>

                  {/* Type badge */}
                  <span
                    className="flex h-5 items-center gap-1 rounded px-1.5 text-[9px] font-bold uppercase"
                    style={{
                      color: TOPIC_COLORS[day.type],
                      backgroundColor: `color-mix(in srgb, ${TOPIC_COLORS[day.type]} 10%, transparent)`,
                    }}
                  >
                    <TypeIcon
                      className="h-2.5 w-2.5"
                      style={{ color: TOPIC_COLORS[day.type] }}
                    />
                    {TOPIC_LABELS[day.type]}
                  </span>

                  {/* Title */}
                  <span className="flex-1 truncate text-[11px] font-semibold text-foreground">
                    {day.title}
                  </span>

                  {/* Date */}
                  <span className="flex-shrink-0 text-[10px] text-foreground-subtle">
                    {dateStr}
                  </span>

                  {isToday && (
                    <span className="flex-shrink-0 rounded-sm bg-primary/15 px-1.5 py-0.5 text-[9px] font-bold text-primary">
                      Today
                    </span>
                  )}

                  <ChevronRight
                    className={cn(
                      "h-3.5 w-3.5 flex-shrink-0 text-foreground-subtle transition-transform",
                      isExpanded && "rotate-90",
                    )}
                  />
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="mt-2 ml-10 rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm px-3 py-2">
                    <p className="text-[11px] leading-relaxed text-foreground-muted">
                      {day.description}
                    </p>
                    {day.patternId && (
                      <p className="mt-1.5 text-[10px] text-primary">
                        Load this pattern in the sidebar to study its UML diagram and code.
                      </p>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
});
