import { describe, it, expect } from 'vitest';
import { fcfs, roundRobin, type Process } from '@/lib/os/scheduling';

function makeProcess(id: string, arrival: number, burst: number): Process {
  return { id, name: id, arrivalTime: arrival, burstTime: burst, priority: 0, remainingTime: burst };
}

describe('scheduling', () => {
  const procs = [makeProcess('P1', 0, 4), makeProcess('P2', 1, 3), makeProcess('P3', 2, 1)];

  it('FCFS executes processes in arrival order', () => {
    const result = fcfs(procs);
    const completionOrder = result.processes
      .slice()
      .sort((a, b) => (a.completionTime ?? 0) - (b.completionTime ?? 0))
      .map((p) => p.id);
    expect(completionOrder).toEqual(['P1', 'P2', 'P3']);
  });

  it('Round Robin preempts processes at quantum boundary', () => {
    const result = roundRobin(procs, 2);
    const preempts = result.events.filter((e) => e.type === 'preempt');
    expect(preempts.length).toBeGreaterThan(0);
  });

  it('avgWaitTime is computed correctly for FCFS', () => {
    const result = fcfs(procs);
    // P1: wait=0, P2: wait=(4-1)=3, P3: wait=(7-2)=5 => avg=8/3
    expect(result.avgWaitTime).toBeCloseTo(8 / 3);
  });
});
