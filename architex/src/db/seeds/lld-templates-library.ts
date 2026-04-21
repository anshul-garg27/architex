/**
 * Seeds ~60 curated LLD templates into `lld_templates_library`.
 *
 * Breakdown:
 * - 8 creational + 8 structural + 7 behavioral = 23 GoF pattern starters
 * - 12 architecture blueprints
 * - 12 microservice patterns
 * - 13 data/AI starters
 *
 * Total: 60. IDs are content-stable slugs; updates are idempotent by slug.
 *
 * NOTE: canvasState is currently `{ nodes: [], edges: [] }` placeholder.
 * Phase 4 content wave authors real React Flow JSON per template
 * (either extracted from src/lib/templates/blueprints/ or generated
 * from pattern definitions). See plan Open Questions §1.
 */

import type { NewLLDTemplatesLibraryEntry } from "@/db/schema";
import { getDb, lldTemplatesLibrary } from "@/db";

// Helper: minimal canvas shape the React Flow store expects.
function tpl(
  slug: string,
  name: string,
  description: string,
  category: NewLLDTemplatesLibraryEntry["category"],
  difficulty: "beginner" | "intermediate" | "advanced",
  patternIds: string[],
  tags: string[],
  canvasState: Record<string, unknown>,
  sortOrder = 0,
): NewLLDTemplatesLibraryEntry {
  return {
    slug,
    name,
    description,
    category,
    difficulty,
    patternIds,
    tags,
    canvasState,
    isCurated: true,
    sortOrder,
  };
}

// ── Creational (8) ──────────────────────────────────────────────

const creational: NewLLDTemplatesLibraryEntry[] = [
  tpl(
    "singleton-registry",
    "Singleton · Config Registry",
    "Thread-safe lazy singleton with double-checked locking. Ideal starter for config, logger, connection-pool.",
    "creational",
    "beginner",
    ["singleton"],
    ["thread-safe", "registry", "lazy"],
    { nodes: [], edges: [] },
    10,
  ),
  tpl(
    "factory-method-shape",
    "Factory Method · Shape Creator",
    "Classic GoF factory method with Shape abstract product, Creator subclasses per concrete shape.",
    "creational",
    "beginner",
    ["factory-method"],
    ["creation", "polymorphism"],
    { nodes: [], edges: [] },
    20,
  ),
  tpl(
    "abstract-factory-gui",
    "Abstract Factory · Cross-Platform GUI",
    "Families of related widgets (Button/Checkbox) per OS theme (Mac/Win/Linux).",
    "creational",
    "intermediate",
    ["abstract-factory"],
    ["family", "platform"],
    { nodes: [], edges: [] },
    30,
  ),
  tpl(
    "builder-sql-query",
    "Builder · SQL Query Builder",
    "Fluent builder assembling SELECT clauses step by step with optional WHERE/ORDER/LIMIT.",
    "creational",
    "intermediate",
    ["builder"],
    ["fluent", "sql"],
    { nodes: [], edges: [] },
    40,
  ),
  tpl(
    "prototype-document",
    "Prototype · Document Clone",
    "Deep-copy prototype for rich-text documents with nested elements.",
    "creational",
    "intermediate",
    ["prototype"],
    ["clone", "deep-copy"],
    { nodes: [], edges: [] },
    50,
  ),
  tpl(
    "object-pool-connection",
    "Object Pool · DB Connection Pool",
    "Recycled connection pool with acquire/release, max-size, and eviction.",
    "creational",
    "advanced",
    ["object-pool"],
    ["pool", "performance", "jdbc"],
    { nodes: [], edges: [] },
    60,
  ),
  tpl(
    "dependency-injection-container",
    "DI Container · Constructor Injection",
    "Minimal inversion-of-container with service registration and resolution.",
    "creational",
    "advanced",
    ["dependency-injection"],
    ["ioc", "container"],
    { nodes: [], edges: [] },
    70,
  ),
  tpl(
    "lazy-initializer",
    "Lazy Initializer · Memoized Factory",
    "Lazy-init wrapper with memoization and thread safety.",
    "creational",
    "beginner",
    ["lazy-initialization"],
    ["memoize", "lazy"],
    { nodes: [], edges: [] },
    80,
  ),
];

// ── Structural (8) ──────────────────────────────────────────────

