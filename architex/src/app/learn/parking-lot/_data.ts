// ─────────────────────────────────────────────────────────────────────────────
//  Constants & data tables for the Parking Lot LLD lesson
// ─────────────────────────────────────────────────────────────────────────────

import type { ComponentType } from "react";
import {
  Car,
  Bike,
  Truck,
  Zap,
  ParkingSquare,
  Accessibility,
} from "lucide-react";

export interface SectionMeta {
  id: string;
  num: number;
  title: string;
  act: 1 | 2 | 3 | 4;
}

export const SECTIONS: ReadonlyArray<SectionMeta> = [
  { id: "hook", num: 1, title: "Hook — the world", act: 1 },
  { id: "requirements", num: 2, title: "Requirements", act: 1 },
  { id: "entities", num: 3, title: "Entities", act: 2 },
  { id: "hierarchies", num: 4, title: "Hierarchies", act: 2 },
  { id: "relationships", num: 5, title: "Relationships", act: 2 },
  { id: "sequence", num: 6, title: "Behavior · Sequence", act: 2 },
  { id: "concurrency", num: 7, title: "Concurrency primitives", act: 2 },
  { id: "state", num: 8, title: "State Machine", act: 2 },
  { id: "patterns", num: 9, title: "Patterns", act: 3 },
  { id: "pricing", num: 10, title: "Pricing · the Money seam", act: 3 },
  { id: "anti-patterns", num: 11, title: "Anti-Patterns", act: 3 },
  { id: "edge-cases", num: 12, title: "Edge Cases", act: 3 },
  { id: "scaling", num: 13, title: "Scaling", act: 4 },
  { id: "transfer", num: 14, title: "Transfer Challenge", act: 4 },
];

export const ACTS: ReadonlyArray<{ num: 1 | 2 | 3 | 4; title: string; tag: string }> = [
  { num: 1, title: "Setup the brief", tag: "ACT I" },
  { num: 2, title: "Build the system", tag: "ACT II" },
  { num: 3, title: "Stress & judge", tag: "ACT III" },
  { num: 4, title: "Scale & transfer", tag: "ACT IV" },
];

// ─── Glossary terms (hover/focus tooltips throughout the lesson) ────────────

export const GLOSSARY: Readonly<Record<string, string>> = {
  "p99 latency":
    "p99 latency = the slowest 1% of requests. If p99 is under 100ms, only 1 in 100 requests takes longer than that. The hard tail your users notice.",
  ACID:
    "Atomicity, Consistency, Isolation, Durability. Database guarantees that money operations either fully happen or not at all — no partial charges, no lost rows.",
  "race condition":
    "Two threads/requests reach the same resource at the same instant; without coordination, one or both produce a wrong result. The classic 'two cars take the same spot' bug.",
  "soft-hold":
    "A temporary lock on a resource (a spot, a seat) that auto-releases after N minutes if not converted into a confirmed booking. Reservations rely on this.",
  "abstract class":
    "A class that defines shape but cannot be instantiated directly. Subclasses must implement its abstract methods. The compiler enforces this in TypeScript / Java / C#.",
  "private constructor":
    "A constructor only callable from inside the class itself. Outside code can't write `new Foo()` — instantiation goes through a static method like `getInstance()`. The Singleton pattern depends on this.",
  cardinality:
    "How many of one thing can connect to another in a relationship. `[1..*]` = one-or-many. `[0..1]` = zero-or-one. Encodes invariants the type system enforces.",
  UML:
    "Unified Modeling Language — a notation for diagramming object structures and behaviors. Class diagrams, sequence diagrams, state machines all come from UML.",
  GoF:
    "Gang of Four — Gamma, Helm, Johnson, Vlissides. Authors of the 1994 book Design Patterns; their 23 patterns are the ones every interview tests.",
  "FSRS-5":
    "Free Spaced Repetition Scheduler v5 — an open-source spaced-repetition algorithm. Decides when to show a flashcard again so review cost is minimum and retention is maximum.",
  FSRS:
    "Free Spaced Repetition Scheduler — an algorithm that decides when to show a flashcard again to minimize review effort and maximize retention.",
  "optimistic lock":
    "Don't lock the row up-front; just attach a version number. On update, fail if the version changed. Cheap when conflicts are rare, costly to retry when they aren't.",
  "pessimistic lock":
    "Lock the row before reading. Other readers wait or skip. Use when conflict is the common case (e.g., one spot, many cars hammering it at peak).",
  idempotency:
    "Calling the same operation twice has the same effect as calling it once. Achieved via a client-supplied unique key the server stores; second call returns the first call's result.",
  "two-phase commit":
    "A distributed-transaction protocol: phase 1 prepare (everyone agrees to commit), phase 2 commit (everyone actually commits). Slow and brittle; mostly avoided in modern systems.",
  invariant:
    "A condition that must always hold true. 'A spot is occupied by at most one vehicle' is an invariant. Good designs make breaking them impossible at compile time.",
  "SKIP LOCKED":
    "Postgres clause: when SELECTing rows FOR UPDATE, if a row is locked by another transaction, just skip past it and return the next one. The textbook primitive for queue-style row contention.",
};

