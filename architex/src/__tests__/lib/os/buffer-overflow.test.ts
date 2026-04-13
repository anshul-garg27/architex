import { describe, it, expect } from 'vitest';
import {
  simulateBufferOverflow,
  simulateWithCanary,
  simulateWithASLR,
} from '@/lib/os/buffer-overflow';

describe('Buffer Overflow Visualization', () => {
  describe('simulateBufferOverflow', () => {
    it('returns a setup event first', () => {
      const result = simulateBufferOverflow(4, 4);
      expect(result.events[0].phase).toBe('setup');
    });

    it('marks safe writes within buffer bounds', () => {
      const result = simulateBufferOverflow(4, 4);
      const writes = result.events.filter((e) => e.phase === 'write');
      expect(writes.length).toBe(4);
      for (const w of writes) {
        expect(w.description).toContain('within bounds, safe');
      }
    });

    it('detects exploit when return address is corrupted', () => {
      const result = simulateBufferOverflow(6, 4);
      expect(result.exploitSuccessful).toBe(true);
      expect(result.defenseActive).toBeNull();
      const exploitEvent = result.events.find((e) => e.phase === 'exploit');
      expect(exploitEvent).toBeDefined();
      expect(exploitEvent!.description).toContain('Exploit SUCCEEDS');
    });

    it('does not exploit when input fits in buffer', () => {
      const result = simulateBufferOverflow(3, 4);
      expect(result.exploitSuccessful).toBe(false);
    });

    it('corrupts saved FBP before return address', () => {
      const result = simulateBufferOverflow(6, 4);
      const phases = result.events.map((e) => e.phase);
      const fbpIdx = phases.indexOf('corrupt-fbp');
      const retIdx = phases.indexOf('corrupt-return');
      expect(fbpIdx).toBeGreaterThan(-1);
      expect(retIdx).toBeGreaterThan(fbpIdx);
    });

    it('has correct OverflowResult shape', () => {
      const result = simulateBufferOverflow(4, 4);
      expect(result).toHaveProperty('events');
      expect(result).toHaveProperty('exploitSuccessful');
      expect(result).toHaveProperty('defenseActive');
      for (const e of result.events) {
        expect(e).toHaveProperty('tick');
        expect(e).toHaveProperty('phase');
        expect(e).toHaveProperty('byteIndex');
        expect(e).toHaveProperty('description');
        expect(e).toHaveProperty('stackState');
        expect(e.stackState).toHaveProperty('functionName');
        expect(e.stackState).toHaveProperty('localVars');
        expect(e.stackState).toHaveProperty('savedFBP');
        expect(e.stackState).toHaveProperty('returnAddress');
        expect(e.stackState).toHaveProperty('bufferStart');
        expect(e.stackState).toHaveProperty('bufferSize');
      }
    });
  });

  describe('simulateWithCanary', () => {
    it('detects overflow via canary check', () => {
      const result = simulateWithCanary(6, 4);
      expect(result.exploitSuccessful).toBe(false);
      expect(result.defenseActive).toBe('stack-canary');
      const canaryEvent = result.events.find((e) => e.phase === 'canary-detect');
      expect(canaryEvent).toBeDefined();
      expect(canaryEvent!.description).toContain('OVERFLOW DETECTED');
      expect(canaryEvent!.description).toContain('program terminated');
    });

    it('does not trigger canary when input fits', () => {
      const result = simulateWithCanary(3, 4);
      expect(result.exploitSuccessful).toBe(false);
      const canaryEvent = result.events.find((e) => e.phase === 'canary-detect');
      expect(canaryEvent).toBeUndefined();
    });

    it('canary description mentions value change', () => {
      const result = simulateWithCanary(6, 4);
      const canaryEvent = result.events.find((e) => e.phase === 'canary-detect');
      expect(canaryEvent!.description).toMatch(/value changed from/);
    });
  });

  describe('simulateWithASLR', () => {
    it('randomizes stack addresses', () => {
      const result = simulateWithASLR(6, 4);
      expect(result.defenseActive).toBe('ASLR');
      const aslrEvent = result.events.find((e) => e.phase === 'aslr-randomize');
      expect(aslrEvent).toBeDefined();
      expect(aslrEvent!.description).toContain('randomized');
    });

    it('exploit fails due to ASLR', () => {
      const result = simulateWithASLR(6, 4);
      expect(result.exploitSuccessful).toBe(false);
      const exploitEvent = result.events.find((e) => e.phase === 'exploit');
      expect(exploitEvent).toBeDefined();
      expect(exploitEvent!.description).toContain('exploit FAILS');
    });

    it('uses different base address than default', () => {
      const result = simulateWithASLR(4, 4);
      const setupEvent = result.events.find((e) => e.phase === 'setup');
      // The buffer start should NOT be 0x7FFF0000 due to ASLR offset
      expect(setupEvent!.stackState.bufferStart).not.toBe(0x7fff0000);
    });

    it('clamps bufferSize to valid range', () => {
      const r1 = simulateWithASLR(20, 0);
      expect(r1.events[1].stackState.bufferSize).toBe(1);
      const r2 = simulateWithASLR(20, 100);
      expect(r2.events[1].stackState.bufferSize).toBe(16);
    });
  });
});
