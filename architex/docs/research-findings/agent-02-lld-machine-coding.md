I now have a comprehensive understanding of the entire LLD module. Here is the complete interactive feature set specification.

---

# ARCHITEX LLD & MACHINE CODING MODULE -- COMPLETE INTERACTIVE FEATURE SET

---

## EXISTING STATE AUDIT

Before defining new features, here is what the codebase already has:

**Content Data:**
- 36 design patterns in `patterns.ts` (5 creational, 7 structural, 11 behavioral, 4 modern, 4 resilience, 2 concurrency, 3 AI-agent)
- 5 SOLID demos in `solid-demos.ts` (SRP, OCP, LSP, ISP, DIP) with before/after UML + code
- 4 OOP demos in `oop-demos.ts` (composition-vs-inheritance, polymorphism, encapsulation, abstraction)
- 33 LLD problems in `problems.ts` (parking lot through coffee vending machine)
- Each pattern has: UML classes, relationships, TS/Python/Java code, analogy, summary, whenToUse, confusedWith, interviewDepth

**Canvas Components:**
- `LLDCanvas.tsx` -- SVG class diagram renderer with drag, zoom, pan
- `SequenceDiagramCanvas.tsx` -- SVG sequence diagram with playback stepping
- `StateMachineCanvas.tsx` -- SVG state machine with simulation
- `AIReviewPanel.tsx` -- calls /api/ai/explain for pattern detection + correctness

**Interactive Panels (all exist):**
- `Flashcards.tsx` -- swipeable flashcards with CSV export for Anki
- `SOLIDQuiz.tsx` -- code-based violation detection, 15 questions, streaks
- `ScenarioChallenge.tsx` -- "which pattern fits?" MCQ, 12 scenarios
- `PatternComparison.tsx` -- Strategy vs State vs Command head-to-head
- `PatternQuizFiltered.tsx` -- adaptive per-pattern quiz with mastery tracking
- `ConfusedWithTab.tsx` -- side-by-side confused pattern comparison
- `StudyPlan.tsx` -- interview countdown with day-by-day schedule
- `DailyChallenge.tsx` -- deterministic daily pattern identification
- `InterviewPractice.tsx` -- timed practice mode with self-assessment checklist
- `WalkthroughPlayer.tsx` -- step-by-step pattern discovery
- `BidirectionalSyncPanel.tsx` -- diagram-to-code and code-to-diagram sync
- `PatternBehavioralSimulator.tsx` -- circuit breaker, retry, bulkhead, rate limiter runtime simulation
- `StreakCounter.tsx`, `SocialProof.tsx`, `LearningPathMap.tsx`

**Libraries:**
- `class-diagram-model.ts` -- immutable CRUD for class diagrams
- `bidirectional-sync.ts` -- code-to-diagram parser + sync manager
- `codegen/` -- TS/Python code generation + Mermaid export
- `persistence.ts`, `search.ts`, `prerequisites.ts`

---

## TOPIC-BY-TOPIC FEATURE SPECIFICATION

---

## 1. OOP PRINCIPLES

### 1A. Encapsulation Interactive Demo

**LEARNING**
- **Canvas Visualization**: Split-screen showing a "public field" class where any caller can mutate internal state directly (left), then animated transformation to a class with private fields + getter/setter methods (right). The canvas highlights fields turning from `+` to `-` visibility with a lock icon animation.
- **Progressive Build**: Step 1 -- show a BankAccount with public `balance` field. Step 2 -- a caller sets `balance = -500` directly, showing the danger with a red flash. Step 3 -- field goes private, getter added. Step 4 -- setter added with validation (`if amount < 0 throw`). Step 5 -- full encapsulated class.
- **Teaching approach**: "Encapsulation is a bouncer at a club. Nobody walks in without going through the door (methods). The bouncer (setter) checks your ID (validation) before letting you in."

| Metric | Value |
|--------|-------|
| Impact | 7 |
| WOW | 6 |
| Effort | M |
| Exists | Partial (OOP demo exists but only composition + polymorphism have before/after UML. Encapsulation demo exists as data in `oop-demos.ts` but no dedicated interactive canvas animation.) |

**SIMULATION**
- **Runtime behavior**: Show object state panel -- when `setBalance(500)` is called, show the validation gate checking the value, then updating internal state. When `setBalance(-100)` is called, show the validation gate rejecting with a red "BLOCKED" animation.
- **Before/After**: Already in `oop-demos.ts` with before/after classes + code.
- **Violation detector**: Show code where someone accesses `obj._balance` directly (Python) or uses reflection (Java) to bypass encapsulation -- highlight as anti-pattern.

| Metric | Value |
|--------|-------|
| Impact | 6 |
| WOW | 7 |
| Effort | M |
| Exists | No (before/after data exists, no runtime simulation) |

**PRACTICE**
- Challenge: "Given this class with 5 public fields, refactor to use proper encapsulation. Add validation where appropriate." User draws the UML, system auto-grades by checking: all fields private, getters present, at least one setter has validation logic.
- Challenge: "This Python class uses `_balance` (convention-only). Make it truly private with `__balance` and property decorators."

| Metric | Value |
|--------|-------|
| Impact | 6 |
| WOW | 5 |
| Effort | M |
| Exists | No |