// ─── Entities (canonical 9, including the new Reservation) ──────────────────

export interface Entity {
  name: string;
  attrs: ReadonlyArray<string>;
  hint?: string;
}

export const ENTITIES: ReadonlyArray<Entity> = [
  { name: "Vehicle", attrs: ["licensePlate", "type"], hint: "the visitor" },
  { name: "ParkingSpot", attrs: ["spotId", "type", "state"], hint: "the slot" },
  { name: "Level", attrs: ["levelNumber", "capacity"], hint: "the floor" },
  { name: "ParkingLot", attrs: ["name", "totalCapacity"], hint: "the facility" },
  { name: "Ticket", attrs: ["ticketId", "entryTime", "vehicleId"], hint: "active occupancy" },
  { name: "Reservation", attrs: ["resId", "spotId", "windowStart", "windowEnd", "state"], hint: "future-tense claim" },
  { name: "Payment", attrs: ["amount", "status", "ticketId"], hint: "money" },
  { name: "Gate", attrs: ["gateId", "type", "isOpen"], hint: "the boundary" },
  { name: "DisplayBoard", attrs: ["levelId", "available"], hint: "the broadcast" },
];

// ─── Vehicle / Spot type hierarchies ────────────────────────────────────────

interface SubtypeRow {
  name: string;
  icon: ComponentType<{ className?: string }>;
  attr: string;
}

export const VEHICLE_TYPES: ReadonlyArray<SubtypeRow> = [
  { name: "Car", icon: Car, attr: "numWheels: 4" },
  { name: "Bike", icon: Bike, attr: "numWheels: 2" },
  { name: "Truck", icon: Truck, attr: "cargoCapacity" },
  { name: "EV", icon: Zap, attr: "chargingPort" },
];

export const SPOT_TYPES: ReadonlyArray<SubtypeRow> = [
  { name: "CompactSpot", icon: ParkingSquare, attr: "size: small" },
  { name: "LargeSpot", icon: ParkingSquare, attr: "size: large" },
  { name: "HandicapSpot", icon: Accessibility, attr: "accessible" },
  { name: "EVChargingSpot", icon: Zap, attr: "charger: yes" },
];

// ─── Functional / Non-functional requirements ──────────────────────────────

export const FUNCTIONAL: ReadonlyArray<{ label: string; hint: string }> = [
  { label: "Park a vehicle", hint: "find slot · issue ticket · open gate" },
  { label: "Exit & pay", hint: "compute fare · settle · release slot" },
  { label: "Find available slot", hint: "by vehicle type · by level" },
  { label: "Issue ticket", hint: "tied to plate + entry time" },
  { label: "Reserve a slot", hint: "soft-hold for paid/VIP" },
  { label: "Track capacity", hint: "live counts per level" },
];

export const NON_FUNCTIONAL: ReadonlyArray<{ label: string; hint: string; term?: string }> = [
  { label: "10K+ concurrent users", hint: "no race-condition on slot allocation", term: "race condition" },
  { label: "p99 latency under 100ms", hint: "fast lookups under load", term: "p99 latency" },
  { label: "Fault tolerant", hint: "single gate failure ≠ lot failure" },
  { label: "Horizontally scalable", hint: "from 1 lot to 10K lots" },
  { label: "ACID payments", hint: "money is never half-charged", term: "ACID" },
  { label: "Real-time availability", hint: "displays sync within seconds" },
];

// ─── Patterns (with situational fit reasoning) ──────────────────────────────

export interface Pattern {
  name: string;
  what: string;
  why: string;
  oneLine: string;
}

