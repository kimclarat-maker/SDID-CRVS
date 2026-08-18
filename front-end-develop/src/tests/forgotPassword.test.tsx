import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:5173";
const FORGOT_PASSWORD_URL = `${BASE_URL}/authentication/forgotPassword`;
const EMAIL = "didierkibuenza@huzalabs.com";
const PAGE_TITLE = "FORGOT PASSWORD";

test.describe(`${PAGE_TITLE} Page`, () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(FORGOT_PASSWORD_URL);
  });

  test("Should contain required UI elements", async ({ page }) => {
    await expect(page.getByTestId("email")).toBeVisible();
    await expect(page.getByTestId("submit_button")).toBeVisible();
    await expect(page.getByTestId("back_button")).toBeVisible();
  });

  test("Should show success toast after submitting valid email", async ({
    page,
  }) => {
    // Mock API response
    await page.route("**/auth/send-password-reset-link", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          message: "Password reset link sent successfully",
        }),
      });
    });

    // Fill and submit form
    await page.getByTestId("email").fill(EMAIL);
    await page.getByTestId("submit_button").click();

    // Assert toast message
    const toast = page.locator(".go2072408551"); // Default toast container class
    await expect(toast).toBeVisible({ timeout: 10000 });
    await expect(toast).toContainText(/password reset link sent successfully/i);
  });
});
