# 05 — AI Integration & Collaboration

> Codemap of every place an LLM, an AI quota, or a multi-user surface lives in
> the architex Next.js learning platform. Citations are file:line. No critique.

---

## 1. Purpose — where AI shows up in the product

The architex app uses Anthropic's Claude API for **seven distinct learning
surfaces**, each with its own prompt template, model choice, max-tokens budget,
fallback path, and persistence target. There is no single "AI service" — every
feature talks to the same `ClaudeClient` singleton (or, for server routes,
constructs a fresh `Anthropic({apiKey})` client per request) and is wired to
its own /api endpoint.

| # | Surface | UI entrypoint | Server route | Backing prompt module |
|---|---------|---------------|--------------|-----------------------|
| 1 | System-design hint (legacy) | `HintPanel` | `POST /api/hint` | `src/lib/ai/hint-system.ts` |
| 2 | System-design evaluation (legacy) | (no current UI; pipeline kept) | `POST /api/evaluate` | `src/lib/ai/serialize-diagram.ts` + `parse-evaluation.ts` |
| 3 | Spaced-repetition review (FSRS, no LLM) | hooks/use-due-reviews | `GET/POST /api/review` | `src/lib/fsrs.ts` |
| 4 | UML pattern explainer | `AIReviewPanel` (lld) | `POST /api/ai/explain` | inlined in route |
| 5 | LLD lesson "explain this snippet" | `useSelectionExplain` hook | `POST /api/lld/explain-inline` | inlined in route |
| 6 | LLD canvas "what's missing?" | `useAISuggestions` hook | `POST /api/lld/ai/suggest-nodes` | `src/lib/lld/ai-node-suggestions.ts` |
| 7 | Drill interviewer (streaming chat) | `useDrillInterviewer` hook | `POST/GET /api/lld/drill-interviewer/[id]/stream` | `src/lib/ai/interviewer-prompts.ts` + `interviewer-persona.ts` |
| 8 | Drill postmortem (one-shot JSON) | drill summary screen | `POST /api/lld/drill-attempts/[id]/postmortem` | `src/lib/ai/postmortem-generator.ts` |

Plus four **client-side-only** AI helpers that *would* call Claude when a key
is configured but otherwise run heuristic / mocked code:

| Helper | File | What it does without a key |
|--------|------|---------------------------|
| `generateArchitectureWithAI` | `src/lib/ai/architecture-generator.ts:424` | Falls through to `generateArchitecture` keyword matcher (8 hand-coded reference architectures) |
| `reviewDesignWithAI` | `src/lib/ai/design-reviewer.ts:478` | Returns the static rule engine result with empty `aiInsights[]` and `aiRecommendations[]` |
| `generateHintLive` | `src/lib/ai/hint-system.ts:303` | Falls through to mocked hints in `MOCK_HINTS` |
| `TopologyRuleEngine.getRulesForSignature` | `src/lib/ai/topology-rules.ts:443` | Returns from a 20-entry static `STATIC_RULE_MAP`, then `DEFAULT_FALLBACK` |

The Socratic tutor (`src/components/ai/SocraticTutor.tsx` +
`src/lib/ai/socratic-tutor.ts`) is a fully **client-side, mocked** experience —
no Claude call ever — built around a 4-phase state machine
(`assess → challenge → guide → reinforce`) and a hand-authored response bank
keyed by `ChallengeCategory`.

---

## 2. Provider & SDK

### Package & version

```
src/.../package.json:36:    "@anthropic-ai/sdk": "^0.88.0",
src/.../package.json:59:    "comlink": "^4.4.2",
```

`comlink` is shipped as a dependency but is not currently used in any source
file — see `grep -r "comlink\|Comlink" src/` returns nothing.

### Two construction patterns

**A. Singleton (client-side):** `src/lib/ai/claude-client.ts:105-263`

```ts
// src/lib/ai/claude-client.ts:120-141
static getInstance(): ClaudeClient { ... }
setApiKey(key: string): void {
  this.apiKey = key;
  this.client = new Anthropic({
    apiKey: key,
    dangerouslyAllowBrowser: true,
  });
}
```

The `dangerouslyAllowBrowser: true` flag is required because the user's API
key is stored client-side in localStorage (obfuscated, not encrypted —
`src/stores/ai-store.ts:54-64`) and the SDK refuses to run in a browser
without it. The singleton gates every client-initiated AI call.

**B. Per-request (server-side):** API routes that hold the *server-owned*
`ANTHROPIC_API_KEY` instantiate a fresh client inline:

```ts
// src/app/api/ai/explain/route.ts:480-499
const client = new Anthropic({ apiKey });
const message = await client.messages.create({
  model: "claude-sonnet-4-6",
  max_tokens: 2048,
  system: systemPrompt,
  messages: [{ role: "user", content: ... }],
});
```

The server-side path never sets `dangerouslyAllowBrowser` — Node runtime is
fine. Both paths use `messages.create(...)` exclusively; **there is no
streaming SDK call** anywhere in the repo. The drill interviewer's "stream"
is really one full `messages.create` followed by a single SSE `delta` chunk
(see §5).

### Configuration source

