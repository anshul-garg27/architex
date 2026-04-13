import { test, expect } from '@playwright/test';

test.describe('Keyboard shortcuts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Cmd+B toggles the sidebar', async ({ page }) => {
    // The sidebar should be visible by default (component palette aside)
    const sidebar = page.locator('aside[aria-label="Component palette"]');
    await expect(sidebar).toBeVisible();

    // Press Cmd+B to hide
    await page.keyboard.press('Meta+b');
    await expect(sidebar).not.toBeVisible();

    // Press Cmd+B again to show
    await page.keyboard.press('Meta+b');
    await expect(sidebar).toBeVisible();
  });

  test('? opens the keyboard shortcuts dialog', async ({ page }) => {
    // Press ? to open keyboard shortcuts dialog
    await page.keyboard.press('?');

    // The dialog should show up with "Keyboard Shortcuts" heading
    const heading = page.getByRole('heading', { name: 'Keyboard Shortcuts' });
    await expect(heading).toBeVisible();

    // It should list known shortcuts
    await expect(page.getByText('Open command palette')).toBeVisible();
    await expect(page.getByText('Toggle sidebar')).toBeVisible();

    // Close with Escape
    await page.keyboard.press('Escape');
    await expect(heading).not.toBeVisible();
  });
});
