import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// cmdk uses scrollIntoView internally which jsdom doesn't implement
Element.prototype.scrollIntoView = vi.fn();

let mockCommandPaletteOpen = true;

vi.mock('@/stores/ui-store', () => ({
  useUIStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      commandPaletteOpen: mockCommandPaletteOpen,
      setCommandPaletteOpen: vi.fn(),
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
    commandPalette: { open: { initial: {}, animate: {}, transition: {} }, close: { exit: {} } },
  },
  reducedMotion: { instantTransition: { duration: 0 } },
}));

import { CommandPalette } from '@/components/shared/command-palette';

describe('E2E: Search functionality', () => {
  beforeEach(() => {
    mockCommandPaletteOpen = true;
  });

  it('renders the search input with placeholder', () => {
    render(<CommandPalette />);
    const input = screen.getByLabelText(/Command palette search/i);
    expect(input).toBeInTheDocument();
    expect(input.getAttribute('placeholder')).toContain('command');
  });

  it('renders multiple command groups', () => {
    render(<CommandPalette />);
    // Should have command groups like Modules, File, Appearance, etc.
    expect(screen.getByText(/Switch to Algorithms/i)).toBeInTheDocument();
    expect(screen.getByText(/Theme: Dark/i)).toBeInTheDocument();
  });

  it('displays command items that can be searched', () => {
    render(<CommandPalette />);
    expect(screen.getByText(/Export Diagram/i)).toBeInTheDocument();
    expect(screen.getByText(/Import Diagram/i)).toBeInTheDocument();
  });

  it('shows keyboard shortcut badges for commands', () => {
    render(<CommandPalette />);
    const kbds = document.querySelectorAll('kbd');
    expect(kbds.length).toBeGreaterThan(0);
  });
});
