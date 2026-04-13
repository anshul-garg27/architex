// ── LLD Challenge Starter Templates ─────────────────────────────────
//
// Each LLD challenge has a JSON-compatible starter diagram with 2-3
// initial classes, hint relationships, and canvas layout positions.
// These bootstrap the candidate's design without giving away the full
// solution.
//
// The template format uses UMLClass and UMLRelationship from the LLD
// type system, matching the existing class diagram model.
// ────────────────────────────────────────────────────────────────────

import type { UMLClass, UMLRelationship } from '@/lib/lld/types';

// ── Types ──────────────────────────────────────────────────────────

export interface LLDChallengeTemplate {
  /** Matches the LLDChallengeDefinition id. */
  challengeId: string;
  /** Display name for the template. */
  name: string;
  /** 2-3 starter classes to bootstrap the design. */
  starterClasses: UMLClass[];
  /** Hint relationships between starter classes. */
  hintRelationships: UMLRelationship[];
}

// ── Helpers ────────────────────────────────────────────────────────

let _relId = 0;
function rid(): string {
  return `tmpl-rel-${++_relId}`;
}

// ════════════════════════════════════════════════════════════════════
//  Templates
// ════════════════════════════════════════════════════════════════════

const parkingLotTemplate: LLDChallengeTemplate = {
  challengeId: 'lld-parking-lot',
  name: 'Parking Lot Starter',
  starterClasses: [
    {
      id: 'tmpl-pl-lot',
      name: 'ParkingLot',
      stereotype: 'class',
      attributes: [
        { id: 'gen-attr-0', name: 'name', type: 'string', visibility: '-' },
        { id: 'gen-attr-1', name: 'floors', type: 'ParkingFloor[]', visibility: '-' },
      ],
      methods: [
        { id: 'gen-meth-71', name: 'getAvailableSpots', returnType: 'number', params: [], visibility: '+' },
        { id: 'gen-meth-72', name: 'parkVehicle', returnType: 'Ticket', params: ['vehicle: Vehicle'], visibility: '+' },
      ],
      x: 300,
      y: 50,
    },
    {
      id: 'tmpl-pl-floor',
      name: 'ParkingFloor',
      stereotype: 'class',
      attributes: [
        { id: 'gen-attr-2', name: 'floorNumber', type: 'number', visibility: '-' },
        { id: 'gen-attr-3', name: 'spots', type: 'ParkingSpot[]', visibility: '-' },
      ],
      methods: [
        { id: 'gen-meth-73', name: 'findAvailableSpot', returnType: 'ParkingSpot', params: ['type: VehicleType'], visibility: '+' },
      ],
      x: 300,
      y: 260,
    },
    {
      id: 'tmpl-pl-spot',
      name: 'ParkingSpot',
      stereotype: 'class',
      attributes: [
        { id: 'gen-attr-4', name: 'id', type: 'string', visibility: '-' },
        { id: 'gen-attr-5', name: 'type', type: 'SpotType', visibility: '-' },
        { id: 'gen-attr-6', name: 'isOccupied', type: 'boolean', visibility: '-' },
      ],
      methods: [
        { id: 'gen-meth-74', name: 'assignVehicle', returnType: 'void', params: ['vehicle: Vehicle'], visibility: '+' },
        { id: 'gen-meth-75', name: 'removeVehicle', returnType: 'void', params: [], visibility: '+' },
      ],
      x: 300,
      y: 470,
    },
  ],
  hintRelationships: [
    { id: rid(), source: 'tmpl-pl-lot', target: 'tmpl-pl-floor', type: 'composition', sourceCardinality: '1', targetCardinality: '1..*' },
    { id: rid(), source: 'tmpl-pl-floor', target: 'tmpl-pl-spot', type: 'composition', sourceCardinality: '1', targetCardinality: '*' },
  ],
};

