import { describe, it, expect } from 'vitest';
import {
  WAR_STORIES,
  WAR_STORY_LIST,
  getStoryById,
  getStoriesBySeverity,
  SEVERITY_CONFIG,
  EVENT_TYPE_CONFIG,
} from '../war-stories';
import type {
  WarStory,
  IncidentSeverity,
  TimelineEventType,
} from '../war-stories';

// ---------------------------------------------------------------------------
// War Stories – data completeness
// ---------------------------------------------------------------------------

describe('War Stories – data completeness', () => {
  it('has exactly 12 stories in WAR_STORY_LIST', () => {
    expect(WAR_STORY_LIST).toHaveLength(12);
  });

  it('WAR_STORIES record has 12 entries keyed by id', () => {
    expect(Object.keys(WAR_STORIES)).toHaveLength(12);
  });

  it('WAR_STORY_LIST and WAR_STORIES contain the same stories', () => {
    for (const story of WAR_STORY_LIST) {
      expect(WAR_STORIES[story.id]).toBeDefined();
      expect(WAR_STORIES[story.id].title).toBe(story.title);
    }
  });

  it('all stories have unique IDs', () => {
    const ids = WAR_STORY_LIST.map((s) => s.id);
    expect(new Set(ids).size).toBe(12);
  });

  // ── Timeline ──────────────────────────────────────────────────

  it('each story has a non-empty timeline', () => {
    for (const story of WAR_STORY_LIST) {
      expect(story.timeline.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('timeline events have required fields', () => {
    for (const story of WAR_STORY_LIST) {
      for (const event of story.timeline) {
        expect(typeof event.minutesOffset).toBe('number');
        expect(event.minutesOffset).toBeGreaterThanOrEqual(0);
        expect(event.label.length).toBeGreaterThan(0);
        expect(event.description.length).toBeGreaterThan(10);
        expect(event.type).toBeTruthy();
      }
    }
  });

  it('timeline events are in chronological order', () => {
    for (const story of WAR_STORY_LIST) {
      for (let i = 1; i < story.timeline.length; i++) {
        expect(story.timeline[i].minutesOffset).toBeGreaterThanOrEqual(
          story.timeline[i - 1].minutesOffset,
        );
      }
    }
  });

  // ── Architecture ──────────────────────────────────────────────

  it('each story has architecture with nodes and edges', () => {
    for (const story of WAR_STORY_LIST) {
      expect(story.architecture.nodes.length).toBeGreaterThanOrEqual(2);
      expect(story.architecture.edges.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('architecture nodes have required fields', () => {
    for (const story of WAR_STORY_LIST) {
      for (const node of story.architecture.nodes) {
        expect(node.id).toBeTruthy();
        expect(node.label).toBeTruthy();
        expect(node.kind).toBeTruthy();
        expect(typeof node.x).toBe('number');
        expect(typeof node.y).toBe('number');
        expect(typeof node.failsAtMinute).toBe('number');
      }
    }
  });

  it('architecture edges reference valid node IDs', () => {
    for (const story of WAR_STORY_LIST) {
      const nodeIds = new Set(story.architecture.nodes.map((n) => n.id));
      for (const edge of story.architecture.edges) {
        expect(nodeIds.has(edge.from)).toBe(true);
        expect(nodeIds.has(edge.to)).toBe(true);
      }
    }
  });

  // ── Lessons & Prevention ──────────────────────────────────────

  it('each story has lessons learned', () => {
    for (const story of WAR_STORY_LIST) {
      expect(story.lessonsLearned.length).toBeGreaterThanOrEqual(2);
      for (const lesson of story.lessonsLearned) {
        expect(lesson.length).toBeGreaterThan(10);
      }
    }
  });

  it('each story has prevention strategies', () => {
    for (const story of WAR_STORY_LIST) {
      expect(story.preventionStrategies.length).toBeGreaterThanOrEqual(2);
      for (const strategy of story.preventionStrategies) {
        expect(strategy.length).toBeGreaterThan(10);
      }
    }
  });

  it('each story has impact metrics', () => {
    for (const story of WAR_STORY_LIST) {
      expect(story.impactMetrics.revenueLost).toBeTruthy();
      expect(story.impactMetrics.usersAffected).toBeTruthy();
      expect(story.impactMetrics.downtime).toBeTruthy();
      expect(typeof story.impactMetrics.slaBreach).toBe('boolean');
    }
  });

  it('each story has related concepts', () => {
    for (const story of WAR_STORY_LIST) {
      expect(story.relatedConcepts.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('each story has a root cause description', () => {
    for (const story of WAR_STORY_LIST) {
      expect(story.rootCause.length).toBeGreaterThan(50);
    }
  });
});

// ---------------------------------------------------------------------------
// Severity config
// ---------------------------------------------------------------------------

describe('War Stories – severity config', () => {
  const severities: IncidentSeverity[] = ['critical', 'high', 'medium'];

  it('SEVERITY_CONFIG has all three severity levels', () => {
    for (const sev of severities) {
      expect(SEVERITY_CONFIG[sev]).toBeDefined();
    }
  });

  it('each severity config has color, bg, border, and label', () => {
    for (const sev of severities) {
      const config = SEVERITY_CONFIG[sev];
      expect(config.color).toBeTruthy();
      expect(config.bg).toBeTruthy();
      expect(config.border).toBeTruthy();
      expect(config.label).toBeTruthy();
    }
  });

  it('every story severity is covered by SEVERITY_CONFIG', () => {
    for (const story of WAR_STORY_LIST) {
      expect(SEVERITY_CONFIG[story.severity]).toBeDefined();
    }
  });
});

// ---------------------------------------------------------------------------
// Event type config
// ---------------------------------------------------------------------------

describe('War Stories – event type config', () => {
  const eventTypes: TimelineEventType[] = [
    'trigger', 'detection', 'alert', 'escalation',
    'investigation', 'mitigation', 'fix', 'postmortem',
  ];

  it('EVENT_TYPE_CONFIG has all 8 event types', () => {
    for (const t of eventTypes) {
      expect(EVENT_TYPE_CONFIG[t]).toBeDefined();
    }
  });

  it('each event type config has color, icon, and label', () => {
    for (const t of eventTypes) {
      const config = EVENT_TYPE_CONFIG[t];
      expect(config.color).toBeTruthy();
      expect(config.icon).toBeTruthy();
      expect(config.label).toBeTruthy();
    }
  });

  it('every timeline event type used in stories is configured', () => {
    for (const story of WAR_STORY_LIST) {
      for (const event of story.timeline) {
        expect(EVENT_TYPE_CONFIG[event.type]).toBeDefined();
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

describe('War Stories – lookup helpers', () => {
  it('getStoryById returns correct story', () => {
    const story = getStoryById('black-friday-meltdown');
    expect(story).toBeDefined();
    expect(story!.title).toBe('The Black Friday Meltdown');
  });

  it('getStoryById returns undefined for unknown id', () => {
    expect(getStoryById('nonexistent')).toBeUndefined();
  });

  it('getStoriesBySeverity groups all 12 stories', () => {
    const grouped = getStoriesBySeverity();
    const total = grouped.critical.length + grouped.high.length + grouped.medium.length;
    expect(total).toBe(12);
  });

  it('getStoriesBySeverity has at least one story per severity', () => {
    const grouped = getStoriesBySeverity();
    expect(grouped.critical.length).toBeGreaterThan(0);
    expect(grouped.high.length).toBeGreaterThan(0);
    expect(grouped.medium.length).toBeGreaterThan(0);
  });

  it('getStoriesBySeverity entries have correct severity', () => {
    const grouped = getStoriesBySeverity();
    for (const s of grouped.critical) expect(s.severity).toBe('critical');
    for (const s of grouped.high) expect(s.severity).toBe('high');
    for (const s of grouped.medium) expect(s.severity).toBe('medium');
  });
});
