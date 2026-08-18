import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:5173";
const URL = `${BASE_URL}/authentication/resetPassword`;
const PAGE_TITLE = "RESET PASSWORD";
const INVALID_TOKEN = "BLABLABLALBAL";

test.describe(`${PAGE_TITLE} Page`, () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(URL);
  });

  test("Should contain required UI elements", async ({ page }) => {
    await expect(page.getByTestId("password")).toBeVisible();
    await expect(page.getByTestId("newPassword")).toBeVisible();
    await expect(page.getByTestId("submit_button")).toBeVisible();
  });

  test("Should show error message when submitting wrong token", async ({
    page,
  }) => {
    // Mock API response
    await page.route(`**/auth/reset-password/${INVALID_TOKEN}`, (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          message: "Password reset successfully",
        }),
      });
    });

    // Fill and submit form
    await page.getByTestId("password").fill("12345609");
    await page.getByTestId("newassword").fill("12345609");
    await page.getByTestId("submit_button").click();

    // Assert toast message
    const toast = page.locator(".go2072408551"); // Default toast container class
    await expect(toast).toBeVisible({ timeout: 10000 });
    await expect(toast).toContainText(/Invalid token/i);
  });
});
