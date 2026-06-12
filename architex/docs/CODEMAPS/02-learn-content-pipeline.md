# Codemap 02 — Learn Content Pipeline

> **AUDIT NOTE (2026-05-07):** This doc was authored before the SPA routing model was empirically verified. Specific corrections are inline below as `> CORRECTION:` blockquotes. The routing-model truth lives in `09-ui-tour.md` (v2) and `18-other-modules.md`. Where this doc and v2 disagree, **v2 wins**.

> Module: **Learn content pipeline** — modules, lessons, concepts, MDX content, knowledge graph, content seed/compile scripts.
>
> Repo root referenced throughout: `/Users/a0g11b6/Downloads/projects/architex/architex`.
> All paths and line numbers are relative to that root unless absolute.
> Companion docs (skimmed, not duplicated): `docs/CONTENT_STRATEGY.md`, `docs/content-style-guide.md`,
> `docs/architecture/system-design-backend-analysis.md`, `docs/audits/system-design-content-audit.md`,
> `docs/audits/system-design-teaching-audit.md`, `docs/guides/add-new-pattern.md`,
> `docs/guides/adding-a-module.md`, `docs/guides/world-class-algorithm-content.md`,
> `docs/RESEARCH_INDEX.md`, `ARCHITEX_PRODUCT_VISION.md`.

---

## 1. Purpose — how content reaches the learner

The learn pipeline is the path from **authored source** (MDX, YAML, hand-written TS arrays) to **rendered UI** (a learner reading a section, taking a checkpoint, jumping into a related concept). It has four physical layers:

| Layer | Location | Cardinality | Notes |
|---|---|---|---|
| **Authored source** | `content/` (MDX + YAML), `src/lib/<module>/*.ts` data files | one row per pattern / problem / concept | MDX for narrative LLD lessons; TS arrays for catalog data of the other 12 modules. |
| **Compiled artifact** | `module_content` (Postgres JSONB), `quiz_questions`, `diagram_templates`, `templates`, generated `src/lib/lld/concept-graph.ts` | one DB row per content item; one TS file for the concept graph | Compile/seed scripts shape JSONB into a stable schema. |
| **API surface** | `src/app/api/content/**`, `src/app/api/content/[slug]/**`, `src/app/api/quiz/**`, `src/app/api/templates/**`, `src/app/api/learning-path/**`, `src/app/api/challenges/**` | thin Drizzle queries + ISR cache headers | Public, anonymous, ISR-cached. Mastery annotation overlays user data when authenticated. |
| **Render** | `src/app/learn/**`, `src/app/concepts/**`, `src/app/modules/**`, `src/app/blog/**`, `src/components/modules/**`, `src/components/knowledge-graph/**`, `src/components/cross-module/**`, `src/components/innovation/**` | depends on caller | TanStack Query hooks (`use-content`, `use-quiz`) wrap the API; LLD lessons go through `loadLesson()` → `MDXRenderer` directly. |

The non-LLD modules **never compile MDX**; their content is hand-curated TS arrays (`DESIGN_PATTERNS`, `LLD_PROBLEMS`, `DAILY_CHALLENGES`, `SIMULATIONS`, etc.) extracted into `module_content` at seed time. The MDX pipeline is currently exclusive to LLD lessons.

The route `/learn` itself is a single bespoke lesson today (`/learn/parking-lot`) — see §7. The LLD lesson reader lives inside the LLD module shell at `src/components/modules/lld/learn/`, not at a top-level `/learn/...` route.

---

## 2. Content sources

### 2.1 MDX + YAML on disk

`content/lld/lessons/<slug>.mdx` — eight-section lesson body. Frontmatter declares `subtitle`, `estimatedMinutes`, `conceptIds[]`, optional per-section metadata blocks, and a required four-element `checkpoints` array. `<!-- Section: <id> -->` HTML comments split the body into the eight sections.

```text
content/lld/lessons/
  abstract-factory.mdx
  builder.mdx
  facade.mdx
  factory-method.mdx
  observer.mdx
  prototype.mdx
  singleton.mdx
content/lld/concepts/
  abstract-factory.concepts.yaml
  builder.concepts.yaml
  facade.concepts.yaml
  factory-method.concepts.yaml
  observer.concepts.yaml
  prototype.concepts.yaml
  singleton.concepts.yaml
```

`content/lld/concepts/<slug>.concepts.yaml` — pattern-scoped concept descriptors plus an explicit `confusedWith` list. Authored example at `content/lld/concepts/singleton.concepts.yaml:1-37`:

```yaml
pattern: singleton
concepts:
  - id: global-state
    label: Global State
    summary: State reachable from anywhere in the program — convenient, but hard to test.
    relatedPatterns: [monostate, service-locator]
    introducedIn: [itch, failure_modes]
confusedWith:
  - patternSlug: monostate
    reason: Same shared state, but Monostate allows many instances.
```

Frontmatter shape excerpt for a lesson, `content/lld/lessons/singleton.mdx:1-12`:

```mdx
---
subtitle: "One object, globally accessed"
estimatedMinutes: 14
conceptIds:
  - global-state
  - lazy-init
  - thread-safety
  - monostate
sections:
  itch:
    scenario: "Your app spins up three database pools..."
```

### 2.2 TypeScript data files (everything other than LLD lessons)

The other 12 modules keep their content as exported arrays in `src/lib/<module>/`:

| Module | File(s) | Examples of arrays |
|---|---|---|
| LLD (non-lesson) | `src/lib/lld/patterns.ts`, `problems.ts`, `solid-demos.ts`, `oop-demos.ts`, `sequence-diagram.ts`, `state-machine.ts` | `DESIGN_PATTERNS`, `LLD_PROBLEMS`, `SOLID_DEMOS`, `SOLID_QUIZ_QUESTIONS`, `OOP_DEMOS`, `SEQUENCE_EXAMPLES`, `STATE_MACHINE_EXAMPLES` |
| Algorithms | `src/lib/algorithms/<category>/*.ts` | 13 category arrays (`SORTING_ALGORITHMS`, `GRAPH_ALGORITHMS`, …) |
| Data structures | `src/lib/data-structures/catalog.ts` | `DS_CATALOG` |
| Database | `src/lib/database/daily-challenges.ts`, `sample-er-diagrams.ts` | `DAILY_CHALLENGES`, `SAMPLE_ER_DIAGRAMS` |
| Distributed | inline in `src/db/seeds/distributed.ts` | 11 simulation rows |
| Networking | `src/lib/networking/srs-bridge.ts`, `tls13-handshake.ts`, `cdn-flow.ts` | `NETWORKING_SRS_CARDS`, `TLS13_HANDSHAKE_MESSAGES`, `CDN_SCENARIOS` |
| OS | `src/lib/os/...` (via `src/db/seeds/os.ts`) | scheduling demos, page-replacement scenarios |
| Concurrency | `src/lib/concurrency/event-loop.ts`, `async-patterns.ts`, `goroutines.ts` | `EVENT_LOOP_DEMOS`, `ASYNC_PATTERN_DEMOS`, `GOROUTINE_DEMOS` |
| Security | `src/lib/security/...` (via seed) | OAuth flows, JWT tasks, etc. |
| ML Design | `src/lib/ml-design/pipeline-templates.ts` + inline | `PIPELINE_TEMPLATES`, `ML_TOPICS` |
| System Design | `src/lib/templates`, `src/lib/simulation/chaos-engine.ts`, `src/lib/simulation/rule-database.ts` | `SYSTEM_DESIGN_TEMPLATES`, `CHAOS_EVENTS`, topology rules |
| Pattern walkthroughs | inline in `src/db/seeds/pattern-walkthroughs.ts`, `pattern-walkthroughs-remaining.ts` | `WALKTHROUGHS` |
| Concepts (SEO) | `src/lib/seo/concepts-data.ts` | `CONCEPTS` (40-row hand-curated array) |
| Knowledge graph | `src/lib/knowledge-graph/concepts.ts` | `CONCEPTS`, `RELATIONSHIPS`, `DOMAIN_COLORS`, `DOMAIN_LABELS` |
| Blog | `src/lib/blog/posts.ts` (+ `src/lib/seo/blog-data.ts`) | `BLOG_POSTS` |

