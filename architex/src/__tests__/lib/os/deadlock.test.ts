import { describe, it, expect } from 'vitest';
import { detectDeadlock } from '@/lib/os/deadlock';
import type { ProcessState, Resource } from '@/lib/os/deadlock';

describe('Deadlock detection', () => {
  it('detects cycle in deadlocked scenario', () => {
    const resources: Resource[] = [
      { id: 'R1', name: 'R1', totalInstances: 1, availableInstances: 0 },
      { id: 'R2', name: 'R2', totalInstances: 1, availableInstances: 0 },
    ];
    const processes: ProcessState[] = [
      { id: 'P0', name: 'P0', allocated: { R1: 1 }, requested: { R2: 1 } },
      { id: 'P1', name: 'P1', allocated: { R2: 1 }, requested: { R1: 1 } },
    ];
    const result = detectDeadlock(processes, resources);
    expect(result.hasDeadlock).toBe(true);
    expect(result.deadlockedProcesses).toContain('P0');
    expect(result.deadlockedProcesses).toContain('P1');
    expect(result.cycle).toBeDefined();
    expect(result.cycle!.length).toBeGreaterThanOrEqual(2);
  });

  it('reports safe state when no deadlock', () => {
    const resources: Resource[] = [
      { id: 'R1', name: 'R1', totalInstances: 2, availableInstances: 1 },
    ];
    const processes: ProcessState[] = [
      { id: 'P0', name: 'P0', allocated: { R1: 1 }, requested: { R1: 1 } },
    ];
    const result = detectDeadlock(processes, resources);
    expect(result.hasDeadlock).toBe(false);
    expect(result.safeSequence).toContain('P0');
  });
});
