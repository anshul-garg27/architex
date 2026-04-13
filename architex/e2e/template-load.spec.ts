import { test, expect } from '@playwright/test';

test.describe('Template loading', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('opens template gallery with Cmd+T, clicks first template, verifies nodes on canvas', async ({ page }) => {
    // Open template gallery
    await page.keyboard.press('Meta+t');

    // The template gallery dialog should appear
    const dialog = page.locator('[role="dialog"][aria-label="Template Gallery"]');
    await expect(dialog).toBeVisible();

    // Click the first template card (button inside the gallery grid)
    const firstTemplate = dialog.locator('button.group').first();
    await firstTemplate.click();

    // Gallery should close after selecting
    await expect(dialog).not.toBeVisible();

    // Status bar should show nodes were loaded (e.g. "X nodes / Y edges" where X > 0)
    const statusBar = page.locator('[role="status"]');
    await expect(statusBar).not.toContainText('0 nodes');
  });
});
