/**
 * Deadlock Detection and Prevention (Banker's Algorithm)
 *
 * Provides two core routines:
 *
 * 1. {@link detectDeadlock} -- builds a Resource Allocation Graph (RAG) and
 *    performs cycle detection via DFS to identify deadlocked processes.
 *
 * 2. {@link bankersAlgorithm} -- implements the Banker's Algorithm for
 *    deadlock avoidance by computing a safe sequence (if one exists).
 *
 * Both return a {@link DeadlockResult} with an ordered event log for
 * step-by-step visualisation.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Resource {
  id: string;
  name: string;
  totalInstances: number;
  availableInstances: number;
}

export interface ProcessState {
  id: string;
  name: string;
  allocated: Record<string, number>; // resource ID -> count
  requested: Record<string, number>; // resource ID -> count (max need)
}

export interface DeadlockResult {
  hasDeadlock: boolean;
  deadlockedProcesses: string[];
  cycle?: string[]; // Cycle in resource allocation graph
  safeSequence?: string[]; // If no deadlock, a safe sequence
  events: Array<{
    tick: number;
    type:
      | 'allocate'
      | 'request'
      | 'release'
      | 'deadlock-detected'
      | 'safe';
    processId: string;
    resourceId: string;
    description: string;
  }>;
}

// ---------------------------------------------------------------------------
// 1. Resource Allocation Graph -- Cycle Detection via DFS
// ---------------------------------------------------------------------------

/**
 * Detect deadlock by finding cycles in the resource allocation graph.
 *
 * The algorithm:
 * 1. Build a wait-for graph: process P waits for process Q if P requests a
 *    resource held by Q and no instances are available.
 * 2. Run DFS on the wait-for graph; a back-edge indicates a cycle (deadlock).
 *
 * For single-instance resources the wait-for graph is exact. For multi-instance
 * resources the routine falls back to a conservative reduction similar to the
 * Banker's approach (processes that *can* finish are removed iteratively).
 */
