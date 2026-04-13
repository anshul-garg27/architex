// -----------------------------------------------------------------
// Architex -- LLD Problem Definitions (LLD-029, LLD-030)
// -----------------------------------------------------------------
//
// 33 low-level design interview problems. Each includes a
// description, difficulty level, functional requirements, starter
// UML classes, relationships, and progressive hints.
// -----------------------------------------------------------------

import type { UMLClass, UMLRelationship } from "./types";

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
      ],
      methods: [
        { id: "pl-lot-meth-0", name: "getAvailableSpots", returnType: "number", params: [], visibility: "+" },
        { id: "pl-lot-meth-1", name: "parkVehicle", returnType: "Ticket", params: ["vehicle: Vehicle"], visibility: "+" },
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
      ],
      methods: [
        { id: "pl-floor-meth-0", name: "findAvailableSpot", returnType: "ParkingSpot", params: ["type: VehicleType"], visibility: "+" },
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
      ],
      methods: [
        { id: "pl-vehicle-meth-0", name: "getType", returnType: "VehicleType", params: [], visibility: "+" },
      ],
      x: 600,
      y: 260,
    },
  ],
  starterRelationships: [
    { id: rid(), source: "pl-lot", target: "pl-floor", type: "composition", sourceCardinality: "1", targetCardinality: "1..*" },
    { id: rid(), source: "pl-floor", target: "pl-spot", type: "composition", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "pl-spot", target: "pl-vehicle", type: "association", label: "parks" },
  ],
  hints: [
    "Consider using an enum for VehicleType (MOTORCYCLE, CAR, BUS) and SpotType (SMALL, MEDIUM, LARGE).",
    "Add a Ticket class that records entry time, vehicle, and assigned spot.",
    "Use the Strategy pattern for fee calculation to support different pricing models (hourly, daily, weekend).",
  ],
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
        { id: "el-building-attr-0", name: "floors", type: "number", visibility: "-" },
        { id: "el-building-attr-1", name: "elevators", type: "Elevator[]", visibility: "-" },
      ],
      methods: [
        { id: "el-building-meth-0", name: "requestElevator", returnType: "void", params: ["floor: number", "dir: Direction"], visibility: "+" },
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
      ],
      methods: [
        { id: "el-elevator-meth-0", name: "move", returnType: "void", params: [], visibility: "+" },
        { id: "el-elevator-meth-1", name: "addStop", returnType: "void", params: ["floor: number"], visibility: "+" },
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
      ],
      methods: [],
      x: 400,
      y: 280,
    },
  ],
  starterRelationships: [
    { id: rid(), source: "el-building", target: "el-elevator", type: "composition", sourceCardinality: "1", targetCardinality: "1..*" },
    { id: rid(), source: "el-building", target: "el-dispatcher", type: "dependency", label: "uses" },
    { id: rid(), source: "el-dispatcher", target: "el-elevator", type: "dependency", label: "selects" },
  ],
  hints: [
    "Use the State pattern for elevator states (Idle, MovingUp, MovingDown, DoorOpen).",
    "The Dispatcher can use a Strategy pattern -- SCAN algorithm processes floors in one direction then reverses.",
    "Consider a priority queue for pending floor requests inside each elevator.",
  ],
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
  ],
  starterRelationships: [
    { id: rid(), source: "ch-game", target: "ch-board", type: "composition" },
    { id: rid(), source: "ch-board", target: "ch-piece", type: "aggregation", sourceCardinality: "1", targetCardinality: "0..32" },
  ],
  hints: [
    "Create concrete piece classes (King, Queen, Rook, Bishop, Knight, Pawn) each overriding getValidMoves().",
    "Use a MoveValidator that checks not just piece movement rules but also whether a move would leave the king in check.",
    "Model Position as a simple value object with row and column, and use it to simplify board coordinate logic.",
  ],
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
      ],
      methods: [
        { id: "vm-inventory-meth-0", name: "getStock", returnType: "number", params: ["code: string"], visibility: "+" },
        { id: "vm-inventory-meth-1", name: "reduce", returnType: "void", params: ["code: string"], visibility: "+" },
      ],
      x: 400,
      y: 280,
    },
  ],
  starterRelationships: [
    { id: rid(), source: "vm-machine", target: "vm-inventory", type: "composition" },
    { id: rid(), source: "vm-inventory", target: "vm-product", type: "aggregation", sourceCardinality: "1", targetCardinality: "*" },
  ],
  hints: [
    "Use the State pattern for machine states: Idle, HasMoney, Dispensing, SoldOut.",
    "Create a Coin enum with values (PENNY, NICKEL, DIME, QUARTER) and their monetary values.",
    "Add a ChangeCalculator that uses a greedy algorithm to return the fewest coins possible.",
  ],
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
  ],
  starterRelationships: [
    { id: rid(), source: "lib-library", target: "lib-book", type: "aggregation", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "lib-library", target: "lib-member", type: "aggregation", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "lib-member", target: "lib-loan", type: "association", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "lib-loan", target: "lib-book", type: "association" },
  ],
  hints: [
    "Separate Book (the title/ISBN) from BookCopy (individual physical copy with a barcode) for better modeling.",
    "Use an Observer pattern to notify members when a reserved book becomes available.",
    "Add a FineCalculator with a strategy interface so different fine policies (flat rate, per-day, capped) can be swapped.",
  ],
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
  relatedProblems: ["vending-machine", "stock-exchange", "hotel-booking"],
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
      ],
      x: 200,
      y: 300,
    },
  ],
  starterRelationships: [
    { id: rid(), source: "atm-machine", target: "atm-account", type: "dependency", label: "accesses" },
    { id: rid(), source: "atm-machine", target: "atm-transaction", type: "dependency", label: "creates" },
    { id: rid(), source: "atm-transaction", target: "atm-account", type: "association" },
  ],
  hints: [
    "Use the State pattern for ATM states: Idle, CardInserted, Authenticated, TransactionSelected.",
    "Create concrete Transaction subclasses: WithdrawalTransaction, DepositTransaction, TransferTransaction.",
    "Add a CashDispenser class that uses a Chain of Responsibility for denominations ($100, $50, $20, $10).",
  ],
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
      ],
      methods: [
        { id: "ht-room-meth-0", name: "isAvailable", returnType: "boolean", params: ["dates: DateRange"], visibility: "+" },
      ],
      x: 400,
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
      ],
      x: 200,
      y: 300,
    },
  ],
  starterRelationships: [
    { id: rid(), source: "ht-hotel", target: "ht-room", type: "composition", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "ht-reservation", target: "ht-room", type: "association" },
  ],
  hints: [
    "Add a Guest class and a Bill class that aggregates line items (room charges, minibar, room service).",
    "Use the Strategy pattern for pricing: WeekdayPricing, WeekendPricing, SeasonalPricing, each implementing a PricingStrategy interface.",
    "Consider an Observer pattern to notify housekeeping when a room status changes to 'checkout'.",
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
      ],
      methods: [
        { id: "sl-game-meth-0", name: "play", returnType: "Player", params: [], visibility: "+" },
        { id: "sl-game-meth-1", name: "takeTurn", returnType: "boolean", params: [], visibility: "-" },
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
        { id: "sl-board-attr-1", name: "snakes", type: "Map<number, number>", visibility: "-" },
        { id: "sl-board-attr-2", name: "ladders", type: "Map<number, number>", visibility: "-" },
      ],
      methods: [
        { id: "sl-board-meth-0", name: "getNextPosition", returnType: "number", params: ["position: number"], visibility: "+" },
      ],
      x: 350,
      y: 50,
    },
    {
      id: "sl-player",
      name: "Player",
      stereotype: "class",
      attributes: [
        { id: "sl-player-attr-0", name: "name", type: "string", visibility: "-" },
        { id: "sl-player-attr-1", name: "position", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "sl-player-meth-0", name: "move", returnType: "void", params: ["steps: number"], visibility: "+" },
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
  ],
  starterRelationships: [
    { id: rid(), source: "sl-game", target: "sl-board", type: "composition" },
    { id: rid(), source: "sl-game", target: "sl-player", type: "aggregation", sourceCardinality: "1", targetCardinality: "2..4" },
    { id: rid(), source: "sl-game", target: "sl-dice", type: "composition" },
  ],
  hints: [
    "Model Snake and Ladder as a common BoardEntity with a start and end position; the Board resolves movement.",
    "Use the Template Method pattern in Game.takeTurn(): roll dice, compute new position, check for snake/ladder, check for win.",
    "Add a DiceStrategy interface so you can swap between single-die and double-dice modes.",
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
      ],
      methods: [
        { id: "fs-entry-meth-0", name: "getPath", returnType: "string", params: [], visibility: "+" },
        { id: "fs-entry-meth-1", name: "getSize", returnType: "number", params: [], visibility: "+", isAbstract: true },
        { id: "fs-entry-meth-2", name: "delete", returnType: "void", params: [], visibility: "+" },
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
      ],
      methods: [
        { id: "fs-file-meth-0", name: "getSize", returnType: "number", params: [], visibility: "+" },
        { id: "fs-file-meth-1", name: "read", returnType: "string", params: [], visibility: "+" },
        { id: "fs-file-meth-2", name: "write", returnType: "void", params: ["data: string"], visibility: "+" },
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
      ],
      x: 500,
      y: 300,
    },
  ],
  starterRelationships: [
    { id: rid(), source: "fs-file", target: "fs-entry", type: "inheritance" },
    { id: rid(), source: "fs-dir", target: "fs-entry", type: "inheritance" },
    { id: rid(), source: "fs-dir", target: "fs-entry", type: "composition", label: "contains", sourceCardinality: "1", targetCardinality: "*" },
  ],
  hints: [
    "This is a textbook Composite pattern: Directory is the composite, File is the leaf, and FileSystemEntry is the component.",
    "Add a Visitor interface (FileSystemVisitor) so operations like search, size calculation, and permission checks can be added without modifying the tree classes.",
    "Model paths as a utility class that parses strings like '/home/user/file.txt' and resolves '..' for relative navigation.",
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
      ],
      methods: [
        { id: "lru-cache-meth-0", name: "get", returnType: "V | null", params: ["key: K"], visibility: "+" },
        { id: "lru-cache-meth-1", name: "put", returnType: "void", params: ["key: K", "value: V"], visibility: "+" },
        { id: "lru-cache-meth-2", name: "size", returnType: "number", params: [], visibility: "+" },
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
        { id: "lru-node-attr-0", name: "key", type: "K", visibility: "+"},
        { id: "lru-node-attr-1", name: "value", type: "V", visibility: "+" },
        { id: "lru-node-attr-2", name: "prev", type: "Node<K,V>", visibility: "+" },
        { id: "lru-node-attr-3", name: "next", type: "Node<K,V>", visibility: "+" },
      ],
      methods: [],
      x: 400,
      y: 300,
    },
  ],
  starterRelationships: [
    { id: rid(), source: "lru-cache", target: "lru-list", type: "composition" },
    { id: rid(), source: "lru-list", target: "lru-node", type: "aggregation", sourceCardinality: "1", targetCardinality: "0..*" },
    { id: rid(), source: "lru-cache", target: "lru-node", type: "association", label: "indexes via Map" },
  ],
  hints: [
    "The key insight is combining a HashMap (O(1) lookup) with a Doubly Linked List (O(1) insertion/removal) for O(1) on both operations.",
    "Use sentinel head and tail nodes in the doubly linked list to simplify edge-case handling for add/remove.",
    "Consider extending to an LFU (Least Frequently Used) cache by adding a frequency counter to each node and grouping nodes by frequency.",
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
  ],
  starterRelationships: [
    { id: rid(), source: "mtb-theater", target: "mtb-showtime", type: "composition", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "mtb-showtime", target: "mtb-seat", type: "composition", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "mtb-showtime", target: "mtb-movie", type: "association" },
    { id: rid(), source: "mtb-booking", target: "mtb-seat", type: "association", sourceCardinality: "1", targetCardinality: "1..*" },
  ],
  hints: [
    "Use the Strategy pattern for pricing: standard pricing, weekend pricing, and premium screening pricing.",
    "Add a SeatLock mechanism with TTL (e.g., 10 minutes) so temporarily held seats are auto-released if payment is not completed.",
    "Consider an Observer pattern to notify waitlisted users when a booking is cancelled and seats become available.",
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
      ],
      methods: [
        { id: "rm-table-meth-0", name: "assign", returnType: "void", params: ["partySize: number"], visibility: "+" },
        { id: "rm-table-meth-1", name: "release", returnType: "void", params: [], visibility: "+" },
      ],
      x: 350,
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
      ],
      methods: [
        { id: "rm-order-meth-0", name: "addItem", returnType: "void", params: ["item: MenuItem", "qty: number"], visibility: "+" },
        { id: "rm-order-meth-1", name: "getTotal", returnType: "number", params: [], visibility: "+" },
      ],
      x: 50,
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
      ],
      methods: [
        { id: "rm-menuitem-meth-0", name: "isAvailable", returnType: "boolean", params: [], visibility: "+" },
      ],
      x: 350,
      y: 280,
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
      x: 200,
      y: 480,
    },
  ],
  starterRelationships: [
    { id: rid(), source: "rm-restaurant", target: "rm-table", type: "composition", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "rm-order", target: "rm-table", type: "association" },
    { id: rid(), source: "rm-order", target: "rm-menuitem", type: "aggregation", sourceCardinality: "1", targetCardinality: "1..*" },
    { id: rid(), source: "rm-bill", target: "rm-order", type: "association" },
  ],
  hints: [
    "Use the Command pattern for orders: each order item is a command sent to the kitchen that can be queued, executed, and undone.",
    "Model OrderStatus as a State pattern with states: Placed, InPreparation, Ready, Served, Cancelled.",
    "Add a KitchenDisplay class that observes order events and prioritizes preparation based on order time and complexity.",
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
  relatedProblems: ["hotel-booking", "movie-ticket-booking", "stock-exchange"],
  starterClasses: [
    {
      id: "ab-flight",
      name: "Flight",
      stereotype: "class",
      attributes: [
        { id: "ab-flight-attr-0", name: "flightNumber", type: "string", visibility: "-" },
        { id: "ab-flight-attr-1", name: "origin", type: "string", visibility: "-" },
        { id: "ab-flight-attr-2", name: "destination", type: "string", visibility: "-" },
        { id: "ab-flight-attr-3", name: "departureTime", type: "Date", visibility: "-" },
        { id: "ab-flight-attr-4", name: "seats", type: "Seat[]", visibility: "-" },
      ],
      methods: [
        { id: "ab-flight-meth-0", name: "getAvailableSeats", returnType: "Seat[]", params: ["fareClass: FareClass"], visibility: "+" },
        { id: "ab-flight-meth-1", name: "getPrice", returnType: "number", params: ["fareClass: FareClass"], visibility: "+" },
      ],
      x: 50,
      y: 50,
    },
    {
      id: "ab-seat",
      name: "Seat",
      stereotype: "class",
      attributes: [
        { id: "ab-seat-attr-0", name: "seatNumber", type: "string", visibility: "-" },
        { id: "ab-seat-attr-1", name: "fareClass", type: "FareClass", visibility: "-" },
        { id: "ab-seat-attr-2", name: "isBooked", type: "boolean", visibility: "-" },
      ],
      methods: [
        { id: "ab-seat-meth-0", name: "reserve", returnType: "boolean", params: ["passenger: Passenger"], visibility: "+" },
      ],
      x: 350,
      y: 50,
    },
    {
      id: "ab-passenger",
      name: "Passenger",
      stereotype: "class",
      attributes: [
        { id: "ab-passenger-attr-0", name: "id", type: "string", visibility: "-" },
        { id: "ab-passenger-attr-1", name: "name", type: "string", visibility: "-" },
        { id: "ab-passenger-attr-2", name: "passport", type: "string", visibility: "-" },
      ],
      methods: [
        { id: "ab-passenger-meth-0", name: "getBookings", returnType: "Booking[]", params: [], visibility: "+" },
      ],
      x: 50,
      y: 280,
    },
    {
      id: "ab-booking",
      name: "Booking",
      stereotype: "class",
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
      x: 350,
      y: 280,
    },
    {
      id: "ab-frequentflyer",
      name: "FrequentFlyer",
      stereotype: "class",
      attributes: [
        { id: "ab-frequentflyer-attr-0", name: "memberId", type: "string", visibility: "-" },
        { id: "ab-frequentflyer-attr-1", name: "points", type: "number", visibility: "-" },
        { id: "ab-frequentflyer-attr-2", name: "tier", type: "FFTier", visibility: "-" },
      ],
      methods: [
        { id: "ab-frequentflyer-meth-0", name: "earnPoints", returnType: "void", params: ["flight: Flight"], visibility: "+" },
        { id: "ab-frequentflyer-meth-1", name: "redeemPoints", returnType: "boolean", params: ["amount: number"], visibility: "+" },
      ],
      x: 200,
      y: 480,
    },
  ],
  starterRelationships: [
    { id: rid(), source: "ab-flight", target: "ab-seat", type: "composition", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "ab-booking", target: "ab-flight", type: "association" },
    { id: rid(), source: "ab-booking", target: "ab-passenger", type: "association" },
    { id: rid(), source: "ab-frequentflyer", target: "ab-passenger", type: "association", label: "extends" },
  ],
  hints: [
    "Use the State pattern for booking lifecycle: Reserved -> Confirmed -> CheckedIn -> Boarded, with cancel transitions from early states.",
    "Apply the Builder pattern for creating complex multi-leg itineraries with connecting flights and layover management.",
    "Consider a Strategy pattern for fare pricing that accounts for demand, advance purchase, and frequent flyer tier discounts.",
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
  classCount: 8,
  relatedProblems: ["chess-game", "snake-game", "card-game"],
  starterClasses: [
    {
      id: "ttt-game",
      name: "Game",
      stereotype: "class",
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
      x: 50,
      y: 50,
    },
    {
      id: "ttt-board",
      name: "Board",
      stereotype: "class",
      attributes: [
        { id: "ttt-board-attr-0", name: "size", type: "number", visibility: "-" },
        { id: "ttt-board-attr-1", name: "grid", type: "Symbol[][]", visibility: "-" },
      ],
      methods: [
        { id: "ttt-board-meth-0", name: "placeMark", returnType: "boolean", params: ["row: number", "col: number", "symbol: Symbol"], visibility: "+" },
        { id: "ttt-board-meth-1", name: "isFull", returnType: "boolean", params: [], visibility: "+" },
        { id: "ttt-board-meth-2", name: "getCell", returnType: "Symbol", params: ["row: number", "col: number"], visibility: "+" },
      ],
      x: 350,
      y: 50,
    },
    {
      id: "ttt-player",
      name: "Player",
      stereotype: "class",
      attributes: [
        { id: "ttt-player-attr-0", name: "name", type: "string", visibility: "-" },
        { id: "ttt-player-attr-1", name: "symbol", type: "Symbol", visibility: "-" },
      ],
      methods: [
        { id: "ttt-player-meth-0", name: "getMove", returnType: "Move", params: ["board: Board"], visibility: "+" },
      ],
      x: 50,
      y: 280,
    },
    {
      id: "ttt-move",
      name: "Move",
      stereotype: "class",
      attributes: [
        { id: "ttt-move-attr-0", name: "row", type: "number", visibility: "-" },
        { id: "ttt-move-attr-1", name: "col", type: "number", visibility: "-" },
        { id: "ttt-move-attr-2", name: "player", type: "Player", visibility: "-" },
      ],
      methods: [],
      x: 350,
      y: 280,
    },
  ],
  starterRelationships: [
    { id: rid(), source: "ttt-game", target: "ttt-board", type: "composition" },
    { id: rid(), source: "ttt-game", target: "ttt-player", type: "aggregation", sourceCardinality: "1", targetCardinality: "2" },
    { id: rid(), source: "ttt-game", target: "ttt-move", type: "dependency", label: "creates" },
  ],
  hints: [
    "Use the Strategy pattern for player move logic: HumanMoveStrategy prompts input, AIMoveStrategy uses minimax or random selection.",
    "For win detection on NxN boards, check rows, columns, and both diagonals -- store counts per line instead of scanning the full board each time.",
    "Add a GameHistory class using the Memento pattern to support undo/redo of moves.",
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
    {
      id: "sg-game",
      name: "Game",
      stereotype: "class",
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
      x: 50,
      y: 50,
    },
    {
      id: "sg-snake",
      name: "Snake",
      stereotype: "class",
      attributes: [
        { id: "sg-snake-attr-0", name: "body", type: "Position[]", visibility: "-" },
        { id: "sg-snake-attr-1", name: "direction", type: "Direction", visibility: "-" },
      ],
      methods: [
        { id: "sg-snake-meth-0", name: "move", returnType: "void", params: [], visibility: "+" },
        { id: "sg-snake-meth-1", name: "grow", returnType: "void", params: [], visibility: "+" },
        { id: "sg-snake-meth-2", name: "changeDirection", returnType: "void", params: ["dir: Direction"], visibility: "+" },
        { id: "sg-snake-meth-3", name: "collidesWithSelf", returnType: "boolean", params: [], visibility: "+" },
      ],
      x: 350,
      y: 50,
    },
    {
      id: "sg-food",
      name: "Food",
      stereotype: "class",
      attributes: [
        { id: "sg-food-attr-0", name: "position", type: "Position", visibility: "-" },
        { id: "sg-food-attr-1", name: "points", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "sg-food-meth-0", name: "spawn", returnType: "void", params: ["grid: Grid"], visibility: "+" },
      ],
      x: 50,
      y: 280,
    },
    {
      id: "sg-grid",
      name: "Grid",
      stereotype: "class",
      attributes: [
        { id: "sg-grid-attr-0", name: "width", type: "number", visibility: "-" },
        { id: "sg-grid-attr-1", name: "height", type: "number", visibility: "-" },
        { id: "sg-grid-attr-2", name: "cells", type: "CellType[][]", visibility: "-" },
      ],
      methods: [
        { id: "sg-grid-meth-0", name: "isInBounds", returnType: "boolean", params: ["pos: Position"], visibility: "+" },
        { id: "sg-grid-meth-1", name: "getRandomEmptyCell", returnType: "Position", params: [], visibility: "+" },
      ],
      x: 350,
      y: 280,
    },
  ],
  starterRelationships: [
    { id: rid(), source: "sg-game", target: "sg-snake", type: "composition" },
    { id: rid(), source: "sg-game", target: "sg-grid", type: "composition" },
    { id: rid(), source: "sg-game", target: "sg-food", type: "composition" },
  ],
  hints: [
    "Use the State pattern for game states: Running, Paused, GameOver. Each state handles tick() and handleInput() differently.",
    "Model the snake body as a deque (double-ended queue): add a new head position on each move, remove the tail unless the snake just ate food.",
    "Use the Observer pattern to notify the UI layer when the game state changes (score updated, game over, etc.).",
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
    {
      id: "cg-deck",
      name: "Deck",
      stereotype: "class",
      attributes: [
        { id: "cg-deck-attr-0", name: "cards", type: "Card[]", visibility: "-" },
      ],
      methods: [
        { id: "cg-deck-meth-0", name: "shuffle", returnType: "void", params: [], visibility: "+" },
        { id: "cg-deck-meth-1", name: "deal", returnType: "Card", params: [], visibility: "+" },
        { id: "cg-deck-meth-2", name: "remaining", returnType: "number", params: [], visibility: "+" },
      ],
      x: 50,
      y: 50,
    },
    {
      id: "cg-card",
      name: "Card",
      stereotype: "class",
      attributes: [
        { id: "cg-card-attr-0", name: "suit", type: "Suit", visibility: "-" },
        { id: "cg-card-attr-1", name: "rank", type: "Rank", visibility: "-" },
      ],
      methods: [
        { id: "cg-card-meth-0", name: "getValue", returnType: "number", params: [], visibility: "+" },
      ],
      x: 350,
      y: 50,
    },
    {
      id: "cg-hand",
      name: "Hand",
      stereotype: "class",
      attributes: [
        { id: "cg-hand-attr-0", name: "cards", type: "Card[]", visibility: "-" },
      ],
      methods: [
        { id: "cg-hand-meth-0", name: "addCard", returnType: "void", params: ["card: Card"], visibility: "+" },
        { id: "cg-hand-meth-1", name: "getScore", returnType: "number", params: [], visibility: "+" },
        { id: "cg-hand-meth-2", name: "isBust", returnType: "boolean", params: [], visibility: "+" },
        { id: "cg-hand-meth-3", name: "isBlackjack", returnType: "boolean", params: [], visibility: "+" },
      ],
      x: 50,
      y: 280,
    },
    {
      id: "cg-player",
      name: "Player",
      stereotype: "class",
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
      x: 350,
      y: 280,
    },
    {
      id: "cg-dealer",
      name: "Dealer",
      stereotype: "class",
      attributes: [
        { id: "cg-dealer-attr-0", name: "hand", type: "Hand", visibility: "-" },
        { id: "cg-dealer-attr-1", name: "standThreshold", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "cg-dealer-meth-0", name: "shouldHit", returnType: "boolean", params: [], visibility: "+" },
        { id: "cg-dealer-meth-1", name: "revealHand", returnType: "Hand", params: [], visibility: "+" },
      ],
      x: 200,
      y: 480,
    },
  ],
  starterRelationships: [
    { id: rid(), source: "cg-deck", target: "cg-card", type: "composition", sourceCardinality: "1", targetCardinality: "52" },
    { id: rid(), source: "cg-hand", target: "cg-card", type: "aggregation", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "cg-player", target: "cg-hand", type: "composition" },
    { id: rid(), source: "cg-dealer", target: "cg-hand", type: "composition" },
  ],
  hints: [
    "Use the Template Method pattern in a base CardGame class: dealInitial(), playRound(), evaluateWinners() -- Blackjack overrides each step.",
    "The Strategy pattern works well for player decision-making: HumanStrategy prompts input, DealerStrategy follows fixed rules (hit below 17).",
    "Model Ace value resolution in Hand.getScore() by trying both 1 and 11 and picking the best total that does not bust.",
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
    {
      id: "ns-service",
      name: "NotificationService",
      stereotype: "class",
      attributes: [
        { id: "ns-service-attr-0", name: "channels", type: "Channel[]", visibility: "-" },
        { id: "ns-service-attr-1", name: "templates", type: "Map<string, Template>", visibility: "-" },
      ],
      methods: [
        { id: "ns-service-meth-0", name: "send", returnType: "void", params: ["userId: string", "type: NotificationType", "data: object"], visibility: "+" },
        { id: "ns-service-meth-1", name: "sendBulk", returnType: "void", params: ["userIds: string[]", "type: NotificationType", "data: object"], visibility: "+" },
      ],
      x: 50,
      y: 50,
    },
    {
      id: "ns-channel",
      name: "Channel",
      stereotype: "interface",
      attributes: [],
      methods: [
        { id: "ns-channel-meth-0", name: "deliver", returnType: "DeliveryResult", params: ["message: string", "recipient: string"], visibility: "+" },
        { id: "ns-channel-meth-1", name: "getType", returnType: "ChannelType", params: [], visibility: "+" },
      ],
      x: 350,
      y: 50,
    },
    {
      id: "ns-template",
      name: "Template",
      stereotype: "class",
      attributes: [
        { id: "ns-template-attr-0", name: "id", type: "string", visibility: "-" },
        { id: "ns-template-attr-1", name: "body", type: "string", visibility: "-" },
        { id: "ns-template-attr-2", name: "variables", type: "string[]", visibility: "-" },
      ],
      methods: [
        { id: "ns-template-meth-0", name: "render", returnType: "string", params: ["data: Record<string, string>"], visibility: "+" },
      ],
      x: 50,
      y: 280,
    },
    {
      id: "ns-preference",
      name: "Preference",
      stereotype: "class",
      attributes: [
        { id: "ns-preference-attr-0", name: "userId", type: "string", visibility: "-" },
        { id: "ns-preference-attr-1", name: "channelPrefs", type: "Map<NotificationType, ChannelType[]>", visibility: "-" },
        { id: "ns-preference-attr-2", name: "quietHours", type: "TimeRange", visibility: "-" },
      ],
      methods: [
        { id: "ns-preference-meth-0", name: "getChannels", returnType: "ChannelType[]", params: ["type: NotificationType"], visibility: "+" },
        { id: "ns-preference-meth-1", name: "isQuietTime", returnType: "boolean", params: [], visibility: "+" },
      ],
      x: 350,
      y: 280,
    },
  ],
  starterRelationships: [
    { id: rid(), source: "ns-service", target: "ns-channel", type: "aggregation", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "ns-service", target: "ns-template", type: "composition", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "ns-service", target: "ns-preference", type: "dependency", label: "reads" },
  ],
  hints: [
    "Use the Strategy pattern for channels: EmailChannel, SMSChannel, PushChannel each implement the Channel interface with different delivery logic.",
    "Apply the Builder pattern for constructing notifications: NotificationBuilder.to(user).template('welcome').via('email', 'push').build().",
    "Add an Observer pattern where delivery status changes trigger events that update analytics dashboards and retry queues.",
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
    {
      id: "lf-logger",
      name: "Logger",
      stereotype: "class",
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
      x: 50,
      y: 50,
    },
    {
      id: "lf-loglevel",
      name: "LogLevel",
      stereotype: "enum",
      attributes: [
        { id: "lf-loglevel-attr-0", name: "TRACE", type: "0", visibility: "+" },
        { id: "lf-loglevel-attr-1", name: "DEBUG", type: "1", visibility: "+" },
        { id: "lf-loglevel-attr-2", name: "INFO", type: "2", visibility: "+" },
        { id: "lf-loglevel-attr-3", name: "WARN", type: "3", visibility: "+" },
        { id: "lf-loglevel-attr-4", name: "ERROR", type: "4", visibility: "+" },
        { id: "lf-loglevel-attr-5", name: "FATAL", type: "5", visibility: "+" },
      ],
      methods: [],
      x: 350,
      y: 50,
    },
    {
      id: "lf-sink",
      name: "Sink",
      stereotype: "interface",
      attributes: [],
      methods: [
        { id: "lf-sink-meth-0", name: "write", returnType: "void", params: ["entry: LogEntry"], visibility: "+" },
        { id: "lf-sink-meth-1", name: "flush", returnType: "void", params: [], visibility: "+" },
      ],
      x: 50,
      y: 280,
    },
    {
      id: "lf-formatter",
      name: "Formatter",
      stereotype: "interface",
      attributes: [],
      methods: [
        { id: "lf-formatter-meth-0", name: "format", returnType: "string", params: ["entry: LogEntry"], visibility: "+" },
      ],
      x: 350,
      y: 280,
    },
  ],
  starterRelationships: [
    { id: rid(), source: "lf-logger", target: "lf-sink", type: "aggregation", sourceCardinality: "1", targetCardinality: "1..*" },
    { id: rid(), source: "lf-logger", target: "lf-loglevel", type: "dependency" },
    { id: rid(), source: "lf-sink", target: "lf-formatter", type: "association", label: "uses" },
  ],
  hints: [
    "Use the Singleton pattern for the root Logger and a Chain of Responsibility for log level filtering across multiple sinks.",
    "Apply the Strategy pattern for formatters: JsonFormatter, PlainTextFormatter, and CustomPatternFormatter each implement the Formatter interface.",
    "Add a LogEntry value object that bundles timestamp, level, message, logger name, and metadata -- pass it through the chain from Logger to Sink to Formatter.",
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
      x: 50,
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
      x: 350,
      y: 50,
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
      x: 200,
      y: 280,
    },
  ],
  starterRelationships: [
    { id: rid(), source: "cs-cache", target: "cs-eviction", type: "aggregation", label: "uses" },
    { id: rid(), source: "cs-cache", target: "cs-entry", type: "composition", sourceCardinality: "1", targetCardinality: "*" },
  ],
  hints: [
    "Use the Strategy pattern for eviction: LRUPolicy, LFUPolicy, and TTLPolicy each implement EvictionPolicy with different selectVictim() logic.",
    "Combine a HashMap with a DoublyLinkedList for O(1) LRU operations -- the same approach used in the classic LRU Cache problem.",
    "Add an Observer pattern where cache events (hit, miss, eviction) are published to monitoring subscribers for metrics dashboards.",
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
  ],
  starterRelationships: [
    { id: rid(), source: "ts-scheduler", target: "ts-task", type: "aggregation", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "ts-task", target: "ts-priority", type: "dependency" },
    { id: rid(), source: "ts-task", target: "ts-cron", type: "association", label: "scheduled by" },
    { id: rid(), source: "ts-task", target: "ts-task", type: "dependency", label: "depends on" },
  ],
  hints: [
    "Use the Command pattern for tasks: each Task encapsulates its execution logic, and the Scheduler acts as the invoker that manages timing and ordering.",
    "Apply the State pattern for task lifecycle: Pending -> Running -> Completed/Failed, with transitions managed by the Scheduler.",
    "For dependency resolution, use a topological sort (DAG) to determine execution order and detect circular dependencies.",
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
        { id: "ps-topic-attr-1", name: "subscribers", type: "Subscriber[]", visibility: "-" },
        { id: "ps-topic-attr-2", name: "retentionMs", type: "number", visibility: "-" },
        { id: "ps-topic-attr-3", name: "messages", type: "Message[]", visibility: "-" },
      ],
      methods: [
        { id: "ps-topic-meth-0", name: "addSubscriber", returnType: "void", params: ["sub: Subscriber"], visibility: "+" },
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
        { id: "ps-subscriber-meth-1", name: "getFilter", returnType: "MessageFilter", params: [], visibility: "+" },
      ],
      x: 350,
      y: 280,
    },
  ],
  starterRelationships: [
    { id: rid(), source: "ps-broker", target: "ps-topic", type: "composition", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "ps-topic", target: "ps-subscriber", type: "aggregation", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "ps-publisher", target: "ps-broker", type: "dependency", label: "publishes via" },
  ],
  hints: [
    "This is the Observer pattern at scale: Topic is the subject, Subscribers are observers, and the MessageBroker is the mediator that manages registrations.",
    "Add a DeadLetterTopic where messages that fail delivery after max retries are routed for manual inspection or replay.",
    "Use a Chain of Responsibility for message filtering: each filter in the chain can pass or reject a message before it reaches the subscriber.",
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
        { id: "rl-tokenbucket-meth-0", name: "tryConsume", returnType: "boolean", params: ["tokens: number"], visibility: "+" },
        { id: "rl-tokenbucket-meth-1", name: "refill", returnType: "void", params: [], visibility: "-" },
      ],
      x: 350,
      y: 50,
    },
    {
      id: "rl-slidingwindow",
      name: "SlidingWindow",
      stereotype: "class",
      attributes: [
        { id: "rl-slidingwindow-attr-0", name: "windowSizeMs", type: "number", visibility: "-" },
        { id: "rl-slidingwindow-attr-1", name: "maxRequests", type: "number", visibility: "-" },
        { id: "rl-slidingwindow-attr-2", name: "timestamps", type: "number[]", visibility: "-" },
      ],
      methods: [
        { id: "rl-slidingwindow-meth-0", name: "tryConsume", returnType: "boolean", params: [], visibility: "+" },
        { id: "rl-slidingwindow-meth-1", name: "cleanExpired", returnType: "void", params: [], visibility: "-" },
      ],
      x: 200,
      y: 280,
    },
  ],
  starterRelationships: [
    { id: rid(), source: "rl-limiter", target: "rl-tokenbucket", type: "dependency", label: "delegates to" },
    { id: rid(), source: "rl-limiter", target: "rl-slidingwindow", type: "dependency", label: "delegates to" },
  ],
  hints: [
    "Use the Strategy pattern: RateLimiter delegates to a RateLimitAlgorithm interface implemented by TokenBucket, SlidingWindow, and FixedWindow.",
    "For TokenBucket, refill tokens lazily on each tryConsume() call based on elapsed time since lastRefill -- no background timer needed.",
    "Add a Proxy pattern layer: RateLimitProxy wraps the actual API handler and checks the RateLimiter before forwarding requests.",
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
        { id: "us-shortener-attr-1", name: "counter", type: "number", visibility: "-" },
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
  ],
  starterRelationships: [
    { id: rid(), source: "us-shortener", target: "us-shorturl", type: "composition", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "us-shorturl", target: "us-analytics", type: "composition" },
  ],
  hints: [
    "Use a Strategy pattern for code generation: Base62Strategy converts an auto-incrementing counter to a short string, while HashStrategy uses MD5/SHA and takes the first N characters.",
    "Apply the Singleton pattern for the URLShortener service and use the Factory Method to create ShortURL instances with default expiration and analytics setup.",
    "Add an Observer to trigger analytics recording asynchronously on each redirect, keeping the redirect path fast.",
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
  ],
  starterRelationships: [
    { id: rid(), source: "smf-user", target: "smf-post", type: "composition", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "smf-feed", target: "smf-post", type: "aggregation", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "smf-generator", target: "smf-feed", type: "dependency", label: "produces" },
    { id: rid(), source: "smf-user", target: "smf-follow", type: "association", sourceCardinality: "1", targetCardinality: "*" },
  ],
  hints: [
    "Use the Strategy pattern for feed ranking: ChronologicalRanking, EngagementRanking, and HybridRanking each score posts differently.",
    "Consider fan-out approaches: push model pre-generates feeds for users with few followers, pull model queries on demand for celebrity users with millions of followers.",
    "Apply the Observer pattern so that when a user creates a new post, the FeedGenerator is notified to update the feeds of all followers.",
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
  classCount: 13,
  relatedProblems: ["file-system", "social-media-feed", "task-scheduler"],
  starterClasses: [
    {
      id: "ss-spreadsheet",
      name: "Spreadsheet",
      stereotype: "class",
      attributes: [
        { id: "ss-spreadsheet-attr-0", name: "cells", type: "Map<string, Cell>", visibility: "-" },
        { id: "ss-spreadsheet-attr-1", name: "depGraph", type: "DependencyGraph", visibility: "-" },
      ],
      methods: [
        { id: "ss-spreadsheet-meth-0", name: "setCell", returnType: "void", params: ["ref: string", "value: string"], visibility: "+" },
        { id: "ss-spreadsheet-meth-1", name: "getCell", returnType: "CellValue", params: ["ref: string"], visibility: "+" },
        { id: "ss-spreadsheet-meth-2", name: "recalculate", returnType: "void", params: [], visibility: "-" },
      ],
      x: 50,
      y: 50,
    },
    {
      id: "ss-cell",
      name: "Cell",
      stereotype: "class",
      attributes: [
        { id: "ss-cell-attr-0", name: "reference", type: "string", visibility: "-" },
        { id: "ss-cell-attr-1", name: "rawValue", type: "string", visibility: "-" },
        { id: "ss-cell-attr-2", name: "computedValue", type: "CellValue", visibility: "-" },
        { id: "ss-cell-attr-3", name: "formula", type: "Formula | null", visibility: "-" },
      ],
      methods: [
        { id: "ss-cell-meth-0", name: "evaluate", returnType: "CellValue", params: ["context: Spreadsheet"], visibility: "+" },
        { id: "ss-cell-meth-1", name: "isFormula", returnType: "boolean", params: [], visibility: "+" },
      ],
      x: 350,
      y: 50,
    },
    {
      id: "ss-formula",
      name: "Formula",
      stereotype: "class",
      attributes: [
        { id: "ss-formula-attr-0", name: "expression", type: "string", visibility: "-" },
        { id: "ss-formula-attr-1", name: "dependencies", type: "string[]", visibility: "-" },
      ],
      methods: [
        { id: "ss-formula-meth-0", name: "parse", returnType: "Formula", params: ["raw: string"], visibility: "+" },
        { id: "ss-formula-meth-1", name: "evaluate", returnType: "number", params: ["resolver: CellResolver"], visibility: "+" },
      ],
      x: 50,
      y: 280,
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
      x: 350,
      y: 280,
    },
  ],
  starterRelationships: [
    { id: rid(), source: "ss-spreadsheet", target: "ss-cell", type: "composition", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "ss-spreadsheet", target: "ss-depgraph", type: "composition" },
    { id: rid(), source: "ss-cell", target: "ss-formula", type: "association" },
    { id: rid(), source: "ss-depgraph", target: "ss-cell", type: "dependency", label: "tracks" },
  ],
  hints: [
    "Use the Observer pattern: when a cell value changes, the DependencyGraph identifies all dependent cells and triggers recalculation in topological order.",
    "Apply the Composite pattern for formulas: NumberLiteral, CellReference, BinaryOperation, and FunctionCall form an expression tree that evaluates recursively.",
    "Detect circular references with a DFS-based cycle detection on the dependency graph before allowing a formula to be set.",
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
      id: "sw-split",
      name: "Split",
      stereotype: "interface",
      attributes: [],
      methods: [
        { id: "sw-split-meth-0", name: "getShareForUser", returnType: "number", params: ["userId: string", "total: number"], visibility: "+" },
      ],
      x: 50,
      y: 280,
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
  ],
  starterRelationships: [
    { id: rid(), source: "sw-group", target: "sw-user", type: "aggregation", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "sw-group", target: "sw-expense", type: "composition", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "sw-expense", target: "sw-split", type: "composition", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "sw-group", target: "sw-balance", type: "association", label: "computes" },
  ],
  hints: [
    "Use the Strategy pattern for split types: EqualSplit, ExactSplit, and PercentageSplit each implement the Split interface differently but are interchangeable at runtime.",
    "Simplify debts using a graph-based approach: compute net balances, then greedily pair the largest creditor with the largest debtor to minimize transactions.",
    "Apply the Observer pattern: when an expense is added, automatically notify all affected users and recalculate group balances.",
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
  classCount: 14,
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
  ],
  starterRelationships: [
    { id: rid(), source: "rs-trip", target: "rs-rider", type: "association", label: "requested by" },
    { id: rid(), source: "rs-trip", target: "rs-driver", type: "association", label: "assigned to" },
    { id: rid(), source: "rs-trip", target: "rs-fare", type: "composition" },
    { id: rid(), source: "rs-rider", target: "rs-location", type: "association" },
    { id: rid(), source: "rs-driver", target: "rs-location", type: "association" },
  ],
  hints: [
    "Use the State pattern for the Trip lifecycle: RequestedState, AssignedState, InProgressState, CompletedState, and CancelledState each define valid transitions and behavior.",
    "Apply the Strategy pattern for fare calculation: BaseFareStrategy, SurgePricingStrategy, and PooledFareStrategy allow different pricing models to be swapped at runtime.",
    "Use the Observer pattern to notify riders of driver location updates and trip status changes in real time.",
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
  classCount: 15,
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
  ],
  starterRelationships: [
    { id: rid(), source: "os-user", target: "os-cart", type: "composition" },
    { id: rid(), source: "os-cart", target: "os-product", type: "association", label: "contains" },
    { id: rid(), source: "os-user", target: "os-order", type: "association", label: "places" },
    { id: rid(), source: "os-order", target: "os-payment", type: "dependency", label: "paid via" },
  ],
  hints: [
    "Use the Strategy pattern for payment methods: CreditCardPayment, WalletPayment, and CashOnDelivery each implement the Payment interface, allowing the checkout to be payment-agnostic.",
    "Apply the State pattern for order tracking: each OrderStatus (Placed, Confirmed, Shipped, Delivered, Returned) defines valid transitions and associated behavior.",
    "Use the Observer pattern to notify users of order status changes and to trigger inventory updates when orders are placed or cancelled.",
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
  classCount: 13,
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
  ],
  starterRelationships: [
    { id: rid(), source: "sb-exchange", target: "sb-orderbook", type: "composition", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "sb-exchange", target: "sb-portfolio", type: "composition", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "sb-orderbook", target: "sb-order", type: "aggregation", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "sb-orderbook", target: "sb-trade", type: "association", label: "produces" },
  ],
  hints: [
    "Use the Strategy pattern for order matching: MarketOrderStrategy executes at best available price, LimitOrderStrategy only matches at the specified price or better.",
    "Apply the Observer pattern for real-time price updates: when a trade executes, notify all clients subscribed to that stock symbol with the new price.",
    "Model the OrderBook with two priority queues (max-heap for bids, min-heap for asks) sorted by price-time priority for O(log n) matching.",
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
  classCount: 12,
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
  ],
  starterRelationships: [
    { id: rid(), source: "ms-user", target: "ms-playlist", type: "composition", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "ms-playlist", target: "ms-song", type: "aggregation", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "ms-queue", target: "ms-song", type: "aggregation", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "ms-user", target: "ms-recommendation", type: "dependency", label: "uses" },
  ],
  hints: [
    "Use the Iterator pattern for the Queue: SequentialIterator, ShuffleIterator, and RepeatIterator each implement different traversal strategies over the same song list.",
    "Apply the Strategy pattern for recommendations: CollaborativeFilteringStrategy, ContentBasedStrategy, and PopularityStrategy can be swapped to test different algorithms.",
    "Use the Observer pattern to synchronize playback state across devices — when a user pauses on their phone, the desktop client updates immediately.",
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
  ],
  starterRelationships: [
    { id: rid(), source: "fd-customer", target: "fd-order", type: "association", label: "places" },
    { id: rid(), source: "fd-restaurant", target: "fd-menu", type: "composition" },
    { id: rid(), source: "fd-order", target: "fd-restaurant", type: "association", label: "from" },
    { id: rid(), source: "fd-order", target: "fd-agent", type: "association", label: "delivered by" },
  ],
  hints: [
    "Use the State pattern for order lifecycle: PlacedState, ConfirmedState, PreparingState, PickedUpState, and DeliveredState define valid transitions and actions at each stage.",
    "Apply the Strategy pattern for delivery agent assignment: NearestAgentStrategy, LeastBusyStrategy, and RoundRobinStrategy allow different allocation algorithms.",
    "Use the Observer pattern to push real-time order status updates to customers and notify delivery agents of new assignments.",
  ],
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
  ],
  starterRelationships: [
    { id: rid(), source: "cr-student", target: "cr-enrollment", type: "association", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "cr-enrollment", target: "cr-course", type: "association" },
    { id: rid(), source: "cr-student", target: "cr-schedule", type: "composition" },
    { id: rid(), source: "cr-course", target: "cr-prerequisite", type: "composition", sourceCardinality: "1", targetCardinality: "*" },
  ],
  hints: [
    "Use the Chain of Responsibility pattern for enrollment validation: PrerequisiteCheck, CapacityCheck, TimeConflictCheck, and DeadlineCheck form a chain that a request must pass through.",
    "Apply the Observer pattern for waitlist management: when a student drops a course, automatically notify and enroll the next student on the waitlist.",
    "Model prerequisites as a directed acyclic graph (DAG) and use topological sort to validate that all prerequisite chains are satisfied.",
  ],
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
      name: "VendingMachine",
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
      stereotype: "class",
      attributes: [
        { id: "cvm-beverage-attr-0", name: "id", type: "string", visibility: "-" },
        { id: "cvm-beverage-attr-1", name: "name", type: "string", visibility: "-" },
        { id: "cvm-beverage-attr-2", name: "price", type: "number", visibility: "-" },
        { id: "cvm-beverage-attr-3", name: "recipe", type: "Map<string, number>", visibility: "-" },
      ],
      methods: [
        { id: "cvm-beverage-meth-0", name: "canBrew", returnType: "boolean", params: ["inventory: IngredientInventory"], visibility: "+" },
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
  ],
  starterRelationships: [
    { id: rid(), source: "cvm-machine", target: "cvm-beverage", type: "aggregation", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "cvm-machine", target: "cvm-ingredient", type: "composition", sourceCardinality: "1", targetCardinality: "*" },
    { id: rid(), source: "cvm-machine", target: "cvm-payment", type: "dependency", label: "accepts" },
    { id: rid(), source: "cvm-beverage", target: "cvm-ingredient", type: "dependency", label: "requires" },
  ],
  hints: [
    "Use the State pattern for the machine lifecycle: IdleState, SelectingState, PayingState, BrewingState, and DispensingState each define what operations are valid and what transitions are allowed.",
    "Apply the Decorator pattern for beverage customizations: ExtraShotDecorator, SugarDecorator, and MilkTypeDecorator wrap a base Beverage to add cost and modify the recipe.",
    "Use the Factory Method pattern for creating beverages: EspressoFactory, LatteFactory, etc., encapsulate the recipe and pricing for each type.",
  ],
};

// ── Exports ──────────────────────────────────────────────────

export const LLD_PROBLEMS: LLDProblem[] = [
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
];

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