**ASSESSMENT**
- Code snippet quiz: "Which of these classes violates encapsulation?" -- show 4 classes, one with public mutable fields.
- MCQ: "What is the primary benefit of encapsulation? A) Performance B) Data hiding and validation C) Inheritance D) Polymorphism"

| Metric | Value |
|--------|-------|
| Impact | 5 |
| WOW | 4 |
| Effort | S |
| Exists | No (not in SOLID quiz or scenario challenge) |

**REVIEW**
- Flashcard in existing Flashcards.tsx: "Encapsulation" front, 3-bullet summary + analogy + key classes back.

| Metric | Value |
|--------|-------|
| Impact | 4 |
| WOW | 3 |
| Effort | S |
| Exists | Partial (OOP demos feed into flashcards via `generateSOLIDCard` but OOP cards are not generated -- only SOLID + patterns) |

**AI**
- AI reviews user's UML: "Your UserProfile class has `email` as public. This violates encapsulation -- email validation should happen in a setter. Change visibility to `-` and add `setEmail(email: string)` with regex validation."

| Metric | Value |
|--------|-------|
| Impact | 7 |
| WOW | 8 |
| Effort | M |
| Exists | Partial (AIReviewPanel checks correctness but not specifically OOP principle violations) |

---

### 1B. Abstraction Interactive Demo

**LEARNING**
- **Canvas Visualization**: Show a `CoffeeVendingMachine` with 15 internal methods (grindBeans, heatWater, steamMilk, measureDose...) exposed publicly. Animate collapsing them behind a single `makeCoffee(type: string)` public method while the internal details become private. The 15 method boxes visually shrink behind a "curtain."
- **Progressive Build**: Step 1 -- caller must call 8 methods in correct order. Step 2 -- introduce abstraction: caller calls `makeCoffee("latte")` and the sequence diagram shows internal orchestration automatically.

| Metric | Value |
|--------|-------|
| Impact | 7 |
| WOW | 7 |
| Effort | M |
| Exists | Partial (data in oop-demos.ts, no canvas animation) |

**SIMULATION**
- Show two sequence diagrams side by side: "Without abstraction" (caller makes 8 calls) vs "With abstraction" (caller makes 1 call, system orchestrates internally). Playback both simultaneously.

| Metric | Value |
|--------|-------|
| Impact | 7 |
| WOW | 8 |
| Effort | L |
| Exists | No |

---

### 1C. Inheritance vs Composition Interactive

**LEARNING**
- **Canvas Visualization**: The "diamond problem" -- show `Animal > FlyingAnimal` and `Animal > SwimmingAnimal`, then `Duck` trying to extend both. Animate the conflict with red lines. Then show the composition solution: `Duck` has-a `FlyBehavior` and `SwimBehavior` interfaces.
- **Progressive Build**: Step 1 -- simple inheritance tree. Step 2 -- add requirements that break the tree (flying fish, swimming bird). Step 3 -- show the explosion of subclasses. Step 4 -- refactor to composition. Step 5 -- show how easy it is to add `FlyingFish` with composition.

| Metric | Value |
|--------|-------|
| Impact | 9 |
| WOW | 9 |
| Effort | L |
| Exists | Yes (full before/after in oop-demos.ts with UML + code, but the "progressive build animation" does not exist -- it shows static before/after) |

**SIMULATION**
- **Class count explosion**: Counter shows: "With inheritance: 2^n subclasses needed for n behaviors. With composition: n behavior objects." Slider lets user add behaviors (fly, swim, run, climb) and watches the inheritance tree explode while composition stays flat.

| Metric | Value |
|--------|-------|
| Impact | 9 |
| WOW | 10 |
| Effort | M |
| Exists | No |

---

### 1D. Interface vs Abstract Class

**LEARNING**
- **Canvas Visualization**: Side-by-side UML. Left: `<<interface>> Printable` with only method signatures. Right: `<<abstract>> Document` with implemented `save()` and abstract `render()`. Highlight: interface = contract only (dashed border), abstract = partial implementation (solid border with italics).
- **Teaching**: "Interface = menu at a restaurant (tells you what's available, but doesn't cook it). Abstract class = recipe template (some steps are done for you, but you fill in the blanks)."

| Metric | Value |
|--------|-------|
| Impact | 8 |
| WOW | 7 |
| Effort | M |
| Exists | No (patterns use stereotypes <<interface>> and <<abstract>> in UML rendering but no dedicated teaching module) |

**SIMULATION**
- Show a class implementing an interface -- must implement ALL methods (canvas highlights missing methods in red until implemented). Show a class extending abstract -- inherited concrete methods are grayed out (already done), abstract methods are red (you must implement).
- **Multi-interface**: Show a class implementing 3 interfaces simultaneously -- highlight how Java/TS supports this while multiple inheritance of classes is forbidden.

| Metric | Value |
|--------|-------|
| Impact | 8 |
| WOW | 8 |
| Effort | M |
| Exists | No |

---

### 1E. Composition vs Aggregation vs Association

**LEARNING**
- **Canvas Visualization**: Three relationship types rendered with UML notation side by side. Filled diamond (composition: `Car <>----> Engine` -- engine dies when car is destroyed). Open diamond (aggregation: `University <>---> Professor` -- professor survives when university closes). Simple line (association: `Student --- Course` -- independent lifecycles).
- **Progressive Build**: Start with two classes. Step 1 -- draw association. Step 2 -- "What if one owns the other's lifecycle?" -- upgrade to composition. Step 3 -- "What if it's owned but can exist independently?" -- show aggregation.

