// -----------------------------------------------------------------
// Architex -- LLD Problem Definitions (LLD-029, LLD-030)
// -----------------------------------------------------------------
//
// 33 low-level design interview problems. Each includes a
// description, difficulty level, functional requirements, starter
// UML classes, relationships, and progressive hints.
// -----------------------------------------------------------------

import type { UMLClass, UMLRelationship } from "./types";
import { PROBLEM_SOLUTIONS } from "./problem-solutions";

// ── Types ────────────────────────────────────────────────────

export type LLDDifficulty = "easy" | "medium" | "hard";

export type LLDCategory =
  | "object-modeling"
  | "concurrency"
  | "game-design"
  | "booking-system"
  | "infrastructure"
  | "real-time";

export type InterviewFrequency = "high" | "medium" | "low";

export interface LLDProblem {
  id: string;
  name: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  description: string;
  requirements: string[];
  starterClasses: UMLClass[];
  starterRelationships: UMLRelationship[];
  hints: string[];
  // ── SEO / catalog fields (unified from lld-problems-data.ts) ──
  slug: string;
  seoDifficulty: LLDDifficulty;
  category: LLDCategory;
  keyPatterns: string[];
  interviewFrequency: InterviewFrequency;
  classCount: number;
  relatedProblems: string[];
  // ── Reference content (markdown) ──
  referenceSolution?: string;   // full working code solution
  designWalkthrough?: string;   // step-by-step design reasoning
  interviewScript?: string;     // simulated interview Q&A dialogue
  complexityAnalysis?: string;  // time/space complexity breakdown
}

// ── Helper ───────────────────────────────────────────────────

let _rid = 0;
function rid(): string {
  return `prob-rel-${++_rid}`;
}

// ═════════════════════════════════════════════════════════════
//  1. Parking Lot System
// ═════════════════════════════════════════════════════════════

const parkingLot: LLDProblem = {
  id: "prob-parking-lot",
  name: "Parking Lot System",
  difficulty: 2,
  description:
    "Uber manages 50,000 parking spots across 200 cities. Every second, hundreds of cars enter and exit. " +
    "Design a system that assigns spots in milliseconds and never double-books. " +
    "Handle multiple floors, different vehicle sizes, real-time availability tracking, and fee calculation. " +
    "This is the #1 most-asked LLD question at Amazon and Google.",
  requirements: [
    "Support multiple floors with configurable spot counts per floor",
    "Handle different vehicle types: motorcycle, car, bus",
    "Track available spots in real-time",
    "Calculate parking fees based on duration",
    "Generate tickets on entry and process payment on exit",
  ],
  slug: "parking-lot",
  seoDifficulty: "easy",
  category: "object-modeling",
  keyPatterns: ["Strategy", "Factory Method", "Singleton", "Observer"],
  interviewFrequency: "high",
  classCount: 12,
  relatedProblems: ["elevator-system", "hotel-booking", "library-management"],
  starterClasses: [
    {
      id: "pl-lot",
      name: "ParkingLot",
      stereotype: "class",
      attributes: [
        { id: "pl-lot-attr-0", name: "name", type: "string", visibility: "-" },
        { id: "pl-lot-attr-1", name: "floors", type: "ParkingFloor[]", visibility: "-" },
        { id: "pl-lot-attr-2", name: "entryGates", type: "EntryGate[]", visibility: "-" },
        { id: "pl-lot-attr-3", name: "exitGates", type: "ExitGate[]", visibility: "-" },
      ],
      methods: [
        { id: "pl-lot-meth-0", name: "getAvailableSpots", returnType: "number", params: [], visibility: "+" },
        { id: "pl-lot-meth-1", name: "parkVehicle", returnType: "Ticket", params: ["vehicle: Vehicle"], visibility: "+" },
        { id: "pl-lot-meth-2", name: "unparkVehicle", returnType: "Payment", params: ["ticket: Ticket"], visibility: "+" },
      ],
      x: 300,
      y: 50,
    },
    {
      id: "pl-floor",
      name: "ParkingFloor",
      stereotype: "class",
      attributes: [
        { id: "pl-floor-attr-0", name: "floorNumber", type: "number", visibility: "-" },
        { id: "pl-floor-attr-1", name: "spots", type: "ParkingSpot[]", visibility: "-" },
        { id: "pl-floor-attr-2", name: "displayBoard", type: "DisplayBoard", visibility: "-" },
      ],
      methods: [
        { id: "pl-floor-meth-0", name: "findAvailableSpot", returnType: "ParkingSpot", params: ["type: VehicleType"], visibility: "+" },
        { id: "pl-floor-meth-1", name: "updateDisplay", returnType: "void", params: [], visibility: "+" },
      ],
      x: 300,
      y: 260,
    },
    {
      id: "pl-spot",
      name: "ParkingSpot",
      stereotype: "class",
      attributes: [
        { id: "pl-spot-attr-0", name: "id", type: "string", visibility: "-" },
        { id: "pl-spot-attr-1", name: "type", type: "SpotType", visibility: "-" },
        { id: "pl-spot-attr-2", name: "isOccupied", type: "boolean", visibility: "-" },
      ],
      methods: [
        { id: "pl-spot-meth-0", name: "assignVehicle", returnType: "void", params: ["vehicle: Vehicle"], visibility: "+" },
        { id: "pl-spot-meth-1", name: "removeVehicle", returnType: "void", params: [], visibility: "+" },
      ],
      x: 300,
      y: 460,
    },
    {
      id: "pl-vehicle",
      name: "Vehicle",
      stereotype: "abstract",
      attributes: [
        { id: "pl-vehicle-attr-0", name: "licensePlate", type: "string", visibility: "-" },
        { id: "pl-vehicle-attr-1", name: "type", type: "VehicleType", visibility: "-" },
        { id: "pl-vehicle-attr-2", name: "color", type: "string", visibility: "-" },
      ],
      methods: [
        { id: "pl-vehicle-meth-0", name: "getType", returnType: "VehicleType", params: [], visibility: "+" },
        { id: "pl-vehicle-meth-1", name: "getLicensePlate", returnType: "string", params: [], visibility: "+" },
      ],
      x: 600,
      y: 260,
    },
    {
      id: "pl-ticket",
      name: "Ticket",
      stereotype: "class",
      attributes: [
        { id: "pl-ticket-attr-0", name: "ticketId", type: "string", visibility: "-" },
        { id: "pl-ticket-attr-1", name: "entryTime", type: "Date", visibility: "-" },
        { id: "pl-ticket-attr-2", name: "vehicle", type: "Vehicle", visibility: "-" },
        { id: "pl-ticket-attr-3", name: "assignedSpot", type: "ParkingSpot", visibility: "-" },
      ],
      methods: [
        { id: "pl-ticket-meth-0", name: "getParkedDuration", returnType: "number", params: [], visibility: "+" },
        { id: "pl-ticket-meth-1", name: "getEntryTime", returnType: "Date", params: [], visibility: "+" },
      ],
      x: 600,
      y: 50,
    },
    {
      id: "pl-payment",
      name: "PaymentProcessor",
      stereotype: "class",
      attributes: [
        { id: "pl-payment-attr-0", name: "paymentId", type: "string", visibility: "-" },
        { id: "pl-payment-attr-1", name: "amount", type: "number", visibility: "-" },
        { id: "pl-payment-attr-2", name: "method", type: "PaymentMethod", visibility: "-" },
      ],
      methods: [
        { id: "pl-payment-meth-0", name: "processPayment", returnType: "boolean", params: ["ticket: Ticket"], visibility: "+" },
        { id: "pl-payment-meth-1", name: "generateReceipt", returnType: "Receipt", params: [], visibility: "+" },
      ],
      x: 600,
      y: 460,
    },
    {
      id: "pl-entry",
      name: "EntryGate",
      stereotype: "class",
      attributes: [
        { id: "pl-entry-attr-0", name: "gateId", type: "string", visibility: "-" },
        { id: "pl-entry-attr-1", name: "floor", type: "ParkingFloor", visibility: "-" },
      ],
      methods: [
        { id: "pl-entry-meth-0", name: "issueTicket", returnType: "Ticket", params: ["vehicle: Vehicle"], visibility: "+" },
        { id: "pl-entry-meth-1", name: "scanVehicle", returnType: "VehicleType", params: [], visibility: "+" },
      ],
      x: 50,
      y: 50,
    },
    {
      id: "pl-exit",
      name: "ExitGate",
      stereotype: "class",
      attributes: [
        { id: "pl-exit-attr-0", name: "gateId", type: "string", visibility: "-" },
        { id: "pl-exit-attr-1", name: "paymentProcessor", type: "PaymentProcessor", visibility: "-" },
      ],
      methods: [
        { id: "pl-exit-meth-0", name: "scanTicket", returnType: "Ticket", params: ["ticketId: string"], visibility: "+" },
        { id: "pl-exit-meth-1", name: "processExit", returnType: "void", params: ["ticket: Ticket"], visibility: "+" },
      ],
      x: 50,
      y: 260,
    },
    {
      id: "pl-fee",
      name: "FeeCalculator",
      stereotype: "interface",
      attributes: [],
      methods: [
        { id: "pl-fee-meth-0", name: "calculateFee", returnType: "number", params: ["ticket: Ticket"], visibility: "+" },
        { id: "pl-fee-meth-1", name: "getHourlyRate", returnType: "number", params: ["type: VehicleType"], visibility: "+" },
      ],
      x: 50,
      y: 460,
    },
    {
      id: "pl-display",
      name: "DisplayBoard",
      stereotype: "class",
      attributes: [
        { id: "pl-display-attr-0", name: "floorNumber", type: "number", visibility: "-" },
        { id: "pl-display-attr-1", name: "availableSmall", type: "number", visibility: "-" },
        { id: "pl-display-attr-2", name: "availableMedium", type: "number", visibility: "-" },
        { id: "pl-display-attr-3", name: "availableLarge", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "pl-display-meth-0", name: "update", returnType: "void", params: [], visibility: "+" },
        { id: "pl-display-meth-1", name: "show", returnType: "string", params: [], visibility: "+" },
      ],
      x: 900,
      y: 260,
    },
  ],
  starterRelationships: [
    { id: rid(), source: "pl-lot", target: "pl-floor", type: "composition", sourceCardinality: "1", targetCardinality: "1..*" },
    { id: rid(), source: "pl-floor", target: "pl-spot", type: "composition", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "pl-spot", target: "pl-vehicle", type: "association", label: "parks" },
    { id: rid(), source: "pl-lot", target: "pl-entry", type: "composition", sourceCardinality: "1", targetCardinality: "1..*" },
    { id: rid(), source: "pl-lot", target: "pl-exit", type: "composition", sourceCardinality: "1", targetCardinality: "1..*" },
    { id: rid(), source: "pl-entry", target: "pl-ticket", type: "dependency", label: "creates" },
    { id: rid(), source: "pl-exit", target: "pl-payment", type: "dependency", label: "uses" },
    { id: rid(), source: "pl-payment", target: "pl-fee", type: "dependency", label: "delegates to" },
    { id: rid(), source: "pl-floor", target: "pl-display", type: "composition" },
    { id: rid(), source: "pl-ticket", target: "pl-spot", type: "association" },
    { id: rid(), source: "pl-ticket", target: "pl-vehicle", type: "association" },
  ],
  hints: [
    "Start by identifying the core entities: ParkingLot, ParkingFloor, ParkingSpot, and Vehicle. Think about what data each holds and how they relate (composition: Lot owns Floors, Floors own Spots).",
    "Add a Ticket class that records the entry time, assigned spot, and vehicle. This is the receipt connecting a vehicle to its parking session.",
    "Use an enum for VehicleType (MOTORCYCLE, CAR, BUS) and SpotType (SMALL, MEDIUM, LARGE). Map vehicle types to compatible spot types.",
    "Apply the Strategy pattern for fee calculation -- create a FeeCalculator interface with implementations like HourlyFeeCalculator, DailyFeeCalculator, and WeekendFeeCalculator so pricing models are swappable.",
    "Model EntryGate and ExitGate as separate classes. The entry gate issues tickets and the exit gate processes payment -- this separates concerns and supports multiple entry/exit points.",
    "Use the Observer pattern to notify DisplayBoard when spot availability changes. Each floor has a display board showing real-time counts per spot type.",
    "Handle concurrency: what if two cars try to park in the same spot simultaneously? Consider synchronizing findAvailableSpot() or using an atomic compare-and-swap on the spot's isOccupied flag. Also handle the edge case where the lot is full, an oversized vehicle arrives, or payment fails mid-exit.",
  ],
  complexityAnalysis:
    "**Park vehicle:** O(F x S) worst case scanning F floors with S spots each to find an available spot; " +
    "O(1) with a HashMap<SpotType, Queue<ParkingSpot>> maintaining free-spot queues. " +
    "**Unpark vehicle:** O(1) ticket lookup via HashMap<ticketId, Ticket>. " +
    "**Fee calculation:** O(1) time-based arithmetic. " +
    "**Find available spot:** O(1) amortized with per-type free-spot queues; O(S) linear scan without. " +
    "**Space:** O(F x S) for all spots + O(V) for active tickets where V = parked vehicles.",
};

// ═════════════════════════════════════════════════════════════
//  2. Elevator System
// ═════════════════════════════════════════════════════════════

const elevator: LLDProblem = {
  id: "prob-elevator",
  name: "Elevator System",
  difficulty: 3,
  description:
    "The Burj Khalifa has 57 elevators serving 163 floors. 35,000 people visit daily. " +
    "How do you minimize wait times while preventing starvation of lower floors? " +
    "Design a multi-elevator dispatch system that handles concurrent up/down requests " +
    "and uses algorithms like SCAN/LOOK to keep average wait under 30 seconds. " +
    "A top-tier LLD question at Google, Microsoft, and Uber.",
  requirements: [
    "Support multiple elevators in a single building",
    "Handle up/down requests from any floor",
    "Implement an efficient dispatching algorithm (e.g., SCAN/LOOK)",
    "Track elevator state: moving up, moving down, idle",
    "Support floor-specific requests from inside the elevator",
  ],
  slug: "elevator-system",
  seoDifficulty: "medium",
  category: "object-modeling",
  keyPatterns: ["Strategy", "State", "Observer", "Command"],
  interviewFrequency: "high",
  classCount: 14,
  relatedProblems: ["parking-lot", "task-scheduler", "vending-machine"],
  starterClasses: [
    {
      id: "el-building",
      name: "Building",
      stereotype: "class",
      attributes: [
        { id: "el-building-attr-0", name: "totalFloors", type: "number", visibility: "-" },
        { id: "el-building-attr-1", name: "elevators", type: "Elevator[]", visibility: "-" },
        { id: "el-building-attr-2", name: "floors", type: "Floor[]", visibility: "-" },
      ],
      methods: [
        { id: "el-building-meth-0", name: "requestElevator", returnType: "void", params: ["floor: number", "dir: Direction"], visibility: "+" },
        { id: "el-building-meth-1", name: "addElevator", returnType: "void", params: ["elevator: Elevator"], visibility: "+" },
      ],
      x: 100,
      y: 50,
    },
    {
      id: "el-elevator",
      name: "Elevator",
      stereotype: "class",
      attributes: [
        { id: "el-elevator-attr-0", name: "id", type: "number", visibility: "-" },
        { id: "el-elevator-attr-1", name: "currentFloor", type: "number", visibility: "-" },
        { id: "el-elevator-attr-2", name: "state", type: "ElevatorState", visibility: "-" },
        { id: "el-elevator-attr-3", name: "capacity", type: "number", visibility: "-" },
        { id: "el-elevator-attr-4", name: "currentLoad", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "el-elevator-meth-0", name: "move", returnType: "void", params: [], visibility: "+" },
        { id: "el-elevator-meth-1", name: "addStop", returnType: "void", params: ["floor: number"], visibility: "+" },
        { id: "el-elevator-meth-2", name: "openDoor", returnType: "void", params: [], visibility: "+" },
        { id: "el-elevator-meth-3", name: "closeDoor", returnType: "void", params: [], visibility: "+" },
      ],
      x: 400,
      y: 50,
    },
    {
      id: "el-dispatcher",
      name: "Dispatcher",
      stereotype: "interface",
      attributes: [],
      methods: [
        { id: "el-dispatcher-meth-0", name: "selectElevator", returnType: "Elevator", params: ["floor: number", "dir: Direction"], visibility: "+" },
        { id: "el-dispatcher-meth-1", name: "addRequest", returnType: "void", params: ["request: Request"], visibility: "+" },
      ],
      x: 100,
      y: 280,
    },
    {
      id: "el-request",
      name: "Request",
      stereotype: "class",
      attributes: [
        { id: "el-request-attr-0", name: "floor", type: "number", visibility: "-" },
        { id: "el-request-attr-1", name: "direction", type: "Direction", visibility: "-" },
        { id: "el-request-attr-2", name: "timestamp", type: "Date", visibility: "-" },
        { id: "el-request-attr-3", name: "type", type: "RequestType", visibility: "-" },
      ],
      methods: [
        { id: "el-request-meth-0", name: "getFloor", returnType: "number", params: [], visibility: "+" },
        { id: "el-request-meth-1", name: "getDirection", returnType: "Direction", params: [], visibility: "+" },
      ],
      x: 400,
      y: 280,
    },
    {
      id: "el-floor",
      name: "Floor",
      stereotype: "class",
      attributes: [
        { id: "el-floor-attr-0", name: "floorNumber", type: "number", visibility: "-" },
        { id: "el-floor-attr-1", name: "upButton", type: "Button", visibility: "-" },
        { id: "el-floor-attr-2", name: "downButton", type: "Button", visibility: "-" },
      ],
      methods: [
        { id: "el-floor-meth-0", name: "pressUp", returnType: "void", params: [], visibility: "+" },
        { id: "el-floor-meth-1", name: "pressDown", returnType: "void", params: [], visibility: "+" },
      ],
      x: 700,
      y: 50,
    },
    {
      id: "el-button",
      name: "Button",
      stereotype: "class",
      attributes: [
        { id: "el-button-attr-0", name: "isPressed", type: "boolean", visibility: "-" },
        { id: "el-button-attr-1", name: "direction", type: "Direction", visibility: "-" },
      ],
      methods: [
        { id: "el-button-meth-0", name: "press", returnType: "void", params: [], visibility: "+" },
        { id: "el-button-meth-1", name: "reset", returnType: "void", params: [], visibility: "+" },
      ],
      x: 700,
      y: 280,
    },
    {
      id: "el-door",
      name: "Door",
      stereotype: "class",
      attributes: [
        { id: "el-door-attr-0", name: "state", type: "DoorState", visibility: "-" },
        { id: "el-door-attr-1", name: "elevatorId", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "el-door-meth-0", name: "open", returnType: "void", params: [], visibility: "+" },
        { id: "el-door-meth-1", name: "close", returnType: "void", params: [], visibility: "+" },
      ],
      x: 100,
      y: 500,
    },
    {
      id: "el-display",
      name: "Display",
      stereotype: "class",
      attributes: [
        { id: "el-display-attr-0", name: "currentFloor", type: "number", visibility: "-" },
        { id: "el-display-attr-1", name: "direction", type: "Direction", visibility: "-" },
      ],
      methods: [
        { id: "el-display-meth-0", name: "update", returnType: "void", params: ["floor: number", "dir: Direction"], visibility: "+" },
        { id: "el-display-meth-1", name: "show", returnType: "string", params: [], visibility: "+" },
      ],
      x: 400,
      y: 500,
    },
    {
      id: "el-controller",
      name: "ElevatorController",
      stereotype: "class",
      attributes: [
        { id: "el-controller-attr-0", name: "elevator", type: "Elevator", visibility: "-" },
        { id: "el-controller-attr-1", name: "pendingStops", type: "PriorityQueue<number>", visibility: "-" },
        { id: "el-controller-attr-2", name: "dispatcher", type: "Dispatcher", visibility: "-" },
      ],
      methods: [
        { id: "el-controller-meth-0", name: "processNextStop", returnType: "void", params: [], visibility: "+" },
        { id: "el-controller-meth-1", name: "scheduleStop", returnType: "void", params: ["floor: number"], visibility: "+" },
      ],
      x: 700,
      y: 500,
    },
  ],
  starterRelationships: [
    { id: rid(), source: "el-building", target: "el-elevator", type: "composition", sourceCardinality: "1", targetCardinality: "1..*" },
    { id: rid(), source: "el-building", target: "el-floor", type: "composition", sourceCardinality: "1", targetCardinality: "1..*" },
    { id: rid(), source: "el-building", target: "el-dispatcher", type: "dependency", label: "uses" },
    { id: rid(), source: "el-dispatcher", target: "el-elevator", type: "dependency", label: "selects" },
    { id: rid(), source: "el-floor", target: "el-button", type: "composition", sourceCardinality: "1", targetCardinality: "2" },
    { id: rid(), source: "el-elevator", target: "el-door", type: "composition" },
    { id: rid(), source: "el-elevator", target: "el-display", type: "composition" },
    { id: rid(), source: "el-controller", target: "el-elevator", type: "association" },
    { id: rid(), source: "el-controller", target: "el-dispatcher", type: "association" },
    { id: rid(), source: "el-button", target: "el-request", type: "dependency", label: "creates" },
  ],
  hints: [
    "Start by identifying the core entities: Building, Elevator, Floor, and Request. A Building has many Elevators and Floors; each Floor has up/down Buttons that generate Requests.",
    "Model the Elevator with attributes for current floor, direction, and a list of pending stops. Use a sorted data structure (like a TreeSet or PriorityQueue) for the stop list so the next stop is always O(1).",
    "Use the State pattern for elevator states: Idle, MovingUp, MovingDown, and DoorOpen. Each state defines which transitions are valid (e.g., DoorOpen -> Idle or MovingUp).",
    "The Dispatcher is the brain -- apply the Strategy pattern here. Implement SCAN (elevator goes all the way up, then all the way down), LOOK (reverses when no more requests in current direction), and Nearest-First for comparison.",
    "Add Door and Display as separate classes composed by Elevator. The Door has open/close with a timer; the Display shows current floor and direction via Observer.",
    "Introduce an ElevatorController that mediates between the Dispatcher and a single Elevator -- it manages the priority queue of stops and processes them sequentially.",
    "Handle edge cases: what happens when the elevator is at capacity and cannot pick up more passengers? What about simultaneous requests from multiple floors? Consider maintenance mode where an elevator is taken offline, and starvation prevention so lower floors are not ignored by an elevator constantly serving high floors.",
  ],
  complexityAnalysis:
    "**Dispatch (select elevator):** O(E) where E = number of elevators, evaluating distance for each. " +
    "**SCAN scheduling:** O(log N) insertion into a sorted stop list where N = pending stops; O(1) to get the next stop. " +
    "**Request handling:** O(E) to find optimal elevator + O(log N) to insert stop. " +
    "**Move to next floor:** O(1) per floor transition. " +
    "**Total per request:** O(E + log N). " +
    "**Space:** O(E x N) for all stop queues + O(F) for floor state where F = number of floors.",
};

// ═════════════════════════════════════════════════════════════
//  3. Chess Game
// ═════════════════════════════════════════════════════════════

const chess: LLDProblem = {
  id: "prob-chess",
  name: "Chess Game",
  difficulty: 4,
  description:
    "Chess.com handles 10 million games per day with real-time move validation in under 5ms. " +
    "Each piece has unique movement rules, and the game must detect check, checkmate, and stalemate " +
    "while supporting castling, en passant, and pawn promotion. " +
    "This is the ultimate OOP stress-test -- asked at Google, Meta, and Bloomberg. " +
    "Get the class hierarchy right and everything else follows.",
  requirements: [
    "Model the 8x8 board with all piece types (King, Queen, Rook, Bishop, Knight, Pawn)",
    "Validate legal moves for each piece type",
    "Detect check, checkmate, and stalemate conditions",
    "Support special moves: castling, en passant, pawn promotion",
  ],
  slug: "chess-game",
  seoDifficulty: "hard",
  category: "game-design",
  keyPatterns: ["Strategy", "Command", "Memento", "Observer"],
  interviewFrequency: "high",
  classCount: 16,
  relatedProblems: ["tic-tac-toe", "card-game", "snake-game"],
  starterClasses: [
    {
      id: "ch-game",
      name: "Game",
      stereotype: "class",
      attributes: [
        { id: "ch-game-attr-0", name: "board", type: "Board", visibility: "-" },
        { id: "ch-game-attr-1", name: "players", type: "Player[]", visibility: "-" },
        { id: "ch-game-attr-2", name: "currentTurn", type: "Color", visibility: "-" },
        { id: "ch-game-attr-3", name: "status", type: "GameStatus", visibility: "-" },
      ],
      methods: [
        { id: "ch-game-meth-0", name: "makeMove", returnType: "boolean", params: ["from: Position", "to: Position"], visibility: "+" },
        { id: "ch-game-meth-1", name: "isCheckmate", returnType: "boolean", params: [], visibility: "+" },
      ],
      x: 50,
      y: 50,
    },
    {
      id: "ch-board",
      name: "Board",
      stereotype: "class",
      attributes: [
        { id: "ch-board-attr-0", name: "cells", type: "Cell[][]", visibility: "-" },
      ],
      methods: [
        { id: "ch-board-meth-0", name: "getPiece", returnType: "Piece", params: ["pos: Position"], visibility: "+" },
        { id: "ch-board-meth-1", name: "movePiece", returnType: "void", params: ["from: Position", "to: Position"], visibility: "+" },
      ],
      x: 350,
      y: 50,
    },
    {
      id: "ch-piece",
      name: "Piece",
      stereotype: "abstract",
      attributes: [
        { id: "ch-piece-attr-0", name: "color", type: "Color", visibility: "#" },
        { id: "ch-piece-attr-1", name: "position", type: "Position", visibility: "#" },
      ],
      methods: [
        { id: "ch-piece-meth-0", name: "getValidMoves", returnType: "Position[]", params: ["board: Board"], visibility: "+", isAbstract: true },
        { id: "ch-piece-meth-1", name: "canMove", returnType: "boolean", params: ["to: Position", "board: Board"], visibility: "+" },
      ],
      x: 350,
      y: 300,
    },
    {
      id: "ch-player",
      name: "Player",
      stereotype: "class",
      attributes: [
        { id: "ch-player-attr-0", name: "name", type: "string", visibility: "-" },
        { id: "ch-player-attr-1", name: "color", type: "Color", visibility: "-" },
        { id: "ch-player-attr-2", name: "capturedPieces", type: "Piece[]", visibility: "-" },
      ],
      methods: [
        { id: "ch-player-meth-0", name: "getColor", returnType: "Color", params: [], visibility: "+" },
        { id: "ch-player-meth-1", name: "getCapturedPieces", returnType: "Piece[]", params: [], visibility: "+" },
      ],
      x: 50,
      y: 300,
    },
    {
      id: "ch-move",
      name: "Move",
      stereotype: "class",
      attributes: [
        { id: "ch-move-attr-0", name: "from", type: "Position", visibility: "-" },
        { id: "ch-move-attr-1", name: "to", type: "Position", visibility: "-" },
        { id: "ch-move-attr-2", name: "movedPiece", type: "Piece", visibility: "-" },
        { id: "ch-move-attr-3", name: "capturedPiece", type: "Piece", visibility: "-" },
      ],
      methods: [
        { id: "ch-move-meth-0", name: "execute", returnType: "void", params: ["board: Board"], visibility: "+" },
        { id: "ch-move-meth-1", name: "undo", returnType: "void", params: ["board: Board"], visibility: "+" },
      ],
      x: 650,
      y: 50,
    },
    {
      id: "ch-cell",
      name: "Cell",
      stereotype: "class",
      attributes: [
        { id: "ch-cell-attr-0", name: "position", type: "Position", visibility: "-" },
        { id: "ch-cell-attr-1", name: "piece", type: "Piece", visibility: "-" },
      ],
      methods: [
        { id: "ch-cell-meth-0", name: "isEmpty", returnType: "boolean", params: [], visibility: "+" },
        { id: "ch-cell-meth-1", name: "setPiece", returnType: "void", params: ["piece: Piece"], visibility: "+" },
      ],
      x: 650,
      y: 300,
    },
    {
      id: "ch-king",
      name: "King",
      stereotype: "class",
      attributes: [
        { id: "ch-king-attr-0", name: "hasMoved", type: "boolean", visibility: "-" },
        { id: "ch-king-attr-1", name: "inCheck", type: "boolean", visibility: "-" },
      ],
      methods: [
        { id: "ch-king-meth-0", name: "getValidMoves", returnType: "Position[]", params: ["board: Board"], visibility: "+" },
        { id: "ch-king-meth-1", name: "canCastle", returnType: "boolean", params: ["side: string", "board: Board"], visibility: "+" },
      ],
      x: 50,
      y: 550,
    },
    {
      id: "ch-knight",
      name: "Knight",
      stereotype: "class",
      attributes: [
        { id: "ch-knight-attr-0", name: "color", type: "Color", visibility: "#" },
        { id: "ch-knight-attr-1", name: "position", type: "Position", visibility: "#" },
      ],
      methods: [
        { id: "ch-knight-meth-0", name: "getValidMoves", returnType: "Position[]", params: ["board: Board"], visibility: "+" },
        { id: "ch-knight-meth-1", name: "canMove", returnType: "boolean", params: ["to: Position", "board: Board"], visibility: "+" },
      ],
      x: 250,
      y: 550,
    },
    {
      id: "ch-pawn",
      name: "Pawn",
      stereotype: "class",
      attributes: [
        { id: "ch-pawn-attr-0", name: "hasMoved", type: "boolean", visibility: "-" },
        { id: "ch-pawn-attr-1", name: "enPassantEligible", type: "boolean", visibility: "-" },
      ],
      methods: [
        { id: "ch-pawn-meth-0", name: "getValidMoves", returnType: "Position[]", params: ["board: Board"], visibility: "+" },
        { id: "ch-pawn-meth-1", name: "promote", returnType: "Piece", params: ["pieceType: string"], visibility: "+" },
      ],
      x: 450,
      y: 550,
    },
    {
      id: "ch-validator",
      name: "MoveValidator",
      stereotype: "class",
      attributes: [
        { id: "ch-validator-attr-0", name: "board", type: "Board", visibility: "-" },
        { id: "ch-validator-attr-1", name: "moveHistory", type: "Move[]", visibility: "-" },
      ],
      methods: [
        { id: "ch-validator-meth-0", name: "isValid", returnType: "boolean", params: ["move: Move"], visibility: "+" },
        { id: "ch-validator-meth-1", name: "wouldCauseCheck", returnType: "boolean", params: ["move: Move", "color: Color"], visibility: "+" },
      ],
      x: 650,
      y: 550,
    },
  ],
  starterRelationships: [
    { id: rid(), source: "ch-game", target: "ch-board", type: "composition" },
    { id: rid(), source: "ch-game", target: "ch-player", type: "composition", sourceCardinality: "1", targetCardinality: "2" },
    { id: rid(), source: "ch-game", target: "ch-move", type: "aggregation", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "ch-board", target: "ch-cell", type: "composition", sourceCardinality: "1", targetCardinality: "64" },
    { id: rid(), source: "ch-cell", target: "ch-piece", type: "aggregation", sourceCardinality: "1", targetCardinality: "0..1" },
    { id: rid(), source: "ch-king", target: "ch-piece", type: "inheritance" },
    { id: rid(), source: "ch-knight", target: "ch-piece", type: "inheritance" },
    { id: rid(), source: "ch-pawn", target: "ch-piece", type: "inheritance" },
    { id: rid(), source: "ch-game", target: "ch-validator", type: "composition" },
    { id: rid(), source: "ch-validator", target: "ch-board", type: "association" },
  ],
  hints: [
    "Start by modeling the Board as an 8x8 grid of Cells, where each Cell optionally holds a Piece. The Piece is abstract with a color and position.",
    "Create concrete piece subclasses (King, Queen, Rook, Bishop, Knight, Pawn) each overriding getValidMoves(board). This is the core polymorphism -- the Board does not need to know which piece it is moving.",
    "Model Move as a Command: it holds from/to positions, the moved piece, and any captured piece. Implement execute() and undo() for move history and the Memento pattern for take-backs.",
    "Use a MoveValidator class that checks: (a) the piece's own movement rules, (b) path obstruction, (c) whether the move would leave the player's own king in check. This separates validation from piece logic.",
    "Handle special moves: King tracks hasMoved for castling; Pawn tracks hasMoved for double-advance and enPassantEligible for en passant capture; Pawn has promote() for promotion to Queen/Rook/Bishop/Knight.",
    "Implement check/checkmate detection: after each move, scan all opponent pieces to see if any can reach the king (check). If the king is in check and no move can escape it, it is checkmate. If not in check but no legal moves exist, it is stalemate.",
    "For extensibility, consider using the Observer pattern to notify a GameLog or UI of state changes (move made, piece captured, check detected). Time control can be added as a separate Timer class composed by Game.",
  ],
  complexityAnalysis:
    "**Move validation (single piece):** O(N) where N = max squares a piece can reach (up to 27 for Queen). " +
    "**Check detection:** O(P x N) scanning all P opponent pieces with up to N squares each; P <= 16, N <= 27. " +
    "**Checkmate detection:** O(K x P x N) trying all K legal moves for the checked player (K = moves available to all friendly pieces), verifying each does not leave king in check. " +
    "**Stalemate detection:** Same as checkmate: O(K x P x N). " +
    "**Space:** O(64) for the board + O(M) for move history where M = moves played. " +
    "**Per-move total:** O(P x N) for check detection after the move, bounded by ~16 x 27 = 432 operations.",
};

// ═════════════════════════════════════════════════════════════
//  4. Vending Machine
// ═════════════════════════════════════════════════════════════

const vendingMachine: LLDProblem = {
  id: "prob-vending-machine",
  name: "Vending Machine",
  difficulty: 2,
  description:
    "Japan has 5.5 million vending machines -- one for every 23 people. " +
    "Each handles coin recognition, inventory tracking, and change calculation in real time. " +
    "What happens when someone inserts coins but the product is out of stock? " +
    "Design the state machine that handles every edge case: insufficient funds, exact change only, " +
    "and concurrent selections. The classic State pattern interview question at Amazon and Apple.",
  requirements: [
    "Accept different coin denominations and track inserted amount",
    "Display available products with prices and stock",
    "Dispense selected product and return correct change",
    "Handle edge cases: insufficient funds, out of stock, exact change only",
  ],
  slug: "vending-machine",
  seoDifficulty: "easy",
  category: "object-modeling",
  keyPatterns: ["State", "Strategy", "Singleton", "Chain of Responsibility"],
  interviewFrequency: "high",
  classCount: 10,
  relatedProblems: ["atm", "elevator-system", "restaurant-management"],
  starterClasses: [
    {
      id: "vm-machine",
      name: "VendingMachine",
      stereotype: "class",
      attributes: [
        { id: "vm-machine-attr-0", name: "inventory", type: "Inventory", visibility: "-" },
        { id: "vm-machine-attr-1", name: "currentBalance", type: "number", visibility: "-" },
        { id: "vm-machine-attr-2", name: "state", type: "MachineState", visibility: "-" },
      ],
      methods: [
        { id: "vm-machine-meth-0", name: "insertCoin", returnType: "void", params: ["coin: Coin"], visibility: "+" },
        { id: "vm-machine-meth-1", name: "selectProduct", returnType: "Product", params: ["code: string"], visibility: "+" },
        { id: "vm-machine-meth-2", name: "dispense", returnType: "void", params: [], visibility: "+" },
        { id: "vm-machine-meth-3", name: "returnCoins", returnType: "Coin[]", params: [], visibility: "+" },
      ],
      x: 50,
      y: 50,
    },
    {
      id: "vm-product",
      name: "Product",
      stereotype: "class",
      attributes: [
        { id: "vm-product-attr-0", name: "name", type: "string", visibility: "-" },
        { id: "vm-product-attr-1", name: "price", type: "number", visibility: "-" },
        { id: "vm-product-attr-2", name: "code", type: "string", visibility: "-" },
      ],
      methods: [
        { id: "vm-product-meth-0", name: "getPrice", returnType: "number", params: [], visibility: "+" },
        { id: "vm-product-meth-1", name: "getCode", returnType: "string", params: [], visibility: "+" },
      ],
      x: 400,
      y: 50,
    },
    {
      id: "vm-inventory",
      name: "Inventory",
      stereotype: "class",
      attributes: [
        { id: "vm-inventory-attr-0", name: "items", type: "Map<string, number>", visibility: "-" },
        { id: "vm-inventory-attr-1", name: "products", type: "Map<string, Product>", visibility: "-" },
      ],
      methods: [
        { id: "vm-inventory-meth-0", name: "getStock", returnType: "number", params: ["code: string"], visibility: "+" },
        { id: "vm-inventory-meth-1", name: "reduce", returnType: "void", params: ["code: string"], visibility: "+" },
        { id: "vm-inventory-meth-2", name: "restock", returnType: "void", params: ["code: string", "quantity: number"], visibility: "+" },
      ],
      x: 400,
      y: 280,
    },
    {
      id: "vm-state",
      name: "VendingState",
      stereotype: "interface",
      attributes: [],
      methods: [
        { id: "vm-state-meth-0", name: "insertMoney", returnType: "void", params: ["machine: VendingMachine", "amount: number"], visibility: "+" },
        { id: "vm-state-meth-1", name: "selectProduct", returnType: "void", params: ["machine: VendingMachine", "code: string"], visibility: "+" },
        { id: "vm-state-meth-2", name: "dispense", returnType: "void", params: ["machine: VendingMachine"], visibility: "+" },
        { id: "vm-state-meth-3", name: "returnChange", returnType: "number", params: ["machine: VendingMachine"], visibility: "+" },
      ],
      x: 50,
      y: 280,
    },
    {
      id: "vm-idle",
      name: "IdleState",
      stereotype: "class",
      attributes: [
        { id: "vm-idle-attr-0", name: "machine", type: "VendingMachine", visibility: "-" },
        { id: "vm-idle-attr-1", name: "name", type: "string", visibility: "-" },
      ],
      methods: [
        { id: "vm-idle-meth-0", name: "insertMoney", returnType: "void", params: ["machine: VendingMachine", "amount: number"], visibility: "+" },
        { id: "vm-idle-meth-1", name: "selectProduct", returnType: "void", params: ["machine: VendingMachine", "code: string"], visibility: "+" },
      ],
      x: 50,
      y: 500,
    },
    {
      id: "vm-hasmoney",
      name: "HasMoneyState",
      stereotype: "class",
      attributes: [
        { id: "vm-hasmoney-attr-0", name: "machine", type: "VendingMachine", visibility: "-" },
        { id: "vm-hasmoney-attr-1", name: "name", type: "string", visibility: "-" },
      ],
      methods: [
        { id: "vm-hasmoney-meth-0", name: "insertMoney", returnType: "void", params: ["machine: VendingMachine", "amount: number"], visibility: "+" },
        { id: "vm-hasmoney-meth-1", name: "selectProduct", returnType: "void", params: ["machine: VendingMachine", "code: string"], visibility: "+" },
      ],
      x: 250,
      y: 500,
    },
    {
      id: "vm-dispensing",
      name: "DispensingState",
      stereotype: "class",
      attributes: [
        { id: "vm-dispensing-attr-0", name: "machine", type: "VendingMachine", visibility: "-" },
        { id: "vm-dispensing-attr-1", name: "name", type: "string", visibility: "-" },
      ],
      methods: [
        { id: "vm-dispensing-meth-0", name: "dispense", returnType: "void", params: ["machine: VendingMachine"], visibility: "+" },
        { id: "vm-dispensing-meth-1", name: "returnChange", returnType: "number", params: ["machine: VendingMachine"], visibility: "+" },
      ],
      x: 450,
      y: 500,
    },
    {
      id: "vm-coin",
      name: "Coin",
      stereotype: "enum",
      attributes: [
        { id: "vm-coin-attr-0", name: "PENNY", type: "1", visibility: "+" },
        { id: "vm-coin-attr-1", name: "NICKEL", type: "5", visibility: "+" },
        { id: "vm-coin-attr-2", name: "DIME", type: "10", visibility: "+" },
        { id: "vm-coin-attr-3", name: "QUARTER", type: "25", visibility: "+" },
      ],
      methods: [
        { id: "vm-coin-meth-0", name: "getValue", returnType: "number", params: [], visibility: "+" },
        { id: "vm-coin-meth-1", name: "fromValue", returnType: "Coin", params: ["value: number"], visibility: "+" },
      ],
      x: 650,
      y: 280,
    },
  ],
  starterRelationships: [
    { id: rid(), source: "vm-machine", target: "vm-inventory", type: "composition" },
    { id: rid(), source: "vm-inventory", target: "vm-product", type: "aggregation", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "vm-machine", target: "vm-state", type: "dependency", label: "delegates to" },
    { id: rid(), source: "vm-idle", target: "vm-state", type: "realization" },
    { id: rid(), source: "vm-hasmoney", target: "vm-state", type: "realization" },
    { id: rid(), source: "vm-dispensing", target: "vm-state", type: "realization" },
    { id: rid(), source: "vm-machine", target: "vm-coin", type: "dependency", label: "accepts" },
  ],
  hints: [
    "Start by identifying the core entities: VendingMachine, Product, Inventory, and Coin. The machine has an inventory of products and accepts coins to build up a balance.",
    "Use the State pattern for machine lifecycle: IdleState (waiting for input), HasMoneyState (coins inserted, waiting for selection), DispensingState (product being dispensed), and SoldOutState (all products gone).",
    "Create a Coin enum with values (PENNY=1, NICKEL=5, DIME=10, QUARTER=25). The machine accumulates coin values into a currentBalance and compares against the product price.",
    "Apply the Chain of Responsibility for coin validation: each CoinValidator in the chain checks one denomination and passes unrecognized coins to the next handler.",
    "Add a ChangeCalculator that uses a greedy algorithm to return the fewest coins possible. Handle the edge case where exact change cannot be made -- the machine should display 'Exact Change Only' when its coin reserves are low.",
    "Handle the edge case where a product is out of stock after money is inserted -- the machine must return all inserted coins. Also handle concurrent selections with proper synchronization.",
    "For extensibility, use the Strategy pattern for payment methods (CoinPayment, CardPayment, MobilePayment) so the machine can accept different payment types without changing core logic.",
  ],
  complexityAnalysis:
    "**Insert coin:** O(1) -- add coin value to balance. " +
    "**Select product:** O(1) -- HashMap lookup by product code. " +
    "**Dispense:** O(1) -- decrement inventory count and reset balance. " +
    "**Calculate change:** O(D) where D = number of denomination types (typically 4), using greedy algorithm. " +
    "**Coin validation (Chain of Responsibility):** O(D) passing through D handlers. " +
    "**Space:** O(P) for P products in inventory + O(D) for coin reserves per denomination.",
};

