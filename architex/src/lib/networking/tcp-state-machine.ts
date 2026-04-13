import type { ProtocolTimelineEvent } from './shared-types';

// ─────────────────────────────────────────────────────────────
// Architex — TCP Connection State Machine
// ─────────────────────────────────────────────────────────────
//
// HOOK: Every HTTP request pays a hidden tax before the first
// byte flows. That tax is the TCP handshake — 1.5 round trips
// of pure overhead. On a NY-to-London link (56ms RTT), that is
// 84ms before any data moves. This is why connection pooling
// and HTTP keep-alive exist.
//
// INTUITION — the phone-call analogy:
//   Client: "Can you hear me?"           (SYN)
//   Server: "Yes, can you hear ME?"      (SYN-ACK)
//   Client: "Yes."                       (ACK)
// Three steps, not two, because BOTH sides must confirm they
// can send AND receive. A two-step handshake would leave the
// server unsure whether the client received its response.
//
// Full TCP connection lifecycle simulation including the 3-way
// handshake, data transfer with sequence/acknowledgement numbers,
// graceful 4-way teardown with TIME_WAIT, and packet loss with
// retransmission.
//
// State transitions follow RFC 793 (and updates in RFC 9293).
// Every operation produces an ordered list of TCPEvent objects
// suitable for step-by-step playback visualization.
//
// PERFORMANCE CONTEXT:
//   1 RTT NY-London = 56ms
//   TCP handshake   = 1.5 RTT = 84ms before first data byte
//   With connection reuse (keep-alive), amortized cost drops
//   to near zero — a 275%+ improvement on short requests.
// ─────────────────────────────────────────────────────────────

/**
 * All possible states in the TCP finite state machine.
 *
 * Lifecycle overview:
 * - CLOSED: No connection exists.
 * - LISTEN: Server waiting for incoming SYN.
 * - SYN_SENT: Client has sent SYN, awaiting SYN-ACK.
 * - SYN_RECEIVED: Server received SYN, sent SYN-ACK, awaiting ACK.
 * - ESTABLISHED: Both sides have completed handshake; data flows freely.
 * - FIN_WAIT_1: Initiator sent FIN, awaiting ACK.
 * - FIN_WAIT_2: Initiator received ACK of its FIN, awaiting peer's FIN.
 * - CLOSE_WAIT: Receiver got FIN, waiting for application to close.
 * - CLOSING: Both sides sent FIN simultaneously.
 * - LAST_ACK: Receiver sent FIN after CLOSE_WAIT, awaiting final ACK.
 * - TIME_WAIT: Initiator received final FIN, waiting 2*MSL before CLOSED.
 */
export type TCPState =
  | 'CLOSED'
  | 'LISTEN'
  | 'SYN_SENT'
  | 'SYN_RECEIVED'
  | 'ESTABLISHED'
  | 'FIN_WAIT_1'
  | 'FIN_WAIT_2'
  | 'CLOSE_WAIT'
  | 'CLOSING'
  | 'LAST_ACK'
  | 'TIME_WAIT';

/**
 * Represents a single TCP segment exchanged between endpoints.
 *
 * Control flags (SYN, ACK, FIN, RST) drive state transitions.
 * `seqNum` and `ackNum` track byte-stream positions as in real TCP,
 * with SYN and FIN each consuming one sequence number.
 */
export interface TCPSegment {
  /** Synchronize flag — initiates a connection. */
  syn: boolean;
  /** Acknowledgement flag — confirms receipt. */
  ack: boolean;
  /** Finish flag — initiates graceful close. */
  fin: boolean;
  /** Reset flag — aborts the connection. */
  rst: boolean;
  /** Sender's current sequence number. */
  seqNum: number;
  /** Next sequence number the sender expects to receive. */
  ackNum: number;
  /** Optional application-layer payload. */
  data?: string;
  /** Advertised receive window size in bytes. */
  windowSize: number;
}

/**
 * A single event in the TCP simulation timeline.
 *
 * Each event captures who sent the segment, the segment contents,
 * a human-readable description, and the resulting state of both
 * the client and the server after the event is processed.
 */