| Where | Source | Used by |
|-------|--------|---------|
| `process.env.ANTHROPIC_API_KEY` | server env | every `app/api/**/route.ts` |
| `useAIStore.apiKey` (obfuscated in localStorage) | client → `ClaudeClient.setApiKey` | client-side helpers (`hint-system`, `architecture-generator`, `design-reviewer`, `topology-rules`) |
| `process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | gates whether auth is enforced | every server route — when unset, dev-mode bypasses auth |

### Models in use (model id strings as written in code)

| Constant | Used by |
|----------|---------|
| `"claude-haiku-4-5"` | `lld/explain-inline`, `lld/ai/suggest-nodes`, `topology-rules`, `hint-system` (tier 1/2), `ai-store.testConnection` |
| `"claude-sonnet-4-20250514"` | client-side `claude-client.ts`, `architecture-generator`, `design-reviewer`, `interviewer-persona`, `postmortem-generator`, `hint-system` (tier 3) |
| `"claude-sonnet-4-6"` | server-side `app/api/ai/explain/route.ts:347, 483` only |

**Quirk:** the same product uses two different Sonnet identifiers
(`claude-sonnet-4-20250514` and `claude-sonnet-4-6`) depending on whether the
call is client-singleton or per-request server. There is no central constant.
See §11.

### Pricing tables (separate copies)

`src/lib/ai/claude-client.ts:42-45`
```
'claude-haiku-4-5':         { inputPerMillion: 0.80,  outputPerMillion: 4.00 }
'claude-sonnet-4-20250514': { inputPerMillion: 3.00,  outputPerMillion: 15.00 }
```

`src/lib/ai/cost-monitor.ts:53-57` (the *monitor* class — independent copy)
```
haiku:  { inputPerMillion: 0.25,  outputPerMillion: 1.25  }
sonnet: { inputPerMillion: 3.00,  outputPerMillion: 15.00 }
opus:   { inputPerMillion: 15.00, outputPerMillion: 75.00 }
```

`src/app/api/lld/explain-inline/route.ts:192-195` (inline)
```
// Haiku pricing: $0.80/1M input, $4.00/1M output
const cost = (inputTokens / 1_000_000) * 0.8 + (outputTokens / 1_000_000) * 4.0;
```

`src/app/api/ai/explain/route.ts:503-506` (inline)
```
// Sonnet pricing: $3/1M input, $15/1M output
```

The Haiku numbers disagree across files (`0.80/4.00` vs `0.25/1.25`). See §11.

---

## 3. Prompt taxonomy

| Category | Module | System prompt? | Output shape |
|----------|--------|----------------|--------------|
| **hint** | `src/lib/ai/hint-system.ts:346` (live) + `app/api/hint/route.ts:136-160` | No system; user prompt only | Free-form markdown text (no JSON) |
| **explain-inline (lesson snippet)** | `app/api/lld/explain-inline/route.ts:154-173` | Yes — "precise, friendly software-design tutor" | Plain prose, 2-3 paragraphs, no markdown headers |
| **evaluate (system design)** | `src/lib/ai/serialize-diagram.ts:132` (`buildEvaluationPrompt`) | No (uses one big user message) | Strict JSON: `{scores, feedback, strengths, improvements, followUpQuestions}` |
| **review (UML pattern detection)** | `app/api/ai/explain/route.ts:463-478` | Yes — "expert software architect and UML specialist" | Strict JSON: `{patterns[], correctness[], suggestions[], summary}` |
| **suggest-nodes** | `src/lib/lld/ai-node-suggestions.ts:29-38` | Yes — "senior software designer auditing a UML class diagram" | Strict JSON: `{suggestions: NodeSuggestion[]}` |
| **drill-interviewer-turn** | `src/lib/ai/interviewer-prompts.ts:29-83` | Yes — six personas (`generic`, `amazon`, `google`, `meta`, `stripe`, `uber`) + `BASE_RULES` | Free-form text, ≤120 words |
| **postmortem** | `src/lib/ai/postmortem-generator.ts:53-76` | Yes — "senior engineer writing a post-drill review" | Strict JSON: `{tldr, strengths[], gaps[], patternCommentary, tradeoffAnalysis, canonicalDiff[], followUps[]}` |
| **grade** (rubric scoring) | not implemented as a Claude call — see `src/lib/lld/drill-rubric.ts` | — | rule-based scoring |
| **architecture-generator** | `src/lib/ai/architecture-generator.ts:442-467` | Yes — "senior systems architect" + component allowlist | Strict JSON: `{name, description, nodes[], edges[], reasoning}` |
| **design-reviewer enrichment** | `src/lib/ai/design-reviewer.ts:512-528` | Yes — "senior systems architect reviewing a design diagram" | Strict JSON: `{insights[], recommendations[], score_adjustment}` |
| **topology-rules** | `src/lib/ai/topology-rules.ts:495-516` | Yes — "system design expert. Analyze the given topology and return a JSON object" | Strict JSON: `TopologyProfile` |
| **socratic-tutor** | n/a — no Claude call. Hand-authored bank in `src/lib/ai/socratic-tutor.ts:67-364` | — | TutorMessage objects from a literal switch |

**Common patterns across all server routes that DO call Claude:**

1. Auth gate (`requireAuth` + `resolveUserId`), conditionally bypassed when
   `process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is unset.
2. Body parse with explicit JSON-error 400.
3. Size guard (e.g. `nodes.length > 200 || edges.length > 400`).
4. **Sanitisation through `sanitizeUserInput()`** from
   `src/lib/ai/prompt-safety.ts:132` — applied to every user-controlled string
   before it reaches a system or user message.
5. API-key absent → return heuristic / fallback response with `isAI: false`.
6. Per-purpose rate limit check via the `ai_usage` table (see §6).
7. Call `client.messages.create(...)`.
8. Compute cost from `usage.input_tokens + usage.output_tokens` × per-model
   price; insert one row into `aiUsage` table (fire-and-forget).
9. Parse strict JSON; on failure, fall back to heuristic.

---

## 4. Per-feature prompt details

### 4.1 `POST /api/hint` — `src/app/api/hint/route.ts`

| | |
|---|---|
| **Input shape** | `{nodes: Node[], edges: Edge[], challenge: ChallengeDefinition}` (`hint/route.ts:19-23`) |
| **Sanitisation** | `challenge.title` and each requirement run through `sanitizeUserInput` (`hint/route.ts:114-115`) |
| **Auth** | None — even when Clerk is configured |
| **Rate limit** | None |
| **Model** | TODO — would have been `claude-sonnet-4-20250514` per the comment at `:164` |
| **Status** | **Wired but inert.** The Anthropic call is commented out (`:163-168`). Always returns `buildHeuristicHint(...)` with `isAI: false` (see `:171-173`). |
| **Output** | `{hint: string, isAI: false, message?: string}` |
| **Heuristic** | `buildHeuristicHint` (`hint/route.ts:27-71`) — branches on node count, edge count, and presence of cache/LB/queue keywords. |

### 4.2 `POST /api/evaluate` — `src/app/api/evaluate/route.ts`

| | |
|---|---|
| **Input shape** | `{nodes, edges, challenge}` (`evaluate/route.ts:26-30`) |
| **Auth** | None |
| **Size guard** | ≤200 nodes / ≤400 edges (`:128-133`) |
| **Sanitisation** | `challenge.title` + each requirement (`:136-137`) |
| **Prompt builder** | `buildEvaluationPrompt(serialized, challenge)` from `src/lib/ai/serialize-diagram.ts:132-218` — single big *user* message that embeds the diagram and the 6-dimension scoring rubric pulled from `SCORING_DIMENSIONS` (`src/lib/interview/scoring.ts`). |
| **Model** | TODO — comment says `claude-sonnet-4-20250514` (`:155`), `max_tokens: 2048` |
| **Status** | **Same as `/hint`** — Anthropic call is commented (`:153-164`), heuristic always returned. |
| **Heuristic** | `buildHeuristicEvaluation` (`:34-96`) — gives 1-10 scores per dimension based on node count, unique types, and challenge difficulty modifier. |
| **Parser** | `parseEvaluationResponse` from `src/lib/ai/parse-evaluation.ts:77-145` — handles markdown-fenced JSON, leading/trailing text, missing dimensions (fills missing with neutral 5), score clamping to [1,10]. |

### 4.3 `POST /api/review` — `src/app/api/review/route.ts`