| Metric | Value |
|--------|-------|
| Impact | 8 |
| WOW | 7 |
| Effort | M |
| Exists | Partial (relationship types exist in the type system and rendering, but no dedicated teaching flow that explains the difference) |

**ASSESSMENT**
- "Draw the relationship": Show two class boxes. User clicks to draw a line between them and selects the relationship type. System grades against the correct answer. 10 scenarios (e.g., "Library and Book" = composition, "Teacher and Student" = association, "Department and Employee" = aggregation).

| Metric | Value |
|--------|-------|
| Impact | 8 |
| WOW | 8 |
| Effort | L |
| Exists | No |

---

## 2. DESIGN PATTERNS -- ALL 36

All 36 patterns already have full content data. The features below apply uniformly across ALL patterns.

### 2A. Progressive Diagram Builder (applies to ALL patterns)

**LEARNING**
- **How it works**: Instead of showing the full pattern UML at once, build it step by step. Each step adds one class or one relationship with a narration bubble explaining WHY that piece exists.
- **Implementation**: `WalkthroughPlayer.tsx` already fetches step data from the content API. What's missing is the **canvas integration** -- currently WalkthroughPlayer shows text steps, but the canvas does not animate to match each step. Need: when user advances to step N, the canvas should only render the first N classes/relationships with a fade-in animation for the new addition.
- **Data format per step**:
```typescript
interface WalkthroughCanvasStep {
  classIds: string[];        // which classes are visible at this step
  relationshipIds: string[]; // which relationships are visible
  highlightId?: string;      // which element gets a glow highlight
  narration: string;         // "We add ConcreteObserver because..."
}
```

| Metric | Value |
|--------|-------|
| Impact | 10 |
| WOW | 10 |
| Effort | L |
| Exists | Partial (WalkthroughPlayer exists with text steps; canvas exists; they are not connected) |

### 2B. Pattern Runtime Simulator (applies to Behavioral + Resilience patterns)

**SIMULATION**
- **How it works**: For behavioral patterns (Observer, Strategy, Command, State, Iterator, Mediator, Chain of Responsibility), show a live sequence diagram that plays in real time. User triggers events (e.g., "price changes" for Observer) and watches `notify()` propagate to all subscribers with animated arrows.
- **Already exists for resilience**: `PatternBehavioralSimulator.tsx` handles Circuit Breaker, Retry, Bulkhead, Rate Limiter with running metrics. Need to extend this approach to behavioral patterns.
- **New patterns to simulate**:
  - **Observer**: Subject has 3-5 observers. User clicks "update price." Animated arrows show `notify()` -> each observer's `update()` method fires sequentially. Latency overlay shows propagation time.
  - **Strategy**: Three algorithm boxes. User picks one from dropdown. Animated arrow shows context delegating to selected strategy. Metrics show execution time difference.
  - **Command**: Operations appear as command objects in a queue. User clicks "execute" -- command moves from queue to executed stack. "Undo" pops from stack and reverses. Visual history grows.
  - **State**: State machine diagram with current state highlighted. User triggers events. State transitions animate with the current state node glowing and an arrow animating to the next state.
  - **Chain of Responsibility**: Request object moves through a chain of handler boxes left-to-right. Each handler either processes (green) or passes (arrow to next). First handler that accepts stops the chain.
  - **Mediator**: Central mediator box in the middle. 5 component boxes around it. When one component changes, animated arrow goes to mediator, then mediator dispatches arrows to affected components.

| Metric | Value |
|--------|-------|
| Impact | 10 |
| WOW | 10 |
| Effort | XL |
| Exists | Partial (PatternBehavioralSimulator covers 4 resilience patterns. Sequence diagram playback exists. State machine simulation exists. No Observer/Strategy/Command/CoR/Mediator runtime sim.) |

### 2C. Before/After Refactoring (applies to ALL patterns)

**SIMULATION**
- **How it works**: Show "naive" code that solves a problem WITHOUT the pattern (monolithic, switch statements, tight coupling). Then animate the refactoring: classes split apart, interfaces appear, relationships reorganize. User sees the class count grow but the coupling decrease.
- **Already exists for SOLID**: `solid-demos.ts` has full before/after UML + code for all 5 principles.
- **Need for patterns**: Each of the 36 patterns needs:
```typescript
interface PatternRefactoring {
  patternId: string;
  beforeClasses: UMLClass[];
  beforeRelationships: UMLRelationship[];
  beforeCode: { typescript: string; python: string };
  afterClasses: UMLClass[];      // same as pattern.classes
  afterRelationships: UMLRelationship[]; // same as pattern.relationships
  afterCode: { typescript: string; python: string }; // same as pattern.code
  refactoringSteps: string[];    // "Extract interface", "Move method"
}
```
- **Canvas toggle**: Button switches between "Before" and "After" views with a crossfade animation. A diff view highlights added classes (green border), removed classes (red strikethrough), and changed relationships (yellow).