const libraryTemplate: LLDChallengeTemplate = {
  challengeId: 'lld-library-management',
  name: 'Library Management Starter',
  starterClasses: [
    {
      id: 'tmpl-lib-library',
      name: 'Library',
      stereotype: 'class',
      attributes: [
        { id: 'gen-attr-7', name: 'name', type: 'string', visibility: '-' },
        { id: 'gen-attr-8', name: 'books', type: 'Book[]', visibility: '-' },
        { id: 'gen-attr-9', name: 'members', type: 'Member[]', visibility: '-' },
      ],
      methods: [
        { id: 'gen-meth-76', name: 'searchByTitle', returnType: 'Book[]', params: ['title: string'], visibility: '+' },
        { id: 'gen-meth-77', name: 'registerMember', returnType: 'void', params: ['member: Member'], visibility: '+' },
      ],
      x: 50,
      y: 50,
    },
    {
      id: 'tmpl-lib-book',
      name: 'Book',
      stereotype: 'class',
      attributes: [
        { id: 'gen-attr-10', name: 'isbn', type: 'string', visibility: '-' },
        { id: 'gen-attr-11', name: 'title', type: 'string', visibility: '-' },
        { id: 'gen-attr-12', name: 'author', type: 'string', visibility: '-' },
      ],
      methods: [
        { id: 'gen-meth-78', name: 'isAvailable', returnType: 'boolean', params: [], visibility: '+' },
      ],
      x: 400,
      y: 50,
    },
    {
      id: 'tmpl-lib-member',
      name: 'Member',
      stereotype: 'class',
      attributes: [
        { id: 'gen-attr-13', name: 'id', type: 'string', visibility: '-' },
        { id: 'gen-attr-14', name: 'name', type: 'string', visibility: '-' },
      ],
      methods: [
        { id: 'gen-meth-79', name: 'borrow', returnType: 'Loan', params: ['book: Book'], visibility: '+' },
        { id: 'gen-meth-80', name: 'returnBook', returnType: 'number', params: ['loan: Loan'], visibility: '+' },
      ],
      x: 50,
      y: 300,
    },
  ],
  hintRelationships: [
    { id: rid(), source: 'tmpl-lib-library', target: 'tmpl-lib-book', type: 'aggregation', sourceCardinality: '1', targetCardinality: '*' },
    { id: rid(), source: 'tmpl-lib-library', target: 'tmpl-lib-member', type: 'aggregation', sourceCardinality: '1', targetCardinality: '*' },
  ],
};

const elevatorTemplate: LLDChallengeTemplate = {
  challengeId: 'lld-elevator-system',
  name: 'Elevator System Starter',
  starterClasses: [
    {
      id: 'tmpl-el-building',
      name: 'Building',
      stereotype: 'class',
      attributes: [
        { id: 'gen-attr-15', name: 'floors', type: 'number', visibility: '-' },
        { id: 'gen-attr-16', name: 'elevators', type: 'Elevator[]', visibility: '-' },
      ],
      methods: [
        { id: 'gen-meth-81', name: 'requestElevator', returnType: 'void', params: ['floor: number', 'dir: Direction'], visibility: '+' },
      ],
      x: 100,
      y: 50,
    },
    {
      id: 'tmpl-el-elevator',
      name: 'Elevator',
      stereotype: 'class',
      attributes: [
        { id: 'gen-attr-17', name: 'id', type: 'number', visibility: '-' },
        { id: 'gen-attr-18', name: 'currentFloor', type: 'number', visibility: '-' },
        { id: 'gen-attr-19', name: 'state', type: 'ElevatorState', visibility: '-' },
      ],
      methods: [
        { id: 'gen-meth-82', name: 'move', returnType: 'void', params: [], visibility: '+' },
        { id: 'gen-meth-83', name: 'addStop', returnType: 'void', params: ['floor: number'], visibility: '+' },
      ],
      x: 400,
      y: 50,
    },
    {
      id: 'tmpl-el-dispatcher',
      name: 'Dispatcher',
      stereotype: 'interface',
      attributes: [],
      methods: [
        { id: 'gen-meth-84', name: 'selectElevator', returnType: 'Elevator', params: ['floor: number', 'dir: Direction'], visibility: '+' },
      ],
      x: 100,
      y: 300,
    },
  ],
  hintRelationships: [
    { id: rid(), source: 'tmpl-el-building', target: 'tmpl-el-elevator', type: 'composition', sourceCardinality: '1', targetCardinality: '1..*' },
    { id: rid(), source: 'tmpl-el-building', target: 'tmpl-el-dispatcher', type: 'dependency', label: 'uses' },
  ],
};

