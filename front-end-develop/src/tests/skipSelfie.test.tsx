import { test } from "./fixtures";
import { expect } from "@playwright/test";

const BASE_URL = "http://localhost:5173";
const URL = `${BASE_URL}/dashboard/admin/prenrollment/search`;
const PAGE_TITLE = "SKIP SELFIE";

test.describe(`${PAGE_TITLE} Page`, () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(URL);
  });

  test("Should skip selfie modal", async ({ loggedInPage }) => {
    const modal = loggedInPage.getByTestId("modal");
    await modal.waitFor({ state: "visible", timeout: 10000 });

    await expect(modal).toBeVisible();
  });

  test("Should contain required UI elements", async ({ loggedInPage }) => {
    await expect(loggedInPage.getByTestId("webcam")).toBeVisible();
    await expect(loggedInPage.getByTestId("camera")).toBeVisible();
    await expect(loggedInPage.getByTestId("submit_button")).toBeVisible();
    await expect(loggedInPage.getByTestId("back-button")).toBeVisible();
  });

  test("Should request selfie skip code", async ({ request }) => {
    const response = await request.post("/api/v1/", {
      data: {},
      headers: {
        "x-sdid-api-key": process.env.VITE_API_KEY || "",
        "x-sdid-api-secret-key": process.env.VITE_API_SECRET_KEY || "",
      },
    });

    expect(response.status()).toBe(200);
  });
});