export interface TCPEvent extends ProtocolTimelineEvent {
  /** Endpoint that sent this segment (narrows base `from`). */
  from: 'client' | 'server';
  /** Endpoint that receives this segment (narrows base `to`). */
  to: 'client' | 'server';
  /** The TCP segment transmitted. */
  segment: TCPSegment;
  /** Client's TCP state after this event. */
  clientState: TCPState;
  /** Server's TCP state after this event. */
  serverState: TCPState;
}

// ── Constants ────────────────────────────────────────────────

/** Default receive window size (64 KB). */
const DEFAULT_WINDOW_SIZE = 65535;

/** Initial sequence number for the client side. */
const CLIENT_ISN = 1000;

/** Initial sequence number for the server side. */
const SERVER_ISN = 5000;

// ── Helpers ──────────────────────────────────────────────────

/** Creates a TCP segment with sensible defaults. */
function makeSegment(
  overrides: Partial<TCPSegment> & Pick<TCPSegment, 'seqNum' | 'ackNum'>,
): TCPSegment {
  return {
    syn: false,
    ack: false,
    fin: false,
    rst: false,
    windowSize: DEFAULT_WINDOW_SIZE,
    ...overrides,
  };
}

/**
 * Simulates a full TCP connection lifecycle.
 *
 * Supports the three core phases:
 * 1. **3-way handshake** — `connect()`
 * 2. **Data transfer** — `sendData()`
 * 3. **4-way teardown** — `close()`
 *
 * Additionally models packet loss and retransmission via
 * `simulatePacketLoss()`.
 *
 * @example
 * ```ts
 * const conn = new TCPConnection();
 * conn.connect();
 * conn.sendData('client', 'Hello, server!');
 * conn.sendData('server', 'Hello, client!');
 * conn.close('client');
 *
 * for (const event of conn.getAllEvents()) {
 *   console.log(`[${event.tick}] ${event.from} -> ${event.to}: ${event.description}`);
 * }
 * ```
 */
export class TCPConnection {
  /** Current TCP state of the client endpoint. */
  clientState: TCPState;
  /** Current TCP state of the server endpoint. */
  serverState: TCPState;
  /** Ordered timeline of all events produced so far. */
  events: TCPEvent[];

  /** Client's next sequence number to send. */
  private clientSeq: number;
  /** Server's next sequence number to send. */
  private serverSeq: number;
  /** Monotonically increasing simulation tick counter. */
  private tick: number;

  constructor() {
    this.clientState = 'CLOSED';
    this.serverState = 'CLOSED';
    this.events = [];
    this.clientSeq = CLIENT_ISN;
    this.serverSeq = SERVER_ISN;
    this.tick = 0;
  }

  // ── 3-Way Handshake ──────────────────────────────────────

