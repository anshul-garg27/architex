// -----------------------------------------------------------------
// Architex -- LLD Content Search (LLD-066)
// -----------------------------------------------------------------
//
// Search utility for patterns, SOLID principles, problems, sequence
// diagrams, and state machines. Returns ranked results with match
// snippets. The UI wiring (search input in sidebar) is done in
// LLDModule.tsx by another agent.
// -----------------------------------------------------------------

import { DESIGN_PATTERNS } from "./patterns";
import { SOLID_DEMOS } from "./solid-demos";
import { LLD_PROBLEMS } from "./problems";
import { SEQUENCE_EXAMPLES } from "./sequence-diagram";
import { STATE_MACHINE_EXAMPLES } from "./state-machine";

// -- Types -------------------------------------------------------

export type SearchResultType =
  | "pattern"
  | "solid"
  | "problem"
  | "sequence"
  | "state-machine";

export interface SearchResult {
  /** Unique id of the matched item. */
  id: string;
  /** Which content category the result belongs to. */
  type: SearchResultType;
  /** Display name. */
  name: string;
  /** Snippet of the text that matched the query (trimmed around the match). */
  matchSnippet: string;
}

// -- Helpers -----------------------------------------------------

/** Maximum snippet length (characters) around a match. */
const SNIPPET_MAX = 120;

/**
 * Build a case-insensitive snippet around the first occurrence of
 * `query` inside `text`. Returns empty string if no match.
 */
function buildSnippet(text: string, queryLower: string): string {
  const lower = text.toLowerCase();
  const idx = lower.indexOf(queryLower);
  if (idx === -1) return "";

  const start = Math.max(0, idx - 30);
  const end = Math.min(text.length, idx + queryLower.length + (SNIPPET_MAX - 30));
  let snippet = text.slice(start, end).trim();

  if (start > 0) snippet = `...${snippet}`;
  if (end < text.length) snippet = `${snippet}...`;

  return snippet;
}

/**
 * Check whether `text` contains `queryLower` (case-insensitive,
 * partial-word match). Returns the snippet or empty string.
 */
function matchText(text: string, queryLower: string): string {
  if (!text) return "";
  return buildSnippet(text, queryLower);
}

// -- Main Search Function ----------------------------------------

/**
 * Search across all LLD content: patterns, SOLID demos, problems,
 * sequence diagrams, and state machines.
 *
 * Performs case-insensitive substring matching against names, descriptions,
 * categories, and principles. Results are ordered by content type:
 * patterns, SOLID, problems, sequences, state machines.
 *
 * @param query - The search string. Blank/whitespace-only returns `[]`.
 * @returns An array of `SearchResult` objects with `id`, `type`, `name`, and `matchSnippet`.
 *
 * @example
 * ```ts
 * const results = searchLLDContent("factory");
 * // [{ id: "abstract-factory", type: "pattern", name: "Abstract Factory", matchSnippet: "..." }]
 * ```
 */
export function searchLLDContent(query: string): SearchResult[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const q = trimmed.toLowerCase();
  const results: SearchResult[] = [];

  // -- Patterns --------------------------------------------------
  for (const p of DESIGN_PATTERNS) {
    const nameSnippet = matchText(p.name, q);
    const descSnippet = matchText(p.description, q);
    const categorySnippet = matchText(p.category, q);

    const snippet = nameSnippet || descSnippet || categorySnippet;
    if (snippet) {
      results.push({
        id: p.id,
        type: "pattern",
        name: p.name,
        matchSnippet: snippet,
      });
    }
  }

  // -- SOLID Demos -----------------------------------------------
  for (const s of SOLID_DEMOS) {
    const nameSnippet = matchText(s.name, q);
    const descSnippet = matchText(s.description, q);
    const principleSnippet = matchText(s.principle, q);

    const snippet = nameSnippet || descSnippet || principleSnippet;
    if (snippet) {
      results.push({
        id: s.id,
        type: "solid",
        name: s.name,
        matchSnippet: snippet,
      });
    }
  }

  // -- Problems --------------------------------------------------
  for (const p of LLD_PROBLEMS) {
    const nameSnippet = matchText(p.name, q);
    const descSnippet = matchText(p.description, q);

    const snippet = nameSnippet || descSnippet;
    if (snippet) {
      results.push({
        id: p.id,
        type: "problem",
        name: p.name,
        matchSnippet: snippet,
      });
    }
  }

  // -- Sequence Diagrams -----------------------------------------
  for (const s of SEQUENCE_EXAMPLES) {
    const nameSnippet = matchText(s.name, q);
    const descSnippet = matchText(s.description, q);

    const snippet = nameSnippet || descSnippet;
    if (snippet) {
      results.push({
        id: s.id,
        type: "sequence",
        name: s.name,
        matchSnippet: snippet,
      });
    }
  }

  // -- State Machines --------------------------------------------
  for (const sm of STATE_MACHINE_EXAMPLES) {
    const nameSnippet = matchText(sm.name, q);
    const descSnippet = matchText(sm.description, q);

    const snippet = nameSnippet || descSnippet;
    if (snippet) {
      results.push({
        id: sm.id,
        type: "state-machine",
        name: sm.name,
        matchSnippet: snippet,
      });
    }
  }

  return results;
}
