'use client';

import React, { memo, useState, useCallback, useMemo } from 'react';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  Plus,
  Link2,
  Eye,
  CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────

/** Actions the walkthrough can suggest at each step. */
export type WalkthroughAction =
  | 'add-class'
  | 'add-attribute'
  | 'add-relationship'
  | 'explain-pattern';

export interface WalkthroughStep {
  /** Brief instruction text shown to the learner. */
  instruction: string;
  /** Node IDs to highlight (pulse) on the canvas. */
  highlightNodes: string[];
  /** Edge/relationship IDs to highlight on the canvas. */
  highlightEdges: string[];
  /** Detailed explanation shown below the instruction. */
  explanation: string;
  /** The type of action this step represents. */
  action: WalkthroughAction;
}

export interface Walkthrough {
  challengeId: string;
  title: string;
  steps: WalkthroughStep[];
}

// ── Walkthrough data: Parking Lot ──────────────────────────────────

const parkingLotWalkthrough: Walkthrough = {
  challengeId: 'lld-parking-lot',
  title: 'Parking Lot System Walkthrough',
  steps: [
    {
      instruction: 'Start with the top-level ParkingLot class',
      highlightNodes: ['tmpl-pl-lot'],
      highlightEdges: [],
      explanation:
        'Every LLD problem starts by identifying the main entity. The ParkingLot is the ' +
        'aggregate root -- it owns all floors and provides the public API for parking vehicles. ' +
        'Give it a name, a list of floors, and methods for checking availability and parking.',
      action: 'add-class',
    },
    {
      instruction: 'Add ParkingFloor as a child of ParkingLot',
      highlightNodes: ['tmpl-pl-lot', 'tmpl-pl-floor'],
      highlightEdges: [],
      explanation:
        'A ParkingLot has multiple floors -- this is composition (if the lot is destroyed, ' +
        'floors go with it). Each floor tracks its own spots and can find an available spot ' +
        'for a given vehicle type. Use a composition arrow from Lot to Floor.',
      action: 'add-class',
    },
    {
      instruction: 'Connect ParkingLot to ParkingFloor with composition',
      highlightNodes: [],
      highlightEdges: ['tmpl-rel-1'],
      explanation:
        'Draw a composition relationship (filled diamond) from ParkingLot to ParkingFloor ' +
        'with cardinality 1 to 1..*. Composition means the floor cannot exist without the lot. ' +
        'This is one of the most common relationships in LLD interviews.',
      action: 'add-relationship',
    },
    {
      instruction: 'Add ParkingSpot with type and occupancy',
      highlightNodes: ['tmpl-pl-spot'],
      highlightEdges: [],
      explanation:
        'Each floor has many parking spots. A ParkingSpot knows its type (SMALL, MEDIUM, LARGE), ' +
        'whether it is occupied, and can assign/remove vehicles. This maps to another composition ' +
        'from Floor to Spot.',
      action: 'add-class',
    },
    {
      instruction: 'Model the Vehicle hierarchy with inheritance',
      highlightNodes: [],
      highlightEdges: [],
      explanation:
        'Create an abstract Vehicle class with licensePlate and type. Then add concrete ' +
        'subclasses: Motorcycle, Car, Bus. Each vehicle type maps to the spot type it can fit ' +
        'in. This demonstrates the inheritance pattern interviewers look for.',
      action: 'add-class',
    },
    {
      instruction: 'Define enums for VehicleType and SpotType',
      highlightNodes: [],
      highlightEdges: [],
      explanation:
        'Enums constrain the possible values: VehicleType (MOTORCYCLE, CAR, BUS) and ' +
        'SpotType (SMALL, MEDIUM, LARGE). A mapping function determines which vehicle types ' +
        'fit in which spot types (e.g., a motorcycle fits in any spot, a bus only in LARGE).',
      action: 'explain-pattern',
    },
    {
      instruction: 'Add Ticket class linking Vehicle to Spot',
      highlightNodes: [],
      highlightEdges: [],
      explanation:
        'A Ticket records: the vehicle, the assigned spot, entry time, and later the exit time. ' +
        'The entry gate creates a ticket; the exit gate uses it to calculate the fee. ' +
        'This is a classic association -- a ticket references both a vehicle and a spot.',
      action: 'add-class',
    },
    {
      instruction: 'Apply Strategy pattern for fee calculation',
      highlightNodes: [],
      highlightEdges: [],
      explanation:
        'Create a FeeStrategy interface with calculate(entryTime, exitTime): number. ' +
        'Implement HourlyFee, DailyFee, and WeekendFee. The ParkingLot holds a reference ' +
        'to the active strategy. This is the Strategy pattern -- interviewers love seeing it ' +
        'because it shows you think about extensibility.',
      action: 'explain-pattern',
    },
  ],
};