| Metric | Value |
|--------|-------|
| Impact | 9 |
| WOW | 9 |
| Effort | XL (36 patterns x before code/UML) |
| Exists | No for patterns (yes for SOLID) |

### 2D. "Which Pattern Should I Use?" Decision Tree

**LEARNING**
- **How it works**: Interactive flowchart. User answers yes/no questions: "Do you need to create objects?" -> "Do you need families of related objects?" -> "Abstract Factory." The tree narrows from 36 to 1 through 4-6 questions.
- **Implementation**: Render as a visual tree (SVG or HTML). Each node is a question. Clicking yes/no highlights the path and grays out eliminated patterns. Final node shows the recommended pattern with a link to load it.
- **Data**: `PATTERN_FINDER_ENTRIES` in `patterns.ts` already maps scenarios to patterns. This feature wraps them in a binary decision tree UI.

| Metric | Value |
|--------|-------|
| Impact | 9 |
| WOW | 9 |
| Effort | L |
| Exists | Partial (PATTERN_FINDER_ENTRIES has scenario-to-pattern mapping. No tree UI.) |

---

## 3. SOLID PRINCIPLES

### 3A. SOLID Violation Detection with Code Highlighting

**SIMULATION**
- **How it works**: Show a code snippet (30-50 lines) with multiple SOLID violations. User clicks on lines they think violate a principle. System highlights correct violations in green, missed ones in yellow, false positives in red. Score = correct identifications / total violations.
- **Extension of SOLIDQuiz.tsx**: Current quiz shows one snippet and asks "which principle is violated?" New feature shows ONE longer code block with 3-5 simultaneous violations across multiple principles. User must identify ALL of them.
- **Data per challenge**:
```typescript
interface SOLIDViolationChallenge {
  code: string;
  language: "typescript" | "python";
  violations: {
    lineStart: number;
    lineEnd: number;
    principle: SOLIDPrinciple;
    explanation: string;
    fixDescription: string;
  }[];
}
```

| Metric | Value |
|--------|-------|
| Impact | 10 |
| WOW | 10 |
| Effort | L |
| Exists | No (SOLIDQuiz asks "which ONE principle" per snippet. This asks "find ALL violations in one large snippet.") |

### 3B. Live Refactoring Challenge

**PRACTICE**
- **How it works**: User sees a "bad" class diagram (the beforeClasses from SOLID demos). Timer starts. User must refactor it on the canvas: split the monolithic class into focused classes, draw correct relationships. System auto-grades by comparing user's diagram to the afterClasses reference solution.
- **Auto-grading criteria**:
  1. Class count matches reference (+/- 1)
  2. No class has methods from 2+ responsibility domains
  3. Correct relationship types (dependency, not inheritance for service delegation)
  4. All original functionality is preserved (every method exists somewhere)
- **Integration**: Uses existing `InterviewPractice.tsx` timer + `PracticeAssessment.tsx` checklist + canvas editing from `LLDCanvas.tsx`.

| Metric | Value |
|--------|-------|
| Impact | 9 |
| WOW | 9 |
| Effort | L |
| Exists | Partial (timer exists, canvas editing exists, SOLID before/after data exists. Not connected as a graded refactoring challenge.) |

### 3C. SOLID Violation Detector AI

**AI**
- **How it works**: User pastes or writes code in the bidirectional sync panel. AI analyzes it and returns: "Lines 15-30 violate ISP: your `Animal` interface forces `fly()` on fish. Lines 42-50 violate DIP: `OrderService` directly instantiates `MySQLDatabase` instead of depending on a `Database` interface."
- **Extension of AIReviewPanel**: Current AI review detects design patterns and correctness issues. Add a specific "SOLID analysis" mode that checks each principle.
- **API payload**:
```typescript
POST /api/ai/solid-check
{
  code: string,
  language: "typescript" | "python"
}
// Response
{
  violations: {
    principle: SOLIDPrinciple,
    lineStart: number,
    lineEnd: number,
    explanation: string,
    suggestedFix: string,
    severity: "critical" | "warning" | "info"
  }[]
}
```

| Metric | Value |
|--------|-------|
| Impact | 9 |
| WOW | 10 |
| Effort | M |
| Exists | No |

---

## 4. UML DIAGRAMS

### 4A. Class Diagram Editor (Full CRUD)

**LEARNING + PRACTICE**
- **How it works**: Full interactive class diagram editor. User can: add classes (click canvas), add attributes/methods (property panel), draw relationships (drag from class to class), set relationship types (dropdown), set cardinality, set stereotypes (class/interface/abstract/enum).
- **Already exists**: `class-diagram-model.ts` has full immutable CRUD. `LLDCanvas.tsx` renders SVG. Property panel exists for editing. Drag-to-connect exists.
- **What's missing**: The individual pieces are wired together but there is no "blank canvas" mode where a user starts from scratch without a pattern template. Need a "New Diagram" entry point that creates an empty canvas.

| Metric | Value |
|--------|-------|
| Impact | 8 |
| WOW | 6 |
| Effort | S (wiring only) |
| Exists | Yes (all pieces exist, need "new diagram" entry point) |

### 4B. Sequence Diagram Builder

