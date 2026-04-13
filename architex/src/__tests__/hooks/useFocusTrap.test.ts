import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFocusTrap } from '@/hooks/useFocusTrap';

// Helper to create a container with focusable elements
function createContainer(...tags: string[]): HTMLDivElement {
  const container = document.createElement('div');
  for (const tag of tags) {
    const el = document.createElement(tag);
    if (tag === 'a') (el as HTMLAnchorElement).href = '#';
    container.appendChild(el);
  }
  document.body.appendChild(container);
  return container;
}

// Helper to create a container with no focusable children (just a text node)
function createEmptyContainer(): HTMLDivElement {
  const container = document.createElement('div');
  const p = document.createElement('p');
  p.textContent = 'No focusable elements';
  container.appendChild(p);
  document.body.appendChild(container);
  return container;
}

function cleanup(container: HTMLDivElement) {
  document.body.removeChild(container);
}

describe('useFocusTrap', () => {
  beforeEach(() => {
    // Reset body focus
    document.body.replaceChildren();
    (document.body as HTMLElement).focus();
  });

  it('returns a containerRef and handleKeyDown', () => {
    const { result } = renderHook(() =>
      useFocusTrap({ active: false }),
    );

    expect(result.current.containerRef).toBeDefined();
    expect(result.current.handleKeyDown).toBeInstanceOf(Function);
  });

  it('stores previously focused element and restores focus on deactivation', () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    const { rerender } = renderHook(
      ({ active }) => useFocusTrap({ active }),
      { initialProps: { active: true } },
    );

    // Deactivate — focus should go back to trigger
    rerender({ active: false });

    expect(document.activeElement).toBe(trigger);
    document.body.removeChild(trigger);
  });

  it('calls onEscape when Escape is pressed', () => {
    const onEscape = vi.fn();
    const { result } = renderHook(() =>
      useFocusTrap({ active: true, onEscape }),
    );

    // Simulate Escape keydown
    const event = {
      key: 'Escape',
      stopPropagation: vi.fn(),
      preventDefault: vi.fn(),
    } as unknown as React.KeyboardEvent;

    act(() => {
      result.current.handleKeyDown(event);
    });

    expect(onEscape).toHaveBeenCalledTimes(1);
    expect(event.stopPropagation).toHaveBeenCalled();
  });

  it('does not call onEscape when not active', () => {
    const onEscape = vi.fn();
    const { result } = renderHook(() =>
      useFocusTrap({ active: false, onEscape }),
    );

    const event = {
      key: 'Escape',
      stopPropagation: vi.fn(),
      preventDefault: vi.fn(),
    } as unknown as React.KeyboardEvent;

    act(() => {
      result.current.handleKeyDown(event);
    });

    expect(onEscape).not.toHaveBeenCalled();
  });

  it('wraps Tab forward from last to first focusable element', () => {
    const container = createContainer('button', 'input', 'button');
    const buttons = container.querySelectorAll<HTMLElement>('button, input');
    const first = buttons[0];
    const last = buttons[buttons.length - 1];

    const { result } = renderHook(() =>
      useFocusTrap({ active: true }),
    );

    // Manually assign the ref
    (result.current.containerRef as React.MutableRefObject<HTMLDivElement | null>).current = container;

    // Focus on the last element
    last.focus();
    expect(document.activeElement).toBe(last);

    // Press Tab (forward) from last element
    const event = {
      key: 'Tab',
      shiftKey: false,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as unknown as React.KeyboardEvent;

    act(() => {
      result.current.handleKeyDown(event);
    });

    expect(event.preventDefault).toHaveBeenCalled();
    expect(document.activeElement).toBe(first);

    cleanup(container);
  });

  it('wraps Shift+Tab backward from first to last focusable element', () => {
    const container = createContainer('button', 'input', 'button');
    const buttons = container.querySelectorAll<HTMLElement>('button, input');
    const first = buttons[0];
    const last = buttons[buttons.length - 1];

    const { result } = renderHook(() =>
      useFocusTrap({ active: true }),
    );

    (result.current.containerRef as React.MutableRefObject<HTMLDivElement | null>).current = container;

    // Focus on the first element
    first.focus();
    expect(document.activeElement).toBe(first);

    const event = {
      key: 'Tab',
      shiftKey: true,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as unknown as React.KeyboardEvent;

    act(() => {
      result.current.handleKeyDown(event);
    });

    expect(event.preventDefault).toHaveBeenCalled();
    expect(document.activeElement).toBe(last);

    cleanup(container);
  });

  it('prevents Tab from leaving when there are no focusable elements', () => {
    const container = createEmptyContainer();

    const { result } = renderHook(() =>
      useFocusTrap({ active: true }),
    );

    (result.current.containerRef as React.MutableRefObject<HTMLDivElement | null>).current = container;

    const event = {
      key: 'Tab',
      shiftKey: false,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as unknown as React.KeyboardEvent;

    act(() => {
      result.current.handleKeyDown(event);
    });

    expect(event.preventDefault).toHaveBeenCalled();

    cleanup(container);
  });

  it('keeps focus on the single element when there is only one focusable', () => {
    const container = createContainer('button');
    const button = container.querySelector('button')!;

    const { result } = renderHook(() =>
      useFocusTrap({ active: true }),
    );

    (result.current.containerRef as React.MutableRefObject<HTMLDivElement | null>).current = container;

    button.focus();

    const event = {
      key: 'Tab',
      shiftKey: false,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as unknown as React.KeyboardEvent;

    act(() => {
      result.current.handleKeyDown(event);
    });

    expect(event.preventDefault).toHaveBeenCalled();
    expect(document.activeElement).toBe(button);

    cleanup(container);
  });

  it('does not intercept non-Tab/Escape keys', () => {
    const onEscape = vi.fn();
    const { result } = renderHook(() =>
      useFocusTrap({ active: true, onEscape }),
    );

    const event = {
      key: 'a',
      shiftKey: false,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as unknown as React.KeyboardEvent;

    act(() => {
      result.current.handleKeyDown(event);
    });

    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(onEscape).not.toHaveBeenCalled();
  });

  it('allows normal Tab between middle elements', () => {
    const container = createContainer('button', 'input', 'button');
    const buttons = container.querySelectorAll<HTMLElement>('button, input');
    const middle = buttons[1];

    const { result } = renderHook(() =>
      useFocusTrap({ active: true }),
    );

    (result.current.containerRef as React.MutableRefObject<HTMLDivElement | null>).current = container;

    middle.focus();
    expect(document.activeElement).toBe(middle);

    // Tab forward from the middle element should not preventDefault
    const event = {
      key: 'Tab',
      shiftKey: false,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as unknown as React.KeyboardEvent;

    act(() => {
      result.current.handleKeyDown(event);
    });

    // Browser will handle moving focus natively — no wrapping needed
    expect(event.preventDefault).not.toHaveBeenCalled();

    cleanup(container);
  });
});