// ── Walkthrough data: Library Management ───────────────────────────

const libraryWalkthrough: Walkthrough = {
  challengeId: 'lld-library-management',
  title: 'Library Management Walkthrough',
  steps: [
    {
      instruction: 'Start with the Library class as the aggregate root',
      highlightNodes: ['tmpl-lib-library'],
      highlightEdges: [],
      explanation:
        'The Library class is the entry point. It aggregates books and members, and ' +
        'provides search and registration methods. In LLD interviews, always identify ' +
        'the top-level entity that owns the domain.',
      action: 'add-class',
    },
    {
      instruction: 'Add the Book class for catalog entries',
      highlightNodes: ['tmpl-lib-book'],
      highlightEdges: [],
      explanation:
        'A Book represents a catalog entry: ISBN, title, author. Important: this is the ' +
        'concept of a book, not a physical copy. One Book can have multiple physical copies. ' +
        'Interviewers specifically look for this distinction.',
      action: 'add-class',
    },
    {
      instruction: 'Separate Book from BookCopy',
      highlightNodes: ['tmpl-lib-book'],
      highlightEdges: [],
      explanation:
        'Add a BookCopy class with barcode, condition, and isAvailable flag. ' +
        'Book has a one-to-many relationship with BookCopy. This separation is a key ' +
        'insight -- it models reality (a library has 3 copies of "Clean Code") and is ' +
        'the most common differentiator between good and great LLD answers.',
      action: 'add-class',
    },
    {
      instruction: 'Add the Member class',
      highlightNodes: ['tmpl-lib-member'],
      highlightEdges: [],
      explanation:
        'Members have an id, name, and can borrow/return books. The Library aggregates ' +
        'Members (if the library closes, members still exist conceptually). ' +
        'Draw an aggregation arrow from Library to Member.',
      action: 'add-class',
    },
    {
      instruction: 'Create the Loan class linking Member to BookCopy',
      highlightNodes: [],
      highlightEdges: [],
      explanation:
        'A Loan is the association class: it links a Member to a specific BookCopy with ' +
        'borrowDate, dueDate, and returnDate. It has isOverdue() and calculateFine() methods. ' +
        'This is a many-to-many resolver -- each member can have many loans, and each ' +
        'copy can have a history of loans.',
      action: 'add-class',
    },
    {
      instruction: 'Implement fine calculation with Strategy pattern',
      highlightNodes: [],
      highlightEdges: [],
      explanation:
        'Create a FineCalculator interface with calculate(loan): number. Implement ' +
        'FlatRateFine (e.g., $5 regardless of days), PerDayFine (e.g., $1/day), and ' +
        'CappedFine (per-day with a maximum). The Library holds the active strategy. ' +
        'This shows extensibility thinking.',
      action: 'explain-pattern',
    },
    {
      instruction: 'Add Observer pattern for reservation notifications',
      highlightNodes: [],
      highlightEdges: [],
      explanation:
        'When a member reserves a book that is currently checked out, they become an ' +
        'observer. When the BookCopy is returned, the system notifies the next member ' +
        'in the reservation queue. Define a ReservationObserver interface with ' +
        'onBookAvailable(book). This rounds out the design with a behavioral pattern.',
      action: 'explain-pattern',
    },
  ],
};

