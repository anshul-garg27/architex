import { test, expect } from '@playwright/test';

test.describe('Command palette', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('opens with Cmd+K, filters results, and closes with Escape', async ({ page }) => {
    // Open command palette
    await page.keyboard.press('Meta+k');

    // The command palette dialog should appear
    const dialog = page.locator('[role="dialog"][aria-label="Command palette"]');
    await expect(dialog).toBeVisible();

    // Type "export" to filter results
    const input = dialog.locator('input');
    await input.fill('export');

    // Should show the Export Diagram command
    await expect(dialog.getByText('Export Diagram')).toBeVisible();

    // Close with Escape
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
  });
});