  /**
   * Performs the TCP 3-way handshake (SYN -> SYN-ACK -> ACK).
   *
   * State transitions:
   * - Client: CLOSED -> SYN_SENT -> ESTABLISHED
   * - Server: CLOSED -> LISTEN -> SYN_RECEIVED -> ESTABLISHED
   *
   * @returns The three handshake events.
   * @throws If either endpoint is not in the CLOSED state.
   */
  connect(): TCPEvent[] {
    if (this.clientState !== 'CLOSED' || this.serverState !== 'CLOSED') {
      throw new Error(
        `Cannot connect: client is ${this.clientState}, server is ${this.serverState}. Both must be CLOSED.`,
      );
    }

    const handshakeEvents: TCPEvent[] = [];

    // Step 0: Server enters LISTEN (passive open)
    this.serverState = 'LISTEN';

    // Step 1: Client sends SYN (active open)
    this.clientState = 'SYN_SENT';
    const synSegment = makeSegment({
      syn: true,
      seqNum: this.clientSeq,
      ackNum: 0,
    });
    this.clientSeq++; // SYN consumes one sequence number
    handshakeEvents.push(
      this.recordEvent('client', 'server', synSegment, 'SYN_SENT', 'LISTEN', [
        'Client sends SYN ("synchronize") to propose a starting sequence number.',
        `ISN (Initial Sequence Number) = ${synSegment.seqNum}.`,
        'WHY sequence numbers? They serve two purposes: (1) prevent an attacker from injecting fake segments into the stream,',
        'and (2) let the receiver reassemble bytes in the correct order even if packets arrive out of order.',
        'WHY random? A predictable ISN would let an off-path attacker guess valid sequence numbers and hijack the connection.',
        'Client transitions from CLOSED to SYN_SENT.',
      ]),
    );

    // Step 2: Server responds with SYN-ACK
    this.serverState = 'SYN_RECEIVED';
    const synAckSegment = makeSegment({
      syn: true,
      ack: true,
      seqNum: this.serverSeq,
      ackNum: this.clientSeq, // expects client's next byte
    });
    this.serverSeq++; // SYN-ACK consumes one sequence number
    handshakeEvents.push(
      this.recordEvent(
        'server',
        'client',
        synAckSegment,
        'SYN_SENT',
        'SYN_RECEIVED',
        [
          'Server responds with SYN-ACK — doing two things at once in a single segment.',
          `(1) ACK = ${synAckSegment.ackNum}: acknowledges the client's ISN (${synAckSegment.ackNum - 1}) by saying "I expect your next byte to be ${synAckSegment.ackNum}."`,
          `(2) SYN with Server ISN = ${synAckSegment.seqNum}: proposes the server's own starting sequence number for the reverse direction.`,
          'This piggyback design saves a full round trip — without it, synchronizing both directions would take 4 steps instead of 3.',
          'Server transitions from LISTEN to SYN_RECEIVED.',
        ],
      ),
    );

    // Step 3: Client sends ACK — handshake complete
    this.clientState = 'ESTABLISHED';
    this.serverState = 'ESTABLISHED';
    const ackSegment = makeSegment({
      ack: true,
      seqNum: this.clientSeq,
      ackNum: this.serverSeq,
    });
    handshakeEvents.push(
      this.recordEvent(
        'client',
        'server',
        ackSegment,
        'ESTABLISHED',
        'ESTABLISHED',
        [
          'Client sends final ACK, completing the 3-way handshake.',
          `SEQ = ${ackSegment.seqNum}, ACK = ${ackSegment.ackNum}.`,
          'WHY is this third step needed? Without it, the server cannot distinguish a fresh SYN from a stale "ghost" packet',
          'left over from an old connection. If the server committed resources after just two steps, a duplicate SYN from a',
          'previous connection could trick it into opening a phantom connection that nobody uses, wasting memory and ports.',
          'Both sides transition to ESTABLISHED. Data transfer may begin.',
        ],
      ),
    );

    return handshakeEvents;
  }

  // ── Data Transfer ────────────────────────────────────────

