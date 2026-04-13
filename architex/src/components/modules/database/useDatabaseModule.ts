"use client";

import {
  memo,
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
  createElement,
  Fragment,
} from "react";
import { Database } from "lucide-react";
import { DatabaseTour, resetDatabaseTour } from "./DatabaseTour";
import { useUIStore } from "@/stores/ui-store";
import { useProgressStore } from "@/stores/progress-store";
import { toast } from "@/components/ui/toast";
import type {
  EREntity,
  ERAttribute,
  ERRelationship,
  FunctionalDependency,
  IsolationLevel,
  BTreeNode,
  BTreeStep,
  QueryPlanNode,
  HashIndexState,
  HashIndexStep,
  LSMVizState,
  LSMVizStep,
  MVCCStep,
  JoinAlgorithm,
  JoinState,
  JoinStep,
  ARIESStep,
} from "@/lib/database";
import {
  computeClosure,
  findCandidateKeys,
  determineNormalForm,
  decomposeTo3NF,
  simulateIsolation,
  getCompareResult,
  getPredictionPrompt,
  simulateWriteSkew,
  BTreeViz,
  generateQueryPlan,
  HashIndexViz,
  LSMTreeViz,
  generateSQL,
  MVCCViz,
  JoinViz,
  erToNoSQL,
  ARIESViz,
} from "@/lib/database";
import type { TransactionStep, CompareScenario, CompareResult, PredictionPrompt, SampleERDiagram, NormalizationResult } from "@/lib/database";

// ── Canvas component imports ─────────────────────────────────
import { BPlusTreeViz } from "@/components/database/BPlusTreeViz";
import ERDiagramCanvas from "./canvases/ERDiagramCanvas";
import NormalizationCanvas from "./canvases/NormalizationCanvas";
import TransactionCanvas from "./canvases/TransactionCanvas";
import BTreeCanvas from "./canvases/BTreeCanvas";
import HashIndexCanvas from "./canvases/HashIndexCanvas";
import QueryPlanCanvas from "./canvases/QueryPlanCanvas";
import LSMCanvas from "./canvases/LSMCanvas";
import ACIDCanvas from "./canvases/ACIDCanvas";
import { getStepsForProperty } from "./canvases/ACIDCanvas";
import type { ACIDProperty } from "./canvases/ACIDCanvas";
import CAPTheoremCanvas from "./canvases/CAPTheoremCanvas";
import { getCPPartitionSteps, getAPPartitionSteps } from "./canvases/CAPTheoremCanvas";
import type { CAPDatabase } from "./canvases/CAPTheoremCanvas";
import MVCCCanvas from "./canvases/MVCCCanvas";
import RowColumnCanvas from "./canvases/RowColumnCanvas";
import type { RowColumnQueryType } from "./canvases/RowColumnCanvas";
import SQLvsNoSQLCanvas from "./canvases/SQLvsNoSQLCanvas";
import type { SQLvsNoSQLUseCase } from "./canvases/SQLvsNoSQLCanvas";
import IndexAntiPatternsCanvas from "./canvases/IndexAntiPatternsCanvas";
import type { AntiPatternId } from "./canvases/IndexAntiPatternsCanvas";
import CachingPatternsCanvas from "./canvases/CachingPatternsCanvas";
import { getStepsForPattern as getCachingSteps } from "./canvases/CachingPatternsCanvas";
import type { CachingPatternType } from "./canvases/CachingPatternsCanvas";
import JoinAlgorithmsCanvas from "./canvases/JoinAlgorithmsCanvas";
import ARIESCanvas from "./canvases/ARIESCanvas";
import StarSnowflakeCanvas from "./canvases/StarSnowflakeCanvas";
import { getStepsForSchema as getStarSnowflakeSteps } from "./canvases/StarSnowflakeCanvas";
import type { SchemaType } from "./canvases/StarSnowflakeCanvas";
import ConnectionPoolingCanvas from "./canvases/ConnectionPoolingCanvas";
import { getStepsForPooling as getConnPoolSteps } from "./canvases/ConnectionPoolingCanvas";
import type { PoolingMode } from "./canvases/ConnectionPoolingCanvas";

// ── Panel component imports ──────────────────────────────────
import DatabaseSidebar from "./DatabaseSidebar";
import DatabaseProperties from "./DatabaseProperties";
import DatabaseBottomPanel from "./DatabaseBottomPanel";

// ── Type Exports ─────────────────────────────────────────────

export type DatabaseMode =
  | "er-diagram"
  | "normalization"
  | "transaction-isolation"
  | "btree-index"
  | "bplus-tree"
  | "hash-index"
  | "query-plans"
  | "lsm-tree"
  | "acid"
  | "cap-theorem"
  | "mvcc"
  | "row-vs-column"
  | "sql-vs-nosql"
  | "index-anti-patterns"
  | "caching-patterns"
  | "join-algorithms"
  | "aries-recovery"
  | "star-snowflake"
  | "connection-pooling";

// ── ID Generator ──────────────────────────────────────────────

function nextId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

// ── Share State Helpers ───────────────────────────────────────

/** Recursively collect all keys from a BTreeNode into a flat sorted array. */
function collectBTreeKeys(node: BTreeNode): number[] {
  const keys = [...node.keys];
  for (const child of node.children) {
    keys.push(...collectBTreeKeys(child));
  }
  return keys.sort((a, b) => a - b);
}

/** Collect all key-value entries from a HashIndexState. */
function collectHashEntries(state: HashIndexState): Array<[string, string]> {
  const entries: Array<[string, string]> = [];
  for (const bucket of state.buckets) {
    let current: typeof bucket | undefined = bucket;
    while (current) {
      for (const entry of current.entries) {
        entries.push([entry.key, entry.value]);
      }
      current = current.overflow;
    }
  }
  return entries;
}

/** Collect all written key=value strings from an LSMVizState. */
function collectLsmEntries(state: LSMVizState): Array<[string, string]> {
  const entries: Array<[string, string]> = [];
  // Memtable entries are stored as "key=value" strings
  for (const item of state.memtable) {
    const [k, v] = item.split("=");
    if (k) entries.push([k, v ?? k]);
  }
  // Also include immutable memtable if present
  if (state.immutableMemtable) {
    for (const item of state.immutableMemtable) {
      const [k, v] = item.split("=");
      if (k) entries.push([k, v ?? k]);
    }
  }
  // Include SSTable entries from all levels
  for (const level of state.levels) {
    for (const sst of level.sstables) {
      for (const key of sst.keys) {
        entries.push([key, key]);
      }
    }
  }
  return entries;
}

/** Encode an object as a URL-safe base64 string. */
function encodeShareData(data: Record<string, unknown>): string {
  try {
    return btoa(JSON.stringify(data));
  } catch {
    return "";
  }
}

/** Decode a base64 share data string back to an object. Returns null on failure. */
function decodeShareData(encoded: string): Record<string, unknown> | null {
  try {
    const json = atob(encoded);
    const data = JSON.parse(json);
    if (typeof data !== "object" || data === null || Array.isArray(data)) return null;
    return data as Record<string, unknown>;
  } catch {
    return null;
  }
}

// ── Default ER State ──────────────────────────────────────────

function defaultEntities(): EREntity[] {
  return [
    {
      id: nextId("entity"),
      name: "Student",
      isWeak: false,
      attributes: [
        { id: nextId("attr"), name: "student_id", isPK: true, isFK: false, type: "INT" },
        { id: nextId("attr"), name: "name", isPK: false, isFK: false, type: "VARCHAR" },
        { id: nextId("attr"), name: "email", isPK: false, isFK: false, type: "VARCHAR" },
      ],
      x: 120,
      y: 150,
    },
    {
      id: nextId("entity"),
      name: "Course",
      isWeak: false,
      attributes: [
        { id: nextId("attr"), name: "course_id", isPK: true, isFK: false, type: "INT" },
        { id: nextId("attr"), name: "title", isPK: false, isFK: false, type: "VARCHAR" },
        { id: nextId("attr"), name: "credits", isPK: false, isFK: false, type: "INT" },
      ],
      x: 520,
      y: 150,
    },
  ];
}

function defaultRelationships(e1Id: string, e2Id: string): ERRelationship[] {
  return [
    {
      id: nextId("rel"),
      name: "enrolls_in",
      entity1Id: e1Id,
      entity2Id: e2Id,
      cardinality: "M:N",
    },
  ];
}

// ── Persistence ──────────────────────────────────────────────

const STORAGE_KEY = "architex_db_state";

interface PersistedDBState {
  entities?: EREntity[];
  relationships?: ERRelationship[];
  activeMode?: DatabaseMode;
  normRelation?: string;
  normAttributes?: string;
  normFdsText?: string;
}

function loadPersistedState(): PersistedDBState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as PersistedDBState;
    // Basic validation: must be a non-null object
    if (typeof data !== "object" || data === null || Array.isArray(data)) return null;
    if (data.entities && !Array.isArray(data.entities)) return null;
    if (data.relationships && !Array.isArray(data.relationships)) return null;
    return data;
  } catch {
    // Corrupt data — fall back to defaults
    return null;
  }
}

// ── Module Hook ───────────────────────────────────────────────

