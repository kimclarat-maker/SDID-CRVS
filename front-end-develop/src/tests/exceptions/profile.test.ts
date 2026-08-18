import { test } from "@/tests/fixtures";
import { expect } from "@playwright/test";

const PAGE_TITLE = "Requests/Pending";
const BASE_URL = "http://localhost:5173/dashboard/admin/request/pending";

test.describe(`${PAGE_TITLE} Page`, () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test("Should contain required UI elements", async ({ loggedInPage }) => {
    await expect(loggedInPage.getByTestId("back-button")).toBeVisible();
    await expect(loggedInPage.getByTestId("table")).toBeVisible();
    await expect(loggedInPage.getByTestId("prenrollmentNo")).toBeVisible();
  });

  test("Should fetch all skip selfie requests", async ({ loggedInPage }) => {
    const [response] = await Promise.all([
      loggedInPage.waitForResponse(
        (res) => res.url().includes("/pre-enrollment/search/all"),
        { timeout: 15000 }
      ),
    ]);

    console.log("response", response);
    expect(response.status()).toBe(201);
  });
});
