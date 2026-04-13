/**
 * Handler Registration
 *
 * Wires up all command handlers to the command bus singleton.
 * Call once at application startup.
 */

import { commandBus } from './command-bus';
import { CommandTypes } from './types';

// Handlers
import { handleLoadTemplate } from './handlers/template-handler';
import {
  handleStartSimulation,
  handleStopSimulation,
  handlePauseSimulation,
} from './handlers/simulation-handler';
import { handleInjectChaos, handleRemoveChaos } from './handlers/chaos-handler';
import { handleExport } from './handlers/export-handler';
import {
  handleLoadProject,
  handleResetWorkspace,
  handleSwitchModule,
} from './handlers/workspace-handler';

/**
 * Register all application command handlers on the singleton bus.
 *
 * Safe to call multiple times — each call replaces existing handlers
 * for the same command type.
 */
export function registerAllHandlers(): void {
  commandBus.register(CommandTypes.LOAD_TEMPLATE, handleLoadTemplate);
  commandBus.register(CommandTypes.START_SIMULATION, handleStartSimulation);
  commandBus.register(CommandTypes.STOP_SIMULATION, handleStopSimulation);
  commandBus.register(CommandTypes.PAUSE_SIMULATION, handlePauseSimulation);
  commandBus.register(CommandTypes.INJECT_CHAOS, handleInjectChaos);
  commandBus.register(CommandTypes.REMOVE_CHAOS, handleRemoveChaos);
  commandBus.register(CommandTypes.EXPORT, handleExport);
  commandBus.register(CommandTypes.LOAD_PROJECT, handleLoadProject);
  commandBus.register(CommandTypes.RESET_WORKSPACE, handleResetWorkspace);
  commandBus.register(CommandTypes.SWITCH_MODULE, handleSwitchModule);
}
