import { test, expect } from '@playwright/test';

test.describe('Algorithm run', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('switch to algorithms, select bubble sort, generate random data, run, and verify bars appear', async ({ page }) => {
    // Switch to the Algorithms module
    const algoBtn = page.getByRole('button', { name: /^Algorithms/ });
    await algoBtn.click();

    // Verify status bar shows Algorithms
    const statusBar = page.locator('[role="status"]');
    await expect(statusBar).toContainText('Algorithms');

    // The algorithm select dropdown should default to Bubble Sort (first sorting algo).
    // Select "Bubble Sort" explicitly to be safe.
    const algoSelect = page.locator('select').first();
    await algoSelect.selectOption({ label: 'Bubble Sort' });

    // Click the "Generate" button to create random array data
    const generateBtn = page.getByRole('button', { name: /Generate/i });
    await generateBtn.click();

    // Click the "Run" button to execute the algorithm
    const runBtn = page.getByRole('button', { name: /^Run$/i });
    await runBtn.click();

    // After running, the ArrayVisualizer renders SVG rect elements (bars).
    // Wait for at least one bar to appear within the canvas area.
    const bars = page.locator('svg rect, [class*="rounded-t"]');
    await expect(bars.first()).toBeVisible({ timeout: 5000 });
  });
});
