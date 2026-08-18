import { test, expect } from "@playwright/test";

const PAGE_TITLE = "Home/Dashboard";
const BASE_URL = "http://localhost:5173/dashboard/admin";

test.describe(`${PAGE_TITLE} Page`, () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test("Should contain required UI elements", async ({ page }) => {
    await expect(page.getByTestId("header")).toBeVisible();
    await expect(page.getByTestId("filters")).toBeVisible();
    await expect(page.getByTestId("content")).toBeVisible();
    await expect(page.getByTestId("endDate")).toBeVisible();
    await expect(page.getByTestId("startDate")).toBeVisible();
  });
});
