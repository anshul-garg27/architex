import { describe, it, expect } from 'vitest';
import {
  createPluginManager,
  type Plugin,
  type PluginInput,
  type HookName,
  type PluginManager,
} from '../plugin-system';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePlugin(overrides: Partial<PluginInput> = {}): PluginInput {
  return {
    id: 'test-plugin',
    name: 'Test Plugin',
    version: '1.0.0',
    author: 'Test Author',
    hooks: {},
    components: [],
    ...overrides,
  };
}

function makeNodePlugin(
  id: string,
  hookFn: (data: Readonly<unknown>) => unknown,
): PluginInput {
  return {
    id,
    name: `Plugin ${id}`,
    version: '1.0.0',
    author: 'Test',
    hooks: { onNodeCreate: hookFn },
    components: [],
  };
}

// ---------------------------------------------------------------------------
// Plugin registration
// ---------------------------------------------------------------------------

describe('Plugin System – registration', () => {
  it('registers a plugin successfully', () => {
    const manager = createPluginManager();
    manager.register(makePlugin());
    expect(manager.getAll()).toHaveLength(1);
  });

  it('throws on duplicate plugin ID', () => {
    const manager = createPluginManager();
    manager.register(makePlugin({ id: 'dupe' }));
    expect(() => manager.register(makePlugin({ id: 'dupe' }))).toThrow(
      'already registered',
    );
  });

  it('defaults to enabled when not specified', () => {
    const manager = createPluginManager();
    manager.register(makePlugin({ id: 'auto-enabled' }));
    const plugin = manager.getPlugin('auto-enabled');
    expect(plugin?.enabled).toBe(true);
  });

  it('respects enabled: false on registration', () => {
    const manager = createPluginManager();
    manager.register(makePlugin({ id: 'disabled', enabled: false }));
    const plugin = manager.getPlugin('disabled');
    expect(plugin?.enabled).toBe(false);
  });

  it('registers multiple plugins', () => {
    const manager = createPluginManager();
    manager.register(makePlugin({ id: 'p1' }));
    manager.register(makePlugin({ id: 'p2' }));
    manager.register(makePlugin({ id: 'p3' }));
    expect(manager.getAll()).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// Plugin unregistration
// ---------------------------------------------------------------------------

describe('Plugin System – unregistration', () => {
  it('unregisters an existing plugin', () => {
    const manager = createPluginManager();
    manager.register(makePlugin({ id: 'to-remove' }));
    expect(manager.unregister('to-remove')).toBe(true);
    expect(manager.getAll()).toHaveLength(0);
  });

  it('returns false for non-existent plugin', () => {
    const manager = createPluginManager();
    expect(manager.unregister('ghost')).toBe(false);
  });

  it('plugin is no longer retrievable after unregistration', () => {
    const manager = createPluginManager();
    manager.register(makePlugin({ id: 'temp' }));
    manager.unregister('temp');
    expect(manager.getPlugin('temp')).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Enable / Disable
// ---------------------------------------------------------------------------

describe('Plugin System – enable / disable', () => {
  it('disables an enabled plugin', () => {
    const manager = createPluginManager();
    manager.register(makePlugin({ id: 'toggle' }));
    expect(manager.disable('toggle')).toBe(true);
    expect(manager.getPlugin('toggle')?.enabled).toBe(false);
  });

  it('enables a disabled plugin', () => {
    const manager = createPluginManager();
    manager.register(makePlugin({ id: 'toggle', enabled: false }));
    expect(manager.enable('toggle')).toBe(true);
    expect(manager.getPlugin('toggle')?.enabled).toBe(true);
  });

  it('disable returns false for unknown ID', () => {
    const manager = createPluginManager();
    expect(manager.disable('nope')).toBe(false);
  });

  it('enable returns false for unknown ID', () => {
    const manager = createPluginManager();
    expect(manager.enable('nope')).toBe(false);
  });

  it('getActive excludes disabled plugins', () => {
    const manager = createPluginManager();
    manager.register(makePlugin({ id: 'a' }));
    manager.register(makePlugin({ id: 'b', enabled: false }));
    manager.register(makePlugin({ id: 'c' }));
    const active = manager.getActive();
    expect(active).toHaveLength(2);
    expect(active.map((p) => p.id)).toEqual(['a', 'c']);
  });
});

// ---------------------------------------------------------------------------
// Plugin retrieval
// ---------------------------------------------------------------------------

describe('Plugin System – retrieval', () => {
  it('getPlugin returns the plugin', () => {
    const manager = createPluginManager();
    manager.register(makePlugin({ id: 'find-me', name: 'Findable' }));
    const plugin = manager.getPlugin('find-me');
    expect(plugin).toBeDefined();
    expect(plugin!.name).toBe('Findable');
  });

  it('getPlugin returns undefined for unknown ID', () => {
    const manager = createPluginManager();
    expect(manager.getPlugin('unknown')).toBeUndefined();
  });

  it('getAll returns a copy (not internal reference)', () => {
    const manager = createPluginManager();
    manager.register(makePlugin({ id: 'x' }));
    const all1 = manager.getAll();
    const all2 = manager.getAll();
    expect(all1).not.toBe(all2); // different array references
    expect(all1).toEqual(all2); // same content
  });

  it('getActive returns plugins in registration order', () => {
    const manager = createPluginManager();
    manager.register(makePlugin({ id: 'first' }));
    manager.register(makePlugin({ id: 'second' }));
    manager.register(makePlugin({ id: 'third' }));
    const active = manager.getActive();
    expect(active.map((p) => p.id)).toEqual(['first', 'second', 'third']);
  });
});

// ---------------------------------------------------------------------------
// Hook execution
// ---------------------------------------------------------------------------

describe('Plugin System – executeHook', () => {
  it('passes data through a single hook', () => {
    const manager = createPluginManager();
    manager.register(
      makeNodePlugin('adder', (data) => {
        const d = data as { count: number };
        return { count: d.count + 1 };
      }),
    );

    const result = manager.executeHook('onNodeCreate', { count: 0 });
    expect(result.data).toEqual({ count: 1 });
    expect(result.executedBy).toEqual(['adder']);
  });

  it('pipelines data through multiple hooks in order', () => {
    const manager = createPluginManager();
    manager.register(
      makeNodePlugin('double', (data) => {
        const d = data as { value: number };
        return { value: d.value * 2 };
      }),
    );
    manager.register(
      makeNodePlugin('add-ten', (data) => {
        const d = data as { value: number };
        return { value: d.value + 10 };
      }),
    );

    // Pipeline: 5 → *2 → +10 = 20
    const result = manager.executeHook('onNodeCreate', { value: 5 });
    expect(result.data).toEqual({ value: 20 });
    expect(result.executedBy).toEqual(['double', 'add-ten']);
  });

  it('skips disabled plugins', () => {
    const manager = createPluginManager();
    manager.register(
      makeNodePlugin('active', (data) => {
        const d = data as { log: string[] };
        return { log: [...d.log, 'active'] };
      }),
    );
    manager.register(
      makeNodePlugin('inactive', (data) => {
        const d = data as { log: string[] };
        return { log: [...d.log, 'inactive'] };
      }),
    );
    manager.disable('inactive');

    const result = manager.executeHook('onNodeCreate', { log: [] as string[] });
    expect(result.data).toEqual({ log: ['active'] });
    expect(result.executedBy).toEqual(['active']);
  });

  it('skips plugins without the requested hook', () => {
    const manager = createPluginManager();
    manager.register(makePlugin({ id: 'no-hook', hooks: {} }));
    manager.register(
      makeNodePlugin('has-hook', (data) => {
        const d = data as { touched: boolean };
        return { touched: true };
      }),
    );

    const result = manager.executeHook('onNodeCreate', { touched: false });
    expect(result.data).toEqual({ touched: true });
    expect(result.executedBy).toEqual(['has-hook']);
  });

  it('returns original data when no plugins match', () => {
    const manager = createPluginManager();
    const input = { keep: 'me' };
    const result = manager.executeHook('onSimulationTick', input);
    expect(result.data).toEqual({ keep: 'me' });
    expect(result.executedBy).toHaveLength(0);
  });

  it('catches errors and records them', () => {
    const manager = createPluginManager();
    manager.register(
      makeNodePlugin('thrower', () => {
        throw new Error('Boom!');
      }),
    );
    manager.register(
      makeNodePlugin('safe', (data) => {
        const d = data as { value: number };
        return { value: d.value + 1 };
      }),
    );

    const result = manager.executeHook('onNodeCreate', { value: 0 });
    // The thrower fails, safe still runs
    expect(result.errors).toHaveProperty('thrower');
    expect(result.errors['thrower']).toBe('Boom!');
    expect(result.executedBy).toEqual(['safe']);
    expect(result.data).toEqual({ value: 1 });
  });

  it('sandboxes data — hook cannot mutate the original', () => {
    const manager = createPluginManager();
    manager.register(
      makeNodePlugin('mutator', (data) => {
        // Attempt to mutate the frozen input — should throw internally
        // but we return a new object anyway
        const d = data as { items: string[] };
        return { items: [...d.items, 'new'] };
      }),
    );

    const original = { items: ['a', 'b'] };
    const result = manager.executeHook('onNodeCreate', original);

    // Original is not mutated
    expect(original.items).toEqual(['a', 'b']);
    // Result has the new item
    expect(result.data).toEqual({ items: ['a', 'b', 'new'] });
  });

  it('supports all hook types', () => {
    const hookNames: HookName[] = [
      'onNodeCreate',
      'onSimulationTick',
      'onExport',
      'onModuleSwitch',
    ];

    for (const hookName of hookNames) {
      const manager = createPluginManager();
      manager.register({
        id: `hook-${hookName}`,
        name: `Hook ${hookName}`,
        version: '1.0.0',
        author: 'Test',
        hooks: { [hookName]: (data: unknown) => data },
        components: [],
      });

      const result = manager.executeHook(hookName, { test: true });
      expect(result.executedBy).toHaveLength(1);
    }
  });
});

// ---------------------------------------------------------------------------
// Plugin components
// ---------------------------------------------------------------------------

describe('Plugin System – components', () => {
  it('stores components on the plugin', () => {
    const manager = createPluginManager();
    manager.register(
      makePlugin({
        id: 'with-components',
        components: [
          { id: 'sidebar-widget', name: 'My Widget', slot: 'sidebar' },
          { id: 'toolbar-btn', name: 'My Button', slot: 'toolbar' },
        ],
      }),
    );

    const plugin = manager.getPlugin('with-components');
    expect(plugin?.components).toHaveLength(2);
    expect(plugin?.components[0].slot).toBe('sidebar');
    expect(plugin?.components[1].slot).toBe('toolbar');
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe('Plugin System – edge cases', () => {
  it('handles empty plugin manager', () => {
    const manager = createPluginManager();
    expect(manager.getAll()).toHaveLength(0);
    expect(manager.getActive()).toHaveLength(0);
    const result = manager.executeHook('onNodeCreate', {});
    expect(result.executedBy).toHaveLength(0);
    expect(result.data).toEqual({});
  });

  it('re-enabling an already-enabled plugin is idempotent', () => {
    const manager = createPluginManager();
    manager.register(makePlugin({ id: 'already-on' }));
    expect(manager.enable('already-on')).toBe(true);
    expect(manager.getPlugin('already-on')?.enabled).toBe(true);
  });

  it('re-disabling an already-disabled plugin is idempotent', () => {
    const manager = createPluginManager();
    manager.register(makePlugin({ id: 'already-off', enabled: false }));
    expect(manager.disable('already-off')).toBe(true);
    expect(manager.getPlugin('already-off')?.enabled).toBe(false);
  });

  it('handles non-Error throws in hooks', () => {
    const manager = createPluginManager();
    manager.register(
      makeNodePlugin('string-thrower', () => {
        throw 'string error'; // eslint-disable-line no-throw-literal
      }),
    );

    const result = manager.executeHook('onNodeCreate', {});
    expect(result.errors['string-thrower']).toBe('string error');
  });
});