export const PATTERNS: ReadonlyArray<Pattern> = [
  {
    name: "Singleton",
    what: "ParkingLotManager",
    why: "one shared registry of all spots — duplicate managers = corrupted state.",
    oneLine: "exactly one instance, globally accessible.",
  },
  {
    name: "Factory Method",
    what: "Vehicle.fromPlate(plate)",
    why: "the plate's prefix decides Car vs Truck vs EV — caller doesn't switch.",
    oneLine: "delegate object construction to subclass.",
  },
  {
    name: "State",
    what: "ParkingSpot.state",
    why: "spot lifecycle has guarded transitions — encode them, don't if-else them.",
    oneLine: "behavior changes with internal state, not external switches.",
  },
  {
    name: "Strategy",
    what: "PricingPolicy",
    why: "hourly / daily / monthly / event swap without touching Ticket.",
    oneLine: "interchangeable algorithms behind a stable interface.",
  },
  {
    name: "Observer",
    what: "DisplayBoard",
    why: "subscribers get notified when slot count changes — no polling.",
    oneLine: "one-to-many notification on state change.",
  },
];

// ─── Pattern-fit judge — 6 situations, pick the right pattern ───────────────

export interface PatternFitSituation {
  id: string;
  prompt: string;
  options: ReadonlyArray<{ label: string; correct: boolean; rationale: string }>;
}

export const PATTERN_FIT: ReadonlyArray<PatternFitSituation> = [
  {
    id: "pricing-tiers",
    prompt:
      "Pricing changes by city, hour, and event (concert, sports). The PricingPolicy must swap at runtime without touching Ticket. Which pattern?",
    options: [
      { label: "Strategy", correct: true, rationale: "Interchangeable algorithms behind one fareFor() interface — the textbook fit." },
      { label: "Decorator", correct: false, rationale: "Decorator wraps to add behavior; here we replace the algorithm wholesale, not augment it." },
      { label: "Template Method", correct: false, rationale: "Template method fixes an algorithm skeleton with hook overrides — too rigid for unrelated pricing models." },
    ],
  },
  {
    id: "spot-state",
    prompt:
      "ParkingSpot has VACANT → OCCUPIED → MAINTENANCE transitions, each with guards (you can't go MAINTENANCE → OCCUPIED without going through VACANT). Which pattern?",
    options: [
      { label: "State", correct: true, rationale: "Encodes guarded transitions in state objects — invalid moves are rejected by type, not by `if`s." },
      { label: "Observer", correct: false, rationale: "Observer is for broadcasting changes; it doesn't model the transition rules themselves." },
      { label: "Command", correct: false, rationale: "Command encapsulates an action as an object — useful for undo/redo, not for state machines." },
    ],
  },
  {
    id: "shared-registry",
    prompt:
      "Every gate, display, and admin tool needs the SAME registry of all spots. There must be exactly one ParkingLotManager. Which pattern?",
    options: [
      { label: "Singleton", correct: true, rationale: "Single instance + global access. Use sparingly, but this is its canonical fit." },
      { label: "Factory", correct: false, rationale: "Factory creates objects; doesn't enforce one-instance-only." },
      { label: "Facade", correct: false, rationale: "Facade simplifies a subsystem's interface; orthogonal to instance count." },
    ],
  },
  {
    id: "display-broadcast",
    prompt:
      "DisplayBoards must update within 2s when slot count changes. Boards subscribe; the lot doesn't poll. Which pattern?",
    options: [
      { label: "Observer", correct: true, rationale: "One-to-many notification on state change — exactly what board updates need." },
      { label: "Mediator", correct: false, rationale: "Mediator coordinates many-to-many comms; here it's strictly one source → many subscribers." },
      { label: "Pub-Sub", correct: false, rationale: "Pub-Sub is the distributed cousin of Observer (broker-mediated). For in-process, Observer is the cleaner fit." },
    ],
  },
  {
    id: "vehicle-construction",
    prompt:
      "License-plate prefix determines Car vs Truck vs EV at parse time. Caller shouldn't switch on prefix. Which pattern?",
    options: [
      { label: "Factory Method", correct: true, rationale: "Vehicle.fromPlate(plate) returns the right subtype — the choice is hidden behind a static factory." },
      { label: "Builder", correct: false, rationale: "Builder is for stepwise construction of complex objects with many optional fields. Overkill here." },
      { label: "Prototype", correct: false, rationale: "Prototype clones an existing instance. Here we're constructing fresh, not copying." },
    ],
  },
  {
    id: "lost-ticket-fee",
    prompt:
      "When a driver loses their ticket, charge a flat fee. Otherwise, use the regular Strategy. Same fareFor() call, different math at runtime. Which pattern?",
    options: [
      { label: "Strategy (with fallback policy)", correct: true, rationale: "LostTicketPolicy is just another PricingPolicy — same interface, different rule. The Strategy seam already absorbs this." },
      { label: "State", correct: false, rationale: "Lost-ticket isn't a Ticket state; it's a pricing scenario. Don't conflate billing logic with lifecycle." },
      { label: "Chain of Responsibility", correct: false, rationale: "Useful if multiple fee rules might cascade; here exactly one policy applies, picked at issuance." },
    ],
  },
];

