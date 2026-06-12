// ---------------------------------------------------------------------------
// Incident Replay registry — real-world outage replays, keyed by slug.
//
// Each incident is a self-contained cinematic dataset: a simplified-but-
// faithful architecture snapshot (nodes + edges), a timeline of keyframes
// that drive node health states on a read-only canvas, and the lessons the
// postmortem taught the industry.
//
// Adding an incident: author a `<slug>.ts` file exporting an
// `IncidentReplay`, then register it in `INCIDENTS` below. Types are
// type-only imports from this module, so no runtime cycle exists.
// ---------------------------------------------------------------------------

import { FACEBOOK_BGP_2021 } from "./facebook-bgp-2021";

// ── Types ────────────────────────────────────────────────────

/** Health of a single architecture node at a given keyframe. */
export type NodeHealth = "healthy" | "degraded" | "down";

/** Visual family of a node — drives the icon on the replay canvas. */
export type IncidentNodeKind =
  | "client"
  | "resolver"
  | "dns"
  | "router"
  | "backbone"
  | "edge"
  | "datacenter"
  | "frontend"
  | "service"
  | "auth"
  | "tooling"
  | "physical";

export interface IncidentNode {
  id: string;
  label: string;
  kind: IncidentNodeKind;
  /** Hand-authored position for a clean static layout. */
  position: { x: number; y: number };
}

export interface IncidentEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  /** Optional handle hints for vertical connections ("b" → "t"). */
  sourceHandle?: "r" | "b";
  targetHandle?: "l" | "t";
}

export interface IncidentKeyframe {
  /** Offset from incident start, in seconds. */
  atSeconds: number;
  headline: string;
  narrative: string;
  /** Complete snapshot: every node id maps to its health at this beat. */
  nodeStates: Record<string, NodeHealth>;
  metrics: {
    /** Global error rate as a percentage, 0–100. */
    globalErrorRate: number;
    /** Users affected at this beat. */
    affectedUsers: number;
  };
}

export interface IncidentLesson {
  title: string;
  body: string;
}

export interface IncidentMeta {
  slug: string;
  title: string;
  company: string;
  /** ISO 8601 date of the incident. */
  date: string;
  /** Human duration, e.g. "6h 05m". */
  durationLabel: string;
  /** One-line fatality-free tagline for cards and OG. */
  tagline: string;
  /** 1–2 sentence executive summary. */
  summary: string;
  postmortemUrl: string;
  /** Chaos-engine event ids this incident maps onto (vocabulary bridge). */
  chaosEventIds: string[];
}

export interface IncidentReplay {
  meta: IncidentMeta;
  nodes: IncidentNode[];
  edges: IncidentEdge[];
  timeline: IncidentKeyframe[];
  lessons: IncidentLesson[];
}

// ── Registry ─────────────────────────────────────────────────

export const INCIDENTS: Record<string, IncidentReplay> = {
  [FACEBOOK_BGP_2021.meta.slug]: FACEBOOK_BGP_2021,
};

export const INCIDENT_SLUGS = Object.keys(INCIDENTS);

export function getIncidentBySlug(slug: string): IncidentReplay | null {
  return INCIDENTS[slug] ?? null;
}
