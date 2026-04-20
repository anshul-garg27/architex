import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CommandTypes } from '../types';
import type { Command } from '../types';

// ── Mock stores ──────────────────────────────────────────────
// vi.mock factories are hoisted and cannot reference top-level variables.
// We use vi.hoisted() to declare mocks that both the factory and test body share.

const {
  mockSetNodes,
  mockSetEdges,
  mockClearCanvas,
  mockCanvasGetState,
  mockPlay,
  mockStop,
  mockPause,
  mockReset,
  mockSimGetState,
  mockSetActiveModule,
  mockSetExportDialogOpen,
  mockSetClearCanvasConfirmOpen,
} = vi.hoisted(() => {
  const mockSetNodes = vi.fn();
  const mockSetEdges = vi.fn();
  const mockClearCanvas = vi.fn();
  const mockCanvasGetState = vi.fn(() => ({
    nodes: [],
    edges: [],
    setNodes: mockSetNodes,
    setEdges: mockSetEdges,
    clearCanvas: mockClearCanvas,
  }));

  const mockPlay = vi.fn();
  const mockStop = vi.fn();
  const mockPause = vi.fn();
  const mockReset = vi.fn();
  const mockSimGetState = vi.fn(() => ({
    status: 'idle' as 'idle' | 'running' | 'paused' | 'completed' | 'error',
    play: mockPlay,
    stop: mockStop,
    pause: mockPause,
    reset: mockReset,
  }));

  const mockSetActiveModule = vi.fn();
  const mockSetExportDialogOpen = vi.fn();
  const mockSetClearCanvasConfirmOpen = vi.fn();

  return {
    mockSetNodes,
    mockSetEdges,
    mockClearCanvas,
    mockCanvasGetState,
    mockPlay,
    mockStop,
    mockPause,
    mockReset,
    mockSimGetState,
    mockSetActiveModule,
    mockSetExportDialogOpen,
    mockSetClearCanvasConfirmOpen,
  };
});

vi.mock('@/stores/canvas-store', () => ({
  useCanvasStore: { getState: mockCanvasGetState },
}));

vi.mock('@/stores/simulation-store', () => ({
  useSimulationStore: { getState: mockSimGetState },
}));

vi.mock('@/stores/ui-store', () => ({
  useUIStore: {
    getState: () => ({
      setActiveModule: mockSetActiveModule,
      setExportDialogOpen: mockSetExportDialogOpen,
      setClearCanvasConfirmOpen: mockSetClearCanvasConfirmOpen,
    }),
  },
}));

// Mock templates module
vi.mock('@/lib/templates', () => ({
  getTemplateById: (id: string) => {
    if (id === 'test-template') {
      return {
        id: 'test-template',
        name: 'Test Template',
        nodes: [
          {
            id: 'tn1',
            type: 'system-design',
            position: { x: 0, y: 0 },
            data: { label: 'Service A' },
          },
        ],
        edges: [
          {
            id: 'te1',
            source: 'tn1',
            target: 'tn2',
            type: 'default',
            data: {},
          },
        ],
      };
    }
    return null;
  },
}));

// Mock import module
vi.mock('@/lib/import/from-json', () => ({
  importFromJSON: (data: unknown) => {
    if (data === 'invalid') {
      return { error: 'Invalid JSON data' };
    }
    return {
      nodes: [{ id: 'imported-1', type: 'default', position: { x: 0, y: 0 }, data: {} }],
      edges: [],
    };
  },
}));

// Mock export modules (to avoid DOM interaction)
vi.mock('@/lib/export/to-json', () => ({
  exportToJSON: vi.fn(() => ({ version: '1.0', name: 'test', nodes: [], edges: [] })),
  downloadJSON: vi.fn(),
}));

vi.mock('@/lib/export/to-png', () => ({
  downloadPNG: vi.fn(async () => {}),
}));

vi.mock('@/lib/export/to-svg', () => ({
  downloadSVG: vi.fn(),
}));

vi.mock('@/lib/export/to-pdf', () => ({
  downloadPDF: vi.fn(async () => {}),
}));

// ── Import handlers after mocks are set up ────────────────────

import { handleLoadTemplate } from '../handlers/template-handler';
import {
  handleStartSimulation,
  handleStopSimulation,
  handlePauseSimulation,
} from '../handlers/simulation-handler';
import {
  handleResetWorkspace,
  handleSwitchModule,
  handleLoadProject,
} from '../handlers/workspace-handler';
import { handleExport } from '../handlers/export-handler';

// ── Helpers ──────────────────────────────────────────────────

function makeCommand<T>(type: string, payload: T): Command<T> {
  return { type, payload, timestamp: Date.now() };
}

// ── Tests ────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  // Reset simulation status to idle for each test
  mockSimGetState.mockReturnValue({
    status: 'idle',
    play: mockPlay,
    stop: mockStop,
    pause: mockPause,
    reset: mockReset,
  });
  // handleLoadTemplate defers setEdges into requestAnimationFrame. In jsdom
  // the default RAF fires on the next macrotask, which happens after each
  // test's synchronous assertions. Run RAF callbacks synchronously so the
  // deferred setEdges call is observable in `then`-less assertions below.
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    cb(0);
    return 0;
  });
});

describe('Template handler', () => {
  it('loads a valid template into the canvas store', () => {
    handleLoadTemplate(
      makeCommand(CommandTypes.LOAD_TEMPLATE, { templateId: 'test-template' }),
    );
    expect(mockSetNodes).toHaveBeenCalledOnce();
    expect(mockSetEdges).toHaveBeenCalledOnce();
  });

  it('sets nodes from the template definition', () => {
    handleLoadTemplate(
      makeCommand(CommandTypes.LOAD_TEMPLATE, { templateId: 'test-template' }),
    );
    const nodesArg = mockSetNodes.mock.calls[0][0];
    expect(nodesArg).toHaveLength(1);
    expect(nodesArg[0].id).toBe('tn1');
  });

  it('sets edges from the template definition', () => {
    handleLoadTemplate(
      makeCommand(CommandTypes.LOAD_TEMPLATE, { templateId: 'test-template' }),
    );
    const edgesArg = mockSetEdges.mock.calls[0][0];
    expect(edgesArg).toHaveLength(1);
    expect(edgesArg[0].source).toBe('tn1');
  });

  it('throws on unknown template ID', () => {
    expect(() =>
      handleLoadTemplate(
        makeCommand(CommandTypes.LOAD_TEMPLATE, { templateId: 'non-existent' }),
      ),
    ).toThrow('not found');
  });
});

describe('Simulation handlers', () => {
  it('start calls play() on simulation store', () => {
    handleStartSimulation(
      makeCommand(CommandTypes.START_SIMULATION, {}),
    );
    expect(mockPlay).toHaveBeenCalledOnce();
  });

  it('stop calls stop() on simulation store', () => {
    handleStopSimulation(
      makeCommand(CommandTypes.STOP_SIMULATION, {}),
    );
    expect(mockStop).toHaveBeenCalledOnce();
  });

  it('pause calls pause() on simulation store', () => {
    handlePauseSimulation(
      makeCommand(CommandTypes.PAUSE_SIMULATION, {}),
    );
    expect(mockPause).toHaveBeenCalledOnce();
  });
});

describe('Workspace handlers', () => {
  it('resetWorkspace opens the clear canvas confirmation dialog', () => {
    handleResetWorkspace(
      makeCommand(CommandTypes.RESET_WORKSPACE, {}),
    );
    expect(mockSetClearCanvasConfirmOpen).toHaveBeenCalledWith(true);
  });

  it('resetWorkspace calls simulation reset', () => {
    handleResetWorkspace(
      makeCommand(CommandTypes.RESET_WORKSPACE, {}),
    );
    expect(mockReset).toHaveBeenCalledOnce();
  });

  it('resetWorkspace stops a running simulation before resetting', () => {
    mockSimGetState.mockReturnValue({
      status: 'running',
      play: mockPlay,
      stop: mockStop,
      pause: mockPause,
      reset: mockReset,
    });

    handleResetWorkspace(
      makeCommand(CommandTypes.RESET_WORKSPACE, {}),
    );
    expect(mockStop).toHaveBeenCalledOnce();
    expect(mockReset).toHaveBeenCalledOnce();
  });

  it('switchModule updates the UI store active module', () => {
    handleSwitchModule(
      makeCommand(CommandTypes.SWITCH_MODULE, { module: 'algorithms' }),
    );
    expect(mockSetActiveModule).toHaveBeenCalledWith('algorithms');
  });

  it('switchModule can switch to distributed module', () => {
    handleSwitchModule(
      makeCommand(CommandTypes.SWITCH_MODULE, { module: 'distributed' }),
    );
    expect(mockSetActiveModule).toHaveBeenCalledWith('distributed');
  });

  it('loadProject sets nodes and edges from imported data', () => {
    handleLoadProject(
      makeCommand(CommandTypes.LOAD_PROJECT, { data: '{}' }),
    );
    expect(mockSetNodes).toHaveBeenCalledOnce();
    expect(mockSetEdges).toHaveBeenCalledOnce();
  });

  it('loadProject throws on invalid data', () => {
    expect(() =>
      handleLoadProject(
        makeCommand(CommandTypes.LOAD_PROJECT, { data: 'invalid' }),
      ),
    ).toThrow('Load project failed');
  });
});

describe('Export handler', () => {
  it('handles JSON export format', async () => {
    const { exportToJSON, downloadJSON } = await import('@/lib/export/to-json');
    await handleExport(
      makeCommand(CommandTypes.EXPORT, { format: 'json' }),
    );
    expect(exportToJSON).toHaveBeenCalled();
    expect(downloadJSON).toHaveBeenCalled();
  });

  it('handles PNG export format', async () => {
    const { downloadPNG } = await import('@/lib/export/to-png');
    await handleExport(
      makeCommand(CommandTypes.EXPORT, { format: 'png' }),
    );
    expect(downloadPNG).toHaveBeenCalled();
  });

  it('handles SVG export format', async () => {
    const { downloadSVG } = await import('@/lib/export/to-svg');
    await handleExport(
      makeCommand(CommandTypes.EXPORT, { format: 'svg' }),
    );
    expect(downloadSVG).toHaveBeenCalled();
  });

  it('handles PDF export format', async () => {
    const { downloadPDF } = await import('@/lib/export/to-pdf');
    await handleExport(
      makeCommand(CommandTypes.EXPORT, { format: 'pdf' }),
    );
    expect(downloadPDF).toHaveBeenCalled();
  });
});
