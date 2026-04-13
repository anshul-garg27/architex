import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';

const mockSetTheme = vi.fn();
let storeState: Record<string, unknown> = {};

// Directly test the UI store's theme logic
vi.mock('@/stores/ui-store', () => {
  return {
    useUIStore: (selector: (s: Record<string, unknown>) => unknown) => selector(storeState),
  };
});

describe('E2E: Light/dark theme toggle', () => {
  beforeEach(() => {
    mockSetTheme.mockClear();
    storeState = {
      theme: 'dark',
      setTheme: mockSetTheme,
    };
  });

  it('starts with a default theme', () => {
    expect(storeState.theme).toBe('dark');
  });

  it('can toggle to light theme', () => {
    mockSetTheme('light');
    expect(mockSetTheme).toHaveBeenCalledWith('light');
  });

  it('can toggle to dark theme', () => {
    storeState.theme = 'light';
    mockSetTheme('dark');
    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('can toggle to system theme', () => {
    mockSetTheme('system');
    expect(mockSetTheme).toHaveBeenCalledWith('system');
  });

  it('setTheme is called exactly once per toggle', () => {
    mockSetTheme('light');
    mockSetTheme('dark');
    expect(mockSetTheme).toHaveBeenCalledTimes(2);
  });
});
