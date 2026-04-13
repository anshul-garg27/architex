import { describe, it, expect } from 'vitest';
import {
  migrate,
  LATEST_VERSION,
  registerMigration,
} from '../migration';
import type { SerializedProject } from '../migration';

// ── Helpers ──────────────────────────────────────────────────

function makeProject(
  version: number,
  data: Record<string, unknown> = {},
  overrides: Partial<SerializedProject> = {},
): SerializedProject {
  return {
    version,
    projectId: 'test-project',
    name: 'Test',
    savedAt: new Date().toISOString(),
    data: {
      canvas: { nodes: [], edges: [] },
      ...data,
    },
    ...overrides,
  };
}

// ── v1 -> v2 -> v3 chain ────────────────────────────────────

describe('Migration chain: v1 -> v2 -> v3', () => {
  it('migrates v1 project all the way to latest version', () => {
    const v1 = makeProject(1);
    const result = migrate(v1);
    expect(result.version).toBe(LATEST_VERSION);
  });

  it('v1 -> v2 adds settings with default autoSave fields', () => {
    const v1 = makeProject(1);
    const result = migrate(v1);
    const settings = result.data.settings as Record<string, unknown>;
    expect(settings).toBeDefined();
    expect(settings.autoSaveEnabled).toBe(true);
    expect(settings.autoSaveIntervalMs).toBe(2000);
  });

  it('v2 -> v3 normalises canvas.groups to an array', () => {
    const v2 = makeProject(2, {
      canvas: { nodes: [], edges: [] },
      settings: { autoSaveEnabled: true, autoSaveIntervalMs: 2000 },
    });
    const result = migrate(v2);
    const canvas = result.data.canvas as Record<string, unknown>;
    expect(Array.isArray(canvas.groups)).toBe(true);
  });

  it('v2 -> v3 preserves existing groups array', () => {
    const v2 = makeProject(2, {
      canvas: {
        nodes: [],
        edges: [],
        groups: [{ id: 'g1', label: 'Group A' }],
      },
      settings: { autoSaveEnabled: true, autoSaveIntervalMs: 2000 },
    });
    const result = migrate(v2);
    const canvas = result.data.canvas as Record<string, unknown>;
    expect(canvas.groups).toEqual([{ id: 'g1', label: 'Group A' }]);
  });

  it('full chain preserves projectId through all migrations', () => {
    const v1 = makeProject(1, {}, { projectId: 'my-id-123' });
    const result = migrate(v1);
    expect(result.projectId).toBe('my-id-123');
  });

  it('full chain preserves project name through all migrations', () => {
    const v1 = makeProject(1, {}, { name: 'Important Design' });
    const result = migrate(v1);
    expect(result.name).toBe('Important Design');
  });

  it('full chain preserves savedAt through all migrations', () => {
    const savedAt = '2025-06-15T12:00:00.000Z';
    const v1 = makeProject(1, {}, { savedAt });
    const result = migrate(v1);
    expect(result.savedAt).toBe(savedAt);
  });
});

// ── Already-current version (no-op) ─────────────────────────

describe('Migration: already-current version', () => {
  it('returns same version when already at LATEST_VERSION', () => {
    const latest = makeProject(LATEST_VERSION, {
      canvas: { nodes: [], edges: [], groups: [] },
      settings: { autoSaveEnabled: true, autoSaveIntervalMs: 2000 },
    });
    const result = migrate(latest);
    expect(result.version).toBe(LATEST_VERSION);
  });

  it('data is structurally identical when already at latest', () => {
    const data = {
      canvas: { nodes: [{ id: 'n1' }], edges: [], groups: ['g'] },
      settings: { autoSaveEnabled: false, autoSaveIntervalMs: 5000 },
      customField: 'preserved',
    };
    const latest = makeProject(LATEST_VERSION, data);
    const result = migrate(latest);
    expect(result.data).toEqual(data);
  });
});

// ── Malformed data handling ──────────────────────────────────

