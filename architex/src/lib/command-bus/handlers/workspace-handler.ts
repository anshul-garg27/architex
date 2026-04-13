/**
 * Workspace Command Handlers
 *
 * Load project data, reset the workspace, and switch modules.
 * Runs outside React — accesses stores via `.getState()`.
 */

import type {
  Command,
  LoadProjectPayload,
  ResetWorkspacePayload,
  SwitchModulePayload,
} from '../types';
import { useCanvasStore } from '@/stores/canvas-store';
import { useSimulationStore } from '@/stores/simulation-store';
import { useUIStore, type ModuleType } from '@/stores/ui-store';
import { importFromJSON } from '@/lib/import/from-json';

// Re-export for tests

export function handleLoadProject(
  command: Command<LoadProjectPayload>,
): void {
  const { data } = command.payload;

  const result = importFromJSON(data as string | object);

  if ('error' in result) {
    throw new Error(`Load project failed: ${result.error}`);
  }

  const canvas = useCanvasStore.getState();
  canvas.setNodes(result.nodes);
  canvas.setEdges(result.edges);
}

export function handleResetWorkspace(
  _command: Command<ResetWorkspacePayload>,
): void {
  // Stop any running simulation
  const simState = useSimulationStore.getState();
  if (simState.status === 'running' || simState.status === 'paused') {
    simState.stop();
  }
  simState.reset();

  // Show the clear canvas confirmation dialog instead of clearing directly
  useUIStore.getState().setClearCanvasConfirmOpen(true);
}

export function handleSwitchModule(
  command: Command<SwitchModulePayload>,
): void {
  const { module } = command.payload;
  useUIStore.getState().setActiveModule(module as ModuleType);
}
