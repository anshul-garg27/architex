/**
 * useCommandBus — React hook for the command bus singleton.
 *
 * Returns a memoized `dispatch` function and the command `history`.
 * The dispatch is stable across renders (the singleton never changes).
 */

import { useCallback, useMemo } from 'react';
import { commandBus } from '@/lib/command-bus/command-bus';
import type { Command } from '@/lib/command-bus/types';

export interface UseCommandBusReturn {
  /** Dispatch a command to the bus. */
  dispatch: <T>(command: Command<T>) => Promise<void>;
  /** Read-only snapshot of the command history. */
  history: ReadonlyArray<Command>;
}

export function useCommandBus(): UseCommandBusReturn {
  const dispatch = useCallback(
    <T,>(command: Command<T>) => commandBus.dispatch(command),
    [],
  );

  return useMemo(
    () => ({
      dispatch,
      history: commandBus.history,
    }),
    [dispatch],
  );
}
