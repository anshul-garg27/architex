/**
 * Script to enrich patterns.ts with missing confusedWith data.
 * Run: npx tsx scripts/enrich-patterns.ts
 *
 * This adds confusedWith to patterns that are missing it,
 * using curated data for interview-critical patterns.
 */

import fs from "fs";
import path from "path";

const PATTERNS_FILE = path.join(
  __dirname,
  "../src/lib/lld/patterns.ts",
);

// Curated confusedWith data for patterns that need it
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
    { patternId: "chain-of-responsibility", difference: "Saga has ordered steps with rollback. Chain of Responsibility passes a request through handlers that can stop the chain — no rollback." },
  ],
  "circuit-breaker": [
    { patternId: "retry", difference: "Retry keeps trying the same operation. Circuit Breaker stops trying after threshold failures (fail-fast) and periodically tests recovery." },
    { patternId: "bulkhead", difference: "Circuit Breaker stops cascading failures by opening the circuit. Bulkhead isolates failures by partitioning resources (thread pools, connection pools)." },
  ],
  retry: [
    { patternId: "circuit-breaker", difference: "Retry keeps attempting despite failures (with backoff). Circuit Breaker stops attempts entirely after a failure threshold is reached." },
  ],
  "rate-limiter": [
    { patternId: "bulkhead", difference: "Rate Limiter controls request throughput (requests/second). Bulkhead controls resource allocation (concurrent connections per partition)." },
    { patternId: "circuit-breaker", difference: "Rate Limiter prevents overload proactively. Circuit Breaker reacts to failures that already happened." },
  ],
  "thread-pool": [
    { patternId: "producer-consumer", difference: "Thread Pool manages a fixed set of worker threads. Producer-Consumer is about buffered communication between producers and consumers — it USES a thread pool internally." },
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
    { patternId: "decorator", difference: "Chain passes a request until ONE handler processes it. Decorator wraps ALL layers — every decorator runs. Chain can stop; Decorator always propagates." },
  ],
  memento: [
    { patternId: "command", difference: "Memento captures full state snapshots for undo. Command captures operations (with undo logic) — lighter weight but requires implementing reverse for each command." },
  ],
  visitor: [
    { patternId: "strategy", difference: "Visitor adds new operations to existing class hierarchies (double dispatch). Strategy lets you swap algorithms within one class. Visitor traverses; Strategy delegates." },
  ],
  prototype: [
    { patternId: "abstract-factory", difference: "Prototype creates objects by cloning existing instances. Abstract Factory creates objects via factory methods. Prototype is instance-based; Factory is class-based." },
  ],
  cqrs: [
    { patternId: "event-sourcing", difference: "CQRS separates read and write models. Event Sourcing stores every state change as an event. They pair well but are independent — you can use CQRS without Event Sourcing." },
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

function main() {
  let content = fs.readFileSync(PATTERNS_FILE, "utf8");
  let added = 0;

  for (const [patternId, confusedWith] of Object.entries(CONFUSED_WITH)) {
    // Find the pattern's relatedPatterns field and add confusedWith before it
    // Pattern format: relatedPatterns: [
    const searchStr = `id: "${patternId}",`;
    const patternIdx = content.indexOf(searchStr);
    if (patternIdx === -1) {
      console.warn(`  Pattern "${patternId}" not found in file`);
      continue;
    }

    // Check if it already has confusedWith
    const nextPatternIdx = content.indexOf('\nconst ', patternIdx + 10);
    const block = content.slice(patternIdx, nextPatternIdx > 0 ? nextPatternIdx : patternIdx + 8000);
    if (block.includes("confusedWith:")) {
      console.log(`  "${patternId}" already has confusedWith — skipping`);
      continue;
    }

    // Find commonMistakes: [ ... ], in this pattern's block, then insert after its closing ],
    const commonMistakesIdx = content.indexOf("commonMistakes:", patternIdx);
    if (commonMistakesIdx === -1 || (nextPatternIdx > 0 && commonMistakesIdx > nextPatternIdx)) {
      console.warn(`  "${patternId}" has no commonMistakes field — skipping`);
      continue;
    }

    // Find the closing ], of commonMistakes array
    const closingBracket = content.indexOf("],", commonMistakesIdx);
    if (closingBracket === -1) {
      console.warn(`  "${patternId}" commonMistakes closing bracket not found — skipping`);
      continue;
    }
    const insertionPoint = closingBracket + 2; // after ],

    // Insert confusedWith after commonMistakes
    const confusedStr = `\n  confusedWith: [\n${confusedWith.map(c => `    { patternId: "${c.patternId}", difference: "${c.difference.replace(/"/g, '\\"')}" },`).join("\n")}\n  ],`;

    content = content.slice(0, insertionPoint) + confusedStr + content.slice(insertionPoint);
    added++;
    console.log(`  ✓ Added confusedWith to "${patternId}" (${confusedWith.length} entries)`);
  }

  fs.writeFileSync(PATTERNS_FILE, content, "utf8");
  console.log(`\nDone: ${added} patterns enriched.`);
}

main();
