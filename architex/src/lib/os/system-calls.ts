/**
 * System Call Execution Simulation  (OSC-063)
 *
 * Simulates the lifecycle of a system call: user-mode request, trap
 * instruction, privilege escalation from Ring 3 to Ring 0, kernel
 * handler execution, return to user mode, and user-space resumption.
 *
 * Each phase emits a {@link SystemCallEvent} with an educational
 * description explaining the privilege transition and hardware
 * mechanisms involved.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SystemCallEvent {
  tick: number;
  phase:
    | 'user-request'
    | 'trap'
    | 'mode-switch'
    | 'kernel-handler'
    | 'return'
    | 'resume-user';
  syscall: string;
  description: string;
}

export interface SystemCallResult {
  events: SystemCallEvent[];
  totalOverheadCycles: number;
}

export interface SystemCallDef {
  name: string;
  description: string;
  kernelHandlerCycles: number;
  category: 'file' | 'process' | 'memory' | 'network';
}

// ---------------------------------------------------------------------------
// Constants — fixed cycle costs for non-handler phases
// ---------------------------------------------------------------------------

/** Cycles for the user-space library wrapper to marshal arguments. */
const USER_REQUEST_CYCLES = 5;

/** Cycles for the trap instruction (INT 0x80 / SYSCALL) to execute. */
const TRAP_CYCLES = 10;

/** Cycles for the CPU to switch from Ring 3 (user) to Ring 0 (kernel). */
const MODE_SWITCH_CYCLES = 20;

/** Cycles for IRET / SYSRET to return from kernel to user mode. */
const RETURN_CYCLES = 15;

/** Cycles for user-space to unmarshal the kernel's return value. */
const RESUME_USER_CYCLES = 5;

// ---------------------------------------------------------------------------
// Common syscall catalog
// ---------------------------------------------------------------------------

/**
 * A curated list of well-known POSIX-style system calls with
 * realistic relative handler costs and educational descriptions.
 */
