"use client";

/**
 * LLD Properties Panels — editable class details, pattern info, SOLID, problems, sequence, state machine.
 * Split from LLDModule.tsx (LLD-037).
 */

import React, { memo, useState, useCallback, useEffect } from "react";
import {
  Lightbulb,
  Code,
  BookOpen,
  ArrowRightLeft,
  Trophy,
  Star,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  Trash2,
  Plus,
  X,
  Layers,
  Circle,
} from "lucide-react";
import {
  PropertiesEmptyState,
  SequenceEmptyState,
  StateMachineEmptyState,
} from "@/components/shared/lld-empty-states";
import { cn } from "@/lib/utils";
import type {
  UMLClass,
  DesignPattern,
  SOLIDDemo,
  LLDProblem,
  SequenceMessage,
  StateNode,
} from "@/lib/lld";
import { formatMethodParams } from "@/lib/lld";
import { useLLDDataContext } from "../LLDDataContext";
import {
  STEREOTYPE_BORDER_COLOR,
  PRINCIPLE_COLORS,
  DIFFICULTY_COLORS,
  DIFFICULTY_LABELS,
  SEQ_TYPE_COLORS,
  smStateColor,
} from "../constants";

// ── Visibility/Stereotype Options ────────────────────────

const VISIBILITY_OPTIONS: Array<{ value: "+" | "-" | "#" | "~"; label: string }> = [
  { value: "+", label: "+ public" },
  { value: "-", label: "- private" },
  { value: "#", label: "# protected" },
  { value: "~", label: "~ package" },
];

const STEREOTYPE_OPTIONS: Array<{ value: UMLClass["stereotype"]; label: string }> = [
  { value: "class", label: "Class" },
  { value: "interface", label: "Interface" },
  { value: "abstract", label: "Abstract" },
  { value: "enum", label: "Enum" },
];

// ── Properties Panel (Pattern/Class) ─────────────────────

interface LLDPropertiesProps {
  pattern: DesignPattern | null;
  selectedClass: UMLClass | null;
  onDeleteClass?: () => void;
  onUpdateClassName?: (classId: string, name: string) => void;
  onUpdateStereotype?: (classId: string, stereotype: UMLClass["stereotype"]) => void;
  onAddAttribute?: (classId: string) => void;
  onRemoveAttribute?: (classId: string, attrId: string) => void;
  onUpdateAttributeVisibility?: (classId: string, attrId: string, visibility: "+" | "-" | "#" | "~") => void;
  onAddMethod?: (classId: string) => void;
  onRemoveMethod?: (classId: string, methodId: string) => void;
  onUpdateMethodVisibility?: (classId: string, methodId: string, visibility: "+" | "-" | "#" | "~") => void;
}