### 2.3 Runtime composition

Three live data flows fan out from the source files at runtime:

1. **DB-backed** — anything `module_content` / `quiz_questions` / `templates` / `diagram_templates` exposes through `/api/content`, `/api/quiz`, `/api/templates`. TanStack Query hooks (`useCatalog`, `useContentDetail`, `useQuiz`) consume these.
2. **Statically imported** — concept knowledge graph (`src/lib/knowledge-graph/concepts.ts`), SEO concepts (`src/lib/seo/concepts-data.ts`), blog posts (`src/lib/blog/posts.ts`), challenges (`src/lib/interview/challenges.ts`) live in the JS bundle and are imported directly into pages without an API hop.
3. **Generated TS** — `src/lib/lld/concept-graph.ts` is regenerated by `pnpm build:concept-graph` (zero-DB lookup table for confused-with / concept ↔ pattern joins).

---

## 3. Module → Lesson → Concept hierarchy

There are three independent hierarchies in this codebase. They are cross-linked by string ids but not joined at the SQL level.

### 3.1 `module_content` (single table for all modules)

`src/db/schema/module-content.ts:23-69`:

```ts
export const moduleContent = pgTable(
  "module_content",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    moduleId: varchar("module_id", { length: 50 }).notNull(),
    contentType: varchar("content_type", { length: 50 }).notNull(),
    slug: varchar("slug", { length: 200 }).notNull(),
    name: varchar("name", { length: 300 }).notNull(),
    category: varchar("category", { length: 100 }),
    difficulty: varchar("difficulty", { length: 20 }),
    sortOrder: integer("sort_order").notNull().default(0),
    content: jsonb("content").notNull().default({}),
    summary: text("summary"),
    tags: text("tags").array(),
    isPublished: boolean("is_published").notNull().default(true),
    ...
  },
  (table) => [
    uniqueIndex("module_content_unique_idx").on(
      table.moduleId, table.contentType, table.slug,
    ),
    index("module_content_module_type_idx").on(
      table.moduleId, table.contentType, table.sortOrder,
    ),
  ],
);
```

A single composite key is `(moduleId, contentType, slug)`. The discriminator is `contentType`. There is no FK between rows; the "hierarchy" is purely conventional via shared slug strings.

### 3.2 Content-type vocabulary observed

| `moduleId` | `contentType` values seen | Source |
|---|---|---|
| `lld` | `pattern`, `problem`, `solid-demo`, `solid-quiz`, `oop-demo`, `sequence-example`, `state-machine`, `lesson`, `pattern-walkthrough` | `src/db/seeds/lld.ts`, `pattern-walkthroughs.ts`, `compile-lld-lessons.ts` |
| `system-design` | `template`, `blueprint`, `chaos-event`, `topology-rule` | `src/db/seeds/system-design.ts` |
| `algorithms` | `algorithm` | `src/db/seeds/algorithms.ts` |
| `data-structures` | `data-structure` | `src/db/seeds/data-structures.ts` |
| `database` | `daily-challenge`, `sample-er-diagram` | `src/db/seeds/database.ts` |
| `distributed` | `simulation` | `src/db/seeds/distributed.ts` |
| `networking` | `srs-card`, `tls13-message`, `cdn-scenario` | `src/db/seeds/networking.ts` |
| `os` | (scheduling/page-replace, see seeder) | `src/db/seeds/os.ts` |
| `concurrency` | `demo`, `event-loop-demo`, `async-pattern-demo`, `goroutine-demo`, … | `src/db/seeds/concurrency.ts` |
| `security` | (OAuth flows, JWT, etc.) | `src/db/seeds/security.ts` |
| `ml-design` | `pipeline`, `topic` | `src/db/seeds/ml-design.ts` |
| `interview-qa` | varied | `src/db/seeds/interview-qa.ts`, `interview-qa-remaining.ts` |

### 3.3 The "lesson row" — DB shape of a compiled MDX lesson

A lesson is one row with `contentType = "lesson"`. Its `content` JSONB is a `LessonPayload` (`src/lib/lld/lesson-types.ts:179-201`):

```ts
export interface LessonPayload {
  schemaVersion: 1;
  patternSlug: string;
  subtitle: string;
  estimatedMinutes: number;
  conceptIds: string[];
  sections: {
    itch: ItchSectionPayload;
    definition: DefinitionSectionPayload;
    mechanism: MechanismSectionPayload;
    anatomy: AnatomySectionPayload;
    numbers: NumbersSectionPayload;
    uses: UsesSectionPayload;
    failure_modes: FailureModesSectionPayload;
    checkpoints: CheckpointsSectionPayload;
  };
}
```

Each section payload is a `CompiledMDX` (`src/lib/lld/lesson-types.ts:38-49`) with the precompiled JSX function body, the raw markdown, anchors, and the concept/class ids referenced inside the body, plus optional structured fields (steps, classes, headlines, cases, modes, checkpoints).

### 3.4 Pattern → Concept links

Concept ↔ pattern joins do not live in SQL. They live in the auto-generated `src/lib/lld/concept-graph.ts` (currently empty as committed; regenerated from YAML by the script in §5). Maps:

- `conceptToPatterns: conceptId → patternSlug[]`
- `patternToConcepts: patternSlug → ConceptEntry[]`
- `conceptToRelated: conceptId → conceptId[]`
- `patternConfusedWith: patternSlug → [{ patternSlug, reason }]`

---

## 4. MDX pipeline

### 4.1 Where MDX is used

MDX is **only** used for LLD lessons. `package.json:39-40` pulls in `@mdx-js/mdx` and `@mdx-js/react`. `next.config.ts` does not enable any MDX page extensions or remark/rehype plugins — Next never sees `.mdx` files at build time. MDX is compiled inside a Node script and stored as a serialized JSX function body in JSONB.

Confirmed by `grep`: only `src/components/modules/lld/learn/MDXRenderer.tsx` references `@mdx-js` at runtime; `scripts/compile-lld-lessons.ts` is the only build-time consumer.

### 4.2 Compile-time pipeline

`scripts/compile-lld-lessons.ts:62-96` calls `@mdx-js/mdx`'s `compile()` with `outputFormat: "function-body"` and `remarkPlugins: [remarkGfm]`:

