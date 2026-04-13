import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

import { Breadcrumb, type BreadcrumbItem } from '@/components/shared/Breadcrumb';

describe('E2E: Breadcrumb navigation', () => {
  const items: BreadcrumbItem[] = [
    { label: 'Home', href: '/' },
    { label: 'Modules', href: '/modules' },
    { label: 'System Design' },
  ];

  it('renders a nav element with breadcrumb aria-label', () => {
    render(<Breadcrumb items={items} />);
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
  });

  it('renders all breadcrumb items', () => {
    render(<Breadcrumb items={items} />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Modules')).toBeInTheDocument();
    expect(screen.getByText('System Design')).toBeInTheDocument();
  });

  it('renders links for non-last items', () => {
    render(<Breadcrumb items={items} />);
    const homeLink = screen.getByText('Home').closest('a');
    expect(homeLink).toHaveAttribute('href', '/');
    const modulesLink = screen.getByText('Modules').closest('a');
    expect(modulesLink).toHaveAttribute('href', '/modules');
  });

  it('renders the last item as plain text with aria-current', () => {
    render(<Breadcrumb items={items} />);
    const current = screen.getByText('System Design');
    expect(current.tagName).not.toBe('A');
    expect(current).toHaveAttribute('aria-current', 'page');
  });

  it('renders separator chevrons between items', () => {
    render(<Breadcrumb items={items} />);
    const separators = document.querySelectorAll('[aria-hidden="true"]');
    // Should have n-1 separators
    expect(separators.length).toBe(items.length - 1);
  });
});
