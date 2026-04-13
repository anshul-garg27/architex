/**
 * Chaos Command Handlers
 *
 * Inject and remove chaos events via the simulation store's orchestrator.
 * Runs outside React — accesses stores via `.getState()`.
 */

import type {
  Command,
  InjectChaosPayload,
  RemoveChaosPayload,
} from '../types';
import { useSimulationStore } from '@/stores/simulation-store';

export function handleInjectChaos(
  command: Command<InjectChaosPayload>,
): void {
  const { eventType, targetNodeId } = command.payload;

  const { orchestratorRef } = useSimulationStore.getState();
  if (orchestratorRef) {
    orchestratorRef.injectChaos(eventType, [targetNodeId]);
  } else {
    // If no orchestrator is running, record the chaos event directly in the store
    useSimulationStore.getState().addChaosEvent(
      `${eventType}-${targetNodeId}-${Date.now()}`,
    );
  }
}

export function handleRemoveChaos(
  command: Command<RemoveChaosPayload>,
): void {
  const { chaosId } = command.payload;

  const { orchestratorRef } = useSimulationStore.getState();
  if (orchestratorRef) {
    orchestratorRef.removeChaos(chaosId);
  } else {
    useSimulationStore.getState().removeChaosEvent(chaosId);
  }
}
