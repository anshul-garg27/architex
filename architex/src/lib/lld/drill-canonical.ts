/**
 * LLD-021: Canonical reference solutions for drill problems.
 *
 * Phase 4 seeds the top-3 most-drilled problems as a proof-of-concept.
 * Unseeded problems fall through to `null`; the post-drill UI degrades
 * gracefully (hides the canonical-compare panel).
 */

export interface CanonicalClass {
  name: string;
  stereotype?: "interface" | "abstract" | "enum";
  attributes?: string[];
  methods?: string[];
  /** One-line reason this class exists in the canonical solution. */
  justification: string;
}

export interface CanonicalRelationship {
  from: string;
  to: string;
  /** UML relationship kind. */
  kind:
    | "inherits"
    | "implements"
    | "composes"
    | "aggregates"
    | "associates"
    | "depends";
  label?: string;
}

export interface CanonicalSolution {
  problemId: string;
  title: string;
  summary: string;
  classes: CanonicalClass[];
  relationships: CanonicalRelationship[];
  patterns: string[]; // e.g. ["strategy", "state"]
  keyTradeoffs: string[];
  antiPatternsToAvoid: string[];
}

const SOLUTIONS: Record<string, CanonicalSolution> = {
  "parking-lot": {
    problemId: "parking-lot",
    title: "Parking Lot",
    summary:
      "Variable-size lot with tiered spot types, vehicle-to-spot matching, and per-session billing.",
    classes: [
      {
        name: "ParkingLot",
        methods: ["assignSpot(v)", "releaseSpot(t)", "availableSpots()"],
        justification: "Facade + source of truth for capacity.",
      },
      {
        name: "ParkingSpot",
        stereotype: "abstract",
        attributes: ["id", "level", "isAvailable"],
        justification: "Polymorphism base for spot types.",
      },
      {
        name: "Vehicle",
        stereotype: "abstract",
        methods: ["size()"],
        justification: "Drives spot-matching logic.",
      },
      {
        name: "Ticket",
        attributes: ["issuedAt", "spotId", "vehicleId"],
        justification: "Session record for billing + release.",
      },
      {
        name: "PricingStrategy",
        stereotype: "interface",
        methods: ["price(durationMin)"],
        justification: "Pluggable pricing (flat / tiered / surge).",
      },
    ],
    relationships: [
      {
        from: "ParkingLot",
        to: "ParkingSpot",
        kind: "composes",
        label: "owns",
      },
      { from: "ParkingLot", to: "Ticket", kind: "composes", label: "issues" },
      {
        from: "CarSpot",
        to: "ParkingSpot",
        kind: "inherits",
      },
      {
        from: "ParkingLot",
        to: "PricingStrategy",
        kind: "depends",
        label: "uses",
      },
    ],
    patterns: ["strategy", "factory-method"],
    keyTradeoffs: [
      "Polymorphism over if-else makes spot types extensible at the cost of boilerplate.",
      "Strategy for pricing adds a type at the cost of dependency injection overhead.",
      "Composite-style spot hierarchy simplifies traversal but inflates class count.",
    ],
    antiPatternsToAvoid: [
      "Switch statements over vehicle type — that's what polymorphism is for.",
      "Singleton ParkingLot without dependency injection (makes tests painful).",
    ],
  },

  "elevator-system": {
    problemId: "elevator-system",
    title: "Elevator System",
    summary:
      "Multi-elevator building with directional scheduling, floor requests, and idle/moving/emergency states.",
    classes: [
      {
        name: "ElevatorController",
        justification: "Scheduler + request dispatcher.",
      },
      {
        name: "Elevator",
        methods: ["moveTo(floor)", "openDoor()"],
        justification: "Physical car with state machine.",
      },
      {
        name: "ElevatorState",
        stereotype: "interface",
        methods: ["handleRequest(r)", "handleArrival(f)"],
        justification: "State pattern — idle/moving-up/moving-down/emergency.",
      },
      {
        name: "Request",
        attributes: ["floor", "direction", "timestamp"],
        justification: "Request object for queueing.",
      },
      {
        name: "SchedulingStrategy",
        stereotype: "interface",
        methods: ["pickElevator(req, cars)"],
        justification: "Pluggable scheduler (nearest / scan / LOOK).",
      },
    ],
    relationships: [
      {
        from: "ElevatorController",
        to: "Elevator",
        kind: "composes",
        label: "manages",
      },
      { from: "Elevator", to: "ElevatorState", kind: "depends", label: "has" },
      {
        from: "ElevatorController",
        to: "SchedulingStrategy",
        kind: "depends",
      },
    ],
    patterns: ["state", "strategy", "command"],
    keyTradeoffs: [
      "State pattern per-car avoids sprawling if-else but adds classes.",
      "Centralized scheduler simplifies global optimization; decentralized helps fault tolerance.",
      "Command objects enable request replay/logging at the cost of allocation.",
    ],
    antiPatternsToAvoid: [
      "Boolean flags for elevator state (isMoving, isGoingUp, isEmergency...) → use State.",
      "Scheduler as God class — extract the picking policy.",
    ],
  },

  "chess-game": {
    problemId: "chess-game",
    title: "Chess Game",
    summary:
      "Two-player turn-based game with piece polymorphism, move validation, and check/checkmate detection.",
    classes: [
      { name: "Game", justification: "Turn orchestrator." },
      {
        name: "Board",
        methods: ["getPiece(pos)", "applyMove(m)"],
        justification: "8x8 grid abstraction.",
      },
      {
        name: "Piece",
        stereotype: "abstract",
        methods: ["legalMoves(board)"],
        justification: "Polymorphism over 6 piece types.",
      },
      {
        name: "Move",
        attributes: ["from", "to", "captured?"],
        justification: "Value object for history + undo.",
      },
      {
        name: "MoveValidator",
        justification: "Pulls check/pin/castling rules out of Piece.",
      },
    ],
    relationships: [
      { from: "Game", to: "Board", kind: "composes" },
      { from: "Board", to: "Piece", kind: "composes" },
      { from: "Pawn", to: "Piece", kind: "inherits" },
      { from: "Game", to: "MoveValidator", kind: "depends" },
    ],
    patterns: ["command", "strategy", "memento"],
    keyTradeoffs: [
      "One class per piece = clear; one table of move-vectors = compact.",
      "Command Move enables undo/replay but bloats memory for long games.",
      "Validator separation improves testability at the cost of an extra hop.",
    ],
    antiPatternsToAvoid: [
      "Piece class with isKing/isQueen booleans.",
      "Move validation inside the Game God class.",
    ],
  },
};

export const CANONICAL_PROBLEM_IDS = Object.keys(SOLUTIONS);

export function getCanonicalFor(problemId: string): CanonicalSolution | null {
  return SOLUTIONS[problemId] ?? null;
}

export function hasCanonicalFor(problemId: string): boolean {
  return problemId in SOLUTIONS;
}
