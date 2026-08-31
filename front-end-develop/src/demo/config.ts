// Same env-resolution pattern as src/constants/cfg.ts and
// src/config/platform.config.ts: build-time import.meta.env first, falling
// back to a runtime window.________ENV__ override (post-build env injection).
const runtimeEnv =
  (typeof window !== "undefined" &&
    (window as unknown as { ________ENV__?: Record<string, string> })
      .________ENV__) ||
  {};

export const isDemoMode = (): boolean => {
  const raw =
    import.meta.env?.["VITE_DEMO_MODE"] ?? runtimeEnv.VITE_DEMO_MODE ?? "false";
  return String(raw).toLowerCase() === "true";
};

export const DEMO_STORAGE_PREFIX = "sdid-demo";
// Bumped from "5": DemoDatabase gained crvsDivorceNotifications/
// crvsDivorceRegistrations — any localStorage blob seeded before that shape
// existed must be force-reseeded rather than crash on missing fields.
// Bumped from "6": DemoDatabase gained crvsAnnulmentNotifications/
// crvsAnnulmentRegistrations, and MarriageApplication gained the additive
// annulment/judicialSeparation/correctionPending annotation fields.
export const DEMO_DATA_VERSION = "7";

// Simulated network latency so loading states are visible, per spec section 22.
export const demoDelay = <T>(value: T, ms?: number): Promise<T> =>
  new Promise((resolve) =>
    setTimeout(resolve, ms ?? 250 + Math.random() * 450, value)
  );