// ═════════════════════════════════════════════════════════════
//  5. Library Management
// ═════════════════════════════════════════════════════════════

const library: LLDProblem = {
  id: "prob-library",
  name: "Library Management System",
  difficulty: 2,
  description:
    "The New York Public Library manages 55 million items across 92 locations. " +
    "Thousands of members borrow and return daily, and the system must prevent the same physical copy " +
    "from being checked out twice while tracking fines down to the penny. " +
    "Design a system that handles book cataloging, member registration, borrow/return workflows, " +
    "and overdue fine calculation. Frequently asked at Amazon, Intuit, and Walmart.",
  requirements: [
    "Catalog books with ISBN, title, author, and copy tracking",
    "Register members and track their borrowing history",
    "Support borrow and return operations with due-date enforcement",
    "Calculate fines for overdue returns",
    "Search books by title, author, or ISBN",
  ],
  slug: "library-management",
  seoDifficulty: "easy",
  category: "object-modeling",
  keyPatterns: ["Observer", "State", "Strategy", "Iterator"],
  interviewFrequency: "high",
  classCount: 10,
  relatedProblems: ["parking-lot", "movie-ticket-booking", "hotel-booking"],
  starterClasses: [
    {
      id: "lib-library",
      name: "Library",
      stereotype: "class",
      attributes: [
        { id: "lib-library-attr-0", name: "name", type: "string", visibility: "-" },
        { id: "lib-library-attr-1", name: "books", type: "Book[]", visibility: "-" },
        { id: "lib-library-attr-2", name: "members", type: "Member[]", visibility: "-" },
      ],
      methods: [
        { id: "lib-library-meth-0", name: "searchByTitle", returnType: "Book[]", params: ["title: string"], visibility: "+" },
        { id: "lib-library-meth-1", name: "registerMember", returnType: "void", params: ["member: Member"], visibility: "+" },
      ],
      x: 50,
      y: 50,
    },
    {
      id: "lib-book",
      name: "Book",
      stereotype: "class",
      attributes: [
        { id: "lib-book-attr-0", name: "isbn", type: "string", visibility: "-" },
        { id: "lib-book-attr-1", name: "title", type: "string", visibility: "-" },
        { id: "lib-book-attr-2", name: "author", type: "string", visibility: "-" },
        { id: "lib-book-attr-3", name: "copies", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "lib-book-meth-0", name: "isAvailable", returnType: "boolean", params: [], visibility: "+" },
        { id: "lib-book-meth-1", name: "getAvailableCopies", returnType: "number", params: [], visibility: "+" },
      ],
      x: 350,
      y: 50,
    },
    {
      id: "lib-member",
      name: "Member",
      stereotype: "class",
      attributes: [
        { id: "lib-member-attr-0", name: "id", type: "string", visibility: "-" },
        { id: "lib-member-attr-1", name: "name", type: "string", visibility: "-" },
        { id: "lib-member-attr-2", name: "activeLoans", type: "Loan[]", visibility: "-" },
        { id: "lib-member-attr-3", name: "maxLoans", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "lib-member-meth-0", name: "borrow", returnType: "Loan", params: ["book: Book"], visibility: "+" },
        { id: "lib-member-meth-1", name: "returnBook", returnType: "number", params: ["loan: Loan"], visibility: "+" },
      ],
      x: 50,
      y: 300,
    },
    {
      id: "lib-loan",
      name: "Loan",
      stereotype: "class",
      attributes: [
        { id: "lib-loan-attr-0", name: "book", type: "Book", visibility: "-" },
        { id: "lib-loan-attr-1", name: "borrowDate", type: "Date", visibility: "-" },
        { id: "lib-loan-attr-2", name: "dueDate", type: "Date", visibility: "-" },
        { id: "lib-loan-attr-3", name: "returnDate", type: "Date", visibility: "-" },
      ],
      methods: [
        { id: "lib-loan-meth-0", name: "isOverdue", returnType: "boolean", params: [], visibility: "+" },
        { id: "lib-loan-meth-1", name: "calculateFine", returnType: "number", params: [], visibility: "+" },
      ],
      x: 350,
      y: 300,
    },
    {
      id: "lib-bookitem",
      name: "BookItem",
      stereotype: "class",
      attributes: [
        { id: "lib-bookitem-attr-0", name: "barcode", type: "string", visibility: "-" },
        { id: "lib-bookitem-attr-1", name: "status", type: "BookStatus", visibility: "-" },
        { id: "lib-bookitem-attr-2", name: "rack", type: "Rack", visibility: "-" },
      ],
      methods: [
        { id: "lib-bookitem-meth-0", name: "checkout", returnType: "void", params: [], visibility: "+" },
        { id: "lib-bookitem-meth-1", name: "checkin", returnType: "void", params: [], visibility: "+" },
      ],
      x: 650,
      y: 50,
    },
    {
      id: "lib-fine",
      name: "FineCalculator",
      stereotype: "interface",
      attributes: [],
      methods: [
        { id: "lib-fine-meth-0", name: "calculate", returnType: "number", params: ["daysOverdue: number"], visibility: "+" },
        { id: "lib-fine-meth-1", name: "getPolicy", returnType: "string", params: [], visibility: "+" },
      ],
      x: 650,
      y: 300,
    },
    {
      id: "lib-reservation",
      name: "Reservation",
      stereotype: "class",
      attributes: [
        { id: "lib-reservation-attr-0", name: "id", type: "string", visibility: "-" },
        { id: "lib-reservation-attr-1", name: "member", type: "Member", visibility: "-" },
        { id: "lib-reservation-attr-2", name: "book", type: "Book", visibility: "-" },
        { id: "lib-reservation-attr-3", name: "status", type: "ReservationStatus", visibility: "-" },
      ],
      methods: [
        { id: "lib-reservation-meth-0", name: "fulfill", returnType: "void", params: [], visibility: "+" },
        { id: "lib-reservation-meth-1", name: "cancel", returnType: "void", params: [], visibility: "+" },
      ],
      x: 50,
      y: 550,
    },
    {
      id: "lib-catalog",
      name: "Catalog",
      stereotype: "class",
      attributes: [
        { id: "lib-catalog-attr-0", name: "books", type: "Map<string, Book>", visibility: "-" },
        { id: "lib-catalog-attr-1", name: "titleIndex", type: "Map<string, Book[]>", visibility: "-" },
      ],
      methods: [
        { id: "lib-catalog-meth-0", name: "searchByTitle", returnType: "Book[]", params: ["title: string"], visibility: "+" },
        { id: "lib-catalog-meth-1", name: "searchByAuthor", returnType: "Book[]", params: ["author: string"], visibility: "+" },
        { id: "lib-catalog-meth-2", name: "searchByISBN", returnType: "Book", params: ["isbn: string"], visibility: "+" },
      ],
      x: 350,
      y: 550,
    },
    {
      id: "lib-notification",
      name: "NotificationService",
      stereotype: "class",
      attributes: [
        { id: "lib-notification-attr-0", name: "subscribers", type: "Map<string, Member[]>", visibility: "-" },
        { id: "lib-notification-attr-1", name: "channel", type: "NotificationChannel", visibility: "-" },
      ],
      methods: [
        { id: "lib-notification-meth-0", name: "notifyAvailable", returnType: "void", params: ["book: Book"], visibility: "+" },
        { id: "lib-notification-meth-1", name: "notifyOverdue", returnType: "void", params: ["loan: Loan"], visibility: "+" },
      ],
      x: 650,
      y: 550,
    },
  ],
  starterRelationships: [
    { id: rid(), source: "lib-library", target: "lib-catalog", type: "composition" },
    { id: rid(), source: "lib-catalog", target: "lib-book", type: "aggregation", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "lib-library", target: "lib-member", type: "aggregation", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "lib-member", target: "lib-loan", type: "association", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "lib-loan", target: "lib-bookitem", type: "association" },
    { id: rid(), source: "lib-book", target: "lib-bookitem", type: "composition", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "lib-loan", target: "lib-fine", type: "dependency", label: "uses" },
    { id: rid(), source: "lib-member", target: "lib-reservation", type: "association", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "lib-reservation", target: "lib-book", type: "association" },
    { id: rid(), source: "lib-library", target: "lib-notification", type: "composition" },
    { id: rid(), source: "lib-notification", target: "lib-member", type: "dependency", label: "notifies" },
  ],
  hints: [
    "Start by identifying the core entities: Library, Book, Member, and Loan. A Library catalogs Books and registers Members; Members borrow Books via Loan records.",
    "Separate Book (the title/ISBN metadata) from BookItem (individual physical copy with a barcode and status). One Book has many BookItems. This is a key modeling insight interviewers look for.",
    "Add a Catalog class that indexes books by title, author, and ISBN for efficient search. The Library delegates searches to the Catalog.",
    "Use the State pattern for BookItem lifecycle: Available, Loaned, Reserved, and Lost. Each state defines which transitions are valid (e.g., Available -> Loaned, Loaned -> Available or Lost).",
    "Apply the Strategy pattern for fine calculation via a FineCalculator interface. Implement FlatRateFine, PerDayFine, and CappedFine so fine policies are easily swappable.",
    "Use the Observer pattern for notifications: when a reserved book is returned, the NotificationService alerts the member who reserved it. Also notify members of overdue loans.",
    "Handle concurrency: what if two members try to borrow the last copy simultaneously? Synchronize checkout operations. Also handle maximum loans per member, lost book penalties, and reservation queues with FIFO ordering.",
  ],
  complexityAnalysis:
    "**Search by title/author:** O(1) HashMap lookup + O(R) results where R = matching books with indexed Catalog. " +
    "**Search by ISBN:** O(1) HashMap lookup. " +
    "**Checkout (borrow):** O(1) -- update BookItem status and create Loan record. " +
    "**Return:** O(1) -- update BookItem status, calculate fine if overdue. " +
    "**Overdue check (batch):** O(L) scanning all L active loans. " +
    "**Reservation fulfillment:** O(1) per reservation with a queue per Book. " +
    "**Space:** O(B) for B books + O(I) for I book items + O(M) for M members + O(L) for L active loans.",
};

// ═════════════════════════════════════════════════════════════
//  6. ATM System
// ═════════════════════════════════════════════════════════════

const atm: LLDProblem = {
  id: "prob-atm",
  name: "ATM System",
  difficulty: 3,
  description:
    "There are 3 million ATMs worldwide, each processing withdrawals in under 8 seconds. " +
    "The machine must authenticate via card+PIN, dispense the right denomination mix for $370, " +
    "and handle the case where it runs out of $20 bills mid-transaction. " +
    "Design the full ATM system: authentication, balance inquiry, withdrawal, deposit, " +
    "and transfers with proper state management and transaction history.",
  requirements: [
    "Authenticate users via card and PIN",
    "Support balance inquiry, withdrawal, deposit, and transfer operations",
    "Manage cash dispenser with different denominations",
    "Maintain transaction history with timestamps",
    "Handle concurrent access and insufficient funds gracefully",
  ],
  slug: "atm",
  seoDifficulty: "medium",
  category: "object-modeling",
  keyPatterns: ["State", "Chain of Responsibility", "Strategy", "Command"],
  interviewFrequency: "medium",
  classCount: 13,
  relatedProblems: ["vending-machine", "stock-brokerage", "hotel-booking"],
  starterClasses: [
    {
      id: "atm-machine",
      name: "ATM",
      stereotype: "class",
      attributes: [
        { id: "atm-machine-attr-0", name: "id", type: "string", visibility: "-" },
        { id: "atm-machine-attr-1", name: "cashDispenser", type: "CashDispenser", visibility: "-" },
        { id: "atm-machine-attr-2", name: "state", type: "ATMState", visibility: "-" },
      ],
      methods: [
        { id: "atm-machine-meth-0", name: "insertCard", returnType: "void", params: ["card: Card"], visibility: "+" },
        { id: "atm-machine-meth-1", name: "authenticate", returnType: "boolean", params: ["pin: string"], visibility: "+" },
        { id: "atm-machine-meth-2", name: "selectTransaction", returnType: "void", params: ["type: TransactionType"], visibility: "+" },
      ],
      x: 50,
      y: 50,
    },
    {
      id: "atm-account",
      name: "Account",
      stereotype: "class",
      attributes: [
        { id: "atm-account-attr-0", name: "accountNumber", type: "string", visibility: "-" },
        { id: "atm-account-attr-1", name: "balance", type: "number", visibility: "-" },
        { id: "atm-account-attr-2", name: "holder", type: "string", visibility: "-" },
      ],
      methods: [
        { id: "atm-account-meth-0", name: "withdraw", returnType: "boolean", params: ["amount: number"], visibility: "+" },
        { id: "atm-account-meth-1", name: "deposit", returnType: "void", params: ["amount: number"], visibility: "+" },
        { id: "atm-account-meth-2", name: "getBalance", returnType: "number", params: [], visibility: "+" },
      ],
      x: 400,
      y: 50,
    },
    {
      id: "atm-transaction",
      name: "Transaction",
      stereotype: "abstract",
      attributes: [
        { id: "atm-transaction-attr-0", name: "id", type: "string", visibility: "-" },
        { id: "atm-transaction-attr-1", name: "amount", type: "number", visibility: "-" },
        { id: "atm-transaction-attr-2", name: "timestamp", type: "Date", visibility: "-" },
      ],
      methods: [
        { id: "atm-transaction-meth-0", name: "execute", returnType: "boolean", params: [], visibility: "+", isAbstract: true },
        { id: "atm-transaction-meth-1", name: "getReceipt", returnType: "string", params: [], visibility: "+" },
      ],
      x: 200,
      y: 300,
    },
    {
      id: "atm-card",
      name: "Card",
      stereotype: "class",
      attributes: [
        { id: "atm-card-attr-0", name: "cardNumber", type: "string", visibility: "-" },
        { id: "atm-card-attr-1", name: "pin", type: "string", visibility: "-" },
        { id: "atm-card-attr-2", name: "account", type: "Account", visibility: "-" },
      ],
      methods: [
        { id: "atm-card-meth-0", name: "validatePin", returnType: "boolean", params: ["pin: string"], visibility: "+" },
        { id: "atm-card-meth-1", name: "isBlocked", returnType: "boolean", params: [], visibility: "+" },
      ],
      x: 400,
      y: 300,
    },
    {
      id: "atm-dispenser",
      name: "CashDispenser",
      stereotype: "class",
      attributes: [
        { id: "atm-dispenser-attr-0", name: "denominations", type: "Map<number, number>", visibility: "-" },
        { id: "atm-dispenser-attr-1", name: "totalCash", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "atm-dispenser-meth-0", name: "dispense", returnType: "boolean", params: ["amount: number"], visibility: "+" },
        { id: "atm-dispenser-meth-1", name: "canDispense", returnType: "boolean", params: ["amount: number"], visibility: "+" },
        { id: "atm-dispenser-meth-2", name: "reload", returnType: "void", params: ["denomination: number", "count: number"], visibility: "+" },
      ],
      x: 600,
      y: 50,
    },
    {
      id: "atm-screen",
      name: "Screen",
      stereotype: "class",
      attributes: [
        { id: "atm-screen-attr-0", name: "message", type: "string", visibility: "-" },
        { id: "atm-screen-attr-1", name: "options", type: "string[]", visibility: "-" },
      ],
      methods: [
        { id: "atm-screen-meth-0", name: "displayMessage", returnType: "void", params: ["msg: string"], visibility: "+" },
        { id: "atm-screen-meth-1", name: "displayOptions", returnType: "void", params: ["options: string[]"], visibility: "+" },
      ],
      x: 600,
      y: 300,
    },
    {
      id: "atm-keypad",
      name: "Keypad",
      stereotype: "class",
      attributes: [
        { id: "atm-keypad-attr-0", name: "buffer", type: "string", visibility: "-" },
        { id: "atm-keypad-attr-1", name: "masked", type: "boolean", visibility: "-" },
      ],
      methods: [
        { id: "atm-keypad-meth-0", name: "getInput", returnType: "string", params: [], visibility: "+" },
        { id: "atm-keypad-meth-1", name: "clear", returnType: "void", params: [], visibility: "+" },
      ],
      x: 50,
      y: 500,
    },
    {
      id: "atm-bank",
      name: "BankNetwork",
      stereotype: "class",
      attributes: [
        { id: "atm-bank-attr-0", name: "bankId", type: "string", visibility: "-" },
        { id: "atm-bank-attr-1", name: "endpoint", type: "string", visibility: "-" },
      ],
      methods: [
        { id: "atm-bank-meth-0", name: "verifyAccount", returnType: "Account", params: ["cardNumber: string"], visibility: "+" },
        { id: "atm-bank-meth-1", name: "processTransaction", returnType: "boolean", params: ["transaction: Transaction"], visibility: "+" },
      ],
      x: 400,
      y: 500,
    },
    {
      id: "atm-receipt",
      name: "ReceiptPrinter",
      stereotype: "class",
      attributes: [
        { id: "atm-receipt-attr-0", name: "paperLevel", type: "number", visibility: "-" },
        { id: "atm-receipt-attr-1", name: "enabled", type: "boolean", visibility: "-" },
      ],
      methods: [
        { id: "atm-receipt-meth-0", name: "printReceipt", returnType: "void", params: ["transaction: Transaction"], visibility: "+" },
        { id: "atm-receipt-meth-1", name: "hasPaper", returnType: "boolean", params: [], visibility: "+" },
      ],
      x: 600,
      y: 500,
    },
  ],
  starterRelationships: [
    { id: rid(), source: "atm-machine", target: "atm-account", type: "dependency", label: "accesses" },
    { id: rid(), source: "atm-machine", target: "atm-transaction", type: "dependency", label: "creates" },
    { id: rid(), source: "atm-transaction", target: "atm-account", type: "association" },
    { id: rid(), source: "atm-card", target: "atm-account", type: "association" },
    { id: rid(), source: "atm-machine", target: "atm-dispenser", type: "composition" },
    { id: rid(), source: "atm-machine", target: "atm-screen", type: "composition" },
    { id: rid(), source: "atm-machine", target: "atm-keypad", type: "composition" },
    { id: rid(), source: "atm-machine", target: "atm-receipt", type: "composition" },
    { id: rid(), source: "atm-machine", target: "atm-bank", type: "dependency", label: "communicates" },
    { id: rid(), source: "atm-bank", target: "atm-account", type: "dependency", label: "verifies" },
  ],
  hints: [
    "Start by identifying the core entities: ATM, Card, Account, and Transaction. The ATM authenticates via Card+PIN and then performs Transactions on an Account.",
    "Model the physical ATM components as separate classes: Screen (displays messages), Keypad (reads input), CashDispenser (manages bills), and ReceiptPrinter. These are composed by the ATM.",
    "Use the State pattern for the ATM lifecycle: IdleState, CardInsertedState, PINVerificationState, TransactionSelectionState, and ProcessingState. Each state defines valid actions and transitions.",
    "Create abstract Transaction with concrete subclasses: WithdrawalTransaction, DepositTransaction, BalanceInquiry, and TransferTransaction. This is the Command pattern -- each transaction encapsulates an operation.",
    "Apply Chain of Responsibility for cash dispensing: a chain of DenominationHandlers (100 -> 50 -> 20 -> 10) each dispenses as many bills as possible before passing the remainder to the next handler.",
    "Add BankNetwork as an external service that verifies accounts and processes transactions. This decouples the ATM from bank-specific logic and supports multiple banks.",
    "Handle edge cases: incorrect PIN with 3-retry limit (then card is retained), insufficient funds, cash dispenser running out of a denomination mid-transaction, network timeout to bank, and concurrent access to the same account from two ATMs.",
  ],
  complexityAnalysis:
    "**PIN verification:** O(1) -- compare entered PIN with stored hash. " +
    "**Balance inquiry:** O(1) -- read account balance. " +
    "**Withdrawal:** O(D) where D = number of denomination types for cash dispensing via Chain of Responsibility. " +
    "**Deposit:** O(1) -- update account balance. " +
    "**Transfer:** O(1) -- debit source and credit destination atomically. " +
    "**Cash dispensing (Chain of Responsibility):** O(D) passing through D denomination handlers; D is typically 4. " +
    "**Space:** O(D) for denomination inventory + O(T) for transaction history where T = transactions processed.",
};

// ═════════════════════════════════════════════════════════════
//  7. Hotel Reservation
// ═════════════════════════════════════════════════════════════

const hotel: LLDProblem = {
  id: "prob-hotel",
  name: "Hotel Reservation System",
  difficulty: 3,
  description:
    "Marriott operates 8,000+ properties with 1.5 million rooms. During peak season, " +
    "their system handles 500,000 booking attempts per hour -- overbooking by even 0.1% " +
    "means angry guests with no room. Design a reservation system that manages room inventory, " +
    "prevents double-booking, handles check-in/check-out, and calculates bills with seasonal pricing. " +
    "A common booking-system question at Airbnb, Booking.com, and Amazon.",
  requirements: [
    "Manage rooms of different types (single, double, suite) across floors",
    "Support reservation creation, modification, and cancellation",
    "Handle check-in and check-out with room assignment",
    "Calculate bills with room charges, services, and taxes",
    "Prevent double-booking and overbooking",
  ],
  slug: "hotel-booking",
  seoDifficulty: "medium",
  category: "booking-system",
  keyPatterns: ["Strategy", "Factory Method", "Observer", "State"],
  interviewFrequency: "medium",
  classCount: 15,
  relatedProblems: ["movie-ticket-booking", "airline-booking", "restaurant-management"],
  starterClasses: [
    {
      id: "ht-hotel",
      name: "Hotel",
      stereotype: "class",
      attributes: [
        { id: "ht-hotel-attr-0", name: "name", type: "string", visibility: "-" },
        { id: "ht-hotel-attr-1", name: "rooms", type: "Room[]", visibility: "-" },
        { id: "ht-hotel-attr-2", name: "bookingService", type: "BookingService", visibility: "-" },
      ],
      methods: [
        { id: "ht-hotel-meth-0", name: "searchAvailability", returnType: "Room[]", params: ["checkIn: Date", "checkOut: Date", "type: RoomType"], visibility: "+" },
        { id: "ht-hotel-meth-1", name: "makeReservation", returnType: "Reservation", params: ["guest: Guest", "room: Room", "dates: DateRange"], visibility: "+" },
      ],
      x: 50,
      y: 50,
    },
    {
      id: "ht-room",
      name: "Room",
      stereotype: "class",
      attributes: [
        { id: "ht-room-attr-0", name: "number", type: "string", visibility: "-" },
        { id: "ht-room-attr-1", name: "type", type: "RoomType", visibility: "-" },
        { id: "ht-room-attr-2", name: "pricePerNight", type: "number", visibility: "-" },
        { id: "ht-room-attr-3", name: "status", type: "RoomStatus", visibility: "-" },
        { id: "ht-room-attr-4", name: "floor", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "ht-room-meth-0", name: "isAvailable", returnType: "boolean", params: ["dates: DateRange"], visibility: "+" },
        { id: "ht-room-meth-1", name: "assignGuest", returnType: "void", params: ["guest: Guest"], visibility: "+" },
      ],
      x: 400,
      y: 50,
    },
    {
      id: "ht-roomtype",
      name: "RoomType",
      stereotype: "enum",
      attributes: [
        { id: "ht-roomtype-attr-0", name: "SINGLE", type: "", visibility: "+" },
        { id: "ht-roomtype-attr-1", name: "DOUBLE", type: "", visibility: "+" },
        { id: "ht-roomtype-attr-2", name: "SUITE", type: "", visibility: "+" },
        { id: "ht-roomtype-attr-3", name: "DELUXE", type: "", visibility: "+" },
      ],
      methods: [],
      x: 700,
      y: 50,
    },
    {
      id: "ht-reservation",
      name: "Reservation",
      stereotype: "class",
      attributes: [
        { id: "ht-reservation-attr-0", name: "id", type: "string", visibility: "-" },
        { id: "ht-reservation-attr-1", name: "guest", type: "Guest", visibility: "-" },
        { id: "ht-reservation-attr-2", name: "room", type: "Room", visibility: "-" },
        { id: "ht-reservation-attr-3", name: "checkIn", type: "Date", visibility: "-" },
        { id: "ht-reservation-attr-4", name: "checkOut", type: "Date", visibility: "-" },
        { id: "ht-reservation-attr-5", name: "status", type: "ReservationStatus", visibility: "-" },
      ],
      methods: [
        { id: "ht-reservation-meth-0", name: "confirm", returnType: "void", params: [], visibility: "+" },
        { id: "ht-reservation-meth-1", name: "cancel", returnType: "void", params: [], visibility: "+" },
        { id: "ht-reservation-meth-2", name: "checkInGuest", returnType: "void", params: [], visibility: "+" },
        { id: "ht-reservation-meth-3", name: "checkOutGuest", returnType: "Invoice", params: [], visibility: "+" },
      ],
      x: 200,
      y: 300,
    },
    {
      id: "ht-guest",
      name: "Guest",
      stereotype: "class",
      attributes: [
        { id: "ht-guest-attr-0", name: "id", type: "string", visibility: "-" },
        { id: "ht-guest-attr-1", name: "name", type: "string", visibility: "-" },
        { id: "ht-guest-attr-2", name: "email", type: "string", visibility: "-" },
        { id: "ht-guest-attr-3", name: "phone", type: "string", visibility: "-" },
      ],
      methods: [
        { id: "ht-guest-meth-0", name: "getReservations", returnType: "Reservation[]", params: [], visibility: "+" },
        { id: "ht-guest-meth-1", name: "getActiveReservation", returnType: "Reservation", params: [], visibility: "+" },
      ],
      x: 50,
      y: 300,
    },
    {
      id: "ht-payment",
      name: "Payment",
      stereotype: "class",
      attributes: [
        { id: "ht-payment-attr-0", name: "id", type: "string", visibility: "-" },
        { id: "ht-payment-attr-1", name: "amount", type: "number", visibility: "-" },
        { id: "ht-payment-attr-2", name: "type", type: "PaymentType", visibility: "-" },
        { id: "ht-payment-attr-3", name: "status", type: "PaymentStatus", visibility: "-" },
      ],
      methods: [
        { id: "ht-payment-meth-0", name: "process", returnType: "boolean", params: [], visibility: "+" },
        { id: "ht-payment-meth-1", name: "refund", returnType: "boolean", params: [], visibility: "+" },
      ],
      x: 500,
      y: 300,
    },
    {
      id: "ht-booking-service",
      name: "BookingService",
      stereotype: "class",
      attributes: [
        { id: "ht-bs-attr-0", name: "reservations", type: "Reservation[]", visibility: "-" },
        { id: "ht-bs-attr-1", name: "pricingStrategy", type: "PricingStrategy", visibility: "-" },
      ],
      methods: [
        { id: "ht-bs-meth-0", name: "createReservation", returnType: "Reservation", params: ["guest: Guest", "room: Room", "dates: DateRange"], visibility: "+" },
        { id: "ht-bs-meth-1", name: "cancelReservation", returnType: "void", params: ["reservationId: string"], visibility: "+" },
        { id: "ht-bs-meth-2", name: "findAvailableRooms", returnType: "Room[]", params: ["dates: DateRange", "type: RoomType"], visibility: "+" },
      ],
      x: 50,
      y: 550,
    },
    {
      id: "ht-pricing-strategy",
      name: "PricingStrategy",
      stereotype: "interface",
      attributes: [],
      methods: [
        { id: "ht-ps-meth-0", name: "calculatePrice", returnType: "number", params: ["room: Room", "dates: DateRange"], visibility: "+" },
      ],
      x: 350,
      y: 550,
    },
    {
      id: "ht-invoice",
      name: "Invoice",
      stereotype: "class",
      attributes: [
        { id: "ht-inv-attr-0", name: "id", type: "string", visibility: "-" },
        { id: "ht-inv-attr-1", name: "reservation", type: "Reservation", visibility: "-" },
        { id: "ht-inv-attr-2", name: "lineItems", type: "LineItem[]", visibility: "-" },
        { id: "ht-inv-attr-3", name: "totalAmount", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "ht-inv-meth-0", name: "addLineItem", returnType: "void", params: ["item: LineItem"], visibility: "+" },
        { id: "ht-inv-meth-1", name: "calculateTotal", returnType: "number", params: [], visibility: "+" },
      ],
      x: 600,
      y: 550,
    },
    {
      id: "ht-notification",
      name: "NotificationService",
      stereotype: "class",
      attributes: [
        { id: "ht-notif-attr-0", name: "observers", type: "BookingObserver[]", visibility: "-" },
      ],
      methods: [
        { id: "ht-notif-meth-0", name: "subscribe", returnType: "void", params: ["observer: BookingObserver"], visibility: "+" },
        { id: "ht-notif-meth-1", name: "notifyBookingConfirmed", returnType: "void", params: ["reservation: Reservation"], visibility: "+" },
        { id: "ht-notif-meth-2", name: "notifyCheckOut", returnType: "void", params: ["reservation: Reservation"], visibility: "+" },
      ],
      x: 350,
      y: 750,
    },
  ],
  starterRelationships: [
    { id: rid(), source: "ht-hotel", target: "ht-room", type: "composition", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "ht-room", target: "ht-roomtype", type: "association" },
    { id: rid(), source: "ht-reservation", target: "ht-room", type: "association" },
    { id: rid(), source: "ht-reservation", target: "ht-guest", type: "association" },
    { id: rid(), source: "ht-reservation", target: "ht-payment", type: "association" },
    { id: rid(), source: "ht-hotel", target: "ht-booking-service", type: "composition" },
    { id: rid(), source: "ht-booking-service", target: "ht-pricing-strategy", type: "dependency", label: "uses" },
    { id: rid(), source: "ht-reservation", target: "ht-invoice", type: "association" },
    { id: rid(), source: "ht-notification", target: "ht-reservation", type: "dependency", label: "observes" },
  ],
  hints: [
    "Start by identifying the core entities: Hotel, Room, Guest, and Reservation. Focus on how a guest searches for available rooms across a date range.",
    "Add a RoomType enum (SINGLE, DOUBLE, SUITE, DELUXE) and ensure Room tracks its current status (Available, Reserved, Occupied, Maintenance).",
    "Use the Strategy pattern for pricing: WeekdayPricing, WeekendPricing, SeasonalPricing, each implementing a PricingStrategy interface that computes the nightly rate.",
    "Model the Reservation lifecycle with the State pattern: Pending -> Confirmed -> CheckedIn -> CheckedOut -> Cancelled, where each state defines which transitions are valid.",
    "Add a BookingService class that coordinates availability checks, reservation creation, and double-booking prevention using synchronized room locking.",
    "Consider an Observer pattern to notify housekeeping on checkout, send email confirmations, and trigger billing through a NotificationService.",
    "Handle edge cases: overbooking policy (allow N% overage with waitlist), cancellation fees based on time-to-check-in, and group bookings that reserve multiple rooms atomically.",
  ],
};

// ═════════════════════════════════════════════════════════════
//  8. Snake & Ladder Game
// ═════════════════════════════════════════════════════════════

const snakeLadder: LLDProblem = {
  id: "prob-snake-ladder",
  name: "Snake & Ladder Game",
  difficulty: 2,
  description:
    "Board games seem simple until you model them. Snake & Ladder tests whether you can cleanly separate " +
    "game rules from game state. With 2-4 players, configurable boards, and dice, " +
    "the real challenge is designing a turn engine that handles snake/ladder collisions, " +
    "win detection, and extensibility (what if you add power-ups later?). " +
    "A popular warm-up LLD question at Microsoft, Flipkart, and Paytm.",
  requirements: [
    "Support 2-4 players taking turns",
    "Configurable board size with snakes and ladders at specified positions",
    "Roll one or two dice and move player accordingly",
    "Detect win condition when a player reaches or exceeds the final cell",
  ],
  slug: "snake-ladder",
  seoDifficulty: "easy",
  category: "game-design",
  keyPatterns: ["Template Method", "Strategy", "Observer"],
  interviewFrequency: "medium",
  classCount: 8,
  relatedProblems: ["tic-tac-toe", "chess-game", "snake-game"],
  starterClasses: [
    {
      id: "sl-game",
      name: "Game",
      stereotype: "class",
      attributes: [
        { id: "sl-game-attr-0", name: "board", type: "Board", visibility: "-" },
        { id: "sl-game-attr-1", name: "players", type: "Player[]", visibility: "-" },
        { id: "sl-game-attr-2", name: "currentPlayerIdx", type: "number", visibility: "-" },
        { id: "sl-game-attr-3", name: "status", type: "GameStatus", visibility: "-" },
      ],
      methods: [
        { id: "sl-game-meth-0", name: "play", returnType: "Player", params: [], visibility: "+" },
        { id: "sl-game-meth-1", name: "takeTurn", returnType: "boolean", params: [], visibility: "-" },
        { id: "sl-game-meth-2", name: "isGameOver", returnType: "boolean", params: [], visibility: "+" },
      ],
      x: 50,
      y: 50,
    },
    {
      id: "sl-board",
      name: "Board",
      stereotype: "class",
      attributes: [
        { id: "sl-board-attr-0", name: "size", type: "number", visibility: "-" },
        { id: "sl-board-attr-1", name: "cells", type: "Cell[]", visibility: "-" },
      ],
      methods: [
        { id: "sl-board-meth-0", name: "getNextPosition", returnType: "number", params: ["position: number"], visibility: "+" },
        { id: "sl-board-meth-1", name: "addSnake", returnType: "void", params: ["snake: Snake"], visibility: "+" },
        { id: "sl-board-meth-2", name: "addLadder", returnType: "void", params: ["ladder: Ladder"], visibility: "+" },
      ],
      x: 350,
      y: 50,
    },
    {
      id: "sl-cell",
      name: "Cell",
      stereotype: "class",
      attributes: [
        { id: "sl-cell-attr-0", name: "position", type: "number", visibility: "-" },
        { id: "sl-cell-attr-1", name: "boardEntity", type: "BoardEntity", visibility: "-" },
      ],
      methods: [
        { id: "sl-cell-meth-0", name: "hasEntity", returnType: "boolean", params: [], visibility: "+" },
        { id: "sl-cell-meth-1", name: "getDestination", returnType: "number", params: [], visibility: "+" },
      ],
      x: 600,
      y: 50,
    },
    {
      id: "sl-board-entity",
      name: "BoardEntity",
      stereotype: "abstract",
      attributes: [
        { id: "sl-be-attr-0", name: "start", type: "number", visibility: "#" },
        { id: "sl-be-attr-1", name: "end", type: "number", visibility: "#" },
      ],
      methods: [
        { id: "sl-be-meth-0", name: "getEnd", returnType: "number", params: [], visibility: "+" },
      ],
      x: 800,
      y: 50,
    },
    {
      id: "sl-player",
      name: "Player",
      stereotype: "class",
      attributes: [
        { id: "sl-player-attr-0", name: "name", type: "string", visibility: "-" },
        { id: "sl-player-attr-1", name: "position", type: "number", visibility: "-" },
        { id: "sl-player-attr-2", name: "id", type: "string", visibility: "-" },
      ],
      methods: [
        { id: "sl-player-meth-0", name: "move", returnType: "void", params: ["steps: number"], visibility: "+" },
        { id: "sl-player-meth-1", name: "getPosition", returnType: "number", params: [], visibility: "+" },
      ],
      x: 50,
      y: 280,
    },
    {
      id: "sl-dice",
      name: "Dice",
      stereotype: "class",
      attributes: [
        { id: "sl-dice-attr-0", name: "count", type: "number", visibility: "-" },
        { id: "sl-dice-attr-1", name: "faces", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "sl-dice-meth-0", name: "roll", returnType: "number", params: [], visibility: "+" },
      ],
      x: 350,
      y: 280,
    },
    {
      id: "sl-snake",
      name: "Snake",
      stereotype: "class",
      attributes: [
        { id: "sl-snake-attr-0", name: "head", type: "number", visibility: "-" },
        { id: "sl-snake-attr-1", name: "tail", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "sl-snake-meth-0", name: "getEnd", returnType: "number", params: [], visibility: "+" },
      ],
      x: 600,
      y: 280,
    },
    {
      id: "sl-ladder",
      name: "Ladder",
      stereotype: "class",
      attributes: [
        { id: "sl-ladder-attr-0", name: "bottom", type: "number", visibility: "-" },
        { id: "sl-ladder-attr-1", name: "top", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "sl-ladder-meth-0", name: "getEnd", returnType: "number", params: [], visibility: "+" },
      ],
      x: 800,
      y: 280,
    },
    {
      id: "sl-gamestatus",
      name: "GameStatus",
      stereotype: "enum",
      attributes: [
        { id: "sl-gs-attr-0", name: "NOT_STARTED", type: "", visibility: "+" },
        { id: "sl-gs-attr-1", name: "IN_PROGRESS", type: "", visibility: "+" },
        { id: "sl-gs-attr-2", name: "FINISHED", type: "", visibility: "+" },
      ],
      methods: [],
      x: 50,
      y: 480,
    },
  ],
  starterRelationships: [
    { id: rid(), source: "sl-game", target: "sl-board", type: "composition" },
    { id: rid(), source: "sl-game", target: "sl-player", type: "aggregation", sourceCardinality: "1", targetCardinality: "2..4" },
    { id: rid(), source: "sl-game", target: "sl-dice", type: "composition" },
    { id: rid(), source: "sl-board", target: "sl-cell", type: "composition", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "sl-snake", target: "sl-board-entity", type: "inheritance" },
    { id: rid(), source: "sl-ladder", target: "sl-board-entity", type: "inheritance" },
    { id: rid(), source: "sl-cell", target: "sl-board-entity", type: "association", label: "may contain" },
    { id: rid(), source: "sl-game", target: "sl-gamestatus", type: "association" },
  ],
  hints: [
    "Start with the Board and Cell classes. Each Cell has a position number; the Board holds all cells and provides getNextPosition(pos) to resolve movement.",
    "Model Snake and Ladder as subclasses of a common BoardEntity abstract class with start and end positions; the Board resolves movement by checking if a cell has an entity.",
    "Use the Template Method pattern in Game.takeTurn(): roll dice, compute new position, check for snake/ladder, check for win -- each step is a separate method.",
    "Add a DiceStrategy interface so you can swap between single-die and double-dice modes, or even a loaded die for testing.",
    "Track GameStatus (NOT_STARTED, IN_PROGRESS, FINISHED) and validate that moves only happen in valid states.",
    "Add an Observer for position updates so a UI or logger can react to player movements, snake bites, and ladder climbs without coupling to the Game class.",
    "Handle edge cases: snake at position 99 (near-win setback), ladder to the exact winning position, and the rule that a roll exceeding the final cell means the player stays put.",
  ],
};

