import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isDemoMode } from "@/demo/config";

describe("Demo-mode detection", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("defaults to disabled when VITE_DEMO_MODE is unset", () => {
    vi.stubEnv("VITE_DEMO_MODE", "");
    expect(isDemoMode()).toBe(false);
  });

  it("stays disabled for any value other than the literal string 'true'", () => {
    vi.stubEnv("VITE_DEMO_MODE", "false");
    expect(isDemoMode()).toBe(false);

    vi.stubEnv("VITE_DEMO_MODE", "1");
    expect(isDemoMode()).toBe(false);
  });

  it("enables demo mode when VITE_DEMO_MODE=true", () => {
    vi.stubEnv("VITE_DEMO_MODE", "true");
    expect(isDemoMode()).toBe(true);
  });

  it("is case-insensitive", () => {
    vi.stubEnv("VITE_DEMO_MODE", "TRUE");
    expect(isDemoMode()).toBe(true);
  });
});
