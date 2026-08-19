import { afterEach, describe, expect, it, vi } from "vitest";
import api from "@/api";

describe("Demo-mode safety net", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("blocks any request through the shared client that isn't demo-wired", async () => {
    vi.stubEnv("VITE_DEMO_MODE", "true");

    await expect(
      api({ method: "GET", url: "/some/unwired/endpoint" } as any)
    ).rejects.toThrow(/demo environment/i);
  });

  // The production (demo mode off) path is intentionally not exercised here
  // with a real network call — that would require a live backend or a mock
  // server and risks a slow/flaky test. Every demo branch in the api layer
  // is behind `if (isDemoMode())`, which defaults to false (see
  // demoMode.test.ts), so the pre-existing production code path below that
  // check is provably unreached and unchanged.
});