**LEARNING + PRACTICE**
- **Already exists**: `SequenceDiagramCanvas.tsx` renders SVG with participants, messages (sync/async/return/self), activation bars, and step-by-step playback.
- **What's missing**: A builder mode where user adds participants and draws messages. Currently sequence diagrams are read-only (rendered from pattern data). Need:
  1. "Add Participant" button
  2. Click-to-add-message between lifelines
  3. Message type selector (sync/async/return/self)
  4. Drag to reorder messages
  5. Export to Mermaid sequence diagram syntax

| Metric | Value |
|--------|-------|
| Impact | 8 |
| WOW | 8 |
| Effort | L |
| Exists | Partial (rendering exists, builder does not) |

### 4C. State Machine Builder

**LEARNING + PRACTICE**
- **Already exists**: `StateMachineCanvas.tsx` renders states, transitions, initial/final nodes. Simulation mode highlights the current state and animates transitions.
- **What's missing**: Same as sequence diagrams -- a builder mode where user creates states, draws transitions, labels triggers. Currently state machines are read-only from pattern data.

| Metric | Value |
|--------|-------|
| Impact | 8 |
| WOW | 8 |
| Effort | L |
| Exists | Partial (rendering + simulation exists, builder does not) |

### 4D. "Given This Code, Draw the UML" Challenge

**PRACTICE**
- **How it works**: Show a code snippet (TypeScript or Python, 50-80 lines). User must draw the corresponding class diagram on the canvas. System auto-grades by comparing to the reference diagram parsed from the code using the existing `code-to-diagram.ts` parser.
- **Auto-grading criteria**:
  1. All classes present (name match)
  2. Correct stereotypes (interface vs class)
  3. Correct relationships (inheritance, composition, etc.)
  4. Attributes and methods present (exact match not required -- names must match)
- **Data source**: Use the pattern code samples. Show `pattern.code.typescript` and hide `pattern.classes`. User reconstructs the UML.

| Metric | Value |
|--------|-------|
| Impact | 9 |
| WOW | 9 |
| Effort | L |
| Exists | Partial (code-to-diagram parser exists in `codegen/code-to-diagram.ts`. Canvas editor exists. Not connected as a challenge.) |

### 4E. "Given This UML, Write the Code" Challenge

**PRACTICE**
- **How it works**: Show a class diagram on the canvas. User writes code in the bidirectional sync panel. System auto-grades by parsing user's code back to a diagram and comparing to the reference.
- **Auto-grading criteria**:
  1. All classes from the diagram are implemented
  2. Correct inheritance/implementation (`extends`/`implements`)
  3. All methods have correct signatures
  4. Visibility modifiers match (public/private/protected)
- **Integration**: Uses `BidirectionalSyncPanel.tsx` for code editing + `code-to-diagram.ts` for parsing + diagram comparison.

| Metric | Value |
|--------|-------|
| Impact | 9 |
| WOW | 8 |
| Effort | L |
| Exists | Partial (bidirectional sync exists. Not framed as a challenge with grading.) |

---

## 5. MACHINE CODING PROBLEMS

### 5A. Timed Machine Coding Challenge

**PRACTICE**
- **How it works**: User picks a problem (e.g., Parking Lot). Selects timer (30/45/60 min). Canvas loads with an EMPTY diagram. Requirements panel shows on the right. Timer bar counts down (PracticeTimerBar.tsx). When time expires or user submits, the PracticeAssessment checklist appears where they self-score against the hints.
- **Already exists**: `InterviewPractice.tsx` has `PracticeTimerBar` (with color-coded urgency) and `PracticeAssessment` (with checklist scoring). Problems have `starterClasses` (initial partial diagram) and `hints` (assessment checklist).
- **What's missing**: Two modes needed:
  1. **Guided mode**: Start with `starterClasses` pre-loaded. Hints available from the start. No timer.
  2. **Interview mode**: Start with EMPTY canvas. Requirements only (no hints). Timer enforced. Hints revealed only during assessment.

| Metric | Value |
|--------|-------|
| Impact | 10 |
| WOW | 9 |
| Effort | M |
| Exists | Partial (timer + assessment exist, modal distinction between guided/interview mode does not) |

### 5B. Reference Solution Walkthrough

**LEARNING**
- **How it works**: For each of the 33 problems, show the complete reference solution with step-by-step canvas build. Step 1: "Start with the core entity (ParkingLot)." Step 2: "Add the Vehicle hierarchy." Step 3: "Add the Strategy pattern for spot assignment." Each step adds classes/relationships to the canvas with narration.
- **Data**: Problems already have `referenceSolution`, `designWalkthrough`, and `interviewScript` markdown fields (populated from `problem-solutions.ts`). Need to convert `designWalkthrough` into canvas steps.
- **Format**:
```typescript
interface ProblemWalkthroughStep {
  title: string;           // "Add the Payment Strategy"
  narration: string;       // "Different payment methods..."
  addClassIds: string[];   // classes to add at this step
  addRelIds: string[];     // relationships to add
  highlightPattern?: string; // "Strategy" -- show pattern badge
}
```

| Metric | Value |
|--------|-------|
| Impact | 10 |
| WOW | 10 |
| Effort | XL (33 problems x walkthrough steps) |
| Exists | Partial (text walkthroughs exist as markdown. Canvas integration does not.) |

### 5C. AI Interview Simulator