  /**
   * Sends application data from one endpoint to the other.
   *
   * Produces two events:
   * 1. The data segment (PSH+ACK).
   * 2. The receiver's ACK confirming receipt.
   *
   * @param from - Which endpoint sends the data.
   * @param data - The payload string.
   * @returns The data and ACK events.
   * @throws If connection is not ESTABLISHED.
   */
  sendData(from: 'client' | 'server', data: string): TCPEvent[] {
    if (
      this.clientState !== 'ESTABLISHED' ||
      this.serverState !== 'ESTABLISHED'
    ) {
      throw new Error(
        'Cannot send data: connection is not ESTABLISHED on both sides.',
      );
    }

    const dataEvents: TCPEvent[] = [];
    const dataLength = data.length;
    const to: 'client' | 'server' = from === 'client' ? 'server' : 'client';

    // Determine sequence numbers based on sender
    const senderSeq = from === 'client' ? this.clientSeq : this.serverSeq;
    const receiverSeq = from === 'client' ? this.serverSeq : this.clientSeq;

    // Step 1: Sender transmits data segment (PSH + ACK)
    const dataSegment = makeSegment({
      ack: true,
      seqNum: senderSeq,
      ackNum: receiverSeq,
      data,
    });
    dataEvents.push(
      this.recordEvent(
        from,
        to,
        dataSegment,
        'ESTABLISHED',
        'ESTABLISHED',
        [
          `${capitalize(from)} sends ${dataLength} bytes of data.`,
          `SEQ = ${senderSeq} means "this data starts at byte position ${senderSeq} in my stream."`,
          `ACK = ${receiverSeq} means "I have received all of your bytes up to ${receiverSeq - 1}."`,
          `Payload: "${truncate(data, 40)}".`,
        ],
      ),
    );

    // Advance sender's sequence number by data length
    if (from === 'client') {
      this.clientSeq += dataLength;
    } else {
      this.serverSeq += dataLength;
    }

    // Step 2: Receiver acknowledges data
    const newSenderSeq = from === 'client' ? this.clientSeq : this.serverSeq;
    const ackSegment = makeSegment({
      ack: true,
      seqNum: receiverSeq,
      ackNum: newSenderSeq,
    });
    dataEvents.push(
      this.recordEvent(
        to,
        from,
        ackSegment,
        'ESTABLISHED',
        'ESTABLISHED',
        [
          `${capitalize(to)} acknowledges ${dataLength} bytes.`,
          `ACK = ${newSenderSeq} (next expected byte from ${from}).`,
          `Unlike the handshake where ACK increments by 1 (because SYN/FIN consume exactly one sequence number),`,
          `data ACKs advance by the NUMBER OF BYTES received: ${senderSeq} + ${dataLength} = ${newSenderSeq}.`,
          'This is a common interview confusion point.',
        ],
      ),
    );

    return dataEvents;
  }

  // ── Connection Teardown ──────────────────────────────────

