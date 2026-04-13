/**
 * Simulation Command Handlers
 *
 * Start, stop, and pause the simulation via the simulation store.
 * Runs outside React — accesses stores via `.getState()`.
 */

import type {
  Command,
  StartSimulationPayload,
  StopSimulationPayload,
  PauseSimulationPayload,
} from '../types';
import { useSimulationStore } from '@/stores/simulation-store';

export function handleStartSimulation(
  _command: Command<StartSimulationPayload>,
): void {
  useSimulationStore.getState().play();
}

export function handleStopSimulation(
  _command: Command<StopSimulationPayload>,
): void {
  useSimulationStore.getState().stop();
}

export function handlePauseSimulation(
  _command: Command<PauseSimulationPayload>,
): void {
  useSimulationStore.getState().pause();
}
