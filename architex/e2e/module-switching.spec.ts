import { test, expect } from '@playwright/test';

const MODULES = [
  { label: 'System Design', statusText: 'System Design' },
  { label: 'Algorithms', statusText: 'Algorithms' },
  { label: 'Data Structures', statusText: 'Data Structures' },
  { label: 'Low-Level Design', statusText: 'Low-Level Design' },
  { label: 'Database', statusText: 'Database' },
] as const;

test.describe('Module switching', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  for (const mod of MODULES) {
    test(`clicking "${mod.label}" updates the status bar`, async ({ page }) => {
      // Click the module icon in the activity bar (aria-label starts with the module label)
      const btn = page.getByRole('button', { name: new RegExp(`^${mod.label}`) });
      await btn.click();

      // The status bar should reflect the active module name
      const statusBar = page.locator('[role="status"]');
      await expect(statusBar).toContainText(mod.statusText);
    });
  }
});