export function detectDeadlock(
  processes: ProcessState[],
  resources: Resource[],
): DeadlockResult {
  const events: DeadlockResult['events'] = [];
  let tick = 0;

  // Build resource map
  const resMap = new Map<string, Resource>(resources.map((r) => [r.id, r]));

  // Compute available vector from resource definitions
  const available: Record<string, number> = {};
  for (const r of resources) {
    available[r.id] = r.availableInstances;
  }

  // Record allocation / request events
  for (const p of processes) {
    for (const [rid, count] of Object.entries(p.allocated)) {
      if (count > 0) {
        events.push({
          tick: tick++,
          type: 'allocate',
          processId: p.id,
          resourceId: rid,
          description: `${p.name} holds ${count} instance(s) of ${resMap.get(rid)?.name ?? rid} — this allocation reduces ${resMap.get(rid)?.name ?? rid}'s available pool`,
        });
      }
    }
    for (const [rid, count] of Object.entries(p.requested)) {
      if (count > 0) {
        events.push({
          tick: tick++,
          type: 'request',
          processId: p.id,
          resourceId: rid,
          description: `${p.name} requests ${count} instance(s) of ${resMap.get(rid)?.name ?? rid} — if ${resMap.get(rid)?.name ?? rid} is unavailable, ${p.name} must wait (potential deadlock contribution)`,
        });
      }
    }
  }

  // --- Multi-instance safe-sequence reduction (generalised) ---
  // Try to find a safe sequence by iteratively "finishing" processes whose
  // outstanding requests can be satisfied with the current available vector.
  const finished = new Set<string>();
  const work: Record<string, number> = { ...available };
  const safeSequence: string[] = [];

  let progress = true;
  while (progress) {
    progress = false;
    for (const p of processes) {
      if (finished.has(p.id)) continue;

      // Can this process's requests be satisfied?
      let canFinish = true;
      for (const [rid, need] of Object.entries(p.requested)) {
        if ((work[rid] ?? 0) < need) {
          canFinish = false;
          break;
        }
      }

      if (canFinish) {
        // Simulate finishing: release allocated resources
        finished.add(p.id);
        safeSequence.push(p.id);
        for (const [rid, count] of Object.entries(p.allocated)) {
          work[rid] = (work[rid] ?? 0) + count;
        }
        events.push({
          tick: tick++,
          type: 'release',
          processId: p.id,
          resourceId: '*',
          description: `${p.name} can finish; resources released — ${p.name}'s remaining needs can be met by available resources, so it's safe to let it complete`,
        });
        progress = true;
      }
    }
  }

  const deadlocked = processes
    .filter((p) => !finished.has(p.id))
    .map((p) => p.id);

  if (deadlocked.length === 0) {
    events.push({
      tick: tick++,
      type: 'safe',
      processId: '*',
      resourceId: '*',
      description: `System is safe. Safe sequence: ${safeSequence.join(' -> ')} — every process can eventually complete without deadlock`,
    });
    return {
      hasDeadlock: false,
      deadlockedProcesses: [],
      safeSequence,
      events,
    };
  }

  // --- Build wait-for graph among deadlocked processes ---
  // Process P waits for Q if P requests a resource that Q holds.
  const waitFor = new Map<string, Set<string>>();
  for (const pid of deadlocked) {
    waitFor.set(pid, new Set());
  }
  for (const p of processes) {
    if (!deadlocked.includes(p.id)) continue;
    for (const [rid, need] of Object.entries(p.requested)) {
      if (need <= 0) continue;
      for (const q of processes) {
        if (q.id === p.id) continue;
        if ((q.allocated[rid] ?? 0) > 0) {
          waitFor.get(p.id)?.add(q.id);
        }
      }
    }
  }

  // DFS to find a cycle
  const cycle = findCycleDFS(waitFor, deadlocked);

  for (const pid of deadlocked) {
    const pName = processes.find((p) => p.id === pid)?.name ?? pid;
    events.push({
      tick: tick++,
      type: 'deadlock-detected',
      processId: pid,
      resourceId: '*',
      description: `${pName} is deadlocked — it holds resources needed by others and needs resources held by others, forming a circular wait`,
    });
  }

  return {
    hasDeadlock: true,
    deadlockedProcesses: deadlocked,
    cycle: cycle ?? undefined,
    events,
  };
}

/**
 * DFS cycle detection on a directed graph.
 * Returns the first cycle found as an ordered array of node IDs, or null.
 */
function findCycleDFS(
  graph: Map<string, Set<string>>,
  nodes: string[],
): string[] | null {
  const WHITE = 0;
  const GRAY = 1;
  const BLACK = 2;

  const color = new Map<string, number>();
  const parent = new Map<string, string | null>();
  for (const n of nodes) {
    color.set(n, WHITE);
    parent.set(n, null);
  }

  for (const start of nodes) {
    if (color.get(start) !== WHITE) continue;
    const cycle = dfsVisit(start, graph, color, parent);
    if (cycle) return cycle;
  }
  return null;
}

function dfsVisit(
  u: string,
  graph: Map<string, Set<string>>,
  color: Map<string, number>,
  parent: Map<string, string | null>,
): string[] | null {
  const GRAY = 1;
  const BLACK = 2;

  color.set(u, GRAY);
  const neighbours = Array.from(graph.get(u) ?? []);
  for (const v of neighbours) {
    if (color.get(v) === GRAY) {
      // Back edge found -- reconstruct cycle
      const cycle: string[] = [v, u];
      let cur = parent.get(u) ?? null;
      while (cur !== null && cur !== v) {
        cycle.push(cur);
        cur = parent.get(cur) ?? null;
      }
      cycle.push(v);
      return cycle.reverse();
    }
    if (color.get(v) === undefined || color.get(v) === 0) {
      parent.set(v, u);
      const result = dfsVisit(v, graph, color, parent);
      if (result) return result;
    }
  }
  color.set(u, BLACK);
  return null;
}

// ---------------------------------------------------------------------------
// 2. Banker's Algorithm (Deadlock Avoidance)
// ---------------------------------------------------------------------------

