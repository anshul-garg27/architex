import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockSetActiveModule = vi.fn();
const mockSetSettingsPanelOpen = vi.fn();

vi.mock('@/stores/ui-store', () => ({
  useUIStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      activeModule: 'system-design',
      setActiveModule: mockSetActiveModule,
      setSettingsPanelOpen: mockSetSettingsPanelOpen,
    }),
}));

vi.mock('@/hooks/use-media-query', () => ({ useIsMobile: () => false }));
vi.mock('../../../components/shared/notification-bell', () => ({
  NotificationBell: () => <div data-testid="notification-bell" />,
}));

import { ActivityBar } from '@/components/shared/activity-bar';

describe('ActivityBar — tooltip display', () => {
  beforeEach(() => {
    mockSetActiveModule.mockClear();
    mockSetSettingsPanelOpen.mockClear();
  });

  it('renders tooltip-wrapped module buttons', () => {
    render(<ActivityBar />);
    // All module buttons should exist
    expect(screen.getByRole('button', { name: /System Design/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Algorithms/i })).toBeInTheDocument();
  });

  it('module buttons have aria-labels for tooltip content', () => {
    render(<ActivityBar />);
    const buttons = screen.getAllByRole('button');
    // Each module button should have an aria-label
    const labeled = buttons.filter((b) => b.getAttribute('aria-label'));
    expect(labeled.length).toBeGreaterThanOrEqual(13);
  });

  it('settings button has a tooltip aria-label', () => {
    render(<ActivityBar />);
    const settingsBtn = screen.getByRole('button', { name: 'Settings' });
    expect(settingsBtn).toBeInTheDocument();
  });

  it('clicking settings opens settings panel', () => {
    render(<ActivityBar />);
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    expect(mockSetSettingsPanelOpen).toHaveBeenCalledWith(true);
  });
});
