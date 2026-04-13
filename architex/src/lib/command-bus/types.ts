/**
 * Command Bus Type Definitions
 *
 * Defines the generic Command type, all application command payloads
 * as a discriminated union, and the CommandHandler type used by the bus.
 */

// ---------------------------------------------------------------------------
// Generic Command
// ---------------------------------------------------------------------------

/** A typed command carrying a payload and metadata. */
export interface Command<T = unknown> {
  /** Discriminant string identifying the command kind. */
  type: string;
  /** Command-specific payload data. */
  payload: T;
  /** Unix timestamp (ms) when the command was created. */
  timestamp: number;
}

// ---------------------------------------------------------------------------
// Payload types for each command kind
// ---------------------------------------------------------------------------

export interface LoadTemplatePayload {
  templateId: string;
}

export interface StartSimulationPayload {
  /* intentionally empty */
}

export interface StopSimulationPayload {
  /* intentionally empty */
}

export interface PauseSimulationPayload {
  /* intentionally empty */
}

export interface InjectChaosPayload {
  eventType: string;
  targetNodeId: string;
  params: Record<string, unknown>;
}

export interface RemoveChaosPayload {
  chaosId: string;
}

export interface ExportPayload {
  format: 'json' | 'png' | 'svg' | 'pdf';
}

export interface LoadProjectPayload {
  data: unknown;
}

export interface ResetWorkspacePayload {
  /* intentionally empty */
}

export interface SwitchModulePayload {
  module: string;
}

// ---------------------------------------------------------------------------
// Command type string constants
// ---------------------------------------------------------------------------

export const CommandTypes = {
  LOAD_TEMPLATE: 'LOAD_TEMPLATE',
  START_SIMULATION: 'START_SIMULATION',
  STOP_SIMULATION: 'STOP_SIMULATION',
  PAUSE_SIMULATION: 'PAUSE_SIMULATION',
  INJECT_CHAOS: 'INJECT_CHAOS',
  REMOVE_CHAOS: 'REMOVE_CHAOS',
  EXPORT: 'EXPORT',
  LOAD_PROJECT: 'LOAD_PROJECT',
  RESET_WORKSPACE: 'RESET_WORKSPACE',
  SWITCH_MODULE: 'SWITCH_MODULE',
} as const;

export type CommandType = (typeof CommandTypes)[keyof typeof CommandTypes];

// ---------------------------------------------------------------------------
// Discriminated union of all application commands
// ---------------------------------------------------------------------------

export type AppCommand =
  | Command<LoadTemplatePayload> & { type: typeof CommandTypes.LOAD_TEMPLATE }
  | Command<StartSimulationPayload> & { type: typeof CommandTypes.START_SIMULATION }
  | Command<StopSimulationPayload> & { type: typeof CommandTypes.STOP_SIMULATION }
  | Command<PauseSimulationPayload> & { type: typeof CommandTypes.PAUSE_SIMULATION }
  | Command<InjectChaosPayload> & { type: typeof CommandTypes.INJECT_CHAOS }
  | Command<RemoveChaosPayload> & { type: typeof CommandTypes.REMOVE_CHAOS }
  | Command<ExportPayload> & { type: typeof CommandTypes.EXPORT }
  | Command<LoadProjectPayload> & { type: typeof CommandTypes.LOAD_PROJECT }
  | Command<ResetWorkspacePayload> & { type: typeof CommandTypes.RESET_WORKSPACE }
  | Command<SwitchModulePayload> & { type: typeof CommandTypes.SWITCH_MODULE };

// ---------------------------------------------------------------------------
// Command handler type
// ---------------------------------------------------------------------------

/** Handler function for a specific command type. */
export type CommandHandler<T = unknown> = (
  command: Command<T>,
) => void | Promise<void>;
