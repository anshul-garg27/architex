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

let mockIsMobile = true;
vi.mock('@/hooks/use-media-query', () => ({
  useIsMobile: () => mockIsMobile,
}));

vi.mock('../../../components/shared/notification-bell', () => ({
  NotificationBell: () => <div data-testid="notification-bell" />,
}));

import { ActivityBar } from '@/components/shared/activity-bar';

describe('E2E: Mobile responsive nav', () => {
  beforeEach(() => {
    mockIsMobile = true;
    mockActiveModule = 'system-design';
    mockSetActiveModule.mockClear();
  });

  it('renders mobile bottom navigation when isMobile is true', () => {
    render(<ActivityBar />);
    const nav = screen.getByRole('navigation', { name: 'Module navigation' });
    expect(nav).toBeInTheDocument();
  });

  it('shows limited modules with a More button on mobile', () => {
    render(<ActivityBar />);
    const nav = screen.getByRole('navigation', { name: 'Module navigation' });
    const buttons = nav.querySelectorAll('button');
    // Should be 5 modules + 1 More button = 6
    expect(buttons.length).toBe(6);
  });

  it('tapping a mobile module calls setActiveModule', () => {
    render(<ActivityBar />);
    const btn = screen.getByRole('button', { name: 'Algorithms' });
    fireEvent.click(btn);
    expect(mockSetActiveModule).toHaveBeenCalledWith('algorithms');
  });

  it('renders desktop sidebar when not mobile', () => {
    mockIsMobile = false;
    render(<ActivityBar />);
    const listbox = screen.getByRole('listbox', { name: 'Modules' });
    expect(listbox).toBeInTheDocument();
    const options = listbox.querySelectorAll('[role="option"]');
    expect(options.length).toBe(13);
  });
});
