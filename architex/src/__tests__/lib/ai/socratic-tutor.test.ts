import { describe, it, expect } from 'vitest';
import {
  SocraticSession,
  PHASE_ORDER,
  PHASE_LABELS,
  PHASE_DESCRIPTIONS,
  type SocraticPhase,
} from '@/lib/ai/socratic-tutor';

describe('socratic-tutor', () => {
  // ── Session initialisation ───────────────────────────────────

  describe('SocraticSession constructor', () => {
    it('creates a session with the given topic', () => {
      const session = new SocraticSession('Scaling');
      const state = session.getState();
      expect(state.topic).toBe('Scaling');
      expect(state.currentPhase).toBe('assess');
      expect(state.isComplete).toBe(false);
    });

    it('resolves category from topic keywords', () => {
      const session = new SocraticSession('Database Schema Design');
      const state = session.getState();
      expect(state.category).toBe('data');
    });

    it('uses explicit category when provided', () => {
      const session = new SocraticSession('My Topic', 'reliability');
      const state = session.getState();
      expect(state.category).toBe('reliability');
    });

    it('falls back to general for unknown topics', () => {
      const session = new SocraticSession('Underwater Basket Weaving');
      const state = session.getState();
      expect(state.category).toBe('general');
    });
  });

  // ── start() ──────────────────────────────────────────────────

  describe('start()', () => {
    it('returns the opening tutor message', () => {
      const session = new SocraticSession('Caching', 'caching');
      const opening = session.start();
      expect(opening.role).toBe('tutor');
      expect(opening.phase).toBe('assess');
      expect(opening.content).toBeTruthy();
    });

    it('includes suggestions in the opening message', () => {
      const session = new SocraticSession('Caching', 'caching');
      const opening = session.start();
      expect(opening.suggestions).toBeDefined();
      expect(opening.suggestions!.length).toBeGreaterThan(0);
    });

    it('adds the opening message to history', () => {
      const session = new SocraticSession('Caching', 'caching');
      session.start();
      const history = session.getHistory();
      expect(history).toHaveLength(1);
      expect(history[0].role).toBe('tutor');
    });
  });

  // ── respond() ────────────────────────────────────────────────

  describe('respond()', () => {
    it('adds user message and tutor response to history', () => {
      const session = new SocraticSession('Scaling', 'scaling');
      session.start();
      session.respond('I think vertical scaling means adding more CPU.');
      const history = session.getHistory();
      // opening + user + tutor = 3
      expect(history).toHaveLength(3);
      expect(history[1].role).toBe('user');
      expect(history[1].content).toBe('I think vertical scaling means adding more CPU.');
      expect(history[2].role).toBe('tutor');
    });

    it('tutor response is in the current phase', () => {
      const session = new SocraticSession('Scaling', 'scaling');
      session.start();
      const response = session.respond('Something about scaling');
      // After first response in assess phase, it should advance to challenge
      // But the response itself is generated while still in assess
      expect(response.phase).toBe('assess');
    });

    it('returns tutor messages with content', () => {
      const session = new SocraticSession('Security', 'security');
      session.start();
      const response = session.respond('Authentication verifies identity.');
      expect(response.content).toBeTruthy();
      expect(response.content.length).toBeGreaterThan(10);
    });
  });

  // ── Phase progression ────────────────────────────────────────

  describe('phase progression', () => {
    it('starts in the assess phase', () => {
      const session = new SocraticSession('Scaling', 'scaling');
      expect(session.getCurrentPhase()).toBe('assess');
    });

    it('advances from assess to challenge after 1 interaction', () => {
      const session = new SocraticSession('Scaling', 'scaling');
      session.start();
      session.respond('I know about vertical and horizontal scaling.');
      expect(session.getCurrentPhase()).toBe('challenge');
    });

    it('advances from challenge to guide after 2 interactions', () => {
      const session = new SocraticSession('Scaling', 'scaling');
      session.start();
      // Phase 1: assess (1 interaction to advance)
      session.respond('I understand scaling basics.');
      expect(session.getCurrentPhase()).toBe('challenge');
      // Phase 2: challenge (2 interactions to advance)
      session.respond('The database would be the bottleneck.');
      expect(session.getCurrentPhase()).toBe('challenge');
      session.respond('I would add read replicas.');
      expect(session.getCurrentPhase()).toBe('guide');
    });

    it('advances from guide to reinforce after 2 interactions', () => {
      const session = new SocraticSession('Scaling', 'scaling');
      session.start();
      session.respond('scaling basics');       // assess -> challenge
      session.respond('answer 1');             // challenge
      session.respond('answer 2');             // challenge -> guide
      expect(session.getCurrentPhase()).toBe('guide');
      session.respond('guide answer 1');       // guide
      session.respond('guide answer 2');       // guide -> reinforce
      expect(session.getCurrentPhase()).toBe('reinforce');
    });

    it('marks session as complete after reinforce phase', () => {
      const session = new SocraticSession('Scaling', 'scaling');
      session.start();
      session.respond('assess');               // assess -> challenge
      session.respond('challenge 1');          // challenge
      session.respond('challenge 2');          // challenge -> guide
      session.respond('guide 1');              // guide
      session.respond('guide 2');              // guide -> reinforce
      expect(session.isComplete()).toBe(false);
      session.respond('reinforce');            // reinforce completes
      expect(session.isComplete()).toBe(true);
    });
  });

  // ── getPhaseProgress ─────────────────────────────────────────

  describe('getPhaseProgress()', () => {
    it('starts with all phases incomplete', () => {
      const session = new SocraticSession('Scaling', 'scaling');
      const progress = session.getPhaseProgress();
      expect(progress.assess).toBe(false);
      expect(progress.challenge).toBe(false);
      expect(progress.guide).toBe(false);
      expect(progress.reinforce).toBe(false);
    });

    it('marks assess as complete after advancing', () => {
      const session = new SocraticSession('Scaling', 'scaling');
      session.start();
      session.respond('answer');
      const progress = session.getPhaseProgress();
      expect(progress.assess).toBe(true);
      expect(progress.challenge).toBe(false);
    });
  });

  // ── getState() ───────────────────────────────────────────────

  describe('getState()', () => {
    it('returns a snapshot of the session state', () => {
      const session = new SocraticSession('Messaging', 'messaging');
      session.start();
      const state = session.getState();
      expect(state.sessionId).toBeTruthy();
      expect(state.topic).toBe('Messaging');
      expect(state.category).toBe('messaging');
      expect(state.history).toHaveLength(1);
      expect(state.isComplete).toBe(false);
    });

    it('returns a copy, not a reference', () => {
      const session = new SocraticSession('Messaging', 'messaging');
      session.start();
      const state1 = session.getState();
      session.respond('some answer');
      const state2 = session.getState();
      expect(state1.history).toHaveLength(1);
      expect(state2.history).toHaveLength(3);
    });
  });

  // ── Constants ────────────────────────────────────────────────

  describe('constants', () => {
    it('PHASE_ORDER has 4 phases', () => {
      expect(PHASE_ORDER).toEqual(['assess', 'challenge', 'guide', 'reinforce']);
    });

    it('PHASE_LABELS has entries for all phases', () => {
      for (const phase of PHASE_ORDER) {
        expect(PHASE_LABELS[phase]).toBeTruthy();
      }
    });

    it('PHASE_DESCRIPTIONS has entries for all phases', () => {
      for (const phase of PHASE_ORDER) {
        expect(PHASE_DESCRIPTIONS[phase]).toBeTruthy();
      }
    });
  });

  // ── Category inference ───────────────────────────────────────

  describe('category inference from topic', () => {
    const cases: Array<[string, string]> = [
      ['Horizontal Scaling Patterns', 'scaling'],
      ['Circuit Breaker and Failover', 'reliability'],
      ['SQL vs NoSQL Databases', 'data'],
      ['Redis Cache Strategies', 'caching'],
      ['Kafka Event Streaming', 'messaging'],
      ['DNS and HTTP Protocols', 'networking'],
      ['OAuth and JWT Security', 'security'],
      ['Random Unknown Topic', 'general'],
    ];

    for (const [topic, expected] of cases) {
      it(`infers "${expected}" from "${topic}"`, () => {
        const session = new SocraticSession(topic);
        expect(session.getState().category).toBe(expected);
      });
    }
  });
});
