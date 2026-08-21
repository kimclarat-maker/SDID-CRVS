import { defineConfig, devices } from "@playwright/test";

/**
 * Dedicated config for the public-site visual regression spec. Kept
 * separate from playwright.config.ts, which ties baseURL to a deployment
 * API env var and has no webServer — unsuitable for screenshotting the
 * local dev build.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "public-visual.spec.ts",
  timeout: 30000,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:5190",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5190",
    reuseExistingServer: true,
    timeout: 60000,
  },
  projects: [
    {
      name: "desktop-1440",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
    {
      name: "tablet-768",
      use: { ...devices["Desktop Chrome"], viewport: { width: 768, height: 1024 } },
    },
    {
      name: "mobile-390",
      use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 } },
    },
  ],
});