// ── Walkthrough data: Elevator System ──────────────────────────────

const elevatorWalkthrough: Walkthrough = {
  challengeId: 'lld-elevator-system',
  title: 'Elevator System Walkthrough',
  steps: [
    {
      instruction: 'Start with the Building class',
      highlightNodes: ['tmpl-el-building'],
      highlightEdges: [],
      explanation:
        'The Building is the container: it knows how many floors it has and holds ' +
        'references to all elevators. It exposes requestElevator(floor, direction) as ' +
        'the public API. This is your aggregate root.',
      action: 'add-class',
    },
    {
      instruction: 'Add the Elevator class with state tracking',
      highlightNodes: ['tmpl-el-elevator'],
      highlightEdges: [],
      explanation:
        'Each Elevator has an id, currentFloor, and a state (Idle, MovingUp, MovingDown, ' +
        'DoorOpen). It maintains a list of pending stops. The key insight is that elevator ' +
        'behavior changes based on its state -- this is a perfect fit for the State pattern.',
      action: 'add-class',
    },
    {
      instruction: 'Apply the State pattern for elevator behavior',
      highlightNodes: ['tmpl-el-elevator'],
      highlightEdges: [],
      explanation:
        'Define an ElevatorState interface with handleRequest(), move(), and openDoor(). ' +
        'Create concrete states: IdleState (accepts any direction), MovingUpState (only adds ' +
        'stops above current floor), MovingDownState (only adds stops below), DoorOpenState ' +
        '(waits then transitions). The elevator delegates behavior to its current state.',
      action: 'explain-pattern',
    },
    {
      instruction: 'Create the Dispatcher interface',
      highlightNodes: ['tmpl-el-dispatcher'],
      highlightEdges: [],
      explanation:
        'The Dispatcher decides which elevator handles a new request. Define it as an ' +
        'interface with selectElevator(floor, direction): Elevator. This enables the ' +
        'Strategy pattern -- you can swap dispatching algorithms without changing the Building.',
      action: 'add-class',
    },
    {
      instruction: 'Implement SCAN dispatching algorithm',
      highlightNodes: ['tmpl-el-dispatcher'],
      highlightEdges: [],
      explanation:
        'The SCANDispatcher implements the SCAN (elevator) algorithm: pick the elevator ' +
        'that is (1) moving in the requested direction AND (2) has not yet passed the ' +
        'requested floor. If no elevator qualifies, pick the nearest idle one. This is ' +
        'the most common algorithm interviewers expect.',
      action: 'add-class',
    },
    {
      instruction: 'Add the Request model',
      highlightNodes: [],
      highlightEdges: [],
      explanation:
        'A Request captures: floor number, direction (UP/DOWN), and timestamp. ' +
        'Both external requests (from floor buttons) and internal requests (from inside ' +
        'the elevator) create Request objects. The Dispatcher processes external requests; ' +
        'the Elevator processes internal ones directly.',
      action: 'add-class',
    },
    {
      instruction: 'Model the Direction enum and stop queue',
      highlightNodes: [],
      highlightEdges: [],
      explanation:
        'Define a Direction enum (UP, DOWN). Inside each Elevator, maintain a priority ' +
        'queue of pending stops: when moving up, process in ascending order; when moving ' +
        'down, descending order. This is the LOOK algorithm optimization -- the elevator ' +
        'reverses direction only when there are no more stops ahead.',
      action: 'explain-pattern',
    },
    {
      instruction: 'Connect Building to Elevator and Dispatcher',
      highlightNodes: [],
      highlightEdges: ['tmpl-rel-5', 'tmpl-rel-6'],
      explanation:
        'Building composes Elevators (1 to 1..*) and depends on a Dispatcher. ' +
        'The Dispatcher depends on Elevator (it selects from the available elevators). ' +
        'These relationships show composition for ownership and dependency for usage.',
      action: 'add-relationship',
    },
  ],
};

