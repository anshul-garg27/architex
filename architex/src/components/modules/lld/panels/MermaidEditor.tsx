"use client";

/**
 * MermaidEditor — split-panel Mermaid DSL editor with live UML preview.
 *
 * Left: editable code pane with line numbers and syntax coloring.
 * Right: mini SVG preview of parsed UML classes.
 *
 * Editing the Mermaid code parses it (debounced 500ms) and calls
 * `onDiagramUpdate` so the main canvas stays in sync.
 */

import React, { memo, useState, useRef, useCallback, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Copy, RotateCcw, Check, AlertCircle } from "lucide-react";
import type { UMLClass, UMLRelationship, UMLMethodParam } from "@/lib/lld";
import { generateMermaid } from "@/lib/lld/codegen/diagram-to-mermaid";
import { parseMermaidClassDiagram } from "@/lib/lld/codegen/mermaid-to-diagram";
import {
  CLASS_HEADER_HEIGHT,
  ROW_HEIGHT,
  SECTION_PAD,
  STEREOTYPE_LABEL_HEIGHT,
  STEREOTYPE_BORDER_COLOR,
  STEREOTYPE_LABEL,
  classBoxWidth,
} from "../constants";

// ── Props ───────────────────────────────────────────────────

interface MermaidEditorProps {
  classes: UMLClass[];
  relationships: UMLRelationship[];
  onDiagramUpdate: (classes: UMLClass[], relationships: UMLRelationship[]) => void;
}

// ── Syntax highlighting tokens ──────────────────────────────

