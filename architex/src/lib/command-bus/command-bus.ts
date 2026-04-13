/**
 * Command Bus — Central Dispatcher
 *
 * Maintains a typed handler registry and dispatches commands to the
 * appropriate handler. Keeps a rolling history of the last N commands
 * for debugging.
 *
 * This class runs outside React. Handlers access stores via
 * `useXxxStore.getState()`.
 */

import type { Command, CommandHandler } from './types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Maximum number of commands to keep in the history ring buffer. */
const MAX_HISTORY = 200;

// ---------------------------------------------------------------------------
// CommandBus
// ---------------------------------------------------------------------------

export class CommandBus {
  /** Map from command type string to its handler function. */
  private handlers = new Map<string, CommandHandler<unknown>>();

  /** Rolling history of dispatched commands (most recent last). */
  private _history: Command[] = [];

  // -----------------------------------------------------------------------
  // Registration
  // -----------------------------------------------------------------------

  /**
   * Register a handler for a specific command type.
   *
   * Only one handler per type is supported. Registering a second handler
   * for the same type silently replaces the previous one.
   *
   * @param type    - The command type string (e.g. 'LOAD_TEMPLATE')
   * @param handler - Function to execute when a command of this type is dispatched
   */
  register<T>(type: string, handler: CommandHandler<T>): void {
    this.handlers.set(type, handler as CommandHandler<unknown>);
  }

  /**
   * Remove the handler for a specific command type.
   *
   * @param type - The command type string to unregister
   * @returns True if a handler was found and removed, false otherwise
   */
  unregister(type: string): boolean {
    return this.handlers.delete(type);
  }

  // -----------------------------------------------------------------------
  // Dispatch
  // -----------------------------------------------------------------------

  /**
   * Dispatch a command to its registered handler.
   *
   * @param command - The command to dispatch
   * @throws Error if no handler is registered for the command type
   */
  async dispatch<T>(command: Command<T>): Promise<void> {
    const handler = this.handlers.get(command.type);

    if (!handler) {
      throw new Error(
        `CommandBus: no handler registered for command type "${command.type}"`,
      );
    }

    // Record in history before executing (so history reflects intent even if handler throws)
    this._history.push(command as Command);
    if (this._history.length > MAX_HISTORY) {
      this._history = this._history.slice(-MAX_HISTORY);
    }

    await handler(command as Command<unknown>);
  }

  // -----------------------------------------------------------------------
  // Introspection
  // -----------------------------------------------------------------------

  /** Get the command history (most recent last). */
  get history(): ReadonlyArray<Command> {
    return this._history;
  }

  /** Check whether a handler is registered for a given command type. */
  hasHandler(type: string): boolean {
    return this.handlers.has(type);
  }

  /** Clear all handlers and history. Useful for testing. */
  reset(): void {
    this.handlers.clear();
    this._history = [];
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

/** Shared command bus singleton used across the application. */
export const commandBus = new CommandBus();
