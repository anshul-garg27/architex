import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Track calls to setActiveModule
const mockSetActiveModule = vi.fn();
const mockSetSettingsPanelOpen = vi.fn();
let mockActiveModule = 'system-design';

vi.mock('@/stores/ui-store', () => ({
  useUIStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      activeModule: mockActiveModule,
      setActiveModule: mockSetActiveModule,
      setSettingsPanelOpen: mockSetSettingsPanelOpen,
    }),
}));

// Mock useIsMobile — default to desktop
let mockIsMobile = false;
vi.mock('@/hooks/use-media-query', () => ({
  useIsMobile: () => mockIsMobile,
}));

// Mock NotificationBell
vi.mock('../notification-bell', () => ({
  NotificationBell: () => <div data-testid="notification-bell" />,
}));

import { ActivityBar } from '../activity-bar';

const ALL_MODULE_LABELS = [
  'System Design',
  'Algorithms',
  'Data Structures',
  'Low-Level Design',
  'Database',
  'Distributed Systems',
  'Networking',
  'OS Concepts',
  'Concurrency',
  'Security',
  'ML Design',
  'Interview',
  'Knowledge Graph',
];

describe('ActivityBar (Desktop)', () => {
  beforeEach(() => {
    mockIsMobile = false;
    mockActiveModule = 'system-design';
    mockSetActiveModule.mockClear();
    mockSetSettingsPanelOpen.mockClear();
  });

  it('renders a nav element with correct aria-label', () => {
    render(<ActivityBar />);
    expect(screen.getByRole('navigation', { name: 'Module navigation' })).toBeInTheDocument();
  });

  it('renders all 13 module buttons', () => {
    render(<ActivityBar />);
    const listbox = screen.getByRole('listbox', { name: 'Modules' });
    const options = listbox.querySelectorAll('[role="option"]');
    expect(options).toHaveLength(13);
  });

  it('renders buttons with correct aria-labels for all modules', () => {
    render(<ActivityBar />);
    for (const label of ALL_MODULE_LABELS) {
      const btn = screen.getByRole('button', { name: new RegExp(label) });
      expect(btn).toBeInTheDocument();
    }
  });

  it('highlights the active module with aria-selected', () => {
    mockActiveModule = 'algorithms';
    render(<ActivityBar />);
    const option = screen.getByRole('option', { selected: true });
    const btn = option.querySelector('button');
    expect(btn?.getAttribute('aria-label')).toContain('Algorithms');
  });

  it('calls setActiveModule when a module button is clicked', () => {
    render(<ActivityBar />);
    const btn = screen.getByRole('button', { name: /Database/ });
    fireEvent.click(btn);
    expect(mockSetActiveModule).toHaveBeenCalledWith('database');
  });

  it('renders a settings button', () => {
    render(<ActivityBar />);
    const settingsBtn = screen.getByRole('button', { name: 'Settings' });
    expect(settingsBtn).toBeInTheDocument();
  });

  it('calls setSettingsPanelOpen when settings button is clicked', () => {
    render(<ActivityBar />);
    const settingsBtn = screen.getByRole('button', { name: 'Settings' });
    fireEvent.click(settingsBtn);
    expect(mockSetSettingsPanelOpen).toHaveBeenCalledWith(true);
  });

  it('renders the notification bell', () => {
    render(<ActivityBar />);
    expect(screen.getByTestId('notification-bell')).toBeInTheDocument();
  });
});

describe('ActivityBar (Mobile)', () => {
  beforeEach(() => {
    mockIsMobile = true;
    mockActiveModule = 'system-design';
    mockSetActiveModule.mockClear();
  });

  it('renders a bottom navigation bar on mobile', () => {
    render(<ActivityBar />);
    expect(screen.getByRole('navigation', { name: 'Module navigation' })).toBeInTheDocument();
  });

  it('shows first 5 modules and a More button on mobile', () => {
    render(<ActivityBar />);
    // First 5 visible plus the More button
    const nav = screen.getByRole('navigation', { name: 'Module navigation' });
    const buttons = nav.querySelectorAll('button');
    // 5 module buttons + 1 More button = 6
    expect(buttons.length).toBe(6);
  });

  it('calls setActiveModule when tapping a visible mobile module', () => {
    render(<ActivityBar />);
    const btn = screen.getByRole('button', { name: 'Algorithms' });
    fireEvent.click(btn);
    expect(mockSetActiveModule).toHaveBeenCalledWith('algorithms');
  });
});