function highlightMermaid(code: string): React.ReactNode[] {
  return code.split("\n").map((line, i) => {
    const parts: React.ReactNode[] = [];
    let remaining = line;
    let key = 0;

    // Mermaid directive
    if (remaining.trim() === "classDiagram") {
      return <span key={i} className="text-violet-400 font-semibold">{line}</span>;
    }

    // Comment
    if (remaining.trim().startsWith("%%")) {
      return <span key={i} className="text-foreground-subtle/50 italic">{line}</span>;
    }

    // Class keyword
    const classKwMatch = remaining.match(/^(\s*)(class)(\s+)(\w+)(\s*\{?)/);
    if (classKwMatch) {
      const [, indent, kw, sp1, name, rest] = classKwMatch;
      parts.push(<span key={key++} className="text-foreground-subtle">{indent}</span>);
      parts.push(<span key={key++} className="text-violet-400 font-semibold">{kw}</span>);
      parts.push(<span key={key++}>{sp1}</span>);
      parts.push(<span key={key++} className="text-purple-400 font-semibold">{name}</span>);
      parts.push(<span key={key++} className="text-foreground-subtle">{rest}</span>);
      return <span key={i}>{parts}</span>;
    }

    // Stereotype
    const stereoMatch = remaining.match(/^(\s*)(<<\w+>>)(.*)$/);
    if (stereoMatch) {
      const [, indent, stereo, rest] = stereoMatch;
      parts.push(<span key={key++}>{indent}</span>);
      parts.push(<span key={key++} className="text-sky-400 italic">{stereo}</span>);
      parts.push(<span key={key++}>{rest}</span>);
      return <span key={i}>{parts}</span>;
    }

    // Relationship arrows
    const relMatch = remaining.match(/^(\s*)(\w+)(.*?)(<\|--|<\|\.\.|\*--|o--|-->|\.\.>)(.*?)(\w+)(.*?)$/);
    if (relMatch) {
      const [, indent, left, pre, arrow, post, right, rest] = relMatch;
      parts.push(<span key={key++}>{indent}</span>);
      parts.push(<span key={key++} className="text-purple-400">{left}</span>);
      parts.push(<span key={key++}>{pre}</span>);
      parts.push(<span key={key++} className="text-emerald-400 font-semibold">{arrow}</span>);
      parts.push(<span key={key++}>{post}</span>);
      parts.push(<span key={key++} className="text-purple-400">{right}</span>);
      if (rest) {
        const labelMatch = rest.match(/^(\s*:\s*)(.+)$/);
        if (labelMatch) {
          parts.push(<span key={key++} className="text-foreground-subtle">{labelMatch[1]}</span>);
          parts.push(<span key={key++} className="text-amber-400">{labelMatch[2]}</span>);
        } else {
          parts.push(<span key={key++}>{rest}</span>);
        }
      }
      return <span key={i}>{parts}</span>;
    }

    // Member line (inside class): visibility + content
    const memberMatch = remaining.match(/^(\s*)([+\-#~])(.*)$/);
    if (memberMatch) {
      const [, indent, vis, content] = memberMatch;
      parts.push(<span key={key++}>{indent}</span>);
      parts.push(<span key={key++} className="text-foreground-subtle/60">{vis}</span>);

      // Method vs attribute
      const methodPart = content.match(/^(\w+)\(([^)]*)\)(\*?)\s*(.*)$/);
      if (methodPart) {
        const [, mName, mParams, mAbstract, mReturn] = methodPart;
        parts.push(<span key={key++} className="text-amber-700 dark:text-amber-300">{mName}</span>);
        parts.push(<span key={key++} className="text-foreground-subtle">(</span>);
        parts.push(<span key={key++} className="text-foreground-muted">{mParams}</span>);
        parts.push(<span key={key++} className="text-foreground-subtle">)</span>);
        if (mAbstract) parts.push(<span key={key++} className="text-rose-400">*</span>);
        if (mReturn) parts.push(<span key={key++} className="text-sky-400"> {mReturn}</span>);
      } else {
        // Attribute: type + name
        const attrPart = content.match(/^(\S+)\s+(\S+)$/);
        if (attrPart) {
          parts.push(<span key={key++} className="text-sky-400">{attrPart[1]}</span>);
          parts.push(<span key={key++}> </span>);
          parts.push(<span key={key++} className="text-foreground">{attrPart[2]}</span>);
        } else {
          parts.push(<span key={key++} className="text-foreground">{content}</span>);
        }
      }
      return <span key={i}>{parts}</span>;
    }

    // Closing brace or plain text
    return <span key={i} className="text-foreground-subtle">{line}</span>;
  });
}

// ── Mini SVG Preview ────────────────────────────────────────

function classBoxHeight(cls: UMLClass): number {
  const hasStereo = cls.stereotype !== "class";
  return (
    CLASS_HEADER_HEIGHT +
    (hasStereo ? STEREOTYPE_LABEL_HEIGHT : 0) +
    cls.attributes.length * ROW_HEIGHT +
    SECTION_PAD +
    cls.methods.length * ROW_HEIGHT +
    SECTION_PAD +
    2 // bottom padding
  );
}

const MiniClassBox = memo(function MiniClassBox({ cls }: { cls: UMLClass }) {
  const borderColor = STEREOTYPE_BORDER_COLOR[cls.stereotype];
  const stereo = STEREOTYPE_LABEL[cls.stereotype];
  const h = classBoxHeight(cls);
  const w = classBoxWidth(cls);
  const hasStereo = stereo.length > 0;

  let yOff = cls.y;
  const headerY = yOff;
  yOff += CLASS_HEADER_HEIGHT;

  let stereoY = yOff;
  if (hasStereo) {
    stereoY = yOff;
    yOff += STEREOTYPE_LABEL_HEIGHT;
  }

  const attrStartY = yOff + SECTION_PAD;
  const attrSectionH = cls.attributes.length * ROW_HEIGHT + SECTION_PAD;
  yOff += attrSectionH;

  const dividerY = yOff;
  const methStartY = yOff + SECTION_PAD;

  return (
    <g>
      {/* Shadow */}
      <rect
        x={cls.x + 2}
        y={cls.y + 2}
        width={w}
        height={h}
        rx={6}
        fill="black"
        opacity={0.15}
      />
      {/* Background */}
      <rect
        x={cls.x}
        y={cls.y}
        width={w}
        height={h}
        rx={6}
        fill="var(--lld-class-fill)"
        stroke={borderColor}
        strokeWidth={1.5}
      />
      {/* Header bar */}
      <rect
        x={cls.x}
        y={cls.y}
        width={w}
        height={CLASS_HEADER_HEIGHT + (hasStereo ? STEREOTYPE_LABEL_HEIGHT : 0)}
        rx={6}
        fill={borderColor}
        opacity={0.12}
      />
      {/* Stereotype */}
      {hasStereo && (
        <text
          x={cls.x + w / 2}
          y={headerY + 12}
          textAnchor="middle"
          fill={borderColor}
          fontSize={8}
          fontStyle="italic"
        >
          {`\u00AB${stereo}\u00BB`}
        </text>
      )}
      {/* Class name */}
      <text
        x={cls.x + w / 2}
        y={headerY + (hasStereo ? 26 : 20)}
        textAnchor="middle"
        fill="var(--foreground)"
        fontSize={11}
        fontWeight={600}
      >
        {cls.name}
      </text>
      {/* Attributes */}
      {cls.attributes.map((attr, idx) => (
        <text
          key={attr.id}
          x={cls.x + 10}
          y={attrStartY + idx * ROW_HEIGHT + 12}
          fill="var(--foreground-muted)"
          fontSize={9}
          fontFamily="var(--font-mono, monospace)"
        >
          {`${attr.visibility}${attr.type ? attr.type + " " : ""}${attr.name}`}
        </text>
      ))}
      {/* Divider */}
      <line
        x1={cls.x + 8}
        y1={dividerY}
        x2={cls.x + w - 8}
        y2={dividerY}
        stroke="var(--border)"
        strokeOpacity={0.3}
      />
      {/* Methods */}
      {cls.methods.map((meth, idx) => {
        const paramStr = meth.params.length > 0
          ? (typeof meth.params[0] === "object" && meth.params[0] !== null && "name" in (meth.params[0] as UMLMethodParam)
            ? (meth.params as UMLMethodParam[]).map((p) => p.type ? `${p.name}: ${p.type}` : p.name).join(", ")
            : (meth.params as string[]).join(", "))
          : "";
        return (
          <text
            key={meth.id}
            x={cls.x + 10}
            y={methStartY + idx * ROW_HEIGHT + 12}
            fill="var(--foreground-muted)"
            fontSize={9}
            fontFamily="var(--font-mono, monospace)"
          >
            {`${meth.visibility}${meth.name}(${paramStr})`}
          </text>
        );
      })}
    </g>
  );
});

function MiniPreview({ classes, relationships }: { classes: UMLClass[]; relationships: UMLRelationship[] }) {
  if (classes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-foreground-subtle text-xs">
        No classes to preview
      </div>
    );
  }

  // Compute viewbox to fit all classes
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const cls of classes) {
    const h = classBoxHeight(cls);
    minX = Math.min(minX, cls.x);
    minY = Math.min(minY, cls.y);
    maxX = Math.max(maxX, cls.x + classBoxWidth(cls));
    maxY = Math.max(maxY, cls.y + h);
  }

  const pad = 30;
  const vbX = minX - pad;
  const vbY = minY - pad;
  const vbW = maxX - minX + pad * 2;
  const vbH = maxY - minY + pad * 2;

  // Build name→position lookup for relationship arrows
  const classById = new Map(classes.map((c) => [c.id, c]));

  return (
    <svg
      viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
      className="h-full w-full"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Relationship lines */}
      {relationships.map((rel) => {
        const src = classById.get(rel.source);
        const tgt = classById.get(rel.target);
        if (!src || !tgt) return null;

        const srcH = classBoxHeight(src);
        const tgtH = classBoxHeight(tgt);

        const x1 = src.x + classBoxWidth(src) / 2;
        const y1 = src.y + srcH / 2;
        const x2 = tgt.x + classBoxWidth(tgt) / 2;
        const y2 = tgt.y + tgtH / 2;

        const isDashed = rel.type === "dependency" || rel.type === "realization";

        return (
          <line
            key={rel.id}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="var(--foreground-subtle)"
            strokeWidth={1}
            strokeDasharray={isDashed ? "4 3" : undefined}
            opacity={0.5}
          />
        );
      })}

      {/* Class boxes */}
      {classes.map((cls) => (
        <MiniClassBox key={cls.id} cls={cls} />
      ))}
    </svg>
  );
}

