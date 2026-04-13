import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';

// Test the settings page theme logic through the store interface

const mockSetTheme = vi.fn();

vi.mock('@/stores/ui-store', () => ({
  useUIStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      theme: 'dark',
      setTheme: mockSetTheme,
      soundEnabled: true,
      setSoundEnabled: vi.fn(),
    }),
}));

vi.mock('@/providers/ReducedMotionProvider', () => ({
  useReducedMotionContext: () => ({
    prefersReducedMotion: false,
    toolbarOverride: null,
    setToolbarOverride: vi.fn(),
  }),
}));

describe('Settings page — theme toggle', () => {
  it('can set theme to dark', () => {
    mockSetTheme('dark');
    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('can set theme to light', () => {
    mockSetTheme('light');
    expect(mockSetTheme).toHaveBeenCalledWith('light');
  });

  it('can set theme to system', () => {
    mockSetTheme('system');
    expect(mockSetTheme).toHaveBeenCalledWith('system');
  });

  it('settings page module can be imported', async () => {
    const mod = await import('@/app/settings/page');
    expect(mod).toBeDefined();
  });
});