**AI**
- **How it works**: AI plays the interviewer. Conversation flow:
  1. AI: "Design a parking lot system. What are the main entities?"
  2. User types answer or draws on canvas.
  3. AI: "Good start. How would you handle different vehicle sizes? What pattern would you use?"
  4. User responds.
  5. AI evaluates: "Your use of Strategy for spot assignment is correct. But you're missing the Observer pattern for real-time availability updates."
- **Implementation**: Chat interface beside the canvas. Uses existing `/api/ai/explain` endpoint enhanced with conversational context.
- **Grading dimensions** (from "What Interviewers Check"):
  - Class design (correct entities? correct attributes?)
  - Interface usage (programming to interfaces?)
  - Extensibility (open for extension?)
  - Clean code (naming? SRP?)
  - Thread safety (concurrent access handled?)
  - Error handling (exceptions? edge cases?)

| Metric | Value |
|--------|-------|
| Impact | 10 |
| WOW | 10 |
| Effort | XL |
| Exists | No (AIReviewPanel does one-shot analysis, not conversational) |

### 5D. Problem-to-Pattern Mapping Quiz

**ASSESSMENT**
- **How it works**: Show a machine coding problem description (e.g., "Design Splitwise"). User must identify which design patterns apply. System grades against the `keyPatterns` field from problem data.
- **Data**: Each problem already has `keyPatterns: string[]` (e.g., parking lot = ["Strategy", "Factory Method", "Singleton", "Observer"]).
- **Quiz format**: Checkbox selection from 10 pattern options. Score = correct selections - incorrect selections. Explanation for each correct pattern: "Strategy is used for fee calculation because different vehicle types have different rates."

| Metric | Value |
|--------|-------|
| Impact | 8 |
| WOW | 7 |
| Effort | M |
| Exists | No |

### 5E. Complexity Analysis Panel

**ASSESSMENT**
- **How it works**: After user completes a machine coding solution, show time/space complexity analysis. "Your ParkingLot.findAvailableSpot() does linear scan: O(n). Reference solution uses a min-heap: O(log n)."
- **Data**: Problems already have `complexityAnalysis` field (markdown).
- **Enhancement**: Interactive table showing each key method, user's complexity, optimal complexity, and explanation.

| Metric | Value |
|--------|-------|
| Impact | 7 |
| WOW | 6 |
| Effort | M |
| Exists | Partial (data exists as markdown field, no interactive panel) |

---

## 6. WHAT INTERVIEWERS CHECK -- Dedicated Assessment Modules

### 6A. Class Design Rubric

**ASSESSMENT**
- **How it works**: AI evaluates user's diagram against 6 dimensions. Each gets a score 1-5 with specific feedback.
- **Rubric**:

| Dimension | What AI checks | Score criteria |
|-----------|---------------|----------------|
| Class Design | Entity completeness, correct stereotypes, meaningful names | 5 = all entities, correct types. 1 = missing core entities |
| Interfaces | Programming to interfaces, abstraction levels | 5 = key abstractions use interfaces. 1 = all concrete |
| Extensibility | OCP compliance, plugin points | 5 = new types addable without modification. 1 = hardcoded switches |
| Clean Code | SRP per class, naming conventions, cohesion | 5 = each class has one job. 1 = god classes |
| Thread Safety | Synchronization, immutability, concurrent data structures | 5 = identified + solved race conditions. 1 = no consideration |
| Error Handling | Exception hierarchy, error states, recovery | 5 = explicit error handling in design. 1 = no consideration |

- **Implementation**: Extension of AIReviewPanel. After user completes a problem, "Grade My Solution" button sends diagram + problem requirements to AI. Returns structured rubric scores.

| Metric | Value |
|--------|-------|
| Impact | 10 |
| WOW | 10 |
| Effort | L |
| Exists | No |

### 6B. Interview Script Simulator

**PRACTICE**
- **How it works**: Each problem has `interviewScript` field (markdown) containing a realistic Q&A dialogue. Display as a conversation where user first tries to answer, THEN reveals the model answer. Like a two-column layout: "Interviewer asks" (left), "Your space to answer" (right textarea), "Model answer" (revealed after submission).
- **Data**: Already populated for problems that have `interviewScript` in `problem-solutions.ts`.

| Metric | Value |
|--------|-------|
| Impact | 9 |
| WOW | 8 |
| Effort | M |
| Exists | Partial (data exists, no interactive UI) |

---

## 7. CROSS-CUTTING FEATURES

### 7A. Pattern Identification from Code (Assessment)

**ASSESSMENT**
- **How it works**: Show a code snippet (50-100 lines). User must identify which design pattern it implements. Multiple choice with 4 options. "Why wrong" explanations for each incorrect choice (same format as ScenarioChallenge).
- **Data**: Use the `pattern.code.typescript` for each of the 36 patterns. Randomly select one, strip comments that name the pattern, present as a quiz.
- **20 questions per session**, 5 from each category (creational, structural, behavioral, other).

| Metric | Value |
|--------|-------|
| Impact | 9 |
| WOW | 8 |
| Effort | M |
| Exists | No (ScenarioChallenge tests "scenario -> pattern", not "code -> pattern") |

### 7B. Socratic Discovery Mode (AI)

