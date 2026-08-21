import { test } from "@playwright/test";
import path from "path";

const OUT_DIR = path.join(process.cwd(), "test-results", "visual");

const DESKTOP_ONLY_PAGES: { name: string; path: string }[] = [
  { name: "crvs-overview", path: "/civil-registration" },
  { name: "birth-service", path: "/civil-registration/birth" },
  { name: "track", path: "/track" },
  { name: "verify", path: "/verify" },
  { name: "privacy", path: "/privacy" },
];

test.describe("Public site visual pass", () => {
  test("homepage renders without horizontal overflow", async ({ page }, testInfo) => {
    // Reduced motion makes .reveal sections render at full opacity
    // immediately instead of waiting on scroll-triggered
    // IntersectionObserver callbacks that a full-page screenshot (which
    // captures below-the-fold content that was never scrolled into
    // view) would otherwise never fire.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.waitForTimeout(400);
    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    await page.screenshot({
      path: path.join(OUT_DIR, `home-${testInfo.project.name}.png`),
      fullPage: true,
    });
    if (hasOverflow) {
      throw new Error(
        `Horizontal overflow detected on homepage at ${testInfo.project.name}`
      );
    }
  });

  for (const target of DESKTOP_ONLY_PAGES) {
    test(`${target.name} renders without horizontal overflow`, async ({ page }, testInfo) => {
      test.skip(
        testInfo.project.name !== "desktop-1440",
        "only captured once, at desktop width"
      );
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(target.path);
      await page.waitForTimeout(400);
      const hasOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth
      );
      await page.screenshot({
        path: path.join(OUT_DIR, `${target.name}-${testInfo.project.name}.png`),
        fullPage: true,
      });
      if (hasOverflow) {
        throw new Error(`Horizontal overflow detected on ${target.name}`);
      }
    });
  }
});