```ts
export async function compileSection(
  sectionBody: string,
  _sectionId: LessonSectionId,
): Promise<CompiledMDX> {
  const compiled = await compile(sectionBody, {
    outputFormat: "function-body",
    remarkPlugins: [remarkGfm],
    development: false,
  });

  // Extract anchors: all `## Heading` and `### Heading` lines
  const anchors: CompiledMDX["anchors"] = [];
  for (const match of sectionBody.matchAll(/^(#{2,3})\s+(.+)$/gm)) {
    const depth = match[1].length as 2 | 3;
    const label = match[2].trim();
    const id = slugify(label);
    anchors.push({ id, label, depth });
  }

  // Extract <Concept id="..."> and <Class id="..."> JSX references
  const conceptIds = Array.from(
    sectionBody.matchAll(/<Concept\s+id="([^"]+)"/g),
  ).map((m) => m[1]);
  const classIds = Array.from(
    sectionBody.matchAll(/<Class\s+id="([^"]+)"/g),
  ).map((m) => m[1]);

  return { code: String(compiled), raw: sectionBody, anchors,
           conceptIds: Array.from(new Set(conceptIds)),
           classIds: Array.from(new Set(classIds)) };
}
```

`splitIntoSections()` (`scripts/compile-lld-lessons.ts:109-125`) splits the body using a regex on `<!-- Section: <id> -->` markers and validates that all eight expected sections are present.

`compileLesson()` (`scripts/compile-lld-lessons.ts:127-184`) merges per-section frontmatter onto each `CompiledMDX`, validates that the four `checkpoints` kinds (`recall`, `apply`, `compare`, `create`) are present, and assembles a `LessonPayload`.

### 4.3 Run-time render

The compiled function-body string is `eval`-ed in the browser with React's automatic JSX runtime injected. `src/components/modules/lld/learn/MDXRenderer.tsx:70-81`:

```tsx
async function evalMDX(code: string): Promise<MDXExports> {
  type Runtime = {
    Fragment: typeof Fragment;
    jsx: typeof jsx;
    jsxs: typeof jsxs;
  };
  const fn = new Function(`${code}`) as (
    runtime: Runtime,
  ) => MDXExports | Promise<MDXExports>;
  const result = fn({ Fragment, jsx, jsxs });
  return result instanceof Promise ? await result : result;
}
```

Inline JSX components `<Class id="…">` and `<Concept id="…">` are stubbed with chip-style React components in the renderer (`MDXRenderer.tsx:25-50`). Override / extend at the call site by passing `components={…}` to `<MDXRenderer />`.

Section components consume their slice of the `LessonPayload` and pass the matching `CompiledMDX` to `<MDXRenderer compiled={payload} />`. Example, `src/components/modules/lld/learn/sections/ItchSection.tsx:29-30`:

```tsx
<div className="prose prose-neutral max-w-none dark:prose-invert">
  <MDXRenderer compiled={payload} />
</div>
```

### 4.4 Other content (non-LLD)

Blog posts use a homemade markdown renderer (`src/app/blog/[slug]/page.tsx:58-110+`) that walks `content.split("\n")` and emits headings / paragraphs / lists by hand — no `@mdx-js`, no `react-markdown`. Concept pages (`src/app/concepts/[slug]/page.tsx`) render `concept.explanation` as a raw `<p>` array. The "knowledge graph" concepts and SEO concepts are pre-shaped objects, not markdown.

---

## 5. Compilation scripts

| Script | Trigger | Output | Idempotent? |
|---|---|---|---|
| `scripts/compile-lld-lessons.ts` | `pnpm compile:lld-lessons [--slug=…] [--dry] [--json-out]` | DB upsert into `module_content (moduleId="lld", contentType="lesson")`, or JSON files at `content/lld/compiled/<slug>.json` when `--json-out` | Yes — uses `onConflictDoUpdate` keyed on `(moduleId, contentType, slug)` |
| `scripts/build-concept-graph.ts` | `pnpm build:concept-graph` | Writes `src/lib/lld/concept-graph.ts` (committed) | Yes — overwrites file each run |
| `scripts/seed-lld-lessons-from-json.mjs` | `node scripts/seed-lld-lessons-from-json.mjs` | DB upsert from precompiled JSON via raw `pg` (avoids tsx ESM toolchain) | Yes |
| `scripts/scaffold-db-mode.ts` | `pnpm scaffold:db-mode --name … --display "…"` | New `src/lib/database/<name>-viz.ts`, sibling test file, barrel append | No — refuses if files exist |
| `scripts/new-algorithm.ts` | `pnpm scaffold:algorithm` (interactive) | New algorithm engine + Vitest scaffold under `src/lib/algorithms/<category>/` | No — overwrites blindly via `fs.writeFileSync` |
| `scripts/enrich-patterns.ts` | manual | Augments pattern data | n/a (out of scope here) |

`package.json:17-26` wires the scripts:

```json
"scaffold:db-mode": "tsx scripts/scaffold-db-mode.ts",
"scaffold:algorithm": "tsx scripts/new-algorithm.ts",
"db:generate": "drizzle-kit generate",
"db:migrate": "drizzle-kit migrate",
"db:push": "drizzle-kit push",
"db:studio": "drizzle-kit studio",
"db:seed": "tsx src/db/seeds/index.ts",
"compile:lld-lessons": "tsx scripts/compile-lld-lessons.ts",
"build:concept-graph": "tsx scripts/build-concept-graph.ts",
```

There is no cron / GitHub Action that re-runs these scripts automatically (no `.github/workflows` reference to them found via search). The pipeline is **manual-only**: an author edits MDX → runs compile → runs seed → commits the regenerated `concept-graph.ts`.

### 5.1 `compile-lld-lessons` — three modes

`scripts/compile-lld-lessons.ts:234-289` routes on flags:

- default → DB upsert via lazy-imported drizzle (`upsertLesson`).
- `--dry` → validate only, skip DB.
- `--json-out` → write `content/lld/compiled/<slug>.json` for the alternate seeder (`seed-lld-lessons-from-json.mjs`) which uses raw `pg` to dodge ESM/tsx pain.

Errors are accumulated and reported at the end; a single bad lesson does not abort the run, but the process exits 1 if any failed (`compile-lld-lessons.ts:283-289`).

### 5.2 `build-concept-graph` — full output sketch

`scripts/build-concept-graph.ts:40-152` reads every `*.concepts.yaml`, builds four maps, and writes them as a typed TS module. Empty input → empty maps with a warning, never an error.

```ts
graph.patternToConcepts[slug] = (data.concepts ?? []).map((c) => ({
  id: c.id, label: c.label, summary: c.summary,
}));
for (const concept of data.concepts ?? []) {
  (graph.conceptToPatterns[concept.id] ??= []).push(slug);
  if (concept.relatedConcepts) {
    (graph.conceptToRelated[concept.id] ??= []).push(...concept.relatedConcepts);
  }
}
if (data.confusedWith) {
  graph.patternConfusedWith[slug] = data.confusedWith;
}
```

Result is committed as `src/lib/lld/concept-graph.ts` (currently the maps are empty since the script has not been re-run after the file was committed; the file is intentionally a generated artifact: see header comment in §6).

---

## 6. Knowledge graph

There are **two** "concept graphs" in this codebase. They overlap conceptually but live in separate files and serve different surfaces.

### 6.1 LLD-scoped concept graph (auto-generated)

`src/lib/lld/concept-graph.ts:1-39`:

```ts
/**
 * AUTO-GENERATED by scripts/build-concept-graph.ts.
 * Do not edit by hand. Re-run `pnpm build:concept-graph`.
 */

import type { ConceptYAML } from "./lesson-types";

export interface ConceptEntry {
  id: string;
  label: string;
  summary: string;
}
export type PatternConfusedWith = NonNullable<ConceptYAML["confusedWith"]>;

export const conceptToPatterns: Record<string, readonly string[]> = {};
export const patternToConcepts: Record<string, readonly ConceptEntry[]> = {};
export const conceptToRelated: Record<string, readonly string[]> = {};
export const patternConfusedWith: Record<string, PatternConfusedWith> = {};

export function getConceptsForPattern(slug: string): readonly ConceptEntry[] { ... }
export function getPatternsForConcept(conceptId: string): readonly string[] { ... }
export function getRelatedConcepts(conceptId: string): readonly string[] { ... }
export function getConfusedWith(patternSlug: string): PatternConfusedWith { ... }
```

Consumers:

- `src/components/modules/lld/learn/ConfusedWithPanel.tsx:9-50` — calls `getConfusedWith(patternSlug)` and renders the "Often confused with" sidebar in Learn mode.
- `src/components/modules/lld/learn/ContextualExplainPopover.tsx`, `ClassPopover.tsx` — concept lookups when a learner clicks a `<Concept id>` chip.

### 6.2 Cross-module concept graph (hand-curated, full SD scope)

`src/lib/knowledge-graph/concepts.ts:1-120+`:

```ts
export type ConceptDomain =
  | "compute" | "storage" | "messaging" | "reliability"
  | "data" | "protocols" | "security" | "observability"
  | "patterns" | "distributed";

export type RelationshipType =
  | "uses" | "alternative-to" | "depends-on" | "enhances" | "part-of";

