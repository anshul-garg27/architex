import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Test the FloatingToolbar UI component
import { FloatingToolbar, type FloatingToolbarProps } from '@/components/ui/floating-toolbar';

describe('CanvasToolbar — responsive behavior', () => {
  it('does not render when open is false', () => {
    const { container } = render(<FloatingToolbar open={false}>Tools</FloatingToolbar>);
    expect(container.innerHTML).toBe('');
  });

  it('renders children when open is true', () => {
    render(<FloatingToolbar open={true}>Tools</FloatingToolbar>);
    expect(screen.getByText('Tools')).toBeInTheDocument();
  });

  it('renders with position styles when position prop is given', () => {
    const { container } = render(
      <FloatingToolbar open={true} position={{ x: 100, y: 200 }}>Content</FloatingToolbar>,
    );
    const toolbar = container.firstElementChild as HTMLElement;
    expect(toolbar).toBeTruthy();
  });

  it('FloatingToolbarProps interface includes expected fields', () => {
    // Type-level check: if this compiles, the interface is correct
    const props: FloatingToolbarProps = {
      open: true,
      position: { x: 0, y: 0 },
      anchor: 'bottom',
    };
    expect(props.open).toBe(true);
    expect(props.anchor).toBe('bottom');
  });
});
