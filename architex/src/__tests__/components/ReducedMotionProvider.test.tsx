import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';

import {
  ReducedMotionProvider,
  useReducedMotion,
  useReducedMotionContext,
} from '@/providers/ReducedMotionProvider';

// Helper to read context values
function ContextReader() {
  const prefersReduced = useReducedMotion();
  const { toolbarOverride, setToolbarOverride } = useReducedMotionContext();

  return (
    <div>
      <span data-testid="prefers-reduced">{String(prefersReduced)}</span>
      <span data-testid="toolbar-override">{String(toolbarOverride)}</span>
      <button onClick={() => setToolbarOverride(true)}>Enable override</button>
      <button onClick={() => setToolbarOverride(null)}>Clear override</button>
    </div>
  );
}

describe('ReducedMotionProvider — context values', () => {
  beforeEach(() => {
    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
    localStorage.clear();
  });

  it('defaults prefersReducedMotion to false when OS does not prefer', () => {
    render(
      <ReducedMotionProvider>
        <ContextReader />
      </ReducedMotionProvider>,
    );
    expect(screen.getByTestId('prefers-reduced').textContent).toBe('false');
  });

  it('defaults toolbar override to null', () => {
    render(
      <ReducedMotionProvider>
        <ContextReader />
      </ReducedMotionProvider>,
    );
    expect(screen.getByTestId('toolbar-override').textContent).toBe('null');
  });

  it('useReducedMotion returns a boolean', () => {
    let result: boolean | undefined;
    function Reader() {
      result = useReducedMotion();
      return null;
    }
    render(
      <ReducedMotionProvider>
        <Reader />
      </ReducedMotionProvider>,
    );
    expect(typeof result).toBe('boolean');
  });

  it('useReducedMotionContext returns the full context shape', () => {
    let ctx: ReturnType<typeof useReducedMotionContext> | undefined;
    function Reader() {
      ctx = useReducedMotionContext();
      return null;
    }
    render(
      <ReducedMotionProvider>
        <Reader />
      </ReducedMotionProvider>,
    );
    expect(ctx).toBeDefined();
    expect(typeof ctx!.prefersReducedMotion).toBe('boolean');
    expect(typeof ctx!.setToolbarOverride).toBe('function');
  });
});
