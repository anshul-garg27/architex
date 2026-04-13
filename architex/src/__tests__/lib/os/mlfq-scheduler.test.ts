import { describe, it, expect } from 'vitest';
import { mlfqScheduler } from '@/lib/os/mlfq-scheduler';
import type { Process } from '@/lib/os/scheduling';
import type { MLFQConfig } from '@/lib/os/mlfq-scheduler';

function makeProcess(
  id: string,
  arrival: number,
  burst: number,
  priority = 0,
): Process {
  return {
    id,
    name: id,
    arrivalTime: arrival,
    burstTime: burst,
    priority,
    remainingTime: burst,
  };
}

describe('MLFQ Scheduler', () => {
  const defaultConfig: MLFQConfig = {
    queues: [{ quantum: 4 }, { quantum: 8 }, { quantum: Infinity }],
    boostInterval: 100,
  };

  describe('demotion after full quantum use', () => {
    it('demotes a process to the next queue after using the full quantum', () => {
      // A single process with burst > Q0 quantum (4).
      // It should start in Q0, use 4 ticks, then be demoted to Q1.
      const procs = [makeProcess('P1', 0, 10)];
      const { result, steps } = mlfqScheduler(procs, defaultConfig);

      // Should have a demote event
      const demoteEvents = result.events.filter((e) => e.type === 'demote');
      expect(demoteEvents.length).toBeGreaterThanOrEqual(1);

      // First demotion should mention Q0 to Q1
      expect(demoteEvents[0].description).toContain('Q0');
      expect(demoteEvents[0].description).toContain('Q1');
      expect(demoteEvents[0].processId).toBe('P1');

      // Process should complete eventually
      const completeEvents = result.events.filter(
        (e) => e.type === 'complete',
      );
      expect(completeEvents.length).toBe(1);
      expect(completeEvents[0].processId).toBe('P1');

      // Steps should show queue state transitions
      expect(steps.length).toBeGreaterThan(0);
    });

    it('demotes from Q1 to Q2 on second full quantum use', () => {
      // Process with burst > Q0 quantum (4) + Q1 quantum (8) = 12
      const procs = [makeProcess('P1', 0, 20)];
      const { result } = mlfqScheduler(procs, defaultConfig);

      const demoteEvents = result.events.filter((e) => e.type === 'demote');
      // Should be demoted at least twice: Q0->Q1 and Q1->Q2
      expect(demoteEvents.length).toBeGreaterThanOrEqual(2);

      // First demotion: Q0 -> Q1
      expect(demoteEvents[0].description).toMatch(/Q0.*Q1/);

      // Second demotion: Q1 -> Q2
      expect(demoteEvents[1].description).toMatch(/Q1.*Q2/);
    });

    it('does not demote a process that completes within its quantum', () => {
      // Process with burst <= Q0 quantum (4)
      const procs = [makeProcess('P1', 0, 3)];
      const { result } = mlfqScheduler(procs, defaultConfig);

      const demoteEvents = result.events.filter((e) => e.type === 'demote');
      expect(demoteEvents.length).toBe(0);

      const completeEvents = result.events.filter(
        (e) => e.type === 'complete',
      );
      expect(completeEvents.length).toBe(1);
    });
  });

  describe('I/O boost', () => {
    it('keeps a process at the same level when it yields for I/O before quantum expires', () => {
      // P1 has burst=20, does I/O when remainingTime reaches 18 (after 2 ticks)
      // Since quantum is 4 and it yields after 2, it should stay at Q0
      const procs = [makeProcess('P1', 0, 20)];
      const ioMap = { P1: [18, 14, 10, 6] };
      const { result } = mlfqScheduler(procs, defaultConfig, ioMap);

      const ioEvents = result.events.filter((e) => e.type === 'io-return');
      expect(ioEvents.length).toBeGreaterThanOrEqual(1);

      // Process should stay at Q0 thanks to I/O yields
      expect(ioEvents[0].description).toContain('Q0');

      // Should not be demoted if it always yields before quantum
      const demoteEvents = result.events.filter((e) => e.type === 'demote');
      // Some demotions may still happen if I/O thresholds run out
      // But the first few should be I/O returns at Q0
      expect(ioEvents[0].description).toContain('stays at Q0');
    });

    it('does not demote a process that releases CPU early due to I/O', () => {
      // P1 has burst=6, does I/O at remainingTime=4 (after 2 ticks in Q0 quantum=4)
      // After I/O, resumes in Q0, runs 4 more ticks and completes within Q0 quantum
      const procs = [makeProcess('P1', 0, 6)];
      const ioMap = { P1: [4] };
      const { result } = mlfqScheduler(procs, defaultConfig, ioMap);

      const ioEvents = result.events.filter((e) => e.type === 'io-return');
      expect(ioEvents.length).toBe(1);

      // Should complete without any demotion
      const demoteEvents = result.events.filter((e) => e.type === 'demote');
      expect(demoteEvents.length).toBe(0);
    });
  });

  describe('priority boost', () => {
    it('boosts all processes to Q0 at the configured boost interval', () => {
      // Two processes: P1 arrives at 0 (burst=150), P2 arrives at 5 (burst=150)
      // With boostInterval=100, a boost should happen at t=100
      // P1 will have been demoted down by then
      const procs = [
        makeProcess('P1', 0, 150),
        makeProcess('P2', 5, 150),
      ];
      const config: MLFQConfig = {
        queues: [{ quantum: 4 }, { quantum: 8 }, { quantum: Infinity }],
        boostInterval: 100,
      };
      const { result } = mlfqScheduler(procs, config);

      const boostEvents = result.events.filter((e) => e.type === 'boost');
      expect(boostEvents.length).toBeGreaterThanOrEqual(1);

      // Boost should mention moving to Q0
      expect(boostEvents[0].description).toContain('Q0');
    });

    it('does not boost when boostInterval is 0', () => {
      const procs = [makeProcess('P1', 0, 50)];
      const config: MLFQConfig = {
        queues: [{ quantum: 4 }, { quantum: 8 }, { quantum: Infinity }],
        boostInterval: 0,
      };
      const { result } = mlfqScheduler(procs, config);

      const boostEvents = result.events.filter((e) => e.type === 'boost');
      expect(boostEvents.length).toBe(0);
    });
  });

  describe('result format compatibility', () => {
    it('returns a valid ScheduleResult', () => {
      const procs = [
        makeProcess('P1', 0, 5),
        makeProcess('P2', 2, 3),
        makeProcess('P3', 4, 7),
      ];
      const { result } = mlfqScheduler(procs, defaultConfig);

      expect(result.algorithm).toBe('MLFQ');
      expect(result.events.length).toBeGreaterThan(0);
      expect(result.ganttChart.length).toBeGreaterThan(0);
      expect(result.processes.length).toBe(3);
      expect(result.avgWaitTime).toBeGreaterThanOrEqual(0);
      expect(result.avgTurnaroundTime).toBeGreaterThan(0);
      expect(result.avgResponseTime).toBeGreaterThanOrEqual(0);
      expect(result.cpuUtilization).toBeGreaterThan(0);
      expect(result.cpuUtilization).toBeLessThanOrEqual(1);
    });

    it('computes correct completion times', () => {
      const procs = [makeProcess('P1', 0, 4)];
      const { result } = mlfqScheduler(procs, defaultConfig);

      const p1 = result.processes.find((p) => p.id === 'P1')!;
      expect(p1.completionTime).toBe(4);
      expect(p1.turnaroundTime).toBe(4);
      expect(p1.waitTime).toBe(0);
      expect(p1.responseTime).toBe(0);
    });
  });

  describe('animation steps', () => {
    it('generates MLFQStep entries with queue state snapshots', () => {
      const procs = [
        makeProcess('P1', 0, 10),
        makeProcess('P2', 2, 5),
      ];
      const { steps } = mlfqScheduler(procs, defaultConfig);

      expect(steps.length).toBeGreaterThan(0);

      // Each step should have queue state with correct number of levels
      for (const step of steps) {
        expect(step.queueState.length).toBe(3);
        expect(typeof step.tick).toBe('number');
        expect(step.event).toBeDefined();
      }
    });

    it('tracks active process and queue level in steps', () => {
      const procs = [makeProcess('P1', 0, 6)];
      const { steps } = mlfqScheduler(procs, defaultConfig);

      // The start step should show P1 active at Q0
      const startStep = steps.find((s) => s.event.type === 'start');
      expect(startStep).toBeDefined();
      expect(startStep!.activeProcessId).toBe('P1');
      expect(startStep!.activeQueueLevel).toBe(0);
    });
  });

  describe('multiple processes with preemption', () => {
    it('preempts a lower-queue process when a higher-queue process arrives', () => {
      // P1 arrives at 0, burst=20 (will be demoted to Q1 after Q0 quantum=4)
      // P2 arrives at 6, burst=3 (enters Q0, should preempt P1 in Q1)
      const procs = [
        makeProcess('P1', 0, 20),
        makeProcess('P2', 6, 3),
      ];
      const { result } = mlfqScheduler(procs, defaultConfig);

      // P2 should arrive and cause P1 to be preempted
      const preemptEvents = result.events.filter((e) => e.type === 'preempt');
      // P1 gets preempted when P2 arrives during its Q1 run
      expect(preemptEvents.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('edge cases', () => {
    it('handles empty process list', () => {
      const { result, steps } = mlfqScheduler([], defaultConfig);
      expect(result.events.length).toBe(0);
      expect(result.ganttChart.length).toBe(0);
      expect(steps.length).toBe(0);
    });

    it('handles single queue configuration', () => {
      const procs = [makeProcess('P1', 0, 10)];
      const config: MLFQConfig = {
        queues: [{ quantum: 4 }],
        boostInterval: 0,
      };
      const { result } = mlfqScheduler(procs, config);

      // With only one queue, demotion stays at level 0
      const demoteEvents = result.events.filter((e) => e.type === 'demote');
      for (const e of demoteEvents) {
        expect(e.description).toContain('Q0');
      }
      expect(result.processes[0].completionTime).toBe(10);
    });

    it('handles processes arriving at the same time', () => {
      const procs = [
        makeProcess('P1', 0, 5),
        makeProcess('P2', 0, 3),
        makeProcess('P3', 0, 7),
      ];
      const { result } = mlfqScheduler(procs, defaultConfig);

      // All should complete
      const completeEvents = result.events.filter(
        (e) => e.type === 'complete',
      );
      expect(completeEvents.length).toBe(3);
    });
  });
});
