import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CommandBus } from '../command-bus';
import type { Command, CommandHandler } from '../types';

function makeCommand<T>(type: string, payload: T): Command<T> {
  return { type, payload, timestamp: Date.now() };
}

describe('CommandBus', () => {
  let bus: CommandBus;

  beforeEach(() => {
    bus = new CommandBus();
  });

  // ── register + dispatch ──────────────────────────────────

  it('dispatches a command to the registered handler', async () => {
    const handler = vi.fn<CommandHandler<{ value: number }>>();
    bus.register('TEST', handler);

    const cmd = makeCommand('TEST', { value: 42 });
    await bus.dispatch(cmd);

    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith(cmd);
  });

  it('supports async handlers', async () => {
    const order: string[] = [];

    const handler: CommandHandler<string> = async (cmd) => {
      await Promise.resolve();
      order.push(cmd.payload);
    };

    bus.register('ASYNC', handler);
    await bus.dispatch(makeCommand('ASYNC', 'hello'));

    expect(order).toEqual(['hello']);
  });

  // ── dispatch without handler ─────────────────────────────

  it('throws when no handler is registered for the command type', async () => {
    const cmd = makeCommand('MISSING', {});

    await expect(bus.dispatch(cmd)).rejects.toThrow(
      'no handler registered for command type "MISSING"',
    );
  });

  // ── command history ──────────────────────────────────────

  it('records dispatched commands in history', async () => {
    bus.register('A', vi.fn());
    bus.register('B', vi.fn());

    const cmd1 = makeCommand('A', 'first');
    const cmd2 = makeCommand('B', 'second');

    await bus.dispatch(cmd1);
    await bus.dispatch(cmd2);

    expect(bus.history).toHaveLength(2);
    expect(bus.history[0]).toBe(cmd1);
    expect(bus.history[1]).toBe(cmd2);
  });

  it('records the command in history even if the handler throws', async () => {
    bus.register('FAIL', () => {
      throw new Error('handler error');
    });

    const cmd = makeCommand('FAIL', {});

    await expect(bus.dispatch(cmd)).rejects.toThrow('handler error');
    expect(bus.history).toHaveLength(1);
    expect(bus.history[0]).toBe(cmd);
  });

  it('trims history to the maximum size', async () => {
    bus.register('BULK', vi.fn());

    // Dispatch 250 commands (max is 200)
    for (let i = 0; i < 250; i++) {
      await bus.dispatch(makeCommand('BULK', i));
    }

    expect(bus.history.length).toBeLessThanOrEqual(200);
    // Most recent command should be the last one dispatched
    const last = bus.history[bus.history.length - 1] as Command<number>;
    expect(last.payload).toBe(249);
  });

  // ── unregister ───────────────────────────────────────────

  it('unregister removes the handler so dispatch throws', async () => {
    bus.register('TEMP', vi.fn());

    expect(bus.hasHandler('TEMP')).toBe(true);

    const removed = bus.unregister('TEMP');
    expect(removed).toBe(true);
    expect(bus.hasHandler('TEMP')).toBe(false);

    await expect(
      bus.dispatch(makeCommand('TEMP', {})),
    ).rejects.toThrow('no handler registered');
  });

  it('unregister returns false for non-existent type', () => {
    expect(bus.unregister('NOPE')).toBe(false);
  });

  // ── replace handler ──────────────────────────────────────

  it('registering the same type replaces the previous handler', async () => {
    const first = vi.fn();
    const second = vi.fn();

    bus.register('REPLACE', first);
    bus.register('REPLACE', second);

    await bus.dispatch(makeCommand('REPLACE', 'data'));

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledOnce();
  });

  // ── reset ────────────────────────────────────────────────

  it('reset clears all handlers and history', async () => {
    bus.register('X', vi.fn());
    await bus.dispatch(makeCommand('X', null));

    expect(bus.history).toHaveLength(1);
    expect(bus.hasHandler('X')).toBe(true);

    bus.reset();

    expect(bus.history).toHaveLength(0);
    expect(bus.hasHandler('X')).toBe(false);
  });
});