| | |
|---|---|
| **Not an AI call.** | This is the FSRS spaced-repetition endpoint. Despite the directory name, the route uses `scheduleFSRS` from `@/lib/fsrs`, not Claude. |
| **POST** | Records a review rating (1=Again, 2=Hard, 3=Good, 4=Easy) and updates the `progress` row's stability/difficulty/nextReviewAt. |
| **GET** | Returns rows where `nextReviewAt <= now`, scoped to `userId + moduleId`. |
| **Auth** | `requireAuth + resolveUserId`, returns 401/404 on failure (`:25-32, :71-77`). |

### 4.4 `POST /api/ai/explain` — `src/app/api/ai/explain/route.ts`

The most fully-built AI route. Real Claude call, real rate-limit, real
`ai_usage` logging.

| | |
|---|---|
| **Input shape** | `{classes: UMLClass[], relationships: UMLRelationship[]}` (`:25-28`) |
| **Auth** | `requireAuth` only when Clerk is configured (`:361-367`); user lookup may be `null` in dev. |
| **Size guard** | ≤30 classes; ≥1 class required (`:399-411`) |
| **Sanitisation** | Loops every class name, attribute name+type, method name+returnType, parameter (handles both `string[]` and `{name,type}[]` param shapes), relationship label (`:414-432`). |
| **Rate limit** | 10 calls / user / hour, counted directly from `aiUsage` table by purpose `'explain'` (`:316-335`). |
| **System prompt** | `:463-478` — instructs strict JSON shape: `patterns / correctness / suggestions / summary`. |
| **User message** | `serializeUMLForPrompt(classes, relationships)` from `:70-120` — produces a Mermaid-ish text block with class blocks (visibility-mapped attributes/methods) + a "Relationships:" section. |
| **Model** | `"claude-sonnet-4-6"` (`:483`), `max_tokens: 2048` (`:484`) |
| **Cost calc** | inline at `:503-506` using Sonnet pricing. |
| **Logging** | `logUsage` insert into `aiUsage` table with `purpose: "explain"` and model `"claude-sonnet-4-6"` — fire-and-forget (`:509-513`). Note: `model` literal in `logUsage` is `"claude-sonnet-4-6"` (`:347`). |
| **Output** | `{patterns, correctness, suggestions, summary, isAI: true}` on success; `{...heuristic, isAI: false, aiError}` on parse failure (`:529-543`). |
| **Heuristic** | `buildHeuristicAnalysis` (`:124-312`) — detects Singleton (private ctor + getInstance), Observer (subject methods + listener interface name), Factory (create*-prefixed methods), Strategy (interface ≤2 methods + ≥2 implementors), Decorator (inherits + composes same target). |

### 4.5 `POST /api/lld/explain-inline` — `src/app/api/lld/explain-inline/route.ts`

| | |
|---|---|
| **Input shape** | `{selection, patternSlug, sectionId, sectionRaw}` (`:21-26`) |
| **Auth** | Conditional on Clerk config (`:86-93`) |
| **Size guard** | `selection ≤ 2000 chars` (`:116-121`); `sectionRaw` truncated to 4000 chars before sanitisation (`:126`). |
| **Rate limit** | 30 / user / hour, counted by purpose `'lld-explain-inline'` (`:34-67`). |
| **System prompt** | `:154-164` — "precise, friendly software-design tutor", 2-3 paragraphs, no markdown headers, ≤220 words, no invented facts. |
| **Model** | `"claude-haiku-4-5"` (`:177`), `max_tokens: 512` |
| **Cost calc** | Inline using Haiku pricing `0.80 / 4.00` (`:192-195`). |
| **Output** | `{explanation: string, isAI: boolean, cacheKey?: string}` |
| **Fallback** | Hand-built explanation referencing the snippet + pattern slug + section name (`:37-51`). |

### 4.6 `POST /api/lld/ai/suggest-nodes` — `src/app/api/lld/ai/suggest-nodes/route.ts`

| | |
|---|---|
| **Input shape** | `{nodes, edges, intent?}` from `useAISuggestions` hook (`src/hooks/useAISuggestions.ts:11-23`). |
| **Auth** | `requireAuth + resolveUserId`, returns 404 on missing user (`:29-33`). |
| **Rate limit** | Token-bucket via `createRateLimiter` from `@/lib/security/rate-limiter`, configured at `maxTokens=20, refillRate=1, refillInterval=180_000ms` (3 min) — i.e. 20 burst, ~20/hour sustained (`:13-25`). The bucket is keyed `lld-ai-suggest:${userId}`. |
| **Body validation** | requires `nodes` + `edges` arrays; `intent` truncated to 400 chars (`:54-65`). |
| **Delegate** | `suggestNodes(...)` from `src/lib/lld/ai-node-suggestions.ts:66-108`. |
| **System prompt** | `ai-node-suggestions.ts:29-38` — "Stay concrete... names the user would recognise from textbook design". Strict JSON `{suggestions: NodeSuggestion[]}`. |
| **Model** | `"claude-haiku-4-5"`, `max_tokens: 800`. **Goes through `ClaudeClient.getInstance()` — uses the client-side singleton, not a server-instantiated client.** This means the user's *client-stored* key is NOT what gets used here; only the server's `ANTHROPIC_API_KEY` would be picked up by the singleton if it were initialised. In practice if no key is configured, returns `[]` (`:72-75`). |
| **Output** | `{suggestions: NodeSuggestion[]}` — name, kind, reason, relatedTo, confidence. Capped to 7, dedup'd by `${name}|${reason}` (`:88-103`). |

### 4.7 `POST/GET /api/lld/drill-interviewer/[id]/stream`

See §5 — has its own section because of the SSE protocol.

There is also a thin alias: `src/app/api/lld/drill-attempts/[id]/turn/route.ts`
re-exports the stream POST (`:9-16`):

```ts
import { POST as streamPost } from "@/app/api/lld/drill-interviewer/[id]/stream/route";
export async function POST(request, ctx) { return streamPost(request, ctx); }
```

The hook `useDrillInterviewer` (`src/hooks/useDrillInterviewer.ts:74-78`)
posts to the **alias** path, then opens the SSE GET on the **real** path.

### 4.8 `POST /api/lld/drill-attempts/[id]/postmortem`

