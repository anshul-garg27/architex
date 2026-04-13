import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';

// Test the palette data model used by ComponentPalette
vi.mock('@/stores/ui-store', () => ({
  useUIStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      activeModule: 'system-design',
      sidebarOpen: true,
      setImportDialogOpen: vi.fn(),
      setExportDialogOpen: vi.fn(),
      setTemplateGalleryOpen: vi.fn(),
    }),
}));

vi.mock('@/stores/canvas-store', () => ({
  useCanvasStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({ nodes: [], edges: [] }),
}));

describe('ComponentPalette — drag indicator', () => {
  it('palette items module can be imported', async () => {
    const mod = await import('@/lib/palette-items');
    expect(mod.PALETTE_ITEMS).toBeDefined();
    expect(Array.isArray(mod.PALETTE_ITEMS)).toBe(true);
    expect(mod.PALETTE_ITEMS.length).toBeGreaterThan(0);
  });

  it('palette items have required fields', async () => {
    const { PALETTE_ITEMS } = await import('@/lib/palette-items');
    for (const item of PALETTE_ITEMS) {
      expect(item.type).toBeTruthy();
      expect(item.label).toBeTruthy();
      expect(item.category).toBeTruthy();
      expect(item.icon).toBeTruthy();
    }
  });

  it('palette items can be grouped by category', async () => {
    const { PALETTE_ITEMS, groupByCategory } = await import('@/lib/palette-items');
    const groups = groupByCategory(PALETTE_ITEMS);
    expect(Object.keys(groups).length).toBeGreaterThan(0);
  });

  it('category labels are defined', async () => {
    const { CATEGORY_LABELS } = await import('@/lib/palette-items');
    expect(CATEGORY_LABELS).toBeDefined();
    expect(typeof CATEGORY_LABELS).toBe('object');
  });
});
