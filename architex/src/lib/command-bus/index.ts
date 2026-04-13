/**
 * Command Bus — Barrel Export
 *
 * Exports the singleton command bus, all types, and a `registerAllHandlers`
 * function that wires up every command handler.
 */

// Core bus
export { CommandBus, commandBus } from './command-bus';

// Types
export { CommandTypes } from './types';
export type {
  Command,
  CommandHandler,
  CommandType,
  AppCommand,
  LoadTemplatePayload,
  StartSimulationPayload,
  StopSimulationPayload,
  PauseSimulationPayload,
  InjectChaosPayload,
  RemoveChaosPayload,
  ExportPayload,
  LoadProjectPayload,
  ResetWorkspacePayload,
  SwitchModulePayload,
} from './types';

// Handler registration
export { registerAllHandlers } from './register';