// ── All walkthroughs ───────────────────────────────────────────────

export const WALKTHROUGHS: Walkthrough[] = [
  parkingLotWalkthrough,
  libraryWalkthrough,
  elevatorWalkthrough,
];

/** Look up a walkthrough by challenge ID. */
export function getWalkthroughForChallenge(challengeId: string): Walkthrough | undefined {
  return WALKTHROUGHS.find((w) => w.challengeId === challengeId);
}

// ── Action icon helper ─────────────────────────────────────────────

function ActionIcon({ action }: { action: WalkthroughAction }) {
  switch (action) {
    case 'add-class':
      return <Plus className="h-3.5 w-3.5" />;
    case 'add-attribute':
      return <Plus className="h-3.5 w-3.5" />;
    case 'add-relationship':
      return <Link2 className="h-3.5 w-3.5" />;
    case 'explain-pattern':
      return <Lightbulb className="h-3.5 w-3.5" />;
  }
}

function actionLabel(action: WalkthroughAction): string {
  switch (action) {
    case 'add-class':
      return 'Add Class';
    case 'add-attribute':
      return 'Add Attribute';
    case 'add-relationship':
      return 'Add Relationship';
    case 'explain-pattern':
      return 'Explain Pattern';
  }
}

const ACTION_COLORS: Record<WalkthroughAction, string> = {
  'add-class': 'bg-blue-500/20 text-blue-400 border-blue-500/40',
  'add-attribute': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
  'add-relationship': 'bg-amber-500/20 text-amber-400 border-amber-500/40',
  'explain-pattern': 'bg-purple-500/20 text-purple-400 border-purple-500/40',
};

// ── Step card ──────────────────────────────────────────────────────

const StepCard = memo(function StepCard({
  step,
  index,
  isCurrent,
  isCompleted,
}: {
  step: WalkthroughStep;
  index: number;
  isCurrent: boolean;
  isCompleted: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-lg border p-3 transition-all duration-200',
        isCurrent
          ? 'border-primary/50 bg-primary/5 shadow-sm shadow-primary/10'
          : isCompleted
            ? 'border-emerald-500/30 bg-emerald-500/5 opacity-70'
            : 'border-border/30 bg-elevated/50 opacity-50',
      )}
    >
      {/* Header */}
      <div className="mb-2 flex items-center gap-2">
        <div
          className={cn(
            'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
            isCurrent
              ? 'bg-primary text-primary-foreground'
              : isCompleted
                ? 'bg-emerald-500 text-white'
                : 'bg-elevated text-foreground-muted',
          )}
        >
          {isCompleted ? <CheckCircle className="h-3 w-3" /> : index + 1}
        </div>
        <span className={cn(
          'text-xs font-medium',
          isCurrent ? 'text-foreground' : 'text-foreground-muted',
        )}>
          {step.instruction}
        </span>
      </div>

      {/* Action badge */}
      <div className="mb-2 flex items-center gap-1.5">
        <span className={cn(
          'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium',
          ACTION_COLORS[step.action],
        )}>
          <ActionIcon action={step.action} />
          {actionLabel(step.action)}
        </span>

        {step.highlightNodes.length > 0 && (
          <span className="inline-flex items-center gap-0.5 text-[10px] text-foreground-subtle">
            <Eye className="h-3 w-3" />
            {step.highlightNodes.length} node{step.highlightNodes.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Explanation (only shown for current step) */}
      {isCurrent && (
        <p className="text-[11px] leading-relaxed text-foreground-muted">
          {step.explanation}
        </p>
      )}
    </div>
  );
});

// ── Progress bar ───────────────────────────────────────────────────