const vendingMachineTemplate: LLDChallengeTemplate = {
  challengeId: 'lld-vending-machine',
  name: 'Vending Machine Starter',
  starterClasses: [
    {
      id: 'tmpl-vm-machine',
      name: 'VendingMachine',
      stereotype: 'class',
      attributes: [
        { id: 'gen-attr-20', name: 'inventory', type: 'Inventory', visibility: '-' },
        { id: 'gen-attr-21', name: 'currentBalance', type: 'number', visibility: '-' },
        { id: 'gen-attr-22', name: 'state', type: 'MachineState', visibility: '-' },
      ],
      methods: [
        { id: 'gen-meth-85', name: 'insertCoin', returnType: 'void', params: ['coin: Coin'], visibility: '+' },
        { id: 'gen-meth-86', name: 'selectProduct', returnType: 'Product', params: ['code: string'], visibility: '+' },
        { id: 'gen-meth-87', name: 'dispense', returnType: 'void', params: [], visibility: '+' },
      ],
      x: 50,
      y: 50,
    },
    {
      id: 'tmpl-vm-product',
      name: 'Product',
      stereotype: 'class',
      attributes: [
        { id: 'gen-attr-23', name: 'name', type: 'string', visibility: '-' },
        { id: 'gen-attr-24', name: 'price', type: 'number', visibility: '-' },
        { id: 'gen-attr-25', name: 'code', type: 'string', visibility: '-' },
      ],
      methods: [
        { id: 'gen-meth-88', name: 'getPrice', returnType: 'number', params: [], visibility: '+' },
      ],
      x: 400,
      y: 50,
    },
    {
      id: 'tmpl-vm-inventory',
      name: 'Inventory',
      stereotype: 'class',
      attributes: [
        { id: 'gen-attr-26', name: 'items', type: 'Map<string, number>', visibility: '-' },
      ],
      methods: [
        { id: 'gen-meth-89', name: 'getStock', returnType: 'number', params: ['code: string'], visibility: '+' },
        { id: 'gen-meth-90', name: 'reduce', returnType: 'void', params: ['code: string'], visibility: '+' },
      ],
      x: 400,
      y: 300,
    },
  ],
  hintRelationships: [
    { id: rid(), source: 'tmpl-vm-machine', target: 'tmpl-vm-inventory', type: 'composition' },
    { id: rid(), source: 'tmpl-vm-inventory', target: 'tmpl-vm-product', type: 'aggregation', sourceCardinality: '1', targetCardinality: '*' },
  ],
};

const chessTemplate: LLDChallengeTemplate = {
  challengeId: 'lld-chess-game',
  name: 'Chess Game Starter',
  starterClasses: [
    {
      id: 'tmpl-ch-game',
      name: 'Game',
      stereotype: 'class',
      attributes: [
        { id: 'gen-attr-27', name: 'board', type: 'Board', visibility: '-' },
        { id: 'gen-attr-28', name: 'players', type: 'Player[]', visibility: '-' },
        { id: 'gen-attr-29', name: 'currentTurn', type: 'Color', visibility: '-' },
        { id: 'gen-attr-30', name: 'status', type: 'GameStatus', visibility: '-' },
      ],
      methods: [
        { id: 'gen-meth-91', name: 'makeMove', returnType: 'boolean', params: ['from: Position', 'to: Position'], visibility: '+' },
        { id: 'gen-meth-92', name: 'isCheckmate', returnType: 'boolean', params: [], visibility: '+' },
      ],
      x: 50,
      y: 50,
    },
    {
      id: 'tmpl-ch-board',
      name: 'Board',
      stereotype: 'class',
      attributes: [
        { id: 'gen-attr-31', name: 'cells', type: 'Cell[][]', visibility: '-' },
      ],
      methods: [
        { id: 'gen-meth-93', name: 'getPiece', returnType: 'Piece', params: ['pos: Position'], visibility: '+' },
        { id: 'gen-meth-94', name: 'movePiece', returnType: 'void', params: ['from: Position', 'to: Position'], visibility: '+' },
      ],
      x: 400,
      y: 50,
    },
    {
      id: 'tmpl-ch-piece',
      name: 'Piece',
      stereotype: 'abstract',
      attributes: [
        { id: 'gen-attr-32', name: 'color', type: 'Color', visibility: '#' },
        { id: 'gen-attr-33', name: 'position', type: 'Position', visibility: '#' },
      ],
      methods: [
        { id: 'gen-meth-95', name: 'getValidMoves', returnType: 'Position[]', params: ['board: Board'], visibility: '+', isAbstract: true },
        { id: 'gen-meth-96', name: 'canMove', returnType: 'boolean', params: ['to: Position', 'board: Board'], visibility: '+' },
      ],
      x: 400,
      y: 300,
    },
  ],
  hintRelationships: [
    { id: rid(), source: 'tmpl-ch-game', target: 'tmpl-ch-board', type: 'composition' },
    { id: rid(), source: 'tmpl-ch-board', target: 'tmpl-ch-piece', type: 'aggregation', sourceCardinality: '1', targetCardinality: '0..32' },
  ],
};

