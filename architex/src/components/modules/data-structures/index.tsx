"use client";

import React, { memo, useState, useCallback, useRef, useEffect, lazy, Suspense } from "react";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useNotificationStore } from "@/stores/notification-store";
import type { DSStep } from "@/lib/data-structures";
import { playTone, playSuccess, inferToneType, extractValueFromTargetId } from "./sonification";
import {
  DS_CATALOG,
  arrayInsert,
  arrayDelete,
  arraySearch,
  stackPush,
  stackPop,
  stackPeek,
  queueEnqueue,
  queueDequeue,
  llInsertHead,
  llInsertTail,
  llDelete,
  llSearch,
  hashInsert,
  hashSearch,
  hashDelete,
  dsBstInsert,
  dsBstSearch,
  dsBstDelete,
  buildBST,
  bloomInsert,
  bloomCheck,
  skipListInsert,
  skipListSearch,
  skipListDelete,
  createSkipList,
  heapInsert,
  heapExtract,
  heapBuild,
  heapSearch,
  trieInsert,
  trieSearch,
  trieDelete,
  dsuMakeSet,
  dsuFind,
  dsuUnion,
  createDisjointSet,
  createLSM,
  lsmInsert,
  lsmSearch,
  lsmFlush,
  lsmCompact,
  createCHRing,
  chAddNode,
  chRemoveNode,
  chLookup,
  chAddKeys,
  merkleTreeBuild,
  merkleTreeVerify,
  createCountMinSketch,
  cmsInsert,
  cmsQuery,
  createHyperLogLog,
  hllAdd,
  hllCount,
  createDeque,
  dequePushFront,
  dequePushBack,
  dequePopFront,
  dequePopBack,
  createCircularBuffer,
  cbEnqueue,
  cbDequeue,
  cbPeek,
  createWAL,
  walAppend,
  walRead,
  walTruncate,
  walCheckpoint,
  walCrash,
  walRecover,
  createRope,
  ropeCharAt,
  ropeConcat,
  createRTree,
  rtreeInsert,
  rtreeSearch,
  createQuadtree,
  qtInsert,
  qtSearch,
  createFibHeap,
  fibInsert,
  fibExtractMin,
  fibDecreaseKey,
  fibSearch,
  dsAvlInsert,
  dsAvlSearch,
  dsAvlDelete,
  buildAVL,
  dsRbInsert,
  dsRbSearch,
  dsRbDelete,
  buildRBTree,
  createHashTable,
  createBloomFilter,
  createTrie,
  createSegmentTree,
  segmentTreeQuery,
  segmentTreeUpdate,
  createBPlusTree,
  bplusInsert,
  bplusSearch,
  bplusDelete,
  createFenwickTree,
  fenwickUpdate,
  fenwickPrefixSum,
  createSplayTree,
  splayInsert,
  splaySearch,
  splayDelete,
  gCounterCreate,
  gCounterIncrement,
  gCounterMerge,
  pnCounterCreate,
  pnCounterIncrement,
  pnCounterDecrement,
  pnCounterMerge,
  pnCounterValue,
  lwwRegisterCreate,
  lwwRegisterSet,
  lwwRegisterMerge,
  lwwRegisterGet,
  orSetCreate,
  orSetAdd,
  orSetRemove,
  orSetElements,
  createVectorClockSystem,
  vectorClockLocalEvent,
  vectorClockSend,
  vectorClockReceive,
  createTreap,
  treapInsert,
  treapSearch,
  treapDelete,
  createBinomialHeap,
  binomialInsert,
  binomialExtractMin,
  binomialDecreaseKey,
  binomialSearch,
  createBTree,
  btreeInsert,
  btreeSearch,
  btreeDelete,
  createDLL,
  dllInsertHead,
  dllInsertTail,
  dllDelete,
  dllSearch,
  dllReverse,
  createPQ,
  pqEnqueue,
  pqDequeue,
  pqPeek,
  pqSearch,
  createLRUCache,
  lruGet,
  lruPut,
  lruDelete,
  lruPeek,
  createCuckooHash,
  cuckooInsert,
  cuckooSearch,
  cuckooDelete,
  createMonotonic,
  monotonicPush,
  monotonicPop,
  monotonicPeek,
} from "@/lib/data-structures";
import type {
  LLNode,
  HashTableState,
  BSTNode,
  BloomFilterState,
  SkipListState,
  HeapState,
  TrieState,
  DisjointSetState,
  LSMState,
  CHState,
  MerkleState,
  CountMinSketchState,
  HyperLogLogState,
  DequeState,
  CircularBufferState,
  WALState,
  RopeState,
  RTreeState,
  QuadtreeState,
  FibHeapState,
  AVLNode,
  RBNode,
  SegmentTreeState,
  BPlusTreeState,
  FenwickTreeState,
  SplayTreeState,
  GCounterState,
  PNCounterState,
  LWWRegisterState,
  ORSetState,
  VectorClockState,
  TreapState,
  BinomialHeapState,
  BTreeState,
  DLLState,
  PriorityQueueState,
  LRUCacheState,
  CuckooHashState,
  MonotonicState,
} from "@/lib/data-structures";
import type { ActiveDS, DSModuleState } from "./types";
import { getInitialState } from "./initial-state";
import { markFeatureExplored } from "@/lib/progress/module-progress";
import { DSSidebar } from "./DSSidebar";
// DSCanvas is lazy-loaded so its 8 visualizer file imports don't
// block the initial render of sidebar/controls.
const DSCanvas = lazy(() =>
  import("./DSCanvas").then((m) => ({ default: m.DSCanvas }))
);
import { DSControls } from "./DSControls";
import { DSProperties } from "./DSProperties";
import { DSBottomPanel } from "./DSBottomPanel";
import {
  PredictionOverlay,
  PredictionFeedback,
  parsePredictionFromStep,
  type PredictionQuestion,
} from "./PredictionOverlay";
import {
  ManualTraceOverlay,
  ManualTraceComplete,
  isDirectionalStep,
  getCorrectDirection,
} from "./ManualTrace";

const SPEED_OPTIONS = [0.5, 1, 2, 4] as const;

