import { describe, it, expect } from 'vitest';
import {
  LLD_CHALLENGES,
  getLLDChallengeById,
  getLLDChallengesByDifficulty,
  getAllLLDPatterns,
} from '../lld-challenges';
import type { LLDChallengeDefinition } from '../lld-challenges';
import { LLD_CHALLENGE_TEMPLATES, getTemplateForChallenge } from '../challenge-templates';
import { WALKTHROUGHS, getWalkthroughForChallenge } from '@/components/interview/LearnMode';
import { CHALLENGES } from '../challenges';

// ── LLD Challenge Data Completeness ──────────────────────────────

describe('LLD Challenges', () => {
  it('has exactly 10 LLD challenges', () => {
    expect(LLD_CHALLENGES).toHaveLength(10);
  });

  it('all challenges have category "lld"', () => {
    for (const ch of LLD_CHALLENGES) {
      expect(ch.category).toBe('lld');
    }
  });

  it('all challenges have unique IDs', () => {
    const ids = LLD_CHALLENGES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all IDs start with "lld-"', () => {
    for (const ch of LLD_CHALLENGES) {
      expect(ch.id).toMatch(/^lld-/);
    }
  });

  // ── Requirements ──────────────────────────────────────────────

  it('each challenge has 5-8 requirements', () => {
    for (const ch of LLD_CHALLENGES) {
      expect(ch.requirements.length).toBeGreaterThanOrEqual(5);
      expect(ch.requirements.length).toBeLessThanOrEqual(8);
    }
  });

  it('each requirement is a non-empty string', () => {
    for (const ch of LLD_CHALLENGES) {
      for (const req of ch.requirements) {
        expect(typeof req).toBe('string');
        expect(req.length).toBeGreaterThan(10);
      }
    }
  });

  // ── Key Patterns ──────────────────────────────────────────────

  it('each challenge has at least 1 key pattern', () => {
    for (const ch of LLD_CHALLENGES) {
      expect(ch.keyPatterns.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('key patterns are non-empty strings', () => {
    for (const ch of LLD_CHALLENGES) {
      for (const p of ch.keyPatterns) {
        expect(typeof p).toBe('string');
        expect(p.length).toBeGreaterThan(0);
      }
    }
  });

  it('common patterns appear across challenges', () => {
    const allPatterns = getAllLLDPatterns();
    expect(allPatterns).toContain('Strategy');
    expect(allPatterns).toContain('Composition');
  });

  // ── Starter Classes ───────────────────────────────────────────

  it('each challenge has 2-3 starter classes', () => {
    for (const ch of LLD_CHALLENGES) {
      expect(ch.starterClasses.length).toBeGreaterThanOrEqual(2);
      expect(ch.starterClasses.length).toBeLessThanOrEqual(3);
    }
  });

  it('starter class names are non-empty', () => {
    for (const ch of LLD_CHALLENGES) {
      for (const cls of ch.starterClasses) {
        expect(cls.length).toBeGreaterThan(0);
      }
    }
  });

  // ── Class Count ───────────────────────────────────────────────

  it('each challenge has a positive classCount', () => {
    for (const ch of LLD_CHALLENGES) {
      expect(ch.classCount).toBeGreaterThanOrEqual(5);
    }
  });

  // ── Difficulty Distribution ───────────────────────────────────

  it('each challenge has a valid difficulty (1-5)', () => {
    for (const ch of LLD_CHALLENGES) {
      expect(ch.difficulty).toBeGreaterThanOrEqual(1);
      expect(ch.difficulty).toBeLessThanOrEqual(5);
    }
  });

  it('difficulty 2 challenges exist', () => {
    const easy = getLLDChallengesByDifficulty(2);
    expect(easy.length).toBeGreaterThan(0);
  });

  it('difficulty 3 challenges exist', () => {
    const medium = getLLDChallengesByDifficulty(3);
    expect(medium.length).toBeGreaterThan(0);
  });

  it('difficulty 4 challenges exist', () => {
    const hard = getLLDChallengesByDifficulty(4);
    expect(hard.length).toBeGreaterThan(0);
  });

  // ── Other required fields ─────────────────────────────────────

  it('each challenge has a positive timeMinutes', () => {
    for (const ch of LLD_CHALLENGES) {
      expect(ch.timeMinutes).toBeGreaterThan(0);
    }
  });

  it('each challenge has at least 1 company', () => {
    for (const ch of LLD_CHALLENGES) {
      expect(ch.companies.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('each challenge has at least 3 hints', () => {
    for (const ch of LLD_CHALLENGES) {
      expect(ch.hints.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('each challenge has at least 1 concept', () => {
    for (const ch of LLD_CHALLENGES) {
      expect(ch.concepts.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('each challenge has a non-empty description', () => {
    for (const ch of LLD_CHALLENGES) {
      expect(ch.description.length).toBeGreaterThan(20);
    }
  });

  it('each challenge has a non-empty checklist', () => {
    for (const ch of LLD_CHALLENGES) {
      expect(ch.checklist.length).toBeGreaterThanOrEqual(5);
    }
  });

  // Expected challenge IDs
  const expectedIds = [
    'lld-parking-lot',
    'lld-library-management',
    'lld-elevator-system',
    'lld-vending-machine',
    'lld-chess-game',
    'lld-snake-game',
    'lld-movie-ticket-booking',
    'lld-atm-system',
    'lld-notification-service',
    'lld-rate-limiter',
  ];

  it.each(expectedIds)('contains challenge: %s', (id) => {
    const found = getLLDChallengeById(id);
    expect(found).toBeDefined();
    expect(found!.id).toBe(id);
  });
});

// ── Lookup Helpers ────────────────────────────────────────────────

describe('LLD Challenge lookup helpers', () => {
  it('getLLDChallengeById returns undefined for unknown id', () => {
    expect(getLLDChallengeById('nonexistent')).toBeUndefined();
  });

  it('getLLDChallengesByDifficulty filters correctly', () => {
    const easy = getLLDChallengesByDifficulty(2);
    for (const ch of easy) {
      expect(ch.difficulty).toBe(2);
    }
    expect(easy.length).toBeGreaterThan(0);
  });

  it('getAllLLDPatterns returns a sorted deduped list', () => {
    const patterns = getAllLLDPatterns();
    expect(patterns.length).toBeGreaterThan(0);
    // Should be sorted
    const sorted = [...patterns].sort();
    expect(patterns).toEqual(sorted);
    // Should have no duplicates
    expect(new Set(patterns).size).toBe(patterns.length);
  });
});

// ── LLD Challenges wired into main catalog ────────────────────────

describe('LLD Challenges in main CHALLENGES catalog', () => {
  it('main CHALLENGES array includes all LLD challenges', () => {
    for (const lldCh of LLD_CHALLENGES) {
      const found = CHALLENGES.find((c) => c.id === lldCh.id);
      expect(found).toBeDefined();
    }
  });

  it('no duplicate IDs in the combined CHALLENGES array', () => {
    const ids = CHALLENGES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ── Challenge Templates ───────────────────────────────────────────

describe('LLD Challenge Templates', () => {
  it('has exactly 10 templates (one per challenge)', () => {
    expect(LLD_CHALLENGE_TEMPLATES).toHaveLength(10);
  });

  it('each template maps to an existing LLD challenge', () => {
    for (const tmpl of LLD_CHALLENGE_TEMPLATES) {
      const ch = getLLDChallengeById(tmpl.challengeId);
      expect(ch).toBeDefined();
    }
  });

  it('each template has 2-3 starter classes', () => {
    for (const tmpl of LLD_CHALLENGE_TEMPLATES) {
      expect(tmpl.starterClasses.length).toBeGreaterThanOrEqual(2);
      expect(tmpl.starterClasses.length).toBeLessThanOrEqual(3);
    }
  });

  it('each template has at least 1 hint relationship', () => {
    for (const tmpl of LLD_CHALLENGE_TEMPLATES) {
      expect(tmpl.hintRelationships.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('each starter class has valid UML structure', () => {
    for (const tmpl of LLD_CHALLENGE_TEMPLATES) {
      for (const cls of tmpl.starterClasses) {
        expect(cls.id).toBeTruthy();
        expect(cls.name).toBeTruthy();
        expect(['class', 'interface', 'abstract', 'enum']).toContain(cls.stereotype);
        expect(typeof cls.x).toBe('number');
        expect(typeof cls.y).toBe('number');
        expect(Array.isArray(cls.attributes)).toBe(true);
        expect(Array.isArray(cls.methods)).toBe(true);
      }
    }
  });

  it('each hint relationship references valid source/target IDs within its template', () => {
    for (const tmpl of LLD_CHALLENGE_TEMPLATES) {
      const classIds = new Set(tmpl.starterClasses.map((c) => c.id));
      for (const rel of tmpl.hintRelationships) {
        expect(classIds.has(rel.source)).toBe(true);
        expect(classIds.has(rel.target)).toBe(true);
      }
    }
  });

  it('getTemplateForChallenge returns correct template', () => {
    const tmpl = getTemplateForChallenge('lld-parking-lot');
    expect(tmpl).toBeDefined();
    expect(tmpl!.challengeId).toBe('lld-parking-lot');
  });

  it('getTemplateForChallenge returns undefined for unknown id', () => {
    expect(getTemplateForChallenge('nonexistent')).toBeUndefined();
  });
});

// ── Walkthroughs ──────────────────────────────────────────────────

describe('Walkthroughs', () => {
  it('has 3 walkthroughs (Parking Lot, Library, Elevator)', () => {
    expect(WALKTHROUGHS).toHaveLength(3);
  });

  const expectedWalkthroughs = [
    'lld-parking-lot',
    'lld-library-management',
    'lld-elevator-system',
  ];

  it.each(expectedWalkthroughs)('has walkthrough for %s', (id) => {
    const wt = getWalkthroughForChallenge(id);
    expect(wt).toBeDefined();
    expect(wt!.challengeId).toBe(id);
  });

  it('each walkthrough has at least 5 steps', () => {
    for (const wt of WALKTHROUGHS) {
      expect(wt.steps.length).toBeGreaterThanOrEqual(5);
    }
  });

  it('each step has a valid action', () => {
    const validActions = ['add-class', 'add-attribute', 'add-relationship', 'explain-pattern'];
    for (const wt of WALKTHROUGHS) {
      for (const step of wt.steps) {
        expect(validActions).toContain(step.action);
      }
    }
  });

  it('each step has non-empty instruction and explanation', () => {
    for (const wt of WALKTHROUGHS) {
      for (const step of wt.steps) {
        expect(step.instruction.length).toBeGreaterThan(5);
        expect(step.explanation.length).toBeGreaterThan(20);
      }
    }
  });

  it('each walkthrough maps to an existing LLD challenge', () => {
    for (const wt of WALKTHROUGHS) {
      const ch = getLLDChallengeById(wt.challengeId);
      expect(ch).toBeDefined();
    }
  });

  it('getWalkthroughForChallenge returns undefined for unknown id', () => {
    expect(getWalkthroughForChallenge('nonexistent')).toBeUndefined();
  });
});