// ═════════════════════════════════════════════════════════════
//  9. File System
// ═════════════════════════════════════════════════════════════

const fileSystem: LLDProblem = {
  id: "prob-file-system",
  name: "File System",
  difficulty: 4,
  description:
    "Linux's ext4 file system manages billions of files across millions of servers. " +
    "Every 'ls', 'mkdir', and 'rm' command hits a tree of inodes and directory entries. " +
    "Design an in-memory file system with files, directories, and nested hierarchies " +
    "supporting create, delete, move, and search. This is the textbook Composite pattern problem -- " +
    "and a favorite at Google, Meta, and Dropbox. Get the recursive structure right and the operations fall into place.",
  requirements: [
    "Support files and directories in a hierarchical tree structure",
    "Implement create, delete, rename, and move operations",
    "Support path-based navigation (absolute and relative paths)",
    "Calculate directory sizes recursively",
    "Search for files by name pattern or extension",
  ],
  slug: "file-system",
  seoDifficulty: "hard",
  category: "infrastructure",
  keyPatterns: ["Composite", "Iterator", "Visitor", "Command"],
  interviewFrequency: "medium",
  classCount: 14,
  relatedProblems: ["logging-framework", "spreadsheet", "cache-system"],
  starterClasses: [
    {
      id: "fs-entry",
      name: "FileSystemEntry",
      stereotype: "abstract",
      attributes: [
        { id: "fs-entry-attr-0", name: "name", type: "string", visibility: "#" },
        { id: "fs-entry-attr-1", name: "parent", type: "Directory", visibility: "#" },
        { id: "fs-entry-attr-2", name: "createdAt", type: "Date", visibility: "#" },
        { id: "fs-entry-attr-3", name: "permissions", type: "Permission", visibility: "#" },
      ],
      methods: [
        { id: "fs-entry-meth-0", name: "getPath", returnType: "string", params: [], visibility: "+" },
        { id: "fs-entry-meth-1", name: "getSize", returnType: "number", params: [], visibility: "+", isAbstract: true },
        { id: "fs-entry-meth-2", name: "delete", returnType: "void", params: [], visibility: "+" },
        { id: "fs-entry-meth-3", name: "accept", returnType: "void", params: ["visitor: FileSystemVisitor"], visibility: "+", isAbstract: true },
      ],
      x: 300,
      y: 50,
    },
    {
      id: "fs-file",
      name: "File",
      stereotype: "class",
      attributes: [
        { id: "fs-file-attr-0", name: "content", type: "string", visibility: "-" },
        { id: "fs-file-attr-1", name: "extension", type: "string", visibility: "-" },
        { id: "fs-file-attr-2", name: "sizeBytes", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "fs-file-meth-0", name: "getSize", returnType: "number", params: [], visibility: "+" },
        { id: "fs-file-meth-1", name: "read", returnType: "string", params: [], visibility: "+" },
        { id: "fs-file-meth-2", name: "write", returnType: "void", params: ["data: string"], visibility: "+" },
        { id: "fs-file-meth-3", name: "accept", returnType: "void", params: ["visitor: FileSystemVisitor"], visibility: "+" },
      ],
      x: 100,
      y: 300,
    },
    {
      id: "fs-dir",
      name: "Directory",
      stereotype: "class",
      attributes: [
        { id: "fs-dir-attr-0", name: "children", type: "FileSystemEntry[]", visibility: "-" },
      ],
      methods: [
        { id: "fs-dir-meth-0", name: "getSize", returnType: "number", params: [], visibility: "+" },
        { id: "fs-dir-meth-1", name: "add", returnType: "void", params: ["entry: FileSystemEntry"], visibility: "+" },
        { id: "fs-dir-meth-2", name: "remove", returnType: "void", params: ["name: string"], visibility: "+" },
        { id: "fs-dir-meth-3", name: "find", returnType: "FileSystemEntry", params: ["name: string"], visibility: "+" },
        { id: "fs-dir-meth-4", name: "accept", returnType: "void", params: ["visitor: FileSystemVisitor"], visibility: "+" },
        { id: "fs-dir-meth-5", name: "list", returnType: "FileSystemEntry[]", params: [], visibility: "+" },
      ],
      x: 500,
      y: 300,
    },
    {
      id: "fs-filesystem",
      name: "FileSystem",
      stereotype: "class",
      attributes: [
        { id: "fs-fs-attr-0", name: "root", type: "Directory", visibility: "-" },
        { id: "fs-fs-attr-1", name: "currentDir", type: "Directory", visibility: "-" },
      ],
      methods: [
        { id: "fs-fs-meth-0", name: "createFile", returnType: "File", params: ["path: string", "content: string"], visibility: "+" },
        { id: "fs-fs-meth-1", name: "createDirectory", returnType: "Directory", params: ["path: string"], visibility: "+" },
        { id: "fs-fs-meth-2", name: "resolve", returnType: "FileSystemEntry", params: ["path: string"], visibility: "+" },
        { id: "fs-fs-meth-3", name: "move", returnType: "void", params: ["src: string", "dest: string"], visibility: "+" },
      ],
      x: 300,
      y: 550,
    },
    {
      id: "fs-path",
      name: "Path",
      stereotype: "class",
      attributes: [
        { id: "fs-path-attr-0", name: "segments", type: "string[]", visibility: "-" },
        { id: "fs-path-attr-1", name: "isAbsolute", type: "boolean", visibility: "-" },
      ],
      methods: [
        { id: "fs-path-meth-0", name: "resolve", returnType: "Path", params: ["relativePath: string"], visibility: "+" },
        { id: "fs-path-meth-1", name: "getParent", returnType: "Path", params: [], visibility: "+" },
        { id: "fs-path-meth-2", name: "toString", returnType: "string", params: [], visibility: "+" },
      ],
      x: 50,
      y: 550,
    },
    {
      id: "fs-permission",
      name: "Permission",
      stereotype: "class",
      attributes: [
        { id: "fs-perm-attr-0", name: "owner", type: "User", visibility: "-" },
        { id: "fs-perm-attr-1", name: "readAllowed", type: "boolean", visibility: "-" },
        { id: "fs-perm-attr-2", name: "writeAllowed", type: "boolean", visibility: "-" },
        { id: "fs-perm-attr-3", name: "executeAllowed", type: "boolean", visibility: "-" },
      ],
      methods: [
        { id: "fs-perm-meth-0", name: "canRead", returnType: "boolean", params: ["user: User"], visibility: "+" },
        { id: "fs-perm-meth-1", name: "canWrite", returnType: "boolean", params: ["user: User"], visibility: "+" },
      ],
      x: 600,
      y: 550,
    },
    {
      id: "fs-user",
      name: "User",
      stereotype: "class",
      attributes: [
        { id: "fs-user-attr-0", name: "id", type: "string", visibility: "-" },
        { id: "fs-user-attr-1", name: "name", type: "string", visibility: "-" },
      ],
      methods: [
        { id: "fs-user-meth-0", name: "hasPermission", returnType: "boolean", params: ["entry: FileSystemEntry", "action: string"], visibility: "+" },
      ],
      x: 800,
      y: 550,
    },
    {
      id: "fs-visitor",
      name: "FileSystemVisitor",
      stereotype: "interface",
      attributes: [],
      methods: [
        { id: "fs-vis-meth-0", name: "visitFile", returnType: "void", params: ["file: File"], visibility: "+" },
        { id: "fs-vis-meth-1", name: "visitDirectory", returnType: "void", params: ["dir: Directory"], visibility: "+" },
      ],
      x: 300,
      y: 750,
    },
    {
      id: "fs-search-visitor",
      name: "SearchVisitor",
      stereotype: "class",
      attributes: [
        { id: "fs-sv-attr-0", name: "pattern", type: "string", visibility: "-" },
        { id: "fs-sv-attr-1", name: "results", type: "FileSystemEntry[]", visibility: "-" },
      ],
      methods: [
        { id: "fs-sv-meth-0", name: "visitFile", returnType: "void", params: ["file: File"], visibility: "+" },
        { id: "fs-sv-meth-1", name: "visitDirectory", returnType: "void", params: ["dir: Directory"], visibility: "+" },
        { id: "fs-sv-meth-2", name: "getResults", returnType: "FileSystemEntry[]", params: [], visibility: "+" },
      ],
      x: 100,
      y: 750,
    },
    {
      id: "fs-size-visitor",
      name: "SizeVisitor",
      stereotype: "class",
      attributes: [
        { id: "fs-szv-attr-0", name: "totalSize", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "fs-szv-meth-0", name: "visitFile", returnType: "void", params: ["file: File"], visibility: "+" },
        { id: "fs-szv-meth-1", name: "visitDirectory", returnType: "void", params: ["dir: Directory"], visibility: "+" },
        { id: "fs-szv-meth-2", name: "getTotalSize", returnType: "number", params: [], visibility: "+" },
      ],
      x: 550,
      y: 750,
    },
  ],
  starterRelationships: [
    { id: rid(), source: "fs-file", target: "fs-entry", type: "inheritance" },
    { id: rid(), source: "fs-dir", target: "fs-entry", type: "inheritance" },
    { id: rid(), source: "fs-dir", target: "fs-entry", type: "composition", label: "contains", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "fs-filesystem", target: "fs-dir", type: "composition", label: "root" },
    { id: rid(), source: "fs-entry", target: "fs-permission", type: "association" },
    { id: rid(), source: "fs-permission", target: "fs-user", type: "association" },
    { id: rid(), source: "fs-search-visitor", target: "fs-visitor", type: "realization" },
    { id: rid(), source: "fs-size-visitor", target: "fs-visitor", type: "realization" },
    { id: rid(), source: "fs-filesystem", target: "fs-path", type: "dependency", label: "uses" },
  ],
  hints: [
    "This is a textbook Composite pattern: Directory is the composite, File is the leaf, and FileSystemEntry is the component. Start by defining the abstract getSize() method.",
    "Add a Visitor interface (FileSystemVisitor) with visitFile(File) and visitDirectory(Directory) methods so operations like search and size calculation can be added without modifying the tree classes.",
    "Model paths as a utility class that parses strings like '/home/user/file.txt' and resolves '..' for relative navigation. Separate absolute vs relative paths.",
    "Add a Permission class with owner, read, write, execute flags. Each FileSystemEntry holds a Permission and checks access before operations.",
    "Create a FileSystem facade class that holds the root Directory, tracks the current directory, and provides high-level operations (createFile, mkdir, move, resolve paths).",
    "Implement SearchVisitor and SizeVisitor as concrete visitors. SearchVisitor matches by name pattern or extension; SizeVisitor accumulates total bytes recursively.",
    "Handle edge cases: circular symlinks (detect cycles with a visited set), concurrent access (synchronize write operations), and large directory listing (use an Iterator for lazy traversal).",
  ],
};

// ═════════════════════════════════════════════════════════════
//  10. LRU Cache
// ═════════════════════════════════════════════════════════════

const lruCache: LLDProblem = {
  id: "prob-lru-cache",
  name: "LRU Cache",
  difficulty: 3,
  slug: "lru-cache",
  seoDifficulty: "medium",
  category: "infrastructure",
  keyPatterns: ["Strategy", "Singleton", "Proxy", "Observer"],
  interviewFrequency: "high",
  classCount: 6,
  relatedProblems: ["cache-system", "rate-limiter", "logging-framework"],
  description:
    "Redis processes 100,000+ operations per second. Every microsecond of lookup time costs money. " +
    "Design a cache that guarantees O(1) get and put while automatically evicting the least recently used item " +
    "when capacity is reached. The trick: combine a HashMap with a Doubly Linked List. " +
    "This is LeetCode #146 and the single most-asked data structure question at Amazon, Google, Meta, and Microsoft.",
  requirements: [
    "Support get(key) and put(key, value) in O(1) time",
    "Evict the least recently used item when capacity is exceeded",
    "Support configurable maximum capacity",
  ],
  starterClasses: [
    {
      id: "lru-cache",
      name: "LRUCache",
      stereotype: "class",
      attributes: [
        { id: "lru-cache-attr-0", name: "capacity", type: "number", visibility: "-" },
        { id: "lru-cache-attr-1", name: "map", type: "Map<K, Node<K,V>>", visibility: "-" },
        { id: "lru-cache-attr-2", name: "list", type: "DoublyLinkedList<K,V>", visibility: "-" },
        { id: "lru-cache-attr-3", name: "evictionPolicy", type: "EvictionPolicy", visibility: "-" },
      ],
      methods: [
        { id: "lru-cache-meth-0", name: "get", returnType: "V | null", params: ["key: K"], visibility: "+" },
        { id: "lru-cache-meth-1", name: "put", returnType: "void", params: ["key: K", "value: V"], visibility: "+" },
        { id: "lru-cache-meth-2", name: "size", returnType: "number", params: [], visibility: "+" },
        { id: "lru-cache-meth-3", name: "remove", returnType: "boolean", params: ["key: K"], visibility: "+" },
        { id: "lru-cache-meth-4", name: "clear", returnType: "void", params: [], visibility: "+" },
      ],
      x: 50,
      y: 50,
    },
    {
      id: "lru-list",
      name: "DoublyLinkedList",
      stereotype: "class",
      attributes: [
        { id: "lru-list-attr-0", name: "head", type: "Node<K,V>", visibility: "-" },
        { id: "lru-list-attr-1", name: "tail", type: "Node<K,V>", visibility: "-" },
        { id: "lru-list-attr-2", name: "size", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "lru-list-meth-0", name: "addToFront", returnType: "void", params: ["node: Node<K,V>"], visibility: "+" },
        { id: "lru-list-meth-1", name: "removeNode", returnType: "void", params: ["node: Node<K,V>"], visibility: "+" },
        { id: "lru-list-meth-2", name: "removeLast", returnType: "Node<K,V>", params: [], visibility: "+" },
        { id: "lru-list-meth-3", name: "moveToFront", returnType: "void", params: ["node: Node<K,V>"], visibility: "+" },
      ],
      x: 400,
      y: 50,
    },
    {
      id: "lru-node",
      name: "Node",
      stereotype: "class",
      attributes: [
        { id: "lru-node-attr-0", name: "key", type: "K", visibility: "+" },
        { id: "lru-node-attr-1", name: "value", type: "V", visibility: "+" },
        { id: "lru-node-attr-2", name: "prev", type: "Node<K,V>", visibility: "+" },
        { id: "lru-node-attr-3", name: "next", type: "Node<K,V>", visibility: "+" },
      ],
      methods: [],
      x: 400,
      y: 300,
    },
    {
      id: "lru-eviction",
      name: "EvictionPolicy",
      stereotype: "interface",
      attributes: [],
      methods: [
        { id: "lru-ev-meth-0", name: "onAccess", returnType: "void", params: ["key: K"], visibility: "+" },
        { id: "lru-ev-meth-1", name: "onInsert", returnType: "void", params: ["key: K"], visibility: "+" },
        { id: "lru-ev-meth-2", name: "evict", returnType: "K", params: [], visibility: "+" },
      ],
      x: 50,
      y: 300,
    },
    {
      id: "lru-config",
      name: "CacheConfig",
      stereotype: "class",
      attributes: [
        { id: "lru-cfg-attr-0", name: "maxCapacity", type: "number", visibility: "-" },
        { id: "lru-cfg-attr-1", name: "defaultTTL", type: "number", visibility: "-" },
        { id: "lru-cfg-attr-2", name: "evictionPolicy", type: "EvictionPolicy", visibility: "-" },
      ],
      methods: [
        { id: "lru-cfg-meth-0", name: "getMaxCapacity", returnType: "number", params: [], visibility: "+" },
        { id: "lru-cfg-meth-1", name: "getDefaultTTL", returnType: "number", params: [], visibility: "+" },
      ],
      x: 700,
      y: 50,
    },
    {
      id: "lru-entry",
      name: "CacheEntry",
      stereotype: "class",
      attributes: [
        { id: "lru-ent-attr-0", name: "key", type: "K", visibility: "-" },
        { id: "lru-ent-attr-1", name: "value", type: "V", visibility: "-" },
        { id: "lru-ent-attr-2", name: "createdAt", type: "number", visibility: "-" },
        { id: "lru-ent-attr-3", name: "ttl", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "lru-ent-meth-0", name: "isExpired", returnType: "boolean", params: [], visibility: "+" },
        { id: "lru-ent-meth-1", name: "getValue", returnType: "V", params: [], visibility: "+" },
      ],
      x: 700,
      y: 300,
    },
    {
      id: "lru-stats",
      name: "CacheStats",
      stereotype: "class",
      attributes: [
        { id: "lru-st-attr-0", name: "hits", type: "number", visibility: "-" },
        { id: "lru-st-attr-1", name: "misses", type: "number", visibility: "-" },
        { id: "lru-st-attr-2", name: "evictions", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "lru-st-meth-0", name: "recordHit", returnType: "void", params: [], visibility: "+" },
        { id: "lru-st-meth-1", name: "recordMiss", returnType: "void", params: [], visibility: "+" },
        { id: "lru-st-meth-2", name: "getHitRate", returnType: "number", params: [], visibility: "+" },
      ],
      x: 50,
      y: 500,
    },
    {
      id: "lru-ttl",
      name: "TTLManager",
      stereotype: "class",
      attributes: [
        { id: "lru-ttl-attr-0", name: "expirationMap", type: "Map<K, number>", visibility: "-" },
      ],
      methods: [
        { id: "lru-ttl-meth-0", name: "setExpiry", returnType: "void", params: ["key: K", "ttl: number"], visibility: "+" },
        { id: "lru-ttl-meth-1", name: "isExpired", returnType: "boolean", params: ["key: K"], visibility: "+" },
        { id: "lru-ttl-meth-2", name: "cleanExpired", returnType: "K[]", params: [], visibility: "+" },
      ],
      x: 400,
      y: 500,
    },
  ],
  starterRelationships: [
    { id: rid(), source: "lru-cache", target: "lru-list", type: "composition" },
    { id: rid(), source: "lru-list", target: "lru-node", type: "aggregation", sourceCardinality: "1", targetCardinality: "0..*" },
    { id: rid(), source: "lru-cache", target: "lru-node", type: "association", label: "indexes via Map" },
    { id: rid(), source: "lru-cache", target: "lru-eviction", type: "dependency", label: "uses" },
    { id: rid(), source: "lru-cache", target: "lru-config", type: "association" },
    { id: rid(), source: "lru-cache", target: "lru-stats", type: "composition" },
    { id: rid(), source: "lru-cache", target: "lru-ttl", type: "composition" },
    { id: rid(), source: "lru-node", target: "lru-entry", type: "association", label: "wraps" },
  ],
  hints: [
    "The key insight is combining a HashMap (O(1) lookup) with a Doubly Linked List (O(1) insertion/removal) for O(1) on both get and put operations.",
    "Use sentinel head and tail nodes in the doubly linked list to simplify edge-case handling for add/remove -- you never need null checks on prev/next.",
    "Separate the eviction policy behind a Strategy interface (EvictionPolicy) with onAccess, onInsert, and evict methods. LRU is one strategy; LFU and FIFO are others.",
    "Add a CacheEntry wrapper that holds the value alongside metadata like creation time and TTL, so expiration can be checked on access.",
    "Build a TTLManager that tracks per-key expiration timestamps and provides a cleanExpired() method for lazy or periodic purging of stale entries.",
    "Track cache statistics (hits, misses, evictions) in a CacheStats class to support monitoring and tuning of cache capacity.",
    "Handle concurrency: use a ReadWriteLock for thread-safe access -- reads can be concurrent but writes need exclusive access. Consider the cache stampede problem where many threads miss simultaneously.",
  ],
};

// ═════════════════════════════════════════════════════════════
//  11. Movie Ticket Booking
// ═════════════════════════════════════════════════════════════

const movieTicketBooking: LLDProblem = {
  id: "prob-movie-ticket-booking",
  name: "Movie Ticket Booking System",
  difficulty: 3,
  description:
    "BookMyShow sells 30 million tickets per month. When an Avengers movie drops, " +
    "100,000 users compete for the same seats simultaneously. If two people both see seat A12 as available " +
    "and both click 'Book', only one should win. Design a ticket booking system with theater management, " +
    "seat selection, showtime scheduling, and payment processing that handles this concurrency gracefully. " +
    "A high-frequency question at Amazon, Flipkart, and BookMyShow.",
  requirements: [
    "Browse movies and view available showtimes at theaters",
    "Display seat maps and allow seat selection for a showtime",
    "Temporarily lock selected seats during the booking process",
    "Process payment and generate tickets with unique booking IDs",
    "Handle concurrent seat selections with optimistic locking",
  ],
  slug: "movie-ticket-booking",
  seoDifficulty: "medium",
  category: "booking-system",
  keyPatterns: ["Strategy", "Observer", "Factory Method", "Singleton"],
  interviewFrequency: "high",
  classCount: 14,
  relatedProblems: ["hotel-booking", "airline-booking", "restaurant-management"],
  starterClasses: [
    {
      id: "mtb-movie",
      name: "Movie",
      stereotype: "class",
      attributes: [
        { id: "mtb-movie-attr-0", name: "id", type: "string", visibility: "-" },
        { id: "mtb-movie-attr-1", name: "title", type: "string", visibility: "-" },
        { id: "mtb-movie-attr-2", name: "genre", type: "Genre", visibility: "-" },
        { id: "mtb-movie-attr-3", name: "durationMinutes", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "mtb-movie-meth-0", name: "getShowtimes", returnType: "ShowTime[]", params: ["theater: Theater"], visibility: "+" },
      ],
      x: 50,
      y: 50,
    },
    {
      id: "mtb-theater",
      name: "Theater",
      stereotype: "class",
      attributes: [
        { id: "mtb-theater-attr-0", name: "id", type: "string", visibility: "-" },
        { id: "mtb-theater-attr-1", name: "name", type: "string", visibility: "-" },
        { id: "mtb-theater-attr-2", name: "screens", type: "Screen[]", visibility: "-" },
      ],
      methods: [
        { id: "mtb-theater-meth-0", name: "getAvailableShows", returnType: "ShowTime[]", params: ["date: Date"], visibility: "+" },
      ],
      x: 350,
      y: 50,
    },
    {
      id: "mtb-showtime",
      name: "ShowTime",
      stereotype: "class",
      attributes: [
        { id: "mtb-showtime-attr-0", name: "id", type: "string", visibility: "-" },
        { id: "mtb-showtime-attr-1", name: "movie", type: "Movie", visibility: "-" },
        { id: "mtb-showtime-attr-2", name: "startTime", type: "Date", visibility: "-" },
        { id: "mtb-showtime-attr-3", name: "seats", type: "Seat[]", visibility: "-" },
      ],
      methods: [
        { id: "mtb-showtime-meth-0", name: "getAvailableSeats", returnType: "Seat[]", params: [], visibility: "+" },
      ],
      x: 50,
      y: 280,
    },
    {
      id: "mtb-seat",
      name: "Seat",
      stereotype: "class",
      attributes: [
        { id: "mtb-seat-attr-0", name: "id", type: "string", visibility: "-" },
        { id: "mtb-seat-attr-1", name: "row", type: "string", visibility: "-" },
        { id: "mtb-seat-attr-2", name: "number", type: "number", visibility: "-" },
        { id: "mtb-seat-attr-3", name: "status", type: "SeatStatus", visibility: "-" },
      ],
      methods: [
        { id: "mtb-seat-meth-0", name: "lock", returnType: "boolean", params: ["userId: string"], visibility: "+" },
        { id: "mtb-seat-meth-1", name: "release", returnType: "void", params: [], visibility: "+" },
      ],
      x: 350,
      y: 280,
    },
    {
      id: "mtb-booking",
      name: "Booking",
      stereotype: "class",
      attributes: [
        { id: "mtb-booking-attr-0", name: "id", type: "string", visibility: "-" },
        { id: "mtb-booking-attr-1", name: "showTime", type: "ShowTime", visibility: "-" },
        { id: "mtb-booking-attr-2", name: "seats", type: "Seat[]", visibility: "-" },
        { id: "mtb-booking-attr-3", name: "totalAmount", type: "number", visibility: "-" },
        { id: "mtb-booking-attr-4", name: "status", type: "BookingStatus", visibility: "-" },
      ],
      methods: [
        { id: "mtb-booking-meth-0", name: "confirm", returnType: "void", params: [], visibility: "+" },
        { id: "mtb-booking-meth-1", name: "cancel", returnType: "void", params: [], visibility: "+" },
      ],
      x: 200,
      y: 480,
    },
    {
      id: "mtb-screen",
      name: "Screen",
      stereotype: "class",
      attributes: [
        { id: "mtb-screen-attr-0", name: "id", type: "string", visibility: "-" },
        { id: "mtb-screen-attr-1", name: "name", type: "string", visibility: "-" },
        { id: "mtb-screen-attr-2", name: "totalSeats", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "mtb-screen-meth-0", name: "getShows", returnType: "ShowTime[]", params: ["date: Date"], visibility: "+" },
      ],
      x: 600,
      y: 50,
    },
    {
      id: "mtb-payment",
      name: "Payment",
      stereotype: "class",
      attributes: [
        { id: "mtb-payment-attr-0", name: "id", type: "string", visibility: "-" },
        { id: "mtb-payment-attr-1", name: "amount", type: "number", visibility: "-" },
        { id: "mtb-payment-attr-2", name: "status", type: "PaymentStatus", visibility: "-" },
      ],
      methods: [
        { id: "mtb-payment-meth-0", name: "process", returnType: "boolean", params: [], visibility: "+" },
        { id: "mtb-payment-meth-1", name: "refund", returnType: "boolean", params: [], visibility: "+" },
      ],
      x: 600,
      y: 280,
    },
    {
      id: "mtb-user",
      name: "User",
      stereotype: "class",
      attributes: [
        { id: "mtb-user-attr-0", name: "id", type: "string", visibility: "-" },
        { id: "mtb-user-attr-1", name: "name", type: "string", visibility: "-" },
        { id: "mtb-user-attr-2", name: "email", type: "string", visibility: "-" },
      ],
      methods: [
        { id: "mtb-user-meth-0", name: "getBookingHistory", returnType: "Booking[]", params: [], visibility: "+" },
        { id: "mtb-user-meth-1", name: "makeBooking", returnType: "Booking", params: ["showTime: ShowTime", "seats: Seat[]"], visibility: "+" },
      ],
      x: 50,
      y: 480,
    },
    {
      id: "mtb-ticket",
      name: "Ticket",
      stereotype: "class",
      attributes: [
        { id: "mtb-ticket-attr-0", name: "id", type: "string", visibility: "-" },
        { id: "mtb-ticket-attr-1", name: "booking", type: "Booking", visibility: "-" },
        { id: "mtb-ticket-attr-2", name: "seatInfo", type: "string", visibility: "-" },
        { id: "mtb-ticket-attr-3", name: "qrCode", type: "string", visibility: "-" },
      ],
      methods: [
        { id: "mtb-ticket-meth-0", name: "generateQR", returnType: "string", params: [], visibility: "+" },
        { id: "mtb-ticket-meth-1", name: "validate", returnType: "boolean", params: [], visibility: "+" },
      ],
      x: 450,
      y: 480,
    },
    {
      id: "mtb-seatmap",
      name: "SeatMap",
      stereotype: "class",
      attributes: [
        { id: "mtb-seatmap-attr-0", name: "rows", type: "number", visibility: "-" },
        { id: "mtb-seatmap-attr-1", name: "cols", type: "number", visibility: "-" },
        { id: "mtb-seatmap-attr-2", name: "seats", type: "Seat[][]", visibility: "-" },
      ],
      methods: [
        { id: "mtb-seatmap-meth-0", name: "getAvailableSeats", returnType: "Seat[]", params: [], visibility: "+" },
        { id: "mtb-seatmap-meth-1", name: "getSeatsByType", returnType: "Seat[]", params: ["type: SeatType"], visibility: "+" },
      ],
      x: 800,
      y: 280,
    },
  ],
  starterRelationships: [
    { id: rid(), source: "mtb-theater", target: "mtb-screen", type: "composition", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "mtb-screen", target: "mtb-showtime", type: "aggregation", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "mtb-showtime", target: "mtb-seat", type: "composition", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "mtb-showtime", target: "mtb-movie", type: "association" },
    { id: rid(), source: "mtb-booking", target: "mtb-seat", type: "association", sourceCardinality: "1", targetCardinality: "1..*" },
    { id: rid(), source: "mtb-booking", target: "mtb-payment", type: "association" },
    { id: rid(), source: "mtb-booking", target: "mtb-user", type: "association" },
    { id: rid(), source: "mtb-booking", target: "mtb-ticket", type: "composition", sourceCardinality: "1", targetCardinality: "1..*" },
    { id: rid(), source: "mtb-screen", target: "mtb-seatmap", type: "composition" },
  ],
  hints: [
    "Start by identifying core entities: Movie, Theater, Screen, ShowTime, and Seat. A Theater has multiple Screens, each Screen hosts multiple ShowTimes, and each ShowTime has its own Seat layout.",
    "Use the Strategy pattern for pricing: StandardPricing, WeekendPricing, PremiumScreenPricing, and MatineePricing each implement a PricingStrategy interface.",
    "Add a SeatLock mechanism with TTL (e.g., 10 minutes) so temporarily held seats are auto-released if payment is not completed. This prevents seats from being permanently blocked by abandoned bookings.",
    "Model Booking lifecycle with the State pattern: Pending -> Confirmed -> Cancelled/Expired. Each state defines which transitions are valid and what side effects occur.",
    "Add a User class (with email, phone, bookingHistory) and a Ticket class (with QR code, seat details, show info) that is generated upon successful booking.",
    "Consider an Observer pattern to notify waitlisted users when a booking is cancelled and seats become available, and to send confirmation emails.",
    "Handle concurrent seat selection with optimistic locking: use a version number on each Seat so that if two users try to lock the same seat, only the first succeeds and the second gets a conflict error.",
  ],
};

// ═════════════════════════════════════════════════════════════
//  12. Restaurant Management
// ═════════════════════════════════════════════════════════════

const restaurantManagement: LLDProblem = {
  id: "prob-restaurant-management",
  name: "Restaurant Management System",
  difficulty: 3,
  description:
    "A busy restaurant like Cheesecake Factory serves 1,000+ covers on a Saturday night. " +
    "Orders flow from servers to kitchen display screens, each with special instructions and modifications. " +
    "Tables turn over every 45-90 minutes, and the bill needs to split 6 ways with different tip amounts. " +
    "Design a system that handles reservations, order management, kitchen workflow, " +
    "and billing. Commonly asked at DoorDash, Uber Eats, and Toast.",
  requirements: [
    "Manage table layout with different sizes and sections",
    "Handle table reservations and walk-in seating assignments",
    "Take orders with menu item customization and special instructions",
    "Track order status through kitchen workflow stages",
    "Generate bills with itemized details, taxes, and tip calculation",
  ],
  slug: "restaurant-management",
  seoDifficulty: "medium",
  category: "booking-system",
  keyPatterns: ["Observer", "Command", "Strategy", "State"],
  interviewFrequency: "medium",
  classCount: 13,
  relatedProblems: ["hotel-booking", "movie-ticket-booking", "vending-machine"],
  starterClasses: [
    {
      id: "rm-restaurant",
      name: "Restaurant",
      stereotype: "class",
      attributes: [
        { id: "rm-restaurant-attr-0", name: "name", type: "string", visibility: "-" },
        { id: "rm-restaurant-attr-1", name: "tables", type: "Table[]", visibility: "-" },
        { id: "rm-restaurant-attr-2", name: "menu", type: "Menu", visibility: "-" },
        { id: "rm-restaurant-attr-3", name: "kitchen", type: "Kitchen", visibility: "-" },
      ],
      methods: [
        { id: "rm-restaurant-meth-0", name: "reserveTable", returnType: "Reservation", params: ["partySize: number", "time: Date"], visibility: "+" },
        { id: "rm-restaurant-meth-1", name: "getAvailableTables", returnType: "Table[]", params: ["time: Date"], visibility: "+" },
      ],
      x: 50,
      y: 50,
    },
    {
      id: "rm-table",
      name: "Table",
      stereotype: "class",
      attributes: [
        { id: "rm-table-attr-0", name: "id", type: "string", visibility: "-" },
        { id: "rm-table-attr-1", name: "capacity", type: "number", visibility: "-" },
        { id: "rm-table-attr-2", name: "status", type: "TableStatus", visibility: "-" },
        { id: "rm-table-attr-3", name: "section", type: "string", visibility: "-" },
      ],
      methods: [
        { id: "rm-table-meth-0", name: "assign", returnType: "void", params: ["partySize: number"], visibility: "+" },
        { id: "rm-table-meth-1", name: "release", returnType: "void", params: [], visibility: "+" },
      ],
      x: 350,
      y: 50,
    },
    {
      id: "rm-reservation",
      name: "Reservation",
      stereotype: "class",
      attributes: [
        { id: "rm-res-attr-0", name: "id", type: "string", visibility: "-" },
        { id: "rm-res-attr-1", name: "customer", type: "Customer", visibility: "-" },
        { id: "rm-res-attr-2", name: "table", type: "Table", visibility: "-" },
        { id: "rm-res-attr-3", name: "time", type: "Date", visibility: "-" },
        { id: "rm-res-attr-4", name: "partySize", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "rm-res-meth-0", name: "confirm", returnType: "void", params: [], visibility: "+" },
        { id: "rm-res-meth-1", name: "cancel", returnType: "void", params: [], visibility: "+" },
      ],
      x: 600,
      y: 50,
    },
    {
      id: "rm-customer",
      name: "Customer",
      stereotype: "class",
      attributes: [
        { id: "rm-cust-attr-0", name: "id", type: "string", visibility: "-" },
        { id: "rm-cust-attr-1", name: "name", type: "string", visibility: "-" },
        { id: "rm-cust-attr-2", name: "phone", type: "string", visibility: "-" },
      ],
      methods: [
        { id: "rm-cust-meth-0", name: "getReservations", returnType: "Reservation[]", params: [], visibility: "+" },
        { id: "rm-cust-meth-1", name: "getActiveOrders", returnType: "Order[]", params: [], visibility: "+" },
      ],
      x: 800,
      y: 50,
    },
    {
      id: "rm-order",
      name: "Order",
      stereotype: "class",
      attributes: [
        { id: "rm-order-attr-0", name: "id", type: "string", visibility: "-" },
        { id: "rm-order-attr-1", name: "items", type: "OrderItem[]", visibility: "-" },
        { id: "rm-order-attr-2", name: "status", type: "OrderStatus", visibility: "-" },
        { id: "rm-order-attr-3", name: "table", type: "Table", visibility: "-" },
        { id: "rm-order-attr-4", name: "waiter", type: "Waiter", visibility: "-" },
      ],
      methods: [
        { id: "rm-order-meth-0", name: "addItem", returnType: "void", params: ["item: MenuItem", "qty: number"], visibility: "+" },
        { id: "rm-order-meth-1", name: "getTotal", returnType: "number", params: [], visibility: "+" },
        { id: "rm-order-meth-2", name: "updateStatus", returnType: "void", params: ["status: OrderStatus"], visibility: "+" },
      ],
      x: 50,
      y: 280,
    },
    {
      id: "rm-orderitem",
      name: "OrderItem",
      stereotype: "class",
      attributes: [
        { id: "rm-oi-attr-0", name: "menuItem", type: "MenuItem", visibility: "-" },
        { id: "rm-oi-attr-1", name: "quantity", type: "number", visibility: "-" },
        { id: "rm-oi-attr-2", name: "specialInstructions", type: "string", visibility: "-" },
      ],
      methods: [
        { id: "rm-oi-meth-0", name: "getSubtotal", returnType: "number", params: [], visibility: "+" },
        { id: "rm-oi-meth-1", name: "modify", returnType: "void", params: ["instructions: string"], visibility: "+" },
      ],
      x: 350,
      y: 280,
    },
    {
      id: "rm-menuitem",
      name: "MenuItem",
      stereotype: "class",
      attributes: [
        { id: "rm-menuitem-attr-0", name: "id", type: "string", visibility: "-" },
        { id: "rm-menuitem-attr-1", name: "name", type: "string", visibility: "-" },
        { id: "rm-menuitem-attr-2", name: "price", type: "number", visibility: "-" },
        { id: "rm-menuitem-attr-3", name: "category", type: "string", visibility: "-" },
        { id: "rm-menuitem-attr-4", name: "prepTimeMinutes", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "rm-menuitem-meth-0", name: "isAvailable", returnType: "boolean", params: [], visibility: "+" },
        { id: "rm-menuitem-meth-1", name: "getPrice", returnType: "number", params: [], visibility: "+" },
      ],
      x: 600,
      y: 280,
    },
    {
      id: "rm-kitchen",
      name: "Kitchen",
      stereotype: "class",
      attributes: [
        { id: "rm-kitch-attr-0", name: "orderQueue", type: "Order[]", visibility: "-" },
        { id: "rm-kitch-attr-1", name: "capacity", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "rm-kitch-meth-0", name: "receiveOrder", returnType: "void", params: ["order: Order"], visibility: "+" },
        { id: "rm-kitch-meth-1", name: "markReady", returnType: "void", params: ["orderId: string"], visibility: "+" },
        { id: "rm-kitch-meth-2", name: "getPendingOrders", returnType: "Order[]", params: [], visibility: "+" },
      ],
      x: 50,
      y: 480,
    },
    {
      id: "rm-waiter",
      name: "Waiter",
      stereotype: "class",
      attributes: [
        { id: "rm-wait-attr-0", name: "id", type: "string", visibility: "-" },
        { id: "rm-wait-attr-1", name: "name", type: "string", visibility: "-" },
        { id: "rm-wait-attr-2", name: "assignedTables", type: "Table[]", visibility: "-" },
      ],
      methods: [
        { id: "rm-wait-meth-0", name: "takeOrder", returnType: "Order", params: ["table: Table"], visibility: "+" },
        { id: "rm-wait-meth-1", name: "serveOrder", returnType: "void", params: ["order: Order"], visibility: "+" },
      ],
      x: 350,
      y: 480,
    },
    {
      id: "rm-bill",
      name: "Bill",
      stereotype: "class",
      attributes: [
        { id: "rm-bill-attr-0", name: "id", type: "string", visibility: "-" },
        { id: "rm-bill-attr-1", name: "order", type: "Order", visibility: "-" },
        { id: "rm-bill-attr-2", name: "tax", type: "number", visibility: "-" },
        { id: "rm-bill-attr-3", name: "tip", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "rm-bill-meth-0", name: "calculateTotal", returnType: "number", params: [], visibility: "+" },
        { id: "rm-bill-meth-1", name: "splitPayment", returnType: "Payment[]", params: ["ways: number"], visibility: "+" },
      ],
      x: 600,
      y: 480,
    },
    {
      id: "rm-menu",
      name: "Menu",
      stereotype: "class",
      attributes: [
        { id: "rm-menu-attr-0", name: "items", type: "MenuItem[]", visibility: "-" },
        { id: "rm-menu-attr-1", name: "categories", type: "string[]", visibility: "-" },
      ],
      methods: [
        { id: "rm-menu-meth-0", name: "getItemsByCategory", returnType: "MenuItem[]", params: ["category: string"], visibility: "+" },
        { id: "rm-menu-meth-1", name: "addItem", returnType: "void", params: ["item: MenuItem"], visibility: "+" },
      ],
      x: 800,
      y: 280,
    },
  ],
  starterRelationships: [
    { id: rid(), source: "rm-restaurant", target: "rm-table", type: "composition", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "rm-restaurant", target: "rm-kitchen", type: "composition" },
    { id: rid(), source: "rm-restaurant", target: "rm-menu", type: "composition" },
    { id: rid(), source: "rm-reservation", target: "rm-table", type: "association" },
    { id: rid(), source: "rm-reservation", target: "rm-customer", type: "association" },
    { id: rid(), source: "rm-order", target: "rm-table", type: "association" },
    { id: rid(), source: "rm-order", target: "rm-orderitem", type: "composition", sourceCardinality: "1", targetCardinality: "1..*" },
    { id: rid(), source: "rm-orderitem", target: "rm-menuitem", type: "association" },
    { id: rid(), source: "rm-order", target: "rm-waiter", type: "association" },
    { id: rid(), source: "rm-bill", target: "rm-order", type: "association" },
    { id: rid(), source: "rm-kitchen", target: "rm-order", type: "dependency", label: "processes" },
  ],
  hints: [
    "Start by identifying the core entities: Restaurant, Table, Menu, MenuItem, and Order. A Restaurant has Tables and a Menu; an Order is placed at a Table with items from the Menu.",
    "Add a Reservation class for table bookings with Customer, Table, time, and partySize. Consider walk-in vs. reservation flow and how tables get assigned.",
    "Use the Command pattern for orders: each OrderItem is a command sent to the Kitchen that can be queued, modified, or cancelled before preparation begins.",
    "Model OrderStatus as a State pattern with states: Placed -> InPreparation -> Ready -> Served -> Billed -> Cancelled, where each state defines valid transitions.",
    "Add a Kitchen class that maintains an order queue, tracks capacity, and notifies waiters when orders are ready via the Observer pattern.",
    "Add a Waiter class assigned to specific tables who takes orders and serves food. The Bill class should support split-payment with itemized breakdowns, tax, and tip calculations.",
    "Handle edge cases: table reassignment during peak hours, order modification after it has been sent to the kitchen, kitchen capacity limits causing order queuing, and concurrent reservation conflicts.",
  ],
};

