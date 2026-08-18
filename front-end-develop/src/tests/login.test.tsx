import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __myDirname = path.dirname(__filename);

// Now you can read the file
const myPhoto = fs.readFileSync(
  path.resolve(__myDirname, "../mocks/myPhoto.txt"),
  "utf-8"
);

import dotenv from "dotenv";
dotenv.config();

const PAGE_TITLE = "LOGIN";
const BASE_URL = "http://localhost:5173";
const TEST_EMAIL = "didierkibugenza@huzalabs.com"; // Replace with test account
const TEST_PASSWORD = "WqzUv9GKNm@"; // Replace with test account password

const HOME_URL = "http://localhost:5173/dashboard/admin";

let tempToken: any = null;

test.describe(`${PAGE_TITLE} Page`, () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test("Should contain required UI elements", async ({ page }) => {
    await expect(page.getByTestId("email")).toBeVisible();
    await expect(page.getByTestId("password")).toBeVisible();
    await expect(page.getByTestId("submit-button")).toBeVisible();
    await expect(page.getByTestId("forgot_password")).toBeVisible();
  });

  test("Should login with valid credentials and show MFA modal", async ({
    page,
  }) => {
    // 1. Fill and submit form (real API call)
    await page.getByTestId("email").fill(TEST_EMAIL);
    await page.getByTestId("password").fill(TEST_PASSWORD);

    // 2. Wait for both the click and API response
    const [response] = await Promise.all([
      page.waitForResponse((res) => res.url().includes("/auth/login"), {
        timeout: 15000,
      }),
      page.getByTestId("submit-button").click(),
    ]);

    // 3. Verify successful response
    expect(response.status()).toBe(201);
    const responseBody = await response.json();
    expect(responseBody).toHaveProperty("tempToken");
    expect(responseBody).toHaveProperty("message");

    tempToken = responseBody.tempToken;

    const mfaModal = page.getByTestId("mfa-modal");
    await mfaModal.waitFor({ state: "visible", timeout: 10000 });

    // 6. Verify modal content
    await expect(mfaModal).toBeVisible();
  });

  test("Should send face verification request", async ({ request, page }) => {
    const response = await request.post("/api/v1/auth/mfa/verify-face", {
      data: {
        photo: myPhoto,
        email: TEST_EMAIL,
        tempToken,
      },
      headers: {
        "x-sdid-api-key": process.env.VITE_API_KEY || "",
        "x-sdid-api-secret-key": process.env.VITE_API_SECRET_KEY || "",
      },
    });

    expect(response.status()).toBe(201);

    const body = await response.json();
    expect(body).toHaveProperty("token");

    const appName = process.env.VITE_APP_NAME || "ENROLLMENT";

    await page.evaluate(
      ({ appName, body }) => {
        sessionStorage.setItem(appName, JSON.stringify(body));
      },
      { appName, body }
    );
    await page.goto(HOME_URL);
  });
});