const structural: NewLLDTemplatesLibraryEntry[] = [
  tpl(
    "adapter-legacy-api",
    "Adapter · Legacy API Bridge",
    "Wrap a legacy XML SDK behind a modern JSON interface.",
    "structural",
    "beginner",
    ["adapter"],
    ["bridge", "legacy"],
    { nodes: [], edges: [] },
    10,
  ),
  tpl(
    "decorator-coffee",
    "Decorator · Coffee Pricing",
    "Stackable decorators adding milk/sugar/whip to a base beverage.",
    "structural",
    "beginner",
    ["decorator"],
    ["wrap", "composition"],
    { nodes: [], edges: [] },
    20,
  ),
  tpl(
    "facade-video-encoder",
    "Facade · Video Encoder",
    "Hide ffmpeg complexity behind a simple `encode(video, format)` facade.",
    "structural",
    "intermediate",
    ["facade"],
    ["simplify", "wrapper"],
    { nodes: [], edges: [] },
    30,
  ),
  tpl(
    "composite-file-system",
    "Composite · File System Tree",
    "Files and directories as a uniform tree structure.",
    "structural",
    "intermediate",
    ["composite"],
    ["tree", "recursive"],
    { nodes: [], edges: [] },
    40,
  ),
  tpl(
    "proxy-rate-limit",
    "Proxy · Rate-Limited API",
    "Protection proxy throttling downstream calls per client.",
    "structural",
    "intermediate",
    ["proxy"],
    ["rate-limit", "middleware"],
    { nodes: [], edges: [] },
    50,
  ),
  tpl(
    "bridge-rendering",
    "Bridge · Shape × Renderer",
    "Decouple shape abstractions from rendering backends (raster/vector).",
    "structural",
    "advanced",
    ["bridge"],
    ["decouple", "orthogonal"],
    { nodes: [], edges: [] },
    60,
  ),
  tpl(
    "flyweight-text-glyph",
    "Flyweight · Text Glyph Cache",
    "Share immutable glyph state across thousands of rendered characters.",
    "structural",
    "advanced",
    ["flyweight"],
    ["cache", "memory"],
    { nodes: [], edges: [] },
    70,
  ),
  tpl(
    "extension-object",
    "Extension Object · Plugin Shape",
    "Add capabilities to a base shape without subclass explosion.",
    "structural",
    "advanced",
    ["extension-object"],
    ["plugin", "capability"],
    { nodes: [], edges: [] },
    80,
  ),
];

// ── Behavioral (7) ──────────────────────────────────────────────

const behavioral: NewLLDTemplatesLibraryEntry[] = [
  tpl(
    "strategy-sort",
    "Strategy · Sort Algorithm",
    "Swap sort strategies (quick/merge/heap) at runtime.",
    "behavioral",
    "beginner",
    ["strategy"],
    ["runtime-choice"],
    { nodes: [], edges: [] },
    10,
  ),
  tpl(
    "observer-event-bus",
    "Observer · Event Bus",
    "Publish/subscribe with synchronous fan-out notification.",
    "behavioral",
    "beginner",
    ["observer"],
    ["pubsub", "events"],
    { nodes: [], edges: [] },
    20,
  ),
  tpl(
    "command-editor",
    "Command · Undoable Editor",
    "Commands encapsulate edits so an editor can undo/redo.",
    "behavioral",
    "intermediate",
    ["command"],
    ["undo", "macro"],
    { nodes: [], edges: [] },
    30,
  ),
  tpl(
    "state-vending-machine",
    "State · Vending Machine",
    "FSM for vending machine transitions (idle/paying/dispensing).",
    "behavioral",
    "intermediate",
    ["state"],
    ["fsm"],
    { nodes: [], edges: [] },
    40,
  ),
  tpl(
    "iterator-collection",
    "Iterator · Custom Collection",
    "Expose traversal over a private tree/graph without leaking internals.",
    "behavioral",
    "intermediate",
    ["iterator"],
    ["traversal"],
    { nodes: [], edges: [] },
    50,
  ),
  tpl(
    "chain-of-responsibility-auth",
    "Chain of Responsibility · Auth Pipeline",
    "Pipeline of auth handlers (jwt → quota → abuse) each deciding pass/block.",
    "behavioral",
    "advanced",
    ["chain-of-responsibility"],
    ["pipeline", "auth"],
    { nodes: [], edges: [] },
    60,
  ),
  tpl(
    "visitor-ast",
    "Visitor · AST Walker",
    "Double-dispatch visitor traversing a compiler AST.",
    "behavioral",
    "advanced",
    ["visitor"],
    ["ast", "traverse"],
    { nodes: [], edges: [] },
    70,
  ),
];

// ── Architecture (12) ───────────────────────────────────────────

