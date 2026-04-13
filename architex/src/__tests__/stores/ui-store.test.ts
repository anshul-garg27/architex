import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from '@/stores/ui-store';
import type { ModuleType, Theme } from '@/stores/ui-store';

function resetStore() {
  // Restore defaults by setting each field back manually since the store
  // uses persist middleware and there is no built-in reset action.
  const s = useUIStore.getState();
  s.setActiveModule('system-design');
  s.setTheme('dark');
  if (!s.sidebarOpen) s.toggleSidebar();
  if (!s.propertiesPanelOpen) s.togglePropertiesPanel();
  if (s.bottomPanelOpen) s.toggleBottomPanel();
  s.setCommandPaletteOpen(false);
}

describe('ui-store', () => {
  beforeEach(() => {
    resetStore();
  });

  // ── Module switching ─────────────────────────────────────

  it('defaults to system-design module', () => {
    expect(useUIStore.getState().activeModule).toBe('system-design');
  });

  it('setActiveModule switches the active module', () => {
    useUIStore.getState().setActiveModule('algorithms');
    expect(useUIStore.getState().activeModule).toBe('algorithms');

    useUIStore.getState().setActiveModule('distributed');
    expect(useUIStore.getState().activeModule).toBe('distributed');
  });

  // ── Panel toggles ────────────────────────────────────────

  it('toggleSidebar flips sidebarOpen', () => {
    expect(useUIStore.getState().sidebarOpen).toBe(true);
    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().sidebarOpen).toBe(false);
    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().sidebarOpen).toBe(true);
  });

  it('togglePropertiesPanel flips propertiesPanelOpen', () => {
    expect(useUIStore.getState().propertiesPanelOpen).toBe(true);
    useUIStore.getState().togglePropertiesPanel();
    expect(useUIStore.getState().propertiesPanelOpen).toBe(false);
  });

  it('toggleBottomPanel flips bottomPanelOpen', () => {
    expect(useUIStore.getState().bottomPanelOpen).toBe(false);
    useUIStore.getState().toggleBottomPanel();
    expect(useUIStore.getState().bottomPanelOpen).toBe(true);
  });

  it('setBottomPanelTab changes the active bottom tab', () => {
    useUIStore.getState().setBottomPanelTab('console');
    expect(useUIStore.getState().bottomPanelTab).toBe('console');

    useUIStore.getState().setBottomPanelTab('timeline');
    expect(useUIStore.getState().bottomPanelTab).toBe('timeline');
  });

  // ── Theme ────────────────────────────────────────────────

  it('defaults to dark theme', () => {
    expect(useUIStore.getState().theme).toBe('dark');
  });

  it('setTheme changes the theme', () => {
    useUIStore.getState().setTheme('light');
    expect(useUIStore.getState().theme).toBe('light');

    useUIStore.getState().setTheme('system');
    expect(useUIStore.getState().theme).toBe('system');
  });

  // ── Command palette ──────────────────────────────────────

  it('setCommandPaletteOpen controls command palette visibility', () => {
    useUIStore.getState().setCommandPaletteOpen(true);
    expect(useUIStore.getState().commandPaletteOpen).toBe(true);

    useUIStore.getState().setCommandPaletteOpen(false);
    expect(useUIStore.getState().commandPaletteOpen).toBe(false);
  });
});