describe('Migration: malformed data', () => {
  it('handles v1 project with no canvas field', () => {
    const v1: SerializedProject = {
      version: 1,
      projectId: 'test',
      name: 'No Canvas',
      savedAt: new Date().toISOString(),
      data: {},
    };
    const result = migrate(v1);
    expect(result.version).toBe(LATEST_VERSION);
    // Settings should still be added
    expect(result.data.settings).toBeDefined();
  });

  it('handles v2 project with null canvas', () => {
    const v2: SerializedProject = {
      version: 2,
      projectId: 'test',
      name: 'Null Canvas',
      savedAt: new Date().toISOString(),
      data: {
        canvas: null as unknown as Record<string, unknown>,
        settings: { autoSaveEnabled: true, autoSaveIntervalMs: 2000 },
      },
    };
    const result = migrate(v2);
    const canvas = result.data.canvas as Record<string, unknown>;
    expect(Array.isArray(canvas.groups)).toBe(true);
  });

  it('handles v2 project where canvas.groups is not an array', () => {
    const v2 = makeProject(2, {
      canvas: { nodes: [], edges: [], groups: 'not-an-array' },
      settings: { autoSaveEnabled: true, autoSaveIntervalMs: 2000 },
    });
    const result = migrate(v2);
    const canvas = result.data.canvas as Record<string, unknown>;
    expect(Array.isArray(canvas.groups)).toBe(true);
    expect(canvas.groups).toEqual([]);
  });
});

// ── Preserve unrelated fields ────────────────────────────────

describe('Migration: preserves unrelated fields', () => {
  it('v1 -> v2 preserves custom data fields', () => {
    const v1 = makeProject(1, {
      canvas: { nodes: [], edges: [] },
      myCustomPlugin: { enabled: true, count: 42 },
    });
    const result = migrate(v1);
    expect(result.data.myCustomPlugin).toEqual({ enabled: true, count: 42 });
  });

  it('v2 -> v3 preserves canvas.nodes and canvas.edges', () => {
    const v2 = makeProject(2, {
      canvas: {
        nodes: [{ id: 'n1', type: 'test' }],
        edges: [{ id: 'e1', source: 'n1', target: 'n2' }],
      },
      settings: { autoSaveEnabled: true, autoSaveIntervalMs: 2000 },
    });
    const result = migrate(v2);
    const canvas = result.data.canvas as Record<string, unknown>;
    expect(canvas.nodes).toEqual([{ id: 'n1', type: 'test' }]);
    expect(canvas.edges).toEqual([{ id: 'e1', source: 'n1', target: 'n2' }]);
  });

  it('v1 -> v2 preserves existing settings fields', () => {
    const v1 = makeProject(1, {
      canvas: { nodes: [], edges: [] },
      settings: { customSetting: 'hello' },
    });
    const result = migrate(v1);
    const settings = result.data.settings as Record<string, unknown>;
    expect(settings.customSetting).toBe('hello');
    expect(settings.autoSaveEnabled).toBe(true);
  });

  it('never mutates the original project object', () => {
    const v1 = makeProject(1);
    const original = JSON.parse(JSON.stringify(v1)) as SerializedProject;
    migrate(v1);
    expect(v1).toEqual(original);
  });
});

// ── registerMigration ────────────────────────────────────────

describe('registerMigration', () => {
  it('adds a custom migration that runs in the chain', () => {
    // Register v3 -> v4 migration
    registerMigration(3, (old) => ({
      ...old,
      version: 4,
      data: {
        ...old.data,
        newFeature: { enabled: true },
      },
    }));

    const v3 = makeProject(3, {
      canvas: { nodes: [], edges: [], groups: [] },
      settings: { autoSaveEnabled: true, autoSaveIntervalMs: 2000 },
    });
    const result = migrate(v3);

    expect(result.version).toBe(4);
    expect(result.data.newFeature).toEqual({ enabled: true });
  });

  it('custom migration runs after built-in migrations', () => {
    // The v3->v4 migration registered above should also apply to v1 projects
    const v1 = makeProject(1);
    const result = migrate(v1);

    // Should have gone through v1->v2->v3->v4
    expect(result.version).toBe(4);
    expect(result.data.settings).toBeDefined();
    const canvas = result.data.canvas as Record<string, unknown>;
    expect(Array.isArray(canvas.groups)).toBe(true);
    expect(result.data.newFeature).toEqual({ enabled: true });
  });
});
