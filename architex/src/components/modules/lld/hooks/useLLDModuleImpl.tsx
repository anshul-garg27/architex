"use client";

/**
 * useLLDModule implementation — all state + handlers for the LLD module.
 * Split from LLDModule.tsx (LLD-037).
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import {
  AlertTriangle,
  Play,
  Check,
  Share2,
  RotateCcw,
  Undo2,
  Redo2,
  Download,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  X,
  Accessibility,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import type {
  UMLClass,
  UMLRelationship,
  UMLRelationshipType,
  DesignPattern,
  SOLIDDemo,
  LLDProblem,
  StateTransition,
} from "@/lib/lld";
import {
  DESIGN_PATTERNS,
  getPatternsByCategory,
  SOLID_DEMOS,
  LLD_PROBLEMS,
  SEQUENCE_EXAMPLES,
  STATE_MACHINE_EXAMPLES,
  removeClass,
  updateClass,
  addAttribute,
  removeAttribute,
  addMethod,
  removeMethod,
  addRelationship,
} from "@/lib/lld";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { trackLLDExploration } from "@/lib/progress/module-progress";

// Import split components
import { LLDCanvas } from "../canvas/LLDCanvas";
import { SequenceDiagramCanvas, SequencePlaybackToolbar } from "../canvas/SequenceDiagramCanvas";
import { StateMachineCanvas, SimToast, SimTransitionPanel } from "../canvas/StateMachineCanvas";
import { LLDSidebar } from "../sidebar/LLDSidebar";
import { LLDProperties, LLDSOLIDProperties, LLDProblemProperties, SequenceProperties, StateMachineProperties } from "../panels/LLDProperties";
import { LLDBottomPanel, LLDSOLIDBottomPanel, LLDProblemBottomPanel, SequenceBottomPanel, StateMachineBottomPanel, GeneratedCodePanel, LLDBottomPanelTabs } from "../panels/LLDBottomPanels";
import { PracticeTimerBar, PracticeAssessment } from "../panels/InterviewPractice";
import { ScreenReaderView } from "../panels/ScreenReaderView";
import {
  CATEGORY_LABELS,
  type SidebarMode,
  type PracticeTimerOption,
  type PracticeState,
  type SequencePlaybackState,
  type StateMachineSimState,
} from "../constants";

// ── Module Hook ──────────────────────────────────────────

function newClassId(): string {
  return `user-class-${crypto.randomUUID().slice(0, 8)}`;
}

export function useLLDModule() {
  const [activePattern, setActivePattern] = useState<DesignPattern | null>(null);
  const [activeDemo, setActiveDemo] = useState<SOLIDDemo | null>(null);
  const [activeProblem, setActiveProblem] = useState<LLDProblem | null>(null);
  const [activeSequence, setActiveSequence] = useState<(typeof SEQUENCE_EXAMPLES)[number] | null>(null);
  const [activeStateMachine, setActiveStateMachine] = useState<(typeof STATE_MACHINE_EXAMPLES)[number] | null>(null);
  const [solidView, setSolidView] = useState<"before" | "after">("before");
  const [classes, setClasses] = useState<UMLClass[]>([]);
  const [relationships, setRelationships] = useState<UMLRelationship[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [selectedStateId, setSelectedStateId] = useState<string | null>(null);
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>("patterns");

  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editingNameValue, setEditingNameValue] = useState("");
  const [hoveredClassId, setHoveredClassId] = useState<string | null>(null);
  const [practiceState, setPracticeState] = useState<PracticeState | null>(null);
  const [seqPlayback, setSeqPlayback] = useState<SequencePlaybackState | null>(null);
  const seqPlaybackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [smSim, setSmSim] = useState<StateMachineSimState | null>(null);
  const smSimToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [shareToast, setShareToast] = useState(false);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [presentationMode, setPresentationMode] = useState(false);
  const [presentationPatternIdx, setPresentationPatternIdx] = useState(0);

  // Dirty-tracking: true when user has manually edited the diagram
  const [isDirty, setIsDirty] = useState(false);
  // Pending action for confirmation dialog
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  // Screen reader accessible view toggle
  const [screenReaderMode, setScreenReaderMode] = useState(false);

  // Undo/Redo
  type DiagramSnapshot = { classes: UMLClass[]; relationships: UMLRelationship[] };
  const UNDO_MAX = 50;
  const undoStackRef = useRef<DiagramSnapshot[]>([]);
  const redoStackRef = useRef<DiagramSnapshot[]>([]);
  const [undoCount, setUndoCount] = useState(0);
  const [redoCount, setRedoCount] = useState(0);

  const pushUndo = useCallback(() => {
    const snapshot: DiagramSnapshot = {
      classes: classes.map((c) => ({ ...c, attributes: [...c.attributes], methods: [...c.methods] })),
      relationships: relationships.map((r) => ({ ...r })),
    };
    undoStackRef.current.push(snapshot);
    if (undoStackRef.current.length > UNDO_MAX) {
      undoStackRef.current.shift();
    }
    redoStackRef.current = [];
    setUndoCount(undoStackRef.current.length);
    setRedoCount(0);
  }, [classes, relationships]);

  const handleUndo = useCallback(() => {
    if (undoStackRef.current.length === 0) return;
    const currentSnapshot: DiagramSnapshot = {
      classes: classes.map((c) => ({ ...c, attributes: [...c.attributes], methods: [...c.methods] })),
      relationships: relationships.map((r) => ({ ...r })),
    };
    redoStackRef.current.push(currentSnapshot);
    const prev = undoStackRef.current.pop()!;
    setClasses(prev.classes);
    setRelationships(prev.relationships);
    setSelectedClassId(null);
    setUndoCount(undoStackRef.current.length);
    setRedoCount(redoStackRef.current.length);
  }, [classes, relationships]);

  const handleRedo = useCallback(() => {
    if (redoStackRef.current.length === 0) return;
    const currentSnapshot: DiagramSnapshot = {
      classes: classes.map((c) => ({ ...c, attributes: [...c.attributes], methods: [...c.methods] })),
      relationships: relationships.map((r) => ({ ...r })),
    };
    undoStackRef.current.push(currentSnapshot);
    const next = redoStackRef.current.pop()!;
    setClasses(next.classes);
    setRelationships(next.relationships);
    setSelectedClassId(null);
    setUndoCount(undoStackRef.current.length);
    setRedoCount(redoStackRef.current.length);
  }, [classes, relationships]);

  const clearAllModes = useCallback(() => {
    setActivePattern(null);
    setActiveDemo(null);
    setActiveProblem(null);
    setActiveSequence(null);
    setActiveStateMachine(null);
    setSelectedClassId(null);
    setSelectedMessageId(null);
    setSelectedStateId(null);
    setEditingNameId(null);
    setClasses([]);
    setRelationships([]);
    undoStackRef.current = [];
    redoStackRef.current = [];
    setUndoCount(0);
    setRedoCount(0);
    setPracticeState(null);
    setSeqPlayback(null);
    if (seqPlaybackTimerRef.current) clearTimeout(seqPlaybackTimerRef.current);
    setSmSim(null);
    if (smSimToastTimerRef.current) clearTimeout(smSimToastTimerRef.current);
    setIsDirty(false);
  }, []);

  const dismissMobileSheet = useCallback(() => {
    const state = useUIStore.getState();
    if (state.sidebarOpen) state.toggleSidebar();
  }, []);

  // URL state
  const restoringFromUrl = useRef(false);

  const computeLLDParam = useCallback((): string | null => {
    if (activeStateMachine) return `state-machine:${activeStateMachine.id}`;
    if (activeSequence) return `sequence:${activeSequence.id}`;
    if (activePattern) return `pattern:${activePattern.id}`;
    if (activeDemo) return `solid:${activeDemo.id}`;
    if (activeProblem) return `problem:${activeProblem.id}`;
    return null;
  }, [activePattern, activeDemo, activeProblem, activeSequence, activeStateMachine]);

  useEffect(() => {
    if (restoringFromUrl.current) return;
    if (typeof window === "undefined") return;
    const param = computeLLDParam();
    const url = new URL(window.location.href);
    if (param) {
      url.searchParams.set("lld", param);
    } else {
      url.searchParams.delete("lld");
    }
    window.history.replaceState({}, "", url.toString());
  }, [computeLLDParam]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const lldParam = url.searchParams.get("lld");
    if (!lldParam) return;

    const colonIdx = lldParam.indexOf(":");
    if (colonIdx === -1) return;
    const mode = lldParam.slice(0, colonIdx);
    const id = lldParam.slice(colonIdx + 1);
    if (!mode || !id) return;

    restoringFromUrl.current = true;

    try {
      switch (mode) {
        case "pattern": {
          const pattern = DESIGN_PATTERNS.find((p) => p.id === id);
          if (pattern) {
            setActivePattern(pattern);
            setClasses(pattern.classes.map((c) => ({ ...c, attributes: [...c.attributes], methods: [...c.methods] })));
            setRelationships([...pattern.relationships]);
            setSidebarMode("patterns");
          }
          break;
        }
        case "solid": {
          const demo = SOLID_DEMOS.find((d) => d.id === id);
          if (demo) {
            setActiveDemo(demo);
            setSolidView("before");
            setClasses(demo.beforeClasses.map((c) => ({ ...c, attributes: [...c.attributes], methods: [...c.methods] })));
            setRelationships([...demo.beforeRelationships]);
            setSidebarMode("solid");
          }
          break;
        }
        case "problem": {
          const problem = LLD_PROBLEMS.find((p) => p.id === id);
          if (problem) {
            setActiveProblem(problem);
            setClasses(problem.starterClasses.map((c) => ({ ...c, attributes: [...c.attributes], methods: [...c.methods] })));
            setRelationships([...problem.starterRelationships]);
            setSidebarMode("problems");
          }
          break;
        }
        case "sequence": {
          const example = SEQUENCE_EXAMPLES.find((e) => e.id === id);
          if (example) {
            setActiveSequence(example);
            setSidebarMode("sequence");
          }
          break;
        }
        case "state-machine": {
          const example = STATE_MACHINE_EXAMPLES.find((e) => e.id === id);
          if (example) {
            setActiveStateMachine(example);
            setSidebarMode("state-machine");
          }
          break;
        }
        default:
          break;
      }
    } finally {
      restoringFromUrl.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleShare = useCallback(async () => {
    const param = computeLLDParam();
    if (!param) return;
    const url = new URL(window.location.href);
    url.searchParams.set("lld", param);
    try {
      await navigator.clipboard.writeText(url.toString());
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2000);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = url.toString();
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2000);
    }
  }, [computeLLDParam]);

  /** Run action immediately if canvas is clean, otherwise queue it behind a confirmation dialog. */
  const confirmOrRun = useCallback((action: () => void) => {
    if (isDirty) {
      setPendingAction(() => action);
    } else {
      action();
    }
  }, [isDirty]);

  const handleConfirmDiscard = useCallback(() => {
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  }, [pendingAction]);

  const handleCancelDiscard = useCallback(() => {
    setPendingAction(null);
  }, []);

  const handleSelectPattern = useCallback((pattern: DesignPattern) => {
    const run = () => {
      clearAllModes();
      setActivePattern(pattern);
      setClasses(pattern.classes.map((c) => ({ ...c, attributes: [...c.attributes], methods: [...c.methods] })));
      setRelationships([...pattern.relationships]);
      dismissMobileSheet();
    };
    confirmOrRun(run);
  }, [clearAllModes, dismissMobileSheet, confirmOrRun]);

  const handleSelectDemo = useCallback((demo: SOLIDDemo) => {
    const run = () => {
      clearAllModes();
      setActiveDemo(demo);
      setSolidView("before");
      setClasses(demo.beforeClasses.map((c) => ({ ...c, attributes: [...c.attributes], methods: [...c.methods] })));
      setRelationships([...demo.beforeRelationships]);
      dismissMobileSheet();
    };
    confirmOrRun(run);
  }, [clearAllModes, dismissMobileSheet, confirmOrRun]);

  const handleToggleSolidView = useCallback(() => {
    if (!activeDemo) return;
    setSolidView((prev) => {
      const next = prev === "before" ? "after" : "before";
      const src = next === "before" ? activeDemo.beforeClasses : activeDemo.afterClasses;
      const rels = next === "before" ? activeDemo.beforeRelationships : activeDemo.afterRelationships;
      setClasses(src.map((c) => ({ ...c, attributes: [...c.attributes], methods: [...c.methods] })));
      setRelationships([...rels]);
      setSelectedClassId(null);
      return next;
    });
  }, [activeDemo]);

  const handleSelectProblem = useCallback((problem: LLDProblem) => {
    const run = () => {
      clearAllModes();
      setActiveProblem(problem);
      setClasses(problem.starterClasses.map((c) => ({ ...c, attributes: [...c.attributes], methods: [...c.methods] })));
      setRelationships([...problem.starterRelationships]);
      dismissMobileSheet();
    };
    confirmOrRun(run);
  }, [clearAllModes, dismissMobileSheet, confirmOrRun]);

  // Practice mode handlers
  const handleStartPractice = useCallback((problem: LLDProblem, minutes: PracticeTimerOption) => {
    const run = () => {
      clearAllModes();
      setActiveProblem(problem);
      setClasses([]);
      setRelationships([]);
      setPracticeState({ problem, timerMinutes: minutes, startTime: Date.now(), submitted: false, checkedHints: new Set() });
      setSidebarMode("palette");
      dismissMobileSheet();
    };
    confirmOrRun(run);
  }, [clearAllModes, dismissMobileSheet, confirmOrRun]);

  const handlePracticeSubmit = useCallback(() => {
    if (!practiceState) return;
    const problem = practiceState.problem;
    setClasses(problem.starterClasses.map((c) => ({ ...c, attributes: [...c.attributes], methods: [...c.methods] })));
    setRelationships([...problem.starterRelationships]);
    setPracticeState((prev) => prev ? { ...prev, submitted: true } : null);
  }, [practiceState]);

  const handlePracticeCancel = useCallback(() => {
    setPracticeState(null);
    if (activeProblem) {
      setClasses(activeProblem.starterClasses.map((c) => ({ ...c, attributes: [...c.attributes], methods: [...c.methods] })));
      setRelationships([...activeProblem.starterRelationships]);
    }
  }, [activeProblem]);

  const handlePracticeRetry = useCallback(() => {
    if (!practiceState) return;
    const problem = practiceState.problem;
    setPracticeState({ problem, timerMinutes: practiceState.timerMinutes, startTime: Date.now(), submitted: false, checkedHints: new Set() });
    setClasses([]);
    setRelationships([]);
    setSidebarMode("palette");
  }, [practiceState]);

  const handleTogglePracticeHint = useCallback((idx: number) => {
    setPracticeState((prev) => {
      if (!prev) return null;
      const next = new Set(prev.checkedHints);
      if (next.has(idx)) { next.delete(idx); } else { next.add(idx); }
      return { ...prev, checkedHints: next };
    });
  }, []);

  // Sequence playback handlers
  const seqPlaybackStart = useCallback(() => { setSeqPlayback({ playing: true, currentStep: 0, speed: 1 }); }, []);
  const seqPlaybackPlay = useCallback(() => { setSeqPlayback((prev) => prev ? { ...prev, playing: true } : null); }, []);
  const seqPlaybackPause = useCallback(() => {
    setSeqPlayback((prev) => prev ? { ...prev, playing: false } : null);
    if (seqPlaybackTimerRef.current) clearTimeout(seqPlaybackTimerRef.current);
  }, []);
  const seqPlaybackStepForward = useCallback(() => {
    setSeqPlayback((prev) => {
      if (!prev || !activeSequence) return prev;
      const total = activeSequence.data.messages.length;
      if (prev.currentStep >= total) return prev;
      return { ...prev, currentStep: prev.currentStep + 1, playing: false };
    });
    if (seqPlaybackTimerRef.current) clearTimeout(seqPlaybackTimerRef.current);
  }, [activeSequence]);
  const seqPlaybackStepBack = useCallback(() => {
    setSeqPlayback((prev) => {
      if (!prev) return prev;
      if (prev.currentStep <= 0) return prev;
      return { ...prev, currentStep: prev.currentStep - 1, playing: false };
    });
    if (seqPlaybackTimerRef.current) clearTimeout(seqPlaybackTimerRef.current);
  }, []);
  const seqPlaybackReplay = useCallback(() => { setSeqPlayback({ playing: true, currentStep: 0, speed: 1 }); }, []);
  const seqPlaybackSetSpeed = useCallback((speed: number) => { setSeqPlayback((prev) => prev ? { ...prev, speed } : null); }, []);
  const seqPlaybackStop = useCallback(() => {
    setSeqPlayback(null);
    if (seqPlaybackTimerRef.current) clearTimeout(seqPlaybackTimerRef.current);
  }, []);

  useEffect(() => {
    if (!seqPlayback || !seqPlayback.playing || !activeSequence) return;
    const total = activeSequence.data.messages.length;
    if (seqPlayback.currentStep >= total) {
      setSeqPlayback((prev) => prev ? { ...prev, playing: false } : null);
      return;
    }
    const baseDelay = 200 + 150;
    const delay = baseDelay / seqPlayback.speed;
    seqPlaybackTimerRef.current = setTimeout(() => {
      setSeqPlayback((prev) => {
        if (!prev || !prev.playing) return prev;
        const next = prev.currentStep + 1;
        if (next >= total) return { ...prev, currentStep: next, playing: false };
        return { ...prev, currentStep: next };
      });
    }, delay);
    return () => { if (seqPlaybackTimerRef.current) clearTimeout(seqPlaybackTimerRef.current); };
  }, [seqPlayback?.playing, seqPlayback?.currentStep, seqPlayback?.speed, activeSequence]);

  // State machine simulation handlers
  const smSimStart = useCallback(() => {
    if (!activeStateMachine) return;
    const initial = activeStateMachine.data.states.find((s) => s.isInitial);
    if (!initial) return;
    const msg = initial.entryAction ? `Entry: ${initial.entryAction}` : null;
    setSmSim({ active: true, currentStateId: initial.id, history: [initial.id], animatingTransition: null, toastMessage: msg });
    if (msg) {
      if (smSimToastTimerRef.current) clearTimeout(smSimToastTimerRef.current);
      smSimToastTimerRef.current = setTimeout(() => { setSmSim((prev) => prev ? { ...prev, toastMessage: null } : null); }, 2000);
    }
  }, [activeStateMachine]);

  const smSimFireTransition = useCallback((transition: StateTransition) => {
    if (!activeStateMachine || !smSim) return;
    const sourceState = activeStateMachine.data.states.find((s) => s.id === transition.from);
    const targetState = activeStateMachine.data.states.find((s) => s.id === transition.to);
    const exitMsg = sourceState?.exitAction ? `Exit: ${sourceState.exitAction}` : null;
    const actionMsg = transition.action ? `Action: ${transition.action}` : null;
    setSmSim((prev) => prev ? { ...prev, animatingTransition: transition.id, toastMessage: exitMsg || actionMsg || null } : null);
    setTimeout(() => {
      const entryMsg = targetState?.entryAction ? `Entry: ${targetState.entryAction}` : null;
      setSmSim((prev) => {
        if (!prev) return null;
        return { ...prev, currentStateId: transition.to, history: [...prev.history, transition.to], animatingTransition: null, toastMessage: entryMsg };
      });
      if (entryMsg) {
        if (smSimToastTimerRef.current) clearTimeout(smSimToastTimerRef.current);
        smSimToastTimerRef.current = setTimeout(() => { setSmSim((prev) => prev ? { ...prev, toastMessage: null } : null); }, 2000);
      }
    }, 600);
  }, [activeStateMachine, smSim]);

  const smSimReset = useCallback(() => {
    if (!activeStateMachine) return;
    const initial = activeStateMachine.data.states.find((s) => s.isInitial);
    if (!initial) return;
    setSmSim({ active: true, currentStateId: initial.id, history: [initial.id], animatingTransition: null, toastMessage: null });
  }, [activeStateMachine]);

  const smSimExit = useCallback(() => {
    setSmSim(null);
    if (smSimToastTimerRef.current) clearTimeout(smSimToastTimerRef.current);
  }, []);

  const smSimAvailableTransitions = useMemo(() => {
    if (!smSim || !activeStateMachine) return [];
    return activeStateMachine.data.transitions.filter((t) => t.from === smSim.currentStateId);
  }, [smSim, activeStateMachine]);

  const handleSelectSequence = useCallback((example: (typeof SEQUENCE_EXAMPLES)[number]) => {
    const run = () => {
      clearAllModes();
      setActiveSequence(example);
      dismissMobileSheet();
    };
    confirmOrRun(run);
  }, [clearAllModes, dismissMobileSheet, confirmOrRun]);

  const handleSelectStateMachine = useCallback((example: (typeof STATE_MACHINE_EXAMPLES)[number]) => {
    const run = () => {
      clearAllModes();
      setActiveStateMachine(example);
      dismissMobileSheet();
    };
    confirmOrRun(run);
  }, [clearAllModes, dismissMobileSheet, confirmOrRun]);

  const handleParseCode = useCallback((parsedClasses: UMLClass[], parsedRels: UMLRelationship[]) => {
    const run = () => {
      pushUndo();
      clearAllModes();
      setClasses(parsedClasses.map((c) => ({ ...c, attributes: [...c.attributes], methods: [...c.methods] })));
      setRelationships([...parsedRels]);
      dismissMobileSheet();
    };
    confirmOrRun(run);
  }, [pushUndo, clearAllModes, dismissMobileSheet, confirmOrRun]);

  const handleAddClass = useCallback((stereotype: UMLClass["stereotype"]) => {
    pushUndo();
    const id = newClassId();
    const nameMap: Record<UMLClass["stereotype"], string> = { class: "NewClass", interface: "INewInterface", abstract: "AbstractBase", enum: "NewEnum" };
    const newCls: UMLClass = {
      id, name: nameMap[stereotype], stereotype,
      attributes: stereotype === "enum"
        ? [{ id: `attr-${crypto.randomUUID().slice(0, 8)}`, name: "VALUE_A", type: "", visibility: "+" }, { id: `attr-${crypto.randomUUID().slice(0, 8)}`, name: "VALUE_B", type: "", visibility: "+" }]
        : [],
      methods: stereotype === "enum" ? [] : [{ id: `meth-${crypto.randomUUID().slice(0, 8)}`, name: "method", returnType: "void", params: [], visibility: "+" }],
      x: 200 + Math.random() * 200, y: 100 + Math.random() * 200,
    };
    setClasses((prev) => [...prev, newCls]);
    setSelectedClassId(id);
    setIsDirty(true);
  }, [pushUndo]);

  const dragUndoPushedRef = useRef(false);
  const handleDragClass = useCallback((id: string, dx: number, dy: number) => {
    if (!dragUndoPushedRef.current) { pushUndo(); dragUndoPushedRef.current = true; }
    setClasses((prev) => prev.map((c) => c.id === id ? { ...c, x: c.x + dx, y: c.y + dy } : c));
  }, [pushUndo]);

  useEffect(() => {
    const handlePointerUp = () => { dragUndoPushedRef.current = false; };
    window.addEventListener("pointerup", handlePointerUp);
    return () => window.removeEventListener("pointerup", handlePointerUp);
  }, []);

  const handleDeleteSelectedClass = useCallback(() => {
    if (!selectedClassId) return;
    pushUndo();
    const diagram = removeClass({ classes, relationships }, selectedClassId);
    setClasses(diagram.classes);
    setRelationships(diagram.relationships);
    setSelectedClassId(null);
    setIsDirty(true);
  }, [selectedClassId, classes, relationships, pushUndo]);

  const handleStartEditName = useCallback((classId: string) => {
    const cls = classes.find((c) => c.id === classId);
    if (!cls) return;
    setEditingNameId(classId);
    setEditingNameValue(cls.name);
  }, [classes]);

  const handleChangeEditName = useCallback((value: string) => { setEditingNameValue(value); }, []);

  const handleCommitEditName = useCallback(() => {
    if (editingNameId && editingNameValue.trim()) {
      pushUndo();
      const diagram = updateClass({ classes, relationships }, editingNameId, { name: editingNameValue.trim() });
      setClasses(diagram.classes);
      setIsDirty(true);
    }
    setEditingNameId(null);
    setEditingNameValue("");
  }, [editingNameId, editingNameValue, classes, relationships, pushUndo]);

  const handleUpdateClassName = useCallback((classId: string, name: string) => { pushUndo(); const d = updateClass({ classes, relationships }, classId, { name }); setClasses(d.classes); setIsDirty(true); }, [classes, relationships, pushUndo]);
  const handleUpdateStereotype = useCallback((classId: string, stereotype: UMLClass["stereotype"]) => { pushUndo(); const d = updateClass({ classes, relationships }, classId, { stereotype }); setClasses(d.classes); setIsDirty(true); }, [classes, relationships, pushUndo]);
  const handleAddAttribute = useCallback((classId: string) => { pushUndo(); const d = addAttribute({ classes, relationships }, classId, { name: "newAttr", type: "string", visibility: "-" }); setClasses(d.classes); setIsDirty(true); }, [classes, relationships, pushUndo]);
  const handleRemoveAttribute = useCallback((classId: string, attrId: string) => { pushUndo(); const d = removeAttribute({ classes, relationships }, classId, attrId); setClasses(d.classes); setIsDirty(true); }, [classes, relationships, pushUndo]);
  const handleUpdateAttributeVisibility = useCallback((classId: string, attrId: string, visibility: "+" | "-" | "#" | "~") => { pushUndo(); setClasses((prev) => prev.map((c) => c.id === classId ? { ...c, attributes: c.attributes.map((a) => a.id === attrId ? { ...a, visibility } : a) } : c)); setIsDirty(true); }, [pushUndo]);
  const handleAddMethod = useCallback((classId: string) => { pushUndo(); const d = addMethod({ classes, relationships }, classId, { name: "newMethod", returnType: "void", params: [], visibility: "+" }); setClasses(d.classes); setIsDirty(true); }, [classes, relationships, pushUndo]);
  const handleRemoveMethod = useCallback((classId: string, methodId: string) => { pushUndo(); const d = removeMethod({ classes, relationships }, classId, methodId); setClasses(d.classes); setIsDirty(true); }, [classes, relationships, pushUndo]);
  const handleUpdateMethodVisibility = useCallback((classId: string, methodId: string, visibility: "+" | "-" | "#" | "~") => { pushUndo(); setClasses((prev) => prev.map((c) => c.id === classId ? { ...c, methods: c.methods.map((m) => m.id === methodId ? { ...m, visibility } : m) } : c)); setIsDirty(true); }, [pushUndo]);

  const handleCreateRelationship = useCallback(
    (sourceId: string, targetId: string, type: UMLRelationshipType, label: string, srcCard: string, tgtCard: string) => {
      pushUndo();
      const diagram = addRelationship({ classes, relationships }, { source: sourceId, target: targetId, type, label: label || undefined, sourceCardinality: srcCard || undefined, targetCardinality: tgtCard || undefined });
      setClasses(diagram.classes);
      setRelationships(diagram.relationships);
      setIsDirty(true);
    },
    [classes, relationships, pushUndo],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) { e.preventDefault(); handleUndo(); return; }
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey) || (e.key === "Z" && e.shiftKey))) { e.preventDefault(); handleRedo(); return; }
      if ((e.key === "Delete" || e.key === "Backspace") && selectedClassId) { e.preventDefault(); handleDeleteSelectedClass(); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedClassId, handleDeleteSelectedClass, handleUndo, handleRedo]);

  const selectedClass = useMemo(() => classes.find((c) => c.id === selectedClassId) ?? null, [classes, selectedClassId]);
  const selectedMessage = useMemo(() => activeSequence?.data.messages.find((m) => m.id === selectedMessageId) ?? null, [activeSequence, selectedMessageId]);
  const selectedState = useMemo(() => activeStateMachine?.data.states.find((s) => s.id === selectedStateId) ?? null, [activeStateMachine, selectedStateId]);

  const canvasTitle = useMemo(() => {
    if (activeStateMachine) return activeStateMachine.name;
    if (activeSequence) return activeSequence.name;
    if (activePattern) return `${activePattern.name} Pattern`;
    if (activeDemo) return `${activeDemo.principle}: ${activeDemo.name} (${solidView === "before" ? "Before" : "After"})`;
    if (activeProblem && practiceState?.submitted) return `${activeProblem.name} (Reference Solution)`;
    if (activeProblem && practiceState) return `${activeProblem.name} (Practice Mode)`;
    if (activeProblem) return activeProblem.name;
    return null;
  }, [activePattern, activeDemo, activeProblem, activeSequence, activeStateMachine, solidView, practiceState]);

  // Export handlers
  const handleExportSVG = useCallback(() => {
    const svgEl = document.querySelector<SVGSVGElement>("[data-lld-canvas-svg]");
    if (!svgEl) return;
    const clone = svgEl.cloneNode(true) as SVGSVGElement;
    const titleEl = document.createElementNS("http://www.w3.org/2000/svg", "title");
    titleEl.textContent = canvasTitle ?? "Class Diagram";
    clone.prepend(titleEl);
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const svgData = new XMLSerializer().serializeToString(clone);
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(canvasTitle ?? "diagram").replace(/[^a-zA-Z0-9-_ ]/g, "").replace(/\s+/g, "-")}.svg`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setExportDropdownOpen(false);
  }, [canvasTitle]);

  const handleExportPNG = useCallback(() => {
    const svgEl = document.querySelector<SVGSVGElement>("[data-lld-canvas-svg]");
    if (!svgEl) return;
    const clone = svgEl.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const svgData = new XMLSerializer().serializeToString(clone);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const scale = 2;
      const cvs = document.createElement("canvas");
      cvs.width = img.naturalWidth * scale; cvs.height = img.naturalHeight * scale;
      const ctx = cvs.getContext("2d");
      if (!ctx) { URL.revokeObjectURL(url); return; }
      ctx.scale(scale, scale); ctx.drawImage(img, 0, 0);
      cvs.toBlob((pngBlob) => {
        if (!pngBlob) return;
        const pngUrl = URL.createObjectURL(pngBlob);
        const a = document.createElement("a");
        a.href = pngUrl;
        a.download = `${(canvasTitle ?? "diagram").replace(/[^a-zA-Z0-9-_ ]/g, "").replace(/\s+/g, "-")}.png`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(pngUrl);
      }, "image/png");
      URL.revokeObjectURL(url);
    };
    img.src = url;
    setExportDropdownOpen(false);
  }, [canvasTitle]);

  // Presentation mode
  const presentationCategoryPatterns = useMemo(() => { if (!activePattern) return []; return getPatternsByCategory(activePattern.category); }, [activePattern]);
  const handleEnterPresentation = useCallback(() => { if (!activePattern) return; const idx = presentationCategoryPatterns.findIndex((p) => p.id === activePattern.id); setPresentationPatternIdx(idx >= 0 ? idx : 0); setPresentationMode(true); }, [activePattern, presentationCategoryPatterns]);
  const handleExitPresentation = useCallback(() => { setPresentationMode(false); }, []);
  const handlePresentationPrev = useCallback(() => {
    if (presentationCategoryPatterns.length === 0) return;
    setPresentationPatternIdx((prev) => {
      const next = (prev - 1 + presentationCategoryPatterns.length) % presentationCategoryPatterns.length;
      const pattern = presentationCategoryPatterns[next];
      setActivePattern(pattern);
      setClasses(pattern.classes.map((c) => ({ ...c, attributes: [...c.attributes], methods: [...c.methods] })));
      setRelationships([...pattern.relationships]);
      setSelectedClassId(null);
      return next;
    });
  }, [presentationCategoryPatterns]);
  const handlePresentationNext = useCallback(() => {
    if (presentationCategoryPatterns.length === 0) return;
    setPresentationPatternIdx((prev) => {
      const next = (prev + 1) % presentationCategoryPatterns.length;
      const pattern = presentationCategoryPatterns[next];
      setActivePattern(pattern);
      setClasses(pattern.classes.map((c) => ({ ...c, attributes: [...c.attributes], methods: [...c.methods] })));
      setRelationships([...pattern.relationships]);
      setSelectedClassId(null);
      return next;
    });
  }, [presentationCategoryPatterns]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "Escape" && presentationMode) { e.preventDefault(); handleExitPresentation(); return; }
      if (presentationMode && e.key === "ArrowLeft") { e.preventDefault(); handlePresentationPrev(); return; }
      if (presentationMode && e.key === "ArrowRight") { e.preventDefault(); handlePresentationNext(); return; }
      if (e.key === "f" && !e.ctrlKey && !e.metaKey && !e.altKey && activePattern) { e.preventDefault(); if (presentationMode) { handleExitPresentation(); } else { handleEnterPresentation(); } return; }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [presentationMode, handleExitPresentation, handlePresentationPrev, handlePresentationNext, handleEnterPresentation, activePattern]);

  useEffect(() => {
    if (!exportDropdownOpen) return;
    const handleClick = () => setExportDropdownOpen(false);
    const timer = setTimeout(() => { window.addEventListener("click", handleClick); }, 0);
    return () => { clearTimeout(timer); window.removeEventListener("click", handleClick); };
  }, [exportDropdownOpen]);

  const isSequenceMode = activeSequence !== null;
  const isStateMachineMode = activeStateMachine !== null;

  // ── Empty State CTA Handlers ──────────────────────────

  const handleLoadObserver = useCallback(() => {
    const observer = DESIGN_PATTERNS.find((p) => p.id === "observer");
    if (observer) handleSelectPattern(observer);
  }, [handleSelectPattern]);

  // ── Streak & Exploration Tracking ─────────────────────

  // Track exploration after 3 seconds of viewing a pattern/problem/demo
  const explorationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (explorationTimerRef.current) clearTimeout(explorationTimerRef.current);

    let featureKey: string | null = null;
    if (activePattern) featureKey = `pattern-${activePattern.id}`;
    else if (activeDemo) featureKey = `solid-${activeDemo.principle.toLowerCase()}`;
    else if (activeProblem) featureKey = `problem-${activeProblem.id}`;
    else if (activeSequence) featureKey = `sequence-${activeSequence.id}`;
    else if (activeStateMachine) featureKey = `state-machine-${activeStateMachine.id}`;

    if (!featureKey) return;

    const key = featureKey;
    explorationTimerRef.current = setTimeout(() => {
      trackLLDExploration(key);
    }, 3000);

    return () => {
      if (explorationTimerRef.current) clearTimeout(explorationTimerRef.current);
    };
  }, [activePattern, activeDemo, activeProblem, activeSequence, activeStateMachine]);

  // ── JSX Assembly ───────────────────────────────────────

  const sidebar = (
    <LLDSidebar
      mode={sidebarMode} onModeChange={setSidebarMode}
      activePatternId={activePattern?.id ?? null} onSelectPattern={handleSelectPattern}
      onAddClass={handleAddClass}
      activeDemoId={activeDemo?.id ?? null} onSelectDemo={handleSelectDemo}
      activeProblemId={activeProblem?.id ?? null} onSelectProblem={handleSelectProblem}
      onStartPractice={handleStartPractice} practiceActive={practiceState !== null}
      activeSequenceId={activeSequence?.id ?? null} onSelectSequence={handleSelectSequence}
      activeStateMachineId={activeStateMachine?.id ?? null} onSelectStateMachine={handleSelectStateMachine}
      onParseCode={handleParseCode}
    />
  );

  const canvasErrorFallback = useMemo(() => (
    <div className="flex h-full w-full items-center justify-center bg-background">
      <div className="flex max-w-xs flex-col items-center gap-4 rounded-xl border border-red-500/30 bg-red-500/5 px-8 py-10 text-center backdrop-blur-sm shadow-[0_0_20px_rgba(239,68,68,0.08)]">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
          <AlertTriangle className="h-6 w-6 text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
        </div>
        <h3 className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-sm font-semibold text-transparent">Something went wrong</h3>
        <p className="text-xs text-foreground-subtle">The canvas encountered an error. Click Reset to start fresh.</p>
        <button onClick={clearAllModes} className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-[0_0_12px_rgba(var(--primary-rgb),0.4)] transition-all hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(var(--primary-rgb),0.55)]">
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </button>
      </div>
    </div>
  ), [clearAllModes]);

  const canvas = (
    <ErrorBoundary label="LLDCanvas" fallback={canvasErrorFallback}>
      <div className="relative flex h-full w-full flex-col">
        {practiceState && !practiceState.submitted && (
          <PracticeTimerBar startTime={practiceState.startTime} timerMinutes={practiceState.timerMinutes} onSubmit={handlePracticeSubmit} onCancel={handlePracticeCancel} />
        )}
        <div className="relative flex-1">
        {isStateMachineMode ? (
          <div className="flex h-full flex-col">
            <div className="flex-1">
              <StateMachineCanvas data={activeStateMachine.data} title={canvasTitle} selectedStateId={selectedStateId} onSelectState={setSelectedStateId} simState={smSim} />
            </div>
            {!smSim ? (
              <div className="flex items-center justify-center border-t border-border/30 bg-elevated/50 px-4 py-2 backdrop-blur-sm">
                <button onClick={smSimStart} className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[11px] font-semibold text-primary-foreground shadow-[0_0_12px_rgba(var(--primary-rgb),0.4)] transition-all hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(var(--primary-rgb),0.55)]">
                  <Play className="h-3.5 w-3.5" /> Simulate
                </button>
              </div>
            ) : (
              <SimTransitionPanel transitions={smSimAvailableTransitions} states={activeStateMachine.data.states} onFireTransition={smSimFireTransition} onReset={smSimReset} onExit={smSimExit} history={smSim.history} />
            )}
            {smSim?.toastMessage && <SimToast message={smSim.toastMessage} />}
          </div>
        ) : isSequenceMode ? (
          <div className="relative h-full">
            <SequenceDiagramCanvas data={activeSequence.data} title={canvasTitle} selectedMessageId={selectedMessageId} onSelectMessage={setSelectedMessageId} playbackStep={seqPlayback?.currentStep ?? null} />
            {seqPlayback ? (
              <SequencePlaybackToolbar state={seqPlayback} totalMessages={activeSequence.data.messages.length} onPlay={seqPlaybackPlay} onPause={seqPlaybackPause} onStepForward={seqPlaybackStepForward} onStepBack={seqPlaybackStepBack} onReplay={seqPlaybackReplay} onSpeedChange={seqPlaybackSetSpeed} onStop={seqPlaybackStop} />
            ) : (
              <div className="absolute bottom-3 right-3 z-10">
                <button onClick={seqPlaybackStart} className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[11px] font-semibold text-primary-foreground shadow-[0_0_12px_rgba(var(--primary-rgb),0.4)] transition-all hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(var(--primary-rgb),0.55)]">
                  <Play className="h-3.5 w-3.5" /> Playback
                </button>
              </div>
            )}
          </div>
        ) : screenReaderMode ? (
          <ScreenReaderView title={canvasTitle} classes={classes} relationships={relationships} />
        ) : (
          <LLDCanvas classes={classes} relationships={relationships} selectedClassId={selectedClassId} onSelectClass={setSelectedClassId} onDragClass={handleDragClass} patternName={canvasTitle} editingNameId={editingNameId} editingNameValue={editingNameValue} onStartEditName={handleStartEditName} onChangeEditName={handleChangeEditName} onCommitEditName={handleCommitEditName} hoveredClassId={hoveredClassId} onHoverClass={setHoveredClassId} onCreateRelationship={handleCreateRelationship} onLoadObserver={handleLoadObserver} />
        )}
        {!isSequenceMode && !isStateMachineMode && (
          <div className="absolute right-3 top-12 z-10 flex items-center gap-1 rounded-xl border border-border/30 bg-background/60 px-1.5 py-1 shadow-[0_0_15px_rgba(var(--primary-rgb),0.06)] backdrop-blur-md">
            <button onClick={handleUndo} disabled={undoCount === 0} className="flex h-7 w-7 items-center justify-center rounded-full bg-background/80 text-foreground-muted transition-colors hover:bg-accent hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed" title="Undo (Ctrl+Z)" aria-label="Undo"><Undo2 className="h-3.5 w-3.5" /></button>
            <button onClick={handleRedo} disabled={redoCount === 0} className="flex h-7 w-7 items-center justify-center rounded-full bg-background/80 text-foreground-muted transition-colors hover:bg-accent hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed" title="Redo (Ctrl+Shift+Z)" aria-label="Redo"><Redo2 className="h-3.5 w-3.5" /></button>
            <div className="mx-0.5 h-4 w-px bg-border/30" />
            <button onClick={() => setScreenReaderMode((p) => !p)} className={cn("flex h-7 w-7 items-center justify-center rounded-full transition-colors", screenReaderMode ? "bg-primary/10 text-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.3)]" : "bg-background/80 text-foreground-muted hover:bg-accent hover:text-foreground")} title={screenReaderMode ? "Switch to visual canvas" : "Switch to accessible text view"} aria-label={screenReaderMode ? "Switch to visual canvas" : "Switch to accessible text view"}><Accessibility className="h-3.5 w-3.5" /></button>
          </div>
        )}
        {canvasTitle && (
          <div className="absolute right-3 top-1.5 z-10 flex items-center gap-1.5">
            {activePattern && !isSequenceMode && !isStateMachineMode && (
              <button onClick={handleEnterPresentation} className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground shadow-[0_0_12px_rgba(var(--primary-rgb),0.4)] transition-all hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(var(--primary-rgb),0.55)]" title="Presentation mode (F)">
                <Maximize2 className="h-3.5 w-3.5" /><span>Present</span>
              </button>
            )}
            {!isSequenceMode && !isStateMachineMode && classes.length > 0 && (
              <div className="relative">
                <button onClick={() => setExportDropdownOpen((p) => !p)} className="flex items-center gap-1.5 rounded-xl border border-border/30 bg-background/60 px-2.5 py-1.5 text-[11px] font-medium text-foreground-muted backdrop-blur-sm transition-all hover:bg-accent hover:text-foreground" title="Export diagram">
                  <Download className="h-3.5 w-3.5" /><span>Export</span>
                </button>
                {exportDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1 w-40 rounded-xl border border-border/30 bg-elevated/50 shadow-[0_0_20px_rgba(0,0,0,0.3)] backdrop-blur-md">
                    <button onClick={handleExportSVG} className="flex w-full items-center gap-2 rounded-t-xl px-3 py-2 text-left text-[11px] font-medium text-foreground-muted transition-colors hover:bg-accent hover:text-foreground">Export as SVG</button>
                    <button onClick={handleExportPNG} className="flex w-full items-center gap-2 rounded-b-xl px-3 py-2 text-left text-[11px] font-medium text-foreground-muted transition-colors hover:bg-accent hover:text-foreground">Export as PNG</button>
                  </div>
                )}
              </div>
            )}
            <button onClick={handleShare} className="flex h-8 w-8 items-center justify-center rounded-full bg-background/80 text-foreground-muted transition-colors hover:bg-accent hover:text-foreground" title="Copy shareable link">
              {shareToast ? (<Check className="h-3.5 w-3.5 text-green-400 drop-shadow-[0_0_6px_rgba(74,222,128,0.5)]" />) : (<Share2 className="h-3.5 w-3.5" />)}
            </button>
          </div>
        )}
        </div>
      </div>
    </ErrorBoundary>
  );

  const properties = isStateMachineMode ? (
    <StateMachineProperties example={activeStateMachine} selectedState={selectedState} />
  ) : isSequenceMode ? (
    <SequenceProperties example={activeSequence} selectedMessage={selectedMessage} />
  ) : activeDemo ? (
    <LLDSOLIDProperties demo={activeDemo} solidView={solidView} onToggleView={handleToggleSolidView} />
  ) : activeProblem ? (
    <LLDProblemProperties problem={activeProblem} />
  ) : (
    <LLDProperties pattern={activePattern} selectedClass={selectedClass} onDeleteClass={selectedClass ? handleDeleteSelectedClass : undefined} onUpdateClassName={handleUpdateClassName} onUpdateStereotype={handleUpdateStereotype} onAddAttribute={handleAddAttribute} onRemoveAttribute={handleRemoveAttribute} onUpdateAttributeVisibility={handleUpdateAttributeVisibility} onAddMethod={handleAddMethod} onRemoveMethod={handleRemoveMethod} onUpdateMethodVisibility={handleUpdateMethodVisibility} />
  );

  const isPracticeSubmitted = practiceState?.submitted === true;

  const explanationPanel = isPracticeSubmitted && activeProblem ? (
    <PracticeAssessment problem={practiceState!.problem} checkedHints={practiceState!.checkedHints} onToggleHint={handleTogglePracticeHint} onRetry={handlePracticeRetry} onExit={handlePracticeCancel} />
  ) : isStateMachineMode ? (
    <StateMachineBottomPanel example={activeStateMachine} />
  ) : isSequenceMode ? (
    <SequenceBottomPanel example={activeSequence} />
  ) : activeDemo ? (
    <LLDSOLIDBottomPanel demo={activeDemo} solidView={solidView} classCount={classes.length} relationshipCount={relationships.length} />
  ) : activeProblem ? (
    <LLDProblemBottomPanel problem={activeProblem} classCount={classes.length} relationshipCount={relationships.length} />
  ) : (
    <LLDBottomPanel pattern={activePattern} classCount={classes.length} relationshipCount={relationships.length} />
  );

  const codePanel = !isSequenceMode && !isStateMachineMode && !isPracticeSubmitted && classes.length > 0 ? (
    <GeneratedCodePanel classes={classes} relationships={relationships} />
  ) : null;

  const bottomPanel = <LLDBottomPanelTabs explanationPanel={explanationPanel} codePanel={codePanel} />;

  // Presentation mode overlay
  const presentationOverlay = presentationMode && activePattern ? (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-6 py-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-primary/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.3)]">{CATEGORY_LABELS[activePattern.category]}</span>
          <h1 className="bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-lg font-bold text-transparent">{activePattern.name} Pattern</h1>
          <span className="text-sm text-white/40">{presentationPatternIdx + 1} / {presentationCategoryPatterns.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-white/30">Arrow keys to navigate | ESC or F to exit</span>
          <button onClick={handleExitPresentation} className="flex items-center gap-1.5 rounded-xl border border-border/30 bg-background/60 px-3 py-1.5 text-[11px] font-medium text-white/70 backdrop-blur-sm transition-all hover:bg-white/10 hover:text-white"><X className="h-3.5 w-3.5" />Exit</button>
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center px-12 pb-12">
        <div className="h-full w-full overflow-hidden rounded-xl border border-border/30 bg-background shadow-[0_0_40px_rgba(var(--primary-rgb),0.08)]" style={{ transform: "scale(1)", fontSize: "150%" }}>
          <LLDCanvas classes={classes} relationships={relationships} selectedClassId={null} onSelectClass={() => {}} onDragClass={() => {}} patternName={activePattern.name + " Pattern"} editingNameId={null} editingNameValue="" onStartEditName={() => {}} onChangeEditName={() => {}} onCommitEditName={() => {}} hoveredClassId={null} onHoverClass={() => {}} onCreateRelationship={() => {}} />
        </div>
      </div>
      <div className="absolute left-4 top-1/2 -translate-y-1/2">
        <button onClick={handlePresentationPrev} className="flex h-12 w-12 items-center justify-center rounded-full border border-border/30 bg-background/60 text-white/60 backdrop-blur-md transition-all hover:bg-white/10 hover:text-white hover:shadow-[0_0_12px_rgba(var(--primary-rgb),0.3)]" title="Previous pattern (Left arrow)"><ChevronLeft className="h-6 w-6" /></button>
      </div>
      <div className="absolute right-4 top-1/2 -translate-y-1/2">
        <button onClick={handlePresentationNext} className="flex h-12 w-12 items-center justify-center rounded-full border border-border/30 bg-background/60 text-white/60 backdrop-blur-md transition-all hover:bg-white/10 hover:text-white hover:shadow-[0_0_12px_rgba(var(--primary-rgb),0.3)]" title="Next pattern (Right arrow)"><ChevronRight className="h-6 w-6" /></button>
      </div>
      <div className="border-t border-white/10 bg-white/5 px-8 py-4 backdrop-blur-md">
        <p className="text-center text-sm leading-relaxed text-white/60">{activePattern.description}</p>
      </div>
    </div>
  ) : null;

  const confirmDialog = (
    <ConfirmDialog
      open={pendingAction !== null}
      title="Discard unsaved changes?"
      description="You have unsaved edits on the canvas. Switching now will discard all changes. This cannot be undone."
      confirmLabel="Discard"
      cancelLabel="Keep Editing"
      variant="destructive"
      onConfirm={handleConfirmDiscard}
      onCancel={handleCancelDiscard}
    />
  );

  return { sidebar, canvas, properties, bottomPanel, mockOverlay: presentationOverlay, confirmDialog };
}
