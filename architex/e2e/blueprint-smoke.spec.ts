import { test, expect } from "@playwright/test";

/**
 * SP1 smoke test — every Blueprint route renders the shell and a
 * subproject-tagged "Coming soon" placeholder. Back/forward work.
 */

test.describe("Blueprint · shell + routes (SP1)", () => {
  test("home renders shell + SP2 placeholder", async ({ page }) => {
    await page.goto("/modules/blueprint");
    await expect(
      page.getByRole("navigation", { name: /Blueprint surfaces/ }),
    ).toBeVisible();
    await expect(page.getByText(/Coming soon/i)).toBeVisible();
    await expect(page.getByText("SP2").first()).toBeVisible();
  });

  test("surface tabs route between Journey / Toolkit / Progress", async ({
    page,
  }) => {
    await page.goto("/modules/blueprint");
    await page.getByRole("tab", { name: /Toolkit/ }).click();
    await expect(page).toHaveURL(/\/modules\/blueprint\/toolkit$/);
    await page.getByRole("tab", { name: /Progress/ }).click();
    await expect(page).toHaveURL(/\/modules\/blueprint\/progress$/);
    await page.getByRole("tab", { name: /Journey/ }).click();
    await expect(page).toHaveURL(/\/modules\/blueprint$/);
  });

  test("unit URL resolves with breadcrumb", async ({ page }) => {
    await page.goto("/modules/blueprint/unit/meet-builder");
    await expect(
      page.getByRole("navigation", { name: /Breadcrumb/ }),
    ).toBeVisible();
    await expect(page.getByText(/Meet Builder/)).toBeVisible();
    await expect(page.getByText("SP3").first()).toBeVisible();
  });

  test("toolkit pattern URL resolves", async ({ page }) => {
    await page.goto("/modules/blueprint/toolkit/patterns/builder");
    await expect(page.getByText("SP4").first()).toBeVisible();
  });

  test("toolkit problems URL resolves", async ({ page }) => {
    await page.goto("/modules/blueprint/toolkit/problems");
    await expect(page.getByText("SP5").first()).toBeVisible();
  });

  test("toolkit review URL resolves", async ({ page }) => {
    await page.goto("/modules/blueprint/toolkit/review");
    await expect(page.getByText("SP6").first()).toBeVisible();
  });

  test("progress URL resolves", async ({ page }) => {
    await page.goto("/modules/blueprint/progress");
    await expect(page.getByText("SP2").first()).toBeVisible();
  });

  test("browser back navigates through surfaces", async ({ page }) => {
    await page.goto("/modules/blueprint");
    await page.getByRole("tab", { name: /Toolkit/ }).click();
    await page.getByRole("tab", { name: /Progress/ }).click();
    await page.goBack();
    await expect(page).toHaveURL(/\/modules\/blueprint\/toolkit$/);
    await page.goBack();
    await expect(page).toHaveURL(/\/modules\/blueprint$/);
  });
});