const architecture: NewLLDTemplatesLibraryEntry[] = [
  tpl("layered-ecommerce", "Layered · E-commerce App", "Classic 4-layer (UI → service → domain → repo).", "architecture", "beginner", [], ["layered", "crud"], { nodes: [], edges: [] }, 10),
  tpl("hexagonal-payments", "Hexagonal · Payments Core", "Ports and adapters isolating payment domain from providers.", "architecture", "intermediate", [], ["ports-and-adapters", "ddd"], { nodes: [], edges: [] }, 20),
  tpl("clean-arch-booking", "Clean Architecture · Booking", "Entities / use-cases / interface-adapters / frameworks.", "architecture", "intermediate", [], ["clean", "ddd"], { nodes: [], edges: [] }, 30),
  tpl("ddd-aggregate-cart", "DDD · Shopping Cart Aggregate", "Cart aggregate with line-item invariants and domain events.", "architecture", "advanced", [], ["ddd", "aggregate"], { nodes: [], edges: [] }, 40),
  tpl("cqrs-orders", "CQRS · Order Service", "Split read model (denormalized) from write model (aggregate).", "architecture", "advanced", [], ["cqrs"], { nodes: [], edges: [] }, 50),
  tpl("event-sourcing-wallet", "Event Sourcing · Wallet", "Immutable event log rebuilding wallet state.", "architecture", "advanced", [], ["event-sourcing"], { nodes: [], edges: [] }, 60),
  tpl("mvc-cms", "MVC · Minimal CMS", "Classic MVC for a blog / CMS.", "architecture", "beginner", [], ["mvc"], { nodes: [], edges: [] }, 70),
  tpl("mvvm-spa", "MVVM · SPA Dashboard", "View-model binding for a data-heavy dashboard.", "architecture", "intermediate", [], ["mvvm", "binding"], { nodes: [], edges: [] }, 80),
  tpl("pipe-and-filter-etl", "Pipe & Filter · ETL Job", "Streaming filter pipeline for ingest → transform → load.", "architecture", "intermediate", [], ["pipeline", "streams"], { nodes: [], edges: [] }, 90),
  tpl("onion-crm", "Onion · CRM Core", "Concentric layers with dependencies pointing inward.", "architecture", "intermediate", [], ["onion", "ddd"], { nodes: [], edges: [] }, 100),
  tpl("plugin-ide", "Plugin · Mini-IDE", "Host shell loading plugins over a strict API contract.", "architecture", "advanced", [], ["plugin", "extensibility"], { nodes: [], edges: [] }, 110),
  tpl("client-server-chat", "Client/Server · Chat", "Single-server chat with transport abstraction.", "architecture", "beginner", [], ["client-server"], { nodes: [], edges: [] }, 120),
];

// ── Microservices (12) ──────────────────────────────────────────

const microservices: NewLLDTemplatesLibraryEntry[] = [
  tpl("circuit-breaker", "Circuit Breaker · Downstream Guard", "State machine (closed/open/half-open) cutting off a failing dep.", "microservices", "intermediate", [], ["resilience"], { nodes: [], edges: [] }, 10),
  tpl("saga-order", "Saga · Distributed Order Workflow", "Orchestrated saga with compensating transactions.", "microservices", "advanced", [], ["saga", "workflow"], { nodes: [], edges: [] }, 20),
  tpl("outbox-publisher", "Outbox · Reliable Event Publish", "Transactional outbox pattern for reliable event publishing.", "microservices", "advanced", [], ["outbox", "events"], { nodes: [], edges: [] }, 30),
  tpl("api-gateway", "API Gateway · Fan-out", "Single entrypoint routing and aggregating.", "microservices", "intermediate", [], ["gateway"], { nodes: [], edges: [] }, 40),
  tpl("bff-mobile", "BFF · Mobile App", "Backend for frontend tailored to mobile needs.", "microservices", "intermediate", [], ["bff"], { nodes: [], edges: [] }, 50),
  tpl("service-discovery", "Service Discovery · Client-Side", "Client-side discovery with a registry.", "microservices", "intermediate", [], ["discovery"], { nodes: [], edges: [] }, 60),
  tpl("sidecar-proxy", "Sidecar · Envoy Proxy", "Sidecar handling TLS/retry/metrics for app container.", "microservices", "advanced", [], ["sidecar", "service-mesh"], { nodes: [], edges: [] }, 70),
  tpl("bulkhead-orders", "Bulkhead · Resource Isolation", "Thread-pool isolation protecting critical paths.", "microservices", "advanced", [], ["bulkhead", "resilience"], { nodes: [], edges: [] }, 80),
  tpl("strangler-migration", "Strangler Fig · Legacy Migration", "Incremental replacement of a legacy monolith.", "microservices", "intermediate", [], ["migration"], { nodes: [], edges: [] }, 90),
  tpl("leader-election", "Leader Election · Scheduler", "Distributed lock-based leader election.", "microservices", "advanced", [], ["leader", "consensus"], { nodes: [], edges: [] }, 100),
  tpl("cache-aside", "Cache-Aside · Product Catalog", "Read-through caching with TTL and invalidation.", "microservices", "beginner", [], ["cache"], { nodes: [], edges: [] }, 110),
  tpl("rate-limiter", "Rate Limiter · Token Bucket", "Per-tenant token bucket at the edge.", "microservices", "intermediate", [], ["rate-limit"], { nodes: [], edges: [] }, 120),
];

