/**
 * LLD Module — Shared constants, color maps, and type definitions.
 * Split from LLDModule.tsx (LLD-037).
 */

import type {
  UMLClass,
  PatternCategory,
  SOLIDPrinciple,
} from "@/lib/lld";

// ── Category Constants ───────────────────────────────────

export const CATEGORY_LABELS: Record<PatternCategory, string> = {
  creational: "Creational",
  structural: "Structural",
  behavioral: "Behavioral",
  modern: "Modern",
  resilience: "Resilience",
  concurrency: "Concurrency",
  "ai-agent": "AI Agent",
};

export const CATEGORY_ORDER: PatternCategory[] = [
  "creational",
  "structural",
  "behavioral",
  "modern",
  "resilience",
  "concurrency",
  "ai-agent",
];

// ── Stereotype Styling ───────────────────────────────────

export const STEREOTYPE_BORDER_COLOR: Record<UMLClass["stereotype"], string> = {
  interface: "var(--lld-stereo-interface)",
  abstract: "var(--lld-stereo-abstract)",
  enum: "var(--lld-stereo-enum)",
  class: "var(--lld-stereo-class)",
};

export const STEREOTYPE_LABEL: Record<UMLClass["stereotype"], string> = {
  interface: "interface",
  abstract: "abstract",
  enum: "enumeration",
  class: "",
};

export const VISIBILITY_ICON: Record<string, string> = {
  "+": "+",
  "-": "\u2212",
  "#": "#",
  "~": "~",
};

/** Beginner-friendly tooltips explaining UML visibility modifiers. */
export const VISIBILITY_TOOLTIP: Record<string, string> = {
  "+": "public — accessible from any class",
  "-": "private — accessible only within this class",
  "#": "protected — accessible within this class and subclasses",
  "~": "package — accessible within the same package/module",
};

/** Beginner-friendly tooltips explaining UML relationship types. */
export const RELATIONSHIP_TOOLTIPS: Record<string, string> = {
  inheritance: "A child class IS-A parent class",
  realization: "A class implements all methods defined in an interface",
  composition: "A whole CONTAINS parts (parts die when whole dies)",
  aggregation: "A whole HAS parts (parts can exist independently)",
  association: "One class uses or references another class",
  dependency: "One class temporarily depends on another",
};

/** Beginner-friendly tooltips explaining pattern categories. */
export const CATEGORY_TOOLTIPS: Record<string, string> = {
  creational: "Patterns that control how objects are created",
  structural: "Patterns that organize classes into larger structures",
  behavioral: "Patterns that manage communication between objects",
  modern: "Contemporary patterns for modern software architectures",
  resilience: "Patterns that help systems recover from failures",
  concurrency: "Patterns for safe multi-threaded execution",
  "ai-agent": "Patterns for building autonomous AI agent systems",
};

// ── UML Canvas Dimensions ────────────────────────────────

/** 220px fits a typical class name + longest attribute/method signature without
 *  horizontal scrolling, while allowing 3-4 boxes side-by-side on a 1440px viewport. */
export const CLASS_BOX_WIDTH = 220;

/** 32px gives one 13px line of text + 9.5px padding top/bottom — visually balanced
 *  without wasting vertical real-estate on dense diagrams. */
export const CLASS_HEADER_HEIGHT = 32;

/** 18px per row: intentionally NOT on a 4px grid — kept for density so that classes
 *  with 5+ attributes/methods don't balloon. Matches 11px monospace font + 7px gap. */
export const ROW_HEIGHT = 18;

/** 4px section padding between dividers and content rows — minimal breathing room
 *  that keeps the overall box compact while staying readable. */
export const SECTION_PAD = 4;

/** Stereotype label height (16px) for «interface», «abstract», «enumeration» badges
 *  rendered above the class name. Sized for 11px font + 5px vertical padding. */
export const STEREOTYPE_LABEL_HEIGHT = 16;

/** Viewbox padding around all classes — 80px ensures connection labels and cardinality
 *  text near edges don't get clipped by the SVG boundary. */
export const CANVAS_VIEWBOX_PAD = 80;

/** Grid spacing for the subtle dot-grid background pattern (40x40 user-space units).
 *  40 divides evenly into CLASS_BOX_WIDTH (220 / 40 ≈ 5.5 cells) for visual rhythm. */
export const CANVAS_GRID_SIZE = 40;

/** Connection handle radius (5px) — large enough to be a comfortable drag target on
 *  desktop while not occluding class box content at default zoom. */
export const CONNECTION_HANDLE_R = 5;

/** Shadow offset (2px) for the drop-shadow layer behind each class box. Subtle enough
 *  to provide depth without competing with the border styling. */
export const CLASS_BOX_SHADOW_OFFSET = 2;

// ── SOLID Principle Colors ───────────────────────────────

export const PRINCIPLE_COLORS: Record<string, string> = {
  SRP: "var(--lld-solid-srp)",
  OCP: "var(--lld-solid-ocp)",
  LSP: "var(--lld-solid-lsp)",
  ISP: "var(--lld-solid-isp)",
  DIP: "var(--lld-solid-dip)",
};