  /**
   * Performs a graceful 4-way connection teardown.
   *
   * Sequence: FIN -> ACK -> FIN -> ACK
   *
   * State transitions for the initiator:
   * - ESTABLISHED -> FIN_WAIT_1 -> FIN_WAIT_2 -> TIME_WAIT -> CLOSED
   *
   * State transitions for the receiver:
   * - ESTABLISHED -> CLOSE_WAIT -> LAST_ACK -> CLOSED
   *
   * @param initiator - Which endpoint initiates the close.
   * @returns The four teardown events.
   * @throws If connection is not ESTABLISHED.
   */
  close(initiator: 'client' | 'server'): TCPEvent[] {
    if (
      this.clientState !== 'ESTABLISHED' ||
      this.serverState !== 'ESTABLISHED'
    ) {
      throw new Error(
        'Cannot close: connection is not ESTABLISHED on both sides.',
      );
    }

    const closeEvents: TCPEvent[] = [];
    const responder: 'client' | 'server' =
      initiator === 'client' ? 'server' : 'client';

    const initSeq = initiator === 'client' ? this.clientSeq : this.serverSeq;
    const respSeq = initiator === 'client' ? this.serverSeq : this.clientSeq;

    // Step 1: Initiator sends FIN
    const finSegment = makeSegment({
      fin: true,
      ack: true,
      seqNum: initSeq,
      ackNum: respSeq,
    });

    if (initiator === 'client') {
      this.clientState = 'FIN_WAIT_1';
    } else {
      this.serverState = 'FIN_WAIT_1';
    }
    closeEvents.push(
      this.recordEvent(
        initiator,
        responder,
        finSegment,
        this.clientState,
        this.serverState,
        [
          `${capitalize(initiator)} sends FIN to initiate graceful close.`,
          `SEQ = ${initSeq}. FIN consumes one sequence number.`,
          `${capitalize(initiator)} transitions to FIN_WAIT_1.`,
        ],
      ),
    );

    // Advance initiator seq (FIN consumes 1)
    if (initiator === 'client') {
      this.clientSeq++;
    } else {
      this.serverSeq++;
    }

    // Step 2: Responder acknowledges the FIN
    const finAckSegment = makeSegment({
      ack: true,
      seqNum: respSeq,
      ackNum: initiator === 'client' ? this.clientSeq : this.serverSeq,
    });

    if (initiator === 'client') {
      this.clientState = 'FIN_WAIT_2';
      this.serverState = 'CLOSE_WAIT';
    } else {
      this.serverState = 'FIN_WAIT_2';
      this.clientState = 'CLOSE_WAIT';
    }
    closeEvents.push(
      this.recordEvent(
        responder,
        initiator,
        finAckSegment,
        this.clientState,
        this.serverState,
        [
          `${capitalize(responder)} acknowledges the FIN.`,
          `${capitalize(initiator)} transitions to FIN_WAIT_2.`,
          `${capitalize(responder)} transitions to CLOSE_WAIT.`,
        ],
      ),
    );

    // Step 3: Responder sends its own FIN
    const respFinSegment = makeSegment({
      fin: true,
      ack: true,
      seqNum: respSeq,
      ackNum: initiator === 'client' ? this.clientSeq : this.serverSeq,
    });

    if (initiator === 'client') {
      this.serverState = 'LAST_ACK';
    } else {
      this.clientState = 'LAST_ACK';
    }
    closeEvents.push(
      this.recordEvent(
        responder,
        initiator,
        respFinSegment,
        this.clientState,
        this.serverState,
        [
          `${capitalize(responder)} sends its own FIN.`,
          `${capitalize(responder)} transitions to LAST_ACK.`,
        ],
      ),
    );

    // Advance responder seq (FIN consumes 1)
    if (responder === 'client') {
      this.clientSeq++;
    } else {
      this.serverSeq++;
    }

    // Step 4: Initiator acknowledges responder's FIN
    const finalAckSegment = makeSegment({
      ack: true,
      seqNum: initiator === 'client' ? this.clientSeq : this.serverSeq,
      ackNum: responder === 'client' ? this.clientSeq : this.serverSeq,
    });

    if (initiator === 'client') {
      this.clientState = 'TIME_WAIT';
      this.serverState = 'CLOSED';
    } else {
      this.serverState = 'TIME_WAIT';
      this.clientState = 'CLOSED';
    }
    closeEvents.push(
      this.recordEvent(
        initiator,
        responder,
        finalAckSegment,
        this.clientState,
        this.serverState,
        [
          `${capitalize(initiator)} acknowledges ${responder}'s FIN.`,
          `${capitalize(responder)} transitions to CLOSED.`,
          `${capitalize(initiator)} enters TIME_WAIT (waits 2*MSL before CLOSED).`,
        ],
      ),
    );

    // Step 5: TIME_WAIT -> CLOSED after 2*MSL timer expires
    if (initiator === 'client') {
      this.clientState = 'CLOSED';
    } else {
      this.serverState = 'CLOSED';
    }
    const timeWaitSegment = makeSegment({
      seqNum: initiator === 'client' ? this.clientSeq : this.serverSeq,
      ackNum: responder === 'client' ? this.clientSeq : this.serverSeq,
    });
    closeEvents.push(
      this.recordEvent(
        initiator,
        initiator, // self-event: timer expiry
        timeWaitSegment,
        this.clientState,
        this.serverState,
        [
          `${capitalize(initiator)} TIME_WAIT timer (2*MSL) expires. Transitioning to CLOSED.`,
          'The 2*MSL (Maximum Segment Lifetime) wait ensures that any delayed duplicate packets',
          'from this connection have expired in the network, preventing them from being',
          'misinterpreted as part of a new connection on the same port pair.',
        ],
      ),
    );

    return closeEvents;
  }

  // ── Packet Loss Simulation ───────────────────────────────

