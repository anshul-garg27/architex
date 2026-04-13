// -----------------------------------------------------------------
// Architex -- Vector Clock Data Structure  (DST-032)
// Space-time diagram visualization for causal ordering in
// distributed systems. Each node maintains a vector of logical
// timestamps; messages carry the sender's vector for merging.
// -----------------------------------------------------------------

import { createStepRecorder } from './types';
import type { DSStep, DSResult, DSMutation } from './types';

// ── Types ──────────────────────────────────────────────────

/** A vector clock: maps nodeId -> logical timestamp. */
export type VectorClock = Record<string, number>;

/** A message in flight between two nodes. */
export interface VCMessage {
  id: string;
  from: string;
  to: string;
  clock: VectorClock;
  sendTime: number;   // logical send step (for diagram)
  recvTime: number;   // logical recv step (for diagram)
}

/** Timeline event for a single node in the space-time diagram. */
export interface VCEvent {
  id: string;
  nodeId: string;
  type: 'local' | 'send' | 'receive';
  clock: VectorClock;
  time: number;        // logical time position on the horizontal axis
  relatedMessageId?: string;
}

/** Full vector clock system state. */
export interface VectorClockState {
  nodeIds: string[];
  clocks: Record<string, VectorClock>;
  events: VCEvent[];
  messages: VCMessage[];
  time: number;        // global logical step counter for diagram placement
}

let _eventId = 0;
let _msgId = 0;

function makeEventId(): string {
  return `vc-evt-${_eventId++}`;
}

function makeMsgId(): string {
  return `vc-msg-${_msgId++}`;
}

function vcId(nodeId: string): string {
  return `vc-node-${nodeId}`;
}

function cloneClock(clock: VectorClock): VectorClock {
  return { ...clock };
}

function cloneState(state: VectorClockState): VectorClockState {
  const clocks: Record<string, VectorClock> = {};
  for (const nodeId of state.nodeIds) {
    clocks[nodeId] = cloneClock(state.clocks[nodeId]);
  }
  return {
    nodeIds: [...state.nodeIds],
    clocks,
    events: state.events.map((e) => ({ ...e, clock: cloneClock(e.clock) })),
    messages: state.messages.map((m) => ({ ...m, clock: cloneClock(m.clock) })),
    time: state.time,
  };
}

function formatClock(clock: VectorClock, nodeIds: string[]): string {
  return `[${nodeIds.map((n) => clock[n] ?? 0).join(', ')}]`;
}

// ── Create ─────────────────────────────────────────────────

/** Initialize a vector clock system with the given node IDs, all clocks at zero. */
export function createVectorClockSystem(nodeIds: string[]): VectorClockState {
  _eventId = 0;
  _msgId = 0;
  const clocks: Record<string, VectorClock> = {};
  for (const id of nodeIds) {
    const clock: VectorClock = {};
    for (const n of nodeIds) {
      clock[n] = 0;
    }
    clocks[id] = clock;
  }
  return {
    nodeIds: [...nodeIds],
    clocks,
    events: [],
    messages: [],
    time: 0,
  };
}

// ── Local Event ────────────────────────────────────────────

/** A node performs a local event: increment its own clock entry. */
export function vectorClockLocalEvent(
  state: VectorClockState,
  nodeId: string,
): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const s = cloneState(state);

  if (!s.nodeIds.includes(nodeId)) {
    steps.push(step(`Node '${nodeId}' not found in system`, []));
    return { steps, snapshot: s };
  }

  const prev = s.clocks[nodeId][nodeId];
  s.clocks[nodeId][nodeId] = prev + 1;
  s.time++;

  const event: VCEvent = {
    id: makeEventId(),
    nodeId,
    type: 'local',
    clock: cloneClock(s.clocks[nodeId]),
    time: s.time,
  };
  s.events.push(event);

  steps.push(
    step(`Local event on '${nodeId}': increment own clock ${prev} -> ${prev + 1}`, [
      { targetId: vcId(nodeId), property: 'clock', from: prev, to: prev + 1 },
    ]),
  );

  steps.push(
    step(
      `Node '${nodeId}' clock: ${formatClock(s.clocks[nodeId], s.nodeIds)} (nodes: ${s.nodeIds.join(', ')})`,
      [{ targetId: event.id, property: 'highlight', from: 'default', to: 'done' }],
    ),
  );

  return { steps, snapshot: s };
}

// ── Send ───────────────────────────────────────────────────

