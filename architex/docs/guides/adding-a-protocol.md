# How to Add a New Protocol Simulation

This guide covers adding a new networking protocol simulation to the Networking module. Architex currently supports nine protocols: TCP, TLS 1.3, DNS, HTTP comparison, WebSocket, CORS, CDN flow, API comparison, and serialization comparison. Each protocol engine produces an event timeline that the `SequenceDiagram` component renders as an interactive step-by-step visualization.

## Prerequisites

- Familiarity with the `SequenceMessage` type (the universal UI type all protocols convert into).
- An understanding of how `NetworkingModule.tsx` wires engines to the visualization layer.
- Read the [networking engine README](../../src/lib/networking/README.md) for architecture context.

## Overview of touched files

| Step | File | Purpose |
|------|------|---------|
| 1 | `src/lib/networking/your-protocol.ts` | Engine file: simulation logic + event types |
| 2 | `src/lib/networking/index.ts` | Barrel export |
| 3 | `src/components/modules/NetworkingModule.tsx` | Protocol type union |
| 4 | `src/components/modules/NetworkingModule.tsx` | PROTOCOLS array entry |
| 5 | `src/components/modules/NetworkingModule.tsx` | Switch cases: messages, columns, canvas |
| 6 | `src/lib/networking/__tests__/your-protocol.test.ts` | Tests |

---

## Step 1: Create the engine file

Every protocol engine lives in `src/lib/networking/` and produces an ordered array of event objects. The events drive the step-by-step playback in the UI. Your engine can be either class-based (stateful, like `TCPConnection`) or function-based (pure, like `simulateCORS()`).

### Core event shape

All protocol events must include these four fields so the adapter layer can convert them into `SequenceMessage` objects for the UI:

```ts
{
  tick: number;        // Monotonically increasing step counter
  from: string;        // Sender endpoint (e.g., "client", "server")
  to: string;          // Receiver endpoint
  description: string; // Human-readable explanation of this step
}
```

Beyond these shared fields, add whatever protocol-specific data your visualization needs (flags, headers, payloads, state annotations, etc.).

### Template: class-based engine

Model after `src/lib/networking/tcp-state-machine.ts`. Class-based engines are best when the protocol has distinct phases (connect, exchange, close) and maintains state between calls.

```ts
// src/lib/networking/your-protocol.ts

// ─────────────────────────────────────────────────────────────
// Architex — Your Protocol Simulation
// ─────────────────────────────────────────────────────────────
//
// Describe what this protocol does and what phases the
// simulation covers. Reference the relevant RFC if applicable.
//
// Every method returns an ordered list of YourEvent objects
// suitable for step-by-step playback visualization.
// ─────────────────────────────────────────────────────────────

/**
 * All possible states in the protocol state machine.
 *
 * Describe the lifecycle:
 * - IDLE: No session exists.
 * - CONNECTING: Handshake in progress.
 * - ESTABLISHED: Active session.
 * - CLOSING: Teardown in progress.
 */
export type YourProtocolState =
  | 'IDLE'
  | 'CONNECTING'
  | 'ESTABLISHED'
  | 'CLOSING';

/**
 * A single event in the simulation timeline.
 *
 * Each event captures who sent the message, the message contents,
 * a human-readable description, and the resulting state of both
 * endpoints after the event is processed.
 */
export interface YourEvent {
  /** Simulation tick (monotonically increasing). */
  tick: number;
  /** Endpoint that sent this message. */
  from: 'client' | 'server';
  /** Endpoint that receives this message. */
  to: 'client' | 'server';
  /** Human-readable explanation of this step. */
  description: string;
  /** Client state after this event. */
  clientState: YourProtocolState;
  /** Server state after this event. */
  serverState: YourProtocolState;
  // Add protocol-specific fields here (e.g., headers, payload, flags)
}

/**
 * Simulates a full Your Protocol session.
 *
 * Supports:
 * 1. **Handshake** -- `connect()`
 * 2. **Data exchange** -- `send()`
 * 3. **Teardown** -- `close()`
 *
 * @example
 * ```ts
 * const session = new YourProtocolSimulation();
 * session.connect();
 * session.send('client', 'Hello!');
 * session.close('client');
 *
 * for (const event of session.getAllEvents()) {
 *   console.log(`[${event.tick}] ${event.from} -> ${event.to}: ${event.description}`);
 * }
 * ```
 */
export class YourProtocolSimulation {
  clientState: YourProtocolState;
  serverState: YourProtocolState;
  events: YourEvent[];
  private tick: number;

  constructor() {
    this.clientState = 'IDLE';
    this.serverState = 'IDLE';
    this.events = [];
    this.tick = 0;
  }

  /** Performs the protocol handshake. */
  connect(): YourEvent[] {
    // ... handshake logic producing events
    return [];
  }

  /** Sends data from one endpoint to the other. */
  send(from: 'client' | 'server', data: string): YourEvent[] {
    // ... data exchange logic
    return [];
  }

  /** Performs graceful session teardown. */
  close(initiator: 'client' | 'server'): YourEvent[] {
    // ... teardown logic
    return [];
  }

  /** Returns a copy of the complete event timeline. */
  getAllEvents(): YourEvent[] {
    return [...this.events];
  }

  /** Resets the simulation to its initial state. */
  reset(): void {
    this.clientState = 'IDLE';
    this.serverState = 'IDLE';
    this.events = [];
    this.tick = 0;
  }

  /** Records an event, appends it to the timeline, and returns it. */
  private recordEvent(
    from: 'client' | 'server',
    to: 'client' | 'server',
    descriptionLines: string[],
  ): YourEvent {
    this.tick++;
    const event: YourEvent = {
      tick: this.tick,
      from,
      to,
      description: descriptionLines.join(' '),
      clientState: this.clientState,
      serverState: this.serverState,
    };
    this.events.push(event);
    return event;
  }
}
```

