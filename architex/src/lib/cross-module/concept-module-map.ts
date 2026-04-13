// ─────────────────────────────────────────────────────────────
// Architex — Concept-to-Module Map (CROSS-009)
// Maps 40+ CS concepts to the modules where they appear.
// ─────────────────────────────────────────────────────────────

import type { ModuleType } from "@/stores/ui-store";

export interface ConceptModuleRef {
  module: ModuleType;
  path: string;
  description: string;
}

/**
 * 40+ concepts mapped to all modules where they are relevant.
 * Used by ConceptModuleLinks to render cross-reference navigation.
 */
export const CONCEPT_MODULE_MAP: Record<string, ConceptModuleRef[]> = {
  // ── Data Structures & Algorithms ────────────────────────────
  "b-tree": [
    { module: "data-structures", path: "/data-structures?concept=b-tree", description: "Interactive B-tree visualization with insert/delete/search" },
    { module: "database", path: "/database?concept=b-tree-index", description: "B-tree as a database indexing strategy" },
  ],
  "hash-table": [
    { module: "data-structures", path: "/data-structures?concept=hash-table", description: "Hash table operations and collision resolution" },
    { module: "distributed", path: "/distributed?concept=consistent-hashing", description: "Consistent hashing for distributed key-value stores" },
    { module: "database", path: "/database?concept=hash-index", description: "Hash indexes for exact-match queries" },
  ],
  "binary-search": [
    { module: "algorithms", path: "/algorithms?algo=binary-search", description: "Binary search algorithm visualization" },
    { module: "database", path: "/database?concept=sorted-index", description: "Sorted index enabling binary search on disk" },
  ],
  "sorting-algorithms": [
    { module: "algorithms", path: "/algorithms?category=sorting", description: "Comparison of sorting algorithms with animations" },
    { module: "system-design", path: "/system-design?concept=data-processing", description: "Sorting in distributed data processing pipelines" },
  ],
  "graph-algorithms": [
    { module: "algorithms", path: "/algorithms?category=graph", description: "BFS, DFS, Dijkstra, and more graph algorithms" },
    { module: "distributed", path: "/distributed?concept=graph-partitioning", description: "Graph partitioning in distributed systems" },
    { module: "networking", path: "/networking?concept=routing", description: "Routing algorithms in network protocols" },
  ],
  "linked-list": [
    { module: "data-structures", path: "/data-structures?concept=linked-list", description: "Singly and doubly linked list operations" },
    { module: "os", path: "/os?concept=memory-management", description: "Free list memory management using linked lists" },
  ],
  "heap": [
    { module: "data-structures", path: "/data-structures?concept=heap", description: "Min-heap and max-heap with heapify" },
    { module: "algorithms", path: "/algorithms?algo=heap-sort", description: "Heap sort algorithm" },
    { module: "os", path: "/os?concept=process-scheduling", description: "Priority queues in OS process scheduling" },
  ],
  "trie": [
    { module: "data-structures", path: "/data-structures?concept=trie", description: "Trie prefix tree for string operations" },
    { module: "algorithms", path: "/algorithms?category=string", description: "String matching and autocomplete algorithms" },
    { module: "networking", path: "/networking?concept=ip-routing", description: "Longest prefix matching in IP routing tables" },
  ],
  "bloom-filter": [
    { module: "data-structures", path: "/data-structures?concept=bloom-filter", description: "Probabilistic data structure for membership testing" },
    { module: "database", path: "/database?concept=bloom-filter-index", description: "Bloom filters in LSM-tree databases" },
    { module: "distributed", path: "/distributed?concept=bloom-filter-sync", description: "Bloom filters for efficient data synchronization" },
  ],
  "skip-list": [
    { module: "data-structures", path: "/data-structures?concept=skip-list", description: "Probabilistic sorted data structure" },
    { module: "database", path: "/database?concept=memtable", description: "Skip lists in LSM-tree memtables (e.g., Redis)" },
  ],
  "lru-cache": [
    { module: "data-structures", path: "/data-structures?concept=lru-cache", description: "LRU cache implementation with hash map + doubly linked list" },
    { module: "system-design", path: "/system-design?concept=caching", description: "Caching layer design in system architecture" },
    { module: "os", path: "/os?concept=page-replacement", description: "LRU page replacement in virtual memory" },
  ],

  // ── Distributed Systems ─────────────────────────────────────
  "consistent-hashing": [
    { module: "distributed", path: "/distributed?concept=consistent-hashing", description: "Consistent hashing ring with virtual nodes" },
    { module: "system-design", path: "/system-design?concept=sharding", description: "Sharding strategy using consistent hashing" },
    { module: "database", path: "/database?concept=partitioning", description: "Database partitioning with consistent hashing" },
  ],
  "raft-consensus": [
    { module: "distributed", path: "/distributed?concept=raft", description: "Raft consensus: leader election, log replication" },
    { module: "system-design", path: "/system-design?concept=replication", description: "Replication strategy using Raft consensus" },
  ],
  "paxos": [
    { module: "distributed", path: "/distributed?concept=paxos", description: "Paxos consensus algorithm" },
    { module: "system-design", path: "/system-design?concept=distributed-consensus", description: "Distributed consensus in system design" },
  ],
  "crdt": [
    { module: "distributed", path: "/distributed?concept=crdt", description: "Conflict-free replicated data types" },
    { module: "system-design", path: "/system-design?concept=eventual-consistency", description: "CRDTs for eventually consistent systems" },
  ],
  "vector-clock": [
    { module: "distributed", path: "/distributed?concept=vector-clock", description: "Vector clocks for causal ordering" },
    { module: "system-design", path: "/system-design?concept=ordering", description: "Event ordering in distributed systems" },
  ],
  "cap-theorem": [
    { module: "distributed", path: "/distributed?concept=cap-theorem", description: "CAP theorem trade-offs" },
    { module: "database", path: "/database?concept=consistency-models", description: "Database consistency models and CAP" },
    { module: "system-design", path: "/system-design?concept=trade-offs", description: "CAP trade-off analysis in system design" },
  ],
  "gossip-protocol": [
    { module: "distributed", path: "/distributed?concept=gossip", description: "Gossip protocol for membership and failure detection" },
    { module: "networking", path: "/networking?concept=multicast", description: "Gossip-based multicast protocols" },
  ],

  // ── Database ────────────────────────────────────────────────
  "normalization": [
    { module: "database", path: "/database?concept=normalization", description: "Database normalization: 1NF through BCNF" },
    { module: "system-design", path: "/system-design?concept=data-model", description: "Normalization vs. denormalization trade-offs" },
  ],
  "sharding": [
    { module: "database", path: "/database?concept=sharding", description: "Horizontal partitioning strategies" },
    { module: "distributed", path: "/distributed?concept=data-partitioning", description: "Data partitioning in distributed systems" },
    { module: "system-design", path: "/system-design?concept=scalability", description: "Sharding for horizontal scalability" },
  ],
  "replication": [
    { module: "database", path: "/database?concept=replication", description: "Master-slave and multi-master replication" },
    { module: "distributed", path: "/distributed?concept=replication", description: "State machine replication in distributed systems" },
  ],
  "acid": [
    { module: "database", path: "/database?concept=acid", description: "ACID properties in transaction processing" },
    { module: "distributed", path: "/distributed?concept=distributed-transactions", description: "Distributed ACID with 2PC and 3PC" },
  ],
  "indexing": [
    { module: "database", path: "/database?concept=indexing", description: "B-tree, hash, and composite index strategies" },
    { module: "data-structures", path: "/data-structures?concept=b-tree", description: "B-tree data structure used for indexes" },
  ],
  "query-optimization": [
    { module: "database", path: "/database?concept=query-plan", description: "Query execution plans and optimization" },
    { module: "algorithms", path: "/algorithms?concept=dynamic-programming", description: "DP-based query plan optimization" },
  ],

  // ── Networking & Protocols ──────────────────────────────────
  "tcp": [
    { module: "networking", path: "/networking?concept=tcp", description: "TCP handshake, flow control, congestion control" },
    { module: "system-design", path: "/system-design?concept=transport", description: "TCP vs. UDP in system architecture" },
  ],
  "dns": [
    { module: "networking", path: "/networking?concept=dns", description: "DNS resolution, caching, and record types" },
    { module: "system-design", path: "/system-design?concept=load-balancing", description: "DNS-based load balancing" },
  ],
  "http": [
    { module: "networking", path: "/networking?concept=http", description: "HTTP/1.1, HTTP/2, HTTP/3 protocol evolution" },
    { module: "system-design", path: "/system-design?concept=api-design", description: "RESTful API design over HTTP" },
  ],
  "tls": [
    { module: "networking", path: "/networking?concept=tls", description: "TLS handshake and certificate chain" },
    { module: "security", path: "/security?concept=encryption-in-transit", description: "Encryption in transit with TLS" },
  ],
  "websocket": [
    { module: "networking", path: "/networking?concept=websocket", description: "WebSocket protocol for real-time communication" },
    { module: "system-design", path: "/system-design?concept=real-time", description: "Real-time architecture with WebSockets" },
  ],

  // ── Security ────────────────────────────────────────────────
  "jwt": [
    { module: "security", path: "/security?concept=jwt", description: "JWT token structure, signing, and validation" },
    { module: "system-design", path: "/system-design?concept=authentication", description: "JWT-based authentication in microservices" },
  ],
  "oauth2": [
    { module: "security", path: "/security?concept=oauth2", description: "OAuth 2.0 flows: authorization code, PKCE, client credentials" },
    { module: "system-design", path: "/system-design?concept=auth-service", description: "Auth service design with OAuth2" },
  ],
  "rate-limiting": [
    { module: "security", path: "/security?concept=rate-limiting", description: "Rate limiting algorithms: token bucket, sliding window" },
    { module: "system-design", path: "/system-design?concept=api-gateway", description: "Rate limiting at the API gateway layer" },
    { module: "algorithms", path: "/algorithms?concept=sliding-window", description: "Sliding window algorithm" },
  ],

  // ── OS Concepts ─────────────────────────────────────────────
  "process-scheduling": [
    { module: "os", path: "/os?concept=scheduling", description: "CPU scheduling: FCFS, SJF, Round Robin, MLFQ" },
    { module: "system-design", path: "/system-design?concept=task-scheduling", description: "Task scheduling in distributed job systems" },
  ],
  "virtual-memory": [
    { module: "os", path: "/os?concept=virtual-memory", description: "Page tables, TLB, and page replacement" },
    { module: "data-structures", path: "/data-structures?concept=page-table", description: "Multi-level page table data structure" },
  ],
  "deadlock": [
    { module: "os", path: "/os?concept=deadlock", description: "Deadlock detection, prevention, and avoidance" },
    { module: "concurrency", path: "/concurrency?concept=deadlock", description: "Deadlock in concurrent programming" },
    { module: "database", path: "/database?concept=lock-management", description: "Deadlock detection in database transactions" },
  ],

  // ── Concurrency ─────────────────────────────────────────────
  "thread-pool": [
    { module: "lld", path: "?lld=pattern:thread-pool", description: "Thread pool UML + code" },
    { module: "concurrency", path: "/concurrency?concept=thread-pool", description: "Thread pool patterns and sizing" },
    { module: "system-design", path: "/system-design?concept=connection-pooling", description: "Connection pooling in system design" },
    { module: "os", path: "/os?concept=thread-management", description: "OS thread management" },
  ],
  "mutex-semaphore": [
    { module: "concurrency", path: "/concurrency?concept=synchronization", description: "Mutexes, semaphores, and condition variables" },
    { module: "os", path: "/os?concept=synchronization", description: "OS-level synchronization primitives" },
  ],

  // ── Design Patterns (LLD) ──────────────────────────────────
  "observer-pattern": [
    { module: "lld", path: "?lld=pattern:observer", description: "Observer pattern UML + code" },
    { module: "system-design", path: "/system-design?concept=event-driven", description: "Event-driven architecture" },
  ],
  "strategy-pattern": [
    { module: "lld", path: "?lld=pattern:strategy", description: "Strategy pattern UML + code" },
    { module: "algorithms", path: "/algorithms?concept=algorithm-selection", description: "Algorithm selection at runtime" },
  ],
  "singleton-pattern": [
    { module: "lld", path: "?lld=pattern:singleton", description: "Singleton pattern UML + code" },
    { module: "system-design", path: "/system-design?concept=single-point-of-access", description: "Single point of access in microservices" },
  ],
  "repository-pattern": [
    { module: "lld", path: "?lld=pattern:repository", description: "Repository pattern UML + code" },
    { module: "database", path: "/database?concept=data-access-layer", description: "Data access layer pattern" },
  ],
  "circuit-breaker": [
    { module: "lld", path: "?lld=pattern:circuit-breaker", description: "Circuit breaker pattern implementation" },
    { module: "system-design", path: "/system-design?concept=fault-tolerance", description: "Resilience in distributed systems" },
    { module: "distributed", path: "/distributed?concept=failure-handling", description: "Failure handling in distributed systems" },
  ],
  "cqrs": [
    { module: "lld", path: "?lld=pattern:cqrs", description: "Command Query Responsibility Segregation" },
    { module: "system-design", path: "/system-design?concept=read-write-separation", description: "Read/write separation" },
    { module: "database", path: "/database?concept=read-replicas", description: "Read replicas for query offloading" },
  ],
  "solid-principles": [
    { module: "lld", path: "?lld=solid", description: "SOLID principles with before/after examples" },
    { module: "system-design", path: "/system-design?concept=clean-architecture", description: "Clean architecture foundations" },
  ],
  "state-machine": [
    { module: "lld", path: "?lld=state-machine:order-lifecycle", description: "State machine visualization + simulation" },
    { module: "distributed", path: "/distributed?concept=consensus", description: "Consensus protocol states" },
  ],
  "producer-consumer": [
    { module: "lld", path: "?lld=pattern:producer-consumer", description: "Producer-consumer UML + code" },
    { module: "concurrency", path: "/concurrency?concept=producer-consumer", description: "Thread synchronization pattern" },
  ],
  "saga-pattern": [
    { module: "lld", path: "?lld=pattern:saga", description: "Saga pattern for distributed transactions" },
    { module: "distributed", path: "/distributed?concept=distributed-transactions", description: "Sagas vs. 2PC for distributed transactions" },
  ],
  "event-sourcing": [
    { module: "lld", path: "?lld=pattern:event-sourcing", description: "Event sourcing pattern UML + code" },
    { module: "system-design", path: "/system-design?concept=event-store", description: "Event store in event-driven architecture" },
    { module: "database", path: "/database?concept=append-only-log", description: "Append-only log storage pattern" },
  ],
  "decorator-pattern": [
    { module: "lld", path: "?lld=pattern:decorator", description: "Decorator pattern UML + code" },
    { module: "system-design", path: "/system-design?concept=middleware", description: "Middleware chains in system architecture" },
  ],
  "factory-pattern": [
    { module: "lld", path: "?lld=pattern:factory-method", description: "Factory method pattern UML + code" },
    { module: "system-design", path: "/system-design?concept=service-creation", description: "Service instantiation patterns" },
  ],

  // ── ML/AI Concepts ──────────────────────────────────────────
  "feature-store": [
    { module: "ml-design", path: "/ml-design?concept=feature-store", description: "Feature store design for ML pipelines" },
    { module: "system-design", path: "/system-design?concept=data-pipeline", description: "Data pipelines feeding ML feature stores" },
  ],
  "model-serving": [
    { module: "ml-design", path: "/ml-design?concept=model-serving", description: "Model serving: batch vs. real-time inference" },
    { module: "system-design", path: "/system-design?concept=inference-service", description: "Inference service architecture" },
  ],
};

// ── Lookup helpers ────────────────────────────────────────────

/** Get all module references for a concept. Returns empty array if unknown. */
export function getConceptModules(conceptId: string): ConceptModuleRef[] {
  return CONCEPT_MODULE_MAP[conceptId] ?? [];
}

/** Get all concept IDs that appear in a given module. */
export function getConceptsForModule(module: ModuleType): string[] {
  return Object.entries(CONCEPT_MODULE_MAP)
    .filter(([_, refs]) => refs.some((r) => r.module === module))
    .map(([id]) => id);
}

/** Check if a concept has cross-module references. */
export function hasConceptCrossRefs(conceptId: string): boolean {
  return (CONCEPT_MODULE_MAP[conceptId]?.length ?? 0) > 1;
}

/** Get all unique concept IDs in the map. */
export function getAllConceptIds(): string[] {
  return Object.keys(CONCEPT_MODULE_MAP);
}