  /**
   * Simulates packet loss and TCP retransmission for a previously sent segment.
   *
   * Inserts events showing: the original segment being lost, a retransmission
   * timeout firing, the segment being retransmitted, and the receiver
   * acknowledging it.
   *
   * @param segmentIndex - Index into `events` of the segment to "lose".
   * @returns Events describing the loss and recovery.
   * @throws If the index is out of range.
   */
  simulatePacketLoss(segmentIndex: number): TCPEvent[] {
    if (segmentIndex < 0 || segmentIndex >= this.events.length) {
      throw new Error(
        `Segment index ${segmentIndex} is out of range [0, ${this.events.length - 1}].`,
      );
    }

    const lossEvents: TCPEvent[] = [];
    const original = this.events[segmentIndex];

    // Step 1: Mark the original as lost (no state change)
    const lostSegment = makeSegment({
      ...original.segment,
      rst: false, // ensure not a reset
    });
    lossEvents.push(
      this.recordEvent(
        original.from,
        original.to,
        lostSegment,
        this.clientState,
        this.serverState,
        [
          `PACKET LOST: Segment from ${original.from} (SEQ=${original.segment.seqNum}) dropped by network.`,
          'The receiver never sees this packet.',
        ],
      ),
    );

    // Step 2: Retransmission timeout (RTO) fires on sender side
    const rtoSegment = makeSegment({
      seqNum: original.segment.seqNum,
      ackNum: original.segment.ackNum,
    });
    lossEvents.push(
      this.recordEvent(
        original.from,
        original.from, // self-event: timeout
        rtoSegment,
        this.clientState,
        this.serverState,
        [
          `Retransmission Timeout (RTO) fires on ${original.from}.`,
          'No ACK received within timeout window. Sender will retransmit.',
        ],
      ),
    );

    // Step 3: Sender retransmits the segment
    const retransmitSegment = makeSegment({
      ...original.segment,
    });
    lossEvents.push(
      this.recordEvent(
        original.from,
        original.to,
        retransmitSegment,
        this.clientState,
        this.serverState,
        [
          `RETRANSMIT: ${capitalize(original.from)} resends segment (SEQ=${original.segment.seqNum}).`,
          'Identical to the original lost segment.',
        ],
      ),
    );

    // Step 4: Receiver acknowledges the retransmitted segment
    const ackSeq =
      original.to === 'client' ? this.clientSeq : this.serverSeq;
    const expectedAck = original.segment.seqNum + (original.segment.data?.length ?? 0) + (original.segment.syn ? 1 : 0) + (original.segment.fin ? 1 : 0);
    const retransmitAck = makeSegment({
      ack: true,
      seqNum: ackSeq,
      ackNum: expectedAck,
    });
    lossEvents.push(
      this.recordEvent(
        original.to,
        original.from,
        retransmitAck,
        this.clientState,
        this.serverState,
        [
          `${capitalize(original.to)} acknowledges retransmitted segment.`,
          `ACK = ${expectedAck}. Connection continues normally.`,
        ],
      ),
    );

    return lossEvents;
  }

  // ── Query ────────────────────────────────────────────────

  /** Returns a copy of the complete event timeline. */
  getAllEvents(): TCPEvent[] {
    return [...this.events];
  }

  /** Resets the connection to its initial state. */
  reset(): void {
    this.clientState = 'CLOSED';
    this.serverState = 'CLOSED';
    this.events = [];
    this.clientSeq = CLIENT_ISN;
    this.serverSeq = SERVER_ISN;
    this.tick = 0;
  }

  // ── Internals ────────────────────────────────────────────

  /**
   * Records an event, appends it to the timeline, and returns it.
   * Description lines are joined with a single space.
   */
  private recordEvent(
    from: 'client' | 'server',
    to: 'client' | 'server',
    segment: TCPSegment,
    clientState: TCPState,
    serverState: TCPState,
    descriptionLines: string[],
  ): TCPEvent {
    this.tick++;
    const event: TCPEvent = {
      tick: this.tick,
      from,
      to,
      segment,
      description: descriptionLines.join(' '),
      clientState,
      serverState,
    };
    this.events.push(event);
    return event;
  }
}

// ── String Helpers ─────────────────────────────────────────

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function truncate(s: string, maxLen: number): string {
  return s.length > maxLen ? s.slice(0, maxLen - 3) + '...' : s;
}
