import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

import NotFound from '@/app/not-found';

describe('E2E: 404 page renders for invalid routes', () => {
  it('renders the 404 page without errors', () => {
    render(<NotFound />);
    expect(screen.getByText('404')).toBeInTheDocument();
  });

  it('displays an explanation message', () => {
    render(<NotFound />);
    expect(screen.getByText(/doesn.t exist/i)).toBeInTheDocument();
  });

  it('provides a link to dashboard', () => {
    render(<NotFound />);
    const dashLink = screen.getByRole('link', { name: /Dashboard/i });
    expect(dashLink).toBeInTheDocument();
    expect(dashLink.getAttribute('href')).toBe('/dashboard');
  });

  it('provides a link to browse modules', () => {
    render(<NotFound />);
    const modulesLink = screen.getByRole('link', { name: /Modules/i });
    expect(modulesLink).toBeInTheDocument();
    expect(modulesLink.getAttribute('href')).toBe('/modules');
  });

  it('displays the Architex brand name', () => {
    render(<NotFound />);
    expect(screen.getByText('Architex')).toBeInTheDocument();
  });
});
