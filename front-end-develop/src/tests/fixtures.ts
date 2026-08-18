import {
  test as base,
  expect,
  Page,
  APIRequestContext,
} from "@playwright/test";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __myDirname = path.dirname(__filename);

const myPhoto = fs.readFileSync(
  path.resolve(__myDirname, "../mocks/myPhoto.txt"),
  "utf-8"
);

const TEST_EMAIL = process.env.TEST_EMAIL || "didierkibugenza@huzalabs.com";
const TEST_PASSWORD = process.env.TEST_PASSWORD || "WqzUv9GKNm@";
const HOME_URL =
  process.env.HOME_URL || "http://localhost:5173/dashboard/admin";
const APP_NAME = process.env.VITE_APP_NAME || "ENROLLMENT";

type AuthFixtures = {
  loggedInPage: Page;
};

export const test = base.extend<AuthFixtures>({
  loggedInPage: async ({ page, request }, use) => {
    // Navigate to login page
    await page.goto(process.env.BASE_URL || "http://localhost:5173");

    // Fill login form
    await page.getByTestId("email").fill(TEST_EMAIL);
    await page.getByTestId("password").fill(TEST_PASSWORD);

    // Wait for login response and button click
    const [loginResponse] = await Promise.all([
      page.waitForResponse((res) => res.url().includes("/auth/login"), {
        timeout: 15000,
      }),
      page.getByTestId("submit-button").click(),
    ]);

    expect(loginResponse.status()).toBe(201);
    const loginBody = await loginResponse.json();
    expect(loginBody).toHaveProperty("tempToken");
    expect(loginBody).toHaveProperty("message");

    const tempToken = loginBody.tempToken;

    // Wait for MFA modal
    const mfaModal = page.getByTestId("mfa-modal");
    await mfaModal.waitFor({ state: "visible", timeout: 10000 });
    await expect(mfaModal).toBeVisible();

    // Call face verification API
    const faceResponse = await request.post("/api/v1/auth/mfa/verify-face", {
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

    expect(faceResponse.status()).toBe(201);
    const faceBody = await faceResponse.json();
    expect(faceBody).toHaveProperty("token");

    // Store face verification response in sessionStorage
    await page.evaluate(
      ({ appName, body }) => {
        sessionStorage.setItem(appName, JSON.stringify(body));
      },
      { appName: APP_NAME, body: faceBody }
    );

    // Go to home/dashboard page (logged in)
    await page.goto(HOME_URL);

    // Provide logged-in page to tests
    await use(page);
  },
});