/**
 * Banker's Algorithm for deadlock avoidance.
 *
 * Given the current allocation, maximum need, and available resources,
 * determines whether the system is in a safe state and, if so, provides a
 * safe execution sequence.
 *
 * @param processes - Current allocation per process.
 * @param resources - Resource pool definitions.
 * @param maxNeed  - Maximum resource need per process (process ID -> resource ID -> count).
 */
export function bankersAlgorithm(
  processes: ProcessState[],
  resources: Resource[],
  maxNeed: Record<string, Record<string, number>>,
): DeadlockResult {
  const events: DeadlockResult['events'] = [];
  let tick = 0;

  const resMap = new Map<string, Resource>(resources.map((r) => [r.id, r]));
  const resourceIds = resources.map((r) => r.id);

  // Available vector
  const available: Record<string, number> = {};
  for (const r of resources) {
    available[r.id] = r.availableInstances;
  }

  // Need matrix: need[pid][rid] = maxNeed[pid][rid] - allocated[pid][rid]
  const need: Record<string, Record<string, number>> = {};
  for (const p of processes) {
    need[p.id] = {};
    const max = maxNeed[p.id] ?? {};
    for (const rid of resourceIds) {
      need[p.id][rid] = (max[rid] ?? 0) - (p.allocated[rid] ?? 0);
    }

    // Log current allocation
    for (const rid of resourceIds) {
      const alloc = p.allocated[rid] ?? 0;
      if (alloc > 0) {
        events.push({
          tick: tick++,
          type: 'allocate',
          processId: p.id,
          resourceId: rid,
          description: `${p.name} holds ${alloc} of ${resMap.get(rid)?.name ?? rid} (need ${need[p.id][rid]} more) — this allocation reduces ${resMap.get(rid)?.name ?? rid}'s available pool`,
        });
      }
    }
  }

  // Safety algorithm
  const work: Record<string, number> = { ...available };
  const finished = new Set<string>();
  const safeSequence: string[] = [];

  let progress = true;
  while (progress) {
    progress = false;
    for (const p of processes) {
      if (finished.has(p.id)) continue;

      // Check if need[p] <= work
      let canFinish = true;
      for (const rid of resourceIds) {
        if (need[p.id][rid] > (work[rid] ?? 0)) {
          canFinish = false;
          break;
        }
      }

      if (canFinish) {
        // Grant remaining resources, then reclaim all
        for (const rid of resourceIds) {
          events.push({
            tick: tick++,
            type: 'request',
            processId: p.id,
            resourceId: rid,
            description: `${p.name} can be granted remaining ${need[p.id][rid]} of ${resMap.get(rid)?.name ?? rid} — need can be met by available resources`,
          });
        }

        finished.add(p.id);
        safeSequence.push(p.id);

        // Release: work += allocation[p]
        for (const rid of resourceIds) {
          work[rid] = (work[rid] ?? 0) + (p.allocated[rid] ?? 0);
          events.push({
            tick: tick++,
            type: 'release',
            processId: p.id,
            resourceId: rid,
            description: `${p.name} finishes, releases ${p.allocated[rid] ?? 0} of ${resMap.get(rid)?.name ?? rid} — resources returned to available pool`,
          });
        }
        progress = true;
      }
    }
  }

  const deadlocked = processes
    .filter((p) => !finished.has(p.id))
    .map((p) => p.id);

  if (deadlocked.length === 0) {
    events.push({
      tick: tick++,
      type: 'safe',
      processId: '*',
      resourceId: '*',
      description: `System is in a SAFE state. Safe sequence: ${safeSequence.join(' -> ')} — every process can eventually complete without deadlock`,
    });
    return {
      hasDeadlock: false,
      deadlockedProcesses: [],
      safeSequence,
      events,
    };
  }

  for (const pid of deadlocked) {
    const pName = processes.find((p) => p.id === pid)?.name ?? pid;
    events.push({
      tick: tick++,
      type: 'deadlock-detected',
      processId: pid,
      resourceId: '*',
      description: `${pName} cannot complete -- system is UNSAFE — it holds resources needed by others and needs resources held by others, forming a circular wait`,
    });
  }

  return {
    hasDeadlock: true,
    deadlockedProcesses: deadlocked,
    events,
  };
}