// ── Difficulty Styling ───────────────────────────────────

export const DIFFICULTY_LABELS: Record<number, string> = {
  1: "Easy",
  2: "Easy",
  3: "Medium",
  4: "Hard",
  5: "Expert",
};

export const DIFFICULTY_COLORS: Record<number, string> = {
  1: "var(--lld-diff-easy)",
  2: "var(--lld-diff-easy)",
  3: "var(--lld-diff-medium)",
  4: "var(--lld-diff-hard)",
  5: "var(--lld-diff-expert)",
};

// ── Glassmorphism Shared Class Strings ──────────────────

/** Glassmorphism container: rounded-xl + translucent bg + border + blur */
export const GLASS_CONTAINER =
  "rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm";

/** Gradient header text: primary to violet */
export const GLASS_GRADIENT_TEXT =
  "bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent";

/** Primary action button: rounded-full + glow ring */
export const GLASS_BTN_PRIMARY =
  "rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-[0_0_12px_rgba(var(--primary-rgb),0.4)] transition-all hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(var(--primary-rgb),0.55)]";

/** Secondary button: rounded-xl + border/30 + blur */
export const GLASS_BTN_SECONDARY =
  "rounded-xl border border-border/30 bg-background/60 px-3 py-1.5 text-xs font-medium text-foreground-muted backdrop-blur-sm transition-all hover:bg-accent hover:text-foreground";

/** Icon button: rounded-full + bg-background/80 */
export const GLASS_BTN_ICON =
  "flex items-center justify-center rounded-full bg-background/80 transition-colors hover:bg-accent hover:text-foreground";

/** Badge: rounded-full with color glow */
export const GLASS_BADGE =
  "rounded-full px-2.5 py-0.5 text-[10px] font-semibold";

/** Info box: accent color border/30 + bg/5 + blur + shadow glow */
export const GLASS_INFO_BOX =
  "rounded-xl border border-primary/30 bg-primary/5 backdrop-blur-sm shadow-[0_0_15px_rgba(var(--primary-rgb),0.08)]";

// ── Sequence Diagram Constants ───────────────────────────

/** Participant box width — 120px comfortably holds a class/actor name up to ~14
 *  characters at 11px monospace before needing truncation. */
export const SEQ_PARTICIPANT_WIDTH = 120;

/** Participant box height — 36px (9*4px grid) gives a single-line name plus balanced
 *  vertical padding. */
export const SEQ_PARTICIPANT_HEIGHT = 36;

/** 180px gap between participant centers: chosen so that a diagonal message arrow
 *  spanning one gap has ≈30° angle, keeping labels readable. Also leaves room for
 *  activation boxes (12px) and message labels on horizontal arrows. */
export const SEQ_PARTICIPANT_GAP = 180;

/** 50px per message row: provides clear vertical separation between arrow rows so
 *  message labels (11px font) and self-call loops (which need ≈36px arc height)
 *  don't overlap. */
export const SEQ_MESSAGE_ROW_HEIGHT = 50;

/** Top margin above participant boxes. */
export const SEQ_TOP_MARGIN = 20;

/** Y-coordinate where lifelines begin (below participant boxes + 10px breathing room). */
export const SEQ_LIFELINE_START = SEQ_TOP_MARGIN + SEQ_PARTICIPANT_HEIGHT + 10;

/** Width of the activation bar overlay on lifelines — 12px is standard UML, narrow
 *  enough not to occlude the lifeline dashes but wide enough to be clickable. */
export const SEQ_ACTIVATION_WIDTH = 12;

import type { SequenceMessage } from "@/lib/lld";

export const SEQ_TYPE_COLORS: Record<SequenceMessage["type"], string> = {
  sync: "var(--lld-seq-sync)",
  async: "var(--lld-seq-async)",
  return: "var(--lld-seq-return)",
  self: "var(--lld-seq-self)",
};

// ── State Machine Constants ──────────────────────────────

/** Corner radius for state rounded-rects — 24px gives a pill-like shape that
 *  visually distinguishes states from the angular UML class boxes. */
export const SM_STATE_RX = 24;
export const SM_STATE_RY = 24;

/** State box dimensions — 140x48 fits a state label up to ~16 chars; wider than
 *  tall to favour horizontal layout and leave room for transition arrows. */
export const SM_STATE_WIDTH = 140;
export const SM_STATE_HEIGHT = 48;

/** Initial/final state dot radius — 8px matches standard UML notation sizing. */
export const SM_INITIAL_DOT_R = 8;

/** Horizontal gap between state machine nodes in the auto-layout grid. */
export const SM_LAYOUT_GAP_X = 220;

/** Vertical gap between state machine node rows in the auto-layout grid. */
export const SM_LAYOUT_GAP_Y = 140;

/** Margin around the state machine layout to keep nodes away from SVG edges. */
export const SM_LAYOUT_MARGIN = 100;

// ── Zoom Constants ───────────────────────────────────────

/** Min zoom 25% — lets users see the full diagram even with 20+ classes. */
export const ZOOM_MIN = 0.25;

/** Max zoom 4x — allows inspection of small font attributes at 400%. */
export const ZOOM_MAX = 4;