// ═════════════════════════════════════════════════════════════
//  13. Airline Booking
// ═════════════════════════════════════════════════════════════

const airlineBooking: LLDProblem = {
  id: "prob-airline-booking",
  name: "Airline Booking System",
  difficulty: 4,
  description:
    "United Airlines processes 140 million passengers per year across 4,900 daily flights. " +
    "A single overbooked flight costs $10,000+ in compensation and PR damage. " +
    "Design a reservation system with flight search, seat selection, booking lifecycle management, " +
    "check-in, and frequent flyer tier integration. The complexity here is managing fare classes, " +
    "overbooking thresholds, and multi-leg itineraries. Asked at Expedia, Sabre, and Amazon.",
  requirements: [
    "Search flights by origin, destination, date, and passenger count",
    "Support multiple fare classes (economy, business, first) with pricing tiers",
    "Handle seat selection with class-specific seat maps",
    "Manage booking lifecycle: reserved, confirmed, checked-in, boarded, cancelled",
    "Implement a frequent flyer points system with tier benefits",
  ],
  slug: "airline-booking",
  seoDifficulty: "hard",
  category: "booking-system",
  keyPatterns: ["Strategy", "Observer", "State", "Builder"],
  interviewFrequency: "medium",
  classCount: 18,
  relatedProblems: ["hotel-booking", "movie-ticket-booking", "stock-brokerage"],
  starterClasses: [
    {
      id: "ab-flight", name: "Flight", stereotype: "class",
      attributes: [
        { id: "ab-flight-attr-0", name: "flightNumber", type: "string", visibility: "-" },
        { id: "ab-flight-attr-1", name: "origin", type: "string", visibility: "-" },
        { id: "ab-flight-attr-2", name: "destination", type: "string", visibility: "-" },
        { id: "ab-flight-attr-3", name: "departureTime", type: "Date", visibility: "-" },
        { id: "ab-flight-attr-4", name: "seats", type: "Seat[]", visibility: "-" },
        { id: "ab-flight-attr-5", name: "aircraft", type: "Aircraft", visibility: "-" },
      ],
      methods: [
        { id: "ab-flight-meth-0", name: "getAvailableSeats", returnType: "Seat[]", params: ["fareClass: FareClass"], visibility: "+" },
        { id: "ab-flight-meth-1", name: "getPrice", returnType: "number", params: ["fareClass: FareClass"], visibility: "+" },
      ],
      x: 50, y: 50,
    },
    {
      id: "ab-seat", name: "Seat", stereotype: "class",
      attributes: [
        { id: "ab-seat-attr-0", name: "seatNumber", type: "string", visibility: "-" },
        { id: "ab-seat-attr-1", name: "fareClass", type: "FareClass", visibility: "-" },
        { id: "ab-seat-attr-2", name: "isBooked", type: "boolean", visibility: "-" },
      ],
      methods: [
        { id: "ab-seat-meth-0", name: "reserve", returnType: "boolean", params: ["passenger: Passenger"], visibility: "+" },
      ],
      x: 350, y: 50,
    },
    {
      id: "ab-passenger", name: "Passenger", stereotype: "class",
      attributes: [
        { id: "ab-passenger-attr-0", name: "id", type: "string", visibility: "-" },
        { id: "ab-passenger-attr-1", name: "name", type: "string", visibility: "-" },
        { id: "ab-passenger-attr-2", name: "passport", type: "string", visibility: "-" },
      ],
      methods: [
        { id: "ab-passenger-meth-0", name: "getBookings", returnType: "Booking[]", params: [], visibility: "+" },
      ],
      x: 50, y: 280,
    },
    {
      id: "ab-booking", name: "Booking", stereotype: "class",
      attributes: [
        { id: "ab-booking-attr-0", name: "pnr", type: "string", visibility: "-" },
        { id: "ab-booking-attr-1", name: "flight", type: "Flight", visibility: "-" },
        { id: "ab-booking-attr-2", name: "passenger", type: "Passenger", visibility: "-" },
        { id: "ab-booking-attr-3", name: "seat", type: "Seat", visibility: "-" },
        { id: "ab-booking-attr-4", name: "status", type: "BookingStatus", visibility: "-" },
      ],
      methods: [
        { id: "ab-booking-meth-0", name: "confirm", returnType: "void", params: [], visibility: "+" },
        { id: "ab-booking-meth-1", name: "checkIn", returnType: "BoardingPass", params: [], visibility: "+" },
        { id: "ab-booking-meth-2", name: "cancel", returnType: "void", params: [], visibility: "+" },
      ],
      x: 350, y: 280,
    },
    {
      id: "ab-frequentflyer", name: "FrequentFlyer", stereotype: "class",
      attributes: [
        { id: "ab-frequentflyer-attr-0", name: "memberId", type: "string", visibility: "-" },
        { id: "ab-frequentflyer-attr-1", name: "points", type: "number", visibility: "-" },
        { id: "ab-frequentflyer-attr-2", name: "tier", type: "FFTier", visibility: "-" },
      ],
      methods: [
        { id: "ab-frequentflyer-meth-0", name: "earnPoints", returnType: "void", params: ["flight: Flight"], visibility: "+" },
        { id: "ab-frequentflyer-meth-1", name: "redeemPoints", returnType: "boolean", params: ["amount: number"], visibility: "+" },
      ],
      x: 200, y: 480,
    },
    {
      id: "ab-aircraft", name: "Aircraft", stereotype: "class",
      attributes: [
        { id: "ab-aircraft-attr-0", name: "tailNumber", type: "string", visibility: "-" },
        { id: "ab-aircraft-attr-1", name: "model", type: "string", visibility: "-" },
        { id: "ab-aircraft-attr-2", name: "totalSeats", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "ab-aircraft-meth-0", name: "getSeatMap", returnType: "Seat[]", params: [], visibility: "+" },
      ],
      x: 600, y: 50,
    },
    {
      id: "ab-itinerary", name: "Itinerary", stereotype: "class",
      attributes: [
        { id: "ab-itinerary-attr-0", name: "legs", type: "Flight[]", visibility: "-" },
        { id: "ab-itinerary-attr-1", name: "totalPrice", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "ab-itinerary-meth-0", name: "addLeg", returnType: "void", params: ["flight: Flight"], visibility: "+" },
        { id: "ab-itinerary-meth-1", name: "getTotalDuration", returnType: "number", params: [], visibility: "+" },
      ],
      x: 600, y: 280,
    },
    {
      id: "ab-boardingpass", name: "BoardingPass", stereotype: "class",
      attributes: [
        { id: "ab-boardingpass-attr-0", name: "booking", type: "Booking", visibility: "-" },
        { id: "ab-boardingpass-attr-1", name: "gate", type: "string", visibility: "-" },
        { id: "ab-boardingpass-attr-2", name: "boardingGroup", type: "string", visibility: "-" },
      ],
      methods: [
        { id: "ab-boardingpass-meth-0", name: "generateBarcode", returnType: "string", params: [], visibility: "+" },
      ],
      x: 50, y: 650,
    },
    {
      id: "ab-payment", name: "Payment", stereotype: "class",
      attributes: [
        { id: "ab-payment-attr-0", name: "amount", type: "number", visibility: "-" },
        { id: "ab-payment-attr-1", name: "method", type: "PaymentMethod", visibility: "-" },
        { id: "ab-payment-attr-2", name: "status", type: "PaymentStatus", visibility: "-" },
      ],
      methods: [
        { id: "ab-payment-meth-0", name: "process", returnType: "boolean", params: [], visibility: "+" },
        { id: "ab-payment-meth-1", name: "refund", returnType: "boolean", params: [], visibility: "+" },
      ],
      x: 400, y: 650,
    },
    {
      id: "ab-schedule", name: "FlightSchedule", stereotype: "class",
      attributes: [
        { id: "ab-schedule-attr-0", name: "flights", type: "Map<string, Flight[]>", visibility: "-" },
      ],
      methods: [
        { id: "ab-schedule-meth-0", name: "search", returnType: "Flight[]", params: ["origin: string", "dest: string", "date: Date"], visibility: "+" },
        { id: "ab-schedule-meth-1", name: "addFlight", returnType: "void", params: ["flight: Flight"], visibility: "+" },
      ],
      x: 600, y: 480,
    },
    {
      id: "ab-pricingstrategy", name: "PricingStrategy", stereotype: "interface",
      attributes: [],
      methods: [
        { id: "ab-pricingstrategy-meth-0", name: "calculatePrice", returnType: "number", params: ["baseFare: number", "flight: Flight", "fareClass: FareClass"], visibility: "+" },
      ],
      x: 200, y: 650,
    },
  ],
  starterRelationships: [
    { id: rid(), source: "ab-flight", target: "ab-seat", type: "composition", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "ab-flight", target: "ab-aircraft", type: "association" },
    { id: rid(), source: "ab-booking", target: "ab-flight", type: "association" },
    { id: rid(), source: "ab-booking", target: "ab-passenger", type: "association" },
    { id: rid(), source: "ab-booking", target: "ab-payment", type: "composition" },
    { id: rid(), source: "ab-booking", target: "ab-boardingpass", type: "dependency", label: "creates" },
    { id: rid(), source: "ab-frequentflyer", target: "ab-passenger", type: "association", label: "extends" },
    { id: rid(), source: "ab-itinerary", target: "ab-flight", type: "aggregation", sourceCardinality: "1", targetCardinality: "1..*" },
    { id: rid(), source: "ab-schedule", target: "ab-flight", type: "aggregation", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "ab-flight", target: "ab-pricingstrategy", type: "dependency", label: "uses" },
  ],
  hints: [
    "Start with the core entities: Flight, Seat, Passenger, and Booking. A Flight has many Seats (composition), and a Booking links a Passenger to a specific Seat on a Flight.",
    "Use the State pattern for booking lifecycle: Reserved -> Confirmed -> CheckedIn -> Boarded, with cancel transitions from early states.",
    "Apply the Builder pattern for creating complex multi-leg itineraries with connecting flights and layover management.",
    "Consider a Strategy pattern for fare pricing that accounts for demand, advance purchase, and frequent flyer tier discounts.",
    "Add an Observer to notify passengers of flight status changes (delays, gate changes, cancellations) across all relevant channels.",
    "Handle overbooking by tracking physical seats vs. sold bookings separately -- when oversold, use a priority queue (tier, check-in time) to decide who gets bumped.",
    "For cancellation cascades on multi-leg itineraries, propagate cancellation to all downstream legs and trigger automatic rebooking or refund processing.",
  ],
};

// ═════════════════════════════════════════════════════════════
//  14. Tic-Tac-Toe
// ═════════════════════════════════════════════════════════════

const ticTacToe: LLDProblem = {
  id: "prob-tic-tac-toe",
  name: "Tic-Tac-Toe",
  difficulty: 2,
  description:
    "Tic-tac-toe looks trivial -- until the interviewer says 'make it N x N with an AI opponent.' " +
    "Suddenly you need O(1) win detection (not O(n^2) board scanning), a Strategy pattern for swappable AI difficulties, " +
    "and a clean separation between game rules and UI. Design the game with configurable board sizes, " +
    "player management, win/draw detection, and an AI opponent. " +
    "A common warm-up question at Google and Amazon that quickly reveals design thinking.",
  requirements: [
    "Support configurable N x N board sizes beyond the classic 3x3",
    "Handle two-player turn-based gameplay",
    "Detect win, draw, and ongoing game states efficiently",
    "Support an AI opponent with configurable difficulty levels",
  ],
  slug: "tic-tac-toe",
  seoDifficulty: "easy",
  category: "game-design",
  keyPatterns: ["Strategy", "State", "Observer", "Factory Method"],
  interviewFrequency: "medium",
  classCount: 10,
  relatedProblems: ["chess-game", "snake-game", "card-game"],
  starterClasses: [
    { id: "ttt-game", name: "Game", stereotype: "class",
      attributes: [
        { id: "ttt-game-attr-0", name: "board", type: "Board", visibility: "-" },
        { id: "ttt-game-attr-1", name: "players", type: "Player[]", visibility: "-" },
        { id: "ttt-game-attr-2", name: "currentTurn", type: "number", visibility: "-" },
        { id: "ttt-game-attr-3", name: "status", type: "GameStatus", visibility: "-" },
      ],
      methods: [
        { id: "ttt-game-meth-0", name: "makeMove", returnType: "boolean", params: ["row: number", "col: number"], visibility: "+" },
        { id: "ttt-game-meth-1", name: "checkWinner", returnType: "Player | null", params: [], visibility: "+" },
        { id: "ttt-game-meth-2", name: "reset", returnType: "void", params: [], visibility: "+" },
      ],
      x: 50, y: 50,
    },
    { id: "ttt-board", name: "Board", stereotype: "class",
      attributes: [
        { id: "ttt-board-attr-0", name: "size", type: "number", visibility: "-" },
        { id: "ttt-board-attr-1", name: "grid", type: "Symbol[][]", visibility: "-" },
        { id: "ttt-board-attr-2", name: "moveCount", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "ttt-board-meth-0", name: "placeMark", returnType: "boolean", params: ["row: number", "col: number", "symbol: Symbol"], visibility: "+" },
        { id: "ttt-board-meth-1", name: "isFull", returnType: "boolean", params: [], visibility: "+" },
        { id: "ttt-board-meth-2", name: "getCell", returnType: "Symbol", params: ["row: number", "col: number"], visibility: "+" },
      ],
      x: 350, y: 50,
    },
    { id: "ttt-player", name: "Player", stereotype: "class",
      attributes: [
        { id: "ttt-player-attr-0", name: "name", type: "string", visibility: "-" },
        { id: "ttt-player-attr-1", name: "symbol", type: "Symbol", visibility: "-" },
      ],
      methods: [
        { id: "ttt-player-meth-0", name: "getMove", returnType: "Move", params: ["board: Board"], visibility: "+" },
      ],
      x: 50, y: 280,
    },
    { id: "ttt-move", name: "Move", stereotype: "class",
      attributes: [
        { id: "ttt-move-attr-0", name: "row", type: "number", visibility: "-" },
        { id: "ttt-move-attr-1", name: "col", type: "number", visibility: "-" },
        { id: "ttt-move-attr-2", name: "player", type: "Player", visibility: "-" },
      ],
      methods: [], x: 350, y: 280,
    },
    { id: "ttt-humanplayer", name: "HumanPlayer", stereotype: "class",
      attributes: [],
      methods: [
        { id: "ttt-humanplayer-meth-0", name: "getMove", returnType: "Move", params: ["board: Board"], visibility: "+" },
      ],
      x: 50, y: 480,
    },
    { id: "ttt-aiplayer", name: "AIPlayer", stereotype: "class",
      attributes: [
        { id: "ttt-aiplayer-attr-0", name: "difficulty", type: "Difficulty", visibility: "-" },
        { id: "ttt-aiplayer-attr-1", name: "strategy", type: "MoveStrategy", visibility: "-" },
      ],
      methods: [
        { id: "ttt-aiplayer-meth-0", name: "getMove", returnType: "Move", params: ["board: Board"], visibility: "+" },
      ],
      x: 200, y: 480,
    },
    { id: "ttt-movestrategy", name: "MoveStrategy", stereotype: "interface",
      attributes: [],
      methods: [
        { id: "ttt-movestrategy-meth-0", name: "computeMove", returnType: "Move", params: ["board: Board", "symbol: Symbol"], visibility: "+" },
      ],
      x: 350, y: 480,
    },
    { id: "ttt-winchecker", name: "WinChecker", stereotype: "class",
      attributes: [
        { id: "ttt-winchecker-attr-0", name: "rowCounts", type: "Map<Symbol, number[]>", visibility: "-" },
        { id: "ttt-winchecker-attr-1", name: "colCounts", type: "Map<Symbol, number[]>", visibility: "-" },
        { id: "ttt-winchecker-attr-2", name: "diagCounts", type: "Map<Symbol, number[]>", visibility: "-" },
      ],
      methods: [
        { id: "ttt-winchecker-meth-0", name: "recordMove", returnType: "void", params: ["row: number", "col: number", "symbol: Symbol"], visibility: "+" },
        { id: "ttt-winchecker-meth-1", name: "hasWinner", returnType: "Symbol | null", params: [], visibility: "+" },
      ],
      x: 550, y: 280,
    },
    { id: "ttt-gameresult", name: "GameResult", stereotype: "class",
      attributes: [
        { id: "ttt-gameresult-attr-0", name: "winner", type: "Player | null", visibility: "-" },
        { id: "ttt-gameresult-attr-1", name: "isDraw", type: "boolean", visibility: "-" },
        { id: "ttt-gameresult-attr-2", name: "moveHistory", type: "Move[]", visibility: "-" },
      ],
      methods: [], x: 550, y: 50,
    },
  ],
  starterRelationships: [
    { id: rid(), source: "ttt-game", target: "ttt-board", type: "composition" },
    { id: rid(), source: "ttt-game", target: "ttt-player", type: "aggregation", sourceCardinality: "1", targetCardinality: "2" },
    { id: rid(), source: "ttt-game", target: "ttt-move", type: "dependency", label: "creates" },
    { id: rid(), source: "ttt-game", target: "ttt-winchecker", type: "composition" },
    { id: rid(), source: "ttt-game", target: "ttt-gameresult", type: "dependency", label: "produces" },
    { id: rid(), source: "ttt-humanplayer", target: "ttt-player", type: "realization" },
    { id: rid(), source: "ttt-aiplayer", target: "ttt-player", type: "realization" },
    { id: rid(), source: "ttt-aiplayer", target: "ttt-movestrategy", type: "association", label: "uses" },
  ],
  hints: [
    "Start by identifying the core classes: Game, Board, Player, and Move. The Game orchestrates turns, the Board tracks grid state, Player provides moves, and Move is a value object.",
    "Use the Strategy pattern for player move logic: HumanMoveStrategy prompts input, AIMoveStrategy uses minimax or random selection.",
    "For O(1) win detection on NxN boards, maintain row/column/diagonal counters per player -- increment on each move and check if any counter reaches N.",
    "Apply the Factory Method pattern to create HumanPlayer or AIPlayer based on game configuration, keeping the Game class decoupled from concrete player types.",
    "Add a GameHistory class using the Memento pattern to support undo/redo of moves.",
    "For the minimax AI, add alpha-beta pruning to reduce the search space from O(b^d) to O(b^(d/2)), making it feasible for boards larger than 3x3.",
  ],
};

// ═════════════════════════════════════════════════════════════
//  15. Snake Game
// ═════════════════════════════════════════════════════════════

const snakeGame: LLDProblem = {
  id: "prob-snake-game",
  name: "Snake Game",
  difficulty: 3,
  description:
    "Nokia's Snake game was played by 400 million people. It looks simple, " +
    "but the game loop runs at 60fps, the snake body is a deque that grows and shrinks on every tick, " +
    "and collision detection must be instant or the game feels broken. " +
    "Design the full snake game with grid movement, food spawning, self-collision detection, " +
    "score tracking, and increasing speed. Tests your ability to model real-time game state cleanly.",
  requirements: [
    "Render an N x M grid with the snake, food, and obstacles",
    "Handle directional movement with keyboard input processing",
    "Detect collisions with walls, self, and food items",
    "Grow the snake and update score when food is consumed",
    "Increase game speed as score milestones are reached",
  ],
  slug: "snake-game",
  seoDifficulty: "medium",
  category: "game-design",
  keyPatterns: ["State", "Observer", "Strategy", "Command"],
  interviewFrequency: "low",
  classCount: 10,
  relatedProblems: ["tic-tac-toe", "chess-game", "card-game"],
  starterClasses: [
    { id: "sg-game", name: "Game", stereotype: "class",
      attributes: [
        { id: "sg-game-attr-0", name: "grid", type: "Grid", visibility: "-" },
        { id: "sg-game-attr-1", name: "snake", type: "Snake", visibility: "-" },
        { id: "sg-game-attr-2", name: "score", type: "number", visibility: "-" },
        { id: "sg-game-attr-3", name: "status", type: "GameStatus", visibility: "-" },
        { id: "sg-game-attr-4", name: "speed", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "sg-game-meth-0", name: "tick", returnType: "void", params: [], visibility: "+" },
        { id: "sg-game-meth-1", name: "handleInput", returnType: "void", params: ["direction: Direction"], visibility: "+" },
        { id: "sg-game-meth-2", name: "isGameOver", returnType: "boolean", params: [], visibility: "+" },
      ],
      x: 50, y: 50,
    },
    { id: "sg-snake", name: "Snake", stereotype: "class",
      attributes: [
        { id: "sg-snake-attr-0", name: "body", type: "Deque<Position>", visibility: "-" },
        { id: "sg-snake-attr-1", name: "direction", type: "Direction", visibility: "-" },
        { id: "sg-snake-attr-2", name: "bodySet", type: "Set<Position>", visibility: "-" },
      ],
      methods: [
        { id: "sg-snake-meth-0", name: "move", returnType: "void", params: [], visibility: "+" },
        { id: "sg-snake-meth-1", name: "grow", returnType: "void", params: [], visibility: "+" },
        { id: "sg-snake-meth-2", name: "changeDirection", returnType: "void", params: ["dir: Direction"], visibility: "+" },
        { id: "sg-snake-meth-3", name: "collidesWithSelf", returnType: "boolean", params: [], visibility: "+" },
        { id: "sg-snake-meth-4", name: "getHead", returnType: "Position", params: [], visibility: "+" },
      ],
      x: 350, y: 50,
    },
    { id: "sg-food", name: "Food", stereotype: "class",
      attributes: [
        { id: "sg-food-attr-0", name: "position", type: "Position", visibility: "-" },
        { id: "sg-food-attr-1", name: "points", type: "number", visibility: "-" },
        { id: "sg-food-attr-2", name: "type", type: "FoodType", visibility: "-" },
      ],
      methods: [
        { id: "sg-food-meth-0", name: "spawn", returnType: "void", params: ["grid: Grid"], visibility: "+" },
      ],
      x: 50, y: 280,
    },
    { id: "sg-grid", name: "Grid", stereotype: "class",
      attributes: [
        { id: "sg-grid-attr-0", name: "width", type: "number", visibility: "-" },
        { id: "sg-grid-attr-1", name: "height", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "sg-grid-meth-0", name: "isInBounds", returnType: "boolean", params: ["pos: Position"], visibility: "+" },
        { id: "sg-grid-meth-1", name: "getRandomEmptyCell", returnType: "Position", params: [], visibility: "+" },
      ],
      x: 350, y: 280,
    },
    { id: "sg-position", name: "Position", stereotype: "class",
      attributes: [
        { id: "sg-position-attr-0", name: "x", type: "number", visibility: "-" },
        { id: "sg-position-attr-1", name: "y", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "sg-position-meth-0", name: "equals", returnType: "boolean", params: ["other: Position"], visibility: "+" },
        { id: "sg-position-meth-1", name: "hashCode", returnType: "number", params: [], visibility: "+" },
      ],
      x: 50, y: 480,
    },
    { id: "sg-direction", name: "Direction", stereotype: "enum",
      attributes: [
        { id: "sg-direction-attr-0", name: "UP", type: "", visibility: "+" },
        { id: "sg-direction-attr-1", name: "DOWN", type: "", visibility: "+" },
        { id: "sg-direction-attr-2", name: "LEFT", type: "", visibility: "+" },
        { id: "sg-direction-attr-3", name: "RIGHT", type: "", visibility: "+" },
      ],
      methods: [
        { id: "sg-direction-meth-0", name: "isOpposite", returnType: "boolean", params: ["other: Direction"], visibility: "+" },
      ],
      x: 200, y: 480,
    },
    { id: "sg-foodgenerator", name: "FoodGenerator", stereotype: "interface",
      attributes: [],
      methods: [
        { id: "sg-foodgenerator-meth-0", name: "generate", returnType: "Food", params: ["grid: Grid", "snake: Snake"], visibility: "+" },
      ],
      x: 350, y: 480,
    },
    { id: "sg-scoretracker", name: "ScoreTracker", stereotype: "class",
      attributes: [
        { id: "sg-scoretracker-attr-0", name: "score", type: "number", visibility: "-" },
        { id: "sg-scoretracker-attr-1", name: "highScore", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "sg-scoretracker-meth-0", name: "addPoints", returnType: "void", params: ["points: number"], visibility: "+" },
        { id: "sg-scoretracker-meth-1", name: "getSpeedMultiplier", returnType: "number", params: [], visibility: "+" },
      ],
      x: 550, y: 280,
    },
  ],
  starterRelationships: [
    { id: rid(), source: "sg-game", target: "sg-snake", type: "composition" },
    { id: rid(), source: "sg-game", target: "sg-grid", type: "composition" },
    { id: rid(), source: "sg-game", target: "sg-food", type: "composition" },
    { id: rid(), source: "sg-game", target: "sg-scoretracker", type: "composition" },
    { id: rid(), source: "sg-snake", target: "sg-position", type: "aggregation", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "sg-snake", target: "sg-direction", type: "dependency" },
    { id: rid(), source: "sg-game", target: "sg-foodgenerator", type: "dependency", label: "uses" },
  ],
  hints: [
    "Start with the Game-Snake-Grid triangle. Game owns the Snake and Grid (composition). On each tick(), the Game asks the Snake for its next head position, checks for collisions via the Grid, and either grows or moves the snake.",
    "Use the State pattern for game states: Running, Paused, GameOver. Each state handles tick() and handleInput() differently.",
    "Model the snake body as a deque (double-ended queue): add a new head position on each move, remove the tail unless the snake just ate food.",
    "For O(1) self-collision detection, maintain a HashSet of all body positions alongside the deque -- check the set on every move instead of iterating the full body.",
    "Use the Strategy pattern for food generation: RandomFoodGenerator for basic play, WeightedFoodGenerator for bonus items that appear near the edges.",
    "Use the Observer pattern to notify the UI layer when the game state changes (score updated, game over, etc.).",
    "Prevent 180-degree turns by checking if the new direction is the opposite of the current one -- Direction.isOpposite() keeps this logic clean.",
  ],
};

// ═════════════════════════════════════════════════════════════
//  16. Card Game (Blackjack)
// ═════════════════════════════════════════════════════════════

const cardGame: LLDProblem = {
  id: "prob-card-game",
  name: "Card Game (Blackjack)",
  difficulty: 3,
  description:
    "Las Vegas casinos process $13 billion in Blackjack wagers annually. " +
    "The dealer follows strict rules (hit below 17, stand on 17+), but Aces can be worth 1 or 11 -- " +
    "and the player can split, double down, or take insurance. " +
    "Design a card game framework with deck management, Blackjack hand evaluation, betting with chip management, " +
    "and dealer AI. The Template Method pattern shines here -- the game loop is the same, only the rules change.",
  requirements: [
    "Model a standard 52-card deck with shuffling and dealing operations",
    "Implement hand evaluation rules for Blackjack (hit, stand, bust, blackjack)",
    "Support multiple players with individual betting and chip management",
    "Implement dealer AI following standard casino rules",
    "Handle split, double down, and insurance side bets",
  ],
  slug: "card-game",
  seoDifficulty: "medium",
  category: "game-design",
  keyPatterns: ["Template Method", "Strategy", "Factory Method", "Observer"],
  interviewFrequency: "low",
  classCount: 12,
  relatedProblems: ["chess-game", "tic-tac-toe", "snake-game"],
  starterClasses: [
    { id: "cg-deck", name: "Deck", stereotype: "class",
      attributes: [{ id: "cg-deck-attr-0", name: "cards", type: "Card[]", visibility: "-" }],
      methods: [
        { id: "cg-deck-meth-0", name: "shuffle", returnType: "void", params: [], visibility: "+" },
        { id: "cg-deck-meth-1", name: "deal", returnType: "Card", params: [], visibility: "+" },
        { id: "cg-deck-meth-2", name: "remaining", returnType: "number", params: [], visibility: "+" },
      ],
      x: 50, y: 50,
    },
    { id: "cg-card", name: "Card", stereotype: "class",
      attributes: [
        { id: "cg-card-attr-0", name: "suit", type: "Suit", visibility: "-" },
        { id: "cg-card-attr-1", name: "rank", type: "Rank", visibility: "-" },
      ],
      methods: [
        { id: "cg-card-meth-0", name: "getValue", returnType: "number", params: [], visibility: "+" },
        { id: "cg-card-meth-1", name: "isFaceUp", returnType: "boolean", params: [], visibility: "+" },
      ],
      x: 350, y: 50,
    },
    { id: "cg-hand", name: "Hand", stereotype: "class",
      attributes: [{ id: "cg-hand-attr-0", name: "cards", type: "Card[]", visibility: "-" }],
      methods: [
        { id: "cg-hand-meth-0", name: "addCard", returnType: "void", params: ["card: Card"], visibility: "+" },
        { id: "cg-hand-meth-1", name: "getScore", returnType: "number", params: [], visibility: "+" },
        { id: "cg-hand-meth-2", name: "isBust", returnType: "boolean", params: [], visibility: "+" },
        { id: "cg-hand-meth-3", name: "isBlackjack", returnType: "boolean", params: [], visibility: "+" },
      ],
      x: 50, y: 280,
    },
    { id: "cg-player", name: "Player", stereotype: "class",
      attributes: [
        { id: "cg-player-attr-0", name: "name", type: "string", visibility: "-" },
        { id: "cg-player-attr-1", name: "hand", type: "Hand", visibility: "-" },
        { id: "cg-player-attr-2", name: "chips", type: "number", visibility: "-" },
        { id: "cg-player-attr-3", name: "currentBet", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "cg-player-meth-0", name: "placeBet", returnType: "void", params: ["amount: number"], visibility: "+" },
        { id: "cg-player-meth-1", name: "decide", returnType: "Action", params: [], visibility: "+" },
      ],
      x: 350, y: 280,
    },
    { id: "cg-dealer", name: "Dealer", stereotype: "class",
      attributes: [
        { id: "cg-dealer-attr-0", name: "hand", type: "Hand", visibility: "-" },
        { id: "cg-dealer-attr-1", name: "standThreshold", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "cg-dealer-meth-0", name: "shouldHit", returnType: "boolean", params: [], visibility: "+" },
        { id: "cg-dealer-meth-1", name: "revealHand", returnType: "Hand", params: [], visibility: "+" },
      ],
      x: 200, y: 480,
    },
    { id: "cg-suit", name: "Suit", stereotype: "enum",
      attributes: [
        { id: "cg-suit-attr-0", name: "HEARTS", type: "", visibility: "+" },
        { id: "cg-suit-attr-1", name: "DIAMONDS", type: "", visibility: "+" },
        { id: "cg-suit-attr-2", name: "CLUBS", type: "", visibility: "+" },
        { id: "cg-suit-attr-3", name: "SPADES", type: "", visibility: "+" },
      ],
      methods: [], x: 600, y: 50,
    },
    { id: "cg-rank", name: "Rank", stereotype: "enum",
      attributes: [
        { id: "cg-rank-attr-0", name: "ACE", type: "", visibility: "+" },
        { id: "cg-rank-attr-1", name: "TWO_THROUGH_TEN", type: "", visibility: "+" },
        { id: "cg-rank-attr-2", name: "JACK", type: "", visibility: "+" },
        { id: "cg-rank-attr-3", name: "QUEEN", type: "", visibility: "+" },
        { id: "cg-rank-attr-4", name: "KING", type: "", visibility: "+" },
      ],
      methods: [{ id: "cg-rank-meth-0", name: "getBaseValue", returnType: "number", params: [], visibility: "+" }],
      x: 600, y: 280,
    },
    { id: "cg-bet", name: "Bet", stereotype: "class",
      attributes: [
        { id: "cg-bet-attr-0", name: "amount", type: "number", visibility: "-" },
        { id: "cg-bet-attr-1", name: "type", type: "BetType", visibility: "-" },
      ],
      methods: [{ id: "cg-bet-meth-0", name: "payout", returnType: "number", params: ["multiplier: number"], visibility: "+" }],
      x: 400, y: 480,
    },
    { id: "cg-gameresult", name: "GameResult", stereotype: "class",
      attributes: [
        { id: "cg-gameresult-attr-0", name: "player", type: "Player", visibility: "-" },
        { id: "cg-gameresult-attr-1", name: "outcome", type: "Outcome", visibility: "-" },
        { id: "cg-gameresult-attr-2", name: "winnings", type: "number", visibility: "-" },
      ],
      methods: [], x: 600, y: 480,
    },
    { id: "cg-blackjackgame", name: "BlackjackGame", stereotype: "class",
      attributes: [
        { id: "cg-blackjackgame-attr-0", name: "deck", type: "Deck", visibility: "-" },
        { id: "cg-blackjackgame-attr-1", name: "players", type: "Player[]", visibility: "-" },
        { id: "cg-blackjackgame-attr-2", name: "dealer", type: "Dealer", visibility: "-" },
      ],
      methods: [
        { id: "cg-blackjackgame-meth-0", name: "dealInitial", returnType: "void", params: [], visibility: "#" },
        { id: "cg-blackjackgame-meth-1", name: "playRound", returnType: "void", params: [], visibility: "#" },
        { id: "cg-blackjackgame-meth-2", name: "evaluateWinners", returnType: "GameResult[]", params: [], visibility: "#" },
      ],
      x: 50, y: 650,
    },
  ],
  starterRelationships: [
    { id: rid(), source: "cg-deck", target: "cg-card", type: "composition", sourceCardinality: "1", targetCardinality: "52" },
    { id: rid(), source: "cg-hand", target: "cg-card", type: "aggregation", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "cg-player", target: "cg-hand", type: "composition" },
    { id: rid(), source: "cg-dealer", target: "cg-hand", type: "composition" },
    { id: rid(), source: "cg-card", target: "cg-suit", type: "dependency" },
    { id: rid(), source: "cg-card", target: "cg-rank", type: "dependency" },
    { id: rid(), source: "cg-player", target: "cg-bet", type: "composition" },
    { id: rid(), source: "cg-blackjackgame", target: "cg-deck", type: "composition" },
    { id: rid(), source: "cg-blackjackgame", target: "cg-player", type: "aggregation", sourceCardinality: "1", targetCardinality: "1..*" },
    { id: rid(), source: "cg-blackjackgame", target: "cg-dealer", type: "composition" },
    { id: rid(), source: "cg-blackjackgame", target: "cg-gameresult", type: "dependency", label: "produces" },
  ],
  hints: [
    "Start with Card, Suit, and Rank as value objects. Then model Deck (composition of 52 Cards), Hand (aggregation of Cards), and the scoring logic in Hand.getScore().",
    "Use the Template Method pattern in a base CardGame class: dealInitial(), playRound(), evaluateWinners() -- BlackjackGame overrides each step with Blackjack-specific rules.",
    "The Strategy pattern works well for player decision-making: HumanStrategy prompts input, DealerStrategy follows fixed rules (hit below 17).",
    "Model Ace value resolution in Hand.getScore() by trying both 1 and 11 and picking the best total that does not bust.",
    "Add a Bet class to encapsulate bet amounts and types (main bet, insurance, double down). Bet.payout(multiplier) calculates winnings cleanly.",
    "Use the Observer pattern to broadcast game events (card dealt, player busted, round complete) so UI and logging stay decoupled from game logic.",
    "For split handling, let a Player hold multiple Hand objects -- each split creates a new Hand that plays independently with its own Bet.",
  ],
};