const snakeGameTemplate: LLDChallengeTemplate = {
  challengeId: 'lld-snake-game',
  name: 'Snake Game Starter',
  starterClasses: [
    {
      id: 'tmpl-sl-game',
      name: 'Game',
      stereotype: 'class',
      attributes: [
        { id: 'gen-attr-34', name: 'board', type: 'Board', visibility: '-' },
        { id: 'gen-attr-35', name: 'players', type: 'Player[]', visibility: '-' },
        { id: 'gen-attr-36', name: 'currentPlayerIdx', type: 'number', visibility: '-' },
      ],
      methods: [
        { id: 'gen-meth-97', name: 'play', returnType: 'Player', params: [], visibility: '+' },
        { id: 'gen-meth-98', name: 'takeTurn', returnType: 'boolean', params: [], visibility: '-' },
      ],
      x: 50,
      y: 50,
    },
    {
      id: 'tmpl-sl-board',
      name: 'Board',
      stereotype: 'class',
      attributes: [
        { id: 'gen-attr-37', name: 'size', type: 'number', visibility: '-' },
        { id: 'gen-attr-38', name: 'snakes', type: 'Map<number, number>', visibility: '-' },
        { id: 'gen-attr-39', name: 'ladders', type: 'Map<number, number>', visibility: '-' },
      ],
      methods: [
        { id: 'gen-meth-99', name: 'getNextPosition', returnType: 'number', params: ['position: number'], visibility: '+' },
      ],
      x: 400,
      y: 50,
    },
    {
      id: 'tmpl-sl-player',
      name: 'Player',
      stereotype: 'class',
      attributes: [
        { id: 'gen-attr-40', name: 'name', type: 'string', visibility: '-' },
        { id: 'gen-attr-41', name: 'position', type: 'number', visibility: '-' },
      ],
      methods: [
        { id: 'gen-meth-100', name: 'move', returnType: 'void', params: ['steps: number'], visibility: '+' },
      ],
      x: 50,
      y: 300,
    },
  ],
  hintRelationships: [
    { id: rid(), source: 'tmpl-sl-game', target: 'tmpl-sl-board', type: 'composition' },
    { id: rid(), source: 'tmpl-sl-game', target: 'tmpl-sl-player', type: 'aggregation', sourceCardinality: '1', targetCardinality: '2..4' },
  ],
};

const movieTicketTemplate: LLDChallengeTemplate = {
  challengeId: 'lld-movie-ticket-booking',
  name: 'Movie Ticket Booking Starter',
  starterClasses: [
    {
      id: 'tmpl-mt-theater',
      name: 'Theater',
      stereotype: 'class',
      attributes: [
        { id: 'gen-attr-42', name: 'name', type: 'string', visibility: '-' },
        { id: 'gen-attr-43', name: 'screens', type: 'Screen[]', visibility: '-' },
      ],
      methods: [
        { id: 'gen-meth-101', name: 'getAvailableShows', returnType: 'Show[]', params: ['movie: Movie'], visibility: '+' },
      ],
      x: 50,
      y: 50,
    },
    {
      id: 'tmpl-mt-movie',
      name: 'Movie',
      stereotype: 'class',
      attributes: [
        { id: 'gen-attr-44', name: 'title', type: 'string', visibility: '-' },
        { id: 'gen-attr-45', name: 'duration', type: 'number', visibility: '-' },
        { id: 'gen-attr-46', name: 'genre', type: 'string', visibility: '-' },
      ],
      methods: [],
      x: 400,
      y: 50,
    },
    {
      id: 'tmpl-mt-booking',
      name: 'Booking',
      stereotype: 'class',
      attributes: [
        { id: 'gen-attr-47', name: 'id', type: 'string', visibility: '-' },
        { id: 'gen-attr-48', name: 'show', type: 'Show', visibility: '-' },
        { id: 'gen-attr-49', name: 'seats', type: 'Seat[]', visibility: '-' },
        { id: 'gen-attr-50', name: 'status', type: 'BookingStatus', visibility: '-' },
      ],
      methods: [
        { id: 'gen-meth-102', name: 'confirm', returnType: 'void', params: [], visibility: '+' },
        { id: 'gen-meth-103', name: 'cancel', returnType: 'void', params: [], visibility: '+' },
      ],
      x: 200,
      y: 300,
    },
  ],
  hintRelationships: [
    { id: rid(), source: 'tmpl-mt-theater', target: 'tmpl-mt-movie', type: 'dependency', label: 'shows' },
    { id: rid(), source: 'tmpl-mt-booking', target: 'tmpl-mt-movie', type: 'association' },
  ],
};

