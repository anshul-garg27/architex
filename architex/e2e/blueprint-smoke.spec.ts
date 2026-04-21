import { test, expect } from "@playwright/test";

/**
 * SP1 + SP2 smoke test — every Blueprint route renders and the shell
 * stays intact. Routes whose bodies haven't shipped yet show a
 * subproject-tagged "Coming soon" placeholder; routes that have
 * shipped (SP2) render their real component.
 */

test.describe("Blueprint · shell + routes", () => {
  test("home renders journey layout (SP2)", async ({ page }) => {
    await page.goto("/modules/blueprint");
    await expect(
      page.getByRole("navigation", { name: /Blueprint surfaces/ }),
    ).toBeVisible();
    // SP2 journey home shows "Your journey" heading instead of Coming soon
    await expect(page.getByRole("heading", { name: /Your journey/ })).toBeVisible();
  });

  test("progress dashboard renders real cards (SP2)", async ({ page }) => {
    await page.goto("/modules/blueprint/progress");
    await expect(page.getByRole("heading", { name: /Your progress/ })).toBeVisible();
  });

  test("pattern mastery grid renders (SP2)", async ({ page }) => {
    await page.goto("/modules/blueprint/progress/patterns");
    await expect(
      page.getByRole("heading", { name: /Pattern mastery/ }),
    ).toBeVisible();
  });

  test("streak detail renders (SP2)", async ({ page }) => {
    await page.goto("/modules/blueprint/progress/streak");
    await expect(page.getByRole("heading", { name: /Your streak/ })).toBeVisible();
  });

  test("problem history empty-state renders (SP2)", async ({ page }) => {
    await page.goto("/modules/blueprint/progress/problems");
    await expect(
      page.getByRole("heading", { name: /Problem history/ }),
    ).toBeVisible();
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

  test("unit URL renders SP3 placeholder", async ({ page }) => {
    await page.goto("/modules/blueprint/unit/meet-builder");
    await expect(
      page.getByRole("navigation", { name: /Breadcrumb/ }),
    ).toBeVisible();
    await expect(page.getByText("SP3").first()).toBeVisible();
  });

  test("toolkit pattern URL renders SP4 placeholder", async ({ page }) => {
    await page.goto("/modules/blueprint/toolkit/patterns/builder");
    await expect(page.getByText("SP4").first()).toBeVisible();
  });

  test("toolkit problems URL renders SP5 placeholder", async ({ page }) => {
    await page.goto("/modules/blueprint/toolkit/problems");
    await expect(page.getByText("SP5").first()).toBeVisible();
  });

  test("toolkit review URL renders SP6 placeholder", async ({ page }) => {
    await page.goto("/modules/blueprint/toolkit/review");
    await expect(page.getByText("SP6").first()).toBeVisible();
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