// ── Main Component ──────────────────────────────────────────

export const MermaidEditor = memo(function MermaidEditor({
  classes,
  relationships,
  onDiagramUpdate,
}: MermaidEditorProps) {
  // Generate initial mermaid from current diagram
  const initialMermaid = useMemo(
    () => generateMermaid(classes, relationships),
    // Only compute on mount — later updates come from user typing
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [code, setCode] = useState(initialMermaid);
  const [previewClasses, setPreviewClasses] = useState<UMLClass[]>(classes);
  const [previewRelationships, setPreviewRelationships] = useState<UMLRelationship[]>(relationships);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"synced" | "editing" | "error">("synced");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync initial mermaid when pattern changes (classes identity changes)
  const classesKey = classes.map((c) => c.id).join(",");
  const prevKeyRef = useRef(classesKey);
  useEffect(() => {
    if (prevKeyRef.current !== classesKey) {
      prevKeyRef.current = classesKey;
      const fresh = generateMermaid(classes, relationships);
      setCode(fresh);
      setPreviewClasses(classes);
      setPreviewRelationships(relationships);
      setParseErrors([]);
      setSyncStatus("synced");
    }
  }, [classesKey, classes, relationships]);

  // Debounced parse on code change
  const handleCodeChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newCode = e.target.value;
      setCode(newCode);
      setSyncStatus("editing");

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const result = parseMermaidClassDiagram(newCode);
        setPreviewClasses(result.classes);
        setPreviewRelationships(result.relationships);
        setParseErrors(result.errors);

        if (result.errors.length === 0 && result.classes.length > 0) {
          onDiagramUpdate(result.classes, result.relationships);
          setSyncStatus("synced");
        } else {
          setSyncStatus("error");
        }
      }, 500);
    },
    [onDiagramUpdate],
  );

  // Sync scroll between textarea and highlight overlay
  const handleScroll = useCallback(() => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

  // Copy to clipboard
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [code]);

  // Reset to original pattern mermaid
  const handleReset = useCallback(() => {
    const fresh = generateMermaid(classes, relationships);
    setCode(fresh);
    setPreviewClasses(classes);
    setPreviewRelationships(relationships);
    setParseErrors([]);
    setSyncStatus("synced");
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
  }, [classes, relationships]);

  // Highlighted lines for overlay
  const highlighted = useMemo(() => highlightMermaid(code), [code]);
  const lineCount = code.split("\n").length;

  return (
    <div className="flex h-full min-h-0">
      {/* ── Left: Code Editor ──────────────────────────── */}
      <div className="flex w-1/2 flex-col border-r border-border/30">
        {/* Toolbar */}
        <div className="flex items-center justify-between border-b border-border/20 px-3 py-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground-subtle">
              Mermaid classDiagram
            </span>
            {/* Sync indicator */}
            <span
              className={cn(
                "flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold",
                syncStatus === "synced" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                syncStatus === "editing" && "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                syncStatus === "error" && "bg-red-500/10 text-red-600 dark:text-red-400",
              )}
            >
              <span
                className={cn(
                  "inline-block h-1.5 w-1.5 rounded-full",
                  syncStatus === "synced" && "bg-emerald-500",
                  syncStatus === "editing" && "bg-amber-500 animate-pulse",
                  syncStatus === "error" && "bg-red-500",
                )}
              />
              {syncStatus === "synced" && "Synced"}
              {syncStatus === "editing" && "Editing\u2026"}
              {syncStatus === "error" && "Error"}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 rounded-md border border-border/30 px-2 py-0.5 text-[10px] font-medium text-foreground-muted transition-colors hover:bg-foreground/5 hover:text-foreground"
              title="Copy to clipboard"
            >
              {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              {copied ? "Copied" : "Copy"}
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-1 rounded-md border border-border/30 px-2 py-0.5 text-[10px] font-medium text-foreground-muted transition-colors hover:bg-foreground/5 hover:text-foreground"
              title="Reset to original pattern"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          </div>
        </div>

        {/* Editor area */}
        <div className="relative flex flex-1 min-h-0 overflow-hidden">
          {/* Line numbers gutter */}
          <div
            className="shrink-0 select-none border-r border-border/20 bg-background/50 px-2 py-2 text-right font-mono text-[10px] leading-[18px] text-foreground-subtle/40 overflow-hidden"
            aria-hidden="true"
          >
            {Array.from({ length: lineCount }, (_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>

          {/* Syntax-highlighted overlay */}
          <pre
            ref={highlightRef}
            className="pointer-events-none absolute inset-0 left-[38px] overflow-hidden whitespace-pre p-2 font-mono text-[11px] leading-[18px]"
            aria-hidden="true"
          >
            {highlighted.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </pre>

          {/* Actual textarea (transparent text, visible caret) */}
          <textarea
            ref={textareaRef}
            value={code}
            onChange={handleCodeChange}
            onScroll={handleScroll}
            spellCheck={false}
            className="flex-1 resize-none bg-transparent p-2 font-mono text-[11px] leading-[18px] text-transparent caret-foreground outline-none selection:bg-primary/20 selection:text-foreground"
            style={{ caretColor: "var(--foreground)" }}
          />
        </div>

        {/* Parse errors */}
        {parseErrors.length > 0 && (
          <div className="border-t border-red-500/20 bg-red-500/5 px-3 py-1.5">
            {parseErrors.map((err, i) => (
              <div key={i} className="flex items-start gap-1.5 text-[10px] text-red-400">
                <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
                <span>{err}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Right: Live Preview ────────────────────────── */}
      <div className="flex w-1/2 flex-col">
        <div className="border-b border-border/20 px-3 py-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground-subtle">
            Live Preview
          </span>
          <span className="ml-2 text-[10px] text-foreground-subtle/50">
            {previewClasses.length} class{previewClasses.length !== 1 ? "es" : ""}
            {previewRelationships.length > 0 && ` \u00B7 ${previewRelationships.length} rel${previewRelationships.length !== 1 ? "s" : ""}`}
          </span>
        </div>
        <div className="flex-1 min-h-0 overflow-auto bg-background/30 p-2">
          <MiniPreview classes={previewClasses} relationships={previewRelationships} />
        </div>
      </div>
    </div>
  );
});

export default MermaidEditor;