**AI**
- **How it works**: Instead of telling the user which pattern to use, AI asks leading questions. "Your notification system needs to alert multiple services when an event occurs. What if the number of subscribers changes at runtime? What pattern handles dynamic 1-to-many relationships?" User guesses. AI confirms or redirects.
- **Flow**:
  1. User describes a problem
  2. AI asks 3-4 guiding questions
  3. User guesses the pattern
  4. AI confirms and explains why, or gives another hint
- **Implementation**: Chat interface with a specific system prompt that enforces Socratic method (never gives the answer directly, always asks questions first).

| Metric | Value |
|--------|-------|
| Impact | 9 |
| WOW | 10 |
| Effort | L |
| Exists | No |

### 7C. AI Generates UML from Natural Language

**AI**
- **How it works**: User types "Design a library management system with books, members, and loans. Members can borrow up to 5 books." AI returns a class diagram with classes, attributes, methods, and relationships. Rendered on the canvas.
- **Implementation**: Send to `/api/ai/generate-diagram`. Response is a `ClassDiagram` object (same format as existing types). Loaded onto canvas.
- **Enhancement**: User can edit the generated diagram and iterate: "Add a fine calculation system" -> AI adds FineCalculator class + relationships.

| Metric | Value |
|--------|-------|
| Impact | 9 |
| WOW | 10 |
| Effort | L |
| Exists | No (AIReviewPanel analyzes existing diagrams, does not generate from scratch) |

### 7D. Daily Pattern Challenge (Enhancement)

**REVIEW**
- **Already exists**: `DailyChallenge.tsx` picks a deterministic daily pattern and gives 3 progressive hints for identification.
- **Enhancement needed**: After correct identification, show a 30-second "speed round": 5 rapid-fire questions about that pattern (category, key class, when to use, confused with, anti-pattern). Streak tracking across days.

| Metric | Value |
|--------|-------|
| Impact | 6 |
| WOW | 7 |
| Effort | M |
| Exists | Partial (daily challenge exists, no speed round) |

### 7E. Mermaid Export/Import

**PRACTICE**
- **Already exists**: `codegen/diagram-to-mermaid.ts` exports class diagrams to Mermaid syntax. `MermaidEditor.tsx` panel exists.
- **Enhancement**: Add import from Mermaid. User pastes Mermaid class diagram syntax, system parses it into UMLClass[] + UMLRelationship[] and renders on canvas. Uses existing `mermaid-to-diagram.ts` parser.

| Metric | Value |
|--------|-------|
| Impact | 6 |
| WOW | 5 |
| Effort | S |
| Exists | Yes (both directions implemented, needs UI wiring for import) |

---

## PRIORITIZED IMPLEMENTATION ROADMAP

### TIER 1: CRITICAL (Fix First) -- These define the product

| # | Feature | Impact | WOW | Effort | Why Critical |
|---|---------|--------|-----|--------|--------------|
| 1 | 2A. Progressive Diagram Builder | 10 | 10 | L | THE differentiator. Watching a pattern build step-by-step on the canvas is the "aha moment" that no competitor offers. WalkthroughPlayer + canvas are both built -- connecting them is the highest-ROI task. |
| 2 | 5A. Timed Machine Coding (guided + interview modes) | 10 | 9 | M | The #1 user job: "practice machine coding under timed conditions." Timer and assessment already exist. |
| 3 | 3A. SOLID Violation Detection (multi-violation code) | 10 | 10 | L | Extends existing SOLIDQuiz from "identify one" to "find all" -- transforms a basic quiz into a killer feature. |
| 4 | 6A. Class Design Rubric (AI grading) | 10 | 10 | L | Users NEED to know if their solution is good. This is the feedback loop that drives retention. |
| 5 | 4D. "Code -> Draw UML" Challenge | 9 | 9 | L | Uses existing code-to-diagram parser as answer key. The inverse of what bidirectional sync already does. |

### TIER 2: HIGH (Fix Soon) -- These drive engagement

| # | Feature | Impact | WOW | Effort | ROI Reasoning |
|---|---------|--------|-----|--------|---------------|
| 6 | 2B. Behavioral Pattern Runtime Sim (Observer, Command, State, CoR, Mediator) | 10 | 10 | XL | High effort but highest WOW factor. PatternBehavioralSimulator proves the approach works for resilience -- extend to behavioral. |
| 7 | 5C. AI Interview Simulator | 10 | 10 | XL | The ultimate practice tool. Conversational AI grilling you on your design decisions. |
| 8 | 7B. Socratic Discovery Mode | 9 | 10 | L | Relatively low effort (system prompt engineering + chat UI). Massive pedagogical impact. |
| 9 | 7C. AI Generate UML from Natural Language | 9 | 10 | L | Instant canvas population from description. Lowers barrier to entry dramatically. |
| 10 | 1C. Inheritance vs Composition class explosion visualization | 9 | 10 | M | The "2^n subclasses" counter is an unforgettable visual. Data already exists in oop-demos.ts. |
| 11 | 2D. Pattern Decision Tree | 9 | 9 | L | PATTERN_FINDER_ENTRIES data exists. Just needs tree UI. |
| 12 | 5B. Reference Solution Walkthrough (canvas) | 10 | 10 | XL | Dependent on #1 (Progressive Diagram Builder). Once that infra exists, this follows. |
| 13 | 4E. "UML -> Write Code" Challenge | 9 | 8 | L | Inverse of 4D. Bidirectional sync panel already does the grading. |
| 14 | 3B. Live Refactoring Challenge | 9 | 9 | L | SOLID before/after data exists. Timer exists. Canvas editing exists. Connect them. |
| 15 | 1D. Interface vs Abstract Class teaching module | 8 | 7 | M | Fundamental concept with no current dedicated module. |

