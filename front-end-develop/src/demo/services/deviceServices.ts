// Demo-mode backing for the hardware/AI-microservice-dependent API modules:
// src/api/iris (physical iris scanner over localhost), src/api/quality
// (BIO_AUDIT_API fingerprint/iris/face quality scoring), src/api/selfie
// (face-match/MFA verification), and src/api/health (local offline-service
// health check). None of these can be meaningfully simulated — they talk to
// real hardware or a local AI microservice that simply doesn't exist in a
// browser-only demo. Rather than fabricate capture data, iris device calls
// report "no device" (the same graceful path the capture screen already
// takes when nothing is plugged in), quality checks report a passing score,
// and face-match/MFA calls report success so identity-verification steps
// don't block a demo walkthrough — none of this reaches a real endpoint.
import { demoDelay } from "../config";

// ---- Iris device (src/api/iris) ----
// success: false (not a thrown error) intentionally reproduces the "device
// not connected" branch the capture screen (biometricCapture/iris/index.tsx)
// already handles gracefully via a toast, rather than inventing fake capture
// frames for hardware that isn't present in a demo environment.
export const demoOpenIrisDevice = async () =>
  demoDelay({ success: false, message: "No iris device connected (demo)." });
export const demoCloseIrisDevice = async () => demoDelay({ success: true });
export const demoStartIrisDevice = async () =>
  demoDelay({ success: false, message: "No iris device connected (demo)." });
export const demoFetchLastAsBase64 = async () => demoDelay({ base64: "" });
export const demoAbortIrisDevice = async () => demoDelay({ success: true });
export const demoManualCaptureIrisDevice = async () =>
  demoDelay({ success: false, message: "No iris device connected (demo)." });

// ---- Quality checker (src/api/quality/checker.ts) ----
// Always reports a passing score — there's no real biometric SDK to grade
// against in demo mode.
export const demoQualityChecker = async () =>
  demoDelay({ quality: 92, passed: true, isLive: true });
export const demoIrisQualityChecker = async () =>
  demoDelay({ quality: 90, passed: true });
export const demoFingerprintQualityChecker = async () =>
  demoDelay({ Nfiq2: 3, quality: 88, passed: true });

// ---- Selfie / MFA verification (src/api/selfie) ----
export const demoFaceMatchProbability = async () =>
  demoDelay({ probability: 0.97, match: true });
export const demoVerifyEmbedding = async () =>
  demoDelay({ message: "Verified (demo).", verified: true });
export const demoFaceEmbedding = async () =>
  demoDelay({ embedding: [] });
export const demoMfaFacialVerification = async () =>
  demoDelay({ message: "Facial verification passed (demo)." });
export const demoApplicantSelfieMatch = async () =>
  demoDelay({ match: true, message: "Selfie matched (demo)." });
export const demoApplicantSelfieEmbedding = async () =>
  demoDelay({ match: true, message: "Selfie matched (demo)." });
export const demoApplicantSelfieWithoutMatch = async () =>
  demoDelay({ message: "Selfie recorded without match check (demo)." });

// ---- Local service health (src/api/health) ----
export const demoFetchAPIServiceInfo = async () =>
  demoDelay({
    apiGatewayBaseUrl: "",
    version: "demo",
    syncStatus: "INACTIVE",
  });
