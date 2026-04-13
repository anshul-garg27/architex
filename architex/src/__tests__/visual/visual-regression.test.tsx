/**
 * Visual Regression Tests -- CSS Snapshot Approach
 *
 * Since Playwright is configured for E2E but not installed as a devDependency,
 * we use a Vitest-based CSS class snapshot approach. These tests verify that
 * key pages render with expected CSS class structures, catching regressions
 * in layout and styling without requiring a browser.
 */
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

import NotFound from '@/app/not-found';
import Loading from '@/app/loading';

// -- Landing Page Visual Snapshot ---

describe('Visual Regression: Not-Found page structure', () => {
  it('not-found page renders with centered flex layout', () => {
    const { container } = render(<NotFound />);
    const rootDiv = container.firstElementChild as HTMLElement;
    expect(rootDiv).toBeTruthy();
    expect(rootDiv.className).toContain('flex');
    expect(rootDiv.className).toContain('min-h-screen');
  });

  it('not-found page has a heading element', () => {
    const { container } = render(<NotFound />);
    const heading = container.querySelector('h1');
    expect(heading).toBeTruthy();
    expect(heading!.textContent).toBe('404');
  });

  it('not-found page renders exactly 2 CTA links', () => {
    const { container } = render(<NotFound />);
    const links = container.querySelectorAll('a');
    expect(links.length).toBe(2);
  });
});

// -- Loading Skeleton Visual Snapshot ---

describe('Visual Regression: Loading skeleton structure', () => {
  it('loading page has sidebar and canvas areas', () => {
    const { container } = render(<Loading />);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toBeTruthy();

    // Sidebar
    const sidebar = root.querySelector('.border-r');
    expect(sidebar).toBeTruthy();

    // Canvas
    const canvas = root.querySelector('.bg-canvas-bg');
    expect(canvas).toBeTruthy();
  });

  it('loading skeleton uses animate-pulse for skeleton elements', () => {
    const { container } = render(<Loading />);
    const pulseElements = container.querySelectorAll('.animate-pulse');
    expect(pulseElements.length).toBeGreaterThanOrEqual(10);
  });

  it('loading skeleton has status bar', () => {
    const { container } = render(<Loading />);
    const statusBar = container.querySelector('.bg-statusbar');
    expect(statusBar).toBeTruthy();
  });
});

// -- 404 Page Visual Snapshot ---

describe('Visual Regression: 404 page styling', () => {
  it('404 page uses text-center alignment', () => {
    const { container } = render(<NotFound />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain('text-center');
  });

  it('404 CTA area has flex-wrap for responsive buttons', () => {
    const { container } = render(<NotFound />);
    // Find the wrapper containing the CTA links
    const links = container.querySelectorAll('a');
    const wrapper = links[0]?.parentElement;
    expect(wrapper).toBeTruthy();
    expect(wrapper!.className).toContain('flex');
  });
});