/** 15% step per scroll tick — smooth-feeling, reaches 2x in ~5 scroll events. */
export const ZOOM_STEP = 0.15;

// ── SOLID Principle Labels ───────────────────────────────

export const SOLID_PRINCIPLE_LABELS: Record<SOLIDPrinciple, string> = {
  SRP: "Single Responsibility",
  OCP: "Open/Closed",
  LSP: "Liskov Substitution",
  ISP: "Interface Segregation",
  DIP: "Dependency Inversion",
};

// ── Shared Type Definitions ──────────────────────────────

export type SidebarMode = "patterns" | "progress" | "palette" | "solid" | "problems" | "sequence" | "state-machine" | "code-to-diagram";

export type PracticeTimerOption = 15 | 30 | 45 | 60;

export interface PracticeState {
  problem: import("@/lib/lld").LLDProblem;
  timerMinutes: PracticeTimerOption;
  startTime: number;
  submitted: boolean;
  checkedHints: Set<number>;
}

export interface SequencePlaybackState {
  playing: boolean;
  currentStep: number;
  speed: number;
}

export interface StateMachineSimState {
  active: boolean;
  currentStateId: string;
  history: string[];
  animatingTransition: string | null;
  toastMessage: string | null;
}

export type LLDBottomTab = "explanation" | "behavioral-sim" | "sequence-latency" | "pattern-quiz" | "solid-quiz" | "scenario-challenge" | "daily-challenge";

// ── Shared Helper Functions ──────────────────────────────

export function classBoxHeight(c: UMLClass): number {
  const attrRows = Math.max(c.attributes.length, 0);
  const methRows = Math.max(c.methods.length, 0);
  const stereoH = c.stereotype !== "class" ? 16 : 0;
  return (
    CLASS_HEADER_HEIGHT +
    stereoH +
    SECTION_PAD +
    attrRows * ROW_HEIGHT +
    SECTION_PAD +
    methRows * ROW_HEIGHT +
    SECTION_PAD
  );
}

export function classCenter(c: UMLClass): { cx: number; cy: number } {
  return {
    cx: c.x + CLASS_BOX_WIDTH / 2,
    cy: c.y + classBoxHeight(c) / 2,
  };
}

export function borderPoint(
  cls: UMLClass,
  tx: number,
  ty: number,
): { x: number; y: number } {
  const w = CLASS_BOX_WIDTH;
  const h = classBoxHeight(cls);
  const cx = cls.x + w / 2;
  const cy = cls.y + h / 2;
  const dx = tx - cx;
  const dy = ty - cy;

  if (dx === 0 && dy === 0) return { x: cx, y: cy };

  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  const scaleX = absDx > 0 ? (w / 2) / absDx : Infinity;
  const scaleY = absDy > 0 ? (h / 2) / absDy : Infinity;
  const scale = Math.min(scaleX, scaleY);

  return {
    x: cx + dx * scale,
    y: cy + dy * scale,
  };
}

import type { StateNode, StateMachineData } from "@/lib/lld";

export function smStateColor(state: StateNode): string {
  if (state.isInitial && state.isFinal) return "var(--lld-solid-srp)";
  if (state.isInitial) return "var(--lld-stereo-interface)";
  if (state.isFinal) return "var(--lld-stereo-enum)";
  return "var(--lld-canvas-border)";
}

export function layoutStateMachine(data: StateMachineData): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const cols = Math.max(Math.ceil(Math.sqrt(data.states.length)), 2);
  const gapX = SM_LAYOUT_GAP_X;
  const gapY = SM_LAYOUT_GAP_Y;
  const margin = SM_LAYOUT_MARGIN;

  const ordered = [...data.states].sort((a, b) => {
    if (a.isInitial && !b.isInitial) return -1;
    if (!a.isInitial && b.isInitial) return 1;
    if (a.isFinal && !b.isFinal) return 1;
    if (!a.isFinal && b.isFinal) return -1;
    return 0;
  });

  ordered.forEach((state, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    positions.set(state.id, {
      x: margin + col * gapX,
      y: margin + row * gapY,
    });
  });

  return positions;
}

export function smStateCenter(pos: { x: number; y: number }): { cx: number; cy: number } {
  return {
    cx: pos.x + SM_STATE_WIDTH / 2,
    cy: pos.y + SM_STATE_HEIGHT / 2,
  };
}

export function smBorderPoint(
  pos: { x: number; y: number },
  tx: number,
  ty: number,
): { x: number; y: number } {
  const cx = pos.x + SM_STATE_WIDTH / 2;
  const cy = pos.y + SM_STATE_HEIGHT / 2;
  const dx = tx - cx;
  const dy = ty - cy;
  if (dx === 0 && dy === 0) return { x: cx, y: cy };
  const hw = SM_STATE_WIDTH / 2;
  const hh = SM_STATE_HEIGHT / 2;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  const scaleX = absDx > 0 ? hw / absDx : Infinity;
  const scaleY = absDy > 0 ? hh / absDy : Infinity;
  const scale = Math.min(scaleX, scaleY);
  return { x: cx + dx * scale, y: cy + dy * scale };
}