| | |
|---|---|
| **Trigger** | After a drill attempt has `submittedAt` set. |
| **Idempotency** | If the attempt row already has a `postmortem` JSONB value, returns it with `cached: true` and skips the LLM call (`:60-63`). |
| **Auth + ownership** | `requireAuth + resolveUserId`, then `attemptId AND userId` join (`:39-49`). |
| **Pre-conditions** | Attempt must be submitted (409 if not) and have a `rubricBreakdown` (409 if not) (`:51-71`). |
| **Input gathering** | Pulls `rubricBreakdown`, persona from `gradeBreakdown.persona`, stage durations from `attempt.stages`, canvas node/edge counts from `attempt.canvasState`, optional `canonical` from `getCanonicalFor(problemId)` (`:65-106`). |
| **Prompt builder** | `buildPostmortemPrompt(input)` from `src/lib/ai/postmortem-generator.ts:78-123`. |
| **System prompt** | `postmortem-generator.ts:53-76` — strict JSON shape with 7 fields, char-bounded each (`tldr ≤220, gaps[] ≤160 each`, …). |
| **Model** | `"claude-sonnet-4-20250514"` (`postmortem-generator.ts:118`), `max_tokens: 900`. |
| **Cache** | `cacheKey: "postmortem:${id}"`, `cacheTtlMs: 24 * 60 * 60 * 1000` — IndexedDB on the **server-side singleton** (no-op in Node?). See §7. |
| **Parser** | `parsePostmortemResponse` from `:147-175` — strips ``` fences, requires all 7 keys, throws `PostmortemParseError` on shape failure. |
| **Fallback** | Either no API key OR a parse error produces a rubric-derived synthetic postmortem (`:128-156`) — TL;DR is `"Final score N. AI postmortem unavailable."`, strengths/gaps come from rubric axes ≥75/<60. |
| **Persistence** | Write `postmortem` JSONB onto `lldDrillAttempts` (`:158-161`). |

---

## 5. Streaming interviewer

`src/app/api/lld/drill-interviewer/[id]/stream/route.ts`

Two methods on the same path. POST persists the user's chat turn; GET runs the
LLM and streams the reply back. The hook `useDrillInterviewer`
(`src/hooks/useDrillInterviewer.ts`) calls them in sequence: POST first, then
open an `EventSource` on GET.

### 5.1 POST: persist a user turn

| Step | Line(s) |
|------|---------|
| Auth | `:34-40` |
| Body parse + 400 if missing/empty content | `:42-52` |
| Look up active drill attempt for this user (not submitted, not abandoned) | `:54-72` |
| Find current max `seq` | `:74-79` |
| Insert turn (`role: "user"`, `stage: bodyStage ?? attempt.currentStage`, `persona: "generic"` always for user turns) | `:81-90` |
| Bump `lldDrillAttempts.lastActivityAt = now` | `:92-95` |
| Return `{ok: true, seq: number}` with status 201 | `:97-100` |

### 5.2 GET: stream the interviewer's reply

| Step | Line(s) |
|------|---------|
| Auth + active-drill lookup | `:107-135` |
| Load full chronological history via `parseTurnHistory` (sorts by seq) | `:137-155` |
| Resolve persona from `attempt.gradeBreakdown.persona ?? "generic"` | `:157-159` |
| Build `InterviewerRequest` via `buildInterviewerRequest` (`src/lib/ai/interviewer-persona.ts:70-105`) — composes persona system prompt + last user message; **caps history to 30 turns** (`historyCap`); throws `InterviewerPersonaRequestError` if history empty or last role isn't user | `:161-176` |
| Open `ReadableStream` and return SSE response | `:178-244` |

### 5.3 SSE wire format

The SSE protocol is hand-rolled (no `text/event-stream` library):

```
data: {"type":"delta","text":"<full reply text>"}\n\n
data: {"type":"done"}\n\n
```

On error:
```
data: {"type":"error","error":"<message>"}\n\n
```

Headers (`stream/route.ts:238-243`):
```
Content-Type: text/event-stream
Cache-Control: no-cache, no-transform
Connection: keep-alive
```

**Important quirk:** despite the SSE format, **the response is not actually
streamed token-by-token from Claude.** The route calls
`client.call({...})` (a single `messages.create`) at `:199-204`, accumulates
the full text into `fullReply`, and emits it as **one** `delta` event followed
by `done`. The client gets one chunk plus the close — see `:191-207`.

```ts
// stream/route.ts:191-207
let fullReply = "";
if (!client.isConfigured()) {
  fullReply = "(Interviewer persona requires the Anthropic API key ...)";
  send({ type: "delta", text: fullReply });
} else {
  const response = await client.call({
    model: req.model,
    systemPrompt: req.system,
    userMessage: req.messages[req.messages.length - 1]!.content,
    maxTokens: req.maxTokens,
  });
  fullReply = response.text;
  send({ type: "delta", text: fullReply });
}
```

The route **discards the prior assistant turns from `req.messages`** —
`buildInterviewerRequest` returns a `messages` array but only the last user
message is forwarded to `ClaudeClient.call`, which only takes a single
`userMessage`. Multi-turn history is *implicit in the system prompt context*
plus the single most recent user message.

### 5.4 Turn persistence

After streaming completes (still inside the GET handler, `:209-224`):

```ts
const [lastSeq] = await db.select({ seq: lldDrillInterviewerTurns.seq })
  .from(lldDrillInterviewerTurns)
  .where(eq(lldDrillInterviewerTurns.attemptId, id))
  .orderBy(desc(lldDrillInterviewerTurns.seq))
  .limit(1);

await db.insert(lldDrillInterviewerTurns).values({
  attemptId: id,
  role: "interviewer",
  stage: attempt.currentStage as DrillStage,
  persona,
  seq: (lastSeq?.seq ?? -1) + 1,
  content: fullReply,
});
```

Schema reference: `src/db/schema/lld-drill-interviewer-turns.ts:20-52`.
Columns: `id (uuid)`, `attemptId (uuid, cascade)`, `role`, `stage`, `persona`,
`seq (int, monotonic per attempt)`, `content (text)`, `metadata (jsonb)`,
`createdAt`. Indexed by `(attemptId, seq)`.

### 5.5 Client side

`src/hooks/useDrillInterviewer.ts:56-121`:

1. Optimistically append the user turn to `useDrillStore` (`:62-67`).
2. POST to `/api/lld/drill-attempts/${attemptId}/turn` (the alias) — persists
   user turn, returns 201 (`:73-78`). Errors are stored in `error` state
   but the SSE step continues regardless (`:79-81`).
3. Open `new EventSource(/api/lld/drill-interviewer/${attemptId}/stream)`
   (`:83-85`).
4. On `delta`: accumulate into `acc`, set `pending` for the streaming
   indicator (`:91-93`).
5. On `done`: append the full reply as an `interviewer` turn to
   `useDrillStore`, clear `pending`, close the source (`:94-105`).
6. On `error`: set error, close (`:106-111`).
7. On transport error: `"connection lost"`, close (`:113-118`).

### 5.6 Abort handling

| Where | What |
|-------|------|
| `useDrillInterviewer.ts:49-54` | unmount cleanup closes any open `EventSource` |
| `useSelectionExplain.ts:99-103, 116, 132` | aborts in-flight `fetch` via `AbortController` when a new request fires; on abort the catch block returns silently |
| `interviewer-persona.ts:73-76` | `historyCap` defaults to 30 — older turns are silently dropped from the prompt |
| stream route | no explicit abort handling on the server — the `ReadableStream`'s `controller.close()` runs in the `finally` of `start()` (`:232-234`) |

---

## 6. AI usage accounting

### 6.1 Schema

`src/db/schema/ai-usage.ts:20-46`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` (default random) | PK |
| `userId` | `uuid` | FK `users.id` ON DELETE CASCADE |
| `model` | `varchar(100)` | e.g. `'claude-sonnet-4-20250514'`, `'claude-haiku-4-5'`, `'claude-sonnet-4-6'` |
| `tokens` | `integer` | total = input + output |
| `cost` | `real` | USD; comment says "in USD cents" but values are written as dollars (e.g. Sonnet `(input/1M)*3.0`) — see §11 |
| `purpose` | `varchar(100)` | semantic tag — `'explain'`, `'lld-explain-inline'`, `'topology-rules'`, `'hint'`, `'evaluate'`, etc. (free-form per writer) |
| `metadata` | `text` | optional debug blob |
| `createdAt` | `timestamptz` | defaults `now()` |