### Template: function-based engine

Model after `src/lib/networking/cors-simulator.ts` or `src/lib/networking/cdn-flow.ts`. Function-based engines are best for stateless comparisons or simulations that produce a complete result in one call.

```ts
// src/lib/networking/your-protocol.ts

export interface YourConfig {
  // Configuration for the simulation
}

export interface YourStep {
  tick: number;
  from: string;
  to: string;
  description: string;
  // Protocol-specific fields
}

/**
 * Simulates Your Protocol flow.
 *
 * @param config - Simulation configuration.
 * @returns Ordered array of simulation steps.
 *
 * @example
 * ```ts
 * const steps = simulateYourProtocol({ /* config *\/ });
 * steps.forEach(s => console.log(`${s.from} -> ${s.to}: ${s.description}`));
 * ```
 */
export function simulateYourProtocol(config: YourConfig): YourStep[] {
  const steps: YourStep[] = [];
  let tick = 0;

  // ... simulation logic that pushes to steps[]

  return steps;
}
```

### Converter function

Export a converter that transforms your protocol events into `SequenceMessage[]`. This keeps `NetworkingModule.tsx` lean:

```ts
import type { SequenceMessage } from '@/components/modules/NetworkingModule';

export function yourProtocolToSequenceMessages(events: YourEvent[]): SequenceMessage[] {
  return events.map((e) => ({
    from: e.from === 'client' ? 'Client' : 'Server',
    to: e.to === 'client' ? 'Client' : 'Server',
    label: buildLabel(e),       // Short arrow label
    description: e.description, // Detailed step explanation
    fromState: e.clientState,   // Optional state annotation
    toState: e.serverState,     // Optional state annotation
  }));
}
```

### JSDoc requirements

Every engine file must have:

- A file-level block comment explaining the protocol and what phases are simulated.
- JSDoc on exported types with field-level documentation.
- JSDoc on the main class/function with an `@example` showing basic usage.
- Step descriptions that explain **why** each step happens, not just what it does.

---

## Step 2: Export from the barrel

Open `src/lib/networking/index.ts` and add your exports. Follow the section pattern used by existing protocols:

```ts
// ── Your Protocol ────────────────────────────────────────────
export { YourProtocolSimulation } from './your-protocol';
export type {
  YourProtocolState,
  YourEvent,
} from './your-protocol';
```

If you have a converter function or constants, export those too:

```ts
export {
  YourProtocolSimulation,
  yourProtocolToSequenceMessages,
  YOUR_PROTOCOL_SCENARIOS,
} from './your-protocol';
```

---

## Step 3: Add to the Protocol union type

Open `src/components/modules/NetworkingModule.tsx` and add your protocol to the `Protocol` union type (around line 58):

```ts
type Protocol =
  | "tcp-handshake"
  | "tls-1.3"
  | "dns-resolution"
  | "http-comparison"
  | "websocket"
  | "cors"
  | "cdn-flow"
  | "api-comparison"
  | "serialization"
  | "your-protocol";   // <-- add here
```

After adding this member, **TypeScript will immediately show compile errors** in every `switch` statement that uses `active` (the current protocol). This is because of the `assertNever()` exhaustive check pattern added in NET-146. These errors are your guide -- they tell you exactly which switch cases need a new branch.

---

## Step 4: Add to the PROTOCOLS array

Still in `NetworkingModule.tsx`, add an entry to the `PROTOCOLS` array (around line 79). This controls what appears in the protocol selector sidebar:

```ts
const PROTOCOLS: ProtocolDef[] = [
  // ... existing entries ...
  {
    id: "your-protocol",
    name: "Your Protocol",
    description: "One-line description of what this simulation demonstrates.",
  },
];
```

The `id` must match the string literal you added to the `Protocol` union in Step 3.

---

## Step 5: Add switch cases

You need to add your protocol to **three** switch statements in `NetworkingModule.tsx`. The `assertNever()` call at the end of each switch will cause a compile error if you miss one, so TypeScript catches omissions at build time.

### 5a. Messages switch

The `messages` useMemo (around line 2475) transforms engine events into `SequenceMessage[]` for the step list:

```ts
const messages = useMemo((): SequenceMessage[] => {
  switch (active) {
    // ... existing cases ...
    case "your-protocol": {
      const events = initYourProtocol(); // or however you get events
      return yourProtocolToSequenceMessages(events);
    }
  }
  return assertNever(active);
}, [active, /* ... your dependencies */]);
```

### 5b. Columns switch

The `columns` useMemo (around line 2618) defines the sequence diagram column headers:

```ts
const columns = useMemo((): string[] => {
  switch (active) {
    // ... existing cases ...
    case "your-protocol":
      return ["Client", "Server"]; // adjust to your protocol's endpoints
  }
  return assertNever(active);
}, [active]);
```

### 5c. Canvas switch

The `canvas` useMemo (around line 2725) renders the main visualization area:

```ts
const canvas = useMemo(() => {
  switch (active) {
    // ... existing cases ...
    case "your-protocol":
      return (
        <div className="h-full w-full bg-background">
          <YourProtocolVisualization stepIndex={stepIndex} />
        </div>
      );
  }
  // default case with assertNever handles exhaustive check
}, [active, /* ... your dependencies */]);
```

For simple protocols, you can reuse the generic `SequenceDiagram` component (like TCP does). For protocols that need custom rendering, create a dedicated visualization component.

---

## Step 6: Write tests

Create a test file at `src/lib/networking/__tests__/your-protocol.test.ts`. Follow the existing pattern in `networking.test.ts`:

### Test template

```ts
import { describe, it, expect } from 'vitest';
import { YourProtocolSimulation } from '../your-protocol';

describe('YourProtocolSimulation', () => {
  // ── Happy path ──────────────────────────────────────────

  it('produces events for a complete session lifecycle', () => {
    const sim = new YourProtocolSimulation();
    sim.connect();
    sim.send('client', 'Hello');
    sim.close('client');

    const events = sim.getAllEvents();
    expect(events.length).toBeGreaterThan(0);
  });

  it('starts in IDLE state', () => {
    const sim = new YourProtocolSimulation();
    expect(sim.clientState).toBe('IDLE');
    expect(sim.serverState).toBe('IDLE');
  });

  it('transitions to ESTABLISHED after connect', () => {
    const sim = new YourProtocolSimulation();
    sim.connect();
    expect(sim.clientState).toBe('ESTABLISHED');
    expect(sim.serverState).toBe('ESTABLISHED');
  });

  it('all events have required fields (tick, from, to, description)', () => {
    const sim = new YourProtocolSimulation();
    sim.connect();
    sim.send('client', 'test');
    sim.close('client');

    for (const event of sim.getAllEvents()) {
      expect(event.tick).toBeGreaterThan(0);
      expect(['client', 'server']).toContain(event.from);
      expect(['client', 'server']).toContain(event.to);
      expect(event.description).toBeTruthy();
    }
  });

  it('ticks are monotonically increasing', () => {
    const sim = new YourProtocolSimulation();
    sim.connect();
    sim.send('client', 'test');

    const events = sim.getAllEvents();
    for (let i = 1; i < events.length; i++) {
      expect(events[i].tick).toBeGreaterThan(events[i - 1].tick);
    }
  });

  // ── Error paths ─────────────────────────────────────────

  it('throws if sending data before connect', () => {
    const sim = new YourProtocolSimulation();
    expect(() => sim.send('client', 'Hello')).toThrow();
  });

  it('throws if connecting when already connected', () => {
    const sim = new YourProtocolSimulation();
    sim.connect();
    expect(() => sim.connect()).toThrow();
  });

  // ── Reset ───────────────────────────────────────────────

  it('reset returns to initial state', () => {
    const sim = new YourProtocolSimulation();
    sim.connect();
    sim.reset();
    expect(sim.clientState).toBe('IDLE');
    expect(sim.serverState).toBe('IDLE');
    expect(sim.getAllEvents()).toHaveLength(0);
  });

  // ── Converter ───────────────────────────────────────────

  it('converter produces valid SequenceMessage objects', () => {
    const sim = new YourProtocolSimulation();
    sim.connect();

    // Import your converter
    // const messages = yourProtocolToSequenceMessages(sim.getAllEvents());
    // for (const msg of messages) {
    //   expect(msg.from).toBeTruthy();
    //   expect(msg.to).toBeTruthy();
    //   expect(msg.label).toBeTruthy();
    //   expect(msg.description).toBeTruthy();
    // }
  });
});
```

Run tests with:

```bash
pnpm test -- --run src/lib/networking/__tests__/your-protocol.test.ts
```

Or the full networking test suite:

```bash
pnpm test -- --run src/lib/networking/__tests__/
```

---

## Step 7: Verify

### Compilation and tests

```bash
pnpm typecheck    # Must pass -- assertNever catches missing switch cases
pnpm test:run     # Must pass including your new tests
```

### Manual verification

1. The protocol appears in the Networking module sidebar under its name.
2. Selecting it loads the correct visualization.
3. Clicking Play/Step advances through events with correct sequence arrows.
4. Step descriptions in the properties panel are clear and educational.
5. State annotations (if applicable) update correctly at each step.

### Checklist before submitting

- [ ] Engine file has a file-level block comment describing the protocol
- [ ] Engine file has JSDoc on exported class/function with `@example`
- [ ] All event types have `tick`, `from`, `to`, `description` fields
- [ ] Barrel export updated (`src/lib/networking/index.ts`)
- [ ] Protocol type union updated in `NetworkingModule.tsx` (`assertNever` catches missing switches)
- [ ] PROTOCOLS array entry added with `id`, `name`, `description`
- [ ] `messages` switch case added (converts events to `SequenceMessage[]`)
- [ ] `columns` switch case added (defines sequence diagram column headers)
- [ ] `canvas` switch case added (renders the visualization)
- [ ] Tests pass with happy path, error paths, and event field validation
- [ ] Step descriptions explain **why** each step happens, not just what it does
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test:run` passes

---

## Protocol-specific notes

### Protocols with scenarios

Some protocols support multiple scenarios (e.g., DNS has different resolution paths, CDN has cache-hit vs cache-miss). If your protocol has scenarios:

1. Define a `YourScenarioDef` type and a `YOUR_PROTOCOL_SCENARIOS` array in the engine file.
2. Export both from the barrel.
3. Add a scenario selector in the sidebar (follow the DNS or CDN pattern in `NetworkingModule.tsx`).

### Protocols with custom visualizations

If the standard `SequenceDiagram` component is insufficient (e.g., HTTP comparison needs a waterfall chart), create a dedicated component at `src/components/modules/networking/YourProtocolVisualization.tsx` and lazy-load it in `NetworkingModule.tsx`:

```ts
const YourProtocolVisualization = lazy(
  () => import("@/components/modules/networking/YourProtocolVisualization")
);
```

### Protocols with configuration

If your protocol needs user-configurable parameters (e.g., CORS has origin/method settings), add state variables and a configuration UI in the sidebar section of `NetworkingModule.tsx`. Follow the CORS config pattern.

---

## Content quality

Protocol descriptions and step annotations are user-facing -- they should be clear, concise, and educational. Step descriptions should explain **why** each message is sent, not just describe what it contains.

Good: "Server responds with SYN-ACK to acknowledge the client's connection request and propose its own initial sequence number."

Bad: "Server sends SYN-ACK segment."

Reference the relevant RFC when documenting state transitions or protocol behavior.
