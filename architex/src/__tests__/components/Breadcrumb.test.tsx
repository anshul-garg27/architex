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

describe('Breadcrumb — renders links correctly', () => {
  it('renders a single item as current page', () => {
    render(<Breadcrumb items={[{ label: 'Home' }]} />);
    const home = screen.getByText('Home');
    expect(home).toHaveAttribute('aria-current', 'page');
  });

  it('renders multiple items with separators', () => {
    const items: BreadcrumbItem[] = [
      { label: 'Home', href: '/' },
      { label: 'Settings' },
    ];
    render(<Breadcrumb items={items} />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    const separators = document.querySelectorAll('[aria-hidden="true"]');
    expect(separators).toHaveLength(1);
  });

  it('first items are links, last is plain text', () => {
    const items: BreadcrumbItem[] = [
      { label: 'Home', href: '/' },
      { label: 'Modules', href: '/modules' },
      { label: 'Algorithms' },
    ];
    render(<Breadcrumb items={items} />);
    expect(screen.getByText('Home').closest('a')).toHaveAttribute('href', '/');
    expect(screen.getByText('Modules').closest('a')).toHaveAttribute('href', '/modules');
    expect(screen.getByText('Algorithms').closest('a')).toBeNull();
  });

  it('has accessible nav landmark', () => {
    render(<Breadcrumb items={[{ label: 'X' }]} />);
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
  });

  it('renders an ordered list', () => {
    render(<Breadcrumb items={[{ label: 'A', href: '/' }, { label: 'B' }]} />);
    const list = document.querySelector('ol');
    expect(list).toBeInTheDocument();
    expect(list!.querySelectorAll('li')).toHaveLength(2);
  });
});