export interface Concept { id; name; domain; description; relatedConcepts; difficulty; tags; }
export interface ConceptRelationship { source; target; type; label?; }

export const DOMAIN_COLORS: Record<ConceptDomain, string> = { compute: "#3b82f6", … };
export const CONCEPTS: Concept[] = [ … ];      // hand-curated array
export const RELATIONSHIPS: ConceptRelationship[] = [ … ];
```

`src/lib/knowledge-graph/graph-layout.ts` is a `dagre`-based force/grid layout (see `package.json:42 — "@dagrejs/dagre"`).

Render layer:

- `src/components/knowledge-graph/ConceptGraph.tsx:1-80+` — `@xyflow/react` graph with custom nodes sized by `getConnectionCount`, custom edge styles per relationship type:

```tsx
const EDGE_STYLES: Record<RelationshipType, ...> = {
  uses: { stroke: "#64748b", label: "uses" },
  "alternative-to": { stroke: "#f59e0b", strokeDasharray: "6 3", label: "alt" },
  "depends-on": { stroke: "#ef4444", label: "dep" },
  enhances: { stroke: "#10b981", label: "enh" },
  "part-of": { stroke: "#8b5cf6", strokeDasharray: "3 3", label: "part" },
};
```

- `src/components/knowledge-graph/ConceptDetailPanel.tsx:1-60+` — sidecar panel shown on node click; groups relationships by type and provides "navigate to" callbacks.

Both wired together by `src/components/modules/KnowledgeGraphModule.tsx` and the `knowledge-graph` entry of the modules grid.

### 6.3 "Confused-with" relationships

Two systems express it:

- LLD scoped: `confusedWith:` in `*.concepts.yaml` → `patternConfusedWith` map → `ConfusedWithPanel`.
- Knowledge graph: relationship type `alternative-to` (see `EDGE_STYLES` above), authored by hand inside `RELATIONSHIPS` in `src/lib/knowledge-graph/concepts.ts`.

No cross-link between the two — each is fed independently.

### 6.4 Enrichment scripts

`src/db/seeds/enrich-confused-with.ts`, `src/db/seeds/enrich-cardinality.ts`, `src/db/seeds/fix-confused-with.ts`, `src/db/seeds/fix-cardinalities.ts` — manual one-shot scripts that walk pattern rows in `module_content` and patch the JSONB content (run via `pnpm db:seed -- --module=fix-confused-with`, see §9).

---

## 7. Page routes

### 7.1 `/learn` (top-level)

| Route | File | Notes |
|---|---|---|
| `/learn/parking-lot` | `src/app/learn/parking-lot/page.tsx`, `ParkingLotLesson.tsx`, `_data.ts`, `_DifficultyContext.tsx`, `_DifficultySelector.tsx`, `_Primitives.tsx`, `_Widgets.tsx`, `LessonDiagrams.tsx` | Standalone bespoke long-form lesson; not driven by `module_content` or MDX. Hand-built primitives (`Section`, `Lead`, `Mark`, `Callout`, `GlossaryTerm`, `CodeBlock`, `BeginnerNote`, `SeniorShortcut`, `RetrievalCheck`, `PredictBeforeReveal`, `PatternFitJudge`, `AntiPatternMuseum`, …) all live in the same folder. |

There is no `/learn` index page — only `parking-lot` exists.

### 7.2 LLD Learn mode (inside the LLD module shell)

LLD's lesson reader is **not** a Next.js route; it's a mode of the LLD module rendered inside `/` or `/modules` via the canvas/sidebar shell.

> **CORRECTION (2026-05-07):** The LLD lesson reader is rendered **only at `/`** — `/modules` is a static catalog page (`src/app/modules/page.tsx`) whose cards all link to `/` (`href="/"` at `src/app/modules/page.tsx:209`). Module switching happens via `useUIStore.setActiveModule()` (Zustand, persisted to localStorage), not via a `/modules` route. The LLD lesson sub-state itself persists via `?lld=type:slug` (`src/components/modules/lld/hooks/useLLDModuleImpl.tsx:233-265`) and `&mode=learn|build|drill|review` (via `useLLDModeSync.ts`). Source: `09-ui-tour.md` v2 §1B and `18-other-modules.md` §2.3.

| Component | Role | File |
|---|---|---|
| `LessonColumn` | Composes the eight section components | `src/components/modules/lld/learn/LessonColumn.tsx` |
| `LessonSidebar` | Lesson list grouped by category, completion ticks | `src/components/modules/lld/learn/LessonSidebar.tsx` |
| `LessonProgressBar` | Top progress bar showing N/8 sections complete | `src/components/modules/lld/learn/LessonProgressBar.tsx` |
| `LessonTableOfContents` | TOC | `src/components/modules/lld/learn/LessonTableOfContents.tsx` |
| `BookmarkStrip` | Bookmark UI | `src/components/modules/lld/learn/BookmarkStrip.tsx` |
| `MDXRenderer` | Eval'd MDX (§4) | `src/components/modules/lld/learn/MDXRenderer.tsx` |
| `ClassPopover`, `ContextualExplainPopover`, `ConfusedWithPanel` | Concept/class popovers | `src/components/modules/lld/learn/{...}.tsx` |
| Section components | One per section | `src/components/modules/lld/learn/sections/*.tsx` |
| Checkpoint components | One per checkpoint kind | `src/components/modules/lld/learn/checkpoints/*.tsx` |

Loading is handled by `src/lib/lld/lesson-loader.ts:65-100` — a Drizzle select on `(moduleId="lld", contentType="lesson", slug)`, with a `validateLessonPayload` schema check that returns one of `missing`, `corrupt`, `db-error` on failure.

### 7.3 `/modules`

`src/app/modules/page.tsx:44-162` — client component listing 13 modules with category, color, gradient, and icon. Progress is read from local storage via `getModuleProgress(mod.id)` (`src/lib/progress/module-progress.ts`). Filters on category, sort on name/progress/recently-used. Each card links to `/` (the canvas shell switches active module via the Zustand `ui-store`).

> **CORRECTION (2026-05-07):** The phrasing "Each card links to `/` (the canvas shell switches active module via the Zustand `ui-store`)" is misleading — the card is a plain `<Link href="/">` (`src/app/modules/page.tsx:209`) with **no** `setActiveModule` call on click. So clicking a card lands the user on `/` showing **whichever module was last persisted in Zustand**, not the card they clicked. Module switching from `/modules` is effectively a no-op beyond a navigation to `/`. The actual mechanisms that set `activeModule` are the activity-bar icons, keyboard shortcuts (1–9), command palette, cross-module bridges, and `/database/[mode]/database-mode-app.tsx:40-45` (which forces `setActiveModule("database")` on mount). Source: `09-ui-tour.md` v2 §1B and `18-other-modules.md` §2.4.

| ModuleType id | Label | Category |
|---|---|---|
| `system-design` | System Design | Learning |
| `algorithms` | Algorithms | Learning |
| `data-structures` | Data Structures | Learning |
| `lld` | Low-Level Design | Learning |
| `database` | Database | Learning |
| `distributed` | Distributed Systems | Learning |
| `networking` | Networking | Learning |
| `os` | OS Concepts | Learning |
| `concurrency` | Concurrency | Learning |
| `security` | Security | Learning |
| `ml-design` | ML Design | Learning |
| `interview` | Interview Prep | Practice |
| `knowledge-graph` | Knowledge Graph | Tools |

`src/app/modules/layout.tsx` is a passthrough that supplies metadata.

### 7.4 `/concepts`

| Route | File | Source |
|---|---|---|
| `/concepts` | `src/app/concepts/page.tsx:54-90` | `CONCEPTS` from `src/lib/seo/concepts-data.ts` (40 hand-curated entries, six categories) |
| `/concepts/[slug]` | `src/app/concepts/[slug]/page.tsx:36-443` | `getConceptBySlug`, `getRelatedConcepts`, `getRelatedProblemsForConcept` |

`generateStaticParams` at `[slug]/page.tsx:36-38`:

```ts
export function generateStaticParams() {
  return CONCEPTS.map((c) => ({ slug: c.slug }));
}
```

Concept pages emit JSON-LD (`generateBreadcrumbJsonLd`, `generateLearningResourceJsonLd`, `generateFAQJsonLd`) and a CTA banner for the six concepts that have matching distributed-systems simulations (`INTERACTIVE_SIMULATION_SLUGS` at `[slug]/page.tsx:24-31`):

```ts
const INTERACTIVE_SIMULATION_SLUGS = new Set([
  'cap-theorem', 'consistent-hashing', 'gossip-protocol',
  'raft-consensus', 'two-phase-commit', 'saga-pattern',
]);
```

Cross-module bridges from the concept page (`[slug]/page.tsx:319-323`):

```tsx
<section className="...">
  <h2>Explore Across Modules</h2>
  <ConceptModuleLinks conceptId={concept.slug} />
</section>
```

### 7.5 `/blog`

| Route | File | Notes |
|---|---|---|
| `/blog` | `src/app/blog/page.tsx`, `BlogPostFilters.tsx` | Reads `BLOG_POSTS` (3 inline + spread of `BLOG_POST_DATA` from `src/lib/seo/blog-data.ts`); renders client-side filters |
| `/blog/[slug]` | `src/app/blog/[slug]/page.tsx:1-110+` | `generateStaticParams` over `getAllBlogSlugs()`; markdown rendered by `renderMarkdown()` walking `content.split("\n")` |
| `/blog/feed.xml` | `src/app/blog/feed.xml/route.ts:12-45` | Hand-rolled RSS 2.0 with `Cache-Control: s-maxage=3600` |

```ts
// src/app/blog/feed.xml/route.ts:39-44
return new Response(rss, {
  headers: {
    "Content-Type": "application/rss+xml; charset=utf-8",
    "Cache-Control": "s-maxage=3600, stale-while-revalidate",
  },
});
```

### 7.6 Module shell wrappers

`src/components/modules/wrappers/*` — one wrapper per module, all the same pattern: take an `onContent` callback, call `useXxxModule()`, and feed the resulting `ModuleContent` upstream. Example, `src/components/modules/wrappers/LLDWrapper.tsx:1-12`:

```tsx
export default memo(function LLDModuleContent({ onContent }: { onContent: (c: ModuleContent) => void }) {
  const content = useLLDModule();
  useEffect(() => { onContent(content); }, [onContent, content]);
  return null;
});
```

`ModuleContent` (`src/components/modules/module-content.ts:3-13`) is the canonical four-pane shape every module returns:

```ts
export interface ModuleContent {
  sidebar: React.ReactNode;
  canvas: React.ReactNode;
  properties: React.ReactNode;
  bottomPanel: React.ReactNode;
  mockOverlay?: React.ReactNode | null;
  confirmDialog?: React.ReactNode | null;
  breadcrumb?: { section?: string; topic?: string };
}
```

---

## 8. Quiz & challenges

### 8.1 Schemas

`src/db/schema/quiz-questions.ts:22-66` — generic typed-quiz table:

```ts
export const quizQuestions = pgTable("quiz_questions", {
  id: uuid("id").defaultRandom().primaryKey(),
  moduleId: varchar("module_id", { length: 50 }).notNull(),
  quizType: varchar("quiz_type", { length: 50 }).notNull(),
  slug: varchar("slug", { length: 200 }).notNull(),
  question: text("question").notNull(),
  context: text("context"),
  options: jsonb("options").notNull().default([]),
  correctIndex: integer("correct_index").notNull(),
  explanation: text("explanation").notNull(),
  patternId: varchar("pattern_id", { length: 100 }),
  difficulty: varchar("difficulty", { length: 20 }),
  sortOrder: integer("sort_order").notNull().default(0),
  ...
}, (t) => [
  uniqueIndex("quiz_questions_unique_idx").on(t.moduleId, t.quizType, t.slug),
  index("quiz_questions_module_type_idx").on(t.moduleId, t.quizType),
]);
```

`src/db/schema/templates.ts:20-46` — diagram templates (general-purpose user/system templates):

```ts
export const templates = pgTable("templates", {
  id, name, category, description, data: jsonb,
  isPublic: boolean, authorId: uuid -> users.id (set null on delete),
  createdAt, updatedAt,
}, (t) => [
  index("templates_category_idx"), index("templates_is_public_idx"),
  index("templates_author_id_idx"),
]);
```

`src/db/schema/diagram-templates.ts:22-61` — UML diagram templates linked to a parent content item:

```ts
export const diagramTemplates = pgTable("diagram_templates", {
  id, moduleId, parentType, parentSlug,
  mermaidCode: text,
  classes: jsonb (parsed UML), relationships: jsonb,
  isCurated: boolean, layoutAlgo: 'grid' | 'dagre' | 'manual',
}, (t) => [
  uniqueIndex("diagram_templates_unique_idx").on(t.moduleId, t.parentType, t.parentSlug),
  index("diagram_templates_parent_idx").on(t.moduleId, t.parentType),
]);
```

### 8.2 Route handlers

| Route | File | Behavior |
|---|---|---|
| `GET /api/quiz?module=&type=` | `src/app/api/quiz/route.ts:21-58` | Drizzle select on `(moduleId, quizType)` ordered by `sortOrder`. ISR cache headers (1h browser / 24h CDN / 12h SWR). |
| `GET /api/templates?category=&difficulty=` | `src/app/api/templates/route.ts:35-147` | Two paths: DB-backed when `NEXT_PUBLIC_SYSDESIGN_USE_API=true`, otherwise in-memory `SYSTEM_DESIGN_TEMPLATES`. Validates `category ∈ classic/modern/infrastructure/advanced`, `difficulty ∈ 1..5`. |
| `GET /api/challenges?difficulty=&category=&company=` | `src/app/api/challenges/route.ts:16-65` | Pure in-memory filter over `CHALLENGES` from `src/lib/interview/challenges.ts`. Same ISR headers. |
| `GET /api/content?module=&type=&category=&difficulty=&full=` | `src/app/api/content/route.ts:26-90` | Generic catalog read. Returns metadata only by default; `full=true` includes JSONB content. |
| `GET /api/content/:slug?module=&type=` | `src/app/api/content/[slug]/route.ts:27-74` | Single item by composite key. 404 on miss. |
| `GET /api/learning-path?module=lld&category=` | `src/app/api/learning-path/route.ts:26-93` | Topologically sorted pattern path via `buildLearningPath()`; optional auth-aware mastery annotation (threshold `score ≥ 0.7`). |

Cache header used everywhere except the auth-annotated branch of `learning-path`:

```ts
const CACHE_HEADERS = {
  "Cache-Control":
    "public, max-age=3600, s-maxage=86400, stale-while-revalidate=43200",
};
```

The auth-annotated branch overrides with `Cache-Control: private, max-age=60` (`learning-path/route.ts:78-80`).

### 8.3 How questions surface

| Surface | Hook / loader | Source data |
|---|---|---|
| In-canvas LLD scenario / SOLID quiz / pattern comparison | `useQuiz(moduleId, quizType)` (`src/hooks/use-quiz.ts:50-62`) | `quiz_questions` |
| LLD lesson checkpoints | Embedded directly in `LessonPayload.sections.checkpoints` | `module_content` |
| Database daily challenge | `useCatalog("database", "daily-challenge")` | `module_content` |
| Algorithms / DS catalogs | `useCatalog(...)` | `module_content` |
| System Design templates | `useCatalog("system-design", "template")` or `/api/templates` | `module_content` |
| Interview challenges | direct import of `CHALLENGES` or `/api/challenges` | static TS array |

Hook example, `src/hooks/use-quiz.ts:50-56`:

```ts
export function useQuiz(moduleId: string, quizType: string) {
  const query = useQuery({
    queryKey: quizKeys.list(moduleId, quizType),
    queryFn: () => fetchQuiz(moduleId, quizType),
    staleTime: Infinity,
  });
  ...
}
```

---

## 9. Seed flow

### 9.1 Entry point

`pnpm db:seed` → `tsx src/db/seeds/index.ts`. The runner:

`src/db/seeds/index.ts:11-65`:

```ts
const SEED_MODULES: Record<string, () => Promise<{ seed: ... }>> = {
  lld: () => import("./lld"),
  "lld-templates-library": () => import("./lld-templates-library"),
  "system-design": () => import("./system-design"),
  algorithms: () => import("./algorithms"),
  "data-structures": () => import("./data-structures"),
  database: () => import("./database"),
  networking: () => import("./networking"),
  security: () => import("./security"),
  distributed: () => import("./distributed"),
  os: () => import("./os"),
  "ml-design": () => import("./ml-design"),
  concurrency: () => import("./concurrency"),
  "pattern-walkthroughs": () => import("./pattern-walkthroughs"),
  "pattern-walkthroughs-remaining": () => import("./pattern-walkthroughs-remaining"),
  "interview-qa": () => import("./interview-qa"),
  "interview-qa-remaining": () => import("./interview-qa-remaining"),
  "fix-confused-with": () => import("./fix-confused-with"),
  "fix-prediction-prompts": () => import("./fix-prediction-prompts"),
  quizzes: () => import("./quizzes"),
  "walkthrough-checkpoints": () => import("./walkthrough-checkpoints"),
  "content-quality-fixes": () => import("./content-quality-fixes"),
  "java-code-gen": () => import("./java-code-gen"),
};

async function main() {
  const moduleArg = process.argv.find((a) => a.startsWith("--module="));
  const targetModule = moduleArg?.split("=")[1];
  ...
  if (targetModule) {
    const loader = SEED_MODULES[targetModule];
    if (!loader) { /* error */ }
    const mod = await loader();
    await mod.seed(db);
  } else {
    for (const [name, loader] of Object.entries(SEED_MODULES)) {
      const mod = await loader();
      await mod.seed(db);
    }
  }
}
```

### 9.2 Ordering

When run without `--module=`, seeders execute in **insertion order** of `SEED_MODULES` above. The order matters in a few places:

- `lld` runs first and **deletes** all existing `moduleId="lld"` rows before inserting (`src/db/seeds/lld.ts:165-175`):

  ```ts
  console.log(`    Deleting existing LLD rows...`);
  await db.delete(moduleContent).where(
    sql`${moduleContent.moduleId} = ${MODULE_ID}`,
  );
  console.log(`    Inserting ${rows.length} fresh LLD content rows...`);
  ```

  This means anything that depends on LLD `module_content` (e.g. `pattern-walkthroughs`) must run **after** `lld`.
- `pattern-walkthroughs` and `pattern-walkthroughs-remaining` come after `lld`, then `interview-qa-*`, then the patch seeders (`fix-confused-with`, `fix-prediction-prompts`, `content-quality-fixes`).
- `quizzes` populates `quiz_questions` independently (different table).

### 9.3 Idempotency

Two patterns coexist:

1. **Upsert via `onConflictDoUpdate`** — used by everything except `lld`. The shared helper `src/db/seeds/seed-helpers.ts:16-41` batches in groups of 50:

   ```ts
   export async function batchUpsert(db: Database, rows: NewModuleContent[]) {
     const BATCH_SIZE = 50;
     for (let i = 0; i < rows.length; i += BATCH_SIZE) {
       const batch = rows.slice(i, i + BATCH_SIZE);
       await db.insert(moduleContent).values(batch).onConflictDoUpdate({
         target: [moduleContent.moduleId, moduleContent.contentType, moduleContent.slug],
         set: { name, category, difficulty, sortOrder, content, summary, tags,
                updatedAt: new Date() },
       });
     }
   }
   ```

2. **Delete-then-insert** — only `lld.ts` (`:165-175`). A comment notes "Using delete+insert instead of upsert to guarantee content updates."

Both are idempotent: `pnpm db:seed` is safe to re-run end-to-end. The compile-then-seed loop for LLD lessons is:

```bash
pnpm compile:lld-lessons          # writes to module_content directly
pnpm build:concept-graph          # regenerates src/lib/lld/concept-graph.ts
git add src/lib/lld/concept-graph.ts
```

Or, for the JSON-out path used by the alternate seeder:

```bash
pnpm compile:lld-lessons --json-out
node scripts/seed-lld-lessons-from-json.mjs
pnpm build:concept-graph
```

### 9.4 Helper utilities

`src/db/seeds/seed-helpers.ts:46-86` — `mapToRows()` converts an arbitrary array into `NewModuleContent[]` using configurable field names (`slugField`, `nameField`, …). All recently added seeders (networking, distributed, ml-design, concurrency, database) use this helper; older seeders (system-design, lld, algorithms, data-structures) build rows by hand.

---

## 10. Caching & loading

### 10.1 HTTP cache

All read endpoints in this module set the same ISR header:

```ts
"Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=43200"
```

Browser holds for 1 hour, edge for 24 hours, accepts stale for an additional 12 hours. The only deviation is `learning-path` when authenticated, which switches to `private, max-age=60`.

The blog feed has its own header (`s-maxage=3600, stale-while-revalidate`) at `src/app/blog/feed.xml/route.ts:42-43`.

### 10.2 React Query

`src/providers/QueryProvider.tsx:15-32` — global defaults:

```ts
new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,         // 5 minutes
      gcTime: 30 * 60 * 1000,           // 30 minutes
      refetchOnWindowFocus: false,
      networkMode: "offlineFirst",
      retry: 2,
    },
    mutations: {
      networkMode: "offlineFirst",
    },
  },
});
```

`offlineFirst` means cached data is served first; revalidation hits the network only if fresh. Pairs with the SWR/edge cache to give two layers (browser memory cache + edge HTTP cache).

### 10.3 Query keys

`src/hooks/use-content.ts:57-65`:

```ts
export const contentKeys = {
  all: ["content"] as const,
  lists: () => [...contentKeys.all, "list"] as const,
  list: (moduleId, type, filters?) =>
    [...contentKeys.lists(), moduleId, type, filters ?? {}] as const,
  details: () => [...contentKeys.all, "detail"] as const,
  detail: (moduleId, type, slug) =>
    [...contentKeys.details(), moduleId, type, slug] as const,
};
```

`src/hooks/use-quiz.ts:33-37`:

```ts
const quizKeys = {
  all: ["quiz"] as const,
  list: (moduleId: string, type: string) =>
    [...quizKeys.all, moduleId, type] as const,
};
```

| Hook | File | `staleTime` | Default key shape |
|---|---|---|---|
| `useCatalog(moduleId, type, filters?)` | `src/hooks/use-content.ts:114-125` | `5 min` | `["content","list",mod,type,filters]` |
| `useContentDetail(moduleId, type, slug)` | `src/hooks/use-content.ts:134-145` | `5 min` | `["content","detail",mod,type,slug]` |
| `useQuiz(moduleId, quizType)` | `src/hooks/use-quiz.ts:50-62` | `Infinity` | `["quiz",mod,type]` |
| `useLLDTemplatesLibrary(filter)` | `src/hooks/useLLDTemplatesLibrary.ts:30` | (default 5m) | `["lld-templates-library", filter]` |
| `useDueReviews(moduleId)` | `src/hooks/use-due-reviews.ts:87` | (default) | `[reviewKeys.due(moduleId)]` |
| `useSearch(query, module)` | `src/hooks/use-search.ts:74` | (default) | `[searchKeys.query(deferredQuery, module)]` |

### 10.4 Lesson loader (DB-direct, no React Query)

`src/lib/lld/lesson-loader.ts:65-100` is called from a server component / server action, not from a hook. It returns a tagged result `{ ok: true, payload }` or `{ ok: false, reason: 'missing' | 'corrupt' | 'db-error', message }`. There is also `listLessonSlugs()` (`:105-121`) that returns an empty array on any DB error rather than throwing, so the LLD sidebar is resilient when Postgres is unreachable.

---

## 11. Cross-module links

### 11.1 `src/components/cross-module/`

`src/components/cross-module/index.ts:1-14`:

```ts
export { BridgeButton } from "./BridgeButton";
export { BridgeConsumer } from "./BridgeConsumer";
export { BridgeLink } from "./BridgeLink";
export { BridgePanel } from "./BridgePanel";
export { ConceptModuleLinks } from "./ConceptModuleLinks";
export { ContextDrawer } from "./ContextDrawer";
export { ModuleContextBar } from "./ModuleContextBar";
export { RecommendedBridges } from "./RecommendedBridges";
export { SkillRadarChart } from "./SkillRadarChart";
```

| Component | Purpose | Source data |
|---|---|---|
| `BridgePanel` | Lists outgoing bridges from the active module | `getBridgesFromModule(activeModule)` from `src/lib/cross-module/bridge-registry` |
| `BridgeLink` / `BridgeButton` / `BridgeConsumer` | Renderers / triggers for individual bridges | same registry |
| `ConceptModuleLinks` | "This concept appears in N modules" cross-link, used on `/concepts/[slug]` and the canvas concept popover | `getConceptModules(conceptId)` from `src/lib/cross-module/concept-module-map` |
| `ContextDrawer` | Slide-in drawer surfacing related content from other modules when a node/concept is selected | composition of the above |
| `ModuleContextBar` | Top breadcrumb chip showing current cross-module context | reads `useUIStore` |
| `RecommendedBridges` | Suggested bridges based on user activity | bridge registry |
| `SkillRadarChart` | Per-module mastery radar | progress data |

`ConceptModuleLinks` switches the active module via the global Zustand store (`src/components/cross-module/ConceptModuleLinks.tsx:27-37`):

```tsx
const setActiveModule = useUIStore((s) => s.setActiveModule);
const refs = useMemo(() => getConceptModules(conceptId), [conceptId]);
const handleNavigate = useCallback(
  (ref: ConceptModuleRef) => { setActiveModule(ref.module); },
  [setActiveModule],
);
```

`MODULE_LABELS` and `MODULE_COLORS` (from `src/lib/cross-module/bridge-types`) drive the visual treatment.

### 11.2 `src/components/innovation/`

These are **content-bearing presentation components** — they render content from `src/lib/innovation/*` data files but don't pull from `module_content`. Each accepts data via props rather than fetching it.

| Component | Role | File |
|---|---|---|
| `DesignBattle` | Multiplayer head-to-head challenge UI with countdown, dual canvases, Elo delta | `src/components/innovation/DesignBattle.tsx` (uses `BATTLE_CHALLENGES`, `createBattleSession`, `submitDesign`, `finalizeBattle`, `scoreDesign` from `src/lib/innovation/design-battles`) |
| `DesignReview` | Senior-engineer-style review feedback panel | `DesignReview.tsx` |
| `ExplanationTooltip` | Inline explanation overlay for concepts | `ExplanationTooltip.tsx` |
| `IncidentTimeline` | Vertical timeline for war-story incident events | `IncidentTimeline.tsx` (uses `TimelineEvent`, `EVENT_TYPE_CONFIG` from `src/lib/innovation/war-stories`) |
| `IntentCursor` | Intent-prediction cursor overlay | `IntentCursor.tsx` |
| `ProtocolDeepDive` | Step-through protocol explainer (TLS, OAuth, Raft, …) | `ProtocolDeepDive.tsx` |
| `SkillTree` | SVG hexagonal skill tree with prerequisite edges, particle burst on unlock | `SkillTree.tsx` (uses `ALL_TRACKS`, `TRACK_NODES`, `SKILL_NODES`, `checkUnlockable`, `getTrackProgress`, `getTrackEdges` from `src/lib/innovation/skill-tree`) |
| `StreakProtector` | Streak-loss prevention modal | `StreakProtector.tsx` |
| `TimeAttackMode` | Timed challenge mode | `TimeAttackMode.tsx` |
| `WarStoryViewer` | Wraps `IncidentTimeline` plus narration | `WarStoryViewer.tsx` |

These components are **consumed inside** module shells (e.g., `WarStoryViewer` and `IncidentTimeline` inside the Distributed Systems module, `DesignBattle` inside Interview Prep) — the cross-module bridges in §11.1 surface them across modules.

### 11.3 Wiring

The chain from a concept page to a module is:

1. `/concepts/[slug]` page renders `<ConceptModuleLinks conceptId={slug} />`.
2. `ConceptModuleLinks` calls `getConceptModules(slug)` (a static map in `src/lib/cross-module/concept-module-map.ts`).
3. On click, `setActiveModule(ref.module)` writes to the Zustand `ui-store`.
4. The module shell at `/` reads `activeModule` and mounts the corresponding wrapper from `src/components/modules/wrappers/*`.
5. `BridgePanel` inside the module shell reads `getBridgesFromModule(activeModule)` and shows reciprocal links back out to the rest of the platform.

> **CORRECTION (2026-05-07):** This section is accurate at a high level (Zustand `setActiveModule` is the actual mechanism — confirmed at `src/components/cross-module/ConceptModuleLinks.tsx:32-37`). One landmine to flag: `CONCEPT_MODULE_MAP` (`src/lib/cross-module/concept-module-map.ts:18+`) carries a `path: string` field per ref (e.g. `"/algorithms?algo=binary-search"`, `"/database?concept=b-tree-index"`). **None of those URLs route anywhere** — `/algorithms` (bare) is 404, and the `?algo=` / `?concept=` query params are NOT consumed by any module hook (grep confirms no `searchParams.get('algo')` / `searchParams.get('concept')` consumers in the SPA, only `?lld=` is actually read at `src/components/modules/lld/hooks/useLLDModuleImpl.tsx:265`). The `path` field is dead data that survives because the click handler only uses `ref.module`, not `ref.path`. Source: `09-ui-tour.md` v2 §1B and `18-other-modules.md` §2.3.

---

## 12. Quirks

### 12.1 Lesson MDX is precompiled — no Next MDX page extension

`next.config.ts` does not register `mdx` as a `pageExtension`. There is no `withMDX` wrapper, no remark/rehype plugin chain at Next build time. MDX exists only inside the `compile-lld-lessons` script and the `MDXRenderer` runtime evaluator. As a side effect, the `function-body` output format requires `new Function(...)` at runtime — this means the LLD lesson reader cannot run under a strict CSP (`script-src 'self'` would block it). `next.config.ts` does not currently set CSP headers (no `Content-Security-Policy` in the `headers()` array at `next.config.ts:6-29`), so this works in production.

### 12.2 Two seed strategies for LLD coexist

`scripts/compile-lld-lessons.ts` upserts via Drizzle directly. `scripts/seed-lld-lessons-from-json.mjs` exists as a parallel path that uses raw `pg` because, per its header comment (`:5-12`), the Node 25 + tsx ESM toolchain can't always import the schema. The `--json-out` flag of the compile script writes the intermediate artifact to `content/lld/compiled/<slug>.json`. This directory does **not** exist in the repo today — the JSON path is opt-in and the artifacts are gitignored / not committed.

### 12.3 LLD seeder uses delete-then-insert, not upsert

Comment at `src/db/seeds/lld.ts:163-167`:

```ts
// ── Delete existing LLD rows and re-insert fresh ──────────
// Using delete+insert instead of upsert to guarantee content updates
console.log(`    Deleting existing LLD rows...`);
await db.delete(moduleContent).where(
  sql`${moduleContent.moduleId} = ${MODULE_ID}`,
);
```

This wipes any rows authored by the MDX compile step before re-running — so `pnpm db:seed -- --module=lld` will **destroy** lesson rows authored by `compile-lld-lessons`. The intended order is: seed `lld` first (loads patterns/problems/etc.), **then** run `compile:lld-lessons` to insert the lesson rows on top. Running them in the reverse order silently loses lesson data.

### 12.4 The committed `concept-graph.ts` is empty

`src/lib/lld/concept-graph.ts` ships with empty maps (`{}`). Because `build-concept-graph` is manual, the committed artifact is whatever the last author bumped — currently empty. `getConfusedWith()` and friends therefore return empty arrays unless someone runs `pnpm build:concept-graph` and commits the regenerated file. The runtime `ConfusedWithPanel` at `src/components/modules/lld/learn/ConfusedWithPanel.tsx:20-22` returns `null` when the array is empty, so the absence is invisible to the user.

### 12.5 Two parallel concept catalogs

There are two concept databases that don't link:

- `src/lib/seo/concepts-data.ts` → 40 entries, drives `/concepts/[slug]` pages, six categories (`infrastructure`, `data-management`, `distributed-systems`, `architecture`, `reliability`, `performance`).
- `src/lib/knowledge-graph/concepts.ts` → also `CONCEPTS`, drives the `KnowledgeGraphModule`, ten domains (`compute`, `storage`, `messaging`, …).

Slugs may overlap (`load-balancer`, `consistent-hashing`) but the schemas differ. There is no shared source-of-truth.

### 12.6 Quiz API ignores `correctIndex` when serving

`src/app/api/quiz/route.ts:36-50` returns full `quizQuestions` rows including `correctIndex` and `explanation`. Anyone hitting `/api/quiz` can read the answers. This is intentional for offline-first / cached UX, but worth knowing when adding a graded quiz mode.

### 12.7 `templates` API has two backends

`src/app/api/templates/route.ts:21-122` switches on `NEXT_PUBLIC_SYSDESIGN_USE_API`. With the env var unset (default), it serves in-memory `SYSTEM_DESIGN_TEMPLATES`. With it set, it queries `module_content`. Both paths reshape rows back into the `DiagramTemplate` interface; the DB path lossily maps `difficulty: string` back to a number using `DIFFICULTY_MAP` (`route.ts:28-33`):

```ts
const DIFFICULTY_MAP: Record<string, number> = {
  beginner: 1, intermediate: 2, advanced: 3, expert: 4,
};
```

### 12.8 Bespoke `/learn/parking-lot` lives outside the LLD module

The flagship long-form lesson at `/learn/parking-lot` is **not** an MDX-compiled lesson. It's a fully custom React page with 700+ lines of hand-authored components, a `DifficultyContext`, and bespoke widgets (`PredictBeforeReveal`, `RetrievalCheck`, `PatternFitJudge`, `AntiPatternMuseum`, `EdgeCasesList`, `StateMachineWidget`). It does not feed `module_content`, does not write progress to `lld-learn-progress`, and its difficulty selector state is local. This is the single page-route under `src/app/learn/`.

### 12.9 `compile-lld-lessons` validates exactly four checkpoints

`scripts/compile-lld-lessons.ts:152-167` requires the frontmatter `checkpoints` array to contain one of each `kind` ∈ {`recall`, `apply`, `compare`, `create`}. Any deviation aborts compilation for that lesson. The runtime `CheckpointSection` (`src/components/modules/lld/learn/sections/CheckpointSection.tsx:22`) destructures positionally: `const [recall, apply, compare, create] = payload.checkpoints;` — order in MDX frontmatter must match.

### 12.10 Inline `<Concept>` and `<Class>` JSX requires runtime stubs

The MDX compiler with `outputFormat: "function-body"` doesn't know about React component imports — the rendered code calls `_components.Concept(...)` etc. `MDXRenderer.tsx:25-50` provides default stubs that render small inline chips. Override at the call site by passing `components={...}` to `<MDXRenderer />`. Today no caller overrides; the chips are the only thing visible.

### 12.11 `compile-lld-lessons` graceful no-op when content dir missing

`scripts/compile-lld-lessons.ts:244-250`:

```ts
if (!existsSync(LESSON_DIR)) {
  console.log(
    `[compile-lld-lessons] lesson dir missing: ${LESSON_DIR} — nothing to compile`,
  );
  return;
}
```

Same for `build-concept-graph.ts:48-52`. These are deliberate so CI without a content checkout doesn't fail.

### 12.12 Blog markdown renderer is hand-rolled

`src/app/blog/[slug]/page.tsx:58-110+` walks `content.split("\n")` and emits headings/lists/paragraphs. No `react-markdown`, no `remark` chain. Indented code blocks, tables, and inline code spans are not rendered specially. The blog content in `src/lib/blog/posts.ts:13-50` is short snippets only; the longer posts come from `BLOG_POST_DATA` (`src/lib/seo/blog-data.ts`) and inherit the same renderer.

---

## 13. Open questions

1. **Lesson coverage.** Only seven lessons exist in `content/lld/lessons/` (singleton, builder, prototype, factory-method, abstract-factory, observer, facade). The LLD module has 36 patterns in `DESIGN_PATTERNS` (`src/db/seeds/lld.ts:36-55`) and 33 LLD problems. The lesson MDX pipeline is healthy for the seven; the other 29 patterns currently have no MDX lesson. Plan / roadmap to compile the rest is not visible in the codemap scope.

2. **`concept-graph.ts` regeneration cadence.** The committed `src/lib/lld/concept-graph.ts` is empty. There is no pre-commit hook, no CI step, and no documentation linking lesson edits to graph rebuilds. Authors need to remember to run `pnpm build:concept-graph` after every YAML change and commit the regenerated file.

3. **Two concept databases.** `src/lib/seo/concepts-data.ts` (SEO/pages) vs `src/lib/knowledge-graph/concepts.ts` (graph module) are independent. No shared source-of-truth, no automated reconciliation. Drift is likely.

4. **JSON-out artifact directory not in repo.** `compile-lld-lessons --json-out` writes `content/lld/compiled/`, but the directory does not exist on disk and is not in `.gitignore` (didn't grep `.gitignore` exhaustively). Unclear whether the alternate seeder path (`seed-lld-lessons-from-json.mjs`) is the recommended one or a fallback.

5. **`/learn/parking-lot` vs LLD lesson runtime.** The flagship parking-lot lesson is hand-authored in TSX, not MDX, and bypasses the entire compile pipeline. Convergence path / authoring guidance is not visible. `docs/CONTENT_STRATEGY.md` describes voice but not lesson format unification.

6. **No CI / cron for compile + seed.** All scripts are manual via `pnpm`. There is no GitHub Action that re-seeds on content changes; a stale DB after a content edit silently serves old content from the API.

7. **Lesson MDX requires `new Function(...)`.** The runtime `eval` of compiled MDX precludes a strict `script-src` CSP. If CSP is tightened later, the LLD lesson reader will need a different MDX runtime (e.g. `@mdx-js/react` with `outputFormat: "program"` and proper bundler integration).

8. **Quiz answers exposed via API.** `/api/quiz` ships `correctIndex` and `explanation` to the client. Acceptable today (cache-friendly, offline-first) but blocks any future graded/scored quiz that needs server-side checking.

9. **Lesson row `name` uses the slug.** `compile-lld-lessons.ts:200-208` sets `name: result.slug` instead of a human-readable title. Any UI that renders `moduleContent.name` for lesson rows (e.g. sidebar) shows `singleton` rather than `Singleton`. Title currently lives only in the LLD pattern catalog (`DESIGN_PATTERNS[i].name`) and the lesson `subtitle`.

10. **Pattern walkthroughs vs lessons.** `src/db/seeds/pattern-walkthroughs.ts` defines a different content shape (5–7 educational steps with class highlights and `keyInsight`) for the same pattern slugs as the lesson MDX. They coexist in `module_content` under different `contentType`s (`lesson` vs `pattern-walkthrough`). The relationship between the two formats and which is canonical for any given pattern is not documented in scope.