export const COMMON_SYSCALLS: SystemCallDef[] = [
  {
    name: 'read',
    description:
      'Reads bytes from a file descriptor into a user-space buffer. ' +
      'The kernel checks permissions, translates the fd to an inode, ' +
      'and copies data from the page cache (or issues a disk I/O).',
    kernelHandlerCycles: 150,
    category: 'file',
  },
  {
    name: 'write',
    description:
      'Writes bytes from a user-space buffer to a file descriptor. ' +
      'The kernel validates the buffer address, acquires the file lock, ' +
      'and copies data into the page cache for eventual writeback.',
    kernelHandlerCycles: 120,
    category: 'file',
  },
  {
    name: 'open',
    description:
      'Opens a file by pathname, returning a new file descriptor. ' +
      'The kernel walks the directory tree, checks permissions at each ' +
      'component, allocates an fd entry, and links it to the inode.',
    kernelHandlerCycles: 200,
    category: 'file',
  },
  {
    name: 'close',
    description:
      'Closes a file descriptor, releasing kernel resources. ' +
      'The kernel decrements the reference count and, if zero, ' +
      'flushes buffers and deallocates the file object.',
    kernelHandlerCycles: 30,
    category: 'file',
  },
  {
    name: 'fork',
    description:
      'Creates a new child process by duplicating the caller. ' +
      'The kernel allocates a new PCB, duplicates the page table with ' +
      'copy-on-write mappings, and copies file descriptor tables.',
    kernelHandlerCycles: 500,
    category: 'process',
  },
  {
    name: 'exec',
    description:
      'Replaces the current process image with a new executable. ' +
      'The kernel loads the ELF binary, sets up a new address space, ' +
      'initializes the stack with argv/envp, and jumps to the entry point.',
    kernelHandlerCycles: 800,
    category: 'process',
  },
  {
    name: 'exit',
    description:
      'Terminates the calling process and releases all resources. ' +
      'The kernel closes open file descriptors, releases memory mappings, ' +
      'and signals the parent process via SIGCHLD.',
    kernelHandlerCycles: 100,
    category: 'process',
  },
  {
    name: 'mmap',
    description:
      'Maps a file or anonymous region into the virtual address space. ' +
      'The kernel creates a VMA (Virtual Memory Area), updates the page ' +
      'table, and defers physical allocation until the first page fault.',
    kernelHandlerCycles: 250,
    category: 'memory',
  },
  {
    name: 'brk',
    description:
      'Adjusts the program break (heap boundary). ' +
      'The kernel extends or shrinks the data segment VMA and ' +
      'updates page-table entries for the affected range.',
    kernelHandlerCycles: 80,
    category: 'memory',
  },
  {
    name: 'socket',
    description:
      'Creates a network socket endpoint. ' +
      'The kernel allocates a socket structure, assigns a protocol handler ' +
      '(TCP/UDP), and returns a file descriptor for the socket.',
    kernelHandlerCycles: 180,
    category: 'network',
  },
  {
    name: 'connect',
    description:
      'Initiates a TCP connection to a remote host. ' +
      'The kernel sends a SYN packet, allocates connection state, ' +
      'and blocks until the three-way handshake completes (or times out).',
    kernelHandlerCycles: 600,
    category: 'network',
  },
  {
    name: 'sendto',
    description:
      'Sends a datagram to a specified address via UDP. ' +
      'The kernel copies user data into a kernel buffer (sk_buff), ' +
      'prepends UDP/IP headers, and enqueues the packet for transmission.',
    kernelHandlerCycles: 140,
    category: 'network',
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Deep-clone a syscall definition to avoid mutation. */
function cloneSyscallDef(def: SystemCallDef): SystemCallDef {
  return { ...def };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Simulate the full execution of a single system call, emitting
 * events for each phase of the user-to-kernel-to-user transition.
 */
export function simulateSystemCall(syscall: SystemCallDef): SystemCallResult {
  const def = cloneSyscallDef(syscall);
  const events: SystemCallEvent[] = [];
  let tick = 0;

  // Phase 1 — user-space request
  events.push({
    tick,
    phase: 'user-request',
    syscall: def.name,
    description:
      `User program calls ${def.name}() via the C library wrapper. ` +
      `The wrapper marshals arguments into registers (rdi, rsi, rdx...) ` +
      `and places the syscall number into rax.`,
  });
  tick += USER_REQUEST_CYCLES;

  // Phase 2 — trap instruction
  events.push({
    tick,
    phase: 'trap',
    syscall: def.name,
    description:
      `Trap instruction (SYSCALL on x86-64) fires, transferring control ` +
      `to a fixed kernel entry point. The CPU saves the user-mode RIP and ` +
      `RFLAGS so it can return later.`,
  });
  tick += TRAP_CYCLES;

  // Phase 3 — privilege escalation
  events.push({
    tick,
    phase: 'mode-switch',
    syscall: def.name,
    description:
      `CPU switches from Ring 3 (user) to Ring 0 (kernel). ` +
      `The kernel stack pointer is loaded from the TSS, and the CPU ` +
      `now has full hardware access to execute privileged instructions.`,
  });
  tick += MODE_SWITCH_CYCLES;

  // Phase 4 — kernel handler
  events.push({
    tick,
    phase: 'kernel-handler',
    syscall: def.name,
    description:
      `Kernel dispatches to the ${def.name}() handler via the syscall table. ` +
      `${def.description}`,
  });
  tick += def.kernelHandlerCycles;

  // Phase 5 — return from kernel
  events.push({
    tick,
    phase: 'return',
    syscall: def.name,
    description:
      `Kernel executes SYSRET/IRET to return to user mode. ` +
      `The CPU restores the saved RIP and RFLAGS, and privilege ` +
      `drops back to Ring 3. The return value is placed in rax.`,
  });
  tick += RETURN_CYCLES;

  // Phase 6 — resume user
  events.push({
    tick,
    phase: 'resume-user',
    syscall: def.name,
    description:
      `Execution resumes in user space. The C library wrapper ` +
      `reads the return value from rax, checks for errors (negative ` +
      `values map to errno), and returns the result to the caller.`,
  });
  tick += RESUME_USER_CYCLES;

  // Total overhead = everything except the kernel handler itself
  const overheadCycles =
    USER_REQUEST_CYCLES +
    TRAP_CYCLES +
    MODE_SWITCH_CYCLES +
    RETURN_CYCLES +
    RESUME_USER_CYCLES;

  return {
    events,
    totalOverheadCycles: overheadCycles + def.kernelHandlerCycles,
  };
}

/**
 * Simulate a sequence of system calls back-to-back, accumulating
 * events with monotonically increasing tick values.
 *
 * This models a realistic scenario like a file-copy program that
 * calls open → read → write → close in sequence.
 */
export function simulateSystemCallSequence(
  syscalls: SystemCallDef[],
): SystemCallResult {
  if (syscalls.length === 0) {
    return { events: [], totalOverheadCycles: 0 };
  }

  const allEvents: SystemCallEvent[] = [];
  let tickOffset = 0;
  let totalOverhead = 0;

  for (const def of syscalls) {
    const result = simulateSystemCall(def);

    // Rebase ticks relative to the running offset
    for (const event of result.events) {
      allEvents.push({
        ...event,
        tick: event.tick + tickOffset,
      });
    }

    totalOverhead += result.totalOverheadCycles;

    // Advance offset by the last event's tick + a small gap between syscalls
    const lastEventTick = result.events[result.events.length - 1].tick;
    tickOffset += lastEventTick + RESUME_USER_CYCLES;
  }

  return {
    events: allEvents,
    totalOverheadCycles: totalOverhead,
  };
}