// ═════════════════════════════════════════════════════════════
//  17. Notification Service
// ═════════════════════════════════════════════════════════════

const notificationService: LLDProblem = {
  id: "prob-notification-service",
  name: "Notification Service",
  difficulty: 3,
  description:
    "WhatsApp delivers 100 billion messages per day. Slack sends 1.5 billion push notifications weekly. " +
    "Behind each notification: channel routing, template rendering, user preference checks, " +
    "quiet hours enforcement, and retry logic for failed deliveries. " +
    "Design a notification system supporting email, SMS, push, and in-app channels " +
    "with configurable preferences and delivery tracking. " +
    "A high-frequency question at Amazon, Uber, and Twilio.",
  requirements: [
    "Support multiple notification channels: email, SMS, push, in-app",
    "Allow users to configure channel preferences per notification type",
    "Use templates with variable substitution for notification content",
    "Track delivery status: pending, sent, delivered, failed, read",
    "Implement retry logic with exponential backoff for failed deliveries",
  ],
  slug: "notification-service",
  seoDifficulty: "medium",
  category: "infrastructure",
  keyPatterns: ["Observer", "Strategy", "Factory Method", "Builder"],
  interviewFrequency: "high",
  classCount: 14,
  relatedProblems: ["pub-sub-system", "logging-framework", "social-media-feed"],
  starterClasses: [
    { id: "ns-service", name: "NotificationService", stereotype: "class",
      attributes: [
        { id: "ns-service-attr-0", name: "channels", type: "Channel[]", visibility: "-" },
        { id: "ns-service-attr-1", name: "templates", type: "Map<string, Template>", visibility: "-" },
        { id: "ns-service-attr-2", name: "retryPolicy", type: "RetryPolicy", visibility: "-" },
      ],
      methods: [
        { id: "ns-service-meth-0", name: "send", returnType: "void", params: ["userId: string", "type: NotificationType", "data: object"], visibility: "+" },
        { id: "ns-service-meth-1", name: "sendBulk", returnType: "void", params: ["userIds: string[]", "type: NotificationType", "data: object"], visibility: "+" },
      ],
      x: 50, y: 50,
    },
    { id: "ns-channel", name: "Channel", stereotype: "interface",
      attributes: [],
      methods: [
        { id: "ns-channel-meth-0", name: "deliver", returnType: "DeliveryResult", params: ["message: string", "recipient: string"], visibility: "+" },
        { id: "ns-channel-meth-1", name: "getType", returnType: "ChannelType", params: [], visibility: "+" },
      ],
      x: 350, y: 50,
    },
    { id: "ns-template", name: "Template", stereotype: "class",
      attributes: [
        { id: "ns-template-attr-0", name: "id", type: "string", visibility: "-" },
        { id: "ns-template-attr-1", name: "body", type: "string", visibility: "-" },
        { id: "ns-template-attr-2", name: "variables", type: "string[]", visibility: "-" },
      ],
      methods: [{ id: "ns-template-meth-0", name: "render", returnType: "string", params: ["data: Record<string, string>"], visibility: "+" }],
      x: 50, y: 280,
    },
    { id: "ns-preference", name: "Preference", stereotype: "class",
      attributes: [
        { id: "ns-preference-attr-0", name: "userId", type: "string", visibility: "-" },
        { id: "ns-preference-attr-1", name: "channelPrefs", type: "Map<NotificationType, ChannelType[]>", visibility: "-" },
        { id: "ns-preference-attr-2", name: "quietHours", type: "TimeRange", visibility: "-" },
      ],
      methods: [
        { id: "ns-preference-meth-0", name: "getChannels", returnType: "ChannelType[]", params: ["type: NotificationType"], visibility: "+" },
        { id: "ns-preference-meth-1", name: "isQuietTime", returnType: "boolean", params: [], visibility: "+" },
      ],
      x: 350, y: 280,
    },
    { id: "ns-notification", name: "Notification", stereotype: "class",
      attributes: [
        { id: "ns-notification-attr-0", name: "id", type: "string", visibility: "-" },
        { id: "ns-notification-attr-1", name: "type", type: "NotificationType", visibility: "-" },
        { id: "ns-notification-attr-2", name: "content", type: "string", visibility: "-" },
        { id: "ns-notification-attr-3", name: "status", type: "DeliveryStatus", visibility: "-" },
        { id: "ns-notification-attr-4", name: "retryCount", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "ns-notification-meth-0", name: "markSent", returnType: "void", params: [], visibility: "+" },
        { id: "ns-notification-meth-1", name: "markFailed", returnType: "void", params: ["reason: string"], visibility: "+" },
      ],
      x: 600, y: 50,
    },
    { id: "ns-retrypolicy", name: "RetryPolicy", stereotype: "class",
      attributes: [
        { id: "ns-retrypolicy-attr-0", name: "maxRetries", type: "number", visibility: "-" },
        { id: "ns-retrypolicy-attr-1", name: "backoffMs", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "ns-retrypolicy-meth-0", name: "shouldRetry", returnType: "boolean", params: ["notification: Notification"], visibility: "+" },
        { id: "ns-retrypolicy-meth-1", name: "getNextDelay", returnType: "number", params: ["attempt: number"], visibility: "+" },
      ],
      x: 600, y: 280,
    },
    { id: "ns-emailchannel", name: "EmailChannel", stereotype: "class",
      attributes: [{ id: "ns-emailchannel-attr-0", name: "smtpConfig", type: "SMTPConfig", visibility: "-" }],
      methods: [{ id: "ns-emailchannel-meth-0", name: "deliver", returnType: "DeliveryResult", params: ["message: string", "recipient: string"], visibility: "+" }],
      x: 50, y: 480,
    },
    { id: "ns-smschannel", name: "SMSChannel", stereotype: "class",
      attributes: [{ id: "ns-smschannel-attr-0", name: "provider", type: "string", visibility: "-" }],
      methods: [{ id: "ns-smschannel-meth-0", name: "deliver", returnType: "DeliveryResult", params: ["message: string", "recipient: string"], visibility: "+" }],
      x: 250, y: 480,
    },
    { id: "ns-pushchannel", name: "PushChannel", stereotype: "class",
      attributes: [{ id: "ns-pushchannel-attr-0", name: "deviceTokens", type: "Map<string, string>", visibility: "-" }],
      methods: [{ id: "ns-pushchannel-meth-0", name: "deliver", returnType: "DeliveryResult", params: ["message: string", "recipient: string"], visibility: "+" }],
      x: 450, y: 480,
    },
  ],
  starterRelationships: [
    { id: rid(), source: "ns-service", target: "ns-channel", type: "aggregation", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "ns-service", target: "ns-template", type: "composition", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "ns-service", target: "ns-preference", type: "dependency", label: "reads" },
    { id: rid(), source: "ns-service", target: "ns-notification", type: "dependency", label: "creates" },
    { id: rid(), source: "ns-service", target: "ns-retrypolicy", type: "composition" },
    { id: rid(), source: "ns-emailchannel", target: "ns-channel", type: "realization" },
    { id: rid(), source: "ns-smschannel", target: "ns-channel", type: "realization" },
    { id: rid(), source: "ns-pushchannel", target: "ns-channel", type: "realization" },
  ],
  hints: [
    "Start with the Channel interface and its concrete implementations: EmailChannel, SMSChannel, PushChannel. Each has different delivery logic but the same deliver() contract.",
    "Use the Strategy pattern for channels: NotificationService holds a list of Channel implementations and selects which to use based on Preference lookups.",
    "Apply the Builder pattern for constructing notifications: NotificationBuilder.to(user).template('welcome').via('email', 'push').build().",
    "Add an Observer pattern where delivery status changes trigger events that update analytics dashboards and retry queues.",
    "Model a RetryPolicy with exponential backoff: delay = baseDelay * 2^attempt. Cap at maxRetries and move permanently failed messages to a dead-letter queue.",
    "Handle quiet hours by checking Preference.isQuietTime() before delivery -- if quiet, enqueue the notification with a scheduled delivery time after quiet hours end.",
    "For bulk sends, use a priority queue sorted by notification urgency -- critical alerts skip the queue and deliver immediately even during quiet hours.",
  ],
};

// ═════════════════════════════════════════════════════════════
//  18. Logging Framework
// ═════════════════════════════════════════════════════════════

const loggingFramework: LLDProblem = {
  id: "prob-logging-framework",
  name: "Logging Framework",
  difficulty: 3,
  description:
    "Netflix generates 1 TB of logs per second. Without proper log levels, formatters, and sinks, " +
    "debugging a production outage at 3 AM becomes impossible. " +
    "Design a logging framework like Log4j/Winston with TRACE through FATAL levels, " +
    "multiple output destinations (console, file, remote), structured JSON formatting, " +
    "and thread-safe concurrent writes. " +
    "Tests Singleton, Strategy, and Chain of Responsibility patterns in one clean problem.",
  requirements: [
    "Support log levels: TRACE, DEBUG, INFO, WARN, ERROR, FATAL",
    "Allow multiple output destinations (console, file, remote endpoint)",
    "Support structured logging with key-value metadata",
    "Implement configurable log formatting (JSON, plain text, custom)",
    "Handle concurrent writes from multiple threads safely",
  ],
  slug: "logging-framework",
  seoDifficulty: "medium",
  category: "infrastructure",
  keyPatterns: ["Singleton", "Strategy", "Chain of Responsibility", "Observer"],
  interviewFrequency: "medium",
  classCount: 11,
  relatedProblems: ["notification-service", "pub-sub-system", "cache-system"],
  starterClasses: [
    { id: "lf-logger", name: "Logger", stereotype: "class",
      attributes: [
        { id: "lf-logger-attr-0", name: "name", type: "string", visibility: "-" },
        { id: "lf-logger-attr-1", name: "level", type: "LogLevel", visibility: "-" },
        { id: "lf-logger-attr-2", name: "sinks", type: "Sink[]", visibility: "-" },
      ],
      methods: [
        { id: "lf-logger-meth-0", name: "log", returnType: "void", params: ["level: LogLevel", "message: string", "meta?: object"], visibility: "+" },
        { id: "lf-logger-meth-1", name: "info", returnType: "void", params: ["message: string"], visibility: "+" },
        { id: "lf-logger-meth-2", name: "error", returnType: "void", params: ["message: string", "error?: Error"], visibility: "+" },
      ],
      x: 50, y: 50,
    },
    { id: "lf-loglevel", name: "LogLevel", stereotype: "enum",
      attributes: [
        { id: "lf-loglevel-attr-0", name: "TRACE", type: "0", visibility: "+" },
        { id: "lf-loglevel-attr-1", name: "DEBUG", type: "1", visibility: "+" },
        { id: "lf-loglevel-attr-2", name: "INFO", type: "2", visibility: "+" },
        { id: "lf-loglevel-attr-3", name: "WARN", type: "3", visibility: "+" },
        { id: "lf-loglevel-attr-4", name: "ERROR", type: "4", visibility: "+" },
        { id: "lf-loglevel-attr-5", name: "FATAL", type: "5", visibility: "+" },
      ],
      methods: [], x: 350, y: 50,
    },
    { id: "lf-sink", name: "Sink", stereotype: "interface",
      attributes: [],
      methods: [
        { id: "lf-sink-meth-0", name: "write", returnType: "void", params: ["entry: LogEntry"], visibility: "+" },
        { id: "lf-sink-meth-1", name: "flush", returnType: "void", params: [], visibility: "+" },
      ],
      x: 50, y: 280,
    },
    { id: "lf-formatter", name: "Formatter", stereotype: "interface",
      attributes: [],
      methods: [{ id: "lf-formatter-meth-0", name: "format", returnType: "string", params: ["entry: LogEntry"], visibility: "+" }],
      x: 350, y: 280,
    },
    { id: "lf-logentry", name: "LogEntry", stereotype: "class",
      attributes: [
        { id: "lf-logentry-attr-0", name: "timestamp", type: "Date", visibility: "-" },
        { id: "lf-logentry-attr-1", name: "level", type: "LogLevel", visibility: "-" },
        { id: "lf-logentry-attr-2", name: "message", type: "string", visibility: "-" },
        { id: "lf-logentry-attr-3", name: "loggerName", type: "string", visibility: "-" },
        { id: "lf-logentry-attr-4", name: "metadata", type: "Map<string, object>", visibility: "-" },
      ],
      methods: [], x: 200, y: 480,
    },
    { id: "lf-consolesink", name: "ConsoleSink", stereotype: "class",
      attributes: [],
      methods: [
        { id: "lf-consolesink-meth-0", name: "write", returnType: "void", params: ["entry: LogEntry"], visibility: "+" },
        { id: "lf-consolesink-meth-1", name: "flush", returnType: "void", params: [], visibility: "+" },
      ],
      x: 50, y: 650,
    },
    { id: "lf-filesink", name: "FileSink", stereotype: "class",
      attributes: [
        { id: "lf-filesink-attr-0", name: "filePath", type: "string", visibility: "-" },
        { id: "lf-filesink-attr-1", name: "maxSize", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "lf-filesink-meth-0", name: "write", returnType: "void", params: ["entry: LogEntry"], visibility: "+" },
        { id: "lf-filesink-meth-1", name: "flush", returnType: "void", params: [], visibility: "+" },
        { id: "lf-filesink-meth-2", name: "rotate", returnType: "void", params: [], visibility: "-" },
      ],
      x: 400, y: 650,
    },
    { id: "lf-logconfig", name: "LogConfig", stereotype: "class",
      attributes: [
        { id: "lf-logconfig-attr-0", name: "rootLevel", type: "LogLevel", visibility: "-" },
        { id: "lf-logconfig-attr-1", name: "sinkConfigs", type: "SinkConfig[]", visibility: "-" },
      ],
      methods: [
        { id: "lf-logconfig-meth-0", name: "getLogger", returnType: "Logger", params: ["name: string"], visibility: "+" },
        { id: "lf-logconfig-meth-1", name: "configure", returnType: "void", params: ["config: object"], visibility: "+" },
      ],
      x: 600, y: 50,
    },
    { id: "lf-jsonformatter", name: "JsonFormatter", stereotype: "class",
      attributes: [],
      methods: [{ id: "lf-jsonformatter-meth-0", name: "format", returnType: "string", params: ["entry: LogEntry"], visibility: "+" }],
      x: 600, y: 280,
    },
  ],
  starterRelationships: [
    { id: rid(), source: "lf-logger", target: "lf-sink", type: "aggregation", sourceCardinality: "1", targetCardinality: "1..*" },
    { id: rid(), source: "lf-logger", target: "lf-loglevel", type: "dependency" },
    { id: rid(), source: "lf-sink", target: "lf-formatter", type: "association", label: "uses" },
    { id: rid(), source: "lf-logger", target: "lf-logentry", type: "dependency", label: "creates" },
    { id: rid(), source: "lf-consolesink", target: "lf-sink", type: "realization" },
    { id: rid(), source: "lf-filesink", target: "lf-sink", type: "realization" },
    { id: rid(), source: "lf-jsonformatter", target: "lf-formatter", type: "realization" },
    { id: rid(), source: "lf-logconfig", target: "lf-logger", type: "dependency", label: "creates" },
  ],
  hints: [
    "Start with Logger, LogLevel, and LogEntry. The Logger creates LogEntry objects and passes them to its Sinks. LogLevel filtering happens before Sink dispatch.",
    "Use the Singleton pattern for the root Logger and a Chain of Responsibility for log level filtering across multiple sinks.",
    "Apply the Strategy pattern for formatters: JsonFormatter, PlainTextFormatter, and CustomPatternFormatter each implement the Formatter interface.",
    "Add a LogEntry value object that bundles timestamp, level, message, logger name, and metadata -- pass it through the chain from Logger to Sink to Formatter.",
    "Implement FileSink with log rotation: when the file exceeds maxSize, rename it with a timestamp suffix and start a new file.",
    "For thread safety, use a concurrent queue in each Sink -- producer threads enqueue entries, a background consumer thread writes them to the destination.",
    "Add a LogConfig class that reads configuration (YAML/JSON) and wires up Loggers with the correct Sinks and Formatters at startup.",
  ],
};

// ═════════════════════════════════════════════════════════════
//  19. Cache System
// ═════════════════════════════════════════════════════════════

const cacheSystem: LLDProblem = {
  id: "prob-cache-system",
  name: "Cache System",
  difficulty: 3,
  description:
    "Facebook's TAO cache serves 10 billion queries per second -- a cache miss means hitting a database " +
    "that is 1000x slower. But cache space is finite, so you must decide what to evict: " +
    "the oldest item? The least-used? Items past their TTL? " +
    "Design a flexible cache system supporting LRU, LFU, and TTL eviction policies " +
    "with O(1) operations, thread safety, and hit/miss monitoring. " +
    "Frequently asked at Amazon, Google, and Meta.",
  requirements: [
    "Store key-value pairs with configurable maximum capacity",
    "Support multiple eviction policies: LRU, LFU, and TTL-based",
    "Provide O(1) get and put operations for LRU cache",
    "Handle concurrent access with thread-safe operations",
    "Emit events on cache hit, miss, and eviction for monitoring",
  ],
  slug: "cache-system",
  seoDifficulty: "medium",
  category: "infrastructure",
  keyPatterns: ["Strategy", "Singleton", "Proxy", "Observer"],
  interviewFrequency: "high",
  classCount: 11,
  relatedProblems: ["logging-framework", "rate-limiter", "pub-sub-system"],
  starterClasses: [
    {
      id: "cs-manager",
      name: "CacheManager",
      stereotype: "class",
      attributes: [
        { id: "cs-manager-attr-0", name: "caches", type: "Map<string, Cache>", visibility: "-" },
        { id: "cs-manager-attr-1", name: "defaultConfig", type: "CacheConfig", visibility: "-" },
      ],
      methods: [
        { id: "cs-manager-meth-0", name: "getOrCreateCache", returnType: "Cache", params: ["name: string", "config?: CacheConfig"], visibility: "+" },
        { id: "cs-manager-meth-1", name: "invalidateAll", returnType: "void", params: [], visibility: "+" },
      ],
      x: 50,
      y: 50,
    },
    {
      id: "cs-cache",
      name: "Cache",
      stereotype: "class",
      attributes: [
        { id: "cs-cache-attr-0", name: "capacity", type: "number", visibility: "-" },
        { id: "cs-cache-attr-1", name: "store", type: "Map<string, CacheEntry>", visibility: "-" },
        { id: "cs-cache-attr-2", name: "policy", type: "EvictionPolicy", visibility: "-" },
      ],
      methods: [
        { id: "cs-cache-meth-0", name: "get", returnType: "V | null", params: ["key: string"], visibility: "+" },
        { id: "cs-cache-meth-1", name: "put", returnType: "void", params: ["key: string", "value: V", "ttl?: number"], visibility: "+" },
        { id: "cs-cache-meth-2", name: "evict", returnType: "void", params: [], visibility: "-" },
        { id: "cs-cache-meth-3", name: "getStats", returnType: "CacheStats", params: [], visibility: "+" },
      ],
      x: 350,
      y: 50,
    },
    {
      id: "cs-eviction",
      name: "EvictionPolicy",
      stereotype: "interface",
      attributes: [],
      methods: [
        { id: "cs-eviction-meth-0", name: "onAccess", returnType: "void", params: ["key: string"], visibility: "+" },
        { id: "cs-eviction-meth-1", name: "onInsert", returnType: "void", params: ["key: string"], visibility: "+" },
        { id: "cs-eviction-meth-2", name: "selectVictim", returnType: "string", params: [], visibility: "+" },
      ],
      x: 650,
      y: 50,
    },
    {
      id: "cs-lru",
      name: "LRUPolicy",
      stereotype: "class",
      attributes: [
        { id: "cs-lru-attr-0", name: "order", type: "DoublyLinkedList<string>", visibility: "-" },
        { id: "cs-lru-attr-1", name: "nodeMap", type: "Map<string, Node>", visibility: "-" },
      ],
      methods: [
        { id: "cs-lru-meth-0", name: "onAccess", returnType: "void", params: ["key: string"], visibility: "+" },
        { id: "cs-lru-meth-1", name: "onInsert", returnType: "void", params: ["key: string"], visibility: "+" },
        { id: "cs-lru-meth-2", name: "selectVictim", returnType: "string", params: [], visibility: "+" },
      ],
      x: 650,
      y: 210,
    },
    {
      id: "cs-lfu",
      name: "LFUPolicy",
      stereotype: "class",
      attributes: [
        { id: "cs-lfu-attr-0", name: "freqMap", type: "Map<string, number>", visibility: "-" },
        { id: "cs-lfu-attr-1", name: "minFreq", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "cs-lfu-meth-0", name: "onAccess", returnType: "void", params: ["key: string"], visibility: "+" },
        { id: "cs-lfu-meth-1", name: "onInsert", returnType: "void", params: ["key: string"], visibility: "+" },
        { id: "cs-lfu-meth-2", name: "selectVictim", returnType: "string", params: [], visibility: "+" },
      ],
      x: 650,
      y: 370,
    },
    {
      id: "cs-entry",
      name: "CacheEntry",
      stereotype: "class",
      attributes: [
        { id: "cs-entry-attr-0", name: "key", type: "string", visibility: "-" },
        { id: "cs-entry-attr-1", name: "value", type: "V", visibility: "-" },
        { id: "cs-entry-attr-2", name: "createdAt", type: "number", visibility: "-" },
        { id: "cs-entry-attr-3", name: "ttl", type: "number", visibility: "-" },
        { id: "cs-entry-attr-4", name: "accessCount", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "cs-entry-meth-0", name: "isExpired", returnType: "boolean", params: [], visibility: "+" },
      ],
      x: 350,
      y: 280,
    },
    {
      id: "cs-config",
      name: "CacheConfig",
      stereotype: "class",
      attributes: [
        { id: "cs-config-attr-0", name: "maxCapacity", type: "number", visibility: "-" },
        { id: "cs-config-attr-1", name: "defaultTTL", type: "number", visibility: "-" },
        { id: "cs-config-attr-2", name: "policyType", type: "PolicyType", visibility: "-" },
      ],
      methods: [],
      x: 50,
      y: 210,
    },
    {
      id: "cs-stats",
      name: "CacheStats",
      stereotype: "class",
      attributes: [
        { id: "cs-stats-attr-0", name: "hits", type: "number", visibility: "-" },
        { id: "cs-stats-attr-1", name: "misses", type: "number", visibility: "-" },
        { id: "cs-stats-attr-2", name: "evictions", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "cs-stats-meth-0", name: "getHitRate", returnType: "number", params: [], visibility: "+" },
        { id: "cs-stats-meth-1", name: "record", returnType: "void", params: ["event: CacheEvent"], visibility: "+" },
      ],
      x: 50,
      y: 380,
    },
    {
      id: "cs-loader",
      name: "CacheLoader",
      stereotype: "interface",
      attributes: [],
      methods: [
        { id: "cs-loader-meth-0", name: "load", returnType: "V", params: ["key: string"], visibility: "+" },
      ],
      x: 350,
      y: 450,
    },
    {
      id: "cs-listener",
      name: "CacheEventListener",
      stereotype: "interface",
      attributes: [],
      methods: [
        { id: "cs-listener-meth-0", name: "onHit", returnType: "void", params: ["key: string"], visibility: "+" },
        { id: "cs-listener-meth-1", name: "onMiss", returnType: "void", params: ["key: string"], visibility: "+" },
        { id: "cs-listener-meth-2", name: "onEviction", returnType: "void", params: ["key: string"], visibility: "+" },
      ],
      x: 650,
      y: 530,
    },
  ],
  starterRelationships: [
    { id: rid(), source: "cs-manager", target: "cs-cache", type: "composition", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "cs-cache", target: "cs-eviction", type: "aggregation", label: "uses" },
    { id: rid(), source: "cs-cache", target: "cs-entry", type: "composition", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "cs-lru", target: "cs-eviction", type: "realization" },
    { id: rid(), source: "cs-lfu", target: "cs-eviction", type: "realization" },
    { id: rid(), source: "cs-cache", target: "cs-config", type: "dependency" },
    { id: rid(), source: "cs-cache", target: "cs-stats", type: "composition" },
    { id: rid(), source: "cs-cache", target: "cs-loader", type: "aggregation", label: "loads via" },
    { id: rid(), source: "cs-cache", target: "cs-listener", type: "aggregation", label: "notifies" },
  ],
  hints: [
    "Use the Strategy pattern for eviction: LRUPolicy, LFUPolicy, and TTLPolicy each implement EvictionPolicy with different selectVictim() logic.",
    "Combine a HashMap with a DoublyLinkedList for O(1) LRU operations -- the same approach used in the classic LRU Cache problem.",
    "Add a CacheLoader interface that auto-populates the cache on a miss (cache-aside vs cache-through) -- this is the Proxy pattern at work.",
    "Add an Observer pattern where cache events (hit, miss, eviction) are published to monitoring subscribers for metrics dashboards.",
    "Consider TTL expiration: use lazy deletion (check on access) combined with a periodic cleanup thread to avoid stale data accumulating.",
    "For thread safety, use read-write locks: multiple concurrent readers can access the cache, but writes (put/evict) require exclusive access.",
    "Handle cache stampede: when a popular key expires, hundreds of threads may try to reload it simultaneously. Use a single-flight pattern or mutex per key.",
  ],
};

// ═════════════════════════════════════════════════════════════
//  20. Task Scheduler
// ═════════════════════════════════════════════════════════════

const taskScheduler: LLDProblem = {
  id: "prob-task-scheduler",
  name: "Task Scheduler",
  difficulty: 4,
  description:
    "Airflow orchestrates 10,000+ DAGs at companies like Airbnb and Spotify. " +
    "Tasks have priorities, dependencies, cron schedules, and can fail mid-execution. " +
    "What happens when Task B depends on Task A, but Task A fails? " +
    "Design a task scheduling system with one-time and recurring jobs, priority queues, " +
    "dependency chains (DAGs), and execution monitoring. " +
    "Combines Command, State, and Observer patterns in a single meaty problem.",
  requirements: [
    "Schedule one-time tasks at a specific time or after a delay",
    "Support recurring tasks with cron-like schedule expressions",
    "Implement priority-based execution ordering",
    "Handle task dependencies where task B waits for task A to complete",
    "Track task status: pending, running, completed, failed, cancelled",
  ],
  slug: "task-scheduler",
  seoDifficulty: "hard",
  category: "infrastructure",
  keyPatterns: ["Strategy", "Command", "Observer", "State"],
  interviewFrequency: "medium",
  classCount: 14,
  relatedProblems: ["elevator-system", "pub-sub-system", "rate-limiter"],
  starterClasses: [
    {
      id: "ts-scheduler",
      name: "Scheduler",
      stereotype: "class",
      attributes: [
        { id: "ts-scheduler-attr-0", name: "taskQueue", type: "PriorityQueue<Task>", visibility: "-" },
        { id: "ts-scheduler-attr-1", name: "runningTasks", type: "Map<string, Task>", visibility: "-" },
        { id: "ts-scheduler-attr-2", name: "workerPoolSize", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "ts-scheduler-meth-0", name: "schedule", returnType: "string", params: ["task: Task"], visibility: "+" },
        { id: "ts-scheduler-meth-1", name: "cancel", returnType: "boolean", params: ["taskId: string"], visibility: "+" },
        { id: "ts-scheduler-meth-2", name: "getStatus", returnType: "TaskStatus", params: ["taskId: string"], visibility: "+" },
      ],
      x: 50,
      y: 50,
    },
    {
      id: "ts-task",
      name: "Task",
      stereotype: "class",
      attributes: [
        { id: "ts-task-attr-0", name: "id", type: "string", visibility: "-" },
        { id: "ts-task-attr-1", name: "name", type: "string", visibility: "-" },
        { id: "ts-task-attr-2", name: "priority", type: "Priority", visibility: "-" },
        { id: "ts-task-attr-3", name: "status", type: "TaskStatus", visibility: "-" },
        { id: "ts-task-attr-4", name: "dependencies", type: "Task[]", visibility: "-" },
      ],
      methods: [
        { id: "ts-task-meth-0", name: "execute", returnType: "Promise<void>", params: [], visibility: "+" },
        { id: "ts-task-meth-1", name: "isReady", returnType: "boolean", params: [], visibility: "+" },
      ],
      x: 350,
      y: 50,
    },
    {
      id: "ts-priority",
      name: "Priority",
      stereotype: "enum",
      attributes: [
        { id: "ts-priority-attr-0", name: "LOW", type: "0", visibility: "+" },
        { id: "ts-priority-attr-1", name: "MEDIUM", type: "1", visibility: "+" },
        { id: "ts-priority-attr-2", name: "HIGH", type: "2", visibility: "+" },
        { id: "ts-priority-attr-3", name: "CRITICAL", type: "3", visibility: "+" },
      ],
      methods: [],
      x: 50,
      y: 280,
    },
    {
      id: "ts-cron",
      name: "CronExpression",
      stereotype: "class",
      attributes: [
        { id: "ts-cron-attr-0", name: "expression", type: "string", visibility: "-" },
      ],
      methods: [
        { id: "ts-cron-meth-0", name: "getNextRun", returnType: "Date", params: ["from: Date"], visibility: "+" },
        { id: "ts-cron-meth-1", name: "matches", returnType: "boolean", params: ["date: Date"], visibility: "+" },
      ],
      x: 350,
      y: 280,
    },
    {
      id: "ts-onetimetask",
      name: "OneTimeTask",
      stereotype: "class",
      attributes: [
        { id: "ts-onetimetask-attr-0", name: "scheduledAt", type: "Date", visibility: "-" },
      ],
      methods: [
        { id: "ts-onetimetask-meth-0", name: "execute", returnType: "ExecutionResult", params: [], visibility: "+" },
      ],
      x: 350,
      y: 430,
    },
    {
      id: "ts-recurringtask",
      name: "RecurringTask",
      stereotype: "class",
      attributes: [
        { id: "ts-recurringtask-attr-0", name: "cronExpr", type: "CronExpression", visibility: "-" },
        { id: "ts-recurringtask-attr-1", name: "lastRun", type: "Date", visibility: "-" },
      ],
      methods: [
        { id: "ts-recurringtask-meth-0", name: "execute", returnType: "ExecutionResult", params: [], visibility: "+" },
        { id: "ts-recurringtask-meth-1", name: "getNextRunTime", returnType: "Date", params: [], visibility: "+" },
      ],
      x: 600,
      y: 430,
    },
    {
      id: "ts-worker",
      name: "Worker",
      stereotype: "class",
      attributes: [
        { id: "ts-worker-attr-0", name: "id", type: "string", visibility: "-" },
        { id: "ts-worker-attr-1", name: "busy", type: "boolean", visibility: "-" },
      ],
      methods: [
        { id: "ts-worker-meth-0", name: "run", returnType: "ExecutionResult", params: ["task: Task"], visibility: "+" },
      ],
      x: 50,
      y: 430,
    },
    {
      id: "ts-status",
      name: "TaskStatus",
      stereotype: "enum",
      attributes: [
        { id: "ts-status-attr-0", name: "PENDING", type: "", visibility: "+" },
        { id: "ts-status-attr-1", name: "RUNNING", type: "", visibility: "+" },
        { id: "ts-status-attr-2", name: "COMPLETED", type: "", visibility: "+" },
        { id: "ts-status-attr-3", name: "FAILED", type: "", visibility: "+" },
        { id: "ts-status-attr-4", name: "CANCELLED", type: "", visibility: "+" },
      ],
      methods: [],
      x: 600,
      y: 50,
    },
    {
      id: "ts-result",
      name: "ExecutionResult",
      stereotype: "class",
      attributes: [
        { id: "ts-result-attr-0", name: "taskId", type: "string", visibility: "-" },
        { id: "ts-result-attr-1", name: "success", type: "boolean", visibility: "-" },
        { id: "ts-result-attr-2", name: "error", type: "string | null", visibility: "-" },
        { id: "ts-result-attr-3", name: "duration", type: "number", visibility: "-" },
      ],
      methods: [],
      x: 50,
      y: 570,
    },
    {
      id: "ts-depresolver",
      name: "DependencyResolver",
      stereotype: "class",
      attributes: [
        { id: "ts-depresolver-attr-0", name: "graph", type: "Map<string, string[]>", visibility: "-" },
      ],
      methods: [
        { id: "ts-depresolver-meth-0", name: "resolve", returnType: "Task[]", params: ["tasks: Task[]"], visibility: "+" },
        { id: "ts-depresolver-meth-1", name: "hasCircularDep", returnType: "boolean", params: ["taskId: string"], visibility: "+" },
      ],
      x: 350,
      y: 570,
    },
    {
      id: "ts-listener",
      name: "TaskListener",
      stereotype: "interface",
      attributes: [],
      methods: [
        { id: "ts-listener-meth-0", name: "onStart", returnType: "void", params: ["task: Task"], visibility: "+" },
        { id: "ts-listener-meth-1", name: "onComplete", returnType: "void", params: ["result: ExecutionResult"], visibility: "+" },
        { id: "ts-listener-meth-2", name: "onFailure", returnType: "void", params: ["task: Task", "error: string"], visibility: "+" },
      ],
      x: 600,
      y: 570,
    },
  ],
  starterRelationships: [
    { id: rid(), source: "ts-scheduler", target: "ts-task", type: "aggregation", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "ts-scheduler", target: "ts-worker", type: "composition", sourceCardinality: "1", targetCardinality: "1..*" },
    { id: rid(), source: "ts-scheduler", target: "ts-depresolver", type: "composition" },
    { id: rid(), source: "ts-scheduler", target: "ts-listener", type: "aggregation", label: "notifies" },
    { id: rid(), source: "ts-onetimetask", target: "ts-task", type: "inheritance" },
    { id: rid(), source: "ts-recurringtask", target: "ts-task", type: "inheritance" },
    { id: rid(), source: "ts-task", target: "ts-priority", type: "dependency" },
    { id: rid(), source: "ts-task", target: "ts-status", type: "dependency" },
    { id: rid(), source: "ts-recurringtask", target: "ts-cron", type: "association", label: "scheduled by" },
    { id: rid(), source: "ts-task", target: "ts-task", type: "dependency", label: "depends on" },
    { id: rid(), source: "ts-worker", target: "ts-result", type: "dependency", label: "produces" },
  ],
  hints: [
    "Use the Command pattern for tasks: each Task encapsulates its execution logic, and the Scheduler acts as the invoker that manages timing and ordering.",
    "Apply the State pattern for task lifecycle: Pending -> Running -> Completed/Failed, with transitions managed by the Scheduler.",
    "Separate OneTimeTask and RecurringTask via inheritance -- RecurringTask re-schedules itself after completion using its CronExpression.",
    "For dependency resolution, use a topological sort (DAG) to determine execution order and detect circular dependencies.",
    "Add a Worker pool that pulls tasks from the PriorityQueue -- this decouples scheduling from execution and allows concurrency control.",
    "Implement retry logic with exponential backoff: on failure, re-enqueue the task with a delay of 2^attempt seconds up to a max retry count.",
    "Use an Observer (TaskListener) to notify external systems on task start, completion, and failure -- essential for monitoring dashboards and alerting.",
  ],
};

// ═════════════════════════════════════════════════════════════
//  21. Pub-Sub System
// ═════════════════════════════════════════════════════════════

const pubSubSystem: LLDProblem = {
  id: "prob-pub-sub-system",
  name: "Pub-Sub System",
  difficulty: 4,
  description:
    "Kafka processes 7 trillion messages per day at LinkedIn. Pub/Sub decouples producers from consumers, " +
    "but what happens when a subscriber crashes mid-message? Or when a topic gets 1 million messages/second " +
    "and consumers can't keep up? Design a pub-sub messaging system with topics, subscriber groups, " +
    "message filtering, at-least-once delivery guarantees, and dead letter queues. " +
    "This is the Observer pattern at production scale -- asked at LinkedIn, Confluent, and Amazon.",
  requirements: [
    "Create and manage named topics with configurable retention",
    "Allow publishers to send messages to topics without knowing subscribers",
    "Support subscriber groups for load-balanced consumption",
    "Implement message filtering so subscribers receive only relevant messages",
    "Guarantee at-least-once delivery with acknowledgment tracking",
  ],
  slug: "pub-sub-system",
  seoDifficulty: "hard",
  category: "infrastructure",
  keyPatterns: ["Observer", "Strategy", "Chain of Responsibility", "Mediator"],
  interviewFrequency: "medium",
  classCount: 15,
  relatedProblems: ["notification-service", "logging-framework", "social-media-feed"],
  starterClasses: [
    {
      id: "ps-broker",
      name: "MessageBroker",
      stereotype: "class",
      attributes: [
        { id: "ps-broker-attr-0", name: "topics", type: "Map<string, Topic>", visibility: "-" },
      ],
      methods: [
        { id: "ps-broker-meth-0", name: "createTopic", returnType: "Topic", params: ["name: string"], visibility: "+" },
        { id: "ps-broker-meth-1", name: "publish", returnType: "void", params: ["topicName: string", "message: Message"], visibility: "+" },
        { id: "ps-broker-meth-2", name: "subscribe", returnType: "void", params: ["topicName: string", "subscriber: Subscriber"], visibility: "+" },
      ],
      x: 50,
      y: 50,
    },
    {
      id: "ps-topic",
      name: "Topic",
      stereotype: "class",
      attributes: [
        { id: "ps-topic-attr-0", name: "name", type: "string", visibility: "-" },
        { id: "ps-topic-attr-1", name: "subscriptions", type: "Subscription[]", visibility: "-" },
        { id: "ps-topic-attr-2", name: "retentionMs", type: "number", visibility: "-" },
        { id: "ps-topic-attr-3", name: "messages", type: "Message[]", visibility: "-" },
        { id: "ps-topic-attr-4", name: "partitionCount", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "ps-topic-meth-0", name: "addSubscription", returnType: "void", params: ["sub: Subscription"], visibility: "+" },
        { id: "ps-topic-meth-1", name: "broadcast", returnType: "void", params: ["message: Message"], visibility: "+" },
      ],
      x: 350,
      y: 50,
    },
    {
      id: "ps-publisher",
      name: "Publisher",
      stereotype: "class",
      attributes: [
        { id: "ps-publisher-attr-0", name: "id", type: "string", visibility: "-" },
      ],
      methods: [
        { id: "ps-publisher-meth-0", name: "publish", returnType: "void", params: ["broker: MessageBroker", "topic: string", "payload: object"], visibility: "+" },
      ],
      x: 50,
      y: 280,
    },
    {
      id: "ps-subscriber",
      name: "Subscriber",
      stereotype: "interface",
      attributes: [],
      methods: [
        { id: "ps-subscriber-meth-0", name: "onMessage", returnType: "void", params: ["message: Message"], visibility: "+" },
        { id: "ps-subscriber-meth-1", name: "getId", returnType: "string", params: [], visibility: "+" },
      ],
      x: 350,
      y: 280,
    },
    {
      id: "ps-message",
      name: "Message",
      stereotype: "class",
      attributes: [
        { id: "ps-message-attr-0", name: "id", type: "string", visibility: "-" },
        { id: "ps-message-attr-1", name: "payload", type: "object", visibility: "-" },
        { id: "ps-message-attr-2", name: "timestamp", type: "number", visibility: "-" },
        { id: "ps-message-attr-3", name: "headers", type: "Map<string, string>", visibility: "-" },
      ],
      methods: [],
      x: 650,
      y: 50,
    },
    {
      id: "ps-subscription",
      name: "Subscription",
      stereotype: "class",
      attributes: [
        { id: "ps-subscription-attr-0", name: "subscriber", type: "Subscriber", visibility: "-" },
        { id: "ps-subscription-attr-1", name: "filter", type: "MessageFilter", visibility: "-" },
        { id: "ps-subscription-attr-2", name: "offset", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "ps-subscription-meth-0", name: "acknowledge", returnType: "void", params: ["messageId: string"], visibility: "+" },
      ],
      x: 200,
      y: 400,
    },
    {
      id: "ps-filter",
      name: "MessageFilter",
      stereotype: "interface",
      attributes: [],
      methods: [
        { id: "ps-filter-meth-0", name: "matches", returnType: "boolean", params: ["message: Message"], visibility: "+" },
      ],
      x: 50,
      y: 400,
    },
    {
      id: "ps-dlq",
      name: "DeadLetterQueue",
      stereotype: "class",
      attributes: [
        { id: "ps-dlq-attr-0", name: "failedMessages", type: "Message[]", visibility: "-" },
        { id: "ps-dlq-attr-1", name: "maxRetries", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "ps-dlq-meth-0", name: "enqueue", returnType: "void", params: ["message: Message", "reason: string"], visibility: "+" },
        { id: "ps-dlq-meth-1", name: "replay", returnType: "void", params: ["messageId: string"], visibility: "+" },
      ],
      x: 400,
      y: 400,
    },
    {
      id: "ps-ack",
      name: "AckManager",
      stereotype: "class",
      attributes: [
        { id: "ps-ack-attr-0", name: "pendingAcks", type: "Map<string, number>", visibility: "-" },
        { id: "ps-ack-attr-1", name: "ackTimeout", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "ps-ack-meth-0", name: "trackDelivery", returnType: "void", params: ["messageId: string", "subscriberId: string"], visibility: "+" },
        { id: "ps-ack-meth-1", name: "acknowledge", returnType: "void", params: ["messageId: string", "subscriberId: string"], visibility: "+" },
        { id: "ps-ack-meth-2", name: "getUnacked", returnType: "Message[]", params: [], visibility: "+" },
      ],
      x: 600,
      y: 400,
    },
    {
      id: "ps-partition",
      name: "PartitionManager",
      stereotype: "class",
      attributes: [
        { id: "ps-partition-attr-0", name: "partitions", type: "Map<number, Message[]>", visibility: "-" },
      ],
      methods: [
        { id: "ps-partition-meth-0", name: "assignPartition", returnType: "number", params: ["message: Message"], visibility: "+" },
        { id: "ps-partition-meth-1", name: "rebalance", returnType: "void", params: ["subscribers: Subscriber[]"], visibility: "+" },
      ],
      x: 50,
      y: 550,
    },
  ],
  starterRelationships: [
    { id: rid(), source: "ps-broker", target: "ps-topic", type: "composition", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "ps-topic", target: "ps-subscription", type: "aggregation", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "ps-topic", target: "ps-message", type: "composition", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "ps-subscription", target: "ps-subscriber", type: "association" },
    { id: rid(), source: "ps-subscription", target: "ps-filter", type: "aggregation" },
    { id: rid(), source: "ps-publisher", target: "ps-broker", type: "dependency", label: "publishes via" },
    { id: rid(), source: "ps-broker", target: "ps-dlq", type: "composition" },
    { id: rid(), source: "ps-broker", target: "ps-ack", type: "composition" },
    { id: rid(), source: "ps-topic", target: "ps-partition", type: "composition" },
  ],
  hints: [
    "This is the Observer pattern at scale: Topic is the subject, Subscribers are observers, and the MessageBroker is the mediator that manages registrations.",
    "Add a Message class with id, payload, timestamp, and headers -- the headers enable content-based routing without inspecting the payload.",
    "Add a DeadLetterQueue where messages that fail delivery after max retries are routed for manual inspection or replay.",
    "Use a Chain of Responsibility for message filtering: each filter in the chain can pass or reject a message before it reaches the subscriber.",
    "Implement at-least-once delivery: track message delivery with an AckManager, and re-deliver unacknowledged messages after a configurable timeout.",
    "For high throughput, partition topics: messages are hash-assigned to partitions, and each partition is consumed by at most one subscriber in a group.",
    "Consider subscriber backpressure: if a consumer is slow, the broker should buffer messages up to a limit and then either block the publisher or drop oldest messages.",
  ],
};