Indexes (`:41-45`): `(userId)`, `(createdAt)`, `(userId, purpose)` — the third
is what enables the per-purpose hourly rate limit query.

### 6.2 What writes to `ai_usage`

| Route | `purpose` | Model written |
|-------|-----------|---------------|
| `/api/ai/explain` | `"explain"` | `"claude-sonnet-4-6"` (`route.ts:347`) |
| `/api/lld/explain-inline` | `"lld-explain-inline"` | `"claude-haiku-4-5"` (`route.ts:78`) |

Routes that **do not** write to `ai_usage` despite calling Claude:

- `/api/lld/ai/suggest-nodes` — uses singleton `ClaudeClient`, which has its
  own in-memory `costTracker` (`src/lib/ai/claude-client.ts:112-117`) but
  never persists.
- `/api/lld/drill-interviewer/[id]/stream` — same singleton path, no DB write.
- `/api/lld/drill-attempts/[id]/postmortem` — same singleton path, no DB write.

### 6.3 Quota enforcement

| Mechanism | Used by | Limits |
|-----------|---------|--------|
| `aiUsage` table COUNT query | `/api/ai/explain` `checkRateLimit` (`:319-335`) | 10 calls / user / hour for `purpose='explain'` |
| `aiUsage` table COUNT query | `/api/lld/explain-inline` `checkRateLimit` (`:53-67`) | 30 / user / hour for `purpose='lld-explain-inline'` |
| Token-bucket (in-memory) | `/api/lld/ai/suggest-nodes` (`:13-25`) | 20 burst, 1 token / 3 min refill, keyed `lld-ai-suggest:${userId}` |
| **None** | `/api/hint`, `/api/evaluate`, drill-interviewer stream, drill postmortem | unlimited |
| **Client-side budget** (cosmetic) | `useAIStore.budgetLimit` defaults to $10/month (`ai-store.ts:87`); `isFeatureEnabled` returns false when `totalCost >= budgetLimit` (`:141-149`) | gates client-singleton calls only |
| **Hint credits** (UI only) | `HintPanel` budget of 15 credits (`HintPanel.tsx:67, 95`); 1/3/5 credits per nudge/guided/full | not server-enforced |

### 6.4 Who can call what