export const LLDProperties = memo(function LLDProperties({
  pattern,
  selectedClass,
  onDeleteClass,
  onUpdateClassName,
  onUpdateStereotype,
  onAddAttribute,
  onRemoveAttribute,
  onUpdateAttributeVisibility,
  onAddMethod,
  onRemoveMethod,
  onUpdateMethodVisibility,
}: LLDPropertiesProps) {
  const [codeTab, setCodeTab] = useState<"typescript" | "python" | "java">("typescript");
  const [editName, setEditName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);

  useEffect(() => {
    if (selectedClass) {
      setEditName(selectedClass.name);
      setIsEditingName(false);
    }
  }, [selectedClass?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleNameSubmit = useCallback(() => {
    if (selectedClass && onUpdateClassName && editName.trim()) {
      onUpdateClassName(selectedClass.id, editName.trim());
    }
    setIsEditingName(false);
  }, [selectedClass, editName, onUpdateClassName]);

  if (!pattern && !selectedClass) {
    return <PropertiesEmptyState />;
  }

  if (selectedClass) {
    const borderColor = STEREOTYPE_BORDER_COLOR[selectedClass.stereotype];
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-border/30 px-3 py-3">
          <h2 className="text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
            Class Details
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
          {/* Name — editable */}
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              Name
            </label>
            <div className="flex items-center gap-2">
              <div
                className="h-3 w-3 shrink-0 rounded-sm border-2"
                style={{ borderColor }}
              />
              {isEditingName ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={handleNameSubmit}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleNameSubmit();
                    if (e.key === "Escape") { setEditName(selectedClass.name); setIsEditingName(false); }
                  }}
                  autoFocus
                  className="flex-1 rounded-md border border-primary bg-background px-2 py-1 text-xs font-semibold text-foreground focus:outline-none"
                />
              ) : (
                <button
                  onClick={() => { setEditName(selectedClass.name); setIsEditingName(true); }}
                  className="flex-1 rounded-md border border-transparent px-2 py-1 text-left text-xs font-semibold text-foreground transition-colors hover:border-border hover:bg-elevated"
                  title="Click to edit name"
                >
                  {selectedClass.name}
                </button>
              )}
            </div>
          </div>

          {/* Stereotype dropdown */}
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              Stereotype
            </label>
            <select
              value={selectedClass.stereotype}
              onChange={(e) => onUpdateStereotype?.(selectedClass.id, e.target.value as UMLClass["stereotype"])}
              className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-[11px] text-foreground focus:border-primary focus:outline-none"
            >
              {STEREOTYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Attributes */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <h3 className="text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
                Attributes ({selectedClass.attributes.length})
              </h3>
              <button
                onClick={() => onAddAttribute?.(selectedClass.id)}
                className="flex items-center gap-0.5 rounded-xl border border-border/30 bg-elevated/50 px-1.5 py-0.5 text-[10px] font-medium text-foreground-subtle transition-colors hover:bg-accent hover:text-foreground"
                title="Add attribute"
              >
                <Plus className="h-3 w-3" />
                Add
              </button>
            </div>
            <div className="space-y-1">
              {selectedClass.attributes.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-1.5 rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm px-2 py-1"
                >
                  <select
                    value={a.visibility}
                    onChange={(e) =>
                      onUpdateAttributeVisibility?.(selectedClass.id, a.id, e.target.value as "+" | "-" | "#" | "~")
                    }
                    className="w-10 shrink-0 rounded border border-border bg-background px-0.5 py-0.5 text-center font-mono text-[10px] text-foreground-subtle focus:border-primary focus:outline-none"
                    title="Visibility"
                  >
                    {VISIBILITY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.value}
                      </option>
                    ))}
                  </select>
                  <span className="flex-1 truncate font-mono text-[11px] text-foreground-muted">
                    {a.name}: <span className="text-primary/70">{a.type}</span>
                  </span>
                  <button
                    onClick={() => onRemoveAttribute?.(selectedClass.id, a.id)}
                    className="shrink-0 rounded p-0.5 text-foreground-subtle transition-colors hover:bg-red-500/10 hover:text-red-400"
                    title="Remove attribute"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {selectedClass.attributes.length === 0 && (
                <p className="py-1 text-center text-[10px] italic text-foreground-subtle">
                  No attributes. Click + to add one.
                </p>
              )}
            </div>
          </div>

          {/* Methods */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <h3 className="text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
                Methods ({selectedClass.methods.length})
              </h3>
              <button
                onClick={() => onAddMethod?.(selectedClass.id)}
                className="flex items-center gap-0.5 rounded-xl border border-border/30 bg-elevated/50 px-1.5 py-0.5 text-[10px] font-medium text-foreground-subtle transition-colors hover:bg-accent hover:text-foreground"
                title="Add method"
              >
                <Plus className="h-3 w-3" />
                Add
              </button>
            </div>
            <div className="space-y-1">
              {selectedClass.methods.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-1.5 rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm px-2 py-1"
                >
                  <select
                    value={m.visibility}
                    onChange={(e) =>
                      onUpdateMethodVisibility?.(selectedClass.id, m.id, e.target.value as "+" | "-" | "#" | "~")
                    }
                    className="w-10 shrink-0 rounded border border-border bg-background px-0.5 py-0.5 text-center font-mono text-[10px] text-foreground-subtle focus:border-primary focus:outline-none"
                    title="Visibility"
                  >
                    {VISIBILITY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.value}
                      </option>
                    ))}
                  </select>
                  <span
                    className={cn(
                      "flex-1 truncate font-mono text-[11px] text-foreground-muted",
                      m.isAbstract && "italic",
                    )}
                  >
                    {m.name}({formatMethodParams(m.params)}): <span className="text-primary/70">{m.returnType}</span>
                  </span>
                  <button
                    onClick={() => onRemoveMethod?.(selectedClass.id, m.id)}
                    className="shrink-0 rounded p-0.5 text-foreground-subtle transition-colors hover:bg-red-500/10 hover:text-red-400"
                    title="Remove method"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {selectedClass.methods.length === 0 && (
                <p className="py-1 text-center text-[10px] italic text-foreground-subtle">
                  No methods. Click + to add one.
                </p>
              )}
            </div>
          </div>

          {/* Delete class */}
          {onDeleteClass && (
            <div className="border-t border-border/30 pt-3">
              <button
                onClick={onDeleteClass}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/5 backdrop-blur-sm shadow-[0_0_15px_rgba(239,68,68,0.05)] px-3 py-2 text-[11px] font-medium text-red-400 transition-colors hover:bg-red-500/10"
              >
                <Trash2 className="h-3 w-3" />
                Delete Class
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Pattern details
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border/30 px-3 py-3">
        <h2 className="text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
          {pattern!.name} Pattern
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        <p className="text-xs leading-relaxed text-foreground-muted">
          {pattern!.description}
        </p>

        <div>
          <div className="mb-1.5 flex items-center gap-1.5">
            <Lightbulb className="h-3 w-3 text-amber-400" />
            <h3 className="text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              Real-World Examples
            </h3>
          </div>
          <ul className="space-y-1">
            {pattern!.realWorldExamples.map((ex, i) => (
              <li
                key={i}
                className="flex items-start gap-1.5 text-[11px] text-foreground-muted"
              >
                <div className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-400/60" />
                {ex}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="mb-1.5 flex items-center gap-1.5">
            <Code className="h-3 w-3 text-blue-400" />
            <h3 className="text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              Code Sample
            </h3>
          </div>
          <div className="mb-2 flex gap-1">
            <button
              onClick={() => setCodeTab("typescript")}
              className={cn(
                "rounded-md px-2 py-1 text-[10px] font-medium transition-colors",
                codeTab === "typescript"
                  ? "bg-primary/10 text-primary"
                  : "text-foreground-subtle hover:text-foreground",
              )}
            >
              TypeScript
            </button>
            <button
              onClick={() => setCodeTab("python")}
              className={cn(
                "rounded-md px-2 py-1 text-[10px] font-medium transition-colors",
                codeTab === "python"
                  ? "bg-primary/10 text-primary"
                  : "text-foreground-subtle hover:text-foreground",
              )}
            >
              Python
            </button>
            {pattern!.code.java && (
              <button
                onClick={() => setCodeTab("java")}
                className={cn(
                  "rounded-md px-2 py-1 text-[10px] font-medium transition-colors",
                  codeTab === "java"
                    ? "bg-primary/10 text-primary"
                    : "text-foreground-subtle hover:text-foreground",
                )}
              >
                Java
              </button>
            )}
          </div>
          <pre className="overflow-auto rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm p-3 text-[10px] leading-relaxed text-foreground-muted">
            <code>{pattern!.code[codeTab] ?? ""}</code>
          </pre>
        </div>

        <div>
          <div className="mb-1.5 flex items-center gap-1.5">
            <BookOpen className="h-3 w-3 text-green-400" />
            <h3 className="text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              When to Use
            </h3>
          </div>
          <ul className="space-y-1">
            {pattern!.whenToUse.map((tip, i) => (
              <li
                key={i}
                className="flex items-start gap-1.5 text-[11px] text-foreground-muted"
              >
                <div className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-green-400/60" />
                {tip}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="mb-1.5 flex items-center gap-1.5">
            <BookOpen className="h-3 w-3 text-red-400" />
            <h3 className="text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              When Not to Use
            </h3>
          </div>
          <ul className="space-y-1">
            {pattern!.whenNotToUse.map((tip, i) => (
              <li
                key={i}
                className="flex items-start gap-1.5 text-[11px] text-foreground-muted"
              >
                <div className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-red-400/60" />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
});

// ── SOLID Properties Panel ───────────────────────────────

interface LLDSOLIDPropertiesProps {
  demo: SOLIDDemo;
  solidView: "before" | "after";
  onToggleView: () => void;
}

export const LLDSOLIDProperties = memo(function LLDSOLIDProperties({
  demo,
  solidView,
  onToggleView,
}: LLDSOLIDPropertiesProps) {
  const principleColor = PRINCIPLE_COLORS[demo.principle];
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border/30 px-3 py-3">
        <h2 className="text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
          SOLID Principle
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        <div>
          <span
            className="inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase"
            style={{ color: principleColor, backgroundColor: `${principleColor}18` }}
          >
            {demo.principle}
          </span>
          <h3 className="mt-1 text-sm font-semibold text-foreground">{demo.name}</h3>
          <p className="mt-1 text-[11px] leading-relaxed text-foreground-muted">
            {demo.description}
          </p>
        </div>

        <div>
          <button
            onClick={onToggleView}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm px-3 py-2 text-xs font-medium text-foreground-muted transition-colors hover:bg-accent hover:text-foreground"
          >
            <ArrowRightLeft className="h-3.5 w-3.5" />
            {solidView === "before" ? "Show After (Refactored)" : "Show Before (Violation)"}
          </button>
          <p className="mt-1.5 text-center text-[10px] text-foreground-subtle">
            Currently viewing: <span className="font-semibold">{solidView === "before" ? "Before (Violation)" : "After (Refactored)"}</span>
          </p>
        </div>

        <div>
          <div className="mb-1.5 flex items-center gap-1.5">
            <Lightbulb className="h-3 w-3 text-amber-400" />
            <h3 className="text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              Explanation
            </h3>
          </div>
          <p className="text-[11px] leading-relaxed text-foreground-muted">
            {demo.explanation}
          </p>
        </div>

        <div>
          <div className="mb-1.5 flex items-center gap-1.5">
            <BookOpen className="h-3 w-3 text-green-400" />
            <h3 className="text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              Real-World Analogy
            </h3>
          </div>
          <p className="text-[11px] leading-relaxed text-foreground-muted italic">
            {demo.realWorldExample}
          </p>
        </div>
      </div>
    </div>
  );
});

// ── Problem Properties Panel ─────────────────────────────

export const LLDProblemProperties = memo(function LLDProblemProperties({
  problem,
}: {
  problem: LLDProblem;
}) {
  const diffColor = DIFFICULTY_COLORS[problem.difficulty];
  const [showHints, setShowHints] = useState(false);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border/30 px-3 py-3">
        <h2 className="text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
          Problem Details
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-sm font-semibold text-foreground">{problem.name}</span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium"
              style={{ color: diffColor, backgroundColor: `${diffColor}15` }}
            >
              <Star className="h-2.5 w-2.5" />
              {DIFFICULTY_LABELS[problem.difficulty]} (L{problem.difficulty})
            </span>
          </div>
        </div>

        <p className="text-[11px] leading-relaxed text-foreground-muted">
          {problem.description}
        </p>

        <div>
          <div className="mb-1.5 flex items-center gap-1.5">
            <BookOpen className="h-3 w-3 text-blue-400" />
            <h3 className="text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              Requirements
            </h3>
          </div>
          <ul className="space-y-1">
            {problem.requirements.map((req, i) => (
              <li
                key={i}
                className="flex items-start gap-1.5 text-[11px] text-foreground-muted"
              >
                <div className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-blue-400/60" />
                {req}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <button
            onClick={() => setShowHints((p) => !p)}
            className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent hover:text-foreground transition-colors"
          >
            <AlertTriangle className="h-3 w-3 text-amber-400" />
            Hints
            {showHints ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>
          {showHints && (
            <ul className="mt-1.5 space-y-1.5">
              {problem.hints.map((hint, i) => (
                <li
                  key={i}
                  className="flex items-start gap-1.5 text-[11px] text-foreground-muted"
                >
                  <span className="mt-0.5 shrink-0 text-amber-400/80 font-mono text-[10px]">{i + 1}.</span>
                  {hint}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
});

// ── Sequence Properties Panel ────────────────────────────

export const SequenceProperties = memo(function SequenceProperties({
  example,
  selectedMessage,
}: {
  example: { id: string; name: string; [key: string]: any } | null;
  selectedMessage: SequenceMessage | null;
}) {
  if (!example && !selectedMessage) {
    return <SequenceEmptyState />;
  }

  if (selectedMessage && example) {
    const fromP = example.data.participants.find((p: any) => p.id === selectedMessage.from);
    const toP = example.data.participants.find((p: any) => p.id === selectedMessage.to);
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-border/30 px-3 py-3">
          <h2 className="text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
            Message Details
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
          <div>
            <h3 className="mb-1 text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              Label
            </h3>
            <p className="font-mono text-xs text-foreground">{selectedMessage.label}</p>
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <h3 className="mb-1 text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
                From
              </h3>
              <p className="text-xs text-foreground-muted">{fromP?.name ?? selectedMessage.from}</p>
            </div>
            <div className="flex-1">
              <h3 className="mb-1 text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
                To
              </h3>
              <p className="text-xs text-foreground-muted">{toP?.name ?? selectedMessage.to}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <h3 className="mb-1 text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
                Type
              </h3>
              <span
                className="inline-block rounded-sm px-1.5 py-0.5 text-[10px] font-medium capitalize"
                style={{
                  color: SEQ_TYPE_COLORS[selectedMessage.type],
                  backgroundColor: `${SEQ_TYPE_COLORS[selectedMessage.type]}18`,
                }}
              >
                {selectedMessage.type}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="mb-1 text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
                Order
              </h3>
              <p className="text-xs text-foreground-muted">#{selectedMessage.order}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border/30 px-3 py-3">
        <h2 className="text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
          Sequence Diagram
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{example!.name}</h3>
          <p className="mt-1 text-[11px] leading-relaxed text-foreground-muted">
            {example!.description}
          </p>
        </div>
        <div>
          <div className="mb-1.5 flex items-center gap-1.5">
            <Layers className="h-3 w-3 text-blue-400" />
            <h3 className="text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              Participants ({example!.data.participants.length})
            </h3>
          </div>
          <div className="space-y-1">
            {example!.data.participants.map((p: any) => (
              <div
                key={p.id}
                className="flex items-center gap-2 rounded-md px-2 py-1 text-[11px] text-foreground-muted"
              >
                <span
                  className="inline-flex h-4 w-4 items-center justify-center rounded text-[8px] font-bold"
                  style={{
                    color: p.type === "actor" ? "var(--lld-stereo-interface)" : "var(--lld-canvas-border)",
                    backgroundColor: p.type === "actor" ? "color-mix(in srgb, var(--lld-stereo-interface) 10%, transparent)" : "color-mix(in srgb, var(--lld-canvas-border) 10%, transparent)",
                  }}
                >
                  {p.type === "actor" ? "A" : "O"}
                </span>
                {p.name}
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-1.5 flex items-center gap-1.5">
            <ArrowRightLeft className="h-3 w-3 text-green-400" />
            <h3 className="text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              Messages ({example!.data.messages.length})
            </h3>
          </div>
          <p className="text-[10px] text-foreground-subtle">
            Click a message arrow on the canvas to see its details.
          </p>
        </div>
      </div>
    </div>
  );
});

// ── State Machine Properties Panel ───────────────────────

export const StateMachineProperties = memo(function StateMachineProperties({
  example,
  selectedState,
}: {
  example: { id: string; name: string; [key: string]: any } | null;
  selectedState: StateNode | null;
}) {
  if (!example && !selectedState) {
    return <StateMachineEmptyState />;
  }

  if (selectedState && example) {
    const color = smStateColor(selectedState);
    const outgoing = example.data.transitions.filter((t: any) => t.from === selectedState.id);
    const incoming = example.data.transitions.filter((t: any) => t.to === selectedState.id);
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-border/30 px-3 py-3">
          <h2 className="text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
            State Details
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
          <div>
            <h3 className="mb-1 text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              Name
            </h3>
            <p className="text-xs font-medium" style={{ color }}>{selectedState.name}</p>
          </div>
          <div className="flex gap-3">
            {selectedState.isInitial && (
              <span className="rounded-sm bg-blue-500/15 px-1.5 py-0.5 text-[10px] font-medium text-blue-400">
                Initial
              </span>
            )}
            {selectedState.isFinal && (
              <span className="rounded-sm bg-green-500/15 px-1.5 py-0.5 text-[10px] font-medium text-green-400">
                Final
              </span>
            )}
          </div>
          {selectedState.entryAction && (
            <div>
              <h3 className="mb-1 text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
                Entry Action
              </h3>
              <p className="font-mono text-xs text-foreground-muted">{selectedState.entryAction}</p>
            </div>
          )}
          {selectedState.exitAction && (
            <div>
              <h3 className="mb-1 text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
                Exit Action
              </h3>
              <p className="font-mono text-xs text-foreground-muted">{selectedState.exitAction}</p>
            </div>
          )}
          {outgoing.length > 0 && (
            <div>
              <h3 className="mb-1 text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
                Outgoing Transitions ({outgoing.length})
              </h3>
              <div className="space-y-1">
                {outgoing.map((t: any) => {
                  const target = example.data.states.find((s: any) => s.id === t.to);
                  return (
                    <div key={t.id} className="rounded-xl bg-elevated/50 backdrop-blur-sm px-2 py-1 text-[11px] text-foreground-muted">
                      <span className="font-mono text-foreground">{t.trigger}</span>
                      {t.guard && <span className="text-amber-400"> [{t.guard}]</span>}
                      <span className="text-foreground-subtle"> {"\u2192"} {target?.name ?? t.to}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {incoming.length > 0 && (
            <div>
              <h3 className="mb-1 text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
                Incoming Transitions ({incoming.length})
              </h3>
              <div className="space-y-1">
                {incoming.map((t: any) => {
                  const source = example.data.states.find((s: any) => s.id === t.from);
                  return (
                    <div key={t.id} className="rounded-xl bg-elevated/50 backdrop-blur-sm px-2 py-1 text-[11px] text-foreground-muted">
                      <span className="text-foreground-subtle">{source?.name ?? t.from} {"\u2192"}</span>
                      <span className="font-mono text-foreground"> {t.trigger}</span>
                      {t.guard && <span className="text-amber-400"> [{t.guard}]</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border/30 px-3 py-3">
        <h2 className="text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
          State Machine
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{example!.name}</h3>
          <p className="mt-1 text-[11px] leading-relaxed text-foreground-muted">
            {example!.description}
          </p>
        </div>
        <div>
          <div className="mb-1.5 flex items-center gap-1.5">
            <Circle className="h-3 w-3 text-blue-400" />
            <h3 className="text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              States ({example!.data.states.length})
            </h3>
          </div>
          <div className="space-y-1">
            {example!.data.states.map((s: any) => (
              <div
                key={s.id}
                className="flex items-center gap-2 rounded-md px-2 py-1 text-[11px] text-foreground-muted"
              >
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: smStateColor(s) }}
                />
                {s.name}
                {s.isInitial && <span className="text-[9px] text-blue-400">(initial)</span>}
                {s.isFinal && <span className="text-[9px] text-green-400">(final)</span>}
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-1.5 flex items-center gap-1.5">
            <ArrowRightLeft className="h-3 w-3 text-green-400" />
            <h3 className="text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              Transitions ({example!.data.transitions.length})
            </h3>
          </div>
          <p className="text-[10px] text-foreground-subtle">
            Click a state on the canvas to see its entry/exit actions and transitions.
          </p>
        </div>
      </div>
    </div>
  );
});