const ProgressBar = memo(function ProgressBar({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  const pct = total > 0 ? ((current + 1) / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-elevated">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] font-medium text-foreground-muted">
        {current + 1} / {total}
      </span>
    </div>
  );
});

// ── Main component ─────────────────────────────────────────────────

export interface LearnModeProps {
  /** The walkthrough to display. */
  walkthrough: Walkthrough;
  /** Callback when highlighted node/edge IDs change for canvas pulsing. */
  onHighlightChange?: (nodeIds: string[], edgeIds: string[]) => void;
  /** Callback when the user completes the walkthrough. */
  onComplete?: () => void;
  /** Callback when the user exits learn mode. */
  onExit?: () => void;
}

const LearnMode = memo(function LearnMode({
  walkthrough,
  onHighlightChange,
  onComplete,
  onExit,
}: LearnModeProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const steps = walkthrough.steps;
  const total = steps.length;
  const step = steps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === total - 1;

  // Notify parent of highlight changes
  const updateHighlights = useCallback(
    (idx: number) => {
      const s = steps[idx];
      if (s && onHighlightChange) {
        onHighlightChange(s.highlightNodes, s.highlightEdges);
      }
    },
    [steps, onHighlightChange],
  );

  const goNext = useCallback(() => {
    if (isLast) {
      onComplete?.();
      return;
    }
    const next = currentStep + 1;
    setCurrentStep(next);
    updateHighlights(next);
  }, [currentStep, isLast, onComplete, updateHighlights]);

  const goPrev = useCallback(() => {
    if (isFirst) return;
    const prev = currentStep - 1;
    setCurrentStep(prev);
    updateHighlights(prev);
  }, [currentStep, isFirst, updateHighlights]);

  // Build context window of steps to display (current +/- 1)
  const visibleSteps = useMemo(() => {
    const start = Math.max(0, currentStep - 1);
    const end = Math.min(total, currentStep + 2);
    return steps.slice(start, end).map((s, i) => ({
      step: s,
      index: start + i,
    }));
  }, [steps, currentStep, total]);

  // Emit highlights on mount
  React.useEffect(() => {
    updateHighlights(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!step) return null;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border/50 bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/30 px-3 py-2">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold text-foreground">
            Learn Mode
          </span>
        </div>
        {onExit && (
          <button
            onClick={onExit}
            className="rounded-md px-2 py-0.5 text-[10px] font-medium text-foreground-muted hover:bg-elevated hover:text-foreground transition-colors"
          >
            Exit
          </button>
        )}
      </div>

      {/* Title */}
      <div className="border-b border-border/20 px-3 py-2">
        <h3 className="text-[11px] font-semibold text-foreground">
          {walkthrough.title}
        </h3>
        <ProgressBar current={currentStep} total={total} />
      </div>

      {/* Steps */}
      <div className="flex-1 space-y-2 overflow-y-auto p-3 scrollbar-thin scrollbar-thumb-zinc-700">
        {visibleSteps.map(({ step: s, index: idx }) => (
          <StepCard
            key={idx}
            step={s}
            index={idx}
            isCurrent={idx === currentStep}
            isCompleted={idx < currentStep}
          />
        ))}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between border-t border-border/30 px-3 py-2">
        <button
          onClick={goPrev}
          disabled={isFirst}
          className={cn(
            'flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors',
            isFirst
              ? 'cursor-not-allowed text-foreground-subtle'
              : 'text-foreground-muted hover:bg-elevated hover:text-foreground',
          )}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Previous
        </button>

        <button
          onClick={goNext}
          className={cn(
            'flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors',
            isLast
              ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
              : 'bg-primary/20 text-primary hover:bg-primary/30',
          )}
        >
          {isLast ? (
            <>
              <CheckCircle className="h-3.5 w-3.5" />
              Complete
            </>
          ) : (
            <>
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
});

export default LearnMode;