// ═════════════════════════════════════════════════════════════
//  22. Rate Limiter
// ═════════════════════════════════════════════════════════════

const rateLimiter: LLDProblem = {
  id: "prob-rate-limiter",
  name: "Rate Limiter",
  difficulty: 3,
  description:
    "Stripe rate-limits API calls to 100/second per key. GitHub allows 5,000 requests/hour. " +
    "Without rate limiting, a single bad actor can take down an entire service. " +
    "Design a rate limiter supporting token bucket, sliding window, and fixed window algorithms " +
    "with per-user/IP/API-key rules, proper Retry-After headers, and tiered limits based on subscription level. " +
    "A must-know question at Stripe, Cloudflare, Amazon, and Google.",
  requirements: [
    "Support token bucket, sliding window, and fixed window algorithms",
    "Configure rate limits per user, API key, or IP address",
    "Return appropriate headers (X-RateLimit-Limit, Remaining, Retry-After)",
    "Handle concurrent requests with atomic counter operations",
    "Support tiered rate limits based on user subscription level",
  ],
  slug: "rate-limiter",
  seoDifficulty: "medium",
  category: "infrastructure",
  keyPatterns: ["Strategy", "Singleton", "Proxy", "Factory Method"],
  interviewFrequency: "high",
  classCount: 10,
  relatedProblems: ["cache-system", "task-scheduler", "url-shortener"],
  starterClasses: [
    {
      id: "rl-limiter",
      name: "RateLimiter",
      stereotype: "class",
      attributes: [
        { id: "rl-limiter-attr-0", name: "rules", type: "Map<string, RateLimitRule>", visibility: "-" },
        { id: "rl-limiter-attr-1", name: "algorithm", type: "RateLimitAlgorithm", visibility: "-" },
      ],
      methods: [
        { id: "rl-limiter-meth-0", name: "isAllowed", returnType: "RateLimitResult", params: ["clientId: string"], visibility: "+" },
        { id: "rl-limiter-meth-1", name: "setRule", returnType: "void", params: ["clientId: string", "rule: RateLimitRule"], visibility: "+" },
      ],
      x: 50,
      y: 50,
    },
    {
      id: "rl-algorithm",
      name: "RateLimitAlgorithm",
      stereotype: "interface",
      attributes: [],
      methods: [
        { id: "rl-algorithm-meth-0", name: "tryConsume", returnType: "boolean", params: ["clientId: string"], visibility: "+" },
        { id: "rl-algorithm-meth-1", name: "getRemainingTokens", returnType: "number", params: ["clientId: string"], visibility: "+" },
      ],
      x: 350,
      y: 50,
    },
    {
      id: "rl-tokenbucket",
      name: "TokenBucket",
      stereotype: "class",
      attributes: [
        { id: "rl-tokenbucket-attr-0", name: "tokens", type: "number", visibility: "-" },
        { id: "rl-tokenbucket-attr-1", name: "maxTokens", type: "number", visibility: "-" },
        { id: "rl-tokenbucket-attr-2", name: "refillRate", type: "number", visibility: "-" },
        { id: "rl-tokenbucket-attr-3", name: "lastRefill", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "rl-tokenbucket-meth-0", name: "tryConsume", returnType: "boolean", params: ["clientId: string"], visibility: "+" },
        { id: "rl-tokenbucket-meth-1", name: "refill", returnType: "void", params: [], visibility: "-" },
      ],
      x: 350,
      y: 50,
    },
    {
      id: "rl-slidingwindow",
      name: "SlidingWindowLog",
      stereotype: "class",
      attributes: [
        { id: "rl-slidingwindow-attr-0", name: "windowSizeMs", type: "number", visibility: "-" },
        { id: "rl-slidingwindow-attr-1", name: "maxRequests", type: "number", visibility: "-" },
        { id: "rl-slidingwindow-attr-2", name: "timestamps", type: "SortedSet<number>", visibility: "-" },
      ],
      methods: [
        { id: "rl-slidingwindow-meth-0", name: "tryConsume", returnType: "boolean", params: ["clientId: string"], visibility: "+" },
        { id: "rl-slidingwindow-meth-1", name: "cleanExpired", returnType: "void", params: [], visibility: "-" },
      ],
      x: 200,
      y: 280,
    },
    {
      id: "rl-fixedwindow",
      name: "FixedWindowCounter",
      stereotype: "class",
      attributes: [
        { id: "rl-fixedwindow-attr-0", name: "windowSizeMs", type: "number", visibility: "-" },
        { id: "rl-fixedwindow-attr-1", name: "maxRequests", type: "number", visibility: "-" },
        { id: "rl-fixedwindow-attr-2", name: "counter", type: "number", visibility: "-" },
        { id: "rl-fixedwindow-attr-3", name: "windowStart", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "rl-fixedwindow-meth-0", name: "tryConsume", returnType: "boolean", params: ["clientId: string"], visibility: "+" },
      ],
      x: 500,
      y: 280,
    },
    {
      id: "rl-rule",
      name: "RateLimitRule",
      stereotype: "class",
      attributes: [
        { id: "rl-rule-attr-0", name: "maxRequests", type: "number", visibility: "-" },
        { id: "rl-rule-attr-1", name: "windowMs", type: "number", visibility: "-" },
        { id: "rl-rule-attr-2", name: "tier", type: "SubscriptionTier", visibility: "-" },
      ],
      methods: [],
      x: 50,
      y: 430,
    },
    {
      id: "rl-result",
      name: "RateLimitResult",
      stereotype: "class",
      attributes: [
        { id: "rl-result-attr-0", name: "allowed", type: "boolean", visibility: "-" },
        { id: "rl-result-attr-1", name: "remaining", type: "number", visibility: "-" },
        { id: "rl-result-attr-2", name: "retryAfterMs", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "rl-result-meth-0", name: "toHeaders", returnType: "Map<string, string>", params: [], visibility: "+" },
      ],
      x: 300,
      y: 430,
    },
    {
      id: "rl-clientid",
      name: "ClientIdentifier",
      stereotype: "class",
      attributes: [
        { id: "rl-clientid-attr-0", name: "apiKey", type: "string", visibility: "-" },
        { id: "rl-clientid-attr-1", name: "ip", type: "string", visibility: "-" },
        { id: "rl-clientid-attr-2", name: "userId", type: "string", visibility: "-" },
      ],
      methods: [
        { id: "rl-clientid-meth-0", name: "resolve", returnType: "string", params: [], visibility: "+" },
      ],
      x: 550,
      y: 430,
    },
  ],
  starterRelationships: [
    { id: rid(), source: "rl-limiter", target: "rl-algorithm", type: "aggregation", label: "delegates to" },
    { id: rid(), source: "rl-tokenbucket", target: "rl-algorithm", type: "realization" },
    { id: rid(), source: "rl-slidingwindow", target: "rl-algorithm", type: "realization" },
    { id: rid(), source: "rl-fixedwindow", target: "rl-algorithm", type: "realization" },
    { id: rid(), source: "rl-limiter", target: "rl-rule", type: "composition", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "rl-limiter", target: "rl-result", type: "dependency", label: "returns" },
    { id: rid(), source: "rl-limiter", target: "rl-clientid", type: "dependency" },
  ],
  hints: [
    "Use the Strategy pattern: RateLimiter delegates to a RateLimitAlgorithm interface implemented by TokenBucket, SlidingWindowLog, and FixedWindowCounter.",
    "For TokenBucket, refill tokens lazily on each tryConsume() call based on elapsed time since lastRefill -- no background timer needed.",
    "Add a Proxy pattern layer: RateLimitProxy wraps the actual API handler and checks the RateLimiter before forwarding requests.",
    "Create a RateLimitResult value object that carries allowed/denied, remaining tokens, and retryAfterMs -- the caller converts this to HTTP headers.",
    "Support tiered limits by associating each ClientIdentifier with a SubscriptionTier (free, pro, enterprise) that maps to different RateLimitRule configs.",
    "For SlidingWindowLog, store timestamps in a sorted set and count entries within [now - windowSize, now]. Space is O(n) per client where n = max requests.",
    "Consider distributed rate limiting: synchronize counters across nodes using Redis INCR with TTL, or use a central token bucket service.",
  ],
};

// ═════════════════════════════════════════════════════════════
//  23. URL Shortener
// ═════════════════════════════════════════════════════════════

const urlShortener: LLDProblem = {
  id: "prob-url-shortener",
  name: "URL Shortener",
  difficulty: 2,
  description:
    "Bitly shortens 600 million links per month and redirects 10 billion clicks per month. " +
    "Every redirect must resolve in under 10ms or users notice. " +
    "Design a URL shortener with base62 code generation, fast redirection, click analytics " +
    "(referrer, geo, timestamp), custom aliases, and link expiration. " +
    "The go-to system design warm-up at virtually every FAANG interview -- " +
    "simple on the surface, deep when you consider scale and collision handling.",
  requirements: [
    "Generate unique short codes for long URLs using base62 encoding",
    "Redirect short URLs to their original destinations efficiently",
    "Support custom aliases chosen by the user",
    "Track click analytics: count, referrer, geographic location, timestamp",
  ],
  slug: "url-shortener",
  seoDifficulty: "easy",
  category: "infrastructure",
  keyPatterns: ["Strategy", "Factory Method", "Singleton", "Observer"],
  interviewFrequency: "high",
  classCount: 9,
  relatedProblems: ["rate-limiter", "cache-system", "notification-service"],
  starterClasses: [
    {
      id: "us-shortener",
      name: "URLShortener",
      stereotype: "class",
      attributes: [
        { id: "us-shortener-attr-0", name: "urlStore", type: "Map<string, ShortURL>", visibility: "-" },
        { id: "us-shortener-attr-1", name: "generator", type: "CodeGenerator", visibility: "-" },
      ],
      methods: [
        { id: "us-shortener-meth-0", name: "shorten", returnType: "string", params: ["longUrl: string", "customAlias?: string"], visibility: "+" },
        { id: "us-shortener-meth-1", name: "resolve", returnType: "string", params: ["shortCode: string"], visibility: "+" },
        { id: "us-shortener-meth-2", name: "delete", returnType: "boolean", params: ["shortCode: string"], visibility: "+" },
      ],
      x: 50,
      y: 50,
    },
    {
      id: "us-shorturl",
      name: "ShortURL",
      stereotype: "class",
      attributes: [
        { id: "us-shorturl-attr-0", name: "shortCode", type: "string", visibility: "-" },
        { id: "us-shorturl-attr-1", name: "longUrl", type: "string", visibility: "-" },
        { id: "us-shorturl-attr-2", name: "createdAt", type: "Date", visibility: "-" },
        { id: "us-shorturl-attr-3", name: "expiresAt", type: "Date", visibility: "-" },
        { id: "us-shorturl-attr-4", name: "userId", type: "string", visibility: "-" },
      ],
      methods: [
        { id: "us-shorturl-meth-0", name: "isExpired", returnType: "boolean", params: [], visibility: "+" },
      ],
      x: 350,
      y: 50,
    },
    {
      id: "us-analytics",
      name: "Analytics",
      stereotype: "class",
      attributes: [
        { id: "us-analytics-attr-0", name: "clicks", type: "ClickEvent[]", visibility: "-" },
        { id: "us-analytics-attr-1", name: "shortCode", type: "string", visibility: "-" },
      ],
      methods: [
        { id: "us-analytics-meth-0", name: "recordClick", returnType: "void", params: ["referrer: string", "location: string"], visibility: "+" },
        { id: "us-analytics-meth-1", name: "getTotalClicks", returnType: "number", params: [], visibility: "+" },
        { id: "us-analytics-meth-2", name: "getClicksByDate", returnType: "Map<string, number>", params: ["range: DateRange"], visibility: "+" },
      ],
      x: 200,
      y: 280,
    },
    {
      id: "us-codegen",
      name: "CodeGenerator",
      stereotype: "interface",
      attributes: [],
      methods: [
        { id: "us-codegen-meth-0", name: "generate", returnType: "string", params: ["input: string"], visibility: "+" },
      ],
      x: 50,
      y: 200,
    },
    {
      id: "us-base62",
      name: "Base62Encoder",
      stereotype: "class",
      attributes: [
        { id: "us-base62-attr-0", name: "counter", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "us-base62-meth-0", name: "generate", returnType: "string", params: ["input: string"], visibility: "+" },
        { id: "us-base62-meth-1", name: "encode", returnType: "string", params: ["num: number"], visibility: "-" },
      ],
      x: 50,
      y: 370,
    },
    {
      id: "us-hashgen",
      name: "HashGenerator",
      stereotype: "class",
      attributes: [
        { id: "us-hashgen-attr-0", name: "hashLength", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "us-hashgen-meth-0", name: "generate", returnType: "string", params: ["input: string"], visibility: "+" },
      ],
      x: 250,
      y: 370,
    },
    {
      id: "us-clickevent",
      name: "ClickEvent",
      stereotype: "class",
      attributes: [
        { id: "us-clickevent-attr-0", name: "timestamp", type: "Date", visibility: "-" },
        { id: "us-clickevent-attr-1", name: "referrer", type: "string", visibility: "-" },
        { id: "us-clickevent-attr-2", name: "geoLocation", type: "string", visibility: "-" },
        { id: "us-clickevent-attr-3", name: "userAgent", type: "string", visibility: "-" },
      ],
      methods: [],
      x: 500,
      y: 280,
    },
    {
      id: "us-expiration",
      name: "ExpirationManager",
      stereotype: "class",
      attributes: [
        { id: "us-expiration-attr-0", name: "defaultTTL", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "us-expiration-meth-0", name: "cleanup", returnType: "number", params: [], visibility: "+" },
        { id: "us-expiration-meth-1", name: "isExpired", returnType: "boolean", params: ["url: ShortURL"], visibility: "+" },
      ],
      x: 600,
      y: 50,
    },
    {
      id: "us-validator",
      name: "URLValidator",
      stereotype: "class",
      attributes: [],
      methods: [
        { id: "us-validator-meth-0", name: "validate", returnType: "boolean", params: ["url: string"], visibility: "+" },
        { id: "us-validator-meth-1", name: "sanitize", returnType: "string", params: ["url: string"], visibility: "+" },
      ],
      x: 450,
      y: 370,
    },
  ],
  starterRelationships: [
    { id: rid(), source: "us-shortener", target: "us-shorturl", type: "composition", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "us-shortener", target: "us-codegen", type: "aggregation", label: "uses" },
    { id: rid(), source: "us-base62", target: "us-codegen", type: "realization" },
    { id: rid(), source: "us-hashgen", target: "us-codegen", type: "realization" },
    { id: rid(), source: "us-shorturl", target: "us-analytics", type: "composition" },
    { id: rid(), source: "us-analytics", target: "us-clickevent", type: "composition", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "us-shortener", target: "us-expiration", type: "composition" },
    { id: rid(), source: "us-shortener", target: "us-validator", type: "dependency" },
  ],
  hints: [
    "Use a Strategy pattern for code generation: Base62Encoder converts an auto-incrementing counter to a short string, while HashGenerator uses MD5/SHA and takes the first N characters.",
    "Apply the Singleton pattern for the URLShortener service and use the Factory Method to create ShortURL instances with default expiration and analytics setup.",
    "Add an Observer to trigger analytics recording asynchronously on each redirect, keeping the redirect path fast.",
    "Handle collisions: when HashGenerator produces a duplicate, append a salt and re-hash. With Base62 counter, collisions are impossible but codes are predictable.",
    "Support custom aliases by checking availability first. Custom aliases bypass the CodeGenerator and go directly into the URL store.",
    "Add an ExpirationManager that runs periodic cleanup of expired URLs and also checks lazily on resolve() to avoid serving stale redirects.",
    "For analytics, store ClickEvent objects with referrer, geo, and user-agent -- aggregate on read using time-bucketed counters for dashboard performance.",
  ],
};

// ═════════════════════════════════════════════════════════════
//  24. Social Media Feed
// ═════════════════════════════════════════════════════════════

const socialMediaFeed: LLDProblem = {
  id: "prob-social-media-feed",
  name: "Social Media Feed",
  difficulty: 4,
  description:
    "Instagram generates a personalized feed for 2 billion users. Each feed merges posts from hundreds of followed accounts, " +
    "ranks them by engagement and recency, and pushes updates in real time. " +
    "Should you precompute feeds (fan-out on write) or generate on demand (fan-out on read)? " +
    "Design a social media feed with post creation, follow graphs, ranked feed generation, " +
    "and real-time updates. The #1 most-asked system design question at Meta, Twitter, and LinkedIn.",
  requirements: [
    "Create posts with text, images, and multimedia attachments",
    "Manage follow/unfollow relationships between users",
    "Generate a personalized feed ranked by relevance and recency",
    "Deliver real-time updates when followed users create new posts",
    "Support post interactions: like, comment, share",
  ],
  slug: "social-media-feed",
  seoDifficulty: "hard",
  category: "real-time",
  keyPatterns: ["Observer", "Strategy", "Iterator", "Decorator"],
  interviewFrequency: "high",
  classCount: 16,
  relatedProblems: ["notification-service", "pub-sub-system", "music-streaming"],
  starterClasses: [
    {
      id: "smf-user",
      name: "User",
      stereotype: "class",
      attributes: [
        { id: "smf-user-attr-0", name: "id", type: "string", visibility: "-" },
        { id: "smf-user-attr-1", name: "username", type: "string", visibility: "-" },
        { id: "smf-user-attr-2", name: "followers", type: "Set<string>", visibility: "-" },
        { id: "smf-user-attr-3", name: "following", type: "Set<string>", visibility: "-" },
      ],
      methods: [
        { id: "smf-user-meth-0", name: "follow", returnType: "void", params: ["userId: string"], visibility: "+" },
        { id: "smf-user-meth-1", name: "unfollow", returnType: "void", params: ["userId: string"], visibility: "+" },
        { id: "smf-user-meth-2", name: "createPost", returnType: "Post", params: ["content: string"], visibility: "+" },
      ],
      x: 50,
      y: 50,
    },
    {
      id: "smf-post",
      name: "Post",
      stereotype: "class",
      attributes: [
        { id: "smf-post-attr-0", name: "id", type: "string", visibility: "-" },
        { id: "smf-post-attr-1", name: "authorId", type: "string", visibility: "-" },
        { id: "smf-post-attr-2", name: "content", type: "string", visibility: "-" },
        { id: "smf-post-attr-3", name: "createdAt", type: "Date", visibility: "-" },
        { id: "smf-post-attr-4", name: "likes", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "smf-post-meth-0", name: "like", returnType: "void", params: ["userId: string"], visibility: "+" },
        { id: "smf-post-meth-1", name: "comment", returnType: "void", params: ["userId: string", "text: string"], visibility: "+" },
      ],
      x: 350,
      y: 50,
    },
    {
      id: "smf-feed",
      name: "Feed",
      stereotype: "class",
      attributes: [
        { id: "smf-feed-attr-0", name: "userId", type: "string", visibility: "-" },
        { id: "smf-feed-attr-1", name: "posts", type: "Post[]", visibility: "-" },
        { id: "smf-feed-attr-2", name: "cursor", type: "string", visibility: "-" },
      ],
      methods: [
        { id: "smf-feed-meth-0", name: "loadNext", returnType: "Post[]", params: ["count: number"], visibility: "+" },
        { id: "smf-feed-meth-1", name: "refresh", returnType: "void", params: [], visibility: "+" },
      ],
      x: 50,
      y: 280,
    },
    {
      id: "smf-generator",
      name: "FeedGenerator",
      stereotype: "class",
      attributes: [
        { id: "smf-generator-attr-0", name: "rankingStrategy", type: "RankingStrategy", visibility: "-" },
      ],
      methods: [
        { id: "smf-generator-meth-0", name: "generate", returnType: "Post[]", params: ["user: User", "count: number"], visibility: "+" },
        { id: "smf-generator-meth-1", name: "rank", returnType: "Post[]", params: ["posts: Post[]"], visibility: "-" },
      ],
      x: 350,
      y: 280,
    },
    {
      id: "smf-follow",
      name: "Follow",
      stereotype: "class",
      attributes: [
        { id: "smf-follow-attr-0", name: "followerId", type: "string", visibility: "-" },
        { id: "smf-follow-attr-1", name: "followeeId", type: "string", visibility: "-" },
        { id: "smf-follow-attr-2", name: "createdAt", type: "Date", visibility: "-" },
      ],
      methods: [],
      x: 200,
      y: 480,
    },
    {
      id: "smf-comment",
      name: "Comment",
      stereotype: "class",
      attributes: [
        { id: "smf-comment-attr-0", name: "id", type: "string", visibility: "-" },
        { id: "smf-comment-attr-1", name: "authorId", type: "string", visibility: "-" },
        { id: "smf-comment-attr-2", name: "text", type: "string", visibility: "-" },
        { id: "smf-comment-attr-3", name: "createdAt", type: "Date", visibility: "-" },
      ],
      methods: [],
      x: 450,
      y: 480,
    },
    {
      id: "smf-like",
      name: "Like",
      stereotype: "class",
      attributes: [
        { id: "smf-like-attr-0", name: "userId", type: "string", visibility: "-" },
        { id: "smf-like-attr-1", name: "postId", type: "string", visibility: "-" },
        { id: "smf-like-attr-2", name: "createdAt", type: "Date", visibility: "-" },
      ],
      methods: [],
      x: 650,
      y: 480,
    },
    {
      id: "smf-ranking",
      name: "RankingStrategy",
      stereotype: "interface",
      attributes: [],
      methods: [
        { id: "smf-ranking-meth-0", name: "score", returnType: "number", params: ["post: Post", "user: User"], visibility: "+" },
      ],
      x: 600,
      y: 280,
    },
    {
      id: "smf-timeline",
      name: "Timeline",
      stereotype: "class",
      attributes: [
        { id: "smf-timeline-attr-0", name: "userId", type: "string", visibility: "-" },
        { id: "smf-timeline-attr-1", name: "entries", type: "FeedItem[]", visibility: "-" },
      ],
      methods: [
        { id: "smf-timeline-meth-0", name: "prepend", returnType: "void", params: ["item: FeedItem"], visibility: "+" },
        { id: "smf-timeline-meth-1", name: "paginate", returnType: "FeedItem[]", params: ["cursor: string", "limit: number"], visibility: "+" },
      ],
      x: 50,
      y: 600,
    },
    {
      id: "smf-notification",
      name: "Notification",
      stereotype: "class",
      attributes: [
        { id: "smf-notification-attr-0", name: "recipientId", type: "string", visibility: "-" },
        { id: "smf-notification-attr-1", name: "type", type: "NotificationType", visibility: "-" },
        { id: "smf-notification-attr-2", name: "referenceId", type: "string", visibility: "-" },
        { id: "smf-notification-attr-3", name: "read", type: "boolean", visibility: "-" },
      ],
      methods: [],
      x: 350,
      y: 600,
    },
  ],
  starterRelationships: [
    { id: rid(), source: "smf-user", target: "smf-post", type: "composition", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "smf-feed", target: "smf-post", type: "aggregation", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "smf-generator", target: "smf-feed", type: "dependency", label: "produces" },
    { id: rid(), source: "smf-generator", target: "smf-ranking", type: "aggregation", label: "uses" },
    { id: rid(), source: "smf-user", target: "smf-follow", type: "association", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "smf-post", target: "smf-comment", type: "composition", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "smf-post", target: "smf-like", type: "composition", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "smf-user", target: "smf-timeline", type: "composition" },
    { id: rid(), source: "smf-user", target: "smf-notification", type: "composition", sourceCardinality: "1", targetCardinality: "*" },
  ],
  hints: [
    "Use the Strategy pattern for feed ranking: ChronologicalRanking, EngagementRanking, and HybridRanking each score posts differently.",
    "Consider fan-out approaches: push model pre-generates feeds for users with few followers, pull model queries on demand for celebrity users with millions of followers.",
    "Apply the Observer pattern so that when a user creates a new post, the FeedGenerator is notified to update the feeds of all followers.",
    "Add a Comment and Like class as separate entities -- they are not just counters but carry userId, timestamp, and content for moderation and display.",
    "Add a RankingStrategy interface with score(post, user): number method. Implementations combine recency decay, engagement weight, and user affinity.",
    "Implement cursor-based pagination in the Feed class: each loadNext() returns posts after the cursor position, avoiding the offset-based pagination pitfall.",
    "Handle the celebrity problem: when a user with 10M followers posts, fan-out-on-write is too expensive. Use a hybrid approach that falls back to pull for high-follower users.",
  ],
};

// ═════════════════════════════════════════════════════════════
//  25. Spreadsheet
// ═════════════════════════════════════════════════════════════

const spreadsheet: LLDProblem = {
  id: "prob-spreadsheet",
  name: "Spreadsheet Application",
  difficulty: 4,
  description:
    "Google Sheets handles 2 billion cells per spreadsheet with real-time collaboration. " +
    "When you change cell A1, every formula that references A1 must recalculate instantly -- " +
    "but what if A1 references B1 which references A1? Circular reference detected. " +
    "Design a spreadsheet engine with cell values, formulas, dependency tracking via DAGs, " +
    "circular reference detection, and auto-recalculation with topological ordering. " +
    "Asked at Google, Microsoft, and Bloomberg -- tests graph algorithms and Observer pattern mastery.",
  requirements: [
    "Store cell values as numbers, strings, or formulas",
    "Evaluate formulas with cell references (e.g., =A1+B2*C3)",
    "Track dependencies between cells for automatic recalculation",
    "Detect and report circular references to prevent infinite loops",
    "Support common functions: SUM, AVG, MIN, MAX over ranges",
  ],
  slug: "spreadsheet",
  seoDifficulty: "hard",
  category: "real-time",
  keyPatterns: ["Observer", "Composite", "Memento", "Iterator"],
  interviewFrequency: "medium",
  classCount: 10,
  relatedProblems: ["file-system", "social-media-feed", "task-scheduler"],
  starterClasses: [
    {
      id: "ss-spreadsheet",
      name: "Spreadsheet",
      stereotype: "class",
      attributes: [
        { id: "ss-spreadsheet-attr-0", name: "sheets", type: "Sheet[]", visibility: "-" },
        { id: "ss-spreadsheet-attr-1", name: "activeSheet", type: "Sheet", visibility: "-" },
      ],
      methods: [
        { id: "ss-spreadsheet-meth-0", name: "addSheet", returnType: "Sheet", params: ["name: string"], visibility: "+" },
        { id: "ss-spreadsheet-meth-1", name: "getSheet", returnType: "Sheet", params: ["name: string"], visibility: "+" },
      ],
      x: 50,
      y: 50,
    },
    {
      id: "ss-sheet",
      name: "Sheet",
      stereotype: "class",
      attributes: [
        { id: "ss-sheet-attr-0", name: "name", type: "string", visibility: "-" },
        { id: "ss-sheet-attr-1", name: "cells", type: "Map<string, Cell>", visibility: "-" },
        { id: "ss-sheet-attr-2", name: "depGraph", type: "DependencyGraph", visibility: "-" },
      ],
      methods: [
        { id: "ss-sheet-meth-0", name: "setCell", returnType: "void", params: ["ref: string", "value: string"], visibility: "+" },
        { id: "ss-sheet-meth-1", name: "getCell", returnType: "CellValue", params: ["ref: string"], visibility: "+" },
        { id: "ss-sheet-meth-2", name: "recalculate", returnType: "void", params: [], visibility: "-" },
      ],
      x: 300,
      y: 50,
    },
    {
      id: "ss-cell",
      name: "Cell",
      stereotype: "class",
      attributes: [
        { id: "ss-cell-attr-0", name: "reference", type: "CellReference", visibility: "-" },
        { id: "ss-cell-attr-1", name: "rawValue", type: "string", visibility: "-" },
        { id: "ss-cell-attr-2", name: "computedValue", type: "CellValue", visibility: "-" },
        { id: "ss-cell-attr-3", name: "formula", type: "Formula | null", visibility: "-" },
      ],
      methods: [
        { id: "ss-cell-meth-0", name: "evaluate", returnType: "CellValue", params: ["context: Sheet"], visibility: "+" },
        { id: "ss-cell-meth-1", name: "isFormula", returnType: "boolean", params: [], visibility: "+" },
      ],
      x: 550,
      y: 50,
    },
    {
      id: "ss-cellref",
      name: "CellReference",
      stereotype: "class",
      attributes: [
        { id: "ss-cellref-attr-0", name: "column", type: "string", visibility: "-" },
        { id: "ss-cellref-attr-1", name: "row", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "ss-cellref-meth-0", name: "toKey", returnType: "string", params: [], visibility: "+" },
        { id: "ss-cellref-meth-1", name: "parse", returnType: "CellReference", params: ["ref: string"], visibility: "+" },
      ],
      x: 550,
      y: 280,
    },
    {
      id: "ss-cellrange",
      name: "CellRange",
      stereotype: "class",
      attributes: [
        { id: "ss-cellrange-attr-0", name: "start", type: "CellReference", visibility: "-" },
        { id: "ss-cellrange-attr-1", name: "end", type: "CellReference", visibility: "-" },
      ],
      methods: [
        { id: "ss-cellrange-meth-0", name: "getCells", returnType: "CellReference[]", params: [], visibility: "+" },
        { id: "ss-cellrange-meth-1", name: "contains", returnType: "boolean", params: ["ref: CellReference"], visibility: "+" },
      ],
      x: 800,
      y: 50,
    },
    {
      id: "ss-cellvalue",
      name: "CellValue",
      stereotype: "class",
      attributes: [
        { id: "ss-cellvalue-attr-0", name: "type", type: "CellValueType", visibility: "-" },
        { id: "ss-cellvalue-attr-1", name: "numericValue", type: "number | null", visibility: "-" },
        { id: "ss-cellvalue-attr-2", name: "textValue", type: "string | null", visibility: "-" },
        { id: "ss-cellvalue-attr-3", name: "errorValue", type: "string | null", visibility: "-" },
      ],
      methods: [
        { id: "ss-cellvalue-meth-0", name: "asNumber", returnType: "number", params: [], visibility: "+" },
        { id: "ss-cellvalue-meth-1", name: "isError", returnType: "boolean", params: [], visibility: "+" },
      ],
      x: 800,
      y: 280,
    },
    {
      id: "ss-formula",
      name: "Formula",
      stereotype: "class",
      attributes: [
        { id: "ss-formula-attr-0", name: "expression", type: "string", visibility: "-" },
        { id: "ss-formula-attr-1", name: "dependencies", type: "CellReference[]", visibility: "-" },
      ],
      methods: [
        { id: "ss-formula-meth-0", name: "evaluate", returnType: "CellValue", params: ["resolver: CellResolver"], visibility: "+" },
        { id: "ss-formula-meth-1", name: "getDependencies", returnType: "CellReference[]", params: [], visibility: "+" },
      ],
      x: 50,
      y: 280,
    },
    {
      id: "ss-formulaparser",
      name: "FormulaParser",
      stereotype: "class",
      attributes: [],
      methods: [
        { id: "ss-formulaparser-meth-0", name: "parse", returnType: "Formula", params: ["raw: string"], visibility: "+" },
        { id: "ss-formulaparser-meth-1", name: "tokenize", returnType: "Token[]", params: ["raw: string"], visibility: "-" },
      ],
      x: 50,
      y: 480,
    },
    {
      id: "ss-depgraph",
      name: "DependencyGraph",
      stereotype: "class",
      attributes: [
        { id: "ss-depgraph-attr-0", name: "edges", type: "Map<string, Set<string>>", visibility: "-" },
      ],
      methods: [
        { id: "ss-depgraph-meth-0", name: "addDependency", returnType: "void", params: ["from: string", "to: string"], visibility: "+" },
        { id: "ss-depgraph-meth-1", name: "getDependents", returnType: "string[]", params: ["cellRef: string"], visibility: "+" },
        { id: "ss-depgraph-meth-2", name: "hasCircularDependency", returnType: "boolean", params: ["cellRef: string"], visibility: "+" },
        { id: "ss-depgraph-meth-3", name: "topologicalSort", returnType: "string[]", params: [], visibility: "+" },
      ],
      x: 300,
      y: 280,
    },
    {
      id: "ss-undomanager",
      name: "UndoManager",
      stereotype: "class",
      attributes: [
        { id: "ss-undomanager-attr-0", name: "history", type: "CellEdit[]", visibility: "-" },
        { id: "ss-undomanager-attr-1", name: "redoStack", type: "CellEdit[]", visibility: "-" },
      ],
      methods: [
        { id: "ss-undomanager-meth-0", name: "record", returnType: "void", params: ["edit: CellEdit"], visibility: "+" },
        { id: "ss-undomanager-meth-1", name: "undo", returnType: "CellEdit | null", params: [], visibility: "+" },
        { id: "ss-undomanager-meth-2", name: "redo", returnType: "CellEdit | null", params: [], visibility: "+" },
      ],
      x: 300,
      y: 480,
    },
  ],
  starterRelationships: [
    { id: rid(), source: "ss-spreadsheet", target: "ss-sheet", type: "composition", sourceCardinality: "1", targetCardinality: "1..*" },
    { id: rid(), source: "ss-sheet", target: "ss-cell", type: "composition", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "ss-sheet", target: "ss-depgraph", type: "composition" },
    { id: rid(), source: "ss-sheet", target: "ss-undomanager", type: "composition" },
    { id: rid(), source: "ss-cell", target: "ss-cellref", type: "association" },
    { id: rid(), source: "ss-cell", target: "ss-cellvalue", type: "association" },
    { id: rid(), source: "ss-cell", target: "ss-formula", type: "association" },
    { id: rid(), source: "ss-formula", target: "ss-cellref", type: "aggregation", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "ss-cellrange", target: "ss-cellref", type: "association" },
    { id: rid(), source: "ss-formulaparser", target: "ss-formula", type: "dependency", label: "creates" },
    { id: rid(), source: "ss-depgraph", target: "ss-cell", type: "dependency", label: "tracks" },
  ],
  hints: [
    "Use the Observer pattern: when a cell value changes, the DependencyGraph identifies all dependent cells and triggers recalculation in topological order.",
    "Apply the Composite pattern for formulas: NumberLiteral, CellReference, BinaryOperation, and FunctionCall form an expression tree that evaluates recursively.",
    "Detect circular references with a DFS-based cycle detection on the dependency graph before allowing a formula to be set.",
    "Model CellValue as a discriminated union: NUMBER, TEXT, BOOLEAN, ERROR -- this mirrors how real spreadsheets handle =1/0 (ERROR) vs =\"hello\" (TEXT).",
    "Use the Memento pattern via UndoManager: each cell edit stores (ref, oldValue, newValue) so undo/redo can replay changes and re-trigger dependency cascades.",
    "For range functions like SUM(A1:A100), create a CellRange that lazily iterates over its cells using the Iterator pattern -- this avoids materializing large ranges.",
    "Consider topological sorting for recalculation order: after a cell changes, collect all transitive dependents, topo-sort them, and evaluate in that order to avoid redundant recalculation.",
  ],
};

// ═════════════════════════════════════════════════════════════
//  26. Splitwise (Expense Sharing)
// ═════════════════════════════════════════════════════════════

