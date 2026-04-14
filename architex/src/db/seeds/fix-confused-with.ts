/**
 * Adds/updates confusedWith data for patterns that are missing entries.
 * Supplements enrich-confused-with.ts with additional or expanded entries.
 *
 * Run: pnpm db:seed -- --module=fix-confused-with
 */

import type { Database } from "@/db";
import { moduleContent } from "@/db/schema/module-content";
import { eq, and } from "drizzle-orm";

const CONFUSED_WITH: Record<string, Array<{ patternId: string; difference: string }>> = {
  singleton: [
    { patternId: "flyweight", difference: "Singleton = one shared instance. Flyweight = many shared lightweight objects. Singleton controls creation; Flyweight controls memory via shared state." },
    { patternId: "global-variable", difference: "Singleton provides controlled access through a method with lazy initialization and can implement interfaces. A global variable is uncontrolled mutable state with no encapsulation, lifecycle management, or testability." },
  ],
  builder: [
    { patternId: "abstract-factory", difference: "Builder constructs a complex object step-by-step (order matters, intermediate state exists). Abstract Factory creates families of related objects in one shot (no intermediate state)." },
    { patternId: "prototype", difference: "Builder assembles a new object piece by piece. Prototype creates a new object by cloning an existing one. Builder is construction; Prototype is copying." },
  ],
  "template-method": [
    { patternId: "strategy", difference: "Template Method varies steps within a fixed algorithm via inheritance (subclass overrides). Strategy swaps the entire algorithm via composition (inject a different strategy object)." },
    { patternId: "factory-method", difference: "Template Method defines an algorithm skeleton with overridable steps. Factory Method is a specific case where the overridable step is object creation. Factory Method is often used inside Template Method." },
  ],
  visitor: [
    { patternId: "iterator", difference: "Visitor adds operations to a type hierarchy via double dispatch (type-safe per-element handling). Iterator provides sequential access to elements without type-specific handling." },
    { patternId: "strategy", difference: "Visitor adds new operations to existing class hierarchies (double dispatch). Strategy lets you swap algorithms within one class." },
  ],
  facade: [
    { patternId: "adapter", difference: "Adapter makes an incompatible interface compatible. Facade simplifies a complex subsystem into a single entry point." },
    { patternId: "mediator", difference: "Facade provides a simplified interface to a subsystem (one-way). Mediator coordinates bidirectional communication between peer objects." },
  ],
  composite: [
    { patternId: "decorator", difference: "Composite builds tree structures (part-whole hierarchy). Decorator wraps objects to add behavior (chain, not tree)." },
  ],
  "chain-of-responsibility": [
    { patternId: "decorator", difference: "Chain passes a request until ONE handler processes it. Decorator wraps ALL layers — every decorator runs." },
  ],
  memento: [
    { patternId: "command", difference: "Memento captures full state snapshots for undo. Command captures operations (with undo logic) — lighter weight but requires implementing reverse for each command." },
    { patternId: "prototype", difference: "Memento saves an opaque snapshot of internal state for later restoration. Prototype clones an entire object to create independent copies. Memento preserves encapsulation; Prototype copies the public interface." },
  ],
  iterator: [
    { patternId: "visitor", difference: "Iterator provides generic sequential access (pull-based, any operation). Visitor provides type-specific processing via double dispatch (push-based, operation per element type)." },
  ],
  prototype: [
    { patternId: "factory-method", difference: "Prototype creates objects by cloning existing instances (no constructor call). Factory Method creates objects by deferring to a creation method that subclasses override (constructor-based)." },
    { patternId: "abstract-factory", difference: "Prototype creates objects by cloning existing instances. Abstract Factory creates objects via factory methods. Prototype is instance-based; Factory is class-based." },
  ],
  cqrs: [
    { patternId: "event-sourcing", difference: "CQRS separates read and write models. Event Sourcing stores every state change as an event. They pair well but are independent." },
  ],
  "event-sourcing": [
    { patternId: "cqrs", difference: "Event Sourcing stores all state changes as events (append-only log). CQRS splits read/write paths. Event Sourcing is a storage strategy; CQRS is an architectural pattern." },
  ],
  "circuit-breaker": [
    { patternId: "retry", difference: "Retry keeps trying the same operation. Circuit Breaker stops trying after threshold failures (fail-fast) and periodically tests recovery." },
    { patternId: "bulkhead", difference: "Circuit Breaker stops cascading failures by opening the circuit. Bulkhead isolates failures by partitioning resources (thread pools, connection pools)." },
  ],
  bulkhead: [
    { patternId: "circuit-breaker", difference: "Bulkhead partitions resources to contain failures. Circuit Breaker detects failures and stops retrying. Bulkhead is preventive isolation; Circuit Breaker is reactive protection." },
  ],
  retry: [
    { patternId: "circuit-breaker", difference: "Retry keeps attempting despite failures (with backoff). Circuit Breaker stops attempts entirely after a failure threshold is reached." },
  ],
  "producer-consumer": [
    { patternId: "observer", difference: "Producer-Consumer distributes work items to one consumer via a buffered queue (async, pull-based). Observer broadcasts notifications to all subscribers synchronously (push-based, no buffer)." },
    { patternId: "thread-pool", difference: "Producer-Consumer decouples data production from consumption via a buffer. Thread Pool decouples task submission from execution via a work queue." },
  ],
  "react-pattern": [
    { patternId: "tool-use", difference: "ReAct interleaves reasoning (Thought) with actions in a loop. Tool Use is a simpler invoke-tool-and-return pattern without iterative reasoning." },
  ],
  "tool-use": [
    { patternId: "react-pattern", difference: "Tool Use is a single action→result cycle. ReAct is an iterative loop of think→act→observe until the goal is achieved." },
    { patternId: "strategy", difference: "Tool Use dynamically discovers and invokes external tools. Strategy selects from a fixed set of algorithms known at compile time." },
  ],
  "multi-agent-orchestration": [
    { patternId: "mediator", difference: "Multi-Agent Orchestration coordinates AI specialist agents with memory. Mediator coordinates generic objects — no agent intelligence, no shared memory." },
  ],
  "rate-limiter": [
    { patternId: "bulkhead", difference: "Rate Limiter controls the frequency of operations over time (temporal protection). Bulkhead partitions resources to isolate failures between consumers (spatial protection)." },
  ],
  "thread-pool": [
    { patternId: "producer-consumer", difference: "Thread Pool manages a fixed set of worker threads for task execution. Producer-Consumer is about buffered communication between producers and consumers." },
  ],
  repository: [
    { patternId: "dao", difference: "Repository operates at the domain level with domain-specific queries (findActiveUsersByRole). DAO operates at the database level with generic CRUD operations (insert, update, delete). Repository is a higher abstraction." },
    { patternId: "active-record", difference: "Repository separates persistence from domain objects (clean architecture). Active Record merges them — the domain object IS the database row (User.find, user.save). Repository is better for complex domains; Active Record for simple CRUD." },
  ],
  saga: [
    { patternId: "event-sourcing", difference: "Saga manages distributed transactions with compensating actions. Event Sourcing stores all state changes as immutable events for reconstruction." },
  ],
};

export async function seed(db: Database) {
  let updated = 0;

  for (const [slug, confusedWith] of Object.entries(CONFUSED_WITH)) {
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

    const content = row.content as Record<string, unknown>;

    // Always overwrite with the latest/most complete confusedWith data
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
    console.log(`  ✓ Updated confusedWith for "${slug}" (${confusedWith.length} entries)`);
  }

  console.log(`\n  Done: ${updated} patterns enriched with confusedWith.`);
}