export function useDataStructuresModule() {
  const [state, setState] = useState<DSModuleState>(getInitialState);

  // ── DST-096: Undo history stack (last 20 states) ─────────
  const [history, setHistory] = useState<DSModuleState[]>([]);

  // ── DST-149: Prediction mode state ────────────────────────
  const [predictionMode, setPredictionMode] = useState(false);
  const [pendingPrediction, setPendingPrediction] = useState<PredictionQuestion | null>(null);
  const [predictionFeedback, setPredictionFeedback] = useState<"correct" | "wrong" | null>(null);

  const togglePrediction = useCallback(() => {
    setPredictionMode((prev) => !prev);
    setPendingPrediction(null);
    setPredictionFeedback(null);
  }, []);

  // ── DST-150: Manual trace mode state ──────────────────────
  const [manualTraceActive, setManualTraceActive] = useState(false);
  const [traceStepIdx, setTraceStepIdx] = useState(0);
  const [traceScore, setTraceScore] = useState({ correct: 0, total: 0 });
  const [traceFeedback, setTraceFeedback] = useState<"correct" | "wrong" | null>(null);
  const [traceExplanation, setTraceExplanation] = useState<string | null>(null);
  const [traceComplete, setTraceComplete] = useState(false);

  // Compute which step indices in current steps are directional (for trace mode)
  const directionalStepIndices = React.useMemo(() => {
    if (!manualTraceActive) return [];
    return state.steps
      .map((s, i) => (isDirectionalStep(s.description) ? i : -1))
      .filter((i) => i >= 0);
  }, [manualTraceActive, state.steps]);

  const toggleManualTrace = useCallback(() => {
    setManualTraceActive((prev) => {
      if (!prev) {
        // Entering trace mode — reset score and go to step 0
        setTraceStepIdx(0);
        setTraceScore({ correct: 0, total: 0 });
        setTraceFeedback(null);
        setTraceExplanation(null);
        setTraceComplete(false);
      }
      return !prev;
    });
  }, []);

  // ── DST-099: Track explored DS per session (fire markFeatureExplored once per DS) ──
  const exploredRef = useRef<Set<string>>(new Set());
  const activeDSRef = useRef(state.activeDS);
  activeDSRef.current = state.activeDS;

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const prevState = history[history.length - 1];
    setState(prevState);
    setHistory(h => h.slice(0, -1));
  }, [history]);

  // ── DST-096: Ctrl+Z / Cmd+Z keyboard shortcut ───────────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleUndo]);

  // ── DST-101: Sonification toggle (persisted in localStorage) ──
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window === "undefined") return false;
    try { return localStorage.getItem("architex-ds-sound") === "true"; } catch { return false; }
  });
  const soundRef = useRef(soundEnabled);
  soundRef.current = soundEnabled;

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      try { localStorage.setItem("architex-ds-sound", String(next)); } catch {}
      return next;
    });
  }, []);

  // ── DST-101: Sonification helper — play tone for the current step ──
  const playSonificationForStep = useCallback((step: DSStep) => {
    if (!soundRef.current) return;
    if (step.mutations.length === 0) return;
    const m = step.mutations[0];
    const type = inferToneType(m.property, m.to);
    const value = extractValueFromTargetId(m.targetId);
    playTone(value, type);
    // Play success chord on last step with "found"/"success" highlight
    if (type === "found") {
      playSuccess();
    }
  }, []);

  // ── DST-175: SRS review prompt on module load ─────────────
  const [srsReviewDue, setSrsReviewDue] = useState(false);
  useEffect(() => {
    const dueKey = 'architex-ds-srs-due';
    const cardsKey = 'architex-ds-srs-cards';
    const lastReview = localStorage.getItem(dueKey);
    const cardsRaw = localStorage.getItem(cardsKey);
    const cards: string[] = cardsRaw ? JSON.parse(cardsRaw) : [];
    const now = Date.now();
    // Show review prompt if cards exist and >24h since last review
    if (cards.length > 0 && (!lastReview || now - parseInt(lastReview, 10) > 86400000)) {
      setSrsReviewDue(true);
    }
  }, []);

  const dismissSrsReview = useCallback(() => {
    localStorage.setItem('architex-ds-srs-due', String(Date.now()));
    setSrsReviewDue(false);
  }, []);

  // ── DST-071: Auto-play state ──────────────────────────────
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const playIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── DST-114: Speed-aware auto-play — slow down for interesting steps ──
  useEffect(() => {
    if (!isPlaying) {
      if (playIntervalRef.current) clearTimeout(playIntervalRef.current);
      playIntervalRef.current = null;
      return;
    }

    function getStepDelay(step: DSStep, baseDelay: number): number {
      const desc = step.description.toLowerCase();
      // Interesting steps get 2x delay for better comprehension
      if (desc.includes('rotation') || desc.includes('rebalance') || desc.includes('collision') ||
          desc.includes('evict') || desc.includes('split') || desc.includes('merge') ||
          desc.includes('flush') || desc.includes('compact') || desc.includes('bubble')) {
        return baseDelay * 2;
      }
      return baseDelay;
    }

    function scheduleNext() {
      setState((prev) => {
        if (prev.currentStepIdx >= prev.steps.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        const nextIdx = prev.currentStepIdx + 1;
        const nextStep = prev.steps[nextIdx];
        // DST-101: Sonification during auto-play
        if (nextStep) playSonificationForStep(nextStep);

        // Schedule the following step with context-aware delay
        const baseDelay = 500 / playbackSpeed;
        const followingStep = prev.steps[nextIdx + 1];
        const delay = followingStep ? getStepDelay(followingStep, baseDelay) : baseDelay;
        playIntervalRef.current = setTimeout(scheduleNext, delay);

        return { ...prev, currentStepIdx: nextIdx };
      });
    }

    // Kick off the first step with base delay
    const baseDelay = 500 / playbackSpeed;
    playIntervalRef.current = setTimeout(scheduleNext, baseDelay);

    return () => {
      if (playIntervalRef.current) clearTimeout(playIntervalRef.current);
    };
  }, [isPlaying, playbackSpeed, playSonificationForStep]);

  const handleStepBack = useCallback(() => {
    setIsPlaying(false);
    setState((prev) => {
      if (prev.currentStepIdx <= 0) return prev;
      return { ...prev, currentStepIdx: prev.currentStepIdx - 1 };
    });
  }, []);

  const handlePlayToggle = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const handleSpeedChange = useCallback(() => {
    setPlaybackSpeed((prev) => {
      const idx = SPEED_OPTIONS.indexOf(prev as typeof SPEED_OPTIONS[number]);
      return SPEED_OPTIONS[(idx + 1) % SPEED_OPTIONS.length];
    });
  }, []);

  // ── DST-122: Mobile sidebar collapse state ────────────────
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleSelectDS = useCallback((id: ActiveDS) => {
    setIsPlaying(false);
    setMobileSidebarOpen(false); // Auto-collapse on mobile after selection
    // DST-149/150: Reset prediction and trace modes when switching DS
    setPendingPrediction(null);
    setPredictionFeedback(null);
    setManualTraceActive(false);
    setTraceComplete(false);
    setState((prev) => ({
      ...prev,
      activeDS: id,
      steps: [],
      currentStepIdx: -1,
    }));
    // DST-066: Update URL hash for shareable deep-links
    window.history.replaceState(null, '', `#${id}`);
  }, []);

  // DST-066: Restore active DS from URL hash on module load
  useEffect(() => {
    const hash = window.location.hash.slice(1); // remove #
    if (hash && DS_CATALOG.some(d => d.id === hash)) {
      handleSelectDS(hash as ActiveDS);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyResult = useCallback((result: { steps: DSStep[]; snapshot: unknown }, logMsg: string, updater: (prev: DSModuleState, snapshot: unknown) => Partial<DSModuleState>) => {
    setState((prev) => ({
      ...prev,
      ...updater(prev, result.snapshot),
      steps: result.steps,
      currentStepIdx: 0,
      log: [...prev.log.slice(-99), logMsg],
    }));
  }, []);

  const handleOperation = useCallback(
    (op: string, value?: number | string, extra?: number | string) => {
      setState((prev) => {
        const numVal = typeof value === "string" ? parseFloat(value) : (value ?? 0);
        const numExtra = typeof extra === "string" ? parseFloat(extra) : (extra ?? 0);
        const strVal = String(value ?? "");

        let result: { steps: DSStep[]; snapshot: unknown } | null = null;
        let logMsg = "";
        let updates: Partial<DSModuleState> = {};

        switch (prev.activeDS) {
          case "array": {
            if (op === "insert") {
              result = arrayInsert(prev.arrayData, isNaN(numExtra) ? prev.arrayData.length : numExtra, isNaN(numVal) ? 0 : numVal);
              logMsg = `Insert ${numVal} at index ${isNaN(numExtra) ? prev.arrayData.length : numExtra}`;
              updates = { arrayData: result.snapshot as number[] };
            } else if (op === "delete") {
              result = arrayDelete(prev.arrayData, isNaN(numVal) ? 0 : numVal);
              logMsg = `Delete at index ${numVal}`;
              updates = { arrayData: result.snapshot as number[] };
            } else if (op === "search") {
              result = arraySearch(prev.arrayData, isNaN(numVal) ? 0 : numVal);
              logMsg = `Search for ${numVal}`;
            }
            break;
          }
          case "stack": {
            if (op === "push") {
              result = stackPush(prev.stackData, isNaN(numVal) ? 0 : numVal);
              logMsg = `Push ${numVal}`;
              updates = { stackData: result.snapshot as number[] };
            } else if (op === "pop") {
              result = stackPop(prev.stackData);
              logMsg = "Pop";
              updates = { stackData: result.snapshot as number[] };
            } else if (op === "peek") {
              result = stackPeek(prev.stackData);
              logMsg = "Peek";
            }
            break;
          }
          case "queue": {
            if (op === "enqueue") {
              result = queueEnqueue(prev.queueData, isNaN(numVal) ? 0 : numVal);
              logMsg = `Enqueue ${numVal}`;
              updates = { queueData: result.snapshot as number[] };
            } else if (op === "dequeue") {
              result = queueDequeue(prev.queueData);
              logMsg = "Dequeue";
              updates = { queueData: result.snapshot as number[] };
            } else if (op === "peek") {
              if (prev.queueData.length > 0) {
                const steps: DSStep[] = [{ id: 0, description: `Front element: ${prev.queueData[0]}`, mutations: [{ targetId: "queue-0", property: "highlight", from: "default", to: "found" }] }];
                result = { steps, snapshot: prev.queueData };
              } else {
                result = { steps: [{ id: 0, description: "Queue is empty", mutations: [] }], snapshot: prev.queueData };
              }
              logMsg = "Peek";
            }
            break;
          }
          case "linked-list": {
            if (op === "insert") {
              result = llInsertHead(prev.llNodes, prev.llHeadId, isNaN(numVal) ? 0 : numVal);
              logMsg = `Insert ${numVal} at head`;
              const snap = result.snapshot as { nodes: LLNode[]; headId: string | null };
              updates = { llNodes: snap.nodes, llHeadId: snap.headId };
            } else if (op === "insertTail") {
              result = llInsertTail(prev.llNodes, prev.llHeadId, isNaN(numVal) ? 0 : numVal);
              logMsg = `Insert ${numVal} at tail`;
              const snap = result.snapshot as { nodes: LLNode[]; headId: string | null };
              updates = { llNodes: snap.nodes, llHeadId: snap.headId };
            } else if (op === "delete") {
              result = llDelete(prev.llNodes, prev.llHeadId, isNaN(numVal) ? 0 : numVal);
              logMsg = `Delete ${numVal}`;
              const snap = result.snapshot as { nodes: LLNode[]; headId: string | null };
              updates = { llNodes: snap.nodes, llHeadId: snap.headId };
            } else if (op === "search") {
              result = llSearch(prev.llNodes, prev.llHeadId, isNaN(numVal) ? 0 : numVal);
              logMsg = `Search for ${numVal}`;
            }
            break;
          }
          case "hash-table": {
            if (op === "insert") {
              const key = strVal || `k${prev.hashTable.size}`;
              const val = isNaN(numExtra) ? Math.floor(Math.random() * 100) : numExtra;
              result = hashInsert(prev.hashTable, key, val);
              logMsg = `Insert ("${key}", ${val})`;
              updates = { hashTable: result.snapshot as HashTableState };
            } else if (op === "delete") {
              result = hashDelete(prev.hashTable, strVal);
              logMsg = `Delete key "${strVal}"`;
              updates = { hashTable: result.snapshot as HashTableState };
            } else if (op === "search") {
              result = hashSearch(prev.hashTable, strVal);
              logMsg = `Search key "${strVal}"`;
            }
            break;
          }
          case "bst": {
            if (op === "insert") {
              result = dsBstInsert(prev.bstRoot, isNaN(numVal) ? 0 : numVal);
              logMsg = `Insert ${numVal}`;
              updates = { bstRoot: result.snapshot as BSTNode | null };
            } else if (op === "delete") {
              result = dsBstDelete(prev.bstRoot, isNaN(numVal) ? 0 : numVal);
              logMsg = `Delete ${numVal}`;
              updates = { bstRoot: result.snapshot as BSTNode | null };
            } else if (op === "search") {
              result = dsBstSearch(prev.bstRoot, isNaN(numVal) ? 0 : numVal);
              logMsg = `Search ${numVal}`;
            }
            break;
          }
          case "bloom-filter": {
            if (op === "insert") {
              const elem = strVal || `item${prev.bloomFilter.n}`;
              result = bloomInsert(prev.bloomFilter, elem);
              logMsg = `Insert "${elem}"`;
              updates = { bloomFilter: result.snapshot as BloomFilterState };
            } else if (op === "search") {
              const elem = strVal || "test";
              result = bloomCheck(prev.bloomFilter, elem);
              logMsg = `Check "${elem}"`;
            }
            break;
          }
          case "skip-list": {
            if (op === "insert") {
              result = skipListInsert(prev.skipList, isNaN(numVal) ? 0 : numVal);
              logMsg = `Insert ${numVal}`;
              updates = { skipList: result.snapshot as SkipListState };
            } else if (op === "delete") {
              result = skipListDelete(prev.skipList, isNaN(numVal) ? 0 : numVal);
              logMsg = `Delete ${numVal}`;
              updates = { skipList: result.snapshot as SkipListState };
            } else if (op === "search") {
              result = skipListSearch(prev.skipList, isNaN(numVal) ? 0 : numVal);
              logMsg = `Search ${numVal}`;
            }
            break;
          }
          case "heap": {
            if (op === "insert") {
              result = heapInsert(prev.heap, isNaN(numVal) ? 0 : numVal);
              logMsg = `Insert ${numVal}`;
              updates = { heap: result.snapshot as HeapState };
            } else if (op === "delete") {
              result = heapExtract(prev.heap);
              logMsg = `Extract ${prev.heap.type}`;
              updates = { heap: result.snapshot as HeapState };
            } else if (op === "search") {
              result = heapSearch(prev.heap, isNaN(numVal) ? 0 : numVal);
              logMsg = `Search ${numVal}`;
            } else if (op === "build") {
              const vals = [...prev.heap.data, isNaN(numVal) ? 0 : numVal];
              result = heapBuild(vals, prev.heap.type);
              logMsg = `Build heap from [${vals.join(", ")}]`;
              updates = { heap: result.snapshot as HeapState };
            }
            break;
          }
          case "trie": {
            if (op === "insert") {
              const word = strVal || "hello";
              result = trieInsert(prev.trie, word);
              logMsg = `Insert "${word}"`;
              updates = { trie: result.snapshot as TrieState };
            } else if (op === "delete") {
              const word = strVal || "";
              result = trieDelete(prev.trie, word);
              logMsg = `Delete "${word}"`;
              updates = { trie: result.snapshot as TrieState };
            } else if (op === "search") {
              const word = strVal || "";
              result = trieSearch(prev.trie, word);
              logMsg = `Search "${word}"`;
            }
            break;
          }
          case "union-find": {
            if (op === "insert") {
              if (!isNaN(numVal) && !isNaN(numExtra) && numExtra !== 0) {
                // Union operation when both values provided
                result = dsuUnion(prev.disjointSet, numVal, numExtra);
                logMsg = `Union(${numVal}, ${numExtra})`;
                updates = { disjointSet: result.snapshot as DisjointSetState };
              } else {
                // MakeSet for single value
                result = dsuMakeSet(prev.disjointSet, isNaN(numVal) ? 0 : numVal);
                logMsg = `MakeSet(${numVal})`;
                updates = { disjointSet: result.snapshot as DisjointSetState };
              }
            } else if (op === "search") {
              result = dsuFind(prev.disjointSet, isNaN(numVal) ? 0 : numVal);
              logMsg = `Find(${numVal})`;
              updates = { disjointSet: result.snapshot as DisjointSetState };
            }
            break;
          }
          case "lsm-tree": {
            const strExtra = String(extra ?? "");
            if (op === "insert") {
              const key = strVal || `k${prev.lsmTree.writeCount}`;
              const val = strExtra || `v${prev.lsmTree.writeCount}`;
              result = lsmInsert(prev.lsmTree, key, val);
              logMsg = `Insert ("${key}", "${val}")`;
              updates = { lsmTree: result.snapshot as LSMState };
            } else if (op === "search") {
              const key = strVal || "k0";
              result = lsmSearch(prev.lsmTree, key);
              logMsg = `Search "${key}"`;
            } else if (op === "flush") {
              result = lsmFlush(prev.lsmTree);
              logMsg = `Flush memtable to L0`;
              updates = { lsmTree: result.snapshot as LSMState };
            } else if (op === "compact") {
              const level = isNaN(numVal) ? 0 : numVal;
              result = lsmCompact(prev.lsmTree, level);
              logMsg = `Compact L${level} → L${level + 1}`;
              updates = { lsmTree: result.snapshot as LSMState };
            }
            break;
          }
          case "consistent-hash": {
            if (op === "insert") {
              const nodeId = strVal || `N${prev.chRing.nodes.length + 1}`;
              result = chAddNode(prev.chRing, nodeId);
              logMsg = `Add node "${nodeId}"`;
              updates = { chRing: result.snapshot as CHState };
            } else if (op === "delete") {
              const nodeId = strVal || "";
              result = chRemoveNode(prev.chRing, nodeId);
              logMsg = `Remove node "${nodeId}"`;
              updates = { chRing: result.snapshot as CHState };
            } else if (op === "search") {
              const key = strVal || "test-key";
              if (key.match(/^\d+$/)) {
                // If numeric, treat as bulk add count
                const count = parseInt(key, 10);
                result = chAddKeys(prev.chRing, count);
                logMsg = `Add ${count} keys`;
                updates = { chRing: result.snapshot as CHState };
              } else {
                result = chLookup(prev.chRing, key);
                logMsg = `Lookup "${key}"`;
              }
            }
            break;
          }
          case "merkle-tree": {
            if (op === "insert") {
              // Build tree from comma-separated data
              const dataStr = strVal || "A,B,C,D";
              const data = dataStr.split(",").map((s) => s.trim()).filter(Boolean);
              result = merkleTreeBuild(data);
              logMsg = `Build tree from [${data.join(", ")}]`;
              updates = { merkleTree: result.snapshot as MerkleState };
            } else if (op === "search") {
              // Verify a leaf by index
              const idx = isNaN(numVal) ? 0 : numVal;
              result = merkleTreeVerify(prev.merkleTree, idx);
              logMsg = `Verify leaf ${idx}`;
            }
            break;
          }
          case "count-min-sketch": {
            if (op === "insert") {
              const elem = strVal || `item${prev.countMinSketch.n}`;
              result = cmsInsert(prev.countMinSketch, elem);
              logMsg = `Insert "${elem}"`;
              updates = { countMinSketch: result.snapshot as CountMinSketchState };
            } else if (op === "search") {
              const elem = strVal || "test";
              result = cmsQuery(prev.countMinSketch, elem);
              logMsg = `Query "${elem}"`;
            }
            break;
          }
          case "hyperloglog": {
            if (op === "insert") {
              const elem = strVal || `elem${prev.hyperLogLog.n}`;
              result = hllAdd(prev.hyperLogLog, elem);
              logMsg = `Add "${elem}"`;
              updates = { hyperLogLog: result.snapshot as HyperLogLogState };
            } else if (op === "search") {
              result = hllCount(prev.hyperLogLog);
              logMsg = `Estimate cardinality`;
            }
            break;
          }
          case "deque": {
            if (op === "pushFront") {
              result = dequePushFront(prev.deque, isNaN(numVal) ? 0 : numVal);
              logMsg = `pushFront(${numVal})`;
              updates = { deque: result.snapshot as DequeState };
            } else if (op === "pushBack") {
              result = dequePushBack(prev.deque, isNaN(numVal) ? 0 : numVal);
              logMsg = `pushBack(${numVal})`;
              updates = { deque: result.snapshot as DequeState };
            } else if (op === "popFront") {
              result = dequePopFront(prev.deque);
              logMsg = `popFront()`;
              updates = { deque: result.snapshot as DequeState };
            } else if (op === "popBack") {
              result = dequePopBack(prev.deque);
              logMsg = `popBack()`;
              updates = { deque: result.snapshot as DequeState };
            }
            break;
          }
          case "circular-buffer": {
            if (op === "enqueue") {
              result = cbEnqueue(prev.circularBuffer, isNaN(numVal) ? 0 : numVal);
              logMsg = `enqueue(${numVal})`;
              updates = { circularBuffer: result.snapshot as CircularBufferState };
            } else if (op === "dequeue") {
              result = cbDequeue(prev.circularBuffer);
              logMsg = `dequeue()`;
              updates = { circularBuffer: result.snapshot as CircularBufferState };
            } else if (op === "peek") {
              result = cbPeek(prev.circularBuffer);
              logMsg = `peek()`;
            }
            break;
          }
          case "wal": {
            if (op === "insert") {
              const entry = strVal || `entry-${prev.wal.nextLSN}`;
              result = walAppend(prev.wal, entry);
              logMsg = `append("${entry}")`;
              updates = { wal: result.snapshot as WALState };
            } else if (op === "search") {
              const lsn = isNaN(numVal) ? 1 : numVal;
              result = walRead(prev.wal, lsn);
              logMsg = `read(LSN=${lsn})`;
            } else if (op === "checkpoint") {
              result = walCheckpoint(prev.wal);
              logMsg = `checkpoint()`;
              updates = { wal: result.snapshot as WALState };
            } else if (op === "crash") {
              result = walCrash(prev.wal);
              logMsg = `crash()`;
              updates = { wal: result.snapshot as WALState };
            } else if (op === "recover") {
              result = walRecover(prev.wal);
              logMsg = `recover()`;
              updates = { wal: result.snapshot as WALState };
            } else if (op === "truncate") {
              const lsn = isNaN(numVal) ? 1 : numVal;
              result = walTruncate(prev.wal, lsn);
              logMsg = `truncate(upToLSN=${lsn})`;
              updates = { wal: result.snapshot as WALState };
            }
            break;
          }
          case "rope": {
            if (op === "insert") {
              const text = strVal || "abc";
              result = ropeConcat(prev.rope, text);
              logMsg = `concat("${text}")`;
              updates = { rope: result.snapshot as RopeState };
            } else if (op === "search") {
              const idx = isNaN(numVal) ? 0 : numVal;
              result = ropeCharAt(prev.rope, idx);
              logMsg = `charAt(${idx})`;
            }
            break;
          }
          case "r-tree": {
            // Parse "x,y" from strVal
            const parts = strVal.split(",").map((s) => parseFloat(s.trim()));
            const px = !isNaN(parts[0]) ? parts[0] : Math.floor(Math.random() * 100);
            const py = !isNaN(parts[1]) ? parts[1] : Math.floor(Math.random() * 100);
            if (op === "insert") {
              result = rtreeInsert(prev.rTree, px, py);
              logMsg = `Insert (${px}, ${py})`;
              updates = { rTree: result.snapshot as RTreeState };
            } else if (op === "search") {
              const halfW = !isNaN(parts[1]) ? Math.abs(parts[1]) : 20;
              result = rtreeSearch(prev.rTree, { minX: px - halfW, minY: py - halfW, maxX: px + halfW, maxY: py + halfW });
              logMsg = `Search range around (${px}, ${py}) +/- ${halfW}`;
            }
            break;
          }
          case "quadtree": {
            const parts = strVal.split(",").map((s) => parseFloat(s.trim()));
            const px = !isNaN(parts[0]) ? parts[0] : Math.floor(Math.random() * 100);
            const py = !isNaN(parts[1]) ? parts[1] : Math.floor(Math.random() * 100);
            if (op === "insert") {
              result = qtInsert(prev.quadtree, px, py);
              logMsg = `Insert (${px}, ${py})`;
              updates = { quadtree: result.snapshot as QuadtreeState };
            } else if (op === "search") {
              const hw = !isNaN(parts[1]) ? Math.abs(parts[1]) : 20;
              result = qtSearch(prev.quadtree, { x: px, y: py, hw, hh: hw });
              logMsg = `Range query center (${px}, ${py}) hw=${hw}`;
            }
            break;
          }
          case "fibonacci-heap": {
            if (op === "insert") {
              result = fibInsert(prev.fibHeap, isNaN(numVal) ? 0 : numVal);
              logMsg = `Insert ${numVal}`;
              updates = { fibHeap: result.snapshot as FibHeapState };
            } else if (op === "delete") {
              result = fibExtractMin(prev.fibHeap);
              logMsg = `Extract min`;
              updates = { fibHeap: result.snapshot as FibHeapState };
            } else if (op === "search") {
              result = fibSearch(prev.fibHeap, isNaN(numVal) ? 0 : numVal);
              logMsg = `Search for ${numVal}`;
            } else if (op === "decrease-key") {
              // Decrease key: find node by current key value, decrease to extra
              if (prev.fibHeap.size > 0) {
                const targetKey = isNaN(numVal) ? 0 : numVal;
                const newKey = isNaN(numExtra) ? Math.max(0, targetKey - 5) : numExtra;
                // Find a node with the specified key
                let targetId: string | null = null;
                for (const [id, node] of prev.fibHeap.nodes) {
                  if (node.key === targetKey) { targetId = id; break; }
                }
                if (targetId) {
                  result = fibDecreaseKey(prev.fibHeap, targetId, newKey);
                  logMsg = `Decrease key: ${targetKey} -> ${newKey}`;
                  updates = { fibHeap: result.snapshot as FibHeapState };
                } else {
                  result = { steps: [{ id: 0, description: `Node with key ${targetKey} not found`, mutations: [] }], snapshot: prev.fibHeap };
                  logMsg = `Decrease key: node with key ${targetKey} not found`;
                }
              }
            }
            break;
          }
          case "avl-tree": {
            if (op === "insert") {
              result = dsAvlInsert(prev.avlRoot, isNaN(numVal) ? 0 : numVal);
              logMsg = `Insert ${numVal}`;
              updates = { avlRoot: result.snapshot as AVLNode | null };
            } else if (op === "delete") {
              result = dsAvlDelete(prev.avlRoot, isNaN(numVal) ? 0 : numVal);
              logMsg = `Delete ${numVal}`;
              updates = { avlRoot: result.snapshot as AVLNode | null };
            } else if (op === "search") {
              result = dsAvlSearch(prev.avlRoot, isNaN(numVal) ? 0 : numVal);
              logMsg = `Search ${numVal}`;
            }
            break;
          }
          case "red-black-tree": {
            if (op === "insert") {
              result = dsRbInsert(prev.rbRoot, isNaN(numVal) ? 0 : numVal);
              logMsg = `Insert ${numVal}`;
              updates = { rbRoot: result.snapshot as RBNode | null };
            } else if (op === "delete") {
              result = dsRbDelete(prev.rbRoot, isNaN(numVal) ? 0 : numVal);
              logMsg = `Delete ${numVal}`;
              updates = { rbRoot: result.snapshot as RBNode | null };
            } else if (op === "search") {
              result = dsRbSearch(prev.rbRoot, isNaN(numVal) ? 0 : numVal);
              logMsg = `Search ${numVal}`;
            }
            break;
          }
          case "segment-tree": {
            if (op === "insert") {
              // Point update: value = index, extra = delta
              const idx = isNaN(numVal) ? 0 : numVal;
              const delta = isNaN(numExtra) ? 1 : numExtra;
              result = segmentTreeUpdate(prev.segmentTree, idx, delta);
              logMsg = `Update index ${idx} by +${delta}`;
              updates = { segmentTree: result.snapshot as SegmentTreeState };
            } else if (op === "search") {
              // Range query: value = left, extra = right
              const l = isNaN(numVal) ? 0 : numVal;
              const r = isNaN(numExtra) ? prev.segmentTree.n - 1 : numExtra;
              result = segmentTreeQuery(prev.segmentTree, l, r);
              logMsg = `Query sum [${l}, ${r}]`;
            }
            break;
          }
          case "bplus-tree": {
            if (op === "insert") {
              result = bplusInsert(prev.bplusTree, isNaN(numVal) ? 0 : numVal);
              logMsg = `Insert ${numVal}`;
              updates = { bplusTree: result.snapshot as BPlusTreeState };
            } else if (op === "delete") {
              result = bplusDelete(prev.bplusTree, isNaN(numVal) ? 0 : numVal);
              logMsg = `Delete ${numVal}`;
              updates = { bplusTree: result.snapshot as BPlusTreeState };
            } else if (op === "search") {
              result = bplusSearch(prev.bplusTree, isNaN(numVal) ? 0 : numVal);
              logMsg = `Search ${numVal}`;
            }
            break;
          }
          case "fenwick-tree": {
            if (op === "insert") {
              // Point update
              const idx = isNaN(numVal) ? 0 : numVal;
              const delta = isNaN(numExtra) ? 1 : numExtra;
              result = fenwickUpdate(prev.fenwickTree, idx, delta);
              logMsg = `Update index ${idx} by +${delta}`;
              updates = { fenwickTree: result.snapshot as FenwickTreeState };
            } else if (op === "search") {
              // Prefix sum query
              const idx = isNaN(numVal) ? prev.fenwickTree.n - 1 : numVal;
              result = fenwickPrefixSum(prev.fenwickTree, idx);
              logMsg = `Prefix sum [0, ${idx}]`;
            }
            break;
          }
          case "splay-tree": {
            if (op === "insert") {
              result = splayInsert(prev.splayTree, isNaN(numVal) ? 0 : numVal);
              logMsg = `Insert ${numVal}`;
              updates = { splayTree: result.snapshot as SplayTreeState };
            } else if (op === "delete") {
              result = splayDelete(prev.splayTree, isNaN(numVal) ? 0 : numVal);
              logMsg = `Delete ${numVal}`;
              updates = { splayTree: result.snapshot as SplayTreeState };
            } else if (op === "search") {
              result = splaySearch(prev.splayTree, isNaN(numVal) ? 0 : numVal);
              logMsg = `Search ${numVal} (splayed to root)`;
              updates = { splayTree: result.snapshot as SplayTreeState };
            }
            break;
          }
          case "crdt": {
            switch (prev.crdtType) {
              case 'g-counter': {
                if (op === "insert") {
                  const nodeId = strVal || "A";
                  result = gCounterIncrement(prev.crdtCounter, nodeId);
                  logMsg = `G-Counter increment on node "${nodeId}"`;
                  updates = { crdtCounter: result.snapshot as GCounterState };
                } else if (op === "delete") {
                  const nodeId = strVal || "B";
                  const other: GCounterState = { type: "g-counter", counts: { ...prev.crdtCounter.counts } };
                  other.counts[nodeId] = (other.counts[nodeId] ?? 0) + (isNaN(numVal) ? 1 : numVal);
                  result = gCounterMerge(prev.crdtCounter, other);
                  logMsg = `G-Counter merge with replica (${nodeId}+${isNaN(numVal) ? 1 : numVal})`;
                  updates = { crdtCounter: result.snapshot as GCounterState };
                } else if (op === "search") {
                  const total = Object.values(prev.crdtCounter.counts).reduce((a, b) => a + b, 0);
                  result = { steps: [{ id: 0, description: `G-Counter value = ${total}`, mutations: [] }], snapshot: prev.crdtCounter };
                  logMsg = `G-Counter query value = ${total}`;
                }
                break;
              }
              case 'pn-counter': {
                if (op === "insert") {
                  const nodeId = strVal || "A";
                  result = pnCounterIncrement(prev.pnCounter, nodeId);
                  logMsg = `PN-Counter increment on node "${nodeId}"`;
                  updates = { pnCounter: result.snapshot as PNCounterState };
                } else if (op === "delete") {
                  const nodeId = strVal || "A";
                  result = pnCounterDecrement(prev.pnCounter, nodeId);
                  logMsg = `PN-Counter decrement on node "${nodeId}"`;
                  updates = { pnCounter: result.snapshot as PNCounterState };
                } else if (op === "search") {
                  const val = pnCounterValue(prev.pnCounter);
                  result = { steps: [{ id: 0, description: `PN-Counter value = ${val}`, mutations: [] }], snapshot: prev.pnCounter };
                  logMsg = `PN-Counter query value = ${val}`;
                } else if (op === "merge") {
                  const nodeId = strVal || "B";
                  const other = { ...prev.pnCounter, positive: { type: 'g-counter' as const, counts: { ...prev.pnCounter.positive.counts } }, negative: { type: 'g-counter' as const, counts: { ...prev.pnCounter.negative.counts } } };
                  other.positive.counts[nodeId] = (other.positive.counts[nodeId] ?? 0) + (isNaN(numVal) ? 1 : Math.abs(numVal));
                  result = pnCounterMerge(prev.pnCounter, other);
                  logMsg = `PN-Counter merge with replica (${nodeId}+${isNaN(numVal) ? 1 : numVal})`;
                  updates = { pnCounter: result.snapshot as PNCounterState };
                }
                break;
              }
              case 'lww-register': {
                if (op === "insert") {
                  const val = strVal || String(numVal);
                  const ts = Date.now();
                  result = lwwRegisterSet(prev.lwwRegister, val, ts);
                  logMsg = `LWW-Register set "${val}" (ts=${ts})`;
                  updates = { lwwRegister: result.snapshot as LWWRegisterState };
                } else if (op === "delete") {
                  const nodeId = strVal || "B";
                  const otherTs = isNaN(numVal) ? Date.now() + 1 : numVal;
                  const other: LWWRegisterState = { type: 'lww-register', value: nodeId, timestamp: otherTs };
                  result = lwwRegisterMerge(prev.lwwRegister, other);
                  logMsg = `LWW-Register merge (other="${nodeId}", ts=${otherTs})`;
                  updates = { lwwRegister: result.snapshot as LWWRegisterState };
                } else if (op === "search") {
                  const val = lwwRegisterGet(prev.lwwRegister);
                  result = { steps: [{ id: 0, description: `LWW-Register value = "${String(val)}" (ts=${prev.lwwRegister.timestamp})`, mutations: [] }], snapshot: prev.lwwRegister };
                  logMsg = `LWW-Register get = "${String(val)}"`;
                }
                break;
              }
              case 'or-set': {
                if (op === "insert") {
                  const element = strVal || String(isNaN(numVal) ? "x" : numVal);
                  const nodeId = String(extra ?? "A");
                  result = orSetAdd(prev.orSet, element, nodeId);
                  logMsg = `OR-Set add "${element}" (node=${nodeId})`;
                  updates = { orSet: result.snapshot as ORSetState };
                } else if (op === "delete") {
                  const element = strVal || String(isNaN(numVal) ? "x" : numVal);
                  result = orSetRemove(prev.orSet, element);
                  logMsg = `OR-Set remove "${element}"`;
                  updates = { orSet: result.snapshot as ORSetState };
                } else if (op === "search") {
                  const elems = orSetElements(prev.orSet);
                  result = { steps: [{ id: 0, description: `OR-Set elements: {${elems.join(', ')}} (${prev.orSet.entries.length} tagged entries)`, mutations: [] }], snapshot: prev.orSet };
                  logMsg = `OR-Set elements = {${elems.join(', ')}}`;
                }
                break;
              }
            }
            break;
          }
          case "vector-clock": {
            if (op === "insert") {
              // Local event on a node
              const nodeId = strVal || prev.vectorClock.nodeIds[0] || "A";
              result = vectorClockLocalEvent(prev.vectorClock, nodeId);
              logMsg = `Local event on node "${nodeId}"`;
              updates = { vectorClock: result.snapshot as VectorClockState };
            } else if (op === "search") {
              // Send: value = sender, extra = receiver
              const from = strVal || prev.vectorClock.nodeIds[0] || "A";
              const strExtra = String(extra ?? "");
              const to = strExtra || prev.vectorClock.nodeIds[1] || "B";
              const sendRes = vectorClockSend(prev.vectorClock, from, to);
              const afterSend = sendRes.snapshot as VectorClockState;
              // Auto-receive
              const lastMsg = afterSend.messages[afterSend.messages.length - 1];
              if (lastMsg) {
                result = vectorClockReceive(afterSend, lastMsg.to, lastMsg.clock);
                logMsg = `Send ${from} -> ${to} + receive`;
                updates = { vectorClock: result.snapshot as VectorClockState };
              } else {
                result = sendRes;
                logMsg = `Send ${from} -> ${to}`;
                updates = { vectorClock: afterSend };
              }
            }
            break;
          }
          case "treap": {
            if (op === "insert") {
              result = treapInsert(prev.treap, isNaN(numVal) ? 0 : numVal);
              logMsg = `Insert ${numVal}`;
              updates = { treap: result.snapshot as TreapState };
            } else if (op === "delete") {
              result = treapDelete(prev.treap, isNaN(numVal) ? 0 : numVal);
              logMsg = `Delete ${numVal}`;
              updates = { treap: result.snapshot as TreapState };
            } else if (op === "search") {
              result = treapSearch(prev.treap, isNaN(numVal) ? 0 : numVal);
              logMsg = `Search ${numVal}`;
            }
            break;
          }
          case "binomial-heap": {
            if (op === "insert") {
              result = binomialInsert(prev.binomialHeap, isNaN(numVal) ? 0 : numVal);
              logMsg = `Insert ${numVal}`;
              updates = { binomialHeap: result.snapshot as BinomialHeapState };
            } else if (op === "delete") {
              result = binomialExtractMin(prev.binomialHeap);
              logMsg = `Extract min`;
              updates = { binomialHeap: result.snapshot as BinomialHeapState };
            } else if (op === "search") {
              result = binomialSearch(prev.binomialHeap, isNaN(numVal) ? 0 : numVal);
              logMsg = `Search for ${numVal}`;
            } else if (op === "decrease-key") {
              // Decrease key: find node by current key value, decrease to extra
              if (prev.binomialHeap.size > 0) {
                const targetKey = isNaN(numVal) ? 0 : numVal;
                const newKey = isNaN(numExtra) ? Math.max(0, targetKey - 5) : numExtra;
                let targetId: string | null = null;
                for (const [id, node] of prev.binomialHeap.nodes) {
                  if (node.key === targetKey) { targetId = id; break; }
                }
                if (targetId) {
                  result = binomialDecreaseKey(prev.binomialHeap, targetId, newKey);
                  logMsg = `Decrease key: ${targetKey} -> ${newKey}`;
                  updates = { binomialHeap: result.snapshot as BinomialHeapState };
                } else {
                  result = { steps: [{ id: 0, description: `Node with key ${targetKey} not found`, mutations: [] }], snapshot: prev.binomialHeap };
                  logMsg = `Decrease key: node with key ${targetKey} not found`;
                }
              }
            }
            break;
          }
          case "b-tree": {
            if (op === "insert") {
              result = btreeInsert(prev.bTree, isNaN(numVal) ? 0 : numVal);
              logMsg = `Insert ${numVal}`;
              updates = { bTree: result.snapshot as BTreeState };
            } else if (op === "delete") {
              result = btreeDelete(prev.bTree, isNaN(numVal) ? 0 : numVal);
              logMsg = `Delete ${numVal}`;
              updates = { bTree: result.snapshot as BTreeState };
            } else if (op === "search") {
              result = btreeSearch(prev.bTree, isNaN(numVal) ? 0 : numVal);
              logMsg = `Search ${numVal}`;
            }
            break;
          }
          case "doubly-linked-list": {
            if (op === "insertHead") {
              result = dllInsertHead(prev.dll, isNaN(numVal) ? 0 : numVal);
              logMsg = `Insert ${numVal} at head`;
              updates = { dll: result.snapshot as DLLState };
            } else if (op === "insertTail") {
              result = dllInsertTail(prev.dll, isNaN(numVal) ? 0 : numVal);
              logMsg = `Insert ${numVal} at tail`;
              updates = { dll: result.snapshot as DLLState };
            } else if (op === "delete") {
              result = dllDelete(prev.dll, isNaN(numVal) ? 0 : numVal);
              logMsg = `Delete ${numVal}`;
              updates = { dll: result.snapshot as DLLState };
            } else if (op === "search") {
              result = dllSearch(prev.dll, isNaN(numVal) ? 0 : numVal);
              logMsg = `Search for ${numVal}`;
            } else if (op === "reverse") {
              result = dllReverse(prev.dll);
              logMsg = "Reverse DLL";
              updates = { dll: result.snapshot as DLLState };
            }
            break;
          }
          case "priority-queue": {
            if (op === "enqueue") {
              const priority = isNaN(numExtra) ? numVal : numExtra;
              result = pqEnqueue(prev.pq, isNaN(numVal) ? 0 : numVal, priority);
              logMsg = `Enqueue ${numVal} (priority ${priority})`;
              updates = { pq: result.snapshot as PriorityQueueState };
            } else if (op === "dequeue") {
              result = pqDequeue(prev.pq);
              logMsg = "Dequeue";
              updates = { pq: result.snapshot as PriorityQueueState };
            } else if (op === "peek") {
              result = pqPeek(prev.pq);
              logMsg = "Peek";
            } else if (op === "search") {
              result = pqSearch(prev.pq, isNaN(numVal) ? 0 : numVal);
              logMsg = `Search for ${numVal}`;
            }
            break;
          }
          case "lru-cache": {
            if (op === "get") {
              const key = strVal || "key";
              result = lruGet(prev.lruCache, key);
              logMsg = `Get "${key}"`;
              updates = { lruCache: result.snapshot as LRUCacheState };
            } else if (op === "put") {
              const key = strVal || `k${prev.lruCache.size}`;
              const val = isNaN(numExtra) ? Math.floor(Math.random() * 100) : numExtra;
              result = lruPut(prev.lruCache, key, val);
              logMsg = `Put ("${key}", ${val})`;
              updates = { lruCache: result.snapshot as LRUCacheState };
            } else if (op === "delete") {
              const key = strVal || "";
              result = lruDelete(prev.lruCache, key);
              logMsg = `Delete "${key}"`;
              updates = { lruCache: result.snapshot as LRUCacheState };
            } else if (op === "peek") {
              const key = strVal || "";
              result = lruPeek(prev.lruCache, key);
              logMsg = `Peek "${key}"`;
            }
            break;
          }
          case "cuckoo-hash": {
            const ch = prev.cuckooHash ?? createCuckooHash();
            if (op === "insert") {
              const key = strVal || `k${ch.size}`;
              result = cuckooInsert(ch, key);
              logMsg = `Insert "${key}"`;
              updates = { cuckooHash: result.snapshot as CuckooHashState };
            } else if (op === "search") {
              const key = strVal || "";
              result = cuckooSearch(ch, key);
              logMsg = `Search "${key}"`;
            } else if (op === "delete") {
              const key = strVal || "";
              result = cuckooDelete(ch, key);
              logMsg = `Delete "${key}"`;
              updates = { cuckooHash: result.snapshot as CuckooHashState };
            }
            break;
          }
          case "monotonic-stack": {
            const ms = prev.monotonicStack ?? createMonotonic();
            if (op === "push") {
              result = monotonicPush(ms, isNaN(numVal) ? 0 : numVal);
              logMsg = `Push ${numVal}`;
              updates = { monotonicStack: result.snapshot as MonotonicState };
            } else if (op === "pop") {
              result = monotonicPop(ms);
              logMsg = "Pop";
              updates = { monotonicStack: result.snapshot as MonotonicState };
            } else if (op === "peek") {
              result = monotonicPeek(ms);
              logMsg = "Peek";
            }
            break;
          }
          default: {
            // Exhaustive check — TypeScript will error if a new ActiveDS case is unhandled
            const _exhaustive: never = prev.activeDS;
            void _exhaustive;
            return prev;
          }
        }

        if (!result) return prev;

        // DST-096: Push current state to history before mutation
        setHistory(h => [...h.slice(-19), prev]);

        return {
          ...prev,
          ...updates,
          steps: result.steps,
          currentStepIdx: 0,
          log: [...prev.log.slice(-99), logMsg],
        };
      });

      // ── DST-168: Track daily streak ─────────────────────────────
      const today = new Date().toISOString().slice(0, 10);
      const streakKey = 'architex-ds-streak';
      const lastDate = localStorage.getItem(streakKey + '-last');
      let streak = parseInt(localStorage.getItem(streakKey) || '0', 10);

      if (lastDate !== today) {
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        streak = lastDate === yesterday ? streak + 1 : 1;
        localStorage.setItem(streakKey, String(streak));
        localStorage.setItem(streakKey + '-last', today);

        // Fire notification on milestone streaks
        const milestones = [3, 7, 14, 30];
        if (milestones.includes(streak)) {
          useNotificationStore.getState().addNotification({
            type: 'streak',
            title: `${streak}-Day Streak!`,
            message: `You've practiced data structures ${streak} days in a row. Keep it up!`,
            icon: '\uD83D\uDD25',
          });
        }
      }

      // ── DST-099: Mark DS as explored (once per DS per session) ──
      const currentDS = activeDSRef.current;
      if (!exploredRef.current.has(currentDS)) {
        exploredRef.current.add(currentDS);
        markFeatureExplored("data-structures", currentDS);
      }

      // ── DST-167: Achievement checks based on exploration count ──
      const exploredCount = exploredRef.current.size;
      if (exploredCount === 5 || exploredCount === 10 || exploredCount === 20 || exploredCount === 39) {
        const { addNotification } = useNotificationStore.getState();
        addNotification({
          type: 'achievement',
          title: exploredCount === 39 ? '\uD83C\uDFC6 DS Master!' : `Explored ${exploredCount} Data Structures!`,
          message: exploredCount === 39
            ? 'You have explored all 39 data structures. Amazing!'
            : `Keep going! ${39 - exploredCount} more to explore.`,
        });
      }

      // ── DST-175: SRS card creation after 3+ operations on a DS ──
      const srsKey = `architex-ds-srs-ops-${currentDS}`;
      const opsCount = parseInt(localStorage.getItem(srsKey) || '0', 10) + 1;
      localStorage.setItem(srsKey, String(opsCount));
      if (opsCount === 3) {
        // Mark that this DS has an SRS card
        const cardsKey = 'architex-ds-srs-cards';
        const existingRaw = localStorage.getItem(cardsKey);
        const existing: string[] = existingRaw ? JSON.parse(existingRaw) : [];
        if (!existing.includes(currentDS)) {
          existing.push(currentDS);
          localStorage.setItem(cardsKey, JSON.stringify(existing));
        }
        localStorage.setItem('architex-ds-srs-due', String(Date.now()));
      }
    },
    [],
  );

  const handleRandom = useCallback(() => {
    setState((prev) => {
      switch (prev.activeDS) {
        case "array":
          return {
            ...prev,
            arrayData: Array.from({ length: 6 + Math.floor(Math.random() * 6) }, () => Math.floor(Math.random() * 99) + 1),
            steps: [],
            currentStepIdx: -1,
          };
        case "stack":
          return {
            ...prev,
            stackData: Array.from({ length: 3 + Math.floor(Math.random() * 5) }, () => Math.floor(Math.random() * 99) + 1),
            steps: [],
            currentStepIdx: -1,
          };
        case "queue":
          return {
            ...prev,
            queueData: Array.from({ length: 3 + Math.floor(Math.random() * 5) }, () => Math.floor(Math.random() * 99) + 1),
            steps: [],
            currentStepIdx: -1,
          };
        case "linked-list": {
          const vals = Array.from({ length: 4 + Math.floor(Math.random() * 4) }, () => Math.floor(Math.random() * 99) + 1);
          const nodes: LLNode[] = vals.map((v, i) => ({
            id: `ll-rand-${i}`,
            value: v,
            next: i < vals.length - 1 ? `ll-rand-${i + 1}` : null,
          }));
          return {
            ...prev,
            llNodes: nodes,
            llHeadId: nodes[0]?.id ?? null,
            steps: [],
            currentStepIdx: -1,
          };
        }
        case "hash-table": {
          const ht = createHashTable(8);
          const keys = ["alpha", "beta", "gamma", "delta", "epsilon", "zeta"];
          let table = ht;
          for (const k of keys.slice(0, 3 + Math.floor(Math.random() * 3))) {
            const r = hashInsert(table, k, Math.floor(Math.random() * 100));
            table = r.snapshot as HashTableState;
          }
          return { ...prev, hashTable: table, steps: [], currentStepIdx: -1 };
        }
        case "bst": {
          const vals = Array.from({ length: 5 + Math.floor(Math.random() * 4) }, () => Math.floor(Math.random() * 99) + 1);
          return { ...prev, bstRoot: buildBST(vals), steps: [], currentStepIdx: -1 };
        }
        case "bloom-filter":
          return {
            ...prev,
            bloomFilter: createBloomFilter(32, 3),
            steps: [],
            currentStepIdx: -1,
          };
        case "skip-list": {
          let sl = createSkipList(4);
          const vals = Array.from({ length: 4 + Math.floor(Math.random() * 4) }, () => Math.floor(Math.random() * 49) + 1);
          for (const v of vals) {
            const r = skipListInsert(sl, v);
            sl = r.snapshot as SkipListState;
          }
          return { ...prev, skipList: sl, steps: [], currentStepIdx: -1 };
        }
        case "heap": {
          const vals = Array.from({ length: 5 + Math.floor(Math.random() * 4) }, () => Math.floor(Math.random() * 99) + 1);
          const heapType = Math.random() < 0.5 ? "min" as const : "max" as const;
          const r = heapBuild(vals, heapType);
          return { ...prev, heap: r.snapshot as HeapState, steps: [], currentStepIdx: -1 };
        }
        case "trie": {
          const wordLists = [
            ["cat", "car", "card", "care", "bat", "bar"],
            ["the", "them", "then", "there", "three"],
            ["app", "apple", "apply", "apt", "ape"],
            ["go", "god", "good", "goose", "got"],
          ];
          const words = wordLists[Math.floor(Math.random() * wordLists.length)];
          let t = createTrie();
          for (const w of words.slice(0, 3 + Math.floor(Math.random() * 3))) {
            const r = trieInsert(t, w);
            t = r.snapshot as TrieState;
          }
          return { ...prev, trie: t, steps: [], currentStepIdx: -1 };
        }
        case "union-find": {
          let ds = createDisjointSet();
          const n = 6 + Math.floor(Math.random() * 4);
          for (let i = 1; i <= n; i++) {
            const r = dsuMakeSet(ds, i);
            ds = r.snapshot as DisjointSetState;
          }
          // Random unions
          const numUnions = 2 + Math.floor(Math.random() * 3);
          for (let i = 0; i < numUnions; i++) {
            const a = Math.floor(Math.random() * n) + 1;
            const b = Math.floor(Math.random() * n) + 1;
            if (a !== b) {
              const r = dsuUnion(ds, a, b);
              ds = r.snapshot as DisjointSetState;
            }
          }
          return { ...prev, disjointSet: ds, steps: [], currentStepIdx: -1 };
        }
        case "lsm-tree": {
          let tree = createLSM(4);
          const keys = ["alpha", "beta", "gamma", "delta", "epsilon", "zeta", "eta", "theta"];
          const count = 3 + Math.floor(Math.random() * 5);
          for (let i = 0; i < count; i++) {
            const r = lsmInsert(tree, keys[i % keys.length], `v${Math.floor(Math.random() * 100)}`);
            tree = r.snapshot as LSMState;
          }
          return { ...prev, lsmTree: tree, steps: [], currentStepIdx: -1 };
        }
        case "consistent-hash": {
          let ring = createCHRing();
          const nodeNames = ["S1", "S2", "S3", "S4", "S5"];
          const nodeCount = 2 + Math.floor(Math.random() * 3);
          for (let i = 0; i < nodeCount; i++) {
            const r = chAddNode(ring, nodeNames[i]);
            ring = r.snapshot as CHState;
          }
          const keyCount = 5 + Math.floor(Math.random() * 10);
          const kr = chAddKeys(ring, keyCount);
          ring = kr.snapshot as CHState;
          return { ...prev, chRing: ring, steps: [], currentStepIdx: -1 };
        }
        case "merkle-tree": {
          const dataSets = [
            ["TX1", "TX2", "TX3", "TX4"],
            ["Alice", "Bob", "Carol", "Dave"],
            ["Block1", "Block2", "Block3", "Block4", "Block5", "Block6", "Block7", "Block8"],
            ["A", "B", "C", "D", "E", "F"],
          ];
          const data = dataSets[Math.floor(Math.random() * dataSets.length)];
          const r = merkleTreeBuild(data);
          return { ...prev, merkleTree: r.snapshot as MerkleState, steps: [], currentStepIdx: -1 };
        }
        case "count-min-sketch": {
          let cms = createCountMinSketch(4, 16);
          const items = ["apple", "banana", "cherry", "apple", "banana", "apple", "date", "elderberry"];
          const count = 4 + Math.floor(Math.random() * 4);
          for (let i = 0; i < count; i++) {
            const r = cmsInsert(cms, items[i % items.length]);
            cms = r.snapshot as CountMinSketchState;
          }
          return { ...prev, countMinSketch: cms, steps: [], currentStepIdx: -1 };
        }
        case "hyperloglog": {
          let hllState = createHyperLogLog(4);
          const wordSets = [
            ["cat", "dog", "bird", "fish", "cat", "dog", "snake", "cat"],
            ["red", "blue", "green", "red", "blue", "yellow", "red", "purple"],
            ["alice", "bob", "carol", "dave", "alice", "eve", "bob", "alice"],
          ];
          const words = wordSets[Math.floor(Math.random() * wordSets.length)];
          for (const w of words) {
            const r = hllAdd(hllState, w);
            hllState = r.snapshot as HyperLogLogState;
          }
          return { ...prev, hyperLogLog: hllState, steps: [], currentStepIdx: -1 };
        }
        case "deque": {
          const vals = Array.from({ length: 4 + Math.floor(Math.random() * 4) }, () => Math.floor(Math.random() * 99) + 1);
          let dq = createDeque();
          for (const v of vals) {
            const r = Math.random() < 0.5 ? dequePushFront(dq, v) : dequePushBack(dq, v);
            dq = r.snapshot as DequeState;
          }
          return { ...prev, deque: dq, steps: [], currentStepIdx: -1 };
        }
        case "circular-buffer": {
          let cb = createCircularBuffer(8);
          const count = 4 + Math.floor(Math.random() * 8);
          for (let i = 0; i < count; i++) {
            const v = Math.floor(Math.random() * 99) + 1;
            const r = cbEnqueue(cb, v);
            cb = r.snapshot as CircularBufferState;
          }
          return { ...prev, circularBuffer: cb, steps: [], currentStepIdx: -1 };
        }
        case "wal": {
          let w = createWAL();
          const ops = ["INSERT user=alice", "UPDATE balance=100", "DELETE order=42", "INSERT product=widget", "UPDATE stock=50"];
          const count = 3 + Math.floor(Math.random() * 4);
          for (let i = 0; i < count; i++) {
            const entry = ops[Math.floor(Math.random() * ops.length)];
            const r = walAppend(w, entry);
            w = r.snapshot as WALState;
          }
          // Checkpoint first few entries
          if (count > 2) {
            const ckpt = walCheckpoint(w);
            w = ckpt.snapshot as WALState;
          }
          return { ...prev, wal: w, steps: [], currentStepIdx: -1 };
        }
        case "rope": {
          const texts = [
            "The quick brown fox",
            "Hello World 123",
            "System Design",
            "Rope data structure",
            "Balanced binary tree",
          ];
          const text = texts[Math.floor(Math.random() * texts.length)];
          const r = createRope(text);
          return { ...prev, rope: r, steps: [], currentStepIdx: -1 };
        }
        case "r-tree": {
          let rt = createRTree(4);
          const count = 6 + Math.floor(Math.random() * 8);
          for (let i = 0; i < count; i++) {
            const x = Math.floor(Math.random() * 90) + 5;
            const y = Math.floor(Math.random() * 90) + 5;
            const res = rtreeInsert(rt, x, y);
            rt = res.snapshot as RTreeState;
          }
          return { ...prev, rTree: rt, steps: [], currentStepIdx: -1 };
        }
        case "quadtree": {
          let qt = createQuadtree(100, 100, 4);
          const count = 8 + Math.floor(Math.random() * 10);
          for (let i = 0; i < count; i++) {
            const x = Math.floor(Math.random() * 96) + 2;
            const y = Math.floor(Math.random() * 96) + 2;
            const res = qtInsert(qt, x, y);
            qt = res.snapshot as QuadtreeState;
          }
          return { ...prev, quadtree: qt, steps: [], currentStepIdx: -1 };
        }
        case "fibonacci-heap": {
          let fh = createFibHeap();
          const count = 6 + Math.floor(Math.random() * 6);
          for (let i = 0; i < count; i++) {
            const v = Math.floor(Math.random() * 99) + 1;
            const res = fibInsert(fh, v);
            fh = res.snapshot as FibHeapState;
          }
          // Optionally do an extract-min to trigger consolidation
          if (fh.size > 3 && Math.random() < 0.5) {
            const res = fibExtractMin(fh);
            fh = res.snapshot as FibHeapState;
          }
          return { ...prev, fibHeap: fh, steps: [], currentStepIdx: -1 };
        }
        case "avl-tree": {
          const vals = Array.from({ length: 7 + Math.floor(Math.random() * 6) }, () => Math.floor(Math.random() * 99) + 1);
          return { ...prev, avlRoot: buildAVL(vals), steps: [], currentStepIdx: -1 };
        }
        case "red-black-tree": {
          const vals = Array.from({ length: 7 + Math.floor(Math.random() * 6) }, () => Math.floor(Math.random() * 99) + 1);
          return { ...prev, rbRoot: buildRBTree(vals), steps: [], currentStepIdx: -1 };
        }
        case "segment-tree": {
          const data = Array.from({ length: 6 + Math.floor(Math.random() * 6) }, () => Math.floor(Math.random() * 20) + 1);
          const r = createSegmentTree(data);
          return { ...prev, segmentTree: r.snapshot as SegmentTreeState, steps: [], currentStepIdx: -1 };
        }
        case "bplus-tree": {
          let bp = createBPlusTree(4);
          const vals = Array.from({ length: 8 + Math.floor(Math.random() * 8) }, () => Math.floor(Math.random() * 99) + 1);
          for (const v of vals) {
            const r = bplusInsert(bp, v);
            bp = r.snapshot as BPlusTreeState;
          }
          return { ...prev, bplusTree: bp, steps: [], currentStepIdx: -1 };
        }
        case "fenwick-tree": {
          const data = Array.from({ length: 8 + Math.floor(Math.random() * 4) }, () => Math.floor(Math.random() * 10) - 3);
          const r = createFenwickTree(data);
          return { ...prev, fenwickTree: r.snapshot as FenwickTreeState, steps: [], currentStepIdx: -1 };
        }
        case "splay-tree": {
          let st = createSplayTree();
          const vals = Array.from({ length: 6 + Math.floor(Math.random() * 5) }, () => Math.floor(Math.random() * 99) + 1);
          for (const v of vals) {
            const r = splayInsert(st, v);
            st = r.snapshot as SplayTreeState;
          }
          return { ...prev, splayTree: st, steps: [], currentStepIdx: -1 };
        }
        case "crdt": {
          const nodeNames = ["A", "B", "C", "D"];
          const nodeCount = 2 + Math.floor(Math.random() * 2);
          switch (prev.crdtType) {
            case 'g-counter': {
              let gc = gCounterCreate();
              for (let i = 0; i < nodeCount; i++) {
                const incCount = 1 + Math.floor(Math.random() * 5);
                for (let j = 0; j < incCount; j++) {
                  const r = gCounterIncrement(gc, nodeNames[i]);
                  gc = r.snapshot as GCounterState;
                }
              }
              return { ...prev, crdtCounter: gc, steps: [], currentStepIdx: -1 };
            }
            case 'pn-counter': {
              let pn = pnCounterCreate();
              for (let i = 0; i < nodeCount; i++) {
                const incCount = 1 + Math.floor(Math.random() * 4);
                for (let j = 0; j < incCount; j++) {
                  const r = pnCounterIncrement(pn, nodeNames[i]);
                  pn = r.snapshot as PNCounterState;
                }
                const decCount = Math.floor(Math.random() * 3);
                for (let j = 0; j < decCount; j++) {
                  const r = pnCounterDecrement(pn, nodeNames[i]);
                  pn = r.snapshot as PNCounterState;
                }
              }
              return { ...prev, pnCounter: pn, steps: [], currentStepIdx: -1 };
            }
            case 'lww-register': {
              const words = ["hello", "world", "foo", "bar", "alpha", "beta"];
              const word = words[Math.floor(Math.random() * words.length)];
              const ts = Date.now() - Math.floor(Math.random() * 10000);
              const r = lwwRegisterSet(lwwRegisterCreate(), word, ts);
              return { ...prev, lwwRegister: r.snapshot as LWWRegisterState, steps: [], currentStepIdx: -1 };
            }
            case 'or-set': {
              let os = orSetCreate();
              const elements = ["apple", "banana", "cherry", "date", "elderberry", "fig"];
              const count = 2 + Math.floor(Math.random() * 4);
              for (let i = 0; i < count; i++) {
                const el = elements[Math.floor(Math.random() * elements.length)];
                const nodeId = nodeNames[Math.floor(Math.random() * nodeCount)];
                const r = orSetAdd(os, el, nodeId);
                os = r.snapshot as ORSetState;
              }
              return { ...prev, orSet: os, steps: [], currentStepIdx: -1 };
            }
          }
          return prev;
        }
        case "vector-clock": {
          const nodeOptions = [["A", "B", "C"], ["P1", "P2", "P3"], ["X", "Y", "Z"]];
          const nodeIds = nodeOptions[Math.floor(Math.random() * nodeOptions.length)];
          let vcState = createVectorClockSystem(nodeIds);
          // Generate some random events
          const eventCount = 4 + Math.floor(Math.random() * 4);
          for (let i = 0; i < eventCount; i++) {
            const fromNode = nodeIds[Math.floor(Math.random() * nodeIds.length)];
            if (Math.random() < 0.5) {
              const r = vectorClockLocalEvent(vcState, fromNode);
              vcState = r.snapshot as VectorClockState;
            } else {
              const toNode = nodeIds.filter((n) => n !== fromNode)[Math.floor(Math.random() * (nodeIds.length - 1))];
              if (toNode) {
                const sendR = vectorClockSend(vcState, fromNode, toNode);
                vcState = sendR.snapshot as VectorClockState;
                const lastMsg = vcState.messages[vcState.messages.length - 1];
                if (lastMsg) {
                  const recvR = vectorClockReceive(vcState, lastMsg.to, lastMsg.clock);
                  vcState = recvR.snapshot as VectorClockState;
                }
              }
            }
          }
          return { ...prev, vectorClock: vcState, steps: [], currentStepIdx: -1 };
        }
        case "treap": {
          let tr = createTreap();
          const vals = Array.from({ length: 7 + Math.floor(Math.random() * 5) }, () => Math.floor(Math.random() * 99) + 1);
          for (const v of vals) {
            const r = treapInsert(tr, v);
            tr = r.snapshot as TreapState;
          }
          return { ...prev, treap: tr, steps: [], currentStepIdx: -1 };
        }
        case "binomial-heap": {
          let bh = createBinomialHeap();
          const count = 6 + Math.floor(Math.random() * 8);
          for (let i = 0; i < count; i++) {
            const v = Math.floor(Math.random() * 99) + 1;
            const r = binomialInsert(bh, v);
            bh = r.snapshot as BinomialHeapState;
          }
          if (bh.size > 3 && Math.random() < 0.4) {
            const r = binomialExtractMin(bh);
            bh = r.snapshot as BinomialHeapState;
          }
          return { ...prev, binomialHeap: bh, steps: [], currentStepIdx: -1 };
        }
        case "b-tree": {
          let bt = createBTree(3);
          const vals = Array.from({ length: 8 + Math.floor(Math.random() * 8) }, () => Math.floor(Math.random() * 99) + 1);
          for (const v of vals) {
            const r = btreeInsert(bt, v);
            bt = r.snapshot as BTreeState;
          }
          return { ...prev, bTree: bt, steps: [], currentStepIdx: -1 };
        }
        case "doubly-linked-list": {
          let dl = createDLL();
          const count = 4 + Math.floor(Math.random() * 4);
          for (let i = 0; i < count; i++) {
            const v = Math.floor(Math.random() * 99) + 1;
            const r = dllInsertTail(dl, v);
            dl = r.snapshot as DLLState;
          }
          return { ...prev, dll: dl, steps: [], currentStepIdx: -1 };
        }
        case "priority-queue": {
          let pqState = createPQ(Math.random() < 0.5 ? "min" : "max");
          const count = 5 + Math.floor(Math.random() * 4);
          for (let i = 0; i < count; i++) {
            const v = Math.floor(Math.random() * 99) + 1;
            const pri = Math.floor(Math.random() * 10) + 1;
            const r = pqEnqueue(pqState, v, pri);
            pqState = r.snapshot as PriorityQueueState;
          }
          return { ...prev, pq: pqState, steps: [], currentStepIdx: -1 };
        }
        case "lru-cache": {
          const capacity = 4 + Math.floor(Math.random() * 3); // 4-6
          let lru = createLRUCache(capacity);
          const keys = ["alpha", "beta", "gamma", "delta", "epsilon", "zeta", "eta", "theta"];
          const count = 3 + Math.floor(Math.random() * 3);
          for (let i = 0; i < count; i++) {
            const r = lruPut(lru, keys[i % keys.length], Math.floor(Math.random() * 100));
            lru = r.snapshot as LRUCacheState;
          }
          return { ...prev, lruCache: lru, steps: [], currentStepIdx: -1 };
        }
        case "cuckoo-hash": {
          let ch = createCuckooHash(8);
          const keys = ["alpha", "beta", "gamma", "delta", "epsilon", "zeta", "eta", "theta"];
          const count = 3 + Math.floor(Math.random() * 4);
          for (let i = 0; i < count; i++) {
            const r = cuckooInsert(ch, keys[i % keys.length]);
            ch = r.snapshot as CuckooHashState;
          }
          return { ...prev, cuckooHash: ch, steps: [], currentStepIdx: -1 };
        }
        case "monotonic-stack": {
          const type = Math.random() < 0.5 ? "decreasing" as const : "increasing" as const;
          let ms = createMonotonic(type, "stack");
          const count = 4 + Math.floor(Math.random() * 4);
          for (let i = 0; i < count; i++) {
            const v = Math.floor(Math.random() * 49) + 1;
            const r = monotonicPush(ms, v);
            ms = r.snapshot as MonotonicState;
          }
          return { ...prev, monotonicStack: ms, steps: [], currentStepIdx: -1 };
        }
        default: {
          // Exhaustive check — TypeScript will error if a new ActiveDS case is unhandled
          const _exhaustive: never = prev.activeDS;
          void _exhaustive;
          return prev;
        }
      }
    });
  }, []);

  // ── DST-044: Selective reset — only clear the active DS ────
  const handleReset = useCallback(() => {
    setIsPlaying(false);
    const initial = getInitialState();
    setState((prev) => {
      const resetBase: Partial<DSModuleState> = {
        steps: [],
        currentStepIdx: -1,
        log: [],
      };
      switch (prev.activeDS) {
        case "array": resetBase.arrayData = initial.arrayData; break;
        case "stack": resetBase.stackData = initial.stackData; break;
        case "queue": resetBase.queueData = initial.queueData; break;
        case "linked-list": resetBase.llNodes = initial.llNodes; resetBase.llHeadId = initial.llHeadId; break;
        case "hash-table": resetBase.hashTable = initial.hashTable; break;
        case "bst": resetBase.bstRoot = initial.bstRoot; break;
        case "bloom-filter": resetBase.bloomFilter = initial.bloomFilter; break;
        case "skip-list": resetBase.skipList = initial.skipList; break;
        case "heap": resetBase.heap = initial.heap; break;
        case "trie": resetBase.trie = initial.trie; break;
        case "union-find": resetBase.disjointSet = initial.disjointSet; break;
        case "lsm-tree": resetBase.lsmTree = initial.lsmTree; break;
        case "consistent-hash": resetBase.chRing = initial.chRing; break;
        case "merkle-tree": resetBase.merkleTree = initial.merkleTree; break;
        case "count-min-sketch": resetBase.countMinSketch = initial.countMinSketch; break;
        case "hyperloglog": resetBase.hyperLogLog = initial.hyperLogLog; break;
        case "deque": resetBase.deque = initial.deque; break;
        case "circular-buffer": resetBase.circularBuffer = initial.circularBuffer; break;
        case "wal": resetBase.wal = initial.wal; break;
        case "rope": resetBase.rope = initial.rope; break;
        case "r-tree": resetBase.rTree = initial.rTree; break;
        case "quadtree": resetBase.quadtree = initial.quadtree; break;
        case "fibonacci-heap": resetBase.fibHeap = initial.fibHeap; break;
        case "avl-tree": resetBase.avlRoot = initial.avlRoot; break;
        case "red-black-tree": resetBase.rbRoot = initial.rbRoot; break;
        case "segment-tree": resetBase.segmentTree = initial.segmentTree; break;
        case "bplus-tree": resetBase.bplusTree = initial.bplusTree; break;
        case "fenwick-tree": resetBase.fenwickTree = initial.fenwickTree; break;
        case "splay-tree": resetBase.splayTree = initial.splayTree; break;
        case "crdt":
          resetBase.crdtType = initial.crdtType;
          resetBase.crdtCounter = initial.crdtCounter;
          resetBase.pnCounter = initial.pnCounter;
          resetBase.lwwRegister = initial.lwwRegister;
          resetBase.orSet = initial.orSet;
          break;
        case "vector-clock": resetBase.vectorClock = initial.vectorClock; break;
        case "treap": resetBase.treap = initial.treap; break;
        case "binomial-heap": resetBase.binomialHeap = initial.binomialHeap; break;
        case "b-tree": resetBase.bTree = initial.bTree; break;
        case "doubly-linked-list": resetBase.dll = initial.dll; break;
        case "priority-queue": resetBase.pq = initial.pq; break;
        case "lru-cache": resetBase.lruCache = initial.lruCache; break;
        case "cuckoo-hash": resetBase.cuckooHash = initial.cuckooHash; break;
        case "monotonic-stack": resetBase.monotonicStack = initial.monotonicStack; break;
        default: {
          const _exhaustive: never = prev.activeDS;
          void _exhaustive;
        }
      }
      return { ...prev, ...resetBase };
    });
  }, []);

  // ── DST-107: Handle "Try It" from Daily Challenge ───────
  const handleTryChallenge = useCallback((ds: ActiveDS, data: string) => {
    // Switch to the target DS
    setIsPlaying(false);
    setState((prev) => ({
      ...prev,
      activeDS: ds,
      steps: [],
      currentStepIdx: -1,
    }));
    // Mark the DS as explored
    if (!exploredRef.current.has(ds)) {
      exploredRef.current.add(ds);
      markFeatureExplored("data-structures", ds);
    }
    // Auto-insert the challenge data values via sequential operations
    const values = data.split(",").map((v) => v.trim());
    setTimeout(() => {
      for (const v of values) {
        const isNum = !isNaN(parseFloat(v));
        handleOperation("insert", isNum ? parseFloat(v) : v);
      }
    }, 100);
  }, [handleOperation]);

  const handleStepForward = useCallback(() => {
    setState((prev) => {
      if (prev.currentStepIdx >= prev.steps.length - 1) return prev;
      const nextIdx = prev.currentStepIdx + 1;
      const nextStep = prev.steps[nextIdx];

      // DST-149: If prediction mode is on, check if the next step is predictable
      if (predictionMode && nextStep) {
        const prediction = parsePredictionFromStep(nextStep.description, prev.activeDS);
        if (prediction) {
          // Show prediction overlay instead of advancing
          setPendingPrediction(prediction);
          return prev; // Don't advance yet
        }
      }

      // DST-101: Sonification on manual step forward
      if (nextStep) playSonificationForStep(nextStep);
      return { ...prev, currentStepIdx: nextIdx };
    });
  }, [playSonificationForStep, predictionMode]);

  // DST-149: Handle prediction answer
  const handlePredictionAnswer = useCallback((idx: number) => {
    if (!pendingPrediction) return;
    const correct = idx === pendingPrediction.correctIdx;
    setPredictionFeedback(correct ? "correct" : "wrong");
    setPendingPrediction(null);

    // After feedback, advance the step
    setTimeout(() => {
      setPredictionFeedback(null);
      setState((prev) => {
        if (prev.currentStepIdx >= prev.steps.length - 1) return prev;
        const nextIdx = prev.currentStepIdx + 1;
        const nextStep = prev.steps[nextIdx];
        if (nextStep) playSonificationForStep(nextStep);
        return { ...prev, currentStepIdx: nextIdx };
      });
    }, 600);
  }, [pendingPrediction, playSonificationForStep]);

  // DST-149: Handle prediction skip
  const handlePredictionSkip = useCallback(() => {
    setPendingPrediction(null);
    setPredictionFeedback(null);
    setState((prev) => {
      if (prev.currentStepIdx >= prev.steps.length - 1) return prev;
      const nextIdx = prev.currentStepIdx + 1;
      const nextStep = prev.steps[nextIdx];
      if (nextStep) playSonificationForStep(nextStep);
      return { ...prev, currentStepIdx: nextIdx };
    });
  }, [playSonificationForStep]);

  // DST-150: Handle manual trace choice
  const handleTraceChoice = useCallback((direction: "left" | "right") => {
    if (traceFeedback) return; // Already showing feedback
    const currentDirectionalIdx = directionalStepIndices[traceStepIdx];
    if (currentDirectionalIdx === undefined) return;

    const step = state.steps[currentDirectionalIdx];
    if (!step) return;

    const correctDir = getCorrectDirection(step.description);
    const correct = direction === correctDir;

    setTraceScore((s) => ({
      correct: s.correct + (correct ? 1 : 0),
      total: s.total + 1,
    }));

    setTraceFeedback(correct ? "correct" : "wrong");
    if (!correct) {
      setTraceExplanation(`The correct direction was ${correctDir}.`);
    }

    // Advance after delay
    setTimeout(() => {
      setTraceFeedback(null);
      setTraceExplanation(null);

      // Advance the visualization to this step
      setState((prev) => ({
        ...prev,
        currentStepIdx: currentDirectionalIdx,
      }));

      // Move to next directional step
      const nextTraceIdx = traceStepIdx + 1;
      if (nextTraceIdx >= directionalStepIndices.length) {
        // Trace complete
        setTraceComplete(true);
      } else {
        setTraceStepIdx(nextTraceIdx);
      }
    }, correct ? 500 : 1200);
  }, [traceFeedback, directionalStepIndices, traceStepIdx, state.steps]);

  // DST-150: Close manual trace
  const handleTraceClose = useCallback(() => {
    setManualTraceActive(false);
    setTraceComplete(false);
  }, []);

  // ── DST-055: Global keyboard shortcuts for core operations ──
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't capture if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case 'ArrowLeft': handleStepBack(); break;
        case 'ArrowRight': handleStepForward(); break;
        case ' ': e.preventDefault(); handlePlayToggle(); break;
        case 'r': handleRandom(); break;
        case 'Escape': handleReset(); break;
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleStepBack, handleStepForward, handlePlayToggle, handleRandom, handleReset]);

  return {
    sidebar: (
      <DSSidebar activeDS={state.activeDS} onSelect={handleSelectDS} />
    ),
    canvas: (
      <div className="flex h-full w-full flex-col bg-background relative">
        {/* DST-122: Mobile sidebar overlay drawer */}
        <AnimatePresence>
          {mobileSidebarOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-40 bg-black/50 md:hidden"
                onClick={() => setMobileSidebarOpen(false)}
              />
              {/* Slide-over panel */}
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="fixed inset-y-0 left-0 z-50 w-72 bg-sidebar border-r border-sidebar-border shadow-xl md:hidden overflow-y-auto"
              >
                <div className="flex items-center justify-between border-b border-sidebar-border px-3 py-2">
                  <span className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">Data Structures</span>
                  <button
                    onClick={() => setMobileSidebarOpen(false)}
                    aria-label="Close sidebar"
                    className="flex h-7 w-7 items-center justify-center rounded hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                  >
                    <X className="h-4 w-4 text-foreground-muted" />
                  </button>
                </div>
                <DSSidebar activeDS={state.activeDS} onSelect={handleSelectDS} />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* DST-175: SRS review banner */}
        {srsReviewDue && (
          <div className="flex items-center justify-between border-b border-border bg-amber-50 dark:bg-amber-950/30 px-4 py-1.5 text-xs text-amber-800 dark:text-amber-300">
            <span>Review time! Revisit your explored data structures to strengthen retention.</span>
            <button
              onClick={dismissSrsReview}
              className="ml-2 shrink-0 rounded px-2 py-0.5 text-xs font-medium hover:bg-amber-100 dark:hover:bg-amber-900/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="flex items-center border-b border-border px-4 py-2 gap-2">
          {/* DST-122: Hamburger toggle for mobile */}
          <button
            onClick={() => setMobileSidebarOpen((prev) => !prev)}
            aria-label="Toggle data structures sidebar"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-border bg-elevated md:hidden focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
          >
            <Menu className="h-4 w-4 text-foreground-muted" />
          </button>
          <DSControls
            activeDS={state.activeDS}
            onOperation={handleOperation}
            onRandom={handleRandom}
            onReset={handleReset}
            onUndo={handleUndo}
            canUndo={history.length > 0}
            onStepForward={handleStepForward}
            onStepBack={handleStepBack}
            onPlayToggle={handlePlayToggle}
            onSpeedChange={handleSpeedChange}
            isPlaying={isPlaying}
            playbackSpeed={playbackSpeed}
            hasSteps={state.steps.length > 0}
            stepIdx={state.currentStepIdx}
            totalSteps={state.steps.length}
            soundEnabled={soundEnabled}
            onToggleSound={toggleSound}
            predictionMode={predictionMode}
            onTogglePrediction={togglePrediction}
            manualTraceActive={manualTraceActive}
            onToggleManualTrace={toggleManualTrace}
          />
        </div>
        <div className="relative flex flex-1 items-center justify-center overflow-auto p-6">
          <Suspense fallback={<div className="flex h-full items-center justify-center"><p className="text-sm text-foreground-muted">Loading visualizer...</p></div>}>
            <DSCanvas state={state} onCrdtTypeChange={(t) => setState((prev) => ({ ...prev, crdtType: t, steps: [], currentStepIdx: -1 }))} onDemo={handleRandom} />
          </Suspense>

          {/* DST-149: Prediction overlay */}
          <AnimatePresence>
            {pendingPrediction && (
              <PredictionOverlay
                question={pendingPrediction.question}
                options={pendingPrediction.options}
                onAnswer={handlePredictionAnswer}
                onSkip={handlePredictionSkip}
              />
            )}
          </AnimatePresence>

          {/* DST-149: Prediction feedback flash */}
          <AnimatePresence>
            {predictionFeedback && (
              <PredictionFeedback
                correct={predictionFeedback === "correct"}
                onDone={() => setPredictionFeedback(null)}
              />
            )}
          </AnimatePresence>

          {/* DST-150: Manual trace overlay */}
          <AnimatePresence>
            {manualTraceActive && !traceComplete && directionalStepIndices.length > 0 && directionalStepIndices[traceStepIdx] !== undefined && (
              <ManualTraceOverlay
                step={state.steps[directionalStepIndices[traceStepIdx]]}
                onChoice={handleTraceChoice}
                feedback={traceFeedback}
                explanation={traceExplanation}
                score={traceScore}
                traceStepIdx={traceStepIdx}
                totalTraceSteps={directionalStepIndices.length}
              />
            )}
          </AnimatePresence>

          {/* DST-150: Manual trace complete */}
          <AnimatePresence>
            {traceComplete && (
              <ManualTraceComplete
                score={traceScore}
                onClose={handleTraceClose}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    ),
    properties: (
      <DSProperties activeDS={state.activeDS} state={state} />
    ),
    bottomPanel: (
      <DSBottomPanel
        log={state.log}
        steps={state.steps}
        currentStepIdx={state.currentStepIdx}
        onTryChallenge={handleTryChallenge}
      />
    ),
  };
}

export const DataStructuresModule = memo(function DataStructuresModule() {
  return null; // Module content is provided via useDataStructuresModule hook
});