const splitwise: LLDProblem = {
  id: "prob-splitwise",
  name: "Splitwise (Expense Sharing)",
  difficulty: 4,
  description:
    "Splitwise has 100 million users tracking $50 billion in shared expenses. " +
    "When 5 friends split a $200 dinner, 3 split a $60 cab, and 2 split a $100 hotel, " +
    "the naive approach creates 10 settlement transactions. The optimal approach? Just 4. " +
    "Design an expense-sharing system with groups, multiple split strategies (equal, exact, percentage), " +
    "per-pair balance tracking, and debt simplification. " +
    "A top question at Google, Uber, and PhonePe -- tests Strategy pattern and graph algorithms.",
  requirements: [
    "Users can create groups and add members to share expenses",
    "Support multiple split strategies: equal, exact amounts, percentage-based",
    "Track per-pair balances and show who owes whom",
    "Simplify debts to minimize the total number of settlement transactions",
    "Record expense history with descriptions, payers, and split breakdowns",
  ],
  slug: "splitwise",
  seoDifficulty: "hard",
  category: "object-modeling",
  keyPatterns: ["Strategy", "Observer", "Mediator", "Iterator"],
  interviewFrequency: "high",
  classCount: 11,
  relatedProblems: ["restaurant-management", "hotel-booking", "online-shopping"],
  starterClasses: [
    {
      id: "sw-user",
      name: "User",
      stereotype: "class",
      attributes: [
        { id: "sw-user-attr-0", name: "id", type: "string", visibility: "-" },
        { id: "sw-user-attr-1", name: "name", type: "string", visibility: "-" },
        { id: "sw-user-attr-2", name: "email", type: "string", visibility: "-" },
      ],
      methods: [
        { id: "sw-user-meth-0", name: "getBalance", returnType: "Map<string, number>", params: [], visibility: "+" },
      ],
      x: 50,
      y: 50,
    },
    {
      id: "sw-group",
      name: "Group",
      stereotype: "class",
      attributes: [
        { id: "sw-group-attr-0", name: "id", type: "string", visibility: "-" },
        { id: "sw-group-attr-1", name: "members", type: "User[]", visibility: "-" },
        { id: "sw-group-attr-2", name: "expenses", type: "Expense[]", visibility: "-" },
      ],
      methods: [
        { id: "sw-group-meth-0", name: "addExpense", returnType: "void", params: ["expense: Expense"], visibility: "+" },
        { id: "sw-group-meth-1", name: "getBalances", returnType: "Balance[]", params: [], visibility: "+" },
        { id: "sw-group-meth-2", name: "simplifyDebts", returnType: "Balance[]", params: [], visibility: "+" },
      ],
      x: 300,
      y: 50,
    },
    {
      id: "sw-expense",
      name: "Expense",
      stereotype: "class",
      attributes: [
        { id: "sw-expense-attr-0", name: "id", type: "string", visibility: "-" },
        { id: "sw-expense-attr-1", name: "amount", type: "number", visibility: "-" },
        { id: "sw-expense-attr-2", name: "paidBy", type: "User", visibility: "-" },
        { id: "sw-expense-attr-3", name: "splits", type: "Split[]", visibility: "-" },
      ],
      methods: [
        { id: "sw-expense-meth-0", name: "validate", returnType: "boolean", params: [], visibility: "+" },
      ],
      x: 300,
      y: 280,
    },
    {
      id: "sw-expensemanager",
      name: "ExpenseManager",
      stereotype: "class",
      attributes: [
        { id: "sw-em-attr-0", name: "groups", type: "Map<string, Group>", visibility: "-" },
        { id: "sw-em-attr-1", name: "users", type: "Map<string, User>", visibility: "-" },
      ],
      methods: [
        { id: "sw-em-meth-0", name: "addExpense", returnType: "void", params: ["groupId: string", "expense: Expense"], visibility: "+" },
        { id: "sw-em-meth-1", name: "settleUp", returnType: "Transaction", params: ["fromId: string", "toId: string", "amount: number"], visibility: "+" },
      ],
      x: 550,
      y: 480,
    },
    {
      id: "sw-split",
      name: "Split",
      stereotype: "interface",
      attributes: [],
      methods: [
        { id: "sw-split-meth-0", name: "getShareForUser", returnType: "number", params: ["userId: string", "total: number"], visibility: "+" },
        { id: "sw-split-meth-1", name: "validate", returnType: "boolean", params: ["total: number"], visibility: "+" },
      ],
      x: 50,
      y: 280,
    },
    {
      id: "sw-equalsplit",
      name: "EqualSplit",
      stereotype: "class",
      attributes: [
        { id: "sw-eq-attr-0", name: "users", type: "User[]", visibility: "-" },
      ],
      methods: [
        { id: "sw-eq-meth-0", name: "getShareForUser", returnType: "number", params: ["userId: string", "total: number"], visibility: "+" },
        { id: "sw-eq-meth-1", name: "validate", returnType: "boolean", params: ["total: number"], visibility: "+" },
      ],
      x: 50,
      y: 480,
    },
    {
      id: "sw-percentsplit",
      name: "PercentageSplit",
      stereotype: "class",
      attributes: [
        { id: "sw-pct-attr-0", name: "percentages", type: "Map<string, number>", visibility: "-" },
      ],
      methods: [
        { id: "sw-pct-meth-0", name: "getShareForUser", returnType: "number", params: ["userId: string", "total: number"], visibility: "+" },
        { id: "sw-pct-meth-1", name: "validate", returnType: "boolean", params: ["total: number"], visibility: "+" },
      ],
      x: 200,
      y: 480,
    },
    {
      id: "sw-exactsplit",
      name: "ExactSplit",
      stereotype: "class",
      attributes: [
        { id: "sw-ex-attr-0", name: "amounts", type: "Map<string, number>", visibility: "-" },
      ],
      methods: [
        { id: "sw-ex-meth-0", name: "getShareForUser", returnType: "number", params: ["userId: string", "total: number"], visibility: "+" },
        { id: "sw-ex-meth-1", name: "validate", returnType: "boolean", params: ["total: number"], visibility: "+" },
      ],
      x: 350,
      y: 480,
    },
    {
      id: "sw-balance",
      name: "Balance",
      stereotype: "class",
      attributes: [
        { id: "sw-balance-attr-0", name: "fromUser", type: "string", visibility: "+" },
        { id: "sw-balance-attr-1", name: "toUser", type: "string", visibility: "+" },
        { id: "sw-balance-attr-2", name: "amount", type: "number", visibility: "+" },
      ],
      methods: [],
      x: 550,
      y: 50,
    },
    {
      id: "sw-balancesheet",
      name: "BalanceSheet",
      stereotype: "class",
      attributes: [
        { id: "sw-bs-attr-0", name: "netBalances", type: "Map<string, number>", visibility: "-" },
      ],
      methods: [
        { id: "sw-bs-meth-0", name: "addExpense", returnType: "void", params: ["expense: Expense"], visibility: "+" },
        { id: "sw-bs-meth-1", name: "getNetBalance", returnType: "number", params: ["userId: string"], visibility: "+" },
        { id: "sw-bs-meth-2", name: "simplify", returnType: "Balance[]", params: [], visibility: "+" },
      ],
      x: 550,
      y: 280,
    },
  ],
  starterRelationships: [
    { id: rid(), source: "sw-expensemanager", target: "sw-group", type: "composition", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "sw-group", target: "sw-user", type: "aggregation", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "sw-group", target: "sw-expense", type: "composition", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "sw-expense", target: "sw-split", type: "composition", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "sw-equalsplit", target: "sw-split", type: "realization" },
    { id: rid(), source: "sw-percentsplit", target: "sw-split", type: "realization" },
    { id: rid(), source: "sw-exactsplit", target: "sw-split", type: "realization" },
    { id: rid(), source: "sw-group", target: "sw-balance", type: "association", label: "computes" },
    { id: rid(), source: "sw-group", target: "sw-balancesheet", type: "composition" },
  ],
  hints: [
    "Use the Strategy pattern for split types: EqualSplit, ExactSplit, and PercentageSplit each implement the Split interface differently but are interchangeable at runtime.",
    "Simplify debts using a graph-based approach: compute net balances, then greedily pair the largest creditor with the largest debtor to minimize transactions.",
    "Apply the Observer pattern: when an expense is added, automatically notify all affected users and recalculate group balances.",
    "Handle rounding in EqualSplit carefully: $100 split 3 ways is $33.33, $33.33, $33.34 -- the last user absorbs the remainder to avoid penny loss.",
    "Each Split subclass must validate its own constraints: ExactSplit checks that amounts sum to total, PercentageSplit checks that percentages sum to 100.",
    "The greedy debt simplification (sort creditors and debtors, match largest pairs) produces O(N-1) transactions at worst -- explain why truly optimal is NP-hard.",
    "Add a Transaction class to record settlements: when user A pays user B, it creates a settlement transaction that adjusts balances bidirectionally.",
  ],
};

// ═════════════════════════════════════════════════════════════
//  27. Ride-Sharing (Uber)
// ═════════════════════════════════════════════════════════════

const rideSharing: LLDProblem = {
  id: "prob-ride-sharing",
  name: "Ride-Sharing Service (Uber)",
  difficulty: 4,
  description:
    "Uber completes 28 million rides per day across 70 countries. When you tap 'Request Ride', " +
    "the system must find the nearest available driver within 3 seconds, calculate a fare " +
    "that accounts for distance, time, and surge pricing, and track the entire trip lifecycle. " +
    "Design the ride-sharing service: rider requests, driver matching, trip state management, " +
    "fare calculation, and ratings. The definitive real-time LLD problem -- asked at Uber, Lyft, and Ola.",
  requirements: [
    "Riders can request a trip by specifying pickup and dropoff locations",
    "Match riders with the nearest available driver based on location",
    "Track trip lifecycle: requested, driver-assigned, in-progress, completed, cancelled",
    "Calculate fare based on distance, time, and dynamic surge pricing",
    "Support driver and rider ratings after trip completion",
  ],
  slug: "ride-sharing",
  seoDifficulty: "hard",
  category: "real-time",
  keyPatterns: ["Strategy", "State", "Observer", "Singleton"],
  interviewFrequency: "high",
  classCount: 10,
  relatedProblems: ["food-delivery", "hotel-booking", "movie-ticket-booking"],
  starterClasses: [
    {
      id: "rs-rider",
      name: "Rider",
      stereotype: "class",
      attributes: [
        { id: "rs-rider-attr-0", name: "id", type: "string", visibility: "-" },
        { id: "rs-rider-attr-1", name: "name", type: "string", visibility: "-" },
        { id: "rs-rider-attr-2", name: "location", type: "Location", visibility: "-" },
      ],
      methods: [
        { id: "rs-rider-meth-0", name: "requestTrip", returnType: "Trip", params: ["pickup: Location", "dropoff: Location"], visibility: "+" },
        { id: "rs-rider-meth-1", name: "rateDriver", returnType: "void", params: ["tripId: string", "rating: number"], visibility: "+" },
      ],
      x: 50,
      y: 50,
    },
    {
      id: "rs-driver",
      name: "Driver",
      stereotype: "class",
      attributes: [
        { id: "rs-driver-attr-0", name: "id", type: "string", visibility: "-" },
        { id: "rs-driver-attr-1", name: "name", type: "string", visibility: "-" },
        { id: "rs-driver-attr-2", name: "location", type: "Location", visibility: "-" },
        { id: "rs-driver-attr-3", name: "status", type: "DriverStatus", visibility: "-" },
      ],
      methods: [
        { id: "rs-driver-meth-0", name: "acceptTrip", returnType: "void", params: ["tripId: string"], visibility: "+" },
        { id: "rs-driver-meth-1", name: "updateLocation", returnType: "void", params: ["location: Location"], visibility: "+" },
      ],
      x: 300,
      y: 50,
    },
    {
      id: "rs-trip",
      name: "Trip",
      stereotype: "class",
      attributes: [
        { id: "rs-trip-attr-0", name: "id", type: "string", visibility: "-" },
        { id: "rs-trip-attr-1", name: "rider", type: "Rider", visibility: "-" },
        { id: "rs-trip-attr-2", name: "driver", type: "Driver | null", visibility: "-" },
        { id: "rs-trip-attr-3", name: "status", type: "TripStatus", visibility: "-" },
        { id: "rs-trip-attr-4", name: "fare", type: "Fare | null", visibility: "-" },
      ],
      methods: [
        { id: "rs-trip-meth-0", name: "assignDriver", returnType: "void", params: ["driver: Driver"], visibility: "+" },
        { id: "rs-trip-meth-1", name: "complete", returnType: "Fare", params: [], visibility: "+" },
      ],
      x: 550,
      y: 50,
    },
    {
      id: "rs-location",
      name: "Location",
      stereotype: "class",
      attributes: [
        { id: "rs-location-attr-0", name: "latitude", type: "number", visibility: "+" },
        { id: "rs-location-attr-1", name: "longitude", type: "number", visibility: "+" },
      ],
      methods: [
        { id: "rs-location-meth-0", name: "distanceTo", returnType: "number", params: ["other: Location"], visibility: "+" },
      ],
      x: 50,
      y: 280,
    },
    {
      id: "rs-fare",
      name: "Fare",
      stereotype: "class",
      attributes: [
        { id: "rs-fare-attr-0", name: "baseFare", type: "number", visibility: "-" },
        { id: "rs-fare-attr-1", name: "distanceCharge", type: "number", visibility: "-" },
        { id: "rs-fare-attr-2", name: "surgeMultiplier", type: "number", visibility: "-" },
        { id: "rs-fare-attr-3", name: "total", type: "number", visibility: "+" },
      ],
      methods: [
        { id: "rs-fare-meth-0", name: "calculate", returnType: "number", params: ["distance: number", "duration: number"], visibility: "+" },
      ],
      x: 550,
      y: 280,
    },
    {
      id: "rs-matching",
      name: "MatchingStrategy",
      stereotype: "interface",
      attributes: [],
      methods: [
        { id: "rs-matching-meth-0", name: "findDriver", returnType: "Driver", params: ["request: RideRequest", "drivers: Driver[]"], visibility: "+" },
      ],
      x: 800,
      y: 50,
    },
    {
      id: "rs-pricing",
      name: "PricingStrategy",
      stereotype: "interface",
      attributes: [],
      methods: [
        { id: "rs-pricing-meth-0", name: "calculateFare", returnType: "Fare", params: ["distance: number", "duration: number", "surgeMultiplier: number"], visibility: "+" },
      ],
      x: 800,
      y: 280,
    },
    {
      id: "rs-rating",
      name: "Rating",
      stereotype: "class",
      attributes: [
        { id: "rs-rating-attr-0", name: "tripId", type: "string", visibility: "-" },
        { id: "rs-rating-attr-1", name: "fromUserId", type: "string", visibility: "-" },
        { id: "rs-rating-attr-2", name: "toUserId", type: "string", visibility: "-" },
        { id: "rs-rating-attr-3", name: "score", type: "number", visibility: "-" },
      ],
      methods: [],
      x: 300,
      y: 480,
    },
    {
      id: "rs-riderequest",
      name: "RideRequest",
      stereotype: "class",
      attributes: [
        { id: "rs-riderequest-attr-0", name: "riderId", type: "string", visibility: "-" },
        { id: "rs-riderequest-attr-1", name: "pickup", type: "Location", visibility: "-" },
        { id: "rs-riderequest-attr-2", name: "dropoff", type: "Location", visibility: "-" },
        { id: "rs-riderequest-attr-3", name: "rideType", type: "RideType", visibility: "-" },
      ],
      methods: [],
      x: 50,
      y: 480,
    },
    {
      id: "rs-payment",
      name: "Payment",
      stereotype: "class",
      attributes: [
        { id: "rs-payment-attr-0", name: "tripId", type: "string", visibility: "-" },
        { id: "rs-payment-attr-1", name: "amount", type: "number", visibility: "-" },
        { id: "rs-payment-attr-2", name: "method", type: "PaymentMethod", visibility: "-" },
        { id: "rs-payment-attr-3", name: "status", type: "PaymentStatus", visibility: "-" },
      ],
      methods: [
        { id: "rs-payment-meth-0", name: "process", returnType: "boolean", params: [], visibility: "+" },
      ],
      x: 550,
      y: 480,
    },
  ],
  starterRelationships: [
    { id: rid(), source: "rs-trip", target: "rs-rider", type: "association", label: "requested by" },
    { id: rid(), source: "rs-trip", target: "rs-driver", type: "association", label: "assigned to" },
    { id: rid(), source: "rs-trip", target: "rs-fare", type: "composition" },
    { id: rid(), source: "rs-trip", target: "rs-payment", type: "composition" },
    { id: rid(), source: "rs-trip", target: "rs-rating", type: "association", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "rs-rider", target: "rs-location", type: "association" },
    { id: rid(), source: "rs-driver", target: "rs-location", type: "association" },
    { id: rid(), source: "rs-riderequest", target: "rs-matching", type: "dependency", label: "uses" },
    { id: rid(), source: "rs-fare", target: "rs-pricing", type: "dependency", label: "uses" },
  ],
  hints: [
    "Use the State pattern for the Trip lifecycle: RequestedState, AssignedState, InProgressState, CompletedState, and CancelledState each define valid transitions and behavior.",
    "Apply the Strategy pattern for fare calculation: BaseFareStrategy, SurgePricingStrategy, and PooledFareStrategy allow different pricing models to be swapped at runtime.",
    "Use the Observer pattern to notify riders of driver location updates and trip status changes in real time.",
    "For driver matching, use a spatial index (QuadTree or geo-hash grid) to find nearby drivers in O(log n) instead of scanning all drivers in O(n).",
    "Model surge pricing with a SurgeCalculator that takes supply/demand ratio per region and returns a multiplier -- this keeps fare logic clean.",
    "Add a Rating class for bidirectional ratings: riders rate drivers and drivers rate riders, both with a weighted moving average.",
    "Handle driver cancellation with a state transition back to RequestedState, which triggers re-matching with a different driver.",
  ],
};

// ═════════════════════════════════════════════════════════════
//  28. Online Shopping (Amazon)
// ═════════════════════════════════════════════════════════════

const onlineShopping: LLDProblem = {
  id: "prob-online-shopping",
  name: "Online Shopping (Amazon)",
  difficulty: 4,
  description:
    "Amazon processes 4,000 orders per second during Prime Day. Each order involves inventory checks, " +
    "payment authorization, fraud detection, and shipping coordination -- all in under 2 seconds. " +
    "What happens when 10,000 people add the last PS5 to their cart simultaneously? " +
    "Design an e-commerce system with product catalog, shopping cart, checkout, " +
    "multiple payment methods, order tracking, and inventory management. " +
    "The most comprehensive OOP problem -- asked at Amazon, Flipkart, and Shopify.",
  requirements: [
    "Users can browse a product catalog, search, and filter by category",
    "Shopping cart with add, remove, update quantity operations",
    "Checkout flow with address selection, payment, and order confirmation",
    "Support multiple payment methods: credit card, wallet, cash on delivery",
    "Track order status: placed, confirmed, shipped, delivered, returned",
  ],
  slug: "online-shopping",
  seoDifficulty: "hard",
  category: "object-modeling",
  keyPatterns: ["Strategy", "Observer", "State", "Factory Method"],
  interviewFrequency: "high",
  classCount: 12,
  relatedProblems: ["splitwise", "food-delivery", "stock-brokerage"],
  starterClasses: [
    {
      id: "os-user",
      name: "User",
      stereotype: "class",
      attributes: [
        { id: "os-user-attr-0", name: "id", type: "string", visibility: "-" },
        { id: "os-user-attr-1", name: "name", type: "string", visibility: "-" },
        { id: "os-user-attr-2", name: "addresses", type: "Address[]", visibility: "-" },
      ],
      methods: [
        { id: "os-user-meth-0", name: "getCart", returnType: "Cart", params: [], visibility: "+" },
        { id: "os-user-meth-1", name: "placeOrder", returnType: "Order", params: ["cart: Cart", "payment: Payment"], visibility: "+" },
      ],
      x: 50,
      y: 50,
    },
    {
      id: "os-product",
      name: "Product",
      stereotype: "class",
      attributes: [
        { id: "os-product-attr-0", name: "id", type: "string", visibility: "-" },
        { id: "os-product-attr-1", name: "name", type: "string", visibility: "-" },
        { id: "os-product-attr-2", name: "price", type: "number", visibility: "-" },
        { id: "os-product-attr-3", name: "inventory", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "os-product-meth-0", name: "isInStock", returnType: "boolean", params: [], visibility: "+" },
        { id: "os-product-meth-1", name: "reserveStock", returnType: "boolean", params: ["qty: number"], visibility: "+" },
      ],
      x: 300,
      y: 50,
    },
    {
      id: "os-cart",
      name: "Cart",
      stereotype: "class",
      attributes: [
        { id: "os-cart-attr-0", name: "items", type: "CartItem[]", visibility: "-" },
      ],
      methods: [
        { id: "os-cart-meth-0", name: "addItem", returnType: "void", params: ["product: Product", "qty: number"], visibility: "+" },
        { id: "os-cart-meth-1", name: "removeItem", returnType: "void", params: ["productId: string"], visibility: "+" },
        { id: "os-cart-meth-2", name: "getTotal", returnType: "number", params: [], visibility: "+" },
      ],
      x: 50,
      y: 280,
    },
    {
      id: "os-order",
      name: "Order",
      stereotype: "class",
      attributes: [
        { id: "os-order-attr-0", name: "id", type: "string", visibility: "-" },
        { id: "os-order-attr-1", name: "items", type: "OrderItem[]", visibility: "-" },
        { id: "os-order-attr-2", name: "status", type: "OrderStatus", visibility: "-" },
        { id: "os-order-attr-3", name: "total", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "os-order-meth-0", name: "confirm", returnType: "void", params: [], visibility: "+" },
        { id: "os-order-meth-1", name: "cancel", returnType: "void", params: [], visibility: "+" },
        { id: "os-order-meth-2", name: "getStatus", returnType: "OrderStatus", params: [], visibility: "+" },
      ],
      x: 550,
      y: 50,
    },
    {
      id: "os-payment",
      name: "Payment",
      stereotype: "interface",
      attributes: [],
      methods: [
        { id: "os-payment-meth-0", name: "processPayment", returnType: "boolean", params: ["amount: number"], visibility: "+" },
        { id: "os-payment-meth-1", name: "refund", returnType: "boolean", params: ["amount: number"], visibility: "+" },
      ],
      x: 550,
      y: 280,
    },
    {
      id: "os-cartitem",
      name: "CartItem",
      stereotype: "class",
      attributes: [
        { id: "os-cartitem-attr-0", name: "product", type: "Product", visibility: "-" },
        { id: "os-cartitem-attr-1", name: "quantity", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "os-cartitem-meth-0", name: "getSubtotal", returnType: "number", params: [], visibility: "+" },
        { id: "os-cartitem-meth-1", name: "updateQuantity", returnType: "void", params: ["qty: number"], visibility: "+" },
      ],
      x: 300,
      y: 280,
    },
    {
      id: "os-address",
      name: "Address",
      stereotype: "class",
      attributes: [
        { id: "os-address-attr-0", name: "street", type: "string", visibility: "-" },
        { id: "os-address-attr-1", name: "city", type: "string", visibility: "-" },
        { id: "os-address-attr-2", name: "zipCode", type: "string", visibility: "-" },
        { id: "os-address-attr-3", name: "country", type: "string", visibility: "-" },
      ],
      methods: [],
      x: 50,
      y: 480,
    },
    {
      id: "os-catalog",
      name: "Catalog",
      stereotype: "class",
      attributes: [
        { id: "os-catalog-attr-0", name: "products", type: "Product[]", visibility: "-" },
        { id: "os-catalog-attr-1", name: "categories", type: "Category[]", visibility: "-" },
      ],
      methods: [
        { id: "os-catalog-meth-0", name: "search", returnType: "Product[]", params: ["query: string"], visibility: "+" },
        { id: "os-catalog-meth-1", name: "filterByCategory", returnType: "Product[]", params: ["category: string"], visibility: "+" },
      ],
      x: 300,
      y: 480,
    },
    {
      id: "os-shipping",
      name: "Shipping",
      stereotype: "class",
      attributes: [
        { id: "os-shipping-attr-0", name: "orderId", type: "string", visibility: "-" },
        { id: "os-shipping-attr-1", name: "trackingId", type: "string", visibility: "-" },
        { id: "os-shipping-attr-2", name: "status", type: "ShippingStatus", visibility: "-" },
        { id: "os-shipping-attr-3", name: "estimatedDelivery", type: "Date", visibility: "-" },
      ],
      methods: [
        { id: "os-shipping-meth-0", name: "updateStatus", returnType: "void", params: ["status: ShippingStatus"], visibility: "+" },
      ],
      x: 550,
      y: 480,
    },
    {
      id: "os-review",
      name: "Review",
      stereotype: "class",
      attributes: [
        { id: "os-review-attr-0", name: "userId", type: "string", visibility: "-" },
        { id: "os-review-attr-1", name: "productId", type: "string", visibility: "-" },
        { id: "os-review-attr-2", name: "rating", type: "number", visibility: "-" },
        { id: "os-review-attr-3", name: "comment", type: "string", visibility: "-" },
      ],
      methods: [],
      x: 800,
      y: 50,
    },
    {
      id: "os-category",
      name: "Category",
      stereotype: "class",
      attributes: [
        { id: "os-category-attr-0", name: "id", type: "string", visibility: "-" },
        { id: "os-category-attr-1", name: "name", type: "string", visibility: "-" },
        { id: "os-category-attr-2", name: "parent", type: "Category | null", visibility: "-" },
      ],
      methods: [],
      x: 800,
      y: 280,
    },
  ],
  starterRelationships: [
    { id: rid(), source: "os-user", target: "os-cart", type: "composition" },
    { id: rid(), source: "os-user", target: "os-address", type: "composition", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "os-cart", target: "os-cartitem", type: "composition", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "os-cartitem", target: "os-product", type: "association" },
    { id: rid(), source: "os-catalog", target: "os-product", type: "composition", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "os-catalog", target: "os-category", type: "composition", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "os-user", target: "os-order", type: "association", label: "places" },
    { id: rid(), source: "os-order", target: "os-payment", type: "dependency", label: "paid via" },
    { id: rid(), source: "os-order", target: "os-shipping", type: "composition" },
    { id: rid(), source: "os-product", target: "os-review", type: "association", sourceCardinality: "1", targetCardinality: "*" },
  ],
  hints: [
    "Use the Strategy pattern for payment methods: CreditCardPayment, WalletPayment, and CashOnDelivery each implement the Payment interface, allowing the checkout to be payment-agnostic.",
    "Apply the State pattern for order tracking: each OrderStatus (Placed, Confirmed, Shipped, Delivered, Returned) defines valid transitions and associated behavior.",
    "Use the Observer pattern to notify users of order status changes and to trigger inventory updates when orders are placed or cancelled.",
    "Add an Address class for shipping: each User has multiple addresses, and order placement requires selecting one for delivery.",
    "Model inventory with atomic reserveStock()/releaseStock() methods to handle concurrent purchases of the same item.",
    "Create a Catalog class with search and filter methods: search by name O(n), filter by category O(c), and price range O(n log n) with sorted indexes.",
    "Consider a Coupon class with Strategy-based discount calculation: PercentageCoupon, FlatAmountCoupon, and BuyOneGetOneCoupon -- validate stacking rules.",
  ],
};

// ═════════════════════════════════════════════════════════════
//  29. Stock Brokerage
// ═════════════════════════════════════════════════════════════

const stockBrokerage: LLDProblem = {
  id: "prob-stock-brokerage",
  name: "Stock Brokerage System",
  difficulty: 4,
  description:
    "The NYSE matches 6 billion shares per day, executing trades in under 50 microseconds. " +
    "A buy order at $150.00 must instantly find the best matching sell order, handle partial fills, " +
    "and update thousands of subscribed clients in real time. " +
    "Design a stock brokerage system with an order book, market/limit order matching, " +
    "portfolio management, and real-time price feeds. " +
    "Tests priority queues, Observer pattern, and Strategy pattern -- asked at Goldman, Robinhood, and Citadel.",
  requirements: [
    "Support market orders (execute immediately at best price) and limit orders (execute at specified price or better)",
    "Maintain an order book that matches buy and sell orders using price-time priority",
    "Track user portfolios with holdings, average cost basis, and profit/loss",
    "Provide real-time price updates to subscribed clients",
    "Handle partial fills when order quantity exceeds available matching orders",
  ],
  slug: "stock-brokerage",
  seoDifficulty: "hard",
  category: "real-time",
  keyPatterns: ["Observer", "Strategy", "Command", "Singleton"],
  interviewFrequency: "medium",
  classCount: 10,
  relatedProblems: ["online-shopping", "rate-limiter", "pub-sub-system"],
  starterClasses: [
    {
      id: "sb-exchange",
      name: "StockExchange",
      stereotype: "class",
      attributes: [
        { id: "sb-exchange-attr-0", name: "orderBooks", type: "Map<string, OrderBook>", visibility: "-" },
        { id: "sb-exchange-attr-1", name: "portfolios", type: "Map<string, Portfolio>", visibility: "-" },
      ],
      methods: [
        { id: "sb-exchange-meth-0", name: "placeOrder", returnType: "Trade[]", params: ["order: Order"], visibility: "+" },
        { id: "sb-exchange-meth-1", name: "getQuote", returnType: "Quote", params: ["symbol: string"], visibility: "+" },
      ],
      x: 50,
      y: 50,
    },
    {
      id: "sb-order",
      name: "Order",
      stereotype: "class",
      attributes: [
        { id: "sb-order-attr-0", name: "id", type: "string", visibility: "-" },
        { id: "sb-order-attr-1", name: "symbol", type: "string", visibility: "-" },
        { id: "sb-order-attr-2", name: "type", type: "OrderType", visibility: "-" },
        { id: "sb-order-attr-3", name: "side", type: "BuyOrSell", visibility: "-" },
        { id: "sb-order-attr-4", name: "quantity", type: "number", visibility: "-" },
        { id: "sb-order-attr-5", name: "price", type: "number | null", visibility: "-" },
      ],
      methods: [
        { id: "sb-order-meth-0", name: "isFilled", returnType: "boolean", params: [], visibility: "+" },
      ],
      x: 300,
      y: 50,
    },
    {
      id: "sb-orderbook",
      name: "OrderBook",
      stereotype: "class",
      attributes: [
        { id: "sb-orderbook-attr-0", name: "buyOrders", type: "Order[]", visibility: "-" },
        { id: "sb-orderbook-attr-1", name: "sellOrders", type: "Order[]", visibility: "-" },
      ],
      methods: [
        { id: "sb-orderbook-meth-0", name: "addOrder", returnType: "Trade[]", params: ["order: Order"], visibility: "+" },
        { id: "sb-orderbook-meth-1", name: "matchOrders", returnType: "Trade[]", params: [], visibility: "-" },
        { id: "sb-orderbook-meth-2", name: "getBestBid", returnType: "number", params: [], visibility: "+" },
        { id: "sb-orderbook-meth-3", name: "getBestAsk", returnType: "number", params: [], visibility: "+" },
      ],
      x: 550,
      y: 50,
    },
    {
      id: "sb-portfolio",
      name: "Portfolio",
      stereotype: "class",
      attributes: [
        { id: "sb-portfolio-attr-0", name: "userId", type: "string", visibility: "-" },
        { id: "sb-portfolio-attr-1", name: "holdings", type: "Map<string, Holding>", visibility: "-" },
        { id: "sb-portfolio-attr-2", name: "balance", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "sb-portfolio-meth-0", name: "addHolding", returnType: "void", params: ["trade: Trade"], visibility: "+" },
        { id: "sb-portfolio-meth-1", name: "getTotalValue", returnType: "number", params: [], visibility: "+" },
      ],
      x: 50,
      y: 280,
    },
    {
      id: "sb-trade",
      name: "Trade",
      stereotype: "class",
      attributes: [
        { id: "sb-trade-attr-0", name: "id", type: "string", visibility: "-" },
        { id: "sb-trade-attr-1", name: "buyOrderId", type: "string", visibility: "-" },
        { id: "sb-trade-attr-2", name: "sellOrderId", type: "string", visibility: "-" },
        { id: "sb-trade-attr-3", name: "price", type: "number", visibility: "-" },
        { id: "sb-trade-attr-4", name: "quantity", type: "number", visibility: "-" },
      ],
      methods: [],
      x: 550,
      y: 280,
    },
    {
      id: "sb-holding",
      name: "Holding",
      stereotype: "class",
      attributes: [
        { id: "sb-holding-attr-0", name: "symbol", type: "string", visibility: "-" },
        { id: "sb-holding-attr-1", name: "quantity", type: "number", visibility: "-" },
        { id: "sb-holding-attr-2", name: "avgCostBasis", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "sb-holding-meth-0", name: "getMarketValue", returnType: "number", params: ["currentPrice: number"], visibility: "+" },
        { id: "sb-holding-meth-1", name: "getProfitLoss", returnType: "number", params: ["currentPrice: number"], visibility: "+" },
      ],
      x: 50,
      y: 480,
    },
    {
      id: "sb-quote",
      name: "Quote",
      stereotype: "class",
      attributes: [
        { id: "sb-quote-attr-0", name: "symbol", type: "string", visibility: "-" },
        { id: "sb-quote-attr-1", name: "bidPrice", type: "number", visibility: "-" },
        { id: "sb-quote-attr-2", name: "askPrice", type: "number", visibility: "-" },
        { id: "sb-quote-attr-3", name: "lastTradedPrice", type: "number", visibility: "-" },
        { id: "sb-quote-attr-4", name: "volume", type: "number", visibility: "-" },
      ],
      methods: [],
      x: 300,
      y: 480,
    },
    {
      id: "sb-pricealert",
      name: "PriceAlert",
      stereotype: "class",
      attributes: [
        { id: "sb-pricealert-attr-0", name: "userId", type: "string", visibility: "-" },
        { id: "sb-pricealert-attr-1", name: "symbol", type: "string", visibility: "-" },
        { id: "sb-pricealert-attr-2", name: "targetPrice", type: "number", visibility: "-" },
        { id: "sb-pricealert-attr-3", name: "direction", type: "AlertDirection", visibility: "-" },
      ],
      methods: [
        { id: "sb-pricealert-meth-0", name: "isTriggered", returnType: "boolean", params: ["currentPrice: number"], visibility: "+" },
      ],
      x: 550,
      y: 480,
    },
    {
      id: "sb-account",
      name: "Account",
      stereotype: "class",
      attributes: [
        { id: "sb-account-attr-0", name: "userId", type: "string", visibility: "-" },
        { id: "sb-account-attr-1", name: "balance", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "sb-account-meth-0", name: "deposit", returnType: "void", params: ["amount: number"], visibility: "+" },
        { id: "sb-account-meth-1", name: "withdraw", returnType: "boolean", params: ["amount: number"], visibility: "+" },
      ],
      x: 800,
      y: 50,
    },
    {
      id: "sb-stock",
      name: "Stock",
      stereotype: "class",
      attributes: [
        { id: "sb-stock-attr-0", name: "symbol", type: "string", visibility: "-" },
        { id: "sb-stock-attr-1", name: "name", type: "string", visibility: "-" },
        { id: "sb-stock-attr-2", name: "exchange", type: "string", visibility: "-" },
      ],
      methods: [
        { id: "sb-stock-meth-0", name: "getQuote", returnType: "Quote", params: [], visibility: "+" },
      ],
      x: 800,
      y: 280,
    },
  ],
  starterRelationships: [
    { id: rid(), source: "sb-exchange", target: "sb-orderbook", type: "composition", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "sb-exchange", target: "sb-portfolio", type: "composition", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "sb-exchange", target: "sb-stock", type: "aggregation", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "sb-exchange", target: "sb-account", type: "composition", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "sb-orderbook", target: "sb-order", type: "aggregation", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "sb-orderbook", target: "sb-trade", type: "association", label: "produces" },
    { id: rid(), source: "sb-portfolio", target: "sb-holding", type: "composition", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "sb-stock", target: "sb-quote", type: "association" },
    { id: rid(), source: "sb-stock", target: "sb-pricealert", type: "association", sourceCardinality: "1", targetCardinality: "*" },
  ],
  hints: [
    "Use the Strategy pattern for order matching: MarketOrderStrategy executes at best available price, LimitOrderStrategy only matches at the specified price or better.",
    "Apply the Observer pattern for real-time price updates: when a trade executes, notify all clients subscribed to that stock symbol with the new price.",
    "Model the OrderBook with two priority queues (max-heap for bids, min-heap for asks) sorted by price-time priority for O(log n) matching.",
    "Handle partial fills by splitting an order into filled and remaining portions -- a 100-share buy at 150 may match 60 shares at 149 and leave 40 shares open.",
    "Add a PriceAlert class with Observer: users subscribe to price thresholds and get notified when a stock crosses their target.",
    "Track holdings with average cost basis: on each buy, recalculate avgCost = (oldQty * oldAvg + newQty * newPrice) / totalQty.",
    "Use the Command pattern for order execution: each Order becomes a command that can be validated, queued, executed, and potentially cancelled before fill.",
  ],
};

// ═════════════════════════════════════════════════════════════
//  30. Music Streaming (Spotify)
// ═════════════════════════════════════════════════════════════