const atmTemplate: LLDChallengeTemplate = {
  challengeId: 'lld-atm-system',
  name: 'ATM System Starter',
  starterClasses: [
    {
      id: 'tmpl-atm-machine',
      name: 'ATM',
      stereotype: 'class',
      attributes: [
        { id: 'gen-attr-51', name: 'id', type: 'string', visibility: '-' },
        { id: 'gen-attr-52', name: 'cashDispenser', type: 'CashDispenser', visibility: '-' },
        { id: 'gen-attr-53', name: 'state', type: 'ATMState', visibility: '-' },
      ],
      methods: [
        { id: 'gen-meth-104', name: 'insertCard', returnType: 'void', params: ['card: Card'], visibility: '+' },
        { id: 'gen-meth-105', name: 'authenticate', returnType: 'boolean', params: ['pin: string'], visibility: '+' },
      ],
      x: 50,
      y: 50,
    },
    {
      id: 'tmpl-atm-account',
      name: 'Account',
      stereotype: 'class',
      attributes: [
        { id: 'gen-attr-54', name: 'accountNumber', type: 'string', visibility: '-' },
        { id: 'gen-attr-55', name: 'balance', type: 'number', visibility: '-' },
      ],
      methods: [
        { id: 'gen-meth-106', name: 'withdraw', returnType: 'boolean', params: ['amount: number'], visibility: '+' },
        { id: 'gen-meth-107', name: 'deposit', returnType: 'void', params: ['amount: number'], visibility: '+' },
        { id: 'gen-meth-108', name: 'getBalance', returnType: 'number', params: [], visibility: '+' },
      ],
      x: 400,
      y: 50,
    },
    {
      id: 'tmpl-atm-transaction',
      name: 'Transaction',
      stereotype: 'abstract',
      attributes: [
        { id: 'gen-attr-56', name: 'id', type: 'string', visibility: '-' },
        { id: 'gen-attr-57', name: 'amount', type: 'number', visibility: '-' },
        { id: 'gen-attr-58', name: 'timestamp', type: 'Date', visibility: '-' },
      ],
      methods: [
        { id: 'gen-meth-109', name: 'execute', returnType: 'boolean', params: [], visibility: '+', isAbstract: true },
      ],
      x: 200,
      y: 300,
    },
  ],
  hintRelationships: [
    { id: rid(), source: 'tmpl-atm-machine', target: 'tmpl-atm-account', type: 'dependency', label: 'accesses' },
    { id: rid(), source: 'tmpl-atm-machine', target: 'tmpl-atm-transaction', type: 'dependency', label: 'creates' },
  ],
};

