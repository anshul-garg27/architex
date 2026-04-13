/**
 * Buffer Overflow Visualization Engine  (OSC-173)
 *
 * Simulates stack-based buffer overflow attacks and their defenses
 * (stack canaries, ASLR) by modelling a simplified call stack where
 * user input is written byte-by-byte into a local buffer. When the
 * input exceeds the buffer size the simulation shows exactly how the
 * saved frame pointer and return address get corrupted, and how each
 * defense mechanism detects or mitigates the exploit.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StackFrame {
  functionName: string;
  localVars: { name: string; value: string; address: number }[];
  savedFBP: number;
  returnAddress: number;
  bufferStart: number;
  bufferSize: number;
}

export interface OverflowEvent {
  tick: number;
  phase:
    | 'setup'
    | 'write'
    | 'overflow'
    | 'corrupt-fbp'
    | 'corrupt-return'
    | 'exploit'
    | 'canary-detect'
    | 'aslr-randomize';
  byteIndex: number;
  description: string;
  stackState: StackFrame;
}

export interface OverflowResult {
  events: OverflowEvent[];
  exploitSuccessful: boolean;
  defenseActive: string | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Base address for the stack frame in our simplified memory model. */
const BASE_ADDRESS = 0x7fff0000;

/** The "malicious" return address an attacker would try to jump to. */
const ATTACKER_TARGET = 0x7fff0040;

/** Canary value placed between buffer and saved FBP. */
const CANARY_VALUE = 0xdead;

/** Value written by overflow bytes (simulating 'A' = 0x41). */
const OVERFLOW_BYTE = 0x41;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Produce a hex string like "0x7FFF0000". */
function hex(n: number): string {
  return '0x' + n.toString(16).toUpperCase().padStart(8, '0');
}

/** Build the initial stack frame for our vulnerable function. */
function buildStackFrame(
  bufSize: number,
  hasCanary: boolean,
  aslrOffset: number,
): StackFrame {
  const bufferStart = BASE_ADDRESS + aslrOffset;
  const canarySlot = hasCanary ? 1 : 0; // 1 extra slot for the canary
  const savedFBPAddr = bufferStart + bufSize + canarySlot;
  const returnAddr = savedFBPAddr + 1;

  const locals: StackFrame['localVars'] = [];
  for (let i = 0; i < bufSize; i++) {
    locals.push({
      name: `buffer[${i}]`,
      value: '0x00',
      address: bufferStart + i,
    });
  }
  if (hasCanary) {
    locals.push({
      name: 'CANARY',
      value: hex(CANARY_VALUE),
      address: bufferStart + bufSize,
    });
  }

  return {
    functionName: 'vulnerable_func',
    localVars: locals,
    savedFBP: savedFBPAddr,
    returnAddress: returnAddr,
    bufferStart,
    bufferSize: bufSize,
  };
}

/** Deep-clone a StackFrame so mutations stay local. */
function cloneFrame(f: StackFrame): StackFrame {
  return {
    ...f,
    localVars: f.localVars.map((v) => ({ ...v })),
  };
}

// ---------------------------------------------------------------------------
// simulateBufferOverflow
// ---------------------------------------------------------------------------

/**
 * Simulate a classic stack-based buffer overflow with no defenses.
 *
 * The user "types" `inputLength` bytes into a buffer of `bufferSize`.
 * Bytes beyond the buffer overwrite the saved frame pointer, then the
 * return address, enabling a control-flow hijack.
 */
