import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from '../ui-store';

describe('ui-store', () => {
  beforeEach(() => {
    // Reset to default state before each test
    const s = useUIStore.getState();
    s.setActiveModule('system-design');
    s.setTheme('dark');
    s.setBottomPanelTab('metrics');
    s.setCommandPaletteOpen(false);
    s.setExportDialogOpen(false);
    s.setImportDialogOpen(false);
    s.setTemplateGalleryOpen(false);
    s.setPlaybookGalleryOpen(false);
    s.setShortcutsDialogOpen(false);
    s.setCapacityCalculatorOpen(false);
    s.setEstimationPadOpen(false);
    s.setSettingsPanelOpen(false);
    s.setOnboardingActive(false);
    s.setOnboardingStep(0);
    // Reset toggles to known state
    if (!s.sidebarOpen) s.toggleSidebar();
    if (!s.propertiesPanelOpen) s.togglePropertiesPanel();
    if (s.bottomPanelOpen) s.toggleBottomPanel();
    if (s.timelineVisible) s.toggleTimeline();
  });

  // ── Initial state ──────────────────────────────────────────────────────

  it('default activeModule is system-design', () => {
    expect(useUIStore.getState().activeModule).toBe('system-design');
  });

  it('default theme is dark', () => {
    expect(useUIStore.getState().theme).toBe('dark');
  });

  it('sidebar and properties panel are open by default', () => {
    const s = useUIStore.getState();
    expect(s.sidebarOpen).toBe(true);
    expect(s.propertiesPanelOpen).toBe(true);
  });

  it('bottom panel is closed by default', () => {
    expect(useUIStore.getState().bottomPanelOpen).toBe(false);
  });

  it('default bottomPanelTab is metrics', () => {
    expect(useUIStore.getState().bottomPanelTab).toBe('metrics');
  });

  // ── Module switching ───────────────────────────────────────────────────

  it('setActiveModule switches the active module', () => {
    useUIStore.getState().setActiveModule('algorithms');
    expect(useUIStore.getState().activeModule).toBe('algorithms');
  });

  it('setActiveModule accepts all module types', () => {
    const modules = [
      'system-design',
      'algorithms',
      'data-structures',
      'lld',
      'database',
      'distributed',
      'networking',
      'os',
      'concurrency',
      'security',
      'ml-design',
      'interview',
    ] as const;

    for (const mod of modules) {
      useUIStore.getState().setActiveModule(mod);
      expect(useUIStore.getState().activeModule).toBe(mod);
    }
  });

  // ── Panel toggles ─────────────────────────────────────────────────────

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

  it('setBottomPanelTab changes the active tab', () => {
    useUIStore.getState().setBottomPanelTab('console');
    expect(useUIStore.getState().bottomPanelTab).toBe('console');

    useUIStore.getState().setBottomPanelTab('chaos');
    expect(useUIStore.getState().bottomPanelTab).toBe('chaos');
  });

  // ── Theme switching ────────────────────────────────────────────────────

  it('setTheme switches to light', () => {
    useUIStore.getState().setTheme('light');
    expect(useUIStore.getState().theme).toBe('light');
  });

  it('setTheme switches to system', () => {
    useUIStore.getState().setTheme('system');
    expect(useUIStore.getState().theme).toBe('system');
  });

  it('setTheme switches back to dark', () => {
    useUIStore.getState().setTheme('light');
    useUIStore.getState().setTheme('dark');
    expect(useUIStore.getState().theme).toBe('dark');
  });

  // ── Dialog toggles ─────────────────────────────────────────────────────

  it('setCommandPaletteOpen opens and closes the palette', () => {
    useUIStore.getState().setCommandPaletteOpen(true);
    expect(useUIStore.getState().commandPaletteOpen).toBe(true);

    useUIStore.getState().setCommandPaletteOpen(false);
    expect(useUIStore.getState().commandPaletteOpen).toBe(false);
  });

  it('setExportDialogOpen controls export dialog', () => {
    useUIStore.getState().setExportDialogOpen(true);
    expect(useUIStore.getState().exportDialogOpen).toBe(true);
  });

  it('setTemplateGalleryOpen controls the template gallery', () => {
    useUIStore.getState().setTemplateGalleryOpen(true);
    expect(useUIStore.getState().templateGalleryOpen).toBe(true);
  });

  it('setSettingsPanelOpen controls the settings panel', () => {
    useUIStore.getState().setSettingsPanelOpen(true);
    expect(useUIStore.getState().settingsPanelOpen).toBe(true);
  });

  // ── Timeline visibility ────────────────────────────────────────────────

  it('toggleTimeline flips timelineVisible', () => {
    expect(useUIStore.getState().timelineVisible).toBe(false);
    useUIStore.getState().toggleTimeline();
    expect(useUIStore.getState().timelineVisible).toBe(true);
  });

  // ── Onboarding ─────────────────────────────────────────────────────────

  it('setOnboardingActive and setOnboardingStep manage onboarding', () => {
    useUIStore.getState().setOnboardingActive(true);
    expect(useUIStore.getState().onboardingActive).toBe(true);

    useUIStore.getState().setOnboardingStep(3);
    expect(useUIStore.getState().onboardingStep).toBe(3);
  });
});