const notificationServiceTemplate: LLDChallengeTemplate = {
  challengeId: 'lld-notification-service',
  name: 'Notification Service Starter',
  starterClasses: [
    {
      id: 'tmpl-ns-service',
      name: 'NotificationService',
      stereotype: 'class',
      attributes: [
        { id: 'gen-attr-59', name: 'channels', type: 'NotificationChannel[]', visibility: '-' },
        { id: 'gen-attr-60', name: 'preferences', type: 'Map<string, Preference>', visibility: '-' },
      ],
      methods: [
        { id: 'gen-meth-110', name: 'send', returnType: 'void', params: ['notification: Notification'], visibility: '+' },
        { id: 'gen-meth-111', name: 'registerChannel', returnType: 'void', params: ['channel: NotificationChannel'], visibility: '+' },
      ],
      x: 50,
      y: 50,
    },
    {
      id: 'tmpl-ns-channel',
      name: 'NotificationChannel',
      stereotype: 'interface',
      attributes: [],
      methods: [
        { id: 'gen-meth-112', name: 'send', returnType: 'DeliveryResult', params: ['notification: Notification'], visibility: '+' },
        { id: 'gen-meth-113', name: 'getType', returnType: 'ChannelType', params: [], visibility: '+' },
      ],
      x: 400,
      y: 50,
    },
    {
      id: 'tmpl-ns-notification',
      name: 'Notification',
      stereotype: 'class',
      attributes: [
        { id: 'gen-attr-61', name: 'id', type: 'string', visibility: '-' },
        { id: 'gen-attr-62', name: 'recipient', type: 'string', visibility: '-' },
        { id: 'gen-attr-63', name: 'message', type: 'string', visibility: '-' },
        { id: 'gen-attr-64', name: 'priority', type: 'Priority', visibility: '-' },
      ],
      methods: [],
      x: 200,
      y: 300,
    },
  ],
  hintRelationships: [
    { id: rid(), source: 'tmpl-ns-service', target: 'tmpl-ns-channel', type: 'aggregation', sourceCardinality: '1', targetCardinality: '1..*' },
    { id: rid(), source: 'tmpl-ns-service', target: 'tmpl-ns-notification', type: 'dependency', label: 'dispatches' },
  ],
};

const rateLimiterTemplate: LLDChallengeTemplate = {
  challengeId: 'lld-rate-limiter',
  name: 'Rate Limiter Starter',
  starterClasses: [
    {
      id: 'tmpl-rl-limiter',
      name: 'RateLimiter',
      stereotype: 'interface',
      attributes: [],
      methods: [
        { id: 'gen-meth-114', name: 'isAllowed', returnType: 'RateLimitResult', params: ['clientId: string'], visibility: '+' },
      ],
      x: 250,
      y: 50,
    },
    {
      id: 'tmpl-rl-token-bucket',
      name: 'TokenBucketLimiter',
      stereotype: 'class',
      attributes: [
        { id: 'gen-attr-65', name: 'maxTokens', type: 'number', visibility: '-' },
        { id: 'gen-attr-66', name: 'refillRate', type: 'number', visibility: '-' },
        { id: 'gen-attr-67', name: 'buckets', type: 'Map<string, Bucket>', visibility: '-' },
      ],
      methods: [
        { id: 'gen-meth-115', name: 'isAllowed', returnType: 'RateLimitResult', params: ['clientId: string'], visibility: '+' },
      ],
      x: 50,
      y: 300,
    },
    {
      id: 'tmpl-rl-config',
      name: 'RateLimitConfig',
      stereotype: 'class',
      attributes: [
        { id: 'gen-attr-68', name: 'algorithm', type: 'string', visibility: '-' },
        { id: 'gen-attr-69', name: 'maxRequests', type: 'number', visibility: '-' },
        { id: 'gen-attr-70', name: 'windowMs', type: 'number', visibility: '-' },
      ],
      methods: [],
      x: 450,
      y: 300,
    },
  ],
  hintRelationships: [
    { id: rid(), source: 'tmpl-rl-token-bucket', target: 'tmpl-rl-limiter', type: 'realization' },
    { id: rid(), source: 'tmpl-rl-token-bucket', target: 'tmpl-rl-config', type: 'dependency', label: 'configured by' },
  ],
};

// ── Exports ────────────────────────────────────────────────────────

export const LLD_CHALLENGE_TEMPLATES: LLDChallengeTemplate[] = [
  parkingLotTemplate,
  libraryTemplate,
  elevatorTemplate,
  vendingMachineTemplate,
  chessTemplate,
  snakeGameTemplate,
  movieTicketTemplate,
  atmTemplate,
  notificationServiceTemplate,
  rateLimiterTemplate,
];

/** Look up a starter template by challenge ID. */
export function getTemplateForChallenge(challengeId: string): LLDChallengeTemplate | undefined {
  return LLD_CHALLENGE_TEMPLATES.find((t) => t.challengeId === challengeId);
}
