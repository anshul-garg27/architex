import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockSetActiveModule = vi.fn();
let mockActiveModule = 'system-design';

vi.mock('@/stores/ui-store', () => ({
  useUIStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      activeModule: mockActiveModule,
      setActiveModule: mockSetActiveModule,
      setSettingsPanelOpen: vi.fn(),
    }),
}));

vi.mock('@/hooks/use-media-query', () => ({
  useIsMobile: () => false,
}));

vi.mock('../../../components/shared/notification-bell', () => ({
  NotificationBell: () => <div data-testid="notification-bell" />,
}));

import { ActivityBar } from '@/components/shared/activity-bar';

const MODULE_IDS = [
  'system-design', 'algorithms', 'data-structures', 'lld', 'database',
  'distributed', 'networking', 'os', 'concurrency', 'security',
  'ml-design', 'interview', 'knowledge-graph',
];

describe('E2E: Module navigation works', () => {
  beforeEach(() => {
    mockActiveModule = 'system-design';
    mockSetActiveModule.mockClear();
  });

  it('renders all module navigation buttons', () => {
    render(<ActivityBar />);
    const listbox = screen.getByRole('listbox', { name: 'Modules' });
    const options = listbox.querySelectorAll('[role="option"]');
    expect(options).toHaveLength(13);
  });

  it('navigates to algorithms when clicked', () => {
    render(<ActivityBar />);
    const btn = screen.getByRole('button', { name: /Algorithms/i });
    fireEvent.click(btn);
    expect(mockSetActiveModule).toHaveBeenCalledWith('algorithms');
  });

  it('navigates to database module when clicked', () => {
    render(<ActivityBar />);
    const btn = screen.getByRole('button', { name: /Database/i });
    fireEvent.click(btn);
    expect(mockSetActiveModule).toHaveBeenCalledWith('database');
  });

  it('navigates to distributed systems when clicked', () => {
    render(<ActivityBar />);
    const btn = screen.getByRole('button', { name: /Distributed Systems/i });
    fireEvent.click(btn);
    expect(mockSetActiveModule).toHaveBeenCalledWith('distributed');
  });

  it('marks the active module with aria-selected', () => {
    mockActiveModule = 'networking';
    render(<ActivityBar />);
    const selected = screen.getByRole('option', { selected: true });
    expect(selected).toBeInTheDocument();
  });
});