### TIER 3: MEDIUM (Nice to Have) -- These add polish

| # | Feature | Impact | WOW | Effort | Enhancement |
|---|---------|--------|-----|--------|-------------|
| 16 | 7A. Pattern ID from Code quiz | 9 | 8 | M | Uses existing code samples, strips pattern names, new quiz component. |
| 17 | 1E. Composition/Aggregation/Association teaching | 8 | 7 | M | Relationship types exist in rendering. Needs teaching flow. |
| 18 | 5D. Problem-to-Pattern Mapping quiz | 8 | 7 | M | keyPatterns data already on every problem. |
| 19 | 4B. Sequence Diagram Builder | 8 | 8 | L | Rendering exists, needs builder interaction. |
| 20 | 4C. State Machine Builder | 8 | 8 | L | Same as above. |
| 21 | 6B. Interview Script Simulator | 9 | 8 | M | Data exists in problem-solutions.ts. |
| 22 | 1B. Abstraction parallel sequence diagrams | 7 | 8 | L | Side-by-side "with vs without" abstraction. |
| 23 | 2C. Before/After for all 36 patterns | 9 | 9 | XL | Massive content creation effort but high payoff. |
| 24 | 5E. Complexity Analysis Panel | 7 | 6 | M | Data exists as markdown. |
| 25 | 7D. Daily Challenge speed round | 6 | 7 | M | Extends existing daily challenge. |
| 26 | 1A. Encapsulation runtime simulation | 6 | 7 | M | Validation gate animation. |
| 27 | 7E. Mermaid Import UI | 6 | 5 | S | Both parsers exist, need import button. |

### TIER 4: FUTURE (Low) -- Edge optimization

| # | Feature | Impact | WOW | Effort |
|---|---------|--------|-----|--------|
| 28 | OOP assessment MCQs | 5 | 4 | S |
| 29 | OOP flashcards in existing deck | 4 | 3 | S |
| 30 | Encapsulation practice challenges | 6 | 5 | M |
| 31 | AI checking OOP violations specifically | 7 | 8 | M |
| 32 | 1E "draw the relationship" interactive quiz | 8 | 8 | L |

---

## KEY FILES REFERENCED

- `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/lld/patterns.ts` -- 36 patterns with full UML + code data
- `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/lld/solid-demos.ts` -- 5 SOLID before/after demos
- `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/lld/oop-demos.ts` -- 4 OOP before/after demos
- `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/lld/problems.ts` -- 33 machine coding problems
- `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/lld/types.ts` -- all type definitions
- `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/lld/class-diagram-model.ts` -- immutable CRUD
- `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/lld/bidirectional-sync.ts` -- code <-> diagram sync
- `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/lld/codegen/code-to-diagram.ts` -- parser
- `/Users/anshullkgarg/Desktop/system_design/architex/src/components/modules/lld/PatternBehavioralSimulator.tsx` -- resilience runtime sim
- `/Users/anshullkgarg/Desktop/system_design/architex/src/components/modules/lld/panels/Flashcards.tsx` -- swipeable cards
- `/Users/anshullkgarg/Desktop/system_design/architex/src/components/modules/lld/panels/SOLIDQuiz.tsx` -- violation quiz
- `/Users/anshullkgarg/Desktop/system_design/architex/src/components/modules/lld/panels/ScenarioChallenge.tsx` -- scenario MCQ
- `/Users/anshullkgarg/Desktop/system_design/architex/src/components/modules/lld/panels/InterviewPractice.tsx` -- timed practice
- `/Users/anshullkgarg/Desktop/system_design/architex/src/components/modules/lld/panels/WalkthroughPlayer.tsx` -- step-by-step player
- `/Users/anshullkgarg/Desktop/system_design/architex/src/components/modules/lld/panels/BidirectionalSyncPanel.tsx` -- code/diagram sync UI
- `/Users/anshullkgarg/Desktop/system_design/architex/src/components/modules/lld/panels/DailyChallenge.tsx` -- daily challenge
- `/Users/anshullkgarg/Desktop/system_design/architex/src/components/modules/lld/canvas/AIReviewPanel.tsx` -- AI analysis
- `/Users/anshullkgarg/Desktop/system_design/architex/src/components/modules/lld/sidebar/LearningPathMap.tsx` -- mastery grid

---

## ONE BIG WIN

If you build ONE thing from this entire spec, build **Feature #1: Progressive Diagram Builder** -- connecting `WalkthroughPlayer.tsx` to `LLDCanvas.tsx` so that each walkthrough step adds classes/relationships to the canvas with animation. Both components exist and work independently. The connection is ~200-300 lines of integration code. This single feature transforms every pattern and every problem from "static diagram you stare at" to "animated story you watch unfold." It is the foundation for Features #5B, #2C, and #1C. It is also the single hardest thing for any competitor to replicate because it requires both the canvas infrastructure AND the per-pattern step data, both of which Architex already has.