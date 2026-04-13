import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// cmdk uses scrollIntoView internally which jsdom doesn't implement
Element.prototype.scrollIntoView = vi.fn();

const mockSetOpen = vi.fn();

vi.mock('@/stores/ui-store', () => ({
  useUIStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      commandPaletteOpen: true,
      setCommandPaletteOpen: mockSetOpen,
      activeModule: 'system-design',
      setActiveModule: vi.fn(),
      toggleSidebar: vi.fn(),
      toggleBottomPanel: vi.fn(),
      togglePropertiesPanel: vi.fn(),
      setTheme: vi.fn(),
      setImportDialogOpen: vi.fn(),
      setExportDialogOpen: vi.fn(),
      setTemplateGalleryOpen: vi.fn(),
      setPlaybookGalleryOpen: vi.fn(),
      setClearCanvasConfirmOpen: vi.fn(),
      setCapacityCalculatorOpen: vi.fn(),
      setShortcutsDialogOpen: vi.fn(),
    }),
}));

vi.mock('@/stores/simulation-store', () => ({
  useSimulationStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({ status: 'idle', play: vi.fn(), pause: vi.fn(), stop: vi.fn(), reset: vi.fn() }),
}));

vi.mock('@/stores/canvas-store', () => ({
  useCanvasStore: Object.assign(
    (selector: (s: Record<string, unknown>) => unknown) => selector({ nodes: [], edges: [] }),
    { getState: () => ({ addNode: vi.fn() }) },
  ),
}));

vi.mock('@/hooks/use-media-query', () => ({ useIsMobile: () => false }));
vi.mock('@/hooks/useFocusTrap', () => ({
  useFocusTrap: () => ({ containerRef: { current: null }, handleKeyDown: vi.fn() }),
}));
vi.mock('@/hooks/useRecentCommands', () => ({
  useRecentCommands: () => ({ recentCommands: [], add: vi.fn(), clear: vi.fn() }),
}));
vi.mock('@/components/shared/RecentCommands', () => ({ RecentCommandsSection: () => null }));

vi.mock('motion/react', () => ({
  motion: new Proxy({}, {
    get: (_target, prop: string) => {
      return React.forwardRef(({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }, ref: React.Ref<HTMLElement>) => {
        const filteredProps = Object.fromEntries(
          Object.entries(props).filter(([key]) =>
            !['initial', 'animate', 'exit', 'transition', 'variants', 'whileHover', 'whileTap', 'layout'].includes(key)
          ),
        );
        return React.createElement(prop, { ...filteredProps, ref }, children);
      });
    },
  }),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useReducedMotion: () => false,
}));

vi.mock('@/lib/constants/motion', () => ({
  duration: { fast: 0.15, normal: 0.3, quick: 0.1 },
  easing: { out: [0, 0, 0.2, 1], in: [0.4, 0, 1, 1] },
  animations: {
    commandPalette: {
      open: { initial: {}, animate: {}, transition: {} },
      close: { exit: {} },
    },
  },
  reducedMotion: { instantTransition: { duration: 0 } },
}));

import { CommandPalette } from '@/components/shared/command-palette';

describe('CommandPalette — keyboard shortcuts', () => {
  beforeEach(() => {
    mockSetOpen.mockClear();
  });

  it('renders as a dialog with correct aria-label', () => {
    render(<CommandPalette />);
    expect(screen.getByRole('dialog', { name: /Command palette/i })).toBeInTheDocument();
  });

  it('shows search input', () => {
    render(<CommandPalette />);
    expect(screen.getByLabelText(/Command palette search/i)).toBeInTheDocument();
  });

  it('displays module commands', () => {
    render(<CommandPalette />);
    expect(screen.getByText(/Switch to Algorithms/i)).toBeInTheDocument();
    expect(screen.getByText(/Switch to Database/i)).toBeInTheDocument();
  });

  it('displays keyboard shortcuts for commands', () => {
    render(<CommandPalette />);
    const kbds = document.querySelectorAll('kbd');
    expect(kbds.length).toBeGreaterThan(0);
  });

  it('displays file commands', () => {
    render(<CommandPalette />);
    expect(screen.getByText(/Export Diagram/i)).toBeInTheDocument();
    expect(screen.getByText(/Import Diagram/i)).toBeInTheDocument();
  });

  it('displays theme commands', () => {
    render(<CommandPalette />);
    expect(screen.getByText(/Theme: Dark/i)).toBeInTheDocument();
    expect(screen.getByText(/Theme: Light/i)).toBeInTheDocument();
  });
});