export function simulateBufferOverflow(
  inputLength: number,
  bufferSize: number,
): OverflowResult {
  const bufSize = Math.max(1, Math.min(bufferSize, 16));
  const inLen = Math.max(0, Math.min(inputLength, bufSize + 8));
  const events: OverflowEvent[] = [];
  let tick = 0;

  const frame = buildStackFrame(bufSize, false, 0);

  // Phase: setup
  events.push({
    tick: tick++,
    phase: 'setup',
    byteIndex: -1,
    description:
      `Stack frame created for vulnerable_func: ` +
      `buffer[0..${bufSize - 1}] at ${hex(frame.bufferStart)}, ` +
      `saved FBP at ${hex(frame.savedFBP)}, ` +
      `return address at ${hex(frame.returnAddress)}`,
    stackState: cloneFrame(frame),
  });

  let fbpCorrupted = false;
  let returnCorrupted = false;

  for (let i = 0; i < inLen; i++) {
    const currentFrame = cloneFrame(frame);
    const targetAddr = frame.bufferStart + i;

    if (i < bufSize) {
      // Within bounds
      frame.localVars[i].value = `0x${OVERFLOW_BYTE.toString(16).toUpperCase()}`;
      events.push({
        tick: tick++,
        phase: 'write',
        byteIndex: i,
        description:
          `Byte ${i} written to buffer[${i}] — within bounds, safe`,
        stackState: cloneFrame(frame),
      });
    } else if (targetAddr === frame.savedFBP) {
      // Overwriting saved frame pointer
      fbpCorrupted = true;
      events.push({
        tick: tick++,
        phase: 'corrupt-fbp',
        byteIndex: i,
        description:
          `Byte ${i} OVERFLOWS buffer — corrupts saved frame pointer at address ${hex(frame.savedFBP)}`,
        stackState: cloneFrame(frame),
      });
    } else if (targetAddr === frame.returnAddress) {
      // Overwriting return address
      returnCorrupted = true;
      events.push({
        tick: tick++,
        phase: 'corrupt-return',
        byteIndex: i,
        description:
          `Byte ${i} OVERFLOWS buffer — corrupts return address at address ${hex(frame.returnAddress)}. ` +
          `Attacker can redirect execution to ${hex(ATTACKER_TARGET)}`,
        stackState: cloneFrame(frame),
      });
    } else {
      // Generic overflow beyond return address
      events.push({
        tick: tick++,
        phase: 'overflow',
        byteIndex: i,
        description:
          `Byte ${i} OVERFLOWS buffer — writes past return address at address ${hex(targetAddr)}`,
        stackState: cloneFrame(frame),
      });
    }
  }

  const exploitSuccessful = returnCorrupted;

  if (exploitSuccessful) {
    events.push({
      tick: tick++,
      phase: 'exploit',
      byteIndex: inLen,
      description:
        `Function returns — CPU jumps to attacker-controlled address ${hex(ATTACKER_TARGET)}. ` +
        `Exploit SUCCEEDS: arbitrary code execution achieved`,
      stackState: cloneFrame(frame),
    });
  }

  return { events, exploitSuccessful, defenseActive: null };
}

// ---------------------------------------------------------------------------
// simulateWithCanary
// ---------------------------------------------------------------------------

/**
 * Simulate a buffer overflow with a stack canary defense.
 *
 * A known canary value is placed between the buffer and the saved frame
 * pointer. Before the function returns, the runtime checks whether the
 * canary value has been altered. If it has, the overflow is detected
 * and the program is terminated before the corrupted return address
 * can be used.
 */
export function simulateWithCanary(
  inputLength: number,
  bufferSize: number,
): OverflowResult {
  const bufSize = Math.max(1, Math.min(bufferSize, 16));
  const inLen = Math.max(0, Math.min(inputLength, bufSize + 8));
  const events: OverflowEvent[] = [];
  let tick = 0;

  const frame = buildStackFrame(bufSize, true, 0);
  const canaryAddr = frame.bufferStart + bufSize;

  // Phase: setup
  events.push({
    tick: tick++,
    phase: 'setup',
    byteIndex: -1,
    description:
      `Stack frame created with CANARY defense: ` +
      `buffer[0..${bufSize - 1}] at ${hex(frame.bufferStart)}, ` +
      `canary (${hex(CANARY_VALUE)}) at ${hex(canaryAddr)}, ` +
      `saved FBP at ${hex(frame.savedFBP)}, ` +
      `return address at ${hex(frame.returnAddress)}`,
    stackState: cloneFrame(frame),
  });

  let canaryOverwritten = false;

  for (let i = 0; i < inLen; i++) {
    const targetAddr = frame.bufferStart + i;

    if (i < bufSize) {
      // Within bounds
      frame.localVars[i].value = `0x${OVERFLOW_BYTE.toString(16).toUpperCase()}`;
      events.push({
        tick: tick++,
        phase: 'write',
        byteIndex: i,
        description:
          `Byte ${i} written to buffer[${i}] — within bounds, safe`,
        stackState: cloneFrame(frame),
      });
    } else if (targetAddr === canaryAddr) {
      // Overwriting the canary
      canaryOverwritten = true;
      // Update the canary local var to show corruption
      const canaryVar = frame.localVars.find((v) => v.name === 'CANARY');
      if (canaryVar) canaryVar.value = `0x${OVERFLOW_BYTE.toString(16).toUpperCase()}${OVERFLOW_BYTE.toString(16).toUpperCase()}`;
      events.push({
        tick: tick++,
        phase: 'overflow',
        byteIndex: i,
        description:
          `Byte ${i} OVERFLOWS buffer — overwrites stack canary at ${hex(canaryAddr)}`,
        stackState: cloneFrame(frame),
      });
    } else if (targetAddr === frame.savedFBP) {
      events.push({
        tick: tick++,
        phase: 'corrupt-fbp',
        byteIndex: i,
        description:
          `Byte ${i} OVERFLOWS buffer — corrupts saved frame pointer at address ${hex(frame.savedFBP)}`,
        stackState: cloneFrame(frame),
      });
    } else if (targetAddr === frame.returnAddress) {
      events.push({
        tick: tick++,
        phase: 'corrupt-return',
        byteIndex: i,
        description:
          `Byte ${i} OVERFLOWS buffer — corrupts return address at address ${hex(frame.returnAddress)}`,
        stackState: cloneFrame(frame),
      });
    } else {
      events.push({
        tick: tick++,
        phase: 'overflow',
        byteIndex: i,
        description:
          `Byte ${i} OVERFLOWS buffer — writes past return address at address ${hex(targetAddr)}`,
        stackState: cloneFrame(frame),
      });
    }
  }

  // Canary check before function return
  if (canaryOverwritten) {
    events.push({
      tick: tick++,
      phase: 'canary-detect',
      byteIndex: inLen,
      description:
        `Stack canary check: value changed from ${hex(CANARY_VALUE)} to 0x${OVERFLOW_BYTE.toString(16).toUpperCase()}${OVERFLOW_BYTE.toString(16).toUpperCase()} — OVERFLOW DETECTED, program terminated`,
      stackState: cloneFrame(frame),
    });
    return { events, exploitSuccessful: false, defenseActive: 'stack-canary' };
  }

  // No overflow or overflow didn't reach canary
  return { events, exploitSuccessful: false, defenseActive: 'stack-canary' };
}