const musicStreaming: LLDProblem = {
  id: "prob-music-streaming",
  name: "Music Streaming (Spotify)",
  difficulty: 3,
  description:
    "Spotify streams 600 million tracks to 600 million users. The play queue must support " +
    "next, previous, shuffle, and repeat -- and when you switch from phone to laptop, " +
    "playback must resume at the exact same timestamp. " +
    "Design a music streaming service with song browsing, playlist management, a flexible play queue, " +
    "and personalized recommendations. The Iterator pattern gets a real workout here. " +
    "Asked at Spotify, Apple, and Amazon.",
  requirements: [
    "Users can search for songs by title, artist, or album",
    "Create, edit, and delete playlists with drag-and-drop reordering",
    "Play queue with next, previous, shuffle, and repeat modes",
    "Track listening history and generate personalized recommendations",
    "Support concurrent playback across devices with session management",
  ],
  slug: "music-streaming",
  seoDifficulty: "medium",
  category: "object-modeling",
  keyPatterns: ["Iterator", "Strategy", "Observer", "State"],
  interviewFrequency: "medium",
  classCount: 10,
  relatedProblems: ["social-media-feed", "notification-service", "card-game"],
  starterClasses: [
    {
      id: "ms-user",
      name: "User",
      stereotype: "class",
      attributes: [
        { id: "ms-user-attr-0", name: "id", type: "string", visibility: "-" },
        { id: "ms-user-attr-1", name: "name", type: "string", visibility: "-" },
        { id: "ms-user-attr-2", name: "playlists", type: "Playlist[]", visibility: "-" },
      ],
      methods: [
        { id: "ms-user-meth-0", name: "createPlaylist", returnType: "Playlist", params: ["name: string"], visibility: "+" },
        { id: "ms-user-meth-1", name: "getRecommendations", returnType: "Song[]", params: [], visibility: "+" },
      ],
      x: 50,
      y: 50,
    },
    {
      id: "ms-song",
      name: "Song",
      stereotype: "class",
      attributes: [
        { id: "ms-song-attr-0", name: "id", type: "string", visibility: "-" },
        { id: "ms-song-attr-1", name: "title", type: "string", visibility: "-" },
        { id: "ms-song-attr-2", name: "artist", type: "string", visibility: "-" },
        { id: "ms-song-attr-3", name: "durationMs", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "ms-song-meth-0", name: "getStreamUrl", returnType: "string", params: [], visibility: "+" },
      ],
      x: 300,
      y: 50,
    },
    {
      id: "ms-playlist",
      name: "Playlist",
      stereotype: "class",
      attributes: [
        { id: "ms-playlist-attr-0", name: "id", type: "string", visibility: "-" },
        { id: "ms-playlist-attr-1", name: "name", type: "string", visibility: "-" },
        { id: "ms-playlist-attr-2", name: "songs", type: "Song[]", visibility: "-" },
      ],
      methods: [
        { id: "ms-playlist-meth-0", name: "addSong", returnType: "void", params: ["song: Song"], visibility: "+" },
        { id: "ms-playlist-meth-1", name: "removeSong", returnType: "void", params: ["songId: string"], visibility: "+" },
        { id: "ms-playlist-meth-2", name: "reorder", returnType: "void", params: ["fromIdx: number", "toIdx: number"], visibility: "+" },
      ],
      x: 50,
      y: 280,
    },
    {
      id: "ms-queue",
      name: "Queue",
      stereotype: "class",
      attributes: [
        { id: "ms-queue-attr-0", name: "songs", type: "Song[]", visibility: "-" },
        { id: "ms-queue-attr-1", name: "currentIndex", type: "number", visibility: "-" },
        { id: "ms-queue-attr-2", name: "mode", type: "PlayMode", visibility: "-" },
      ],
      methods: [
        { id: "ms-queue-meth-0", name: "next", returnType: "Song", params: [], visibility: "+" },
        { id: "ms-queue-meth-1", name: "previous", returnType: "Song", params: [], visibility: "+" },
        { id: "ms-queue-meth-2", name: "shuffle", returnType: "void", params: [], visibility: "+" },
        { id: "ms-queue-meth-3", name: "setMode", returnType: "void", params: ["mode: PlayMode"], visibility: "+" },
      ],
      x: 300,
      y: 280,
    },
    {
      id: "ms-recommendation",
      name: "Recommendation",
      stereotype: "class",
      attributes: [
        { id: "ms-recommendation-attr-0", name: "algorithm", type: "RecommendationStrategy", visibility: "-" },
      ],
      methods: [
        { id: "ms-recommendation-meth-0", name: "suggest", returnType: "Song[]", params: ["history: Song[]", "limit: number"], visibility: "+" },
      ],
      x: 550,
      y: 50,
    },
    {
      id: "ms-player",
      name: "Player",
      stereotype: "class",
      attributes: [
        { id: "ms-player-attr-0", name: "currentSong", type: "Song | null", visibility: "-" },
        { id: "ms-player-attr-1", name: "positionMs", type: "number", visibility: "-" },
        { id: "ms-player-attr-2", name: "state", type: "PlayerState", visibility: "-" },
        { id: "ms-player-attr-3", name: "queue", type: "Queue", visibility: "-" },
      ],
      methods: [
        { id: "ms-player-meth-0", name: "play", returnType: "void", params: [], visibility: "+" },
        { id: "ms-player-meth-1", name: "pause", returnType: "void", params: [], visibility: "+" },
        { id: "ms-player-meth-2", name: "seek", returnType: "void", params: ["positionMs: number"], visibility: "+" },
      ],
      x: 550,
      y: 280,
    },
    {
      id: "ms-album",
      name: "Album",
      stereotype: "class",
      attributes: [
        { id: "ms-album-attr-0", name: "id", type: "string", visibility: "-" },
        { id: "ms-album-attr-1", name: "title", type: "string", visibility: "-" },
        { id: "ms-album-attr-2", name: "artist", type: "Artist", visibility: "-" },
        { id: "ms-album-attr-3", name: "songs", type: "Song[]", visibility: "-" },
      ],
      methods: [
        { id: "ms-album-meth-0", name: "getDuration", returnType: "number", params: [], visibility: "+" },
      ],
      x: 800,
      y: 50,
    },
    {
      id: "ms-artist",
      name: "Artist",
      stereotype: "class",
      attributes: [
        { id: "ms-artist-attr-0", name: "id", type: "string", visibility: "-" },
        { id: "ms-artist-attr-1", name: "name", type: "string", visibility: "-" },
        { id: "ms-artist-attr-2", name: "albums", type: "Album[]", visibility: "-" },
      ],
      methods: [],
      x: 800,
      y: 280,
    },
    {
      id: "ms-search",
      name: "SearchEngine",
      stereotype: "class",
      attributes: [
        { id: "ms-search-attr-0", name: "index", type: "Map<string, Song[]>", visibility: "-" },
      ],
      methods: [
        { id: "ms-search-meth-0", name: "search", returnType: "Song[]", params: ["query: string"], visibility: "+" },
        { id: "ms-search-meth-1", name: "indexSong", returnType: "void", params: ["song: Song"], visibility: "+" },
      ],
      x: 50,
      y: 480,
    },
  ],
  starterRelationships: [
    { id: rid(), source: "ms-user", target: "ms-playlist", type: "composition", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "ms-user", target: "ms-player", type: "composition" },
    { id: rid(), source: "ms-playlist", target: "ms-song", type: "aggregation", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "ms-album", target: "ms-song", type: "composition", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "ms-artist", target: "ms-album", type: "composition", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "ms-player", target: "ms-queue", type: "composition" },
    { id: rid(), source: "ms-queue", target: "ms-song", type: "aggregation", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "ms-user", target: "ms-recommendation", type: "dependency", label: "uses" },
    { id: rid(), source: "ms-search", target: "ms-song", type: "dependency", label: "indexes" },
  ],
  hints: [
    "Use the Iterator pattern for the Queue: SequentialIterator, ShuffleIterator, and RepeatIterator each implement different traversal strategies over the same song list.",
    "Apply the Strategy pattern for recommendations: CollaborativeFilteringStrategy, ContentBasedStrategy, and PopularityStrategy can be swapped to test different algorithms.",
    "Use the Observer pattern to synchronize playback state across devices -- when a user pauses on their phone, the desktop client updates immediately.",
    "Implement Fisher-Yates shuffle for the ShuffleIterator: it guarantees uniform distribution and O(n) time without repeating songs until all are played.",
    "Add an Album class that groups Songs by the same artist: Playlist is user-curated, Album is artist-published -- both aggregate Songs but have different lifecycles.",
    "Model the Player with a State pattern: PlayingState, PausedState, and StoppedState each define which operations (play, pause, next, seek) are valid.",
    "For search, consider a SearchEngine class that indexes songs by title, artist, and album using inverted indexes for O(1) lookup per term.",
  ],
};

// ═════════════════════════════════════════════════════════════
//  31. Food Delivery (Swiggy)
// ═════════════════════════════════════════════════════════════

const foodDelivery: LLDProblem = {
  id: "prob-food-delivery",
  name: "Food Delivery (Swiggy)",
  difficulty: 4,
  description:
    "DoorDash delivers 2 million orders per day. From the moment a customer taps 'Place Order', " +
    "the system must notify the restaurant, assign the nearest delivery agent, " +
    "and track the food through 5 status transitions -- all while estimating delivery time " +
    "within 3 minutes of accuracy. Design a food delivery system with restaurant menus, " +
    "order placement, real-time agent assignment, and status tracking. " +
    "A top question at DoorDash, Swiggy, Uber Eats, and Zomato.",
  requirements: [
    "Customers can browse restaurants, view menus, and place orders",
    "Restaurants manage their menus with items, prices, and availability",
    "Assign the nearest available delivery agent to a confirmed order",
    "Track order lifecycle: placed, confirmed, preparing, picked-up, delivered",
    "Calculate delivery fees based on distance and estimated delivery time",
  ],
  slug: "food-delivery",
  seoDifficulty: "hard",
  category: "real-time",
  keyPatterns: ["State", "Strategy", "Observer", "Factory Method"],
  interviewFrequency: "high",
  classCount: 14,
  relatedProblems: ["ride-sharing", "online-shopping", "restaurant-management"],
  starterClasses: [
    {
      id: "fd-customer",
      name: "Customer",
      stereotype: "class",
      attributes: [
        { id: "fd-customer-attr-0", name: "id", type: "string", visibility: "-" },
        { id: "fd-customer-attr-1", name: "name", type: "string", visibility: "-" },
        { id: "fd-customer-attr-2", name: "address", type: "Location", visibility: "-" },
      ],
      methods: [
        { id: "fd-customer-meth-0", name: "placeOrder", returnType: "Order", params: ["restaurant: Restaurant", "items: MenuItem[]"], visibility: "+" },
        { id: "fd-customer-meth-1", name: "trackOrder", returnType: "OrderStatus", params: ["orderId: string"], visibility: "+" },
      ],
      x: 50,
      y: 50,
    },
    {
      id: "fd-restaurant",
      name: "Restaurant",
      stereotype: "class",
      attributes: [
        { id: "fd-restaurant-attr-0", name: "id", type: "string", visibility: "-" },
        { id: "fd-restaurant-attr-1", name: "name", type: "string", visibility: "-" },
        { id: "fd-restaurant-attr-2", name: "menu", type: "Menu", visibility: "-" },
        { id: "fd-restaurant-attr-3", name: "location", type: "Location", visibility: "-" },
      ],
      methods: [
        { id: "fd-restaurant-meth-0", name: "acceptOrder", returnType: "void", params: ["orderId: string"], visibility: "+" },
        { id: "fd-restaurant-meth-1", name: "markReady", returnType: "void", params: ["orderId: string"], visibility: "+" },
      ],
      x: 300,
      y: 50,
    },
    {
      id: "fd-menu",
      name: "Menu",
      stereotype: "class",
      attributes: [
        { id: "fd-menu-attr-0", name: "items", type: "MenuItem[]", visibility: "-" },
      ],
      methods: [
        { id: "fd-menu-meth-0", name: "addItem", returnType: "void", params: ["item: MenuItem"], visibility: "+" },
        { id: "fd-menu-meth-1", name: "getAvailableItems", returnType: "MenuItem[]", params: [], visibility: "+" },
      ],
      x: 300,
      y: 280,
    },
    {
      id: "fd-order",
      name: "Order",
      stereotype: "class",
      attributes: [
        { id: "fd-order-attr-0", name: "id", type: "string", visibility: "-" },
        { id: "fd-order-attr-1", name: "items", type: "MenuItem[]", visibility: "-" },
        { id: "fd-order-attr-2", name: "status", type: "OrderStatus", visibility: "-" },
        { id: "fd-order-attr-3", name: "total", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "fd-order-meth-0", name: "updateStatus", returnType: "void", params: ["status: OrderStatus"], visibility: "+" },
        { id: "fd-order-meth-1", name: "assignAgent", returnType: "void", params: ["agent: DeliveryAgent"], visibility: "+" },
      ],
      x: 550,
      y: 50,
    },
    {
      id: "fd-agent",
      name: "DeliveryAgent",
      stereotype: "class",
      attributes: [
        { id: "fd-agent-attr-0", name: "id", type: "string", visibility: "-" },
        { id: "fd-agent-attr-1", name: "name", type: "string", visibility: "-" },
        { id: "fd-agent-attr-2", name: "location", type: "Location", visibility: "-" },
        { id: "fd-agent-attr-3", name: "available", type: "boolean", visibility: "-" },
      ],
      methods: [
        { id: "fd-agent-meth-0", name: "pickUp", returnType: "void", params: ["orderId: string"], visibility: "+" },
        { id: "fd-agent-meth-1", name: "deliver", returnType: "void", params: ["orderId: string"], visibility: "+" },
      ],
      x: 550,
      y: 280,
    },
    {
      id: "fd-menuitem",
      name: "MenuItem",
      stereotype: "class",
      attributes: [
        { id: "fd-menuitem-attr-0", name: "id", type: "string", visibility: "-" },
        { id: "fd-menuitem-attr-1", name: "name", type: "string", visibility: "-" },
        { id: "fd-menuitem-attr-2", name: "price", type: "number", visibility: "-" },
        { id: "fd-menuitem-attr-3", name: "available", type: "boolean", visibility: "-" },
      ],
      methods: [
        { id: "fd-menuitem-meth-0", name: "isAvailable", returnType: "boolean", params: [], visibility: "+" },
      ],
      x: 50,
      y: 280,
    },
    {
      id: "fd-assignment",
      name: "DeliveryAssignmentStrategy",
      stereotype: "interface",
      attributes: [],
      methods: [
        { id: "fd-assignment-meth-0", name: "assign", returnType: "DeliveryAgent", params: ["agents: DeliveryAgent[]", "restaurant: Restaurant"], visibility: "+" },
      ],
      x: 800,
      y: 280,
    },
    {
      id: "fd-cart",
      name: "Cart",
      stereotype: "class",
      attributes: [
        { id: "fd-cart-attr-0", name: "items", type: "CartItem[]", visibility: "-" },
        { id: "fd-cart-attr-1", name: "restaurantId", type: "string", visibility: "-" },
      ],
      methods: [
        { id: "fd-cart-meth-0", name: "addItem", returnType: "void", params: ["item: MenuItem", "qty: number"], visibility: "+" },
        { id: "fd-cart-meth-1", name: "removeItem", returnType: "void", params: ["itemId: string"], visibility: "+" },
        { id: "fd-cart-meth-2", name: "getTotal", returnType: "number", params: [], visibility: "+" },
      ],
      x: 50,
      y: 510,
    },
    {
      id: "fd-payment",
      name: "PaymentProcessor",
      stereotype: "interface",
      attributes: [],
      methods: [
        { id: "fd-payment-meth-0", name: "charge", returnType: "boolean", params: ["amount: number", "method: string"], visibility: "+" },
        { id: "fd-payment-meth-1", name: "refund", returnType: "boolean", params: ["transactionId: string"], visibility: "+" },
      ],
      x: 800,
      y: 50,
    },
    {
      id: "fd-rating",
      name: "Rating",
      stereotype: "class",
      attributes: [
        { id: "fd-rating-attr-0", name: "score", type: "number", visibility: "-" },
        { id: "fd-rating-attr-1", name: "comment", type: "string", visibility: "-" },
        { id: "fd-rating-attr-2", name: "orderId", type: "string", visibility: "-" },
      ],
      methods: [
        { id: "fd-rating-meth-0", name: "submit", returnType: "void", params: [], visibility: "+" },
      ],
      x: 800,
      y: 510,
    },
    {
      id: "fd-location",
      name: "Location",
      stereotype: "class",
      attributes: [
        { id: "fd-location-attr-0", name: "latitude", type: "number", visibility: "-" },
        { id: "fd-location-attr-1", name: "longitude", type: "number", visibility: "-" },
        { id: "fd-location-attr-2", name: "address", type: "string", visibility: "-" },
      ],
      methods: [
        { id: "fd-location-meth-0", name: "distanceTo", returnType: "number", params: ["other: Location"], visibility: "+" },
      ],
      x: 550,
      y: 510,
    },
    {
      id: "fd-orderstate",
      name: "OrderState",
      stereotype: "interface",
      attributes: [],
      methods: [
        { id: "fd-orderstate-meth-0", name: "next", returnType: "OrderState", params: ["order: Order"], visibility: "+" },
        { id: "fd-orderstate-meth-1", name: "cancel", returnType: "OrderState", params: ["order: Order"], visibility: "+" },
      ],
      x: 1050,
      y: 50,
    },
  ],
  starterRelationships: [
    { id: rid(), source: "fd-customer", target: "fd-order", type: "association", label: "places" },
    { id: rid(), source: "fd-restaurant", target: "fd-menu", type: "composition" },
    { id: rid(), source: "fd-menu", target: "fd-menuitem", type: "composition", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "fd-order", target: "fd-restaurant", type: "association", label: "from" },
    { id: rid(), source: "fd-order", target: "fd-agent", type: "association", label: "delivered by" },
    { id: rid(), source: "fd-order", target: "fd-assignment", type: "dependency", label: "uses" },
    { id: rid(), source: "fd-order", target: "fd-payment", type: "dependency", label: "paid via" },
    { id: rid(), source: "fd-order", target: "fd-orderstate", type: "association", label: "current state" },
    { id: rid(), source: "fd-order", target: "fd-rating", type: "association", label: "rated by" },
    { id: rid(), source: "fd-agent", target: "fd-location", type: "association", label: "at" },
    { id: rid(), source: "fd-restaurant", target: "fd-location", type: "association", label: "at" },
    { id: rid(), source: "fd-customer", target: "fd-cart", type: "composition" },
  ],
  hints: [
    "Start by identifying the core entities: Customer, Restaurant, Menu, MenuItem, Order, and DeliveryAgent. Map their attributes and key operations before thinking about patterns.",
    "Use the State pattern for order lifecycle: PlacedState, ConfirmedState, PreparingState, PickedUpState, and DeliveredState define valid transitions and actions at each stage.",
    "Add a Cart class to hold items before checkout. A customer's cart is tied to a single restaurant -- clearing the cart when switching restaurants prevents cross-restaurant orders.",
    "Apply the Strategy pattern for delivery agent assignment: NearestAgentStrategy, LeastBusyStrategy, and RoundRobinStrategy allow different allocation algorithms.",
    "Use the Observer pattern to push real-time order status updates to customers and notify delivery agents of new assignments.",
    "Model Location as a first-class entity with latitude/longitude and a distanceTo() method. Customer, Restaurant, and DeliveryAgent all hold a Location reference.",
    "Add a Rating class and a PaymentProcessor interface. Rating enables post-delivery feedback; PaymentProcessor abstracts over card, wallet, and cash-on-delivery methods.",
  ],
  complexityAnalysis:
    "browseRestaurants O(R) where R = restaurants in area | " +
    "placeOrder O(K) where K = items in cart | " +
    "assignAgent O(A) where A = available agents (Strategy scan) | " +
    "updateOrderStatus O(1) -- State pattern transition | " +
    "trackOrder O(1) -- read current state | " +
    "calculateDeliveryFee O(1) -- distance formula | " +
    "With spatial index (geohash), agent lookup drops to O(log A + K)",
};

// ═════════════════════════════════════════════════════════════
//  32. Course Registration System
// ═════════════════════════════════════════════════════════════

const courseRegistration: LLDProblem = {
  id: "prob-course-registration",
  name: "Course Registration System",
  difficulty: 3,
  description:
    "When course registration opens at a university with 50,000 students, " +
    "the system gets hit with 100,000 requests in the first 60 seconds. " +
    "CS101 has 300 seats and 2,000 students trying to enroll simultaneously. " +
    "Design a registration system that enforces capacity limits with waitlists, " +
    "validates prerequisite chains, detects time slot conflicts, and handles add/drop deadlines. " +
    "Tests Chain of Responsibility and Observer patterns -- asked at Microsoft, Oracle, and Workday.",
  requirements: [
    "Students can browse available courses and enroll if prerequisites are met",
    "Enforce course capacity limits with waitlist support",
    "Detect and prevent time slot conflicts in a student's schedule",
    "Validate prerequisite chains before allowing enrollment",
    "Support add/drop period with deadline enforcement",
  ],
  slug: "course-registration",
  seoDifficulty: "medium",
  category: "booking-system",
  keyPatterns: ["Observer", "Strategy", "Chain of Responsibility", "Iterator"],
  interviewFrequency: "medium",
  classCount: 11,
  relatedProblems: ["library-management", "hotel-booking", "airline-booking"],
  starterClasses: [
    {
      id: "cr-student",
      name: "Student",
      stereotype: "class",
      attributes: [
        { id: "cr-student-attr-0", name: "id", type: "string", visibility: "-" },
        { id: "cr-student-attr-1", name: "name", type: "string", visibility: "-" },
        { id: "cr-student-attr-2", name: "completedCourses", type: "Course[]", visibility: "-" },
      ],
      methods: [
        { id: "cr-student-meth-0", name: "enroll", returnType: "EnrollmentResult", params: ["course: Course"], visibility: "+" },
        { id: "cr-student-meth-1", name: "drop", returnType: "void", params: ["courseId: string"], visibility: "+" },
        { id: "cr-student-meth-2", name: "getSchedule", returnType: "Schedule", params: [], visibility: "+" },
      ],
      x: 50,
      y: 50,
    },
    {
      id: "cr-course",
      name: "Course",
      stereotype: "class",
      attributes: [
        { id: "cr-course-attr-0", name: "id", type: "string", visibility: "-" },
        { id: "cr-course-attr-1", name: "name", type: "string", visibility: "-" },
        { id: "cr-course-attr-2", name: "capacity", type: "number", visibility: "-" },
        { id: "cr-course-attr-3", name: "prerequisites", type: "Course[]", visibility: "-" },
      ],
      methods: [
        { id: "cr-course-meth-0", name: "hasSpace", returnType: "boolean", params: [], visibility: "+" },
        { id: "cr-course-meth-1", name: "addToWaitlist", returnType: "void", params: ["student: Student"], visibility: "+" },
      ],
      x: 300,
      y: 50,
    },
    {
      id: "cr-enrollment",
      name: "Enrollment",
      stereotype: "class",
      attributes: [
        { id: "cr-enrollment-attr-0", name: "student", type: "Student", visibility: "-" },
        { id: "cr-enrollment-attr-1", name: "course", type: "Course", visibility: "-" },
        { id: "cr-enrollment-attr-2", name: "status", type: "EnrollmentStatus", visibility: "-" },
        { id: "cr-enrollment-attr-3", name: "enrolledAt", type: "Date", visibility: "-" },
      ],
      methods: [
        { id: "cr-enrollment-meth-0", name: "confirm", returnType: "void", params: [], visibility: "+" },
        { id: "cr-enrollment-meth-1", name: "cancel", returnType: "void", params: [], visibility: "+" },
      ],
      x: 550,
      y: 50,
    },
    {
      id: "cr-schedule",
      name: "Schedule",
      stereotype: "class",
      attributes: [
        { id: "cr-schedule-attr-0", name: "timeSlots", type: "TimeSlot[]", visibility: "-" },
      ],
      methods: [
        { id: "cr-schedule-meth-0", name: "hasConflict", returnType: "boolean", params: ["newSlot: TimeSlot"], visibility: "+" },
        { id: "cr-schedule-meth-1", name: "addSlot", returnType: "void", params: ["slot: TimeSlot"], visibility: "+" },
      ],
      x: 50,
      y: 280,
    },
    {
      id: "cr-prerequisite",
      name: "Prerequisite",
      stereotype: "class",
      attributes: [
        { id: "cr-prerequisite-attr-0", name: "requiredCourse", type: "Course", visibility: "-" },
        { id: "cr-prerequisite-attr-1", name: "minimumGrade", type: "string", visibility: "-" },
      ],
      methods: [
        { id: "cr-prerequisite-meth-0", name: "isSatisfiedBy", returnType: "boolean", params: ["student: Student"], visibility: "+" },
      ],
      x: 300,
      y: 280,
    },
    {
      id: "cr-section",
      name: "Section",
      stereotype: "class",
      attributes: [
        { id: "cr-section-attr-0", name: "sectionId", type: "string", visibility: "-" },
        { id: "cr-section-attr-1", name: "instructor", type: "string", visibility: "-" },
        { id: "cr-section-attr-2", name: "timeSlot", type: "TimeSlot", visibility: "-" },
        { id: "cr-section-attr-3", name: "enrolledCount", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "cr-section-meth-0", name: "isFull", returnType: "boolean", params: [], visibility: "+" },
      ],
      x: 550,
      y: 280,
    },
    {
      id: "cr-waitlist",
      name: "Waitlist",
      stereotype: "class",
      attributes: [
        { id: "cr-waitlist-attr-0", name: "queue", type: "Student[]", visibility: "-" },
        { id: "cr-waitlist-attr-1", name: "maxSize", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "cr-waitlist-meth-0", name: "add", returnType: "boolean", params: ["student: Student"], visibility: "+" },
        { id: "cr-waitlist-meth-1", name: "promoteNext", returnType: "Student | null", params: [], visibility: "+" },
        { id: "cr-waitlist-meth-2", name: "position", returnType: "number", params: ["student: Student"], visibility: "+" },
      ],
      x: 800,
      y: 50,
    },
    {
      id: "cr-timeslot",
      name: "TimeSlot",
      stereotype: "class",
      attributes: [
        { id: "cr-timeslot-attr-0", name: "day", type: "DayOfWeek", visibility: "-" },
        { id: "cr-timeslot-attr-1", name: "startTime", type: "string", visibility: "-" },
        { id: "cr-timeslot-attr-2", name: "endTime", type: "string", visibility: "-" },
        { id: "cr-timeslot-attr-3", name: "room", type: "string", visibility: "-" },
      ],
      methods: [
        { id: "cr-timeslot-meth-0", name: "overlapsWith", returnType: "boolean", params: ["other: TimeSlot"], visibility: "+" },
      ],
      x: 800,
      y: 280,
    },
    {
      id: "cr-department",
      name: "Department",
      stereotype: "class",
      attributes: [
        { id: "cr-department-attr-0", name: "name", type: "string", visibility: "-" },
        { id: "cr-department-attr-1", name: "courses", type: "Course[]", visibility: "-" },
      ],
      methods: [
        { id: "cr-department-meth-0", name: "getOfferings", returnType: "Course[]", params: ["semester: string"], visibility: "+" },
      ],
      x: 50,
      y: 510,
    },
    {
      id: "cr-enrollvalidator",
      name: "EnrollmentValidator",
      stereotype: "interface",
      attributes: [],
      methods: [
        { id: "cr-enrollvalidator-meth-0", name: "validate", returnType: "ValidationResult", params: ["student: Student", "course: Course"], visibility: "+" },
        { id: "cr-enrollvalidator-meth-1", name: "setNext", returnType: "void", params: ["next: EnrollmentValidator"], visibility: "+" },
      ],
      x: 300,
      y: 510,
    },
  ],
  starterRelationships: [
    { id: rid(), source: "cr-student", target: "cr-enrollment", type: "association", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "cr-enrollment", target: "cr-course", type: "association" },
    { id: rid(), source: "cr-student", target: "cr-schedule", type: "composition" },
    { id: rid(), source: "cr-course", target: "cr-prerequisite", type: "composition", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "cr-course", target: "cr-section", type: "composition", sourceCardinality: "1", targetCardinality: "1..*" },
    { id: rid(), source: "cr-course", target: "cr-waitlist", type: "composition" },
    { id: rid(), source: "cr-section", target: "cr-timeslot", type: "association" },
    { id: rid(), source: "cr-schedule", target: "cr-timeslot", type: "aggregation", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "cr-department", target: "cr-course", type: "composition", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "cr-enrollment", target: "cr-enrollvalidator", type: "dependency", label: "validated by" },
  ],
  hints: [
    "Start with the core entities: Student, Course, Section, and Enrollment. A Course can have multiple Sections (different time slots); a Section holds the actual capacity.",
    "Use the Chain of Responsibility pattern for enrollment validation: PrerequisiteCheck, CapacityCheck, TimeConflictCheck, and DeadlineCheck form a chain that a request must pass through.",
    "Add a Waitlist class with a priority queue. When a student drops, Observer fires and the Waitlist automatically promotes the next student -- but only if they still pass all validation checks.",
    "Apply the Observer pattern for waitlist management: when a student drops a course, automatically notify and enroll the next student on the waitlist.",
    "Model TimeSlot as a first-class entity with day, startTime, endTime. The Schedule holds a collection of TimeSlots and uses overlapsWith() to detect conflicts before enrollment.",
    "Model prerequisites as a directed acyclic graph (DAG) and use topological sort to validate that all prerequisite chains are satisfied.",
    "Consider edge cases: concurrent enrollment requests (optimistic locking), credit-hour limits per semester, and add/drop deadline enforcement via a date check in the validation chain.",
  ],
  complexityAnalysis:
    "enroll O(P + S) where P = prerequisite chain depth, S = schedule slots for conflict check | " +
    "prerequisiteCheck O(P) -- DFS/BFS through prerequisite DAG | " +
    "timeConflictCheck O(S) -- scan existing schedule slots | " +
    "waitlistPromotion O(V) where V = validation chain length per candidate | " +
    "browseCourses O(C) where C = courses in department | " +
    "With indexed prerequisites, chain validation drops to O(1) amortized via caching",
};

// ═════════════════════════════════════════════════════════════
//  33. Coffee Vending Machine
// ═════════════════════════════════════════════════════════════

const coffeeVendingMachine: LLDProblem = {
  id: "prob-coffee-vending-machine",
  name: "Coffee Vending Machine",
  difficulty: 2,
  description:
    "Starbucks operates 16,000 automated machines that each brew 200+ drinks per day. " +
    "A latte needs 18g of coffee, 200ml of milk, and 50ml of water -- if any ingredient runs low, " +
    "the machine must gracefully degrade (offer espresso instead of latte). " +
    "Design a coffee vending machine with multiple beverages, ingredient inventory tracking, " +
    "payment processing, the brewing lifecycle, and the Decorator pattern for customizations " +
    "(extra shot, oat milk, sugar level). A clean OOP problem often asked as a warm-up at Amazon and Google.",
  requirements: [
    "Support multiple beverage types: espresso, latte, cappuccino, hot chocolate",
    "Track ingredient inventory (coffee beans, milk, water, chocolate) and reject orders when insufficient",
    "Process coin and card payments with change dispensing",
    "Handle the brewing lifecycle: idle, selecting, paying, brewing, dispensing",
    "Support beverage customizations: extra shot, sugar level, milk type",
  ],
  slug: "coffee-vending-machine",
  seoDifficulty: "easy",
  category: "object-modeling",
  keyPatterns: ["State", "Strategy", "Factory Method", "Decorator"],
  interviewFrequency: "medium",
  classCount: 10,
  relatedProblems: ["vending-machine", "atm", "parking-lot"],
  starterClasses: [
    {
      id: "cvm-machine",
      name: "CoffeeVendingMachine",
      stereotype: "class",
      attributes: [
        { id: "cvm-machine-attr-0", name: "state", type: "MachineState", visibility: "-" },
        { id: "cvm-machine-attr-1", name: "inventory", type: "IngredientInventory", visibility: "-" },
        { id: "cvm-machine-attr-2", name: "menu", type: "Beverage[]", visibility: "-" },
      ],
      methods: [
        { id: "cvm-machine-meth-0", name: "selectBeverage", returnType: "void", params: ["beverageId: string"], visibility: "+" },
        { id: "cvm-machine-meth-1", name: "insertPayment", returnType: "void", params: ["payment: Payment"], visibility: "+" },
        { id: "cvm-machine-meth-2", name: "brew", returnType: "void", params: [], visibility: "-" },
        { id: "cvm-machine-meth-3", name: "dispense", returnType: "void", params: [], visibility: "-" },
      ],
      x: 50,
      y: 50,
    },
    {
      id: "cvm-beverage",
      name: "Beverage",
      stereotype: "abstract",
      attributes: [
        { id: "cvm-beverage-attr-0", name: "id", type: "string", visibility: "-" },
        { id: "cvm-beverage-attr-1", name: "name", type: "string", visibility: "-" },
        { id: "cvm-beverage-attr-2", name: "price", type: "number", visibility: "-" },
        { id: "cvm-beverage-attr-3", name: "recipe", type: "Recipe", visibility: "-" },
      ],
      methods: [
        { id: "cvm-beverage-meth-0", name: "canBrew", returnType: "boolean", params: ["inventory: IngredientInventory"], visibility: "+" },
        { id: "cvm-beverage-meth-1", name: "getCost", returnType: "number", params: [], visibility: "+" },
        { id: "cvm-beverage-meth-2", name: "getDescription", returnType: "string", params: [], visibility: "+" },
      ],
      x: 300,
      y: 50,
    },
    {
      id: "cvm-ingredient",
      name: "Ingredient",
      stereotype: "class",
      attributes: [
        { id: "cvm-ingredient-attr-0", name: "name", type: "string", visibility: "-" },
        { id: "cvm-ingredient-attr-1", name: "quantity", type: "number", visibility: "-" },
        { id: "cvm-ingredient-attr-2", name: "unit", type: "string", visibility: "-" },
      ],
      methods: [
        { id: "cvm-ingredient-meth-0", name: "consume", returnType: "boolean", params: ["amount: number"], visibility: "+" },
        { id: "cvm-ingredient-meth-1", name: "refill", returnType: "void", params: ["amount: number"], visibility: "+" },
      ],
      x: 550,
      y: 50,
    },
    {
      id: "cvm-payment",
      name: "Payment",
      stereotype: "interface",
      attributes: [],
      methods: [
        { id: "cvm-payment-meth-0", name: "pay", returnType: "boolean", params: ["amount: number"], visibility: "+" },
        { id: "cvm-payment-meth-1", name: "getChange", returnType: "number", params: [], visibility: "+" },
      ],
      x: 50,
      y: 280,
    },
    {
      id: "cvm-recipe",
      name: "Recipe",
      stereotype: "class",
      attributes: [
        { id: "cvm-recipe-attr-0", name: "ingredients", type: "Map<string, number>", visibility: "-" },
      ],
      methods: [
        { id: "cvm-recipe-meth-0", name: "canFulfill", returnType: "boolean", params: ["inventory: IngredientInventory"], visibility: "+" },
        { id: "cvm-recipe-meth-1", name: "consumeIngredients", returnType: "void", params: ["inventory: IngredientInventory"], visibility: "+" },
      ],
      x: 550,
      y: 280,
    },
    {
      id: "cvm-decorator",
      name: "BeverageDecorator",
      stereotype: "abstract",
      attributes: [
        { id: "cvm-decorator-attr-0", name: "wrappedBeverage", type: "Beverage", visibility: "#" },
      ],
      methods: [
        { id: "cvm-decorator-meth-0", name: "getCost", returnType: "number", params: [], visibility: "+" },
        { id: "cvm-decorator-meth-1", name: "getDescription", returnType: "string", params: [], visibility: "+" },
      ],
      x: 300,
      y: 280,
    },
    {
      id: "cvm-machinestate",
      name: "MachineState",
      stereotype: "interface",
      attributes: [],
      methods: [
        { id: "cvm-machinestate-meth-0", name: "selectBeverage", returnType: "void", params: ["machine: CoffeeVendingMachine", "beverageId: string"], visibility: "+" },
        { id: "cvm-machinestate-meth-1", name: "insertPayment", returnType: "void", params: ["machine: CoffeeVendingMachine", "payment: Payment"], visibility: "+" },
        { id: "cvm-machinestate-meth-2", name: "brew", returnType: "void", params: ["machine: CoffeeVendingMachine"], visibility: "+" },
      ],
      x: 50,
      y: 510,
    },
    {
      id: "cvm-inventory",
      name: "IngredientInventory",
      stereotype: "class",
      attributes: [
        { id: "cvm-inventory-attr-0", name: "ingredients", type: "Map<string, Ingredient>", visibility: "-" },
      ],
      methods: [
        { id: "cvm-inventory-meth-0", name: "check", returnType: "boolean", params: ["recipe: Recipe"], visibility: "+" },
        { id: "cvm-inventory-meth-1", name: "consume", returnType: "void", params: ["recipe: Recipe"], visibility: "+" },
        { id: "cvm-inventory-meth-2", name: "getLowStockAlerts", returnType: "string[]", params: [], visibility: "+" },
      ],
      x: 800,
      y: 50,
    },
  ],
  starterRelationships: [
    { id: rid(), source: "cvm-machine", target: "cvm-beverage", type: "aggregation", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "cvm-machine", target: "cvm-inventory", type: "composition" },
    { id: rid(), source: "cvm-machine", target: "cvm-payment", type: "dependency", label: "accepts" },
    { id: rid(), source: "cvm-machine", target: "cvm-machinestate", type: "association", label: "current state" },
    { id: rid(), source: "cvm-beverage", target: "cvm-recipe", type: "composition" },
    { id: rid(), source: "cvm-decorator", target: "cvm-beverage", type: "inheritance" },
    { id: rid(), source: "cvm-decorator", target: "cvm-beverage", type: "composition", label: "wraps" },
    { id: rid(), source: "cvm-inventory", target: "cvm-ingredient", type: "composition", sourceCardinality: "1", targetCardinality: "*" },
  ],
  hints: [
    "Start by identifying the core entities: CoffeeVendingMachine, Beverage, Ingredient, Recipe, and Payment. The machine manages an inventory and a menu of available beverages.",
    "Use the State pattern for the machine lifecycle: IdleState, SelectingState, PayingState, BrewingState, and DispensingState each define what operations are valid and what transitions are allowed.",
    "Apply the Decorator pattern for beverage customizations: ExtraShotDecorator, SugarDecorator, and MilkTypeDecorator wrap a base Beverage to add cost and modify the recipe.",
    "Use the Factory Method pattern for creating beverages: EspressoFactory, LatteFactory, etc., encapsulate the recipe and pricing for each type.",
    "Extract Recipe as a separate class that maps ingredient names to required amounts. This makes canBrew() a simple inventory check against the recipe.",
    "Add an IngredientInventory class that wraps the Map of ingredients. It provides check(), consume(), and getLowStockAlerts() -- separating inventory logic from the machine.",
    "Edge cases to consider: what if ingredients run out mid-brew? Use graceful degradation -- suggest alternative beverages that the current inventory can fulfill.",
  ],
  complexityAnalysis:
    "selectBeverage O(1) -- lookup by ID | " +
    "canBrew O(I) where I = ingredients in recipe | " +
    "insertPayment O(1) -- validate amount | " +
    "brew O(I) -- consume each ingredient | " +
    "dispense O(1) -- state transition | " +
    "getLowStockAlerts O(N) where N = total ingredient types | " +
    "Decorator chain: getCost and getDescription are O(D) where D = number of decorations applied",
};

// ── Merge reference solutions into problems ─────────────────

/** Apply reference content from problem-solutions.ts to matching problems. */
function withSolutions(problems: LLDProblem[]): LLDProblem[] {
  return problems.map((p) => {
    const sol = PROBLEM_SOLUTIONS[p.id];
    if (!sol) return p;
    return { ...p, ...sol };
  });
}

// ── Exports ──────────────────────────────────────────────────

export const LLD_PROBLEMS: LLDProblem[] = withSolutions([
  parkingLot,
  elevator,
  chess,
  vendingMachine,
  library,
  atm,
  hotel,
  snakeLadder,
  fileSystem,
  lruCache,
  movieTicketBooking,
  restaurantManagement,
  airlineBooking,
  ticTacToe,
  snakeGame,
  cardGame,
  notificationService,
  loggingFramework,
  cacheSystem,
  taskScheduler,
  pubSubSystem,
  rateLimiter,
  urlShortener,
  socialMediaFeed,
  spreadsheet,
  splitwise,
  rideSharing,
  onlineShopping,
  stockBrokerage,
  musicStreaming,
  foodDelivery,
  courseRegistration,
  coffeeVendingMachine,
]);

export function getProblemById(id: string): LLDProblem | undefined {
  return LLD_PROBLEMS.find((p) => p.id === id);
}

export function getProblemsByDifficulty(level: 1 | 2 | 3 | 4 | 5): LLDProblem[] {
  return LLD_PROBLEMS.filter((p) => p.difficulty === level);
}

/** Look up a LLD problem by slug. */
export function getLLDProblemBySlug(slug: string): LLDProblem | undefined {
  return LLD_PROBLEMS.find((p) => p.slug === slug);
}

/** Return all LLD problem slugs for static generation. */
export function getAllLLDProblemSlugs(): string[] {
  return LLD_PROBLEMS.map((p) => p.slug);
}

/** Return related LLD problems for a given slug. */
export function getRelatedLLDProblems(slug: string): LLDProblem[] {
  const problem = getLLDProblemBySlug(slug);
  if (!problem) return [];
  return problem.relatedProblems
    .map((relSlug) => getLLDProblemBySlug(relSlug))
    .filter((p): p is LLDProblem => p !== undefined);
}