// ─── Retrieval check cards (FSRS-5 grade scale) ─────────────────────────────

export interface RetrievalCard {
  id: string;
  afterSection: string;
  prompt: string;
  options: ReadonlyArray<{ label: string; correct: boolean }>;
  why: string;
}

export const RETRIEVAL_CARDS: ReadonlyArray<RetrievalCard> = [
  {
    id: "card-entities",
    afterSection: "entities",
    prompt: "Which of these is NOT in the canonical entity set for a parking lot?",
    options: [
      { label: "Reservation", correct: false },
      { label: "DisplayBoard", correct: false },
      { label: "User", correct: true },
      { label: "Ticket", correct: false },
    ],
    why: "User isn't here — the lot tracks license plates and money, not identities. Authentication lives in another bounded context.",
  },
  {
    id: "card-state",
    afterSection: "state",
    prompt: "From OCCUPIED, the spot CANNOT directly transition to which state?",
    options: [
      { label: "VACANT", correct: false },
      { label: "MAINTENANCE", correct: false },
      { label: "RESERVED", correct: true },
      { label: "either VACANT or MAINTENANCE", correct: false },
    ],
    why: "OCCUPIED → VACANT (car exits) or OCCUPIED → MAINTENANCE (incident). RESERVED isn't even a valid state in this machine — reservations live on a separate Reservation entity.",
  },
  {
    id: "card-anti",
    afterSection: "anti-patterns",
    prompt: "A class with 30 methods covering parking, payments, display updates, and audit logging is which anti-pattern?",
    options: [
      { label: "Primitive Obsession", correct: false },
      { label: "God Class", correct: true },
      { label: "Pattern Cargo-Cult", correct: false },
      { label: "Feature Envy", correct: false },
    ],
    why: "God Class — single class doing everything. The fix is to extract responsibilities into separate cohesive classes.",
  },
];

// ─── Anti-patterns ──────────────────────────────────────────────────────────

export interface AntiPattern {
  id: string;
  name: string;
  smell: string;
  before: ReadonlyArray<string>;
  after: ReadonlyArray<string>;
  fix: string;
}

export const ANTI_PATTERNS: ReadonlyArray<AntiPattern> = [
  {
    id: "god",
    name: "God Class",
    smell: "single class doing everything. Untestable. Unmaintainable.",
    before: [
      "class ParkingLot {",
      "  parkVehicle() { /* ... */ }",
      "  exitVehicle() { /* ... */ }",
      "  computeFare() { /* ... */ }",
      "  notifyDisplay() { /* ... */ }",
      "  validatePayment() { /* ... */ }",
      "  // 30+ more methods",
      "}",
    ],
    after: [
      "class ParkingLot { /* coordinator */ }",
      "class TicketService { /* ... */ }",
      "class PaymentService { /* ... */ }",
      "class PricingPolicy { /* ... */ }",
      "class DisplayObserver { /* ... */ }",
    ],
    fix: "Each responsibility gets its own class. ParkingLot becomes a thin coordinator.",
  },
  {
    id: "primitive",
    name: "Primitive Obsession",
    smell: "string types instead of enums or hierarchy. Type-unsafe.",
    before: [
      "class ParkingSpot {",
      "  spotType: string;       // 'compact' | 'large' | ?",
      "  vehicleType: string;    // 'car' | 'truck' | ?",
      "}",
    ],
    after: [
      "type SpotType = 'compact' | 'large' | 'handicap' | 'ev';",
      "abstract class ParkingSpot {",
      "  abstract canFit(v: Vehicle): boolean;",
      "}",
      "class CompactSpot extends ParkingSpot { /* ... */ }",
    ],
    fix: "Discriminated unions or class hierarchies. The compiler now catches missing cases.",
  },
  {
    id: "cargo",
    name: "Pattern Cargo-Cult",
    smell: "patterns applied without justification. Adds complexity, not value.",
    before: [
      "// 3-class domain wrapped in 7 patterns:",
      "Factory + Singleton + Observer + Strategy",
      "+ Decorator + Visitor + Composite",
      "// ... for parking 4 types of vehicle.",
    ],
    after: [
      "// Use patterns when the design hurts.",
      "// Singleton  — manager state must be global.",
      "// State     — spot has guarded transitions.",
      "// Strategy  — pricing varies independently.",
      "// That's it. Three. Justified.",
    ],
    fix: "Patterns relieve specific friction. If the friction isn't there, the pattern is overhead.",
  },
];