| Endpoint | Auth required | Behaviour without Clerk |
|----------|---------------|-------------------------|
| `/api/hint`, `/api/evaluate` | none | full access |
| `/api/review` | yes — 401 on failure | always 401 |
| `/api/ai/explain` | conditional on `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | bypass + skip rate-limit (`userId=null`) |
| `/api/lld/explain-inline` | conditional | bypass + skip rate-limit |
| `/api/lld/ai/suggest-nodes` | always required | 401 |
| `/api/lld/drill-interviewer/[id]/stream` | always required | 401 |
| `/api/lld/drill-attempts/[id]/postmortem` | always required | 401 |

---

## 7. Caching

### 7.1 Server-side: prompt cache via `ClaudeClient`

The client-side singleton has a built-in IndexedDB cache that the *postmortem*
server route opportunistically uses:

```ts
// src/app/api/lld/drill-attempts/[id]/postmortem/route.ts:118-126
const response = await client.call({
  model: req.model,
  systemPrompt: req.system,
  userMessage: req.user,
  maxTokens: req.maxTokens,
  cacheKey: `postmortem:${id}`,
  cacheTtlMs: 24 * 60 * 60 * 1000,
});
```

In Node, IndexedDB doesn't exist, so this caching path is effectively a no-op
(though doesn't error — see `src/lib/ai/indexeddb-cache.ts:46-52` lazy init
inside `try/catch`). The persistence target is `architex-ai-cache` IDB DB,
`responses` store, default 500-entry LRU cap.

### 7.2 Client-side: IndexedDB response cache

`src/lib/ai/indexeddb-cache.ts` exports `AIResponseCache` with:

- `get<T>(key)` — returns null and deletes on TTL expiry; bumps
  `lastAccessedAt` on hit (`:61-79`).
- `set(key, value, ttlMs)` — adds with TTL; LRU-evicts on overflow.
- `clear()` — full wipe.
- Default DB `architex-ai-cache`, store `responses`, 500-entry max.

Used by:
- `ClaudeClient.cache` (auto-applied when `request.cacheKey` is present;
  default TTL 1 hour at `claude-client.ts:199`).
- `architecture-generator.ts:469` — keys `archgen:${desc.slice(0,100)}:${maxNodes}`, TTL 1 hour.
- `design-reviewer.ts:530-531` — keys `review:${...lengths}:${score}`, TTL 30 min.
- `hint-system.ts:331-332` — keys `hint:${challengeId}:${tier}:${stateHash}`, TTL 1 hour.
- `topology-rules.ts:416-417, 524` — separate IDB DB `architex-ai-topology`,
  store `rules`, 500-entry cap, **TTL 7 days**.

### 7.3 Idempotency

Only the postmortem route is explicitly idempotent — it stores the result on
the attempt row and returns `cached: true` on re-call (`:60-63`). All other AI
endpoints will fire a fresh Claude call on duplicate requests.

---

## 8. ML design module

### 8.1 What it teaches

The ML Design module covers feedforward neural networks, CNNs, decision
boundaries, loss landscapes, and a dashboard for training metrics. It's a
**pure-frontend visualisation** module — no Claude integration, no server
component.

### 8.2 Components

`src/components/ml-design/`:

| File | Purpose |
|------|---------|
| `CNNVisualizer.tsx` | Isometric block diagram of a CNN forward pass. 3 presets (LeNet, Small VGG, Tiny). Pure SVG/canvas. |
| `NeuralNetViz.tsx` | Layered neural-network SVG with optional weight + activation animation. Hand-coded layout (`SVG_WIDTH=800, NEURON_RADIUS=14`, etc.). |
| `DecisionBoundaryCanvas.tsx` | Grid-based forward-pass visualiser for a 2D classifier. |
| `LossLandscapeCanvas.tsx` | 2D loss landscape grid (40×40 evaluations). |
| `TrainingDashboard.tsx` | Loss/accuracy chart panel. |

Backed by `src/lib/ml-design/` — `cnn-forward.ts`, `cnn-layer.ts`,
`neural-net.ts`, `neural-network.ts`, `activations.ts`, `loss-functions.ts`,
`optimizers.ts`, `decision-boundary.ts`, `dropout-viz.ts`, `loss-landscape.ts`,
`ab-testing.ts`, `multi-armed-bandit.ts`, `feature-store.ts`,
`serving-patterns.ts`, `pipeline-templates.ts`, `dataset-generators.ts`,
`datasets.ts`. All pure functions per the analysis doc (see §13 reference).

### 8.3 AI integration

**None.** `grep -l "@anthropic-ai/sdk\|claude\|anthropic"
src/components/ml-design/` returns no matches. `grep -rn` against
`src/lib/ml-design/` likewise.

The ML Design hooks (`useMLDesignModule` in
`src/components/modules/MLDesignModule.tsx:3330`) consume the pure libs
directly. The 3,700-line monolithic component wires UI to the engines.

### 8.4 Server component

There is no `src/app/api/ml-design/...` route. ML training runs in-browser
(no Web Worker yet — `comlink` is shipped but unused).

The architecture analysis at
`docs/architecture/ml-design-backend-analysis.md` documents what *could* move
server-side: per-user saved experiments, hyperparameter configs, and progress.
None implemented yet.

---

## 9. Collaboration

### 9.1 Components

`src/components/collaboration/`:

| Component | Responsibility |
|-----------|----------------|
| `LiveCursors.tsx` | SVG overlay rendering remote cursors with lerp animation (LERP_FACTOR=0.15 per frame), name labels, fade-after-10s inactivity. |
| `SelectionRings.tsx` | Dashed ring overlay around nodes that remote users have selected; reads from `useCollaborationStore` and skips `localUserId`. |
| `PresenceBar.tsx` | Avatar stack + connection dot + "N online" + Share button. Pulls from `useCollaborationStore`. |
| `FollowIndicator.tsx` | "Following [name]" banner with Stop button — for the COL-006 follow-the-leader feature. |
| `index.ts` | Barrel re-exports the four components above. |

### 9.2 Real-time strategy — provider-agnostic, currently stubbed

`src/lib/collaboration/types.ts:96-102` defines a pluggable transport:

```ts
export interface CollaborationTransport {
  connect(roomId: string): void;
  disconnect(): void;
  send(message: SyncMessage): void;
  onMessage(handler: (message: SyncMessage) => void): void;
  readonly isConnected: boolean;
}
```

`CollaborationProvider` is typed as `'partykit' | 'local'`
(`types.ts:30`) — only `LocalTransport` is implemented. The stub echoes
every send back to the same handler:

```ts
// src/lib/collaboration/collaboration-manager.ts:43-47
send(message: SyncMessage): void {
  // In local mode, echo the message back so the manager
  // processes it as if it arrived from the network.
  this._handler?.(message);
}
```

`CollaborationManager` (`:56-264`) owns:

- a `Map<string, CollaboratorInfo>` of all collaborators;
- a `localUser`;
- 5 callback registries: `onCollaboratorJoin/Leave`, `onCursorMove`,
  `onSelectionChange`, `onNodeUpdate`.

It dispatches a discriminated union `CollaborationEvent`:

| Event type | Payload |
|------------|---------|
| `collaborator-join` | full `CollaboratorInfo` |
| `collaborator-leave` | id |
| `cursor-move` | `{collaboratorId, cursor: {x,y}}` |
| `selection-change` | `{collaboratorId, selectedNodeIds: string[]}` |
| `node-update` | `{collaboratorId, nodeId, data: Record<string,unknown>}` |

Wire format (`types.ts:81-87`): `{type, payload, senderId, timestamp}`.

### 9.3 What's NOT in the repo

A repo-wide grep:

| Pattern | Matches |
|---------|---------|
| `BroadcastChannel` | none |
| `WebSocket` | many — but only as content/edges/lessons referencing `WebSocket` as a *concept* in `lib/networking/` and `lib/lld/`, never used as a transport |
| `pusher`, `liveblocks`, `yjs` | none |
| `comlink` | imported nowhere; declared in `package.json` only |
| PartyKit | typed in the union, not implemented |

The collaboration store (`src/stores/collaboration-store.ts`) is fully
in-memory Zustand — no `persist` middleware. Reset on page reload.

### 9.4 Other collaboration-adjacent libs

`src/lib/collaboration/`:

| File | Purpose |
|------|---------|
| `comments.ts` | Comment threads on diagrams (data model only). |
| `follow-mode.ts` | Follow-leader logic. |
| `fork.ts` | Forking another user's design. |
| `shareable-links.ts` | Read-only / read-write share URL generation. |
| `upvotes.ts` | Like/upvote tracking. |

These are utility modules — no transport, just pure functions.

---

## 10. Cost / token controls

### 10.1 Max-tokens budgets

| Route / module | `max_tokens` | Justification (per code comment) |
|----------------|--------------|----------------------------------|
| `/api/ai/explain` | 2048 | Sonnet, JSON pattern analysis |
| `/api/lld/explain-inline` | 512 | Haiku, ≤220-word prose |
| `suggestNodes` | 800 | Haiku, ≤7 small JSON suggestions |
| `interviewer-persona` | 400 | Sonnet — "keep turns terse per BASE_RULES" (`interviewer-persona.ts:103`) |
| `postmortem-generator` | 900 | Sonnet, 7-field JSON |
| `architecture-generator.generateArchitectureWithAI` | 2048 | Sonnet, JSON nodes/edges |
| `architecture-generator.refineArchitectureWithAI` | 2048 | same |
| `design-reviewer.reviewDesignWithAI` | 1024 | Sonnet, JSON insights |
| `hint-system.generateHintLive` | 256 (nudge/guided) / 1024 (full) | tier-dependent |
| `topology-rules` | 1024 | Haiku, JSON simulation rules |
| (commented) `/api/hint` | 256 | Sonnet (planned) |
| (commented) `/api/evaluate` | 2048 | Sonnet (planned) |

### 10.2 System prompt size

The largest system prompts are:

- `interviewer-prompts.ts` — `BASE_RULES` (~600 chars) + persona profile
  (~200-400 chars) + injected stage / problem title; total ~1.2-1.5 KB.
- `postmortem-generator.ts:53-76` — strict-JSON shape with bullet-count rules,
  ~700 chars.
- `app/api/ai/explain/route.ts:463-478` — UML rubric + JSON shape, ~900 chars.

User messages are usually larger than system prompts because they embed
serialised diagrams, lessons, or class definitions. The largest user-message
input is the UML serializer at `route.ts:70-120`, which can grow to ~30 classes
× method signatures (the route enforces `classes ≤ 30` at `:399-403`).

### 10.3 Prompt caching strategy

There is **no use of Anthropic's native prompt caching** (`cache_control:
{type: "ephemeral"}` markers in messages.create). All caching is custom — the
`AIResponseCache` IDB layer caches the **whole response**, keyed by a string
the caller invents. This means:

- Cache hits skip the API call entirely and return the prior response object
  (with `cached: true` overlaid, see `claude-client.ts:178-183`).
- There's no incremental savings — partial cache hits aren't possible.
- TTLs vary: 30 min (design review), 1 hour (default), 24 hours (postmortem),
  7 days (topology rules).

### 10.4 Concurrency limit

`ClaudeClient` enforces `MAX_CONCURRENT = 3` via an internal
`ConcurrencyQueue` (`claude-client.ts:101, 59-97`). This applies only to
client-side calls through the singleton. Server routes that instantiate fresh
Anthropic clients have no queue.

### 10.5 Retry / backoff

`ClaudeClient.executeWithRetry` (`:208-227`):

- Detects `Anthropic.RateLimitError` or `APIError` with `status === 429`.
- Retries up to `MAX_RETRIES = 3` with exponential backoff
  (`BASE_BACKOFF_MS * 2^attempt`, base 1000ms → 1s, 2s, 4s).
- Other errors propagate immediately.

Server routes have no retry — a 429 from Anthropic surfaces as a 500 to the
caller via the generic `try/catch` at the bottom of each route.

---

## 11. Quirks

1. **Two model identifiers for "Sonnet 4".** Server routes write
   `"claude-sonnet-4-6"` (`/api/ai/explain`); client paths and other server
   routes (postmortem, interviewer) write `"claude-sonnet-4-20250514"`. There
   is no central constant. See `src/lib/ai/claude-client.ts:14` (singleton
   union type) vs `src/app/api/ai/explain/route.ts:347`.

2. **Conflicting Haiku price tables.** `claude-client.ts:43` says
   `0.80 / 4.00 per 1M`. `cost-monitor.ts:54` says `0.25 / 1.25 per 1M`. The
   per-route inline cost calc (`/api/lld/explain-inline:194-195`) uses the
   `0.80 / 4.00` numbers.

3. **`ai_usage.cost` column comment vs writers.** Schema comment says
   "Estimated cost in USD cents" (`ai-usage.ts:32`), but writers compute and
   insert dollars (e.g. `(input_tokens / 1_000_000) * 3.0` in
   `/api/ai/explain:503-506`).

4. **Hint and evaluate APIs are wired but inert.** `/api/hint` and
   `/api/evaluate` build the prompts and serialize the diagram but the
   `client.messages.create(...)` is **commented out** with a `// TODO` (`hint
   /route.ts:163-168`, `evaluate/route.ts:153-164`). Always returns the
   heuristic with `isAI: false`.

5. **Drill interviewer "stream" is not actually streamed.** The route uses
   `client.call({...})` which awaits the full response, then emits exactly one
   `delta` event followed by `done`. There is no
   `client.messages.stream(...)` anywhere in the repo.

6. **Drill interviewer drops conversation history at the API boundary.**
   `buildInterviewerRequest` produces a `messages: Array<...>` but the route
   forwards only `req.messages[req.messages.length - 1].content` as the
   `userMessage`. Multi-turn context is lost on every call — the model sees
   only the system prompt and the latest user line.
   (`stream/route.ts:199-204`.)

7. **Suggest-nodes uses the singleton (not server-instantiated client).**
   Most server AI routes create a fresh `new Anthropic({ apiKey })` per
   request from `process.env.ANTHROPIC_API_KEY`. `/api/lld/ai/suggest-nodes`
   delegates to `suggestNodes()`, which uses `ClaudeClient.getInstance()`.
   Since the singleton is initialised by `setApiKey` (only called from the
   client-side `useAIStore.setApiKey`), this server route relies on the
   server-side singleton being initialised by some other path — a missing
   key path returns `[]` rather than 500.

8. **Postmortem cache key collision.** `cacheKey: "postmortem:${id}"` is
   keyed only by attempt id. If a postmortem regenerates after a re-grade,
   the `attempt.postmortem` JSONB column gates re-call but the IDB cache
   would happily return the stale prior response — except that on the
   server, IDB doesn't exist, so the cache is effectively bypassed.

9. **Persona stored in `gradeBreakdown`, not its own column.** Drill persona
   is read from `(attempt.gradeBreakdown as { persona?: ... }).persona`
   (`stream/route.ts:157-159`, `postmortem/route.ts:87-89`). User turns are
   always persisted with `persona: "generic"` (`stream/route.ts:88`)
   regardless of the attempt's actual persona.

10. **Error swallowing in `architecture-generator` and `design-reviewer`.**
    Both wrap their AI call in `try { ... } catch { fall back }` with no
    error logging or rethrow (`architecture-generator.ts:523-527`,
    `design-reviewer.ts:546-548`). Failures are silent.

11. **Two independent rate-limit infrastructures.** Some routes use SQL
    counts on the `ai_usage` table; one route uses an in-memory token-bucket
    (`createRateLimiter`). They don't share state, so a user being throttled
    by one doesn't affect the other.

12. **No CORS handling on streaming route.** The SSE response sets
    `Cache-Control: no-cache, no-transform, Connection: keep-alive` but no
    explicit CORS — relies on Next's default same-origin handling.

13. **`prompts/` directory is for editor prompts, not LLM prompts.** The
    top-level `prompts/` folder contains markdown audit templates
    (`mega-audit.md`, `module-deep-audit.md`, etc.) used by the dev team to
    drive Claude Code sessions, not by runtime code.

14. **`templates/system-design/*.json`** are 50+ static reference
    architectures (`url-shortener.json`, `chat-system.json`, etc.) used as
    fixtures, not prompt templates.

15. **`generic` is the default persona in three places.** `stream/route.ts`
    defaults to `"generic"` when persona is missing
    (`:158`); user turns always get `persona: "generic"` (`:88`); postmortem
    falls back to `"generic"` (`:88`). The persona is set **at drill-start
    time** by writing into `gradeBreakdown` — which is otherwise the
    rubric-result JSON — so persona persists in a column whose name
    suggests the opposite.

---

## 12. Open questions

1. **Why are `/api/hint` and `/api/evaluate` half-built?** Both have the
   prompt construction and even the SDK call written out as comments. Were
   they superseded by the LLD-mode endpoints (`explain-inline`,
   `suggest-nodes`, drill flow)? If so, are they still mounted to support a
   legacy interview surface in `src/components/interview/`?

2. **What is the intended model strategy? Is `claude-sonnet-4-6` an
   internal alias?** Is the discrepancy between `claude-sonnet-4-6` and
   `claude-sonnet-4-20250514` intentional (e.g. one is an Anthropic API model
   alias, the other is the dated snapshot), or is one a typo? The
   `dotenv`-style env doesn't seem to centralise this.

3. **Is the `comlink` dependency reachable from any worker?** Declared in
   `package.json` but no source imports it. Was a Web Worker plan abandoned?

4. **Should the drill stream actually stream?** The route already has the
   `ReadableStream`, the SSE headers, and the SSE wire format — adding
   `client.messages.stream(...)` would be a small refactor. Is the
   buffer-then-emit pattern intentional (for moderation? for token
   accounting?) or a placeholder?

5. **Why does suggest-nodes call the singleton instead of building a fresh
   `Anthropic` client?** Every other server route uses
   `new Anthropic({apiKey: process.env.ANTHROPIC_API_KEY})`. The singleton
   path means the API key has to be set via `ClaudeClient.setApiKey` at boot
   — but no boot code does that on the server.

6. **Does `architex-ai-cache` IDB serve any purpose on the server?** The
   `AIResponseCache` is declared inside `ClaudeClient`, which the postmortem
   route uses on the server. The lazy `openDB(...)` in `idb-store` would
   throw on Node — yet the postmortem route doesn't surface that as an
   error.

7. **What is the migration path from `LocalTransport` to PartyKit (or
   another provider)?** The interface is already pluggable, but no PartyKit
   bindings, no env vars, no signalling endpoint exists. Is this a future
   sprint or vestigial design?

8. **Is the `generic` persona enforcement in user-turn rows
   (`persona: "generic"` in `stream/route.ts:88`) intentional?** If a user is
   in an Amazon Bar Raiser drill, their turns are still tagged `generic`,
   while interviewer turns get the correct persona — querying the table by
   persona will give an inconsistent picture.

9. **What's the rotation / shape of `ai_usage.metadata`?** Schema declares
   it as `text` with no writers populating it anywhere in the repo. Logged
   AI calls only set `userId, model, tokens, cost, purpose`.

10. **The `model_route_test` literal `"claude-sonnet-4-6"` in
    `logUsage` (route.ts:347) doesn't match the literal sent to Anthropic
    (`"claude-sonnet-4-6"` at `:483`).** They actually do match — but if the
    `messages.create` model string is changed in one place, the
    `aiUsage.model` column won't follow. Single-source-of-truth for model
    constants would be useful.

---

## 13. Reference: related docs

| Path | Relevance |
|------|-----------|
| `docs/architecture/ml-design-backend-analysis.md` | Detailed migration analysis for the ML Design module — what's pure-frontend vs candidate for DB persistence |
| `docs/research-findings/agent-pv-04-ai-features.md` | Research findings on AI feature design |
| `docs/research-findings/17-phase-prompts-573-tasks.md` | Internal prompt-engineering task index |
| `docs/design/algorithm-stitch-prompts.md` | Algorithm-module-specific prompt notes |
| `prompts/*.md` | Editor-side audit templates (NOT runtime LLM prompts) |
| `templates/system-design/*.json` | 50+ reference architectures (fixtures, not prompts) |
| `src/lib/ai/__tests__/` | Vitest tests for `interviewer-persona`, `interviewer-prompts`, `postmortem-generator`, `request-queue` |
| `src/__tests__/lib/ai/` | Tests for `architecture-generator`, `cost-monitor`, `design-reviewer`, `frustration-detector`, `hint-system`, `socratic-tutor` |

---

## 14. Citation index

- Anthropic SDK version: `package.json:36` — `"@anthropic-ai/sdk": "^0.88.0"`
- Singleton: `src/lib/ai/claude-client.ts:105-263`
- Per-route Anthropic instantiation: `src/app/api/ai/explain/route.ts:480`,
  `src/app/api/lld/explain-inline/route.ts:175`
- AI usage schema: `src/db/schema/ai-usage.ts:20-46`
- Drill turns schema: `src/db/schema/lld-drill-interviewer-turns.ts:20-52`
- Drill stream route: `src/app/api/lld/drill-interviewer/[id]/stream/route.ts:30-245`
- Drill turn alias: `src/app/api/lld/drill-attempts/[id]/turn/route.ts:9-16`
- Drill postmortem: `src/app/api/lld/drill-attempts/[id]/postmortem/route.ts:25-174`
- Hint route (inert): `src/app/api/hint/route.ts:75-174`
- Evaluate route (inert): `src/app/api/evaluate/route.ts:100-175`
- Review route (FSRS, not AI): `src/app/api/review/route.ts:24-187`
- UML explain route: `src/app/api/ai/explain/route.ts:356-554`
- Inline explain: `src/app/api/lld/explain-inline/route.ts:84-218`
- Suggest nodes: `src/app/api/lld/ai/suggest-nodes/route.ts:27-78`
- Suggest nodes core: `src/lib/lld/ai-node-suggestions.ts:66-108`
- Interviewer personas: `src/lib/ai/interviewer-prompts.ts:12-131`
- Interviewer request builder: `src/lib/ai/interviewer-persona.ts:70-105`
- Postmortem prompt: `src/lib/ai/postmortem-generator.ts:53-176`
- Prompt safety: `src/lib/ai/prompt-safety.ts:132-195`
- Diagram serializer + eval prompt: `src/lib/ai/serialize-diagram.ts:67-218`
- Eval response parser: `src/lib/ai/parse-evaluation.ts:77-145`
- AI store: `src/stores/ai-store.ts:80-211`
- Cost monitor: `src/lib/ai/cost-monitor.ts:90-267`
- IDB cache: `src/lib/ai/indexeddb-cache.ts:28-end`
- Topology rules: `src/lib/ai/topology-rules.ts:436-541`
- Architecture generator (AI path): `src/lib/ai/architecture-generator.ts:424-603`
- Design reviewer (AI path): `src/lib/ai/design-reviewer.ts:478-551`
- Hint system (live path): `src/lib/ai/hint-system.ts:303-377`
- Socratic tutor (mocked): `src/lib/ai/socratic-tutor.ts:67-552`
- Frustration detector: `src/lib/ai/frustration-detector.ts:1-end`
- Interview scorer: `src/lib/ai/interview-scorer.ts:1-end`
- Request queue: `src/lib/ai/request-queue.ts:1-end`
- AI components: `src/components/ai/HintPanel.tsx`,
  `src/components/ai/SocraticTutor.tsx`,
  `src/components/ai/GeneratedDiagramPreview.tsx`,
  `src/components/ai/ReviewOverlay.tsx`
- ML design components: `src/components/ml-design/*.tsx`
- Collaboration components: `src/components/collaboration/*.tsx`
- Collaboration types: `src/lib/collaboration/types.ts`
- Collaboration manager: `src/lib/collaboration/collaboration-manager.ts:27-264`
- Collaboration store: `src/stores/collaboration-store.ts`
- Drill interviewer hook: `src/hooks/useDrillInterviewer.ts`
- Selection-explain hook: `src/hooks/useSelectionExplain.ts`
- AI suggestions hook: `src/hooks/useAISuggestions.ts`