// ---------------------------------------------------------------------------
// simulateWithASLR
// ---------------------------------------------------------------------------

/**
 * Simulate a buffer overflow with Address Space Layout Randomization (ASLR).
 *
 * Stack addresses are randomized so the attacker's hardcoded jump target
 * no longer points to the intended shellcode location. The overflow still
 * corrupts the return address, but the exploit fails because the actual
 * code has been moved to a different, unpredictable address.
 */
export function simulateWithASLR(
  inputLength: number,
  bufferSize: number,
): OverflowResult {
  const bufSize = Math.max(1, Math.min(bufferSize, 16));
  const inLen = Math.max(0, Math.min(inputLength, bufSize + 8));
  const events: OverflowEvent[] = [];
  let tick = 0;

  // Randomize the base address with a significant offset
  const aslrOffset = 0x8a20 + Math.floor(Math.random() * 0x1000);
  const frame = buildStackFrame(bufSize, false, aslrOffset);

  // ASLR randomization event
  events.push({
    tick: tick++,
    phase: 'aslr-randomize',
    byteIndex: -1,
    description:
      `ASLR active: stack base randomized from ${hex(BASE_ADDRESS)} to ${hex(BASE_ADDRESS + aslrOffset)}. ` +
      `Attacker cannot predict memory layout`,
    stackState: cloneFrame(frame),
  });

  // Setup
  events.push({
    tick: tick++,
    phase: 'setup',
    byteIndex: -1,
    description:
      `Stack frame created for vulnerable_func at randomized addresses: ` +
      `buffer[0..${bufSize - 1}] at ${hex(frame.bufferStart)}, ` +
      `saved FBP at ${hex(frame.savedFBP)}, ` +
      `return address at ${hex(frame.returnAddress)}`,
    stackState: cloneFrame(frame),
  });

  let returnCorrupted = false;

  for (let i = 0; i < inLen; i++) {
    const targetAddr = frame.bufferStart + i;

    if (i < bufSize) {
      frame.localVars[i].value = `0x${OVERFLOW_BYTE.toString(16).toUpperCase()}`;
      events.push({
        tick: tick++,
        phase: 'write',
        byteIndex: i,
        description:
          `Byte ${i} written to buffer[${i}] — within bounds, safe`,
        stackState: cloneFrame(frame),
      });
    } else if (targetAddr === frame.savedFBP) {
      events.push({
        tick: tick++,
        phase: 'corrupt-fbp',
        byteIndex: i,
        description:
          `Byte ${i} OVERFLOWS buffer — corrupts saved frame pointer at address ${hex(frame.savedFBP)}`,
        stackState: cloneFrame(frame),
      });
    } else if (targetAddr === frame.returnAddress) {
      returnCorrupted = true;
      events.push({
        tick: tick++,
        phase: 'corrupt-return',
        byteIndex: i,
        description:
          `Byte ${i} OVERFLOWS buffer — corrupts return address at address ${hex(frame.returnAddress)}`,
        stackState: cloneFrame(frame),
      });
    } else {
      events.push({
        tick: tick++,
        phase: 'overflow',
        byteIndex: i,
        description:
          `Byte ${i} OVERFLOWS buffer — writes past return address at address ${hex(targetAddr)}`,
        stackState: cloneFrame(frame),
      });
    }
  }

  if (returnCorrupted) {
    // ASLR defeats the exploit
    events.push({
      tick: tick++,
      phase: 'exploit',
      byteIndex: inLen,
      description:
        `Return address overwritten with ${hex(ATTACKER_TARGET)} — ` +
        `but ASLR moved the target to ${hex(BASE_ADDRESS + aslrOffset)}, exploit FAILS`,
      stackState: cloneFrame(frame),
    });
    return { events, exploitSuccessful: false, defenseActive: 'ASLR' };
  }

  return { events, exploitSuccessful: false, defenseActive: 'ASLR' };
}
