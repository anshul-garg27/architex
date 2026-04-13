import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

import AppLoading from '@/app/loading';

describe('E2E: Loading states render', () => {
  it('renders the root loading skeleton', () => {
    render(<AppLoading />);
    const pulses = document.querySelectorAll('.animate-pulse');
    expect(pulses.length).toBeGreaterThan(0);
  });

  it('loading skeleton has correct layout structure', () => {
    render(<AppLoading />);
    // Should have the sidebar (activity bar), main canvas, and panels
    const sidebar = document.querySelector('.border-r');
    const canvas = document.querySelector('.bg-canvas-bg');
    expect(sidebar).toBeInTheDocument();
    expect(canvas).toBeInTheDocument();
  });

  it('loading skeleton has node-shaped placeholders', () => {
    render(<AppLoading />);
    // Three placeholder "nodes" in the canvas area
    const nodePlaceholders = document.querySelectorAll('.absolute.animate-pulse.rounded-lg');
    expect(nodePlaceholders.length).toBeGreaterThanOrEqual(3);
  });

  it('loading skeleton has form field placeholders in sidebar', () => {
    render(<AppLoading />);
    // Right panel has field placeholders (h-7 for inputs)
    const fieldPlaceholders = document.querySelectorAll('.h-7.animate-pulse');
    expect(fieldPlaceholders.length).toBeGreaterThan(0);
  });

  it('loading skeleton has a status bar', () => {
    render(<AppLoading />);
    const statusBar = document.querySelector('.bg-statusbar');
    expect(statusBar).toBeInTheDocument();
  });
});
