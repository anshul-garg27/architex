"use client";

import React, { memo, useRef, useState } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Shuffle,
  Plus,
  Minus,
  Search,
  ArrowUpFromLine,
  ArrowDownToLine,
  Eye,
  CheckCircle,
  Zap,
  RefreshCw,
  Scissors,
  ArrowDownUp,
  Layers,
  Hammer,
  Undo2,
  Volume2,
  VolumeX,
  Download,
  ClipboardPaste,
  Brain,
  Footprints,
} from "lucide-react";
import { motion } from "motion/react";
import type { ActiveDS } from "./types";
import { DS_CATALOG } from "@/lib/data-structures/catalog";
import { downloadVisualizationSVG } from "./VideoExport";

const DSControls = memo(function DSControls({
  activeDS,
  onOperation,
  onRandom,
  onReset,
  onUndo,
  canUndo,
  onStepForward,
  onStepBack,
  onPlayToggle,
  onSpeedChange,
  isPlaying,
  playbackSpeed,
  hasSteps,
  stepIdx,
  totalSteps,
  soundEnabled,
  onToggleSound,
  predictionMode,
  onTogglePrediction,
  manualTraceActive,
  onToggleManualTrace,
}: {
  activeDS: ActiveDS;
  onOperation: (op: string, value?: number | string, extra?: number | string) => void;
  onRandom: () => void;
  onReset: () => void;
  onUndo: () => void;
  canUndo: boolean;
  onStepForward: () => void;
  onStepBack: () => void;
  onPlayToggle: () => void;
  onSpeedChange: () => void;
  isPlaying: boolean;
  playbackSpeed: number;
  hasSteps: boolean;
  stepIdx: number;
  totalSteps: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  predictionMode: boolean;
  onTogglePrediction: () => void;
  manualTraceActive: boolean;
  onToggleManualTrace: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const extraRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  // DST-201: Bulk paste import state
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteValue, setPasteValue] = useState("");

  const config = DS_CATALOG.find((d) => d.id === activeDS);
  if (!config) return null;

  const handleOp = (opId: string) => {
    const val = inputRef.current?.value ?? "";
    const extra = extraRef.current?.value ?? "";

    // DST-081: Validate numeric input for DS that need numbers
    if (!needsKey && val && isNaN(parseFloat(val))) {
      setError("Enter a valid number (e.g., 42)");
      setTimeout(() => setError(null), 2000);
      return;
    }

    onOperation(opId, val || undefined, extra || undefined);
    if (inputRef.current) inputRef.current.value = "";
    if (extraRef.current) extraRef.current.value = "";
    setError(null);
  };

  // DST-201: Bulk paste import handler
  const handleBulkInsert = () => {
    const values = pasteValue.split(',').map(s => s.trim()).filter(Boolean);
    for (const v of values) {
      onOperation('insert', v);
    }
    setShowPasteModal(false);
    setPasteValue('');
  };

  const needsKey = activeDS === "hash-table" || activeDS === "bloom-filter" || activeDS === "trie" || activeDS === "lsm-tree" || activeDS === "consistent-hash" || activeDS === "merkle-tree" || activeDS === "count-min-sketch" || activeDS === "hyperloglog" || activeDS === "wal" || activeDS === "rope" || activeDS === "r-tree" || activeDS === "quadtree" || activeDS === "crdt" || activeDS === "vector-clock" || activeDS === "lru-cache";
  const needsIndex = activeDS === "array";
  const needsExtra = activeDS === "segment-tree" || activeDS === "fenwick-tree" || activeDS === "priority-queue";

  const primaryLabel = activeDS === "trie" ? "Word" : activeDS === "hash-table" || activeDS === "lsm-tree" || activeDS === "lru-cache" ? "Key" : activeDS === "r-tree" || activeDS === "quadtree" ? "x,y" : activeDS === "merkle-tree" ? "Data" : activeDS === "crdt" || activeDS === "vector-clock" ? "Node" : needsKey ? "Element" : "Value";
  const primaryPlaceholder = activeDS === "trie" ? "e.g., cat" : activeDS === "r-tree" || activeDS === "quadtree" ? "e.g., 30,50" : activeDS === "merkle-tree" ? "e.g., A,B,C,D" : activeDS === "lru-cache" ? "e.g., user" : needsKey ? "e.g., alpha" : "e.g., 42";
  const extraLabel = needsIndex ? "Index" : activeDS === "priority-queue" ? "Priority" : needsExtra ? "Delta" : activeDS === "union-find" ? "Element B" : activeDS === "lsm-tree" ? "Value" : activeDS === "vector-clock" ? "To Node" : activeDS === "hash-table" ? "Value" : activeDS === "lru-cache" ? "Value" : "";
  const extraPlaceholder = needsIndex ? "e.g., 0" : activeDS === "priority-queue" ? "e.g., 3" : needsExtra ? "e.g., 5" : activeDS === "union-find" ? "e.g., 3" : activeDS === "lsm-tree" ? "e.g., v1" : activeDS === "vector-clock" ? "e.g., B" : activeDS === "lru-cache" ? "e.g., 42" : "e.g., 10";

  return (
    <div role="toolbar" aria-label={`${config.name} controls`} className="flex items-center gap-2 flex-wrap">
      {/* Value/Key input */}
      <div className="flex flex-col">
        <span className="text-[10px] text-foreground-muted">{primaryLabel}</span>
        <input
          ref={inputRef}
          type={needsKey ? "text" : "number"}
          placeholder={primaryPlaceholder}
          aria-label={primaryLabel}
          maxLength={100}
          className="h-11 md:h-7 w-24 md:w-20 rounded border border-border bg-background px-3 md:px-2 text-xs text-foreground placeholder:text-foreground-subtle focus:border-primary focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const firstOp = config.operations[0];
              if (firstOp) handleOp(typeof firstOp === 'string' ? firstOp : firstOp.id);
            }
          }}
        />
      </div>

      {/* DST-201: Bulk paste import */}
      <div className="relative">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowPasteModal(prev => !prev)}
          aria-label="Paste multiple values"
          title="Paste comma-separated values for bulk insert"
          className="flex h-11 md:h-7 items-center gap-1 rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm px-2 text-xs text-foreground-muted transition-colors hover:bg-accent hover:text-foreground hover:shadow-[0_0_10px_rgba(110,86,207,0.1)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
        >
          <ClipboardPaste className="h-3 w-3" />
        </motion.button>
        {showPasteModal && (
          <div className="absolute top-full left-0 mt-1 z-50 rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm p-2 shadow-lg">
            <textarea
              className="w-48 h-16 rounded border border-border bg-background px-2 py-1 text-xs font-mono text-foreground placeholder:text-foreground-subtle focus:border-primary focus:outline-none"
              placeholder="Paste values: 5, 3, 8, 1, 9"
              value={pasteValue}
              onChange={e => setPasteValue(e.target.value)}
              autoFocus
            />
            <div className="flex gap-1 mt-1">
              <button
                onClick={handleBulkInsert}
                className="rounded bg-primary px-2 py-1 text-xs text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              >
                Insert All
              </button>
              <button
                onClick={() => { setShowPasteModal(false); setPasteValue(''); }}
                className="rounded-xl border border-border/30 px-2 py-1 text-xs text-foreground-muted hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Extra input: index for array, value for hash, second element for union-find, value for LSM, delta for seg/fenwick, value for LRU */}
      {(needsIndex || needsExtra || activeDS === "hash-table" || activeDS === "union-find" || activeDS === "lsm-tree" || activeDS === "vector-clock" || activeDS === "lru-cache") && (
        <div className="flex flex-col">
          <span className="text-[10px] text-foreground-muted">{extraLabel}</span>
          <input
            ref={extraRef}
            type={activeDS === "lsm-tree" || activeDS === "vector-clock" ? "text" : "number"}
            placeholder={extraPlaceholder}
            aria-label={extraLabel}
            maxLength={100}
            className="h-11 md:h-7 w-24 md:w-16 rounded border border-border bg-background px-3 md:px-2 text-xs text-foreground placeholder:text-foreground-subtle focus:border-primary focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
      )}

      {/* Operation buttons */}
      {config.operations.map((op) => {
        const opId = typeof op === 'string' ? op : op.id;
        const opLabel = typeof op === 'string' ? op : op.label;
        const tooltips: Record<string, string> = {
          insert: "Insert a new element",
          delete: "Remove an element",
          search: "Search for an element",
          push: "Push element onto stack",
          pop: "Pop element from stack",
          peek: "Peek at top element",
          enqueue: "Add to queue",
          dequeue: "Remove from queue",
          get: "Get a value",
          put: "Put a key-value pair",
        };
        const icons: Record<string, React.ReactNode> = {
          insert: <Plus className="h-3 w-3" />,
          delete: <Minus className="h-3 w-3" />,
          search: <Search className="h-3 w-3" />,
          push: <ArrowUpFromLine className="h-3 w-3" />,
          pop: <ArrowDownToLine className="h-3 w-3" />,
          peek: <Eye className="h-3 w-3" />,
          enqueue: <Plus className="h-3 w-3" />,
          dequeue: <Minus className="h-3 w-3" />,
          checkpoint: <CheckCircle className="h-3 w-3" />,
          crash: <Zap className="h-3 w-3" />,
          recover: <RefreshCw className="h-3 w-3" />,
          truncate: <Scissors className="h-3 w-3" />,
          flush: <ArrowDownUp className="h-3 w-3" />,
          compact: <Layers className="h-3 w-3" />,
          build: <Hammer className="h-3 w-3" />,
          insertHead: <Plus className="h-3 w-3" />,
          insertTail: <Plus className="h-3 w-3" />,
          reverse: <RefreshCw className="h-3 w-3" />,
          get: <Search className="h-3 w-3" />,
          put: <Plus className="h-3 w-3" />,
        };
        return (
          <motion.button
            key={opId}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleOp(opId)}
            title={tooltips[opId] ?? opLabel}
            className="flex h-11 md:h-7 items-center gap-1 rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm px-3 md:px-2 text-xs text-foreground-muted transition-colors hover:bg-accent hover:text-foreground hover:shadow-[0_0_10px_rgba(110,86,207,0.1)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
          >
            {icons[opId] ?? null}
            <span className="capitalize">{opLabel}</span>
          </motion.button>
        );
      })}

      <div className="mx-1 h-4 w-px bg-border/30" />

      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onRandom}
        title="Generate random data (R)"
        className="flex h-11 md:h-7 items-center gap-1 rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm px-3 md:px-2 text-xs text-foreground-muted transition-colors hover:bg-accent hover:text-foreground hover:shadow-[0_0_10px_rgba(110,86,207,0.1)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
      >
        <Shuffle className="h-3 w-3" />
        Random
        <span className="text-[9px] text-foreground-subtle">R</span>
      </motion.button>

      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onReset}
        title="Reset to initial state (Esc)"
        className="flex h-11 md:h-7 items-center gap-1 rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm px-3 md:px-2 text-xs text-foreground-muted transition-colors hover:bg-accent hover:text-foreground hover:shadow-[0_0_10px_rgba(110,86,207,0.1)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
      >
        <RotateCcw className="h-3 w-3" />
        Reset
        <span className="text-[9px] text-foreground-subtle">Esc</span>
      </motion.button>

      {/* DST-096: Undo button */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onUndo}
        disabled={!canUndo}
        title="Undo last operation (Ctrl+Z)"
        aria-label="Undo last operation"
        className="flex h-11 md:h-7 items-center gap-1 rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm px-3 md:px-2 text-xs text-foreground-muted transition-colors hover:bg-accent hover:text-foreground hover:shadow-[0_0_10px_rgba(110,86,207,0.1)] disabled:opacity-40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
      >
        <Undo2 className="h-3 w-3" />
        Undo
      </motion.button>

      {/* DST-101: Sound toggle */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onToggleSound}
        title="Toggle sound"
        aria-label={soundEnabled ? "Mute sonification" : "Enable sonification"}
        aria-pressed={soundEnabled}
        className="flex h-11 md:h-7 items-center gap-1 rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm px-3 md:px-2 text-xs text-foreground-muted transition-colors hover:bg-accent hover:text-foreground hover:shadow-[0_0_10px_rgba(110,86,207,0.1)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
      >
        {soundEnabled ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
      </motion.button>

      {/* DST-103: Export visualization (SVG download / print fallback) */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={downloadVisualizationSVG}
        title="Export as SVG"
        aria-label="Download visualization as SVG"
        className="flex h-11 md:h-7 items-center gap-1 rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm px-3 md:px-2 text-xs text-foreground-muted transition-colors hover:bg-accent hover:text-foreground hover:shadow-[0_0_10px_rgba(110,86,207,0.1)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
      >
        <Download className="h-3 w-3" />
      </motion.button>

      {/* DST-149: Prediction mode toggle */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onTogglePrediction}
        title={predictionMode ? "Disable prediction mode" : "Enable prediction mode — predict before each step"}
        aria-label={predictionMode ? "Disable prediction mode" : "Enable prediction mode"}
        aria-pressed={predictionMode}
        className={`flex h-11 md:h-7 items-center gap-1 rounded-xl border px-3 md:px-2 text-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary ${
          predictionMode
            ? "border-primary/50 bg-primary/10 text-primary shadow-[0_0_15px_rgba(110,86,207,0.2)] backdrop-blur-sm"
            : "border-border/30 bg-elevated/50 backdrop-blur-sm text-foreground-muted hover:bg-accent hover:text-foreground hover:shadow-[0_0_10px_rgba(110,86,207,0.1)]"
        }`}
      >
        <Brain className="h-3 w-3" />
        <span className="hidden md:inline">Predict</span>
      </motion.button>

      {/* DST-150: Manual trace mode toggle */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onToggleManualTrace}
        title={manualTraceActive ? "Exit manual trace mode" : "Enter manual trace mode — you are the algorithm"}
        aria-label={manualTraceActive ? "Exit manual trace" : "Enter manual trace"}
        aria-pressed={manualTraceActive}
        className={`flex h-11 md:h-7 items-center gap-1 rounded-xl border px-3 md:px-2 text-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary ${
          manualTraceActive
            ? "border-primary/50 bg-primary/10 text-primary shadow-[0_0_15px_rgba(110,86,207,0.2)] backdrop-blur-sm"
            : "border-border/30 bg-elevated/50 backdrop-blur-sm text-foreground-muted hover:bg-accent hover:text-foreground hover:shadow-[0_0_10px_rgba(110,86,207,0.1)]"
        }`}
      >
        <Footprints className="h-3 w-3" />
        <span className="hidden md:inline">Trace</span>
      </motion.button>

      {hasSteps && (
        <>
          <div className="mx-1 h-4 w-px bg-border/30" />
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onStepBack}
            disabled={stepIdx <= 0}
            title="Previous step (\u2190)"
            aria-label="Step back"
            className="flex h-11 md:h-7 items-center gap-1 rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm px-3 md:px-2 text-xs text-foreground-muted transition-colors hover:bg-accent hover:text-foreground hover:shadow-[0_0_10px_rgba(110,86,207,0.1)] disabled:opacity-40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
          >
            <SkipBack className="h-3 w-3" />
            <span className="text-[9px] text-foreground-subtle">&larr;</span>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onPlayToggle}
            title="Auto-play (Space)"
            aria-label={isPlaying ? "Pause auto-play" : "Play auto-play"}
            className="flex h-11 md:h-7 items-center gap-1 rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm px-3 md:px-2 text-xs text-foreground-muted transition-colors hover:bg-accent hover:text-foreground hover:shadow-[0_0_10px_rgba(110,86,207,0.1)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
          >
            {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            <span className="text-[9px] text-foreground-subtle">Space</span>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onStepForward}
            disabled={stepIdx >= totalSteps - 1}
            title="Next step (\u2192)"
            aria-label="Step forward"
            className="flex h-11 md:h-7 items-center gap-1 rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm px-3 md:px-2 text-xs text-foreground-muted transition-colors hover:bg-accent hover:text-foreground hover:shadow-[0_0_10px_rgba(110,86,207,0.1)] disabled:opacity-40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
          >
            <SkipForward className="h-3 w-3" />
            <span className="text-[9px] text-foreground-subtle">&rarr;</span>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onSpeedChange}
            title="Playback speed"
            aria-label={`Playback speed: ${playbackSpeed}x`}
            className="flex h-11 md:h-7 items-center gap-1 rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm px-3 md:px-1.5 text-[10px] font-semibold text-foreground-muted transition-colors hover:bg-accent hover:text-foreground tabular-nums focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
          >
            {playbackSpeed}x
          </motion.button>
          <span className="text-[10px] text-foreground-subtle tabular-nums">
            {stepIdx + 1}/{totalSteps}
          </span>
        </>
      )}
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
});

export { DSControls };