// ── Data + AI (13) ──────────────────────────────────────────────

const dataAndAi: NewLLDTemplatesLibraryEntry[] = [
  tpl("repository-orders", "Repository · Order Store", "Collection abstraction over persistence layer.", "data", "beginner", [], ["persistence"], { nodes: [], edges: [] }, 10),
  tpl("unit-of-work", "Unit of Work · Transactional Save", "Track changes and flush as one transaction.", "data", "intermediate", [], ["uow", "persistence"], { nodes: [], edges: [] }, 20),
  tpl("data-mapper", "Data Mapper · ORM-Lite", "Objects in memory, mapper writes them to rows.", "data", "intermediate", [], ["orm"], { nodes: [], edges: [] }, 30),
  tpl("active-record", "Active Record · Blog Post", "Object wraps table row; save() persists itself.", "data", "beginner", [], ["orm"], { nodes: [], edges: [] }, 40),
  tpl("lambda-architecture", "Lambda · Batch + Speed", "Batch + speed layers merging at serving layer.", "data", "advanced", [], ["lambda", "big-data"], { nodes: [], edges: [] }, 50),
  tpl("kappa-stream", "Kappa · Streaming Only", "Single streaming pipeline replacing lambda's dual-path.", "data", "advanced", [], ["kappa", "stream"], { nodes: [], edges: [] }, 60),
  tpl("cdc-replication", "CDC · Change Data Capture", "Replicate upstream writes via CDC stream.", "data", "advanced", [], ["cdc", "replication"], { nodes: [], edges: [] }, 70),
  tpl("ai-agent-loop", "AI Agent · Tool Loop", "Plan → call-tool → observe → repeat agent loop.", "ai", "intermediate", [], ["agent", "llm"], { nodes: [], edges: [] }, 10),
  tpl("rag-pipeline", "RAG · Retrieval-Augmented Generation", "Embed → retrieve → prompt → generate pipeline.", "ai", "intermediate", [], ["rag", "embeddings"], { nodes: [], edges: [] }, 20),
  tpl("vector-store-search", "Vector Store · Semantic Search", "Ingest pipeline and query API with reranker.", "ai", "advanced", [], ["vector", "search"], { nodes: [], edges: [] }, 30),
  tpl("ai-streaming-chat", "AI · Streaming Chat", "Streaming token delivery with abort and retry.", "ai", "intermediate", [], ["stream", "llm"], { nodes: [], edges: [] }, 40),
  tpl("ai-workflow-orchestrator", "AI · Workflow Orchestrator", "Structured DAG of LLM calls with retries.", "ai", "advanced", [], ["orchestration"], { nodes: [], edges: [] }, 50),
  tpl("ai-evaluation-harness", "AI · Evaluation Harness", "Offline eval pipeline over a dataset.", "ai", "advanced", [], ["eval"], { nodes: [], edges: [] }, 60),
];

export const lldTemplatesLibrarySeed: NewLLDTemplatesLibraryEntry[] = [
  ...creational,
  ...structural,
  ...behavioral,
  ...architecture,
  ...microservices,
  ...dataAndAi,
];

// Sanity self-check: 8 + 8 + 7 + 12 + 12 + 13 = 60
if (
  process.env.NODE_ENV !== "production" &&
  lldTemplatesLibrarySeed.length !== 60
) {
  console.warn(
    `[lld-templates-library seed] expected 60 entries, got ${lldTemplatesLibrarySeed.length}`,
  );
}

/**
 * Seed runner — can be invoked via `pnpm db:seed --module=lld-templates-library`.
 * Matches the signature expected by `src/db/seeds/index.ts`.
 */
export async function seed(db: ReturnType<typeof getDb>): Promise<void> {
  console.log("[seed] lld_templates_library …");
  for (const entry of lldTemplatesLibrarySeed) {
    await db
      .insert(lldTemplatesLibrary)
      .values(entry)
      .onConflictDoUpdate({
        target: lldTemplatesLibrary.slug,
        set: {
          name: entry.name,
          description: entry.description,
          category: entry.category,
          difficulty: entry.difficulty,
          tags: entry.tags,
          patternIds: entry.patternIds,
          canvasState: entry.canvasState,
          sortOrder: entry.sortOrder,
          updatedAt: new Date(),
        },
      });
  }
  console.log(
    `[seed] lld_templates_library: ${lldTemplatesLibrarySeed.length} entries`,
  );
}
