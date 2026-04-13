// ── LLD Challenge database: 10 low-level design interview problems ──
//
// Each challenge targets class diagram design with specific OOP patterns,
// class counts, and structural requirements. These map to the existing
// LLD problems in src/lib/lld/problems.ts but are expressed as interview
// challenges compatible with the ChallengeDefinition schema.
// ─────────────────────────────────────────────────────────────────────

import type { ChallengeDefinition } from './challenges';

/** Extended interface for LLD-specific challenge metadata. */
export interface LLDChallengeDefinition extends ChallengeDefinition {
  category: 'lld';
  /** Design patterns the candidate should demonstrate. */
  keyPatterns: string[];
  /** Expected number of classes in a complete solution. */
  classCount: number;
  /** 2-3 starter class names to bootstrap the design. */
  starterClasses: string[];
  /** Maps to LLD problem id in src/lib/lld/problems.ts, if available. */
  lldProblemId?: string;
}

// ────────────────────────────────────────────────────────────────────
//  Challenge Definitions
// ────────────────────────────────────────────────────────────────────

export const LLD_CHALLENGES: LLDChallengeDefinition[] = [
  // ── 1. Parking Lot System ─────────────────────────────────────
  {
    id: 'lld-parking-lot',
    title: 'Parking Lot System',
    difficulty: 2,
    timeMinutes: 30,
    category: 'lld',
    companies: ['Amazon', 'Google', 'Microsoft'],
    description:
      'Design a parking lot system supporting multiple floors, different vehicle sizes, ' +
      'real-time spot tracking, and fee calculation. Apply composition and strategy patterns.',
    requirements: [
      'Model ParkingLot with multiple ParkingFloor instances (composition)',
      'Create ParkingSpot with types: SMALL, MEDIUM, LARGE',
      'Define an abstract Vehicle class with subclasses: Motorcycle, Car, Bus',
      'Implement a Ticket class recording entry time and assigned spot',
      'Use Strategy pattern for fee calculation (hourly, daily, weekend)',
      'Track available spots per floor in real-time',
      'Handle entry gate and exit gate operations',
    ],
    checklist: [
      'ParkingLot composes ParkingFloor (1 to many)',
      'ParkingFloor composes ParkingSpot (1 to many)',
      'Vehicle hierarchy with abstract base and concrete subclasses',
      'Ticket records vehicle, spot, and entry time',
      'FeeCalculator interface with at least two implementations',
      'VehicleType and SpotType enums defined',
      'Entry/exit gate logic handles assignment and payment',
    ],
    hints: [
      { level: 1, text: 'Start with enums for VehicleType (MOTORCYCLE, CAR, BUS) and SpotType (SMALL, MEDIUM, LARGE). Map which vehicle types fit in which spot types.', pointsCost: 5 },
      { level: 2, text: 'Use composition: ParkingLot owns ParkingFloors, each floor owns ParkingSpots. A Ticket links a Vehicle to a ParkingSpot with timestamps.', pointsCost: 10 },
      { level: 3, text: 'Apply the Strategy pattern for fees: create a FeeStrategy interface with methods like calculate(entryTime, exitTime). Implement HourlyFee, DailyFee, and WeekendFee.', pointsCost: 15 },
    ],
    concepts: ['Composition', 'Strategy Pattern', 'Inheritance', 'Enum Modeling'],
    keyPatterns: ['Strategy', 'Composition', 'Inheritance'],
    classCount: 8,
    starterClasses: ['ParkingLot', 'ParkingFloor', 'ParkingSpot'],
    lldProblemId: 'prob-parking-lot',
  },

  // ── 2. Library Management System ──────────────────────────────
  {
    id: 'lld-library-management',
    title: 'Library Management System',
    difficulty: 2,
    timeMinutes: 30,
    category: 'lld',
    companies: ['Amazon', 'Microsoft', 'Intuit'],
    description:
      'Design a library system handling book cataloging, member registration, ' +
      'borrowing/returning, and fine calculation for overdue books.',
    requirements: [
      'Model Library containing Books and Members (aggregation)',
      'Separate Book (title/ISBN) from BookCopy (physical copy)',
      'Create a Loan class linking Member to BookCopy with due date',
      'Implement fine calculation for overdue returns',
      'Support search by title, author, or ISBN',
      'Use Observer pattern to notify members when reserved books arrive',
    ],
    checklist: [
      'Library aggregates Book and Member collections',
      'Book and BookCopy distinction modeled correctly',
      'Loan associates Member with BookCopy and tracks dates',
      'FineCalculator with strategy for different fine policies',
      'Search functionality across multiple fields',
      'Observer notification for reservation availability',
    ],
    hints: [
      { level: 1, text: 'Separate the concept of a Book (title, author, ISBN) from a BookCopy (barcode, condition, availability). One Book can have many copies.', pointsCost: 5 },
      { level: 2, text: 'A Loan object ties a Member to a specific BookCopy with borrowDate, dueDate, and returnDate. The isOverdue() method checks the current date against dueDate.', pointsCost: 10 },
      { level: 3, text: 'Use Observer pattern: when a BookCopy is returned and there are pending reservations, notify the next member in the reservation queue.', pointsCost: 15 },
    ],
    concepts: ['Aggregation', 'Observer Pattern', 'Strategy Pattern', 'Data Modeling'],
    keyPatterns: ['Observer', 'Strategy', 'Aggregation'],
    classCount: 7,
    starterClasses: ['Library', 'Book', 'Member'],
    lldProblemId: 'prob-library',
  },

  // ── 3. Elevator System ────────────────────────────────────────
  {
    id: 'lld-elevator-system',
    title: 'Elevator System',
    difficulty: 3,
    timeMinutes: 35,
    category: 'lld',
    companies: ['Google', 'Microsoft', 'Uber'],
    description:
      'Design an elevator system for a multi-elevator building with efficient ' +
      'dispatching, state management, and concurrent request handling.',
    requirements: [
      'Model Building with multiple Elevator instances',
      'Use State pattern for elevator states: Idle, MovingUp, MovingDown, DoorOpen',
      'Implement a Dispatcher interface with strategy for elevator selection',
      'Create Request class for floor and direction',
      'Support SCAN/LOOK dispatching algorithm',
      'Handle concurrent requests from multiple floors',
      'Track elevator direction and pending stops',
    ],
    checklist: [
      'Building composes multiple Elevators',
      'ElevatorState interface with concrete state classes',
      'Dispatcher interface with at least one algorithm implementation',
      'Request model captures floor, direction, and timestamp',
      'Priority queue or sorted set for pending floor stops',
      'Direction enum (UP, DOWN) defined',
      'State transitions correctly modeled',
    ],
    hints: [
      { level: 1, text: 'Use the State pattern: define ElevatorState interface with methods like handleRequest(), move(), openDoor(). Create IdleState, MovingUpState, MovingDownState, DoorOpenState.', pointsCost: 5 },
      { level: 2, text: 'The Dispatcher selects which elevator handles a new request. Use Strategy pattern: NearestElevator, SCAN (processes floors in one direction then reverses), ZoneBasedDispatcher.', pointsCost: 10 },
      { level: 3, text: 'Inside each elevator, maintain a priority queue of pending stops. When moving up, process stops in ascending order; when moving down, descending. This is the LOOK algorithm.', pointsCost: 15 },
    ],
    concepts: ['State Pattern', 'Strategy Pattern', 'Priority Queue', 'Concurrency'],
    keyPatterns: ['State', 'Strategy', 'Observer'],
    classCount: 8,
    starterClasses: ['Building', 'Elevator', 'Dispatcher'],
    lldProblemId: 'prob-elevator',
  },

  // ── 4. Vending Machine ────────────────────────────────────────
  {
    id: 'lld-vending-machine',
    title: 'Vending Machine',
    difficulty: 2,
    timeMinutes: 30,
    category: 'lld',
    companies: ['Amazon', 'Google', 'Goldman Sachs'],
    description:
      'Design a vending machine that accepts coins, displays products, dispenses ' +
      'items, and returns change. Use the State pattern for machine lifecycle.',
    requirements: [
      'Use State pattern for machine states: Idle, HasMoney, Dispensing, SoldOut',
      'Create Coin enum with denominations and monetary values',
      'Model Product with name, price, and stock code',
      'Implement Inventory tracking available product counts',
      'Add ChangeCalculator using greedy algorithm for optimal change',
      'Handle edge cases: insufficient funds, out of stock',
    ],
    checklist: [
      'VendingMachine with state-driven behavior',
      'MachineState interface with concrete state implementations',
      'Coin enum with penny, nickel, dime, quarter values',
      'Product and Inventory classes modeled',
      'ChangeCalculator returns fewest coins possible',
      'State transitions for insert, select, dispense, cancel',
    ],
    hints: [
      { level: 1, text: 'Define a MachineState interface with methods: insertCoin(), selectProduct(), dispense(), cancel(). Each state decides which operations are valid.', pointsCost: 5 },
      { level: 2, text: 'Create a Coin enum with values: PENNY(1), NICKEL(5), DIME(10), QUARTER(25). The machine tracks currentBalance as a simple number.', pointsCost: 10 },
      { level: 3, text: 'ChangeCalculator: iterate from largest denomination to smallest, greedily allocating coins. Return a list of Coin objects. Handle exact-change-only mode.', pointsCost: 15 },
    ],
    concepts: ['State Pattern', 'Enum Modeling', 'Greedy Algorithm', 'Encapsulation'],
    keyPatterns: ['State', 'Strategy', 'Enum'],
    classCount: 7,
    starterClasses: ['VendingMachine', 'Product', 'Inventory'],
    lldProblemId: 'prob-vending-machine',
  },

  // ── 5. Chess Game ─────────────────────────────────────────────
  {
    id: 'lld-chess-game',
    title: 'Chess Game',
    difficulty: 4,
    timeMinutes: 45,
    category: 'lld',
    companies: ['Google', 'Meta', 'Microsoft'],
    description:
      'Design a two-player chess game with move validation, check/checkmate detection, ' +
      'and support for special moves like castling and en passant.',
    requirements: [
      'Model 8x8 Board with Cell grid containing Piece references',
      'Create abstract Piece with subclasses: King, Queen, Rook, Bishop, Knight, Pawn',
      'Each piece overrides getValidMoves() with its specific movement rules',
      'Implement MoveValidator checking legality and king safety',
      'Detect check, checkmate, and stalemate conditions',
      'Support special moves: castling, en passant, pawn promotion',
      'Track game state: active, check, checkmate, stalemate, draw',
      'Use Command pattern to support move undo',
    ],
    checklist: [
      'Board and Cell grid structure defined',
      'Abstract Piece with 6 concrete subclasses',
      'Each piece implements its own movement logic',
      'MoveValidator ensures moves do not leave king in check',
      'Game status detection (check, checkmate, stalemate)',
      'Special moves modeled and validated',
      'Position value object with row and column',
      'Command pattern for move history and undo',
    ],
    hints: [
      { level: 1, text: 'Start with an abstract Piece class: color, position, and abstract getValidMoves(board). Then create King, Queen, Rook, Bishop, Knight, Pawn each implementing their movement rules.', pointsCost: 5 },
      { level: 2, text: 'A MoveValidator wraps piece movement: (1) check that the piece can physically move there, (2) simulate the move and verify it does not leave your own king in check.', pointsCost: 10 },
      { level: 3, text: 'For checkmate: iterate all pieces of the current player. If no piece has any valid move (after MoveValidator filtering), it is checkmate (if in check) or stalemate (if not).', pointsCost: 15 },
    ],
    concepts: ['Inheritance', 'Polymorphism', 'Command Pattern', 'Template Method'],
    keyPatterns: ['Template Method', 'Command', 'Inheritance'],
    classCount: 12,
    starterClasses: ['Game', 'Board', 'Piece'],
    lldProblemId: 'prob-chess',
  },

  // ── 6. Snake Game ─────────────────────────────────────────────
  {
    id: 'lld-snake-game',
    title: 'Snake Game',
    difficulty: 2,
    timeMinutes: 30,
    category: 'lld',
    companies: ['Google', 'Apple', 'Amazon'],
    description:
      'Design a Snake & Ladder board game for 2-4 players with configurable boards, ' +
      'dice rolling, and win detection. Apply template method and composition.',
    requirements: [
      'Support 2-4 players taking turns',
      'Configurable board size with snakes and ladders at positions',
      'Roll one or two dice and move player accordingly',
      'Board resolves snake (move down) and ladder (move up) effects',
      'Detect win condition when a player reaches the final cell',
    ],
    checklist: [
      'Game composes Board, Players, and Dice',
      'Board tracks snakes and ladders as position maps',
      'Player tracks name and current position',
      'Dice supports configurable face count',
      'Win detection stops the game correctly',
    ],
    hints: [
      { level: 1, text: 'Model Snake and Ladder as board entities with start and end positions. The Board resolves movement by checking if the destination has a snake or ladder.', pointsCost: 5 },
      { level: 2, text: 'Use the Template Method in takeTurn(): roll dice -> compute new position -> check snake/ladder -> check win. Subclasses can override individual steps.', pointsCost: 10 },
      { level: 3, text: 'Add a DiceStrategy interface so you can swap between single-die and double-dice modes, or even a loaded dice for testing.', pointsCost: 15 },
    ],
    concepts: ['Composition', 'Template Method', 'Strategy Pattern', 'Game Loop'],
    keyPatterns: ['Template Method', 'Strategy', 'Composition'],
    classCount: 6,
    starterClasses: ['Game', 'Board', 'Player'],
    lldProblemId: 'prob-snake-ladder',
  },

  // ── 7. Movie Ticket Booking ───────────────────────────────────
  {
    id: 'lld-movie-ticket-booking',
    title: 'Movie Ticket Booking System',
    difficulty: 3,
    timeMinutes: 35,
    category: 'lld',
    companies: ['Amazon', 'Uber', 'Netflix'],
    description:
      'Design a movie ticket booking system supporting theater management, seat selection, ' +
      'showtime scheduling, payment processing, and booking confirmation.',
    requirements: [
      'Model Theater containing multiple Screens with Seat layouts',
      'Create Show linking a Movie to a Screen at a specific time',
      'Implement Booking with seat selection and payment status',
      'Support seat categories: Regular, Premium, VIP with different pricing',
      'Handle concurrent seat reservation to prevent double-booking',
      'Use Observer pattern to notify users of booking confirmations',
      'Apply Strategy pattern for pricing (base, premium, time-of-day)',
    ],
    checklist: [
      'Theater composes Screens, each Screen has Seat layout',
      'Movie and Show classes separate content from scheduling',
      'Booking ties User, Show, and selected Seats together',
      'Seat categories with different pricing modeled',
      'Concurrency handling for seat locking',
      'Observer for booking confirmation notifications',
      'Payment processing with state tracking',
    ],
    hints: [
      { level: 1, text: 'Separate Movie (title, duration, genre) from Show (movie, screen, startTime, availableSeats). A Theater has many Screens, each Screen can host many Shows.', pointsCost: 5 },
      { level: 2, text: 'For concurrency: when a user starts seat selection, temporarily lock those seats with a TTL (e.g., 10 minutes). If payment is not completed, release the lock.', pointsCost: 10 },
      { level: 3, text: 'Use Strategy for pricing: BasePricing, PremiumSeatPricing, MatineePricing. The Booking calculates total by applying the active pricing strategy per seat.', pointsCost: 15 },
    ],
    concepts: ['Composition', 'Observer Pattern', 'Strategy Pattern', 'Concurrency'],
    keyPatterns: ['Observer', 'Strategy', 'Composition'],
    classCount: 9,
    starterClasses: ['Theater', 'Movie', 'Booking'],
  },

  // ── 8. ATM System ─────────────────────────────────────────────
  {
    id: 'lld-atm-system',
    title: 'ATM System',
    difficulty: 3,
    timeMinutes: 35,
    category: 'lld',
    companies: ['Goldman Sachs', 'JPMorgan', 'Microsoft'],
    description:
      'Design an ATM system handling authentication, balance inquiry, withdrawal, ' +
      'deposit, and transfers. Use State and Chain of Responsibility patterns.',
    requirements: [
      'Use State pattern for ATM states: Idle, CardInserted, Authenticated, TransactionSelected',
      'Create abstract Transaction with subclasses: Withdrawal, Deposit, Transfer',
      'Implement CashDispenser using Chain of Responsibility for denominations',
      'Model Account with balance operations and transaction history',
      'Handle card authentication via PIN verification',
      'Maintain audit trail with transaction timestamps',
    ],
    checklist: [
      'ATM with state-driven lifecycle',
      'ATMState interface with concrete state classes',
      'Transaction hierarchy with polymorphic execute()',
      'CashDispenser with denomination chain ($100, $50, $20, $10)',
      'Account tracks balance and transaction history',
      'Card and PIN authentication modeled',
    ],
    hints: [
      { level: 1, text: 'Define ATMState interface with methods: insertCard(), enterPin(), selectTransaction(), executeTransaction(). Each state handles valid operations and rejects invalid ones.', pointsCost: 5 },
      { level: 2, text: 'Create an abstract Transaction with execute(): boolean. Subclasses WithdrawalTransaction, DepositTransaction, and TransferTransaction override with specific logic.', pointsCost: 10 },
      { level: 3, text: 'CashDispenser: use Chain of Responsibility. HundredDollarHandler tries to dispense $100 bills, passes remainder to FiftyDollarHandler, then TwentyDollarHandler, then TenDollarHandler.', pointsCost: 15 },
    ],
    concepts: ['State Pattern', 'Chain of Responsibility', 'Inheritance', 'Encapsulation'],
    keyPatterns: ['State', 'Chain of Responsibility', 'Template Method'],
    classCount: 9,
    starterClasses: ['ATM', 'Account', 'Transaction'],
    lldProblemId: 'prob-atm',
  },

  // ── 9. Notification Service ───────────────────────────────────
  {
    id: 'lld-notification-service',
    title: 'Notification Service',
    difficulty: 3,
    timeMinutes: 35,
    category: 'lld',
    companies: ['Meta', 'Apple', 'Amazon'],
    description:
      'Design a notification service supporting multiple channels (email, SMS, push), ' +
      'user preferences, template rendering, and delivery tracking.',
    requirements: [
      'Model NotificationService dispatching to channel-specific handlers',
      'Create abstract NotificationChannel with subclasses: EmailChannel, SMSChannel, PushChannel',
      'Implement user Preference management for channel opt-in/opt-out',
      'Use Template pattern for notification message rendering',
      'Add NotificationLog for delivery tracking and retry',
      'Support priority levels: LOW, MEDIUM, HIGH, CRITICAL',
      'Apply Factory pattern to create channel-appropriate notification objects',
    ],
    checklist: [
      'NotificationService dispatches to channel handlers',
      'NotificationChannel hierarchy with 3+ channel types',
      'User preference model for channel and quiet hours',
      'NotificationTemplate with placeholder rendering',
      'Delivery log with status tracking (sent, delivered, failed)',
      'Priority enum driving processing order',
      'Factory for notification creation',
    ],
    hints: [
      { level: 1, text: 'Define a NotificationChannel interface with send(notification): DeliveryResult. Implement EmailChannel, SMSChannel, PushChannel each with their own delivery logic.', pointsCost: 5 },
      { level: 2, text: 'The NotificationService checks user preferences before dispatching. A Preference object maps userId to enabled channels and quiet hours.', pointsCost: 10 },
      { level: 3, text: 'Use Factory pattern: NotificationFactory.create(type, recipient, template) returns the right Notification subclass. Template rendering replaces {{name}}, {{link}} placeholders.', pointsCost: 15 },
    ],
    concepts: ['Strategy Pattern', 'Factory Pattern', 'Template Pattern', 'Observer Pattern'],
    keyPatterns: ['Factory', 'Strategy', 'Template Method'],
    classCount: 8,
    starterClasses: ['NotificationService', 'NotificationChannel', 'Notification'],
  },

  // ── 10. Rate Limiter ──────────────────────────────────────────
  {
    id: 'lld-rate-limiter',
    title: 'Rate Limiter',
    difficulty: 3,
    timeMinutes: 35,
    category: 'lld',
    companies: ['Stripe', 'Google', 'Cloudflare'],
    description:
      'Design a rate limiter supporting multiple algorithms (token bucket, sliding window, ' +
      'fixed window), per-client configuration, and a clean OOP structure.',
    requirements: [
      'Define RateLimiter interface with isAllowed(clientId): boolean',
      'Implement TokenBucketLimiter with configurable rate and capacity',
      'Implement SlidingWindowLimiter tracking request timestamps',
      'Implement FixedWindowLimiter with time-based counters',
      'Create RateLimiterFactory selecting algorithm by configuration',
      'Model RateLimitConfig with per-client rules',
      'Support RateLimitResult with remaining quota and retry-after',
    ],
    checklist: [
      'RateLimiter interface defined with isAllowed method',
      'At least 3 concrete algorithm implementations',
      'TokenBucket tracks tokens with refill rate',
      'SlidingWindow stores timestamps and counts in window',
      'FixedWindow uses time-sliced counters',
      'Factory creates appropriate limiter from config',
      'Result object includes remaining and retry-after',
    ],
    hints: [
      { level: 1, text: 'Define a RateLimiter interface: isAllowed(clientId): RateLimitResult. Create TokenBucketLimiter, SlidingWindowLimiter, and FixedWindowLimiter implementing it.', pointsCost: 5 },
      { level: 2, text: 'TokenBucket: each client gets a bucket with maxTokens and refillRate. On each request, refill tokens based on elapsed time, then try to consume one token.', pointsCost: 10 },
      { level: 3, text: 'SlidingWindow: store timestamps of recent requests in a list. On isAllowed(), remove expired timestamps (older than window), then check if count < limit. Return retryAfter as time until oldest entry expires.', pointsCost: 15 },
    ],
    concepts: ['Strategy Pattern', 'Factory Pattern', 'Token Bucket', 'Sliding Window'],
    keyPatterns: ['Strategy', 'Factory', 'Interface Segregation'],
    classCount: 7,
    starterClasses: ['RateLimiter', 'TokenBucketLimiter', 'RateLimitConfig'],
  },
];

// ── Lookup helpers ──────────────────────────────────────────────

/** Look up an LLD challenge by ID. */
export function getLLDChallengeById(id: string): LLDChallengeDefinition | undefined {
  return LLD_CHALLENGES.find((c) => c.id === id);
}

/** Filter LLD challenges by difficulty. */
export function getLLDChallengesByDifficulty(difficulty: 1 | 2 | 3 | 4 | 5): LLDChallengeDefinition[] {
  return LLD_CHALLENGES.filter((c) => c.difficulty === difficulty);
}

/** Get all key patterns across LLD challenges (deduplicated). */
export function getAllLLDPatterns(): string[] {
  const patterns = new Set<string>();
  for (const ch of LLD_CHALLENGES) {
    for (const p of ch.keyPatterns) {
      patterns.add(p);
    }
  }
  return Array.from(patterns).sort();
}