export function useDatabaseModule(initialMode?: DatabaseMode) {
  // Load persisted state once at mount (synchronous, before first render)
  const persistedRef = useRef<PersistedDBState | null>(null);
  if (persistedRef.current === null) {
    persistedRef.current = loadPersistedState() ?? {};
  }
  const persisted = persistedRef.current;

  const [activeMode, setActiveMode] = useState<DatabaseMode>(
    initialMode ?? (persisted.activeMode as DatabaseMode | undefined) ?? "er-diagram",
  );
  const [logEntries, setLogEntries] = useState<string[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [animationSpeed, setAnimationSpeed] = useState(800);
  const [smartSpeed, setSmartSpeed] = useState(false);


  // -- DBL-056: Unified Challenge Mode State
  const [challengeModeEnabled, setChallengeModeEnabled] = useState(false);

  // ── DBL-178: Database Tour State ────────────────────────────
  const [tourForceShow, setTourForceShow] = useState(false);
  const handleTourReplay = useCallback(() => {
    resetDatabaseTour();
    setTourForceShow(true);
  }, []);
  const handleTourComplete = useCallback(() => {
    setTourForceShow(false);
  }, []);

  // ── DBL-060: Presentation Mode State ────────────────────────
  const [presentationMode, setPresentationMode] = useState(false);
  const [presentationPlaying, setPresentationPlaying] = useState(false);
  const presentationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup all timers on unmount (timerRef cleaned here; btreeTimerRef, hashTimerRef, lsmTimerRef below)
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  // ── DBL-141: Streak Tracking — update streak on mount ──────
  const updateStreak = useProgressStore((s) => s.updateStreak);
  const addXP = useProgressStore((s) => s.addXP);
  useEffect(() => {
    updateStreak();
  }, [updateStreak]);

  const log = useCallback((msg: string) => {
    setLogEntries((prev) => [...prev, msg]);
  }, []);

  // ── ER Diagram State ────────────────────────────────────────
  const initialEntities = useMemo(() => defaultEntities(), []);
  const [entities, setEntities] = useState<EREntity[]>(
    persisted.entities && persisted.entities.length > 0
      ? persisted.entities
      : initialEntities,
  );
  const [relationships, setRelationships] = useState<ERRelationship[]>(() => {
    if (persisted.relationships && persisted.relationships.length > 0) {
      return persisted.relationships;
    }
    return initialEntities.length >= 2
      ? defaultRelationships(initialEntities[0].id, initialEntities[1].id)
      : [];
  });
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);

  const selectedEntity = useMemo(
    () => entities.find((e) => e.id === selectedEntityId) ?? null,
    [entities, selectedEntityId],
  );

  // ── DBL-033: Undo/Redo Stack for ER Diagram ──────────────
  const MAX_UNDO = 20;
  const undoStackRef = useRef<Array<{ entities: EREntity[]; relationships: ERRelationship[] }>>([]);
  const redoStackRef = useRef<Array<{ entities: EREntity[]; relationships: ERRelationship[] }>>([]);
  // Track whether a drag is in progress to suppress per-pixel snapshots
  const isDraggingRef = useRef(false);
  // Counter to trigger re-render when undo/redo stack sizes change (for button disabled state)
  const [undoRedoVersion, setUndoRedoVersion] = useState(0);

  const pushUndoSnapshot = useCallback(() => {
    undoStackRef.current.push({
      entities: JSON.parse(JSON.stringify(entities)),
      relationships: JSON.parse(JSON.stringify(relationships)),
    });
    if (undoStackRef.current.length > MAX_UNDO) {
      undoStackRef.current.shift();
    }
    // Clear redo stack on new mutation
    redoStackRef.current = [];
    setUndoRedoVersion((v) => v + 1);
  }, [entities, relationships]);

  const handleUndo = useCallback(() => {
    const snapshot = undoStackRef.current.pop();
    if (!snapshot) return;
    // Push current state to redo stack
    redoStackRef.current.push({
      entities: JSON.parse(JSON.stringify(entities)),
      relationships: JSON.parse(JSON.stringify(relationships)),
    });
    setEntities(snapshot.entities);
    setRelationships(snapshot.relationships);
    setUndoRedoVersion((v) => v + 1);
    log("Undo");
  }, [entities, relationships, log]);

  const handleRedo = useCallback(() => {
    const snapshot = redoStackRef.current.pop();
    if (!snapshot) return;
    // Push current state to undo stack
    undoStackRef.current.push({
      entities: JSON.parse(JSON.stringify(entities)),
      relationships: JSON.parse(JSON.stringify(relationships)),
    });
    setEntities(snapshot.entities);
    setRelationships(snapshot.relationships);
    setUndoRedoVersion((v) => v + 1);
    log("Redo");
  }, [entities, relationships, log]);

  // Drag batching: snapshot on drag start, no snapshot per-pixel move
  const handleDragStart = useCallback(() => {
    isDraggingRef.current = true;
    pushUndoSnapshot();
  }, [pushUndoSnapshot]);

  const handleDragEnd = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  // Keyboard shortcuts: Ctrl+Z (undo), Ctrl+Shift+Z (redo)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (activeMode !== "er-diagram") return;
      const isCtrlOrMeta = e.ctrlKey || e.metaKey;
      if (isCtrlOrMeta && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if (isCtrlOrMeta && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        handleRedo();
      } else if (isCtrlOrMeta && e.key === "y") {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeMode, handleUndo, handleRedo]);

  // ── DBL-049: Export as PNG ────────────────────────────────
  const handleExport = useCallback(() => {
    // Find the SVG element in the current canvas (works for ER, B-Tree, Hash, etc.)
    const svgEl = document.querySelector<SVGSVGElement>('svg[role="img"]');
    if (!svgEl) {
      log("Error: no SVG canvas found to export");
      return;
    }

    // Clone SVG and resolve CSS variables to static values for export
    const clone = svgEl.cloneNode(true) as SVGSVGElement;
    const computed = getComputedStyle(document.documentElement);

    // Set explicit width/height on the cloned SVG
    const bbox = svgEl.getBoundingClientRect();
    clone.setAttribute("width", String(Math.ceil(bbox.width)));
    clone.setAttribute("height", String(Math.ceil(bbox.height)));

    // Add a background rect so export isn't transparent
    const bgRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    bgRect.setAttribute("width", "100%");
    bgRect.setAttribute("height", "100%");
    bgRect.setAttribute("fill", computed.getPropertyValue("--background").trim() || "#0f172a");
    clone.insertBefore(bgRect, clone.firstChild);

    // Add watermark
    const watermark = document.createElementNS("http://www.w3.org/2000/svg", "text");
    watermark.setAttribute("x", String(Math.ceil(bbox.width) - 12));
    watermark.setAttribute("y", String(Math.ceil(bbox.height) - 12));
    watermark.setAttribute("text-anchor", "end");
    watermark.setAttribute("font-size", "11");
    watermark.setAttribute("font-family", "system-ui, sans-serif");
    watermark.setAttribute("fill", "rgba(255,255,255,0.35)");
    watermark.textContent = "Made with Architex";
    clone.appendChild(watermark);

    // Resolve CSS custom properties in style attributes
    const allElements = clone.querySelectorAll("[style]");
    const resolveVars = (styleStr: string): string => {
      return styleStr.replace(/var\(--([^,)]+)(?:,\s*([^)]+))?\)/g, (_match, varName, fallback) => {
        const resolved = computed.getPropertyValue(`--${varName}`).trim();
        return resolved || (fallback?.trim() ?? "#888");
      });
    };
    allElements.forEach((el) => {
      const style = el.getAttribute("style");
      if (style && style.includes("var(")) {
        el.setAttribute("style", resolveVars(style));
      }
    });

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(clone);
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const scale = 2; // 2x for retina quality
      canvas.width = Math.ceil(bbox.width) * scale;
      canvas.height = Math.ceil(bbox.height) * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        return;
      }
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        const modeName = activeMode.replace(/-/g, "-");
        a.download = `${modeName}-architex.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        log(`Exported ${modeName} as PNG`);
      }, "image/png");
    };
    img.src = url;
  }, [activeMode, log]);

  const handleAddEntity = useCallback(() => {
    pushUndoSnapshot();
    const id = nextId("entity");
    const newEntity: EREntity = {
      id,
      name: "NewEntity",
      isWeak: false,
      attributes: [
        {
          id: nextId("attr"),
          name: "id",
          isPK: true,
          isFK: false,
          type: "INT",
        },
      ],
      x: 100 + Math.random() * 300,
      y: 100 + Math.random() * 200,
    };
    setEntities((prev) => [...prev, newEntity]);
    setSelectedEntityId(id);
    log(`Created entity "${newEntity.name}"`);
  }, [log, pushUndoSnapshot]);

  const handleAddRelationship = useCallback(() => {
    if (entities.length < 2) return;
    pushUndoSnapshot();
    const rel: ERRelationship = {
      id: nextId("rel"),
      name: "relates_to",
      entity1Id: entities[0].id,
      entity2Id: entities[1].id,
      cardinality: "1:N",
    };
    setRelationships((prev) => [...prev, rel]);
    log(
      `Created relationship "${rel.name}" between "${entities[0].name}" and "${entities[1].name}"`,
    );
  }, [entities, log, pushUndoSnapshot]);

  const handleSelectEntity = useCallback((id: string | null) => {
    setSelectedEntityId(id);
  }, []);

  const handleMoveEntity = useCallback(
    (id: string, x: number, y: number) => {
      setEntities((prev) =>
        prev.map((e) => (e.id === id ? { ...e, x, y } : e)),
      );
    },
    [],
  );

  const handleUpdateEntity = useCallback(
    (id: string, updates: Partial<EREntity>) => {
      pushUndoSnapshot();
      setEntities((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...updates } : e)),
      );
    },
    [pushUndoSnapshot],
  );

  const handleDeleteEntity = useCallback(
    (id: string) => {
      const entity = entities.find((e) => e.id === id);
      if (!entity) return;
      const relCount = relationships.filter(
        (r) => r.entity1Id === id || r.entity2Id === id,
      ).length;
      const confirmed = window.confirm(
        `Delete entity '${entity.name}' and its ${relCount} relationship${relCount !== 1 ? "s" : ""}? This can be undone with Ctrl+Z.`,
      );
      if (!confirmed) return;
      pushUndoSnapshot();
      setEntities((prev) => prev.filter((e) => e.id !== id));
      setRelationships((prev) =>
        prev.filter((r) => r.entity1Id !== id && r.entity2Id !== id),
      );
      setSelectedEntityId(null);
      log(`Deleted entity "${entity.name}"`);
    },
    [entities, relationships, log, pushUndoSnapshot],
  );

  const handleAddAttribute = useCallback(
    (entityId: string) => {
      pushUndoSnapshot();
      setEntities((prev) =>
        prev.map((e) =>
          e.id === entityId
            ? {
                ...e,
                attributes: [
                  ...e.attributes,
                  {
                    id: nextId("attr"),
                    name: "new_attr",
                    isPK: false,
                    isFK: false,
                    type: "VARCHAR",
                  },
                ],
              }
            : e,
        ),
      );
      log("Added attribute");
    },
    [log, pushUndoSnapshot],
  );

  const handleUpdateAttribute = useCallback(
    (entityId: string, attrId: string, updates: Partial<ERAttribute>) => {
      pushUndoSnapshot();
      setEntities((prev) =>
        prev.map((e) =>
          e.id === entityId
            ? {
                ...e,
                attributes: e.attributes.map((a) =>
                  a.id === attrId ? { ...a, ...updates } : a,
                ),
              }
            : e,
        ),
      );
    },
    [pushUndoSnapshot],
  );

  const handleDeleteAttribute = useCallback(
    (entityId: string, attrId: string) => {
      pushUndoSnapshot();
      setEntities((prev) =>
        prev.map((e) =>
          e.id === entityId
            ? {
                ...e,
                attributes: e.attributes.filter((a) => a.id !== attrId),
              }
            : e,
        ),
      );
      log("Deleted attribute");
    },
    [log, pushUndoSnapshot],
  );

  // ── ER-to-SQL State ────────────────────────────────────────
  const [generatedSQL, setGeneratedSQL] = useState<string>("");

  const handleGenerateSQL = useCallback(() => {
    if (entities.length === 0) {
      log("Error: no entities to generate SQL for");
      return;
    }
    const sql = generateSQL(entities, relationships);
    setGeneratedSQL(sql);
    log(`Generated SQL for ${entities.length} table(s)`);
  }, [entities, relationships, log]);

  // ── ER-to-NoSQL (MongoDB) State (DBL-081) ──────────────────
  const generatedNoSQL = useMemo(() => {
    if (entities.length === 0) return "";
    const result = erToNoSQL(entities, relationships);
    const lines: string[] = ["// MongoDB Schema from ER Diagram\n"];
    for (const col of result.collections) {
      lines.push(`db.createCollection("${col.name}")`);
      lines.push(`// ${col.name} schema:`);
      lines.push("{");
      for (const f of col.fields) {
        const arrPrefix = f.isArray ? "[" : "";
        const arrSuffix = f.isArray ? "]" : "";
        const refNote = f.isRef ? ` // ref -> ${f.refCollection}` : "";
        if (f.subFields?.length) {
          lines.push(`  ${f.name}: {`);
          for (const sub of f.subFields) {
            lines.push(`    ${sub.name}: ${sub.type},`);
          }
          lines.push("  },");
        } else {
          lines.push(`  ${f.name}: ${arrPrefix}${f.type}${arrSuffix},${refNote}`);
        }
      }
      lines.push("}\n");
    }
    return lines.join("\n");
  }, [entities, relationships]);

  const handleLoadSample = useCallback(
    (sample: SampleERDiagram) => {
      pushUndoSnapshot();
      setEntities(sample.entities);
      setRelationships(sample.relationships);
      setSelectedEntityId(null);
      setGeneratedSQL("");
      log(`Loaded sample: ${sample.name} (${sample.entities.length} entities, ${sample.relationships.length} relationships)`);
    },
    [log, pushUndoSnapshot],
  );

  // ── Normalization State ─────────────────────────────────────
  const [normRelation, setNormRelation] = useState(
    persisted.normRelation ?? "StudentCourse",
  );
  const [normAttributes, setNormAttributes] = useState(
    persisted.normAttributes ?? "StudentID, CourseID, StudentName, CourseName, Instructor",
  );
  const [normFdsText, setNormFdsText] = useState(
    persisted.normFdsText ?? "StudentID -> StudentName\nCourseID -> CourseName,Instructor\nStudentID,CourseID -> StudentName,CourseName,Instructor",
  );
  const [normResult, setNormResult] = useState<NormalizationResult | null>(
    null,
  );
  const [showDecomposition, setShowDecomposition] = useState(false);

  // ── Debounced localStorage persistence ─────────────────────
  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      try {
        const state: PersistedDBState = {
          entities,
          relationships,
          activeMode,
          normRelation,
          normAttributes,
          normFdsText,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        // incognito / quota exceeded — silent fail
      }
    }, 500);
  }, [entities, relationships, activeMode, normRelation, normAttributes, normFdsText]);

  const handleAnalyze = useCallback(() => {
    const attrs = normAttributes
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean);
    const fds: FunctionalDependency[] = normFdsText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [lhsStr, rhsStr] = line.split("->").map((s) => s.trim());
        return {
          lhs: (lhsStr ?? "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          rhs: (rhsStr ?? "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        };
      })
      .filter((fd) => fd.lhs.length > 0 && fd.rhs.length > 0);

    if (attrs.length === 0 || fds.length === 0) {
      log("Error: provide at least one attribute and one FD");
      return;
    }

    const candidateKeys = findCandidateKeys(attrs, fds);
    const currentNF = determineNormalForm(attrs, fds, candidateKeys);
    const firstKey = candidateKeys[0] ?? attrs;
    const closure = computeClosure(firstKey, fds);
    const decomposition = decomposeTo3NF(attrs, fds);

    const result: NormalizationResult = {
      closure,
      candidateKeys,
      currentNF,
      decomposition,
    };
    setNormResult(result);
    setShowDecomposition(true);

    log(
      `Analyzed "${normRelation}": ${currentNF}, ${candidateKeys.length} candidate key(s), decomposed into ${decomposition.length} relation(s)`,
    );
    addXP(10);
  }, [normAttributes, normFdsText, normRelation, log, addXP]);

  // ── Transaction Isolation State ─────────────────────────────
  const [txLevel, setTxLevel] = useState<IsolationLevel>("read-uncommitted");
  const [txStepIndex, setTxStepIndex] = useState(0);
  const [txOverrideSteps, setTxOverrideSteps] =
    useState<TransactionStep[] | null>(null);

  const txBaseSteps = useMemo<TransactionStep[]>(
    () => simulateIsolation(txLevel),
    [txLevel],
  );
  const txSteps = txOverrideSteps ?? txBaseSteps;

  const handleTxLevelChange = useCallback(
    (level: IsolationLevel) => {
      setTxLevel(level);
      setTxStepIndex(0);
      setTxOverrideSteps(null);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      log(`Switched to isolation level: ${level}`);
    },
    [log],
  );

  // ── Write Skew Scenario (DBL-080) ──────────────────────────
  const handleLoadWriteSkew = useCallback(() => {
    setTxOverrideSteps(simulateWriteSkew());
    setTxStepIndex(0);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    log("Loaded write skew scenario (doctors on-call)");
  }, [log]);

  const handleTxStepBack = useCallback(() => {
    setTxStepIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleTxStep = useCallback(() => {
    setTxStepIndex((prev) => {
      const next = Math.min(prev + 1, txSteps.length - 1);
      const step = txSteps[next];
      if (step) {
        log(
          `[${step.tx}] t=${step.tick}: ${step.action}${step.anomaly ? ` *** ${step.anomaly.toUpperCase()} ***` : ""}`,
        );
      }
      return next;
    });
  }, [txSteps, log]);

  const handleTxPlay = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const playStep = () => {
      setTxStepIndex((prev) => {
        if (prev >= txSteps.length - 1) {
          timerRef.current = null;
          return prev;
        }
        const next = prev + 1;
        const step = txSteps[next];
        if (step) {
          setLogEntries((logs) => [
            ...logs,
            `[${step.tx}] t=${step.tick}: ${step.action}${step.anomaly ? ` *** ${step.anomaly.toUpperCase()} ***` : ""}`,
          ]);
        }
        const nextNext = txSteps[next + 1];
        const isInteresting = !!nextNext?.anomaly;
        const delay = smartSpeed ? (isInteresting ? animationSpeed * 2.5 : animationSpeed * 0.6) : animationSpeed;
        timerRef.current = setTimeout(playStep, delay);
        return next;
      });
    };
    timerRef.current = setTimeout(playStep, animationSpeed);
  }, [txSteps, animationSpeed, smartSpeed]);

  const handleTxReset = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setTxStepIndex(0);
    // Also reset prediction state when resetting simulation
    setPredictionSelectedOption(null);
    setPredictionPaused(false);
    log("Transaction simulation reset");
  }, [log]);

  // ── Transaction Compare Mode (DBL-046) ─────────────────────
  const [txCompareMode, setTxCompareMode] = useState(false);
  const [txCompareScenario, setTxCompareScenario] = useState<CompareScenario>("dirty-read");
  const [txCompareStepIndex, setTxCompareStepIndex] = useState(0);

  const txCompareResult = useMemo<CompareResult>(
    () => getCompareResult(txCompareScenario),
    [txCompareScenario],
  );

  const txCompareTotalSteps = Math.max(txCompareResult.left.length, txCompareResult.right.length);

  const handleTxCompareModeToggle = useCallback(() => {
    setTxCompareMode((prev) => {
      const next = !prev;
      if (next) {
        setTxCompareStepIndex(0);
        log(`Compare mode ON: ${txCompareScenario}`);
      } else {
        log("Compare mode OFF");
      }
      return next;
    });
  }, [txCompareScenario, log]);

  const handleTxCompareScenarioChange = useCallback((s: CompareScenario) => {
    setTxCompareScenario(s);
    setTxCompareStepIndex(0);
    log(`Compare scenario: ${s}`);
  }, [log]);

  const handleTxCompareStep = useCallback(() => {
    setTxCompareStepIndex((prev) => {
      const next = Math.min(prev + 1, txCompareTotalSteps - 1);
      log(`[Compare] step ${next + 1}/${txCompareTotalSteps}`);
      return next;
    });
  }, [txCompareTotalSteps, log]);

  const handleTxComparePlay = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const playStep = () => {
      setTxCompareStepIndex((prev) => {
        if (prev >= txCompareTotalSteps - 1) {
          timerRef.current = null;
          return prev;
        }
        const next = prev + 1;
        setLogEntries((logs) => [
          ...logs,
          `[Compare] step ${next + 1}/${txCompareTotalSteps}`,
        ]);
        timerRef.current = setTimeout(playStep, animationSpeed);
        return next;
      });
    };
    timerRef.current = setTimeout(playStep, animationSpeed);
  }, [txCompareTotalSteps, animationSpeed]);

  const handleTxCompareReset = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setTxCompareStepIndex(0);
    log("Compare simulation reset");
  }, [log]);

  // ── Transaction Prediction Mode (DBL-131) ──────────────────
  const [txPredictionMode, setTxPredictionMode] = useState(false);
  const [predictionPaused, setPredictionPaused] = useState(false);
  const [predictionSelectedOption, setPredictionSelectedOption] = useState<number | null>(null);
  const [predictionScore, setPredictionScore] = useState({ correct: 0, total: 0 });

  const txPredictionPrompt = useMemo<PredictionPrompt>(
    () => getPredictionPrompt(txLevel),
    [txLevel],
  );

  const handlePredictionModeToggle = useCallback(() => {
    setTxPredictionMode((prev) => {
      const next = !prev;
      if (next) {
        setPredictionScore({ correct: 0, total: 0 });
        setPredictionSelectedOption(null);
        setPredictionPaused(false);
        setTxStepIndex(0);
        log("Prediction mode ON");
      } else {
        setPredictionPaused(false);
        log("Prediction mode OFF");
      }
      return next;
    });
  }, [log]);

  const handlePredictionSelect = useCallback((idx: number) => {
    setPredictionSelectedOption(idx);
    const isCorrect = txPredictionPrompt.options[idx]?.correct ?? false;
    setPredictionScore((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));
    log(
      isCorrect
        ? "Prediction: CORRECT!"
        : "Prediction: Wrong -- see explanation",
    );
    // Auto-advance after a delay once answered
    setTimeout(() => {
      setPredictionPaused(false);
      setPredictionSelectedOption(null);
    }, 2500);
  }, [txPredictionPrompt, log]);

  // Override handleTxStep to support prediction pausing
  const handleTxStepWithPrediction = useCallback(() => {
    if (predictionPaused) return; // Block stepping while prediction is shown

    setTxStepIndex((prev) => {
      const next = Math.min(prev + 1, txSteps.length - 1);

      // Check if the NEXT step is the anomaly/critical step -- pause before showing it
      if (txPredictionMode && !predictionPaused) {
        const upcomingStep = txSteps[next];
        if (upcomingStep && upcomingStep.tick === txPredictionPrompt.beforeTick) {
          setPredictionPaused(true);
          setPredictionSelectedOption(null);
          // Don't advance -- stay at current step until prediction is answered
          return prev;
        }
      }

      const step = txSteps[next];
      if (step) {
        log(
          `[${step.tx}] t=${step.tick}: ${step.action}${step.anomaly ? ` *** ${step.anomaly.toUpperCase()} ***` : ""}`,
        );
      }
      return next;
    });
  }, [txSteps, txPredictionMode, predictionPaused, txPredictionPrompt, log]);

  // ── B-Tree State ────────────────────────────────────────────
  const [btreeOrder, setBtreeOrder] = useState(3);
  const btreeRef = useRef(new BTreeViz(3));
  const [btreeTree, setBtreeTree] = useState<BTreeNode>(
    btreeRef.current.getTree(),
  );
  const [btreeSteps, setBtreeSteps] = useState<BTreeStep[]>([]);
  const [btreeStepIndex, setBtreeStepIndex] = useState(0);
  const [btreeKeyInput, setBtreeKeyInput] = useState("");
  const [btreeSearchInput, setBtreeSearchInput] = useState("");
  const [isBtreePlaying, setIsBtreePlaying] = useState(false);
  const btreeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup btreeTimerRef on unmount
  useEffect(() => {
    return () => {
      if (btreeTimerRef.current) clearTimeout(btreeTimerRef.current);
    };
  }, []);

  const handleBtreeOrderChange = useCallback(
    (order: number) => {
      setBtreeOrder(order);
      btreeRef.current = new BTreeViz(order);
      setBtreeTree(btreeRef.current.getTree());
      setBtreeSteps([]);
      setBtreeStepIndex(0);
      setIsBtreePlaying(false);
      if (btreeTimerRef.current) {
        clearTimeout(btreeTimerRef.current);
        btreeTimerRef.current = null;
      }
      log(`B-Tree order changed to ${order}`);
    },
    [log],
  );

  const handleBtreeInsert = useCallback(() => {
    const key = parseInt(btreeKeyInput, 10);
    if (isNaN(key)) {
      log("Error: enter a valid integer key");
      return;
    }
    const steps = btreeRef.current.insert(key);
    setBtreeSteps(steps);
    setBtreeStepIndex(0);
    setBtreeTree(btreeRef.current.getTree());
    setBtreeKeyInput("");
    log(`Inserted key ${key} (${steps.length} step(s))`);
    addXP(10);
  }, [btreeKeyInput, log, addXP]);

  const handleBtreeSearch = useCallback(() => {
    const key = parseInt(btreeSearchInput, 10);
    if (isNaN(key)) {
      log("Error: enter a valid integer key");
      return;
    }
    const steps = btreeRef.current.search(key);
    setBtreeSteps(steps);
    setBtreeStepIndex(0);
    setBtreeSearchInput("");
    log(`Searching for key ${key} (${steps.length} step(s))`);
    addXP(10);
  }, [btreeSearchInput, log, addXP]);

  const handleBtreeStepForward = useCallback(() => {
    setBtreeStepIndex((prev) => Math.min(prev + 1, btreeSteps.length - 1));
  }, [btreeSteps.length]);

  const handleBtreeStepBack = useCallback(() => {
    setBtreeStepIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleBtreePlay = useCallback(() => {
    setIsBtreePlaying(true);
    if (btreeTimerRef.current) clearTimeout(btreeTimerRef.current);
    const playStep = () => {
      setBtreeStepIndex((prev) => {
        if (prev >= btreeSteps.length - 1) {
          btreeTimerRef.current = null;
          setIsBtreePlaying(false);
          return prev;
        }
        const next = prev + 1;
        const nextStep = btreeSteps[next + 1];
        const isInteresting = nextStep?.operation === "split";
        const delay = smartSpeed ? (isInteresting ? animationSpeed * 2.5 : animationSpeed * 0.6) : animationSpeed;
        btreeTimerRef.current = setTimeout(playStep, delay);
        return next;
      });
    };
    btreeTimerRef.current = setTimeout(playStep, animationSpeed);
  }, [btreeSteps, animationSpeed, smartSpeed]);

  const handleBtreePause = useCallback(() => {
    setIsBtreePlaying(false);
    if (btreeTimerRef.current) {
      clearTimeout(btreeTimerRef.current);
      btreeTimerRef.current = null;
    }
  }, []);

  const handleBtreeReset = useCallback(() => {
    btreeRef.current = new BTreeViz(btreeOrder);
    setBtreeTree(btreeRef.current.getTree());
    setBtreeSteps([]);
    setBtreeStepIndex(0);
    setIsBtreePlaying(false);
    if (btreeTimerRef.current) {
      clearTimeout(btreeTimerRef.current);
      btreeTimerRef.current = null;
    }
    log("B-Tree reset");
  }, [btreeOrder, log]);

  // ── B-Tree Prediction Mode (DBL-129) ──────────────────────────
  const [btreePredictionMode, setBtreePredictionMode] = useState(false);
  const [btreePredictionPaused, setBtreePredictionPaused] = useState(false);
  const [btreePredictionScore, setBtreePredictionScore] = useState({ correct: 0, total: 0 });
  const [btreePredictionQuestion, setBtreePredictionQuestion] = useState<string | null>(null);
  const [btreePredictionOptions, setBtreePredictionOptions] = useState<Array<{ label: string; childIndex: number }>>([]);
  const [btreePredictionCorrectIndex, setBtreePredictionCorrectIndex] = useState<number>(-1);
  const [btreePredictionSelectedOption, setBtreePredictionSelectedOption] = useState<number | null>(null);
  const [btreePredictionExplanation, setBtreePredictionExplanation] = useState<string>("");

  const handleBtreePredictionModeToggle = useCallback(() => {
    setBtreePredictionMode((prev) => {
      const next = !prev;
      if (next) {
        setBtreePredictionScore({ correct: 0, total: 0 });
        setBtreePredictionPaused(false);
        setBtreePredictionSelectedOption(null);
        setBtreePredictionQuestion(null);
        log("B-Tree prediction mode ON");
      } else {
        setBtreePredictionPaused(false);
        log("B-Tree prediction mode OFF");
      }
      return next;
    });
  }, [log]);

  const buildBtreePredictionPrompt = useCallback((step: BTreeStep, nextStep: BTreeStep | undefined) => {
    if (step.operation !== "search" || !nextStep || nextStep.operation !== "search") return false;
    const treeRoot = step.tree;
    const findNode = (n: BTreeNode, targetId: string): BTreeNode | null => {
      if (n.id === targetId) return n;
      for (const child of n.children) {
        const found = findNode(child, targetId);
        if (found) return found;
      }
      return null;
    };
    const highlightedNode = step.highlightNodeId ? findNode(treeRoot, step.highlightNodeId) : null;
    if (!highlightedNode || highlightedNode.isLeaf || highlightedNode.children.length === 0) return false;
    const searchKey = step.highlightKey;
    if (searchKey === undefined) return false;
    let correctChild = 0;
    for (let i = 0; i < highlightedNode.keys.length; i++) {
      if (searchKey > highlightedNode.keys[i]) correctChild = i + 1;
    }
    const opts: Array<{ label: string; childIndex: number }> = [];
    for (let i = 0; i < highlightedNode.children.length; i++) {
      let label: string;
      if (i === 0) {
        label = `Left child (keys < ${highlightedNode.keys[0]})`;
      } else if (i === highlightedNode.keys.length) {
        label = `Right child (keys > ${highlightedNode.keys[highlightedNode.keys.length - 1]})`;
      } else {
        label = `Child ${i} (${highlightedNode.keys[i - 1]} < keys < ${highlightedNode.keys[i]})`;
      }
      opts.push({ label, childIndex: i });
    }
    const keysStr = highlightedNode.keys.join(", ");
    setBtreePredictionQuestion(`Key ${searchKey} is being searched. Current node has [${keysStr}]. Which child will the algorithm descend to?`);
    setBtreePredictionOptions(opts);
    setBtreePredictionCorrectIndex(correctChild);
    let expl: string;
    if (correctChild === 0) {
      expl = `${searchKey} < ${highlightedNode.keys[0]}, so we descend to the leftmost child.`;
    } else if (correctChild === highlightedNode.keys.length) {
      expl = `${searchKey} > ${highlightedNode.keys[highlightedNode.keys.length - 1]}, so we descend to the rightmost child.`;
    } else {
      expl = `${highlightedNode.keys[correctChild - 1]} < ${searchKey} < ${highlightedNode.keys[correctChild]}, so we descend to child ${correctChild} (the middle child).`;
    }
    setBtreePredictionExplanation(expl);
    setBtreePredictionPaused(true);
    setBtreePredictionSelectedOption(null);
    return true;
  }, []);

  const handleBtreePredictionSelect = useCallback((selectedChildIndex: number) => {
    setBtreePredictionSelectedOption(selectedChildIndex);
    const isCorrect = selectedChildIndex === btreePredictionCorrectIndex;
    setBtreePredictionScore((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));
    log(isCorrect ? "B-Tree prediction: CORRECT!" : "B-Tree prediction: Wrong -- see explanation");
    setTimeout(() => {
      setBtreePredictionPaused(false);
      setBtreePredictionSelectedOption(null);
      setBtreePredictionQuestion(null);
      setBtreeStepIndex((prev) => Math.min(prev + 1, btreeSteps.length - 1));
    }, 2500);
  }, [btreePredictionCorrectIndex, btreeSteps.length, log]);

  const handleBtreeStepWithPrediction = useCallback(() => {
    if (btreePredictionPaused) return;
    setBtreeStepIndex((prev) => {
      const next = Math.min(prev + 1, btreeSteps.length - 1);
      if (next === prev) return prev;
      if (btreePredictionMode) {
        const currentStep = btreeSteps[next];
        const nextNextStep = btreeSteps[next + 1];
        if (currentStep && buildBtreePredictionPrompt(currentStep, nextNextStep)) {
          return next;
        }
      }
      return next;
    });
  }, [btreeSteps, btreePredictionMode, btreePredictionPaused, buildBtreePredictionPrompt]);

  // ── Hash Index State ──────────────────────────────────────────
  const hashRef = useRef(new HashIndexViz(4));
  const [hashState, setHashState] = useState<HashIndexState>(
    hashRef.current.getState(),
  );
  const [hashSteps, setHashSteps] = useState<HashIndexStep[]>([]);
  const [hashStepIndex, setHashStepIndex] = useState(0);
  const [hashKeyInput, setHashKeyInput] = useState("");
  const [hashValueInput, setHashValueInput] = useState("");
  const [hashSearchInput, setHashSearchInput] = useState("");
  const [hashDeleteInput, setHashDeleteInput] = useState("");
  const [isHashPlaying, setIsHashPlaying] = useState(false);
  const hashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup hashTimerRef on unmount
  useEffect(() => {
    return () => {
      if (hashTimerRef.current) clearTimeout(hashTimerRef.current);
    };
  }, []);

  const handleHashInsert = useCallback(() => {
    if (!hashKeyInput.trim()) {
      log("Error: enter a key");
      return;
    }
    const val = hashValueInput.trim() || hashKeyInput.trim();
    const steps = hashRef.current.insert(hashKeyInput.trim(), val);
    setHashSteps(steps);
    setHashStepIndex(0);
    setHashState(hashRef.current.getState());
    setHashKeyInput("");
    setHashValueInput("");
    log(`Inserted ("${hashKeyInput.trim()}", "${val}") (${steps.length} step(s))`);
    addXP(10);
  }, [hashKeyInput, hashValueInput, log, addXP]);

  const handleHashSearch = useCallback(() => {
    if (!hashSearchInput.trim()) {
      log("Error: enter a key to search");
      return;
    }
    const steps = hashRef.current.search(hashSearchInput.trim());
    setHashSteps(steps);
    setHashStepIndex(0);
    setHashSearchInput("");
    log(`Searching for key "${hashSearchInput.trim()}" (${steps.length} step(s))`);
    addXP(10);
  }, [hashSearchInput, log, addXP]);

  const handleHashDelete = useCallback(() => {
    if (!hashDeleteInput.trim()) {
      log("Error: enter a key to delete");
      return;
    }
    const steps = hashRef.current.delete(hashDeleteInput.trim());
    setHashSteps(steps);
    setHashStepIndex(0);
    setHashState(hashRef.current.getState());
    setHashDeleteInput("");
    log(`Deleting key "${hashDeleteInput.trim()}" (${steps.length} step(s))`);
    addXP(10);
  }, [hashDeleteInput, log, addXP]);

  const handleHashStepForward = useCallback(() => {
    setHashStepIndex((prev) => Math.min(prev + 1, hashSteps.length - 1));
  }, [hashSteps.length]);

  const handleHashStepBack = useCallback(() => {
    setHashStepIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleHashPlay = useCallback(() => {
    setIsHashPlaying(true);
    if (hashTimerRef.current) clearTimeout(hashTimerRef.current);
    const playStep = () => {
      setHashStepIndex((prev) => {
        if (prev >= hashSteps.length - 1) {
          hashTimerRef.current = null;
          setIsHashPlaying(false);
          return prev;
        }
        const next = prev + 1;
        const nextStep = hashSteps[next + 1];
        const isInteresting = nextStep?.operation === "collision" || nextStep?.operation === "resize";
        const delay = smartSpeed ? (isInteresting ? animationSpeed * 2.5 : animationSpeed * 0.6) : animationSpeed;
        hashTimerRef.current = setTimeout(playStep, delay);
        return next;
      });
    };
    hashTimerRef.current = setTimeout(playStep, animationSpeed);
  }, [hashSteps, animationSpeed, smartSpeed]);

  const handleHashPause = useCallback(() => {
    setIsHashPlaying(false);
    if (hashTimerRef.current) {
      clearTimeout(hashTimerRef.current);
      hashTimerRef.current = null;
    }
  }, []);

  const handleHashReset = useCallback(() => {
    hashRef.current = new HashIndexViz(4);
    setHashState(hashRef.current.getState());
    setHashSteps([]);
    setHashStepIndex(0);
    setIsHashPlaying(false);
    if (hashTimerRef.current) {
      clearTimeout(hashTimerRef.current);
      hashTimerRef.current = null;
    }
    log("Hash index reset");
  }, [log]);


  // ── Hash Prediction Mode (DBL-130) ────────────────────────────
  const [hashPredictionMode, setHashPredictionMode] = useState(false);
  const [hashPredictionPaused, setHashPredictionPaused] = useState(false);
  const [hashPredictionScore, setHashPredictionScore] = useState({ correct: 0, total: 0 });
  const [hashPredictionQuestion, setHashPredictionQuestion] = useState<string | null>(null);
  const [hashPredictionOptions, setHashPredictionOptions] = useState<Array<{ label: string; bucketIndex: number }>>([]);
  const [hashPredictionCorrectIndex, setHashPredictionCorrectIndex] = useState<number>(-1);
  const [hashPredictionSelectedOption, setHashPredictionSelectedOption] = useState<number | null>(null);
  const [hashPredictionExplanation, setHashPredictionExplanation] = useState<string>("");
  const [hashPredictionCollisionPhase, setHashPredictionCollisionPhase] = useState(false);
  const [hashPredictionCollisionOptions, setHashPredictionCollisionOptions] = useState<Array<{ label: string; correct: boolean }>>([]);
  const [hashPredictionCollisionSelected, setHashPredictionCollisionSelected] = useState<number | null>(null);
  const [hashPredictionCollisionExplanation, setHashPredictionCollisionExplanation] = useState<string>("");

  const handleHashPredictionModeToggle = useCallback(() => {
    setHashPredictionMode((prev) => {
      const next = !prev;
      if (next) {
        setHashPredictionScore({ correct: 0, total: 0 });
        setHashPredictionPaused(false);
        setHashPredictionSelectedOption(null);
        setHashPredictionQuestion(null);
        setHashPredictionCollisionPhase(false);
        log("Hash prediction mode ON");
      } else {
        setHashPredictionPaused(false);
        log("Hash prediction mode OFF");
      }
      return next;
    });
  }, [log]);

  const buildHashPredictionPrompt = useCallback((step: HashIndexStep, allSteps: HashIndexStep[]) => {
    if (step.operation !== "hash") return false;
    const desc = step.description;
    const match = desc.match(/Hash\("([^"]+)"\)\s*=\s*(\d+)\s*mod\s*(\d+)\s*=\s*bucket\s*(\d+)/);
    if (!match) return false;
    const [, key, rawHashStr, bucketCountStr, correctBucketStr] = match;
    const rawHash = parseInt(rawHashStr, 10);
    const bucketCount = parseInt(bucketCountStr, 10);
    const correctBucket = parseInt(correctBucketStr, 10);
    const opts: Array<{ label: string; bucketIndex: number }> = [];
    for (let i = 0; i < bucketCount; i++) {
      opts.push({ label: `Bucket ${i}`, bucketIndex: i });
    }
    setHashPredictionQuestion(`Key "${key}", hash = ${rawHash}, ${bucketCount} buckets. Which bucket does it go to?`);
    setHashPredictionOptions(opts);
    setHashPredictionCorrectIndex(correctBucket);
    setHashPredictionExplanation(`${rawHash} mod ${bucketCount} = ${correctBucket}, so the key goes to bucket ${correctBucket}.`);
    const collisionStep = allSteps.find((s) => s.operation === "collision" && s.highlightBucket === correctBucket);
    const resizeStep = allSteps.find((s) => s.operation === "resize");
    if (collisionStep) {
      const entryCount = collisionStep.description.match(/(\d+) existing entry/)?.[1] ?? "?";
      setHashPredictionCollisionOptions([
        { label: "Add to overflow chain", correct: !resizeStep },
        { label: "Resize the hash table", correct: !!resizeStep },
        { label: "Replace existing entry", correct: false },
      ]);
      setHashPredictionCollisionExplanation(
        resizeStep
          ? `Bucket ${correctBucket} has ${entryCount} entries and the load factor exceeds the threshold, so the table resizes.`
          : `Bucket ${correctBucket} has ${entryCount} entries. A new entry is added (chaining). The load factor is still within limits.`,
      );
    } else {
      setHashPredictionCollisionOptions([]);
    }
    setHashPredictionPaused(true);
    setHashPredictionSelectedOption(null);
    setHashPredictionCollisionPhase(false);
    setHashPredictionCollisionSelected(null);
    return true;
  }, []);

  const handleHashPredictionSelect = useCallback((selectedBucketIndex: number) => {
    setHashPredictionSelectedOption(selectedBucketIndex);
    const isCorrect = selectedBucketIndex === hashPredictionCorrectIndex;
    setHashPredictionScore((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));
    log(isCorrect ? "Hash prediction: CORRECT!" : "Hash prediction: Wrong -- see explanation");
    if (hashPredictionCollisionOptions.length > 0) {
      setTimeout(() => {
        setHashPredictionCollisionPhase(true);
        setHashPredictionSelectedOption(null);
        setHashPredictionQuestion(`Bucket ${hashPredictionCorrectIndex} already has entries. What happens next?`);
      }, 1800);
    } else {
      setTimeout(() => {
        setHashPredictionPaused(false);
        setHashPredictionSelectedOption(null);
        setHashPredictionQuestion(null);
        setHashPredictionCollisionPhase(false);
        setHashStepIndex((prev) => Math.min(prev + 1, hashSteps.length - 1));
      }, 2500);
    }
  }, [hashPredictionCorrectIndex, hashPredictionCollisionOptions.length, hashSteps.length, log]);

  const handleHashPredictionCollisionSelect = useCallback((idx: number) => {
    setHashPredictionCollisionSelected(idx);
    const isCorrect = hashPredictionCollisionOptions[idx]?.correct ?? false;
    setHashPredictionScore((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));
    log(isCorrect ? "Hash collision prediction: CORRECT!" : "Hash collision prediction: Wrong -- see explanation");
    setTimeout(() => {
      setHashPredictionPaused(false);
      setHashPredictionSelectedOption(null);
      setHashPredictionQuestion(null);
      setHashPredictionCollisionPhase(false);
      setHashPredictionCollisionSelected(null);
      setHashStepIndex((prev) => Math.min(prev + 1, hashSteps.length - 1));
    }, 2500);
  }, [hashPredictionCollisionOptions, hashSteps.length, log]);

  const handleHashStepWithPrediction = useCallback(() => {
    if (hashPredictionPaused) return;
    setHashStepIndex((prev) => {
      const next = Math.min(prev + 1, hashSteps.length - 1);
      if (next === prev) return prev;
      if (hashPredictionMode) {
        const currentStep = hashSteps[next];
        if (currentStep && buildHashPredictionPrompt(currentStep, hashSteps)) {
          return next;
        }
      }
      return next;
    });
  }, [hashSteps, hashPredictionMode, hashPredictionPaused, buildHashPredictionPrompt]);

  // ── Query Plan State ──────────────────────────────────────────
  const [queryPlanSql, setQueryPlanSql] = useState(
    "SELECT * FROM users WHERE id = 1",
  );
  const [queryPlan, setQueryPlan] = useState<QueryPlanNode | null>(null);

  const handleQueryPlanAnalyze = useCallback(() => {
    if (!queryPlanSql.trim()) {
      log("Error: enter a SQL query");
      return;
    }
    const plan = generateQueryPlan(queryPlanSql);
    setQueryPlan(plan);
    log(
      `Generated plan for: ${queryPlanSql.trim().substring(0, 60)}${queryPlanSql.trim().length > 60 ? "..." : ""} (cost: ${plan.cost.toFixed(2)})`,
    );
    addXP(10);
  }, [queryPlanSql, log, addXP]);

  // ── LSM-Tree State ──────────────────────────────────────────
  const lsmRef = useRef(new LSMTreeViz(4, 4));
  const [lsmState, setLsmState] = useState<LSMVizState>(
    lsmRef.current.getState(),
  );
  const [lsmSteps, setLsmSteps] = useState<LSMVizStep[]>([]);
  const [lsmStepIndex, setLsmStepIndex] = useState(0);
  const [lsmKeyInput, setLsmKeyInput] = useState("");
  const [lsmValueInput, setLsmValueInput] = useState("");
  const [lsmReadInput, setLsmReadInput] = useState("");
  const [isLsmPlaying, setIsLsmPlaying] = useState(false);
  const lsmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup lsmTimerRef on unmount
  useEffect(() => {
    return () => {
      if (lsmTimerRef.current) clearTimeout(lsmTimerRef.current);
    };
  }, []);

  const handleLsmWrite = useCallback(() => {
    if (!lsmKeyInput.trim()) {
      log("Error: enter a key");
      return;
    }
    const val = lsmValueInput.trim() || lsmKeyInput.trim();
    const steps = lsmRef.current.write(lsmKeyInput.trim(), val);
    setLsmSteps(steps);
    setLsmStepIndex(0);
    setLsmState(lsmRef.current.getState());
    setLsmKeyInput("");
    setLsmValueInput("");
    log(`Wrote ("${lsmKeyInput.trim()}", "${val}") (${steps.length} step(s))`);
    addXP(10);
  }, [lsmKeyInput, lsmValueInput, log, addXP]);

  const handleLsmRead = useCallback(() => {
    if (!lsmReadInput.trim()) {
      log("Error: enter a key to read");
      return;
    }
    const steps = lsmRef.current.read(lsmReadInput.trim());
    setLsmSteps(steps);
    setLsmStepIndex(0);
    setLsmReadInput("");
    log(`Reading key "${lsmReadInput.trim()}" (${steps.length} step(s))`);
    addXP(10);
  }, [lsmReadInput, log, addXP]);

  const handleLsmFlush = useCallback(() => {
    const steps = lsmRef.current.flush();
    setLsmSteps(steps);
    setLsmStepIndex(0);
    setLsmState(lsmRef.current.getState());
    log(`Manual flush (${steps.length} step(s))`);
  }, [log]);

  const handleLsmCompact = useCallback(
    (level: number) => {
      const steps = lsmRef.current.compact(level);
      setLsmSteps(steps);
      setLsmStepIndex(0);
      setLsmState(lsmRef.current.getState());
      log(`Manual compact L${level} -> L${level + 1} (${steps.length} step(s))`);
    },
    [log],
  );

  const handleLsmStepForward = useCallback(() => {
    setLsmStepIndex((prev) => Math.min(prev + 1, lsmSteps.length - 1));
  }, [lsmSteps.length]);

  const handleLsmStepBack = useCallback(() => {
    setLsmStepIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleLsmPlay = useCallback(() => {
    setIsLsmPlaying(true);
    if (lsmTimerRef.current) clearTimeout(lsmTimerRef.current);
    const playStep = () => {
      setLsmStepIndex((prev) => {
        if (prev >= lsmSteps.length - 1) {
          lsmTimerRef.current = null;
          setIsLsmPlaying(false);
          return prev;
        }
        const next = prev + 1;
        const nextStep = lsmSteps[next + 1];
        const isInteresting = nextStep?.operation === "flush" || nextStep?.operation === "compact";
        const delay = smartSpeed ? (isInteresting ? animationSpeed * 2.5 : animationSpeed * 0.6) : animationSpeed;
        lsmTimerRef.current = setTimeout(playStep, delay);
        return next;
      });
    };
    lsmTimerRef.current = setTimeout(playStep, animationSpeed);
  }, [lsmSteps, animationSpeed, smartSpeed]);

  const handleLsmPause = useCallback(() => {
    setIsLsmPlaying(false);
    if (lsmTimerRef.current) {
      clearTimeout(lsmTimerRef.current);
      lsmTimerRef.current = null;
    }
  }, []);

  const handleLsmReset = useCallback(() => {
    lsmRef.current = new LSMTreeViz(4, 4);
    setLsmState(lsmRef.current.getState());
    setLsmSteps([]);
    setLsmStepIndex(0);
    setIsLsmPlaying(false);
    if (lsmTimerRef.current) {
      clearTimeout(lsmTimerRef.current);
      lsmTimerRef.current = null;
    }
    log("LSM-Tree reset");
  }, [log]);

  const handleLsmCheckpoint = useCallback(() => {
    const steps = lsmRef.current.checkpoint();
    setLsmSteps(steps);
    setLsmStepIndex(0);
    setLsmState(lsmRef.current.getState());
    log(`Checkpoint (${steps.length} step(s))`);
  }, [log]);

  const handleLsmToggleBloom = useCallback(() => {
    const next = !lsmRef.current.bloomEnabled;
    lsmRef.current.setBloomEnabled(next);
    setLsmState(lsmRef.current.getState());
    log(`Bloom filter ${next ? "enabled" : "disabled"}`);
  }, [log]);

  // ── ACID Properties State ──────────────────────────────────────
  const [acidProperty, setAcidProperty] = useState<ACIDProperty>("atomicity");
  const [acidStepIndex, setAcidStepIndex] = useState(0);
  const acidTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const acidSteps = useMemo(() => getStepsForProperty(acidProperty), [acidProperty]);

  const handleAcidPropertyChange = useCallback(
    (prop: ACIDProperty) => {
      setAcidProperty(prop);
      setAcidStepIndex(0);
      if (acidTimerRef.current) {
        clearTimeout(acidTimerRef.current);
        acidTimerRef.current = null;
      }
      log(`ACID: switched to ${prop}`);
    },
    [log],
  );

  const handleAcidStepBack = useCallback(() => {
    setAcidStepIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleAcidStep = useCallback(() => {
    setAcidStepIndex((prev) => {
      const next = Math.min(prev + 1, acidSteps.length - 1);
      const step = acidSteps[next];
      if (step) {
        setLogEntries((logs) => [...logs, `[ACID/${acidProperty}] ${step.label}`]);
      }
      return next;
    });
  }, [acidSteps, acidProperty]);

  const handleAcidPlay = useCallback(() => {
    if (acidTimerRef.current) clearTimeout(acidTimerRef.current);
    const playStep = () => {
      setAcidStepIndex((prev) => {
        if (prev >= acidSteps.length - 1) {
          acidTimerRef.current = null;
          return prev;
        }
        const next = prev + 1;
        const step = acidSteps[next];
        if (step) {
          setLogEntries((logs) => [...logs, `[ACID/${acidProperty}] ${step.label}`]);
        }
        const nextNext = acidSteps[next + 1];
        const isInteresting = nextNext?.status === "crash" || nextNext?.status === "failure";
        const delay = smartSpeed ? (isInteresting ? animationSpeed * 2.5 : animationSpeed * 0.6) : animationSpeed;
        acidTimerRef.current = setTimeout(playStep, delay);
        return next;
      });
    };
    acidTimerRef.current = setTimeout(playStep, animationSpeed);
  }, [acidSteps, acidProperty, animationSpeed, smartSpeed]);

  const handleAcidReset = useCallback(() => {
    if (acidTimerRef.current) {
      clearTimeout(acidTimerRef.current);
      acidTimerRef.current = null;
    }
    setAcidStepIndex(0);
    log("ACID simulation reset");
  }, [log]);

  // ── CAP Theorem State ──────────────────────────────────────────
  const [capSelectedDb, setCapSelectedDb] = useState<CAPDatabase | null>(null);
  const [capSimType, setCapSimType] = useState<"cp" | "ap">("cp");
  const [capStepIndex, setCapStepIndex] = useState(0);
  const capTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const capSteps = useMemo(
    () => (capSimType === "cp" ? getCPPartitionSteps() : getAPPartitionSteps()),
    [capSimType],
  );

  const handleCapSelectDb = useCallback(
    (db: CAPDatabase) => {
      setCapSelectedDb(db);
      log(`CAP: selected ${db}`);
    },
    [log],
  );

  const handleCapSimTypeChange = useCallback(
    (type: "cp" | "ap") => {
      setCapSimType(type);
      setCapStepIndex(0);
      if (capTimerRef.current) {
        clearTimeout(capTimerRef.current);
        capTimerRef.current = null;
      }
      log(`CAP: switched to ${type.toUpperCase()} simulation`);
    },
    [log],
  );

  const handleCapStepBack = useCallback(() => {
    setCapStepIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleCapStep = useCallback(() => {
    setCapStepIndex((prev) => {
      const next = Math.min(prev + 1, capSteps.length - 1);
      const step = capSteps[next];
      if (step) {
        setLogEntries((logs) => [...logs, `[CAP/${capSimType.toUpperCase()}] ${step.label}`]);
      }
      return next;
    });
  }, [capSteps, capSimType]);

  const handleCapPlay = useCallback(() => {
    if (capTimerRef.current) clearTimeout(capTimerRef.current);
    const playStep = () => {
      setCapStepIndex((prev) => {
        if (prev >= capSteps.length - 1) {
          capTimerRef.current = null;
          return prev;
        }
        const next = prev + 1;
        const step = capSteps[next];
        if (step) {
          setLogEntries((logs) => [...logs, `[CAP/${capSimType.toUpperCase()}] ${step.label}`]);
        }
        const nextNext = capSteps[next + 1];
        const isInteresting = nextNext?.status === "partition";
        const delay = smartSpeed ? (isInteresting ? animationSpeed * 2.5 : animationSpeed * 0.6) : animationSpeed;
        capTimerRef.current = setTimeout(playStep, delay);
        return next;
      });
    };
    capTimerRef.current = setTimeout(playStep, animationSpeed);
  }, [capSteps, capSimType, animationSpeed, smartSpeed]);

  const handleCapReset = useCallback(() => {
    if (capTimerRef.current) {
      clearTimeout(capTimerRef.current);
      capTimerRef.current = null;
    }
    setCapStepIndex(0);
    log("CAP simulation reset");
  }, [log]);

  // ── MVCC State ─────────────────────────────────────────────────
  const mvccRef = useRef(new MVCCViz());
  const [mvccSteps, setMvccSteps] = useState<MVCCStep[]>([]);
  const [mvccStepIndex, setMvccStepIndex] = useState(0);
  const [isMvccPlaying, setIsMvccPlaying] = useState(false);
  const mvccTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMvccRunDemo = useCallback(() => {
    mvccRef.current = new MVCCViz();
    const steps = mvccRef.current.runDemoScenario();
    setMvccSteps(steps);
    setMvccStepIndex(0);
    setIsMvccPlaying(false);
    log(`MVCC: loaded snapshot isolation demo (${steps.length} steps)`);
  }, [log]);

  const handleMvccStepBack = useCallback(() => {
    setMvccStepIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleMvccStepForward = useCallback(() => {
    setMvccStepIndex((prev) => {
      const next = Math.min(prev + 1, mvccSteps.length - 1);
      const step = mvccSteps[next];
      if (step) {
        setLogEntries((logs) => [...logs, `[MVCC] ${step.operation}: ${step.description.substring(0, 80)}...`]);
      }
      return next;
    });
  }, [mvccSteps]);

  const handleMvccPlay = useCallback(() => {
    setIsMvccPlaying(true);
    if (mvccTimerRef.current) clearTimeout(mvccTimerRef.current);
    const playStep = () => {
      setMvccStepIndex((prev) => {
        if (prev >= mvccSteps.length - 1) {
          mvccTimerRef.current = null;
          setIsMvccPlaying(false);
          return prev;
        }
        const next = prev + 1;
        const step = mvccSteps[next];
        if (step) {
          setLogEntries((logs) => [...logs, `[MVCC] ${step.operation}: ${step.description.substring(0, 80)}...`]);
        }
        const nextStep = mvccSteps[next + 1];
        const isInteresting = nextStep?.operation === "read" || nextStep?.operation === "commit";
        const delay = smartSpeed ? (isInteresting ? animationSpeed * 2.5 : animationSpeed * 0.6) : animationSpeed;
        mvccTimerRef.current = setTimeout(playStep, delay);
        return next;
      });
    };
    mvccTimerRef.current = setTimeout(playStep, animationSpeed);
  }, [mvccSteps, animationSpeed, smartSpeed]);

  const handleMvccPause = useCallback(() => {
    setIsMvccPlaying(false);
    if (mvccTimerRef.current) {
      clearTimeout(mvccTimerRef.current);
      mvccTimerRef.current = null;
    }
  }, []);

  const handleMvccReset = useCallback(() => {
    mvccRef.current = new MVCCViz();
    setMvccSteps([]);
    setMvccStepIndex(0);
    setIsMvccPlaying(false);
    if (mvccTimerRef.current) {
      clearTimeout(mvccTimerRef.current);
      mvccTimerRef.current = null;
    }
    log("MVCC simulation reset");
  }, [log]);

  // ── ARIES Recovery State (DBL-091) ────────────────────────────
  const ariesRef = useRef(new ARIESViz());
  const [ariesSteps, setAriesSteps] = useState<ARIESStep[]>([]);
  const [ariesStepIndex, setAriesStepIndex] = useState(0);
  const [isAriesPlaying, setIsAriesPlaying] = useState(false);
  const ariesTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleAriesRunDemo = useCallback(() => {
    ariesRef.current = new ARIESViz();
    const steps = ariesRef.current.runDemoScenario();
    setAriesSteps(steps);
    setAriesStepIndex(0);
    setIsAriesPlaying(false);
    log(`ARIES: loaded recovery demo (${steps.length} steps)`);
  }, [log]);

  const handleAriesStepBack = useCallback(() => {
    setAriesStepIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleAriesStepForward = useCallback(() => {
    setAriesStepIndex((prev) => {
      const next = Math.min(prev + 1, ariesSteps.length - 1);
      const step = ariesSteps[next];
      if (step) {
        setLogEntries((logs) => [...logs, `[ARIES/${step.phase}] ${step.description.substring(0, 80)}...`]);
      }
      return next;
    });
  }, [ariesSteps]);

  const handleAriesPlay = useCallback(() => {
    setIsAriesPlaying(true);
    if (ariesTimerRef.current) clearTimeout(ariesTimerRef.current);
    const playStep = () => {
      setAriesStepIndex((prev) => {
        if (prev >= ariesSteps.length - 1) {
          ariesTimerRef.current = null;
          setIsAriesPlaying(false);
          return prev;
        }
        const next = prev + 1;
        const step = ariesSteps[next];
        if (step) {
          setLogEntries((logs) => [...logs, `[ARIES/${step.phase}] ${step.description.substring(0, 80)}...`]);
        }
        const nextStep = ariesSteps[next + 1];
        const isInteresting = nextStep?.isCrash || nextStep?.phase !== step?.phase;
        const delay = smartSpeed ? (isInteresting ? animationSpeed * 2.5 : animationSpeed * 0.6) : animationSpeed;
        ariesTimerRef.current = setTimeout(playStep, delay);
        return next;
      });
    };
    ariesTimerRef.current = setTimeout(playStep, animationSpeed);
  }, [ariesSteps, animationSpeed, smartSpeed]);

  const handleAriesPause = useCallback(() => {
    setIsAriesPlaying(false);
    if (ariesTimerRef.current) {
      clearTimeout(ariesTimerRef.current);
      ariesTimerRef.current = null;
    }
  }, []);

  const handleAriesReset = useCallback(() => {
    ariesRef.current = new ARIESViz();
    setAriesSteps([]);
    setAriesStepIndex(0);
    setIsAriesPlaying(false);
    if (ariesTimerRef.current) {
      clearTimeout(ariesTimerRef.current);
      ariesTimerRef.current = null;
    }
    log("ARIES recovery simulation reset");
  }, [log]);

  // ── Star/Snowflake Schema State (DBL-088) ─────────────────────
  const [starSnowflakeType, setStarSnowflakeType] = useState<SchemaType>("star");
  const [starSnowflakeStepIndex, setStarSnowflakeStepIndex] = useState(0);
  const [isStarSnowflakePlaying, setIsStarSnowflakePlaying] = useState(false);
  const starSnowflakeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const starSnowflakeSteps = useMemo(() => getStarSnowflakeSteps(starSnowflakeType), [starSnowflakeType]);
  const handleStarSnowflakeTypeChange = useCallback(
    (s: SchemaType) => {
      setStarSnowflakeType(s);
      setStarSnowflakeStepIndex(0);
      setIsStarSnowflakePlaying(false);
      if (starSnowflakeTimerRef.current) clearTimeout(starSnowflakeTimerRef.current);
      log(`Star/Snowflake: switched to ${s} schema`);
    },
    [log],
  );
  const handleStarSnowflakeStep = useCallback(() => {
    setStarSnowflakeStepIndex((prev) => {
      const steps = getStarSnowflakeSteps(starSnowflakeType);
      return prev < steps.length - 1 ? prev + 1 : prev;
    });
  }, [starSnowflakeType]);
  const handleStarSnowflakeStepBack = useCallback(() => {
    setStarSnowflakeStepIndex((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);
  const handleStarSnowflakePlay = useCallback(() => {
    setIsStarSnowflakePlaying(true);
    const advance = () => {
      setStarSnowflakeStepIndex((prev) => {
        const steps = getStarSnowflakeSteps(starSnowflakeType);
        if (prev >= steps.length - 1) {
          setIsStarSnowflakePlaying(false);
          return prev;
        }
        starSnowflakeTimerRef.current = setTimeout(advance, animationSpeed);
        return prev + 1;
      });
    };
    starSnowflakeTimerRef.current = setTimeout(advance, animationSpeed);
  }, [starSnowflakeType, animationSpeed]);
  const handleStarSnowflakePause = useCallback(() => {
    setIsStarSnowflakePlaying(false);
    if (starSnowflakeTimerRef.current) {
      clearTimeout(starSnowflakeTimerRef.current);
      starSnowflakeTimerRef.current = null;
    }
  }, []);
  const handleStarSnowflakeReset = useCallback(() => {
    setStarSnowflakeStepIndex(0);
    setIsStarSnowflakePlaying(false);
    if (starSnowflakeTimerRef.current) {
      clearTimeout(starSnowflakeTimerRef.current);
      starSnowflakeTimerRef.current = null;
    }
    log("Star/Snowflake: reset");
  }, [log]);

  // ── Connection Pooling State (DBL-093) ──────────────────────────
  const [connPoolMode, setConnPoolMode] = useState<PoolingMode>("no-pooling");
  const [connPoolSize, setConnPoolSize] = useState(10);
  const [connPoolStepIndex, setConnPoolStepIndex] = useState(0);
  const [isConnPoolPlaying, setIsConnPoolPlaying] = useState(false);
  const connPoolTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connPoolSteps = useMemo(() => getConnPoolSteps(connPoolMode), [connPoolMode]);
  const handleConnPoolModeChange = useCallback(
    (m: PoolingMode) => {
      setConnPoolMode(m);
      setConnPoolStepIndex(0);
      setIsConnPoolPlaying(false);
      if (connPoolTimerRef.current) clearTimeout(connPoolTimerRef.current);
      log(`Connection Pooling: switched to ${m === "no-pooling" ? "no pooling" : "with pooling"}`);
    },
    [log],
  );
  const handleConnPoolSizeChange = useCallback(
    (s: number) => {
      setConnPoolSize(s);
      log(`Connection Pool: pool size set to ${s}`);
    },
    [log],
  );
  const handleConnPoolStep = useCallback(() => {
    setConnPoolStepIndex((prev) => {
      const steps = getConnPoolSteps(connPoolMode);
      return prev < steps.length - 1 ? prev + 1 : prev;
    });
  }, [connPoolMode]);
  const handleConnPoolStepBack = useCallback(() => {
    setConnPoolStepIndex((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);
  const handleConnPoolPlay = useCallback(() => {
    setIsConnPoolPlaying(true);
    const advance = () => {
      setConnPoolStepIndex((prev) => {
        const steps = getConnPoolSteps(connPoolMode);
        if (prev >= steps.length - 1) {
          setIsConnPoolPlaying(false);
          return prev;
        }
        connPoolTimerRef.current = setTimeout(advance, animationSpeed);
        return prev + 1;
      });
    };
    connPoolTimerRef.current = setTimeout(advance, animationSpeed);
  }, [connPoolMode, animationSpeed]);
  const handleConnPoolPause = useCallback(() => {
    setIsConnPoolPlaying(false);
    if (connPoolTimerRef.current) {
      clearTimeout(connPoolTimerRef.current);
      connPoolTimerRef.current = null;
    }
  }, []);
  const handleConnPoolReset = useCallback(() => {
    setConnPoolStepIndex(0);
    setIsConnPoolPlaying(false);
    if (connPoolTimerRef.current) {
      clearTimeout(connPoolTimerRef.current);
      connPoolTimerRef.current = null;
    }
    log("Connection Pooling: reset");
  }, [log]);


  // ── Row vs Column Store State ─────────────────────────────────
  const [rowColQueryType, setRowColQueryType] = useState<RowColumnQueryType>("olap");

  const handleRowColQueryTypeChange = useCallback(
    (q: RowColumnQueryType) => {
      setRowColQueryType(q);
      log(`Row vs Column: switched to ${q.toUpperCase()} query`);
    },
    [log],
  );

  // ── SQL vs NoSQL State (DBL-070) ─────────────────────────────
  const [sqlNoSqlUseCase, setSqlNoSqlUseCase] = useState<SQLvsNoSQLUseCase>(null);

  const handleSqlNoSqlUseCaseChange = useCallback(
    (uc: SQLvsNoSQLUseCase) => {
      setSqlNoSqlUseCase(uc);
      if (uc) log(`SQL vs NoSQL: selected ${uc} use case`);
    },
    [log],
  );

  // ── Index Anti-Patterns State (DBL-087) ──────────────────────
  const [indexAntiPattern, setIndexAntiPattern] = useState<AntiPatternId>("function-on-column");

  const handleIndexAntiPatternChange = useCallback(
    (p: AntiPatternId) => {
      setIndexAntiPattern(p);
      log(`Index Anti-Patterns: viewing "${p}"`);
    },
    [log],
  );

  // ── Caching Patterns State (DBL-079) ──────────────────────────
  const [cachingPattern, setCachingPattern] = useState<CachingPatternType>("cache-aside");
  const [cachingStepIndex, setCachingStepIndex] = useState(0);
  const [isCachingPlaying, setIsCachingPlaying] = useState(false);
  const cachingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cachingSteps = useMemo(() => getCachingSteps(cachingPattern), [cachingPattern]);

  const handleCachingPatternChange = useCallback(
    (p: CachingPatternType) => {
      setCachingPattern(p);
      setCachingStepIndex(0);
      setIsCachingPlaying(false);
      if (cachingTimerRef.current) clearTimeout(cachingTimerRef.current);
      log(`Caching Patterns: switched to ${p}`);
    },
    [log],
  );

  const handleCachingStep = useCallback(() => {
    setCachingStepIndex((prev) => {
      const steps = getCachingSteps(cachingPattern);
      return prev < steps.length - 1 ? prev + 1 : prev;
    });
  }, [cachingPattern]);

  const handleCachingStepBack = useCallback(() => {
    setCachingStepIndex((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  const handleCachingPlay = useCallback(() => {
    setIsCachingPlaying(true);
    const advance = () => {
      setCachingStepIndex((prev) => {
        const steps = getCachingSteps(cachingPattern);
        if (prev >= steps.length - 1) {
          setIsCachingPlaying(false);
          return prev;
        }
        cachingTimerRef.current = setTimeout(advance, animationSpeed);
        return prev + 1;
      });
    };
    cachingTimerRef.current = setTimeout(advance, animationSpeed);
  }, [cachingPattern, animationSpeed]);

  const handleCachingPause = useCallback(() => {
    setIsCachingPlaying(false);
    if (cachingTimerRef.current) {
      clearTimeout(cachingTimerRef.current);
      cachingTimerRef.current = null;
    }
  }, []);

  const handleCachingReset = useCallback(() => {
    setCachingStepIndex(0);
    setIsCachingPlaying(false);
    if (cachingTimerRef.current) {
      clearTimeout(cachingTimerRef.current);
      cachingTimerRef.current = null;
    }
    log("Caching Patterns: reset");
  }, [log]);

  // ── Join Algorithms State (DBL-076) ─────────────────────────
  const joinRef = useRef(new JoinViz());
  const [joinAlgorithm, setJoinAlgorithm] = useState<JoinAlgorithm>("nested-loop");
  const [joinState, setJoinState] = useState<JoinState>(joinRef.current.getState());
  const [joinSteps, setJoinSteps] = useState<JoinStep[]>([]);
  const [joinStepIndex, setJoinStepIndex] = useState(0);
  const [isJoinPlaying, setIsJoinPlaying] = useState(false);
  const joinTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleJoinAlgorithmChange = useCallback(
    (algo: JoinAlgorithm) => {
      setJoinAlgorithm(algo);
      setJoinSteps([]);
      setJoinStepIndex(0);
      setIsJoinPlaying(false);
      if (joinTimerRef.current) {
        clearTimeout(joinTimerRef.current);
        joinTimerRef.current = null;
      }
      log(`Join Algorithms: switched to ${algo}`);
    },
    [log],
  );

  const handleJoinRun = useCallback(() => {
    joinRef.current = new JoinViz();
    const steps = joinRef.current.runJoin(joinAlgorithm);
    setJoinSteps(steps);
    setJoinStepIndex(0);
    setJoinState(joinRef.current.getState());
    setIsJoinPlaying(false);
    log(`Join Algorithms: running ${joinAlgorithm} (${steps.length} steps)`);
  }, [joinAlgorithm, log]);

  const handleJoinStepBack = useCallback(() => {
    setJoinStepIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleJoinStepForward = useCallback(() => {
    setJoinStepIndex((prev) => {
      const next = Math.min(prev + 1, joinSteps.length - 1);
      const step = joinSteps[next];
      if (step) {
        setLogEntries((logs) => [...logs, `[Join] ${step.operation}: ${step.description.substring(0, 80)}...`]);
      }
      return next;
    });
  }, [joinSteps]);

  const handleJoinPlay = useCallback(() => {
    setIsJoinPlaying(true);
    if (joinTimerRef.current) clearTimeout(joinTimerRef.current);
    const playStep = () => {
      setJoinStepIndex((prev) => {
        if (prev >= joinSteps.length - 1) {
          joinTimerRef.current = null;
          setIsJoinPlaying(false);
          return prev;
        }
        const next = prev + 1;
        const step = joinSteps[next];
        if (step) {
          setLogEntries((logs) => [...logs, `[Join] ${step.operation}: ${step.description.substring(0, 80)}...`]);
        }
        const nextStep = joinSteps[next + 1];
        const isInteresting = nextStep?.operation === "match" || nextStep?.operation === "complete";
        const delay = smartSpeed ? (isInteresting ? animationSpeed * 2.5 : animationSpeed * 0.6) : animationSpeed;
        joinTimerRef.current = setTimeout(playStep, delay);
        return next;
      });
    };
    joinTimerRef.current = setTimeout(playStep, animationSpeed);
  }, [joinSteps, animationSpeed, smartSpeed]);

  const handleJoinPause = useCallback(() => {
    setIsJoinPlaying(false);
    if (joinTimerRef.current) {
      clearTimeout(joinTimerRef.current);
      joinTimerRef.current = null;
    }
  }, []);

  const handleJoinReset = useCallback(() => {
    joinRef.current = new JoinViz();
    setJoinSteps([]);
    setJoinStepIndex(0);
    setJoinState(joinRef.current.getState());
    setIsJoinPlaying(false);
    if (joinTimerRef.current) {
      clearTimeout(joinTimerRef.current);
      joinTimerRef.current = null;
    }
    log("Join Algorithms: reset");
  }, [log]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (btreeTimerRef.current) clearTimeout(btreeTimerRef.current);
      if (hashTimerRef.current) clearTimeout(hashTimerRef.current);
      if (lsmTimerRef.current) clearTimeout(lsmTimerRef.current);
      if (acidTimerRef.current) clearTimeout(acidTimerRef.current);
      if (capTimerRef.current) clearTimeout(capTimerRef.current);
      if (mvccTimerRef.current) clearTimeout(mvccTimerRef.current);
      if (ariesTimerRef.current) clearTimeout(ariesTimerRef.current);
      if (cachingTimerRef.current) clearTimeout(cachingTimerRef.current);
      if (joinTimerRef.current) clearTimeout(joinTimerRef.current);
      if (starSnowflakeTimerRef.current) clearTimeout(starSnowflakeTimerRef.current);
      if (connPoolTimerRef.current) clearTimeout(connPoolTimerRef.current);
    };
  }, []);

  // ── Mode Change ─────────────────────────────────────────────
  const handleSelectMode = useCallback(
    (mode: DatabaseMode) => {
      setActiveMode(mode);
      setLogEntries([]);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (btreeTimerRef.current) {
        clearTimeout(btreeTimerRef.current);
        btreeTimerRef.current = null;
      }
      if (hashTimerRef.current) {
        clearTimeout(hashTimerRef.current);
        hashTimerRef.current = null;
      }
      if (lsmTimerRef.current) {
        clearTimeout(lsmTimerRef.current);
        lsmTimerRef.current = null;
      }
      if (acidTimerRef.current) {
        clearTimeout(acidTimerRef.current);
        acidTimerRef.current = null;
      }
      if (capTimerRef.current) {
        clearTimeout(capTimerRef.current);
        capTimerRef.current = null;
      }
      if (mvccTimerRef.current) {
        clearTimeout(mvccTimerRef.current);
        mvccTimerRef.current = null;
      }
      if (ariesTimerRef.current) {
        clearTimeout(ariesTimerRef.current);
        ariesTimerRef.current = null;
      }
      if (joinTimerRef.current) {
        clearTimeout(joinTimerRef.current);
        joinTimerRef.current = null;
      }
      if (starSnowflakeTimerRef.current) {
        clearTimeout(starSnowflakeTimerRef.current);
        starSnowflakeTimerRef.current = null;
      }
      if (connPoolTimerRef.current) {
        clearTimeout(connPoolTimerRef.current);
        connPoolTimerRef.current = null;
      }
      setIsBtreePlaying(false);
      setIsHashPlaying(false);
      setIsLsmPlaying(false);
      setIsMvccPlaying(false);
      setIsAriesPlaying(false);
      setIsJoinPlaying(false);
      setIsStarSnowflakePlaying(false);
      setIsConnPoolPlaying(false);
      log(`Switched to ${mode} mode`);
    },
    [log],
  );

  // ── Share Button Handler ─────────────────────────────────────

  const handleShare = useCallback(() => {
    const data: Record<string, unknown> = { mode: activeMode };

    switch (activeMode) {
      case "er-diagram":
        data.entities = entities.map((e) => ({
          name: e.name,
          attrs: e.attributes.map((a) => a.name),
          pk: e.attributes.filter((a) => a.isPK).map((a) => a.name),
        }));
        data.rels = relationships.map((r) => {
          const e1 = entities.find((e) => e.id === r.entity1Id);
          const e2 = entities.find((e) => e.id === r.entity2Id);
          return { name: r.name, from: e1?.name, to: e2?.name, card: r.cardinality };
        });
        break;
      case "btree-index":
        data.keys = collectBTreeKeys(btreeRef.current.getTree());
        data.order = btreeOrder;
        break;
      case "hash-index":
        data.entries = collectHashEntries(hashRef.current.getState());
        break;
      case "normalization":
        data.relation = normRelation;
        data.attributes = normAttributes;
        data.fds = normFdsText;
        break;
      case "transaction-isolation":
        data.level = txLevel;
        data.step = txStepIndex;
        break;
      case "query-plans":
        data.sql = queryPlanSql;
        break;
      case "lsm-tree":
        data.entries = collectLsmEntries(lsmRef.current.getState());
        break;
      case "acid":
        data.property = acidProperty;
        break;
      case "cap-theorem":
        data.simType = capSimType;
        break;
      case "mvcc":
        // MVCC is demo-only, just share the mode
        break;
      case "aries-recovery":
        // ARIES is demo-only, just share the mode
        break;
      case "row-vs-column":
        data.queryType = rowColQueryType;
        break;
      case "sql-vs-nosql":
        data.useCase = sqlNoSqlUseCase;
        break;
      case "index-anti-patterns":
        data.pattern = indexAntiPattern;
        break;
      case "caching-patterns":
        data.cachingPattern = cachingPattern;
        break;
      case "star-snowflake":
        data.schemaType = starSnowflakeType;
        break;
      case "connection-pooling":
        data.poolingMode = connPoolMode;
        data.poolSize = connPoolSize;
        break;
    }

    const encoded = encodeShareData(data);
    if (!encoded) {
      toast("error", "Failed to encode visualization state.");
      return;
    }

    const url = new URL(window.location.href);
    // Build a clean path: /database/<mode>
    url.pathname = `/database/${activeMode}`;
    url.search = `?data=${encoded}`;

    navigator.clipboard.writeText(url.toString()).then(
      () => {
        toast("success", "Link copied! Share with your study group.");
        log("Share link copied to clipboard");
      },
      () => {
        // Fallback: if clipboard fails, still show the URL
        toast("info", "Copy this link to share: " + url.toString());
        log("Share link generated (clipboard unavailable)");
      },
    );
  }, [
    activeMode, entities, relationships, btreeOrder, normRelation,
    normAttributes, normFdsText, txLevel, txStepIndex, queryPlanSql,
    acidProperty, capSimType, rowColQueryType, sqlNoSqlUseCase, indexAntiPattern, cachingPattern, log,
  ]);

  // ── URL State Restoration ──────────────────────────────────────

  const urlRestoredRef = useRef(false);
  useEffect(() => {
    if (urlRestoredRef.current) return;
    urlRestoredRef.current = true;

    const params = new URLSearchParams(window.location.search);
    const dataParam = params.get("data");
    if (!dataParam) return;

    const decoded = decodeShareData(dataParam);
    if (!decoded) return;

    const mode = decoded.mode as DatabaseMode | undefined;
    if (!mode) return;

    // Set the mode
    setActiveMode(mode);

    try {
      switch (mode) {
        case "btree-index": {
          const keys = decoded.keys as number[] | undefined;
          const order = (decoded.order as number) || btreeOrder;
          if (keys && Array.isArray(keys) && keys.length > 0) {
            setBtreeOrder(order);
            btreeRef.current = new BTreeViz(order);
            for (const key of keys) {
              if (typeof key === "number" && !isNaN(key)) {
                btreeRef.current.insert(key);
              }
            }
            setBtreeTree(btreeRef.current.getTree());
            log(`Restored shared B-Tree with ${keys.length} keys`);
          }
          break;
        }
        case "hash-index": {
          const entries = decoded.entries as Array<[string, string]> | undefined;
          if (entries && Array.isArray(entries) && entries.length > 0) {
            hashRef.current = new HashIndexViz(4);
            for (const [k, v] of entries) {
              if (typeof k === "string" && typeof v === "string") {
                hashRef.current.insert(k, v);
              }
            }
            setHashState(hashRef.current.getState());
            log(`Restored shared Hash Index with ${entries.length} entries`);
          }
          break;
        }
        case "normalization": {
          if (typeof decoded.relation === "string") setNormRelation(decoded.relation);
          if (typeof decoded.attributes === "string") setNormAttributes(decoded.attributes);
          if (typeof decoded.fds === "string") setNormFdsText(decoded.fds);
          log("Restored shared normalization state");
          break;
        }
        case "transaction-isolation": {
          const level = decoded.level as IsolationLevel | undefined;
          if (level) setTxLevel(level);
          const step = decoded.step as number | undefined;
          if (typeof step === "number") setTxStepIndex(step);
          log(`Restored shared transaction isolation: ${level ?? "default"}`);
          break;
        }
        case "query-plans": {
          if (typeof decoded.sql === "string") {
            setQueryPlanSql(decoded.sql);
            const plan = generateQueryPlan(decoded.sql);
            setQueryPlan(plan);
            log(`Restored shared query plan: ${decoded.sql.substring(0, 50)}`);
          }
          break;
        }
        case "lsm-tree": {
          const entries = decoded.entries as Array<[string, string]> | undefined;
          if (entries && Array.isArray(entries) && entries.length > 0) {
            lsmRef.current = new LSMTreeViz(4, 4);
            for (const [k, v] of entries) {
              if (typeof k === "string" && typeof v === "string") {
                lsmRef.current.write(k, v);
              }
            }
            setLsmState(lsmRef.current.getState());
            log(`Restored shared LSM-Tree with ${entries.length} entries`);
          }
          break;
        }
        case "acid": {
          const property = decoded.property as ACIDProperty | undefined;
          if (property) setAcidProperty(property);
          log(`Restored shared ACID view: ${property ?? "default"}`);
          break;
        }
        case "cap-theorem": {
          const simType = decoded.simType as "cp" | "ap" | undefined;
          if (simType === "cp" || simType === "ap") setCapSimType(simType);
          log(`Restored shared CAP view: ${simType ?? "default"}`);
          break;
        }
        case "star-snowflake": {
          const schemaType = decoded.schemaType as SchemaType | undefined;
          if (schemaType === "star" || schemaType === "snowflake") setStarSnowflakeType(schemaType);
          log(`Restored shared Star/Snowflake view: ${schemaType ?? "default"}`);
          break;
        }
        case "connection-pooling": {
          const poolingMode = decoded.poolingMode as PoolingMode | undefined;
          if (poolingMode === "no-pooling" || poolingMode === "with-pooling") setConnPoolMode(poolingMode);
          const poolSize = decoded.poolSize as number | undefined;
          if (typeof poolSize === "number" && poolSize >= 2 && poolSize <= 20) setConnPoolSize(poolSize);
          log(`Restored shared Connection Pooling view: ${poolingMode ?? "default"}`);
          break;
        }
        default:
          log(`Restored shared view: ${mode}`);
      }
    } catch {
      // Corrupt share data — silently fall back to defaults
      log("Share link had invalid data, using defaults");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Sample Data Handlers (for empty state CTAs) ─────────────

  const handleBtreeLoadSample = useCallback(() => {
    // Reset first
    btreeRef.current = new BTreeViz(btreeOrder);
    const sampleKeys = [10, 20, 5, 15, 25, 30];
    let allSteps: BTreeStep[] = [];
    for (const key of sampleKeys) {
      const steps = btreeRef.current.insert(key);
      allSteps = [...allSteps, ...steps];
    }
    setBtreeTree(btreeRef.current.getTree());
    setBtreeSteps(allSteps);
    setBtreeStepIndex(0);
    setIsBtreePlaying(false);
    log(`Loaded sample B-Tree: inserted [${sampleKeys.join(", ")}] (${allSteps.length} step(s))`);
  }, [btreeOrder, log]);

  const handleHashLoadSample = useCallback(() => {
    hashRef.current = new HashIndexViz(4);
    const sampleEntries = [
      ["alice", "Alice Johnson"],
      ["bob", "Bob Smith"],
      ["carol", "Carol Davis"],
      ["dave", "Dave Wilson"],
    ] as const;
    let allSteps: HashIndexStep[] = [];
    for (const [k, v] of sampleEntries) {
      const steps = hashRef.current.insert(k, v);
      allSteps = [...allSteps, ...steps];
    }
    setHashState(hashRef.current.getState());
    setHashSteps(allSteps);
    setHashStepIndex(0);
    setIsHashPlaying(false);
    log(`Loaded sample Hash Index: inserted ${sampleEntries.length} entries (${allSteps.length} step(s))`);
  }, [log]);

  const handleLsmLoadSample = useCallback(() => {
    lsmRef.current = new LSMTreeViz(4, 4);
    const sampleWrites = [
      ["user:1", "Alice"],
      ["user:2", "Bob"],
      ["user:3", "Carol"],
      ["user:4", "Dave"],
      ["user:5", "Eve"],
    ] as const;
    let allSteps: LSMVizStep[] = [];
    for (const [k, v] of sampleWrites) {
      const steps = lsmRef.current.write(k, v);
      allSteps = [...allSteps, ...steps];
    }
    setLsmState(lsmRef.current.getState());
    setLsmSteps(allSteps);
    setLsmStepIndex(0);
    setIsLsmPlaying(false);
    log(`Loaded sample LSM-Tree: wrote ${sampleWrites.length} keys (${allSteps.length} step(s))`);
  }, [log]);

  // ── Guided Exploration Scenarios (DBL-058) ────────────────────

  const handleBtreeExploreSorted = useCallback(() => {
    // "What happens with sorted data?" — inserts [1,2,3,4,5,6,7] showing maximum splits
    btreeRef.current = new BTreeViz(btreeOrder);
    const sortedKeys = [1, 2, 3, 4, 5, 6, 7];
    let allSteps: BTreeStep[] = [];
    for (const key of sortedKeys) {
      const steps = btreeRef.current.insert(key);
      allSteps = [...allSteps, ...steps];
    }
    setBtreeTree(btreeRef.current.getTree());
    setBtreeSteps(allSteps);
    setBtreeStepIndex(0);
    setIsBtreePlaying(false);
    log(`[Explore] Sorted data: inserted [${sortedKeys.join(",")}] — watch for maximum splits (${allSteps.filter(s => s.operation === "split").length} splits in ${allSteps.length} steps)`);
  }, [btreeOrder, log]);

  const handleBtreeExploreRandom = useCallback(() => {
    // "What happens with random data?" — inserts [4,2,6,1,3,5,7] showing balanced tree
    btreeRef.current = new BTreeViz(btreeOrder);
    const randomKeys = [4, 2, 6, 1, 3, 5, 7];
    let allSteps: BTreeStep[] = [];
    for (const key of randomKeys) {
      const steps = btreeRef.current.insert(key);
      allSteps = [...allSteps, ...steps];
    }
    setBtreeTree(btreeRef.current.getTree());
    setBtreeSteps(allSteps);
    setBtreeStepIndex(0);
    setIsBtreePlaying(false);
    log(`[Explore] Random data: inserted [${randomKeys.join(",")}] — notice fewer splits (${allSteps.filter(s => s.operation === "split").length} splits in ${allSteps.length} steps)`);
  }, [btreeOrder, log]);

  const handleHashExploreCollision = useCallback(() => {
    // "What's a collision cascade?" — inserts keys that all hash to bucket 0
    hashRef.current = new HashIndexViz(4);
    const collisionKeys = ["a", "e", "i", "m", "q"];
    let allSteps: HashIndexStep[] = [];
    for (const key of collisionKeys) {
      const steps = hashRef.current.insert(key, `val_${key}`);
      allSteps = [...allSteps, ...steps];
    }
    setHashState(hashRef.current.getState());
    setHashSteps(allSteps);
    setHashStepIndex(0);
    setIsHashPlaying(false);
    log(`[Explore] Collision cascade: inserted ${collisionKeys.length} keys — watch the chain grow (${allSteps.filter(s => s.operation === "collision").length} collisions)`);
  }, [log]);

  const handleHashExploreResize = useCallback(() => {
    // "Watch a resize happen" — inserts 4 keys into 4-bucket table (triggers resize at load factor 0.75)
    hashRef.current = new HashIndexViz(4);
    const resizeKeys = [["user1", "Alice"], ["user2", "Bob"], ["user3", "Carol"], ["user4", "Dave"]] as const;
    let allSteps: HashIndexStep[] = [];
    for (const [k, v] of resizeKeys) {
      const steps = hashRef.current.insert(k, v);
      allSteps = [...allSteps, ...steps];
    }
    setHashState(hashRef.current.getState());
    setHashSteps(allSteps);
    setHashStepIndex(0);
    setIsHashPlaying(false);
    const resizeCount = allSteps.filter(s => s.operation === "resize").length;
    log(`[Explore] Resize: inserted ${resizeKeys.length} keys into 4 buckets — ${resizeCount > 0 ? `triggered ${resizeCount} resize(s)` : "load factor approaching threshold"} (${allSteps.length} steps)`);
  }, [log]);

  const handleLsmExploreFlush = useCallback(() => {
    // "See a full flush cycle" — writes 5 keys (triggers flush + L0 creation with capacity 4)
    lsmRef.current = new LSMTreeViz(4, 4);
    const flushKeys = [["k1", "v1"], ["k2", "v2"], ["k3", "v3"], ["k4", "v4"], ["k5", "v5"]] as const;
    let allSteps: LSMVizStep[] = [];
    for (const [k, v] of flushKeys) {
      const steps = lsmRef.current.write(k, v);
      allSteps = [...allSteps, ...steps];
    }
    setLsmState(lsmRef.current.getState());
    setLsmSteps(allSteps);
    setLsmStepIndex(0);
    setIsLsmPlaying(false);
    const flushCount = allSteps.filter(s => s.operation === "flush").length;
    log(`[Explore] Flush cycle: wrote ${flushKeys.length} keys — ${flushCount} flush(es) triggered (${allSteps.length} steps)`);
  }, [log]);

  const handleLsmExploreCompaction = useCallback(() => {
    // "Watch compaction in action" — writes enough to trigger L0->L1 compaction
    lsmRef.current = new LSMTreeViz(4, 4);
    const compactionKeys = [
      ["a1", "v1"], ["a2", "v2"], ["a3", "v3"], ["a4", "v4"],
      ["b1", "v5"], ["b2", "v6"], ["b3", "v7"], ["b4", "v8"],
      ["c1", "v9"], ["c2", "v10"], ["c3", "v11"], ["c4", "v12"],
      ["d1", "v13"], ["d2", "v14"], ["d3", "v15"], ["d4", "v16"],
      ["e1", "v17"], ["e2", "v18"],
    ] as const;
    let allSteps: LSMVizStep[] = [];
    for (const [k, v] of compactionKeys) {
      const steps = lsmRef.current.write(k, v);
      allSteps = [...allSteps, ...steps];
    }
    const compactSteps = lsmRef.current.compact(0);
    allSteps = [...allSteps, ...compactSteps];
    setLsmState(lsmRef.current.getState());
    setLsmSteps(allSteps);
    setLsmStepIndex(0);
    setIsLsmPlaying(false);
    const compactCount = allSteps.filter(s => s.operation === "compact").length;
    log(`[Explore] Compaction: wrote ${compactionKeys.length} keys + compact — ${compactCount} compaction step(s) (${allSteps.length} total steps)`);
  }, [log]);

  // ── DBL-044: Normalization badge click from ER diagram ──────
  const handleNormalizationBadgeClick = useCallback(
    (entity: EREntity) => {
      // Pre-fill normalization form with entity's attributes
      const attrNames = entity.attributes.map((a) => a.name);
      const pkAttrs = entity.attributes.filter((a) => a.isPK).map((a) => a.name);
      const nonPkAttrs = entity.attributes.filter((a) => !a.isPK).map((a) => a.name);

      setNormRelation(entity.name);
      setNormAttributes(attrNames.join(", "));

      // Build implicit FDs: PK -> all non-PK attributes
      const fdsLines: string[] = [];
      if (pkAttrs.length > 0 && nonPkAttrs.length > 0) {
        fdsLines.push(`${pkAttrs.join(",")} -> ${nonPkAttrs.join(",")}`);
      }
      setNormFdsText(fdsLines.join("\n"));

      // Switch to normalization mode
      handleSelectMode("normalization");
      log(`Switched to Normalization from ER entity "${entity.name}" (${attrNames.length} attributes)`);
    },
    [handleSelectMode, log],
  );

  // ── DBL-047: Navigate from Query Plans IndexScan to B-Tree mode ──
  const handleGoToBTree = useCallback(() => {
    handleSelectMode("btree-index");
    log("Navigated to B-Tree mode from IndexScan node in Query Plan");
  }, [handleSelectMode, log]);

  // ── DBL-056: Unified Challenge Mode Toggle ─────────────────
  const handleChallengeModeToggle = useCallback(() => {
    setChallengeModeEnabled((prev) => {
      const next = !prev;
      if (next) {
        // Enable all per-mode prediction modes
        setTxPredictionMode(true);
        setPredictionScore({ correct: 0, total: 0 });
        setBtreePredictionMode(true);
        setBtreePredictionScore({ correct: 0, total: 0 });
        setHashPredictionMode(true);
        setHashPredictionScore({ correct: 0, total: 0 });
        log("Challenge Mode ON — prediction active in all modes");
      } else {
        // Disable all per-mode prediction modes and reset scores
        setTxPredictionMode(false);
        setPredictionPaused(false);
        setBtreePredictionMode(false);
        setBtreePredictionPaused(false);
        setHashPredictionMode(false);
        setHashPredictionPaused(false);
        log("Challenge Mode OFF — all predictions disabled");
      }
      return next;
    });
  }, [log]);

  // Combined challenge score across all modes
  const challengeScore = useMemo(() => {
    if (!challengeModeEnabled) return { correct: 0, total: 0 };
    return {
      correct: predictionScore.correct + btreePredictionScore.correct + hashPredictionScore.correct,
      total: predictionScore.total + btreePredictionScore.total + hashPredictionScore.total,
    };
  }, [challengeModeEnabled, predictionScore, btreePredictionScore, hashPredictionScore]);

  const handleNormLoadSample = useCallback(() => {
    setNormRelation("StudentCourse");
    setNormAttributes("StudentID, CourseID, StudentName, CourseName, Instructor");
    setNormFdsText(
      "StudentID -> StudentName\nCourseID -> CourseName,Instructor\nStudentID,CourseID -> StudentName,CourseName,Instructor",
    );
    // Auto-trigger analyze after loading sample
    const attrs = ["StudentID", "CourseID", "StudentName", "CourseName", "Instructor"];
    const fds: FunctionalDependency[] = [
      { lhs: ["StudentID"], rhs: ["StudentName"] },
      { lhs: ["CourseID"], rhs: ["CourseName", "Instructor"] },
      { lhs: ["StudentID", "CourseID"], rhs: ["StudentName", "CourseName", "Instructor"] },
    ];
    const candidateKeys = findCandidateKeys(attrs, fds);
    const currentNF = determineNormalForm(attrs, fds, candidateKeys);
    const firstKey = candidateKeys[0] ?? attrs;
    const closure = computeClosure(firstKey, fds);
    const decomposition = decomposeTo3NF(attrs, fds);
    setNormResult({ closure, candidateKeys, currentNF, decomposition });
    setShowDecomposition(true);
    log(`Loaded sample: Student-Course schema (${currentNF})`);
  }, [log]);

  const handleQueryPlanLoadSample = useCallback(() => {
    const sampleSql = "SELECT * FROM users WHERE id = 1";
    setQueryPlanSql(sampleSql);
    const plan = generateQueryPlan(sampleSql);
    setQueryPlan(plan);
    log(`Loaded sample query plan: ${sampleSql} (cost: ${plan.cost.toFixed(2)})`);
  }, [log]);

  // ── DBL-060: Presentation Mode Handlers ──────────────────────
  const handleEnterPresentation = useCallback(() => {
    setPresentationMode(true);
    const uiState = useUIStore.getState();
    if (uiState.sidebarOpen) uiState.toggleSidebar();
    if (uiState.propertiesPanelOpen) uiState.togglePropertiesPanel();
    if (uiState.bottomPanelOpen) uiState.toggleBottomPanel();
  }, []);
  const handleExitPresentation = useCallback(() => {
    setPresentationMode(false);
    setPresentationPlaying(false);
    if (presentationTimerRef.current) { clearInterval(presentationTimerRef.current); presentationTimerRef.current = null; }
    const uiState = useUIStore.getState();
    if (!uiState.sidebarOpen) uiState.toggleSidebar();
  }, []);
  useEffect(() => { return () => { if (presentationTimerRef.current) clearInterval(presentationTimerRef.current); }; }, []);
  useEffect(() => {
    if (!presentationMode) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      switch (e.key) {
        case "Escape": e.preventDefault(); handleExitPresentation(); break;
        case "ArrowRight": e.preventDefault(); break;
        case " ": e.preventDefault(); setPresentationPlaying((prev) => !prev); break;
        case "r": case "R": e.preventDefault(); break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [presentationMode, handleExitPresentation]);

  // ── Build Panels ────────────────────────────────────────────
  const canvas = useMemo(() => {
    switch (activeMode) {
      case "er-diagram":
        return createElement(ERDiagramCanvas, {
          entities,
          relationships,
          selectedEntityId,
          onSelectEntity: handleSelectEntity,
          onMoveEntity: handleMoveEntity,
          onDragStart: handleDragStart,
          onDragEnd: handleDragEnd,
          onNormalizationBadgeClick: handleNormalizationBadgeClick,
        });
      case "normalization":
        return createElement(NormalizationCanvas, {
          result: normResult,
          showDecomposition,
          onLoadSample: handleNormLoadSample,
        });
      case "transaction-isolation":
        return createElement(TransactionCanvas, {
          steps: txSteps,
          stepIndex: txStepIndex,
          level: txLevel,
          // Compare mode (DBL-046)
          compareMode: txCompareMode,
          compareResult: txCompareResult,
          compareStepIndex: txCompareStepIndex,
          // Prediction mode (DBL-131)
          predictionMode: txPredictionMode,
          predictionPrompt: txPredictionPrompt,
          predictionPaused,
          predictionSelectedOption,
          onPredictionSelect: handlePredictionSelect,
          predictionScore,
        });
      case "btree-index": {
        const currentBtreeStep = btreeSteps[btreeStepIndex] as BTreeStep | undefined;
        return createElement(BTreeCanvas, {
          tree: currentBtreeStep?.tree ?? btreeTree,
          steps: btreeSteps,
          stepIndex: btreeStepIndex,
          highlightNodeId: currentBtreeStep?.highlightNodeId,
          highlightKey: currentBtreeStep?.highlightKey,
          onLoadSample: handleBtreeLoadSample,
          // Prediction mode (DBL-129)
          predictionMode: btreePredictionMode,
          predictionPaused: btreePredictionPaused,
          predictionQuestion: btreePredictionQuestion,
          predictionOptions: btreePredictionOptions,
          predictionCorrectIndex: btreePredictionCorrectIndex,
          predictionSelectedOption: btreePredictionSelectedOption,
          predictionExplanation: btreePredictionExplanation,
          predictionScore: btreePredictionScore,
          onPredictionSelect: handleBtreePredictionSelect,
        });
      }
      case "bplus-tree":
        return createElement("div", {
          className: "flex h-full w-full flex-col overflow-auto bg-background p-4",
        }, createElement(BPlusTreeViz, { className: "w-full", canvasHeight: 500 }));
      case "hash-index": {
        const currentHashStep = hashSteps[hashStepIndex] as HashIndexStep | undefined;
        return createElement(HashIndexCanvas, {
          state: currentHashStep?.state ?? hashState,
          steps: hashSteps,
          stepIndex: hashStepIndex,
          highlightBucket: currentHashStep?.highlightBucket,
          highlightKey: currentHashStep?.highlightKey,
          onLoadSample: handleHashLoadSample,
          // Prediction mode (DBL-130)
          predictionMode: hashPredictionMode,
          predictionPaused: hashPredictionPaused,
          predictionQuestion: hashPredictionQuestion,
          predictionOptions: hashPredictionOptions,
          predictionCorrectIndex: hashPredictionCorrectIndex,
          predictionSelectedOption: hashPredictionSelectedOption,
          predictionExplanation: hashPredictionExplanation,
          predictionScore: hashPredictionScore,
          onPredictionSelect: handleHashPredictionSelect,
          predictionCollisionPhase: hashPredictionCollisionPhase,
          predictionCollisionOptions: hashPredictionCollisionOptions,
          predictionCollisionSelected: hashPredictionCollisionSelected,
          predictionCollisionExplanation: hashPredictionCollisionExplanation,
          onPredictionCollisionSelect: handleHashPredictionCollisionSelect,
        });
      }
      case "query-plans":
        return createElement(QueryPlanCanvas, { plan: queryPlan, onLoadSample: handleQueryPlanLoadSample, onGoToBTree: handleGoToBTree });
      case "lsm-tree": {
        return createElement(LSMCanvas, {
          state: lsmState,
          steps: lsmSteps,
          stepIndex: lsmStepIndex,
          onLoadSample: handleLsmLoadSample,
        });
      }
      case "acid":
        return createElement(ACIDCanvas, {
          activeProperty: acidProperty,
          stepIndex: acidStepIndex,
          onSelectProperty: handleAcidPropertyChange,
        });
      case "cap-theorem":
        return createElement(CAPTheoremCanvas, {
          selectedDb: capSelectedDb,
          onSelectDb: handleCapSelectDb,
          simulationType: capSimType,
          simulationStepIndex: capStepIndex,
        });
      case "mvcc":
        return createElement(MVCCCanvas, {
          steps: mvccSteps,
          stepIndex: mvccStepIndex,
          onRunDemo: handleMvccRunDemo,
        });
      case "aries-recovery":
        return createElement(ARIESCanvas, {
          steps: ariesSteps,
          stepIndex: ariesStepIndex,
          onRunDemo: handleAriesRunDemo,
        });
      case "row-vs-column":
        return createElement(RowColumnCanvas, {
          queryType: rowColQueryType,
          onQueryTypeChange: handleRowColQueryTypeChange,
        });
      case "sql-vs-nosql":
        return createElement(SQLvsNoSQLCanvas, {
          selectedUseCase: sqlNoSqlUseCase,
          onUseCaseChange: handleSqlNoSqlUseCaseChange,
        });
      case "index-anti-patterns":
        return createElement(IndexAntiPatternsCanvas, {
          selectedPattern: indexAntiPattern,
          onPatternChange: handleIndexAntiPatternChange,
        });
      case "caching-patterns":
        return createElement(CachingPatternsCanvas, {
          selectedPattern: cachingPattern,
          onPatternChange: handleCachingPatternChange,
          stepIndex: cachingStepIndex,
          totalSteps: cachingSteps.length,
          isPlaying: isCachingPlaying,
          onStep: handleCachingStep,
          onStepBack: handleCachingStepBack,
          onPlay: handleCachingPlay,
          onPause: handleCachingPause,
          onReset: handleCachingReset,
        });
      case "join-algorithms":
        return createElement(JoinAlgorithmsCanvas, {
          state: joinState,
          steps: joinSteps,
          stepIndex: joinStepIndex,
        });
      case "star-snowflake":
        return createElement(StarSnowflakeCanvas, {
          schemaType: starSnowflakeType,
          onSchemaTypeChange: handleStarSnowflakeTypeChange,
          stepIndex: starSnowflakeStepIndex,
          totalSteps: starSnowflakeSteps.length,
          isPlaying: isStarSnowflakePlaying,
          onStep: handleStarSnowflakeStep,
          onStepBack: handleStarSnowflakeStepBack,
          onPlay: handleStarSnowflakePlay,
          onPause: handleStarSnowflakePause,
          onReset: handleStarSnowflakeReset,
        });
      case "connection-pooling":
        return createElement(ConnectionPoolingCanvas, {
          poolingMode: connPoolMode,
          onPoolingModeChange: handleConnPoolModeChange,
          poolSize: connPoolSize,
          onPoolSizeChange: handleConnPoolSizeChange,
          stepIndex: connPoolStepIndex,
          totalSteps: connPoolSteps.length,
          isPlaying: isConnPoolPlaying,
          onStep: handleConnPoolStep,
          onStepBack: handleConnPoolStepBack,
          onPlay: handleConnPoolPlay,
          onPause: handleConnPoolPause,
          onReset: handleConnPoolReset,
        });
    }
    // Exhaustive check: TypeScript errors here if a DatabaseMode is missing from the switch
    const _exhaustive: never = activeMode;
    return createElement("div", {
      className: "flex h-full w-full items-center justify-center bg-background p-4",
    },
      createElement("div", { className: "text-center" },
        createElement(Database, { className: "mx-auto mb-3 h-16 w-16 text-foreground-subtle opacity-30" }),
        createElement("p", { className: "text-sm text-foreground-muted" }, `Unknown mode: ${_exhaustive}`),
      ),
    );
  }, [
    activeMode,
    entities,
    relationships,
    selectedEntityId,
    handleSelectEntity,
    handleMoveEntity,
    handleNormalizationBadgeClick,
    normResult,
    showDecomposition,
    handleNormLoadSample,
    txSteps,
    txStepIndex,
    txLevel,
    txCompareMode,
    txCompareResult,
    txCompareStepIndex,
    txPredictionMode,
    txPredictionPrompt,
    predictionPaused,
    predictionSelectedOption,
    handlePredictionSelect,
    predictionScore,
    btreeTree,
    btreeSteps,
    btreeStepIndex,
    handleBtreeLoadSample,
    btreePredictionMode,
    btreePredictionPaused,
    btreePredictionQuestion,
    btreePredictionOptions,
    btreePredictionCorrectIndex,
    btreePredictionSelectedOption,
    btreePredictionExplanation,
    btreePredictionScore,
    handleBtreePredictionSelect,
    hashState,
    hashSteps,
    hashStepIndex,
    handleHashLoadSample,
    hashPredictionMode,
    hashPredictionPaused,
    hashPredictionQuestion,
    hashPredictionOptions,
    hashPredictionCorrectIndex,
    hashPredictionSelectedOption,
    hashPredictionExplanation,
    hashPredictionScore,
    handleHashPredictionSelect,
    hashPredictionCollisionPhase,
    hashPredictionCollisionOptions,
    hashPredictionCollisionSelected,
    hashPredictionCollisionExplanation,
    handleHashPredictionCollisionSelect,
    queryPlan,
    handleQueryPlanLoadSample,
    handleGoToBTree,
    lsmState,
    lsmSteps,
    lsmStepIndex,
    handleLsmLoadSample,
    acidProperty,
    acidStepIndex,
    handleAcidPropertyChange,
    capSelectedDb,
    handleCapSelectDb,
    capSimType,
    capStepIndex,
    mvccSteps,
    mvccStepIndex,
    handleMvccRunDemo,
    ariesSteps,
    ariesStepIndex,
    handleAriesRunDemo,
    rowColQueryType,
    handleRowColQueryTypeChange,
    sqlNoSqlUseCase,
    handleSqlNoSqlUseCaseChange,
    indexAntiPattern,
    cachingPattern,
    handleCachingPatternChange,
    cachingStepIndex,
    cachingSteps,
    isCachingPlaying,
    handleCachingStep,
    handleCachingStepBack,
    handleCachingPlay,
    handleCachingPause,
    handleCachingReset,
    handleIndexAntiPatternChange,
    joinState,
    joinSteps,
    joinStepIndex,
    starSnowflakeType,
    starSnowflakeStepIndex,
    starSnowflakeSteps,
    isStarSnowflakePlaying,
    handleStarSnowflakeTypeChange,
    handleStarSnowflakeStep,
    handleStarSnowflakeStepBack,
    handleStarSnowflakePlay,
    handleStarSnowflakePause,
    handleStarSnowflakeReset,
    connPoolMode,
    connPoolSize,
    connPoolStepIndex,
    connPoolSteps,
    isConnPoolPlaying,
    handleConnPoolModeChange,
    handleConnPoolSizeChange,
    handleConnPoolStep,
    handleConnPoolStepBack,
    handleConnPoolPlay,
    handleConnPoolPause,
    handleConnPoolReset,
  ]);

  return {
    sidebar: createElement(DatabaseSidebar, {
      activeMode,
      onSelectMode: handleSelectMode,
      onShare: handleShare,
      onAddEntity: handleAddEntity,
      onAddRelationship: handleAddRelationship,
      onGenerateSQL: handleGenerateSQL,
      onLoadSample: handleLoadSample,
      entities,
      // DBL-033: Undo/Redo
      onUndo: handleUndo,
      onRedo: handleRedo,
      canUndo: undoStackRef.current.length > 0,
      canRedo: redoStackRef.current.length > 0,
      undoRedoVersion,
      // DBL-049: Export PNG
      onExport: handleExport,
      txLevel,
      onTxLevelChange: handleTxLevelChange,
      txStepIndex,
      txTotalSteps: txSteps.length,
      onTxStep: txPredictionMode ? handleTxStepWithPrediction : handleTxStep,
      onTxStepBack: handleTxStepBack,
      onTxPlay: handleTxPlay,
      onTxReset: handleTxReset,
      // Compare mode (DBL-046)
      txCompareMode,
      onTxCompareModeToggle: handleTxCompareModeToggle,
      txCompareScenario,
      onTxCompareScenarioChange: handleTxCompareScenarioChange,
      txCompareStepIndex,
      txCompareTotalSteps,
      onTxCompareStep: handleTxCompareStep,
      onTxComparePlay: handleTxComparePlay,
      onTxCompareReset: handleTxCompareReset,
      // Write Skew (DBL-080)
      onLoadWriteSkew: handleLoadWriteSkew,
      txHasOverride: txOverrideSteps !== null,
      // Prediction mode (DBL-131)
      txPredictionMode,
      onTxPredictionModeToggle: handlePredictionModeToggle,
      predictionPaused,
      btreeOrder,
      onBtreeOrderChange: handleBtreeOrderChange,
      btreeKeyInput,
      onBtreeKeyInputChange: setBtreeKeyInput,
      onBtreeInsert: handleBtreeInsert,
      btreeSearchInput,
      onBtreeSearchInputChange: setBtreeSearchInput,
      onBtreeSearch: handleBtreeSearch,
      btreeSteps,
      btreeStepIndex,
      isBtreePlaying,
      onBtreeStepBack: handleBtreeStepBack,
      onBtreeStepForward: btreePredictionMode ? handleBtreeStepWithPrediction : handleBtreeStepForward,
      onBtreePlay: handleBtreePlay,
      onBtreePause: handleBtreePause,
      onBtreeReset: handleBtreeReset,
      // Explore scenarios (DBL-058)
      onBtreeExploreSorted: handleBtreeExploreSorted,
      onBtreeExploreRandom: handleBtreeExploreRandom,
      // B-Tree prediction mode (DBL-129)
      btreePredictionMode,
      onBtreePredictionModeToggle: handleBtreePredictionModeToggle,
      btreePredictionPaused,
      btreePredictionScore,
      hashKeyInput,
      onHashKeyInputChange: setHashKeyInput,
      hashValueInput,
      onHashValueInputChange: setHashValueInput,
      onHashInsert: handleHashInsert,
      hashSearchInput,
      onHashSearchInputChange: setHashSearchInput,
      onHashSearch: handleHashSearch,
      hashDeleteInput,
      onHashDeleteInputChange: setHashDeleteInput,
      onHashDelete: handleHashDelete,
      hashSteps,
      hashStepIndex,
      isHashPlaying,
      onHashStepBack: handleHashStepBack,
      onHashStepForward: hashPredictionMode ? handleHashStepWithPrediction : handleHashStepForward,
      onHashPlay: handleHashPlay,
      onHashPause: handleHashPause,
      onHashReset: handleHashReset,
      onHashExploreCollision: handleHashExploreCollision,
      onHashExploreResize: handleHashExploreResize,
      // Hash prediction mode (DBL-130)
      hashPredictionMode,
      onHashPredictionModeToggle: handleHashPredictionModeToggle,
      hashPredictionPaused,
      hashPredictionScore,
      queryPlanSql,
      onQueryPlanSqlChange: setQueryPlanSql,
      onQueryPlanAnalyze: handleQueryPlanAnalyze,
      lsmKeyInput,
      onLsmKeyInputChange: setLsmKeyInput,
      lsmValueInput,
      onLsmValueInputChange: setLsmValueInput,
      onLsmWrite: handleLsmWrite,
      lsmReadInput,
      onLsmReadInputChange: setLsmReadInput,
      onLsmRead: handleLsmRead,
      onLsmFlush: handleLsmFlush,
      onLsmCompact: handleLsmCompact,
      lsmSteps,
      lsmStepIndex,
      isLsmPlaying,
      onLsmStepBack: handleLsmStepBack,
      onLsmStepForward: handleLsmStepForward,
      onLsmPlay: handleLsmPlay,
      onLsmPause: handleLsmPause,
      onLsmReset: handleLsmReset,
      onLsmExploreFlush: handleLsmExploreFlush,
      onLsmExploreCompaction: handleLsmExploreCompaction,
      onLsmCheckpoint: handleLsmCheckpoint,
      onLsmToggleBloom: handleLsmToggleBloom,
      lsmBloomEnabled: lsmRef.current.bloomEnabled,
      // ACID controls
      acidProperty,
      acidStepIndex,
      acidTotalSteps: acidSteps.length,
      onAcidPropertyChange: handleAcidPropertyChange,
      onAcidStepBack: handleAcidStepBack,
      onAcidStep: handleAcidStep,
      onAcidPlay: handleAcidPlay,
      onAcidReset: handleAcidReset,
      // CAP controls
      capSimType,
      capStepIndex,
      capTotalSteps: capSteps.length,
      onCapSimTypeChange: handleCapSimTypeChange,
      onCapStepBack: handleCapStepBack,
      onCapStep: handleCapStep,
      onCapPlay: handleCapPlay,
      onCapReset: handleCapReset,
      // MVCC controls
      mvccSteps,
      mvccStepIndex,
      mvccTotalSteps: mvccSteps.length,
      isMvccPlaying,
      onMvccRunDemo: handleMvccRunDemo,
      onMvccStepBack: handleMvccStepBack,
      onMvccStepForward: handleMvccStepForward,
      onMvccPlay: handleMvccPlay,
      onMvccPause: handleMvccPause,
      onMvccReset: handleMvccReset,
      // ARIES Recovery controls (DBL-091)
      ariesSteps,
      ariesStepIndex,
      ariesTotalSteps: ariesSteps.length,
      isAriesPlaying,
      onAriesRunDemo: handleAriesRunDemo,
      onAriesStepBack: handleAriesStepBack,
      onAriesStepForward: handleAriesStepForward,
      onAriesPlay: handleAriesPlay,
      onAriesPause: handleAriesPause,
      onAriesReset: handleAriesReset,
      // Speed controls
      animationSpeed,
      onAnimationSpeedChange: setAnimationSpeed,
      smartSpeed,
      onSmartSpeedChange: setSmartSpeed,
      // Presentation mode (DBL-060)
      onEnterPresentation: handleEnterPresentation,
      // Caching Patterns (DBL-079)
      cachingPattern,
      cachingStepIndex,
      cachingTotalSteps: cachingSteps.length,
      isCachingPlaying,
      onCachingPatternChange: handleCachingPatternChange,
      onCachingStep: handleCachingStep,
      onCachingStepBack: handleCachingStepBack,
      onCachingPlay: handleCachingPlay,
      onCachingPause: handleCachingPause,
      onCachingReset: handleCachingReset,
      // Join Algorithms (DBL-076)
      joinAlgorithm,
      joinSteps,
      joinStepIndex,
      joinTotalSteps: joinSteps.length,
      isJoinPlaying,
      onJoinAlgorithmChange: handleJoinAlgorithmChange,
      onJoinRun: handleJoinRun,
      onJoinStepBack: handleJoinStepBack,
      onJoinStepForward: handleJoinStepForward,
      onJoinPlay: handleJoinPlay,
      onJoinPause: handleJoinPause,
      onJoinReset: handleJoinReset,
      // Star/Snowflake Schema (DBL-088)
      starSnowflakeType,
      starSnowflakeStepIndex,
      starSnowflakeTotalSteps: starSnowflakeSteps.length,
      isStarSnowflakePlaying,
      onStarSnowflakeTypeChange: handleStarSnowflakeTypeChange,
      onStarSnowflakeStep: handleStarSnowflakeStep,
      onStarSnowflakeStepBack: handleStarSnowflakeStepBack,
      onStarSnowflakePlay: handleStarSnowflakePlay,
      onStarSnowflakePause: handleStarSnowflakePause,
      onStarSnowflakeReset: handleStarSnowflakeReset,
      // Connection Pooling (DBL-093)
      connPoolMode,
      connPoolSize,
      connPoolStepIndex,
      connPoolTotalSteps: connPoolSteps.length,
      isConnPoolPlaying,
      onConnPoolModeChange: handleConnPoolModeChange,
      onConnPoolSizeChange: handleConnPoolSizeChange,
      onConnPoolStep: handleConnPoolStep,
      onConnPoolStepBack: handleConnPoolStepBack,
      onConnPoolPlay: handleConnPoolPlay,
      onConnPoolPause: handleConnPoolPause,
      onConnPoolReset: handleConnPoolReset,
      // Tour replay (DBL-178)
      onTourReplay: handleTourReplay,
      // Challenge Mode (DBL-056)
      challengeModeEnabled,
      onChallengeModeToggle: handleChallengeModeToggle,
      challengeScore,
    }),
    canvas,
    properties: createElement(DatabaseProperties, {
      activeMode,
      selectedEntity,
      onUpdateEntity: handleUpdateEntity,
      onDeleteEntity: handleDeleteEntity,
      onAddAttribute: handleAddAttribute,
      onUpdateAttribute: handleUpdateAttribute,
      onDeleteAttribute: handleDeleteAttribute,
      normRelation,
      normAttributes,
      normFdsText,
      onNormRelationChange: setNormRelation,
      onNormAttributesChange: setNormAttributes,
      onNormFdsTextChange: setNormFdsText,
      onAnalyze: handleAnalyze,
      normResult,
      txSteps,
      txStepIndex,
      btreeSteps,
      btreeStepIndex,
      btreeOrder,
      hashState,
      hashSteps,
      hashStepIndex,
      queryPlan,
      lsmState,
      lsmSteps,
      lsmStepIndex,
      // ACID
      acidProperty,
      acidSteps,
      acidStepIndex,
      onSelectMode: handleSelectMode,
      // CAP
      capSelectedDb,
      capSimType,
      capSteps,
      capStepIndex,
      // MVCC
      mvccSteps,
      mvccStepIndex,
      // ARIES Recovery (DBL-091)
      ariesSteps,
      ariesStepIndex,
      // Row vs Column
      rowColQueryType,
      // SQL vs NoSQL
      sqlNoSqlUseCase,
      // Index Anti-Patterns
      indexAntiPattern,
      // Caching Patterns
      cachingPattern,
      // Join Algorithms (DBL-076)
      joinAlgorithm,
      joinSteps,
      joinStepIndex,
      // Star/Snowflake Schema (DBL-088)
      starSnowflakeType,
      // Connection Pooling (DBL-093)
      connPoolMode,
      connPoolSize,
    }),
    bottomPanel: createElement(DatabaseBottomPanel, {
      activeMode,
      logEntries,
      generatedSQL,
      generatedNoSQL,
    }),
    mockOverlay: createElement(
      Fragment,
      null,
      createElement(DatabaseTour, {
        forceShow: tourForceShow,
        onComplete: handleTourComplete,
      }),
      presentationMode
        ? createElement(
            "div",
            { className: "fixed inset-0 z-50 flex flex-col bg-black/95" },
            createElement(
              "div",
              { className: "flex items-center justify-between px-6 py-4" },
              createElement(
                "div",
                { className: "flex items-center gap-3" },
                createElement(
                  "span",
                  {
                    className:
                      "rounded-md bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/50",
                  },
                  "Database",
                ),
                createElement(
                  "h1",
                  { className: "text-lg font-bold text-white" },
                  activeMode
                    .replace(/-/g, " ")
                    .replace(/\b\w/g, (c: string) => c.toUpperCase()),
                ),
                presentationPlaying
                  ? createElement(
                      "span",
                      {
                        className:
                          "ml-2 animate-pulse text-xs text-emerald-400",
                      },
                      "Playing",
                    )
                  : createElement(
                      "span",
                      { className: "ml-2 text-xs text-white/40" },
                      "Paused",
                    ),
              ),
              createElement(
                "div",
                { className: "flex items-center gap-2" },
                createElement(
                  "span",
                  { className: "text-[10px] text-white/30" },
                  "Arrow Right: Step | Space: Play/Pause | R: Reset | Esc: Exit",
                ),
                createElement(
                  "button",
                  {
                    onClick: handleExitPresentation,
                    className:
                      "flex items-center gap-1.5 rounded-md border border-white/20 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white",
                  },
                  "Exit",
                ),
              ),
            ),
            createElement(
              "div",
              {
                className:
                  "flex flex-1 items-center justify-center px-12 pb-12",
              },
              createElement(
                "div",
                {
                  className:
                    "h-full w-full overflow-hidden rounded-xl border border-white/10 bg-background",
                  style: { fontSize: "150%" },
                },
                canvas,
              ),
            ),
          )
        : null,
    ),
  };
}

export const DatabaseModule = memo(function DatabaseModule() {
  return null;
});