// ─── Edge cases ─────────────────────────────────────────────────────────────

export interface EdgeCase {
  id: string;
  title: string;
  symptom: string;
  response: string;
}

export const EDGE_CASES: ReadonlyArray<EdgeCase> = [
  { id: "lost-ticket", title: "Lost ticket", symptom: "Driver loses paper/digital ticket before exit. Cannot prove entry time.", response: "Fall back to plate-lookup against entry log. Charge a flat lost-ticket fee (caps abuse)." },
  { id: "payment-timeout", title: "Payment timeout", symptom: "Card processor doesn't respond within 3 seconds.", response: "Soft-hold spot for 3 minutes, retry with the same idempotency key, then release if still failed." },
  { id: "concurrent-entry", title: "Concurrent entry race", symptom: "Two cars hit two gates targeting the last spot at the same instant.", response: "Atomic SELECT … FOR UPDATE SKIP LOCKED → UPDATE. Loser retries against the next available." },
  { id: "full-lot", title: "Full lot", symptom: "All spots are occupied. Driver waiting at gate.", response: "Queue up to N waiting tickets, broadcast ETA from soonest-exit. Past N: deny gracefully." },
  { id: "spot-held", title: "Spot held during pay", symptom: "Driver reserves spot, walks to payment kiosk, doesn't return.", response: "Soft-hold 5 minutes from gate-open. Auto-release on timeout, refund any pre-charge." },
  { id: "multi-vehicle", title: "Multi-vehicle ticket attempt", symptom: "One ticket scanned across multiple vehicles trying to enter on different gates.", response: "Ticket has unique vehicle binding. Reject second use; alert security if recurring." },
];

// ─── Transfer challenges ────────────────────────────────────────────────────

export interface TransferChallenge {
  name: string;
  domain: string;
  patterns: ReadonlyArray<string>;
}

export const TRANSFERS: ReadonlyArray<TransferChallenge> = [
  { name: "Hotel Valet", domain: "design how a luxury hotel manages valet-parked cars", patterns: ["Strategy for tipping", "State for vehicle status", "Singleton for ValetManager"] },
  { name: "Library Checkout", domain: "design a library's book checkout + reservation system", patterns: ["State for book status", "Strategy for late-fee policy", "Observer for hold-list updates"] },
  { name: "Stadium Concession", domain: "design food-stand queueing for a 60K-seat stadium", patterns: ["Observer for queue updates", "Factory for stand types", "Strategy for pricing tier"] },
];

// ─── Scaling tiers ──────────────────────────────────────────────────────────

export interface ScalingTier {
  name: string;
  caption: string;
  description: string;
  components: ReadonlyArray<{ label: string; accent?: boolean; iconKey: string }>;
}

export const SCALING_TIERS: ReadonlyArray<ScalingTier> = [
  {
    name: "SOLO LOT",
    caption: "10s of cars/day",
    description: "single instance, in-memory state, one DB",
    components: [
      { label: "ParkingLot in-memory", accent: true, iconKey: "Server" },
      { label: "PostgreSQL local", iconKey: "Database" },
    ],
  },
  {
    name: "CHAIN",
    caption: "100K cars/day",
    description: "multi-lot, shared DB, REST APIs, primary/replica",
    components: [
      { label: "Load Balancer", iconKey: "Network" },
      { label: "App tier × 3", accent: true, iconKey: "Server" },
      { label: "Postgres primary", iconKey: "Database" },
      { label: "Postgres replicas", iconKey: "Database" },
    ],
  },
  {
    name: "ENTERPRISE",
    caption: "10M+ cars/day",
    description: "writes strict-per-lot · reads eventual-from-cache",
    components: [
      { label: "Edge gateways (multi-region)", iconKey: "Cloud" },
      { label: "Kafka event bus", accent: true, iconKey: "Network" },
      { label: "Per-lot Postgres shards", iconKey: "Database" },
      { label: "Global Redis read-cache", iconKey: "Database" },
    ],
  },
];