/** Sender increments own clock, then sends a message carrying its clock to the receiver. */
export function vectorClockSend(
  state: VectorClockState,
  fromId: string,
  toId: string,
): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const s = cloneState(state);

  if (!s.nodeIds.includes(fromId) || !s.nodeIds.includes(toId)) {
    steps.push(step(`Invalid node(s): '${fromId}' or '${toId}'`, []));
    return { steps, snapshot: s };
  }

  // Increment sender clock
  const prev = s.clocks[fromId][fromId];
  s.clocks[fromId][fromId] = prev + 1;
  s.time++;

  steps.push(
    step(`Send: '${fromId}' increments own clock ${prev} -> ${prev + 1}`, [
      { targetId: vcId(fromId), property: 'clock', from: prev, to: prev + 1 },
    ]),
  );

  // Record send event
  const sendEvent: VCEvent = {
    id: makeEventId(),
    nodeId: fromId,
    type: 'send',
    clock: cloneClock(s.clocks[fromId]),
    time: s.time,
  };

  // Create the message (it will be received later)
  const msgId = makeMsgId();
  const msg: VCMessage = {
    id: msgId,
    from: fromId,
    to: toId,
    clock: cloneClock(s.clocks[fromId]),
    sendTime: s.time,
    recvTime: -1,  // set on receive
  };

  sendEvent.relatedMessageId = msgId;
  s.events.push(sendEvent);
  s.messages.push(msg);

  steps.push(
    step(
      `Message ${msgId} sent: '${fromId}' -> '${toId}' carrying clock ${formatClock(msg.clock, s.nodeIds)}`,
      [
        { targetId: vcId(fromId), property: 'highlight', from: 'default', to: 'sending' },
        { targetId: vcId(toId), property: 'highlight', from: 'default', to: 'receiving' },
      ],
    ),
  );

  steps.push(
    step(
      `Space-time diagram: diagonal arrow from '${fromId}' (t=${s.time}) to '${toId}' (pending receive)`,
      [{ targetId: msgId, property: 'highlight', from: 'default', to: 'in-flight' }],
    ),
  );

  return { steps, snapshot: s };
}

// ── Receive ────────────────────────────────────────────────

/**
 * Receiver merges incoming clock with its own (element-wise max),
 * then increments its own entry.
 */
export function vectorClockReceive(
  state: VectorClockState,
  toId: string,
  incomingClock: VectorClock,
): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const s = cloneState(state);

  if (!s.nodeIds.includes(toId)) {
    steps.push(step(`Node '${toId}' not found in system`, []));
    return { steps, snapshot: s };
  }

  steps.push(
    step(
      `Receive at '${toId}': merge with incoming ${formatClock(incomingClock, s.nodeIds)}`,
      [{ targetId: vcId(toId), property: 'highlight', from: 'default', to: 'receiving' }],
    ),
  );

  // Element-wise max
  const ownClock = s.clocks[toId];
  for (const nodeId of s.nodeIds) {
    const ownVal = ownClock[nodeId];
    const incVal = incomingClock[nodeId] ?? 0;
    const maxVal = Math.max(ownVal, incVal);
    if (maxVal !== ownVal) {
      steps.push(
        step(
          `Merge '${nodeId}' entry: max(${ownVal}, ${incVal}) = ${maxVal}`,
          [{ targetId: vcId(toId), property: nodeId, from: ownVal, to: maxVal }],
        ),
      );
    }
    ownClock[nodeId] = maxVal;
  }

  // Increment own entry
  const prevOwn = ownClock[toId];
  ownClock[toId] = prevOwn + 1;
  s.time++;

  steps.push(
    step(`Increment own entry: '${toId}' ${prevOwn} -> ${prevOwn + 1}`, [
      { targetId: vcId(toId), property: 'clock', from: prevOwn, to: prevOwn + 1 },
    ]),
  );

  // Mark the latest pending message to this node as received
  const pendingMsg = s.messages.find((m) => m.to === toId && m.recvTime === -1);
  if (pendingMsg) {
    pendingMsg.recvTime = s.time;
  }

  // Record receive event
  const recvEvent: VCEvent = {
    id: makeEventId(),
    nodeId: toId,
    type: 'receive',
    clock: cloneClock(ownClock),
    time: s.time,
    relatedMessageId: pendingMsg?.id,
  };
  s.events.push(recvEvent);

  steps.push(
    step(
      `Node '${toId}' updated clock: ${formatClock(ownClock, s.nodeIds)}`,
      [{ targetId: recvEvent.id, property: 'highlight', from: 'default', to: 'done' }],
    ),
  );

  return { steps, snapshot: s };
}

// ── Causal Ordering ────────────────────────────────────────

/**
 * Returns true if clock `a` happens-before clock `b`:
 * every entry in a <= corresponding entry in b, and at least one is strictly <.
 */
export function vectorClockHappensBefore(a: VectorClock, b: VectorClock): boolean {
  const allKeys = new Set([...Object.keys(a), ...Object.keys(b)]);
  let strictlyLess = false;

  for (const key of allKeys) {
    const va = a[key] ?? 0;
    const vb = b[key] ?? 0;
    if (va > vb) return false;
    if (va < vb) strictlyLess = true;
  }

  return strictlyLess;
}

/**
 * Returns true if neither a happens-before b nor b happens-before a
 * (the events are concurrent / causally unrelated).
 */
export function vectorClockConcurrent(a: VectorClock, b: VectorClock): boolean {
  return !vectorClockHappensBefore(a, b) && !vectorClockHappensBefore(b, a);
}
