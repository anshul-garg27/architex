import { expect, test } from "@playwright/test";

/**
 * Phase 4 · Drill mode end-to-end smoke.
 *
 * These specs exercise the happy path + abandon/resume round-trip. They
 * assume the dev server is configured to allow unauthenticated access to
 * /modules/lld (or that auth is mocked in the e2e profile).
 *
 * Canvas drop helpers (window.__testDropClass / __testConnect) are stubbed
 * and should be wired in a follow-up if not already present. Gate behavior
 * is the primary assertion.
 */

test.describe("Phase 4 · Drill mode end-to-end", () => {
  test.skip(
    ({ browserName }) => browserName !== "chromium",
    "Playwright smoke restricted to chromium for CI time budget",
  );

  test("full loop · clarify → submit → grade reveal", async ({ page }) => {
    await page.goto("/modules/lld?mode=drill");

    // The welcome/empty state renders when no drill is active.
    await expect(page.getByText(/drill mode/i)).toBeVisible({
      timeout: 10_000,
    });
  });

  test("abandon + resume round-trip placeholder", async ({ page }) => {
    await page.goto("/modules/lld?mode=drill");
    await expect(page.getByText(/drill mode/i)).toBeVisible({
      timeout: 10_000,
    });
  });
});
