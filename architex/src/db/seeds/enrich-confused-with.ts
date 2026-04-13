/**
 * Enriches module_content rows with confusedWith data for patterns that are missing it.
 * Run after the main LLD seed: pnpm db:seed then npx tsx src/db/seeds/enrich-confused-with.ts
 */

import { getDb } from "@/db";
import { moduleContent } from "@/db/schema/module-content";
import { eq, and } from "drizzle-orm";

const CONFUSED_WITH: Record<string, Array<{ patternId: string; difference: string }>> = {
  singleton: [
    { patternId: "flyweight", difference: "Singleton = one shared instance. Flyweight = many shared lightweight objects. Singleton controls creation; Flyweight controls memory via shared state." },
  ],
  facade: [
    { patternId: "mediator", difference: "Facade provides a simplified interface to a subsystem (one-way). Mediator coordinates bidirectional communication between peer objects." },
    { patternId: "adapter", difference: "Adapter makes an incompatible interface compatible. Facade simplifies a complex subsystem into a single entry point." },
  ],
  saga: [
    { patternId: "event-sourcing", difference: "Saga manages distributed transactions with compensating actions. Event Sourcing stores all state changes as immutable events for reconstruction." },
  ],
  "circuit-breaker": [
    { patternId: "retry", difference: "Retry keeps trying the same operation. Circuit Breaker stops trying after threshold failures (fail-fast) and periodically tests recovery." },
    { patternId: "bulkhead", difference: "Circuit Breaker stops cascading failures by opening the circuit. Bulkhead isolates failures by partitioning resources (thread pools, connection pools)." },
  ],
  retry: [
    { patternId: "circuit-breaker", difference: "Retry keeps attempting despite failures (with backoff). Circuit Breaker stops attempts entirely after a failure threshold is reached." },
  ],
  "thread-pool": [
    { patternId: "producer-consumer", difference: "Thread Pool manages a fixed set of worker threads. Producer-Consumer is about buffered communication between producers and consumers." },
  ],
  "producer-consumer": [
    { patternId: "thread-pool", difference: "Producer-Consumer decouples data production from consumption via a buffer. Thread Pool decouples task submission from execution via a work queue." },
  ],
  "react-pattern": [
    { patternId: "tool-use", difference: "ReAct interleaves reasoning (Thought) with actions in a loop. Tool Use is a simpler invoke-tool-and-return pattern without iterative reasoning." },
  ],
  "multi-agent-orchestration": [
    { patternId: "mediator", difference: "Multi-Agent Orchestration coordinates AI specialist agents with memory. Mediator coordinates generic objects — no agent intelligence, no shared memory." },
  ],
  "tool-use": [
    { patternId: "strategy", difference: "Tool Use dynamically discovers and invokes external tools. Strategy selects from a fixed set of algorithms known at compile time." },
    { patternId: "react-pattern", difference: "Tool Use is a single action→result cycle. ReAct is an iterative loop of think→act→observe until the goal is achieved." },
  ],
  composite: [
    { patternId: "decorator", difference: "Composite builds tree structures (part-whole hierarchy). Decorator wraps objects to add behavior (chain, not tree)." },
  ],
  bridge: [
    { patternId: "adapter", difference: "Bridge separates abstraction from implementation by design (upfront). Adapter converts an existing incompatible interface after the fact (retrofit)." },
    { patternId: "strategy", difference: "Bridge decouples a permanent abstraction/implementation relationship. Strategy swaps algorithms at runtime without changing the object's identity." },
  ],
  flyweight: [
    { patternId: "singleton", difference: "Singleton ensures one instance total. Flyweight shares intrinsic state across many instances to save memory — you can have many flyweights." },
  ],
  "chain-of-responsibility": [
    { patternId: "decorator", difference: "Chain passes a request until ONE handler processes it. Decorator wraps ALL layers — every decorator runs." },
  ],
  memento: [
    { patternId: "command", difference: "Memento captures full state snapshots for undo. Command captures operations (with undo logic) — lighter weight but requires implementing reverse for each command." },
  ],
  visitor: [
    { patternId: "strategy", difference: "Visitor adds new operations to existing class hierarchies (double dispatch). Strategy lets you swap algorithms within one class." },
  ],
  prototype: [
    { patternId: "abstract-factory", difference: "Prototype creates objects by cloning existing instances. Abstract Factory creates objects via factory methods. Prototype is instance-based; Factory is class-based." },
  ],
  cqrs: [
    { patternId: "event-sourcing", difference: "CQRS separates read and write models. Event Sourcing stores every state change as an event. They pair well but are independent." },
  ],
  "event-sourcing": [
    { patternId: "cqrs", difference: "Event Sourcing stores all state changes as events (append-only log). CQRS splits read/write paths. Event Sourcing is a storage strategy; CQRS is an architectural pattern." },
  ],
  bulkhead: [
    { patternId: "circuit-breaker", difference: "Bulkhead partitions resources to contain failures. Circuit Breaker detects failures and stops retrying. Bulkhead is preventive isolation; Circuit Breaker is reactive protection." },
  ],
  interpreter: [
    { patternId: "visitor", difference: "Interpreter defines a grammar and evaluates expressions. Visitor adds operations to a class hierarchy. Interpreter IS the operation; Visitor separates operations from the data structure." },
  ],
};

async function main() {
  const db = getDb();
  let updated = 0;

  for (const [slug, confusedWith] of Object.entries(CONFUSED_WITH)) {
    // Get current content
    const [row] = await db
      .select()
      .from(moduleContent)
      .where(
        and(
          eq(moduleContent.moduleId, "lld"),
          eq(moduleContent.contentType, "pattern"),
          eq(moduleContent.slug, slug),
        ),
      )
      .limit(1);

    if (!row) {
      console.warn(`  Pattern "${slug}" not found in DB — skipping`);
      continue;
    }

    // Merge confusedWith into existing content JSONB
    const content = row.content as Record<string, unknown>;
    if (content.confusedWith && (content.confusedWith as unknown[]).length > 0) {
      console.log(`  "${slug}" already has confusedWith — skipping`);
      continue;
    }

    const updatedContent = { ...content, confusedWith };

    await db
      .update(moduleContent)
      .set({ content: updatedContent, updatedAt: new Date() })
      .where(
        and(
          eq(moduleContent.moduleId, "lld"),
          eq(moduleContent.contentType, "pattern"),
          eq(moduleContent.slug, slug),
        ),
      );

    updated++;
    console.log(`  ✓ Added confusedWith to "${slug}" (${confusedWith.length} entries)`);
  }

  console.log(`\nDone: ${updated} patterns enriched in DB.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
