// Demo-mode backing for src/api/otp. No real SMS/email gateway exists in
// demo mode, so any code is accepted — verification always succeeds, mirroring
// how the rest of the demo layer favors "let the walkthrough proceed" over
// modeling a realistic failure path.
import { demoDelay } from "../config";

export const demoSendOTP = async () =>
  demoDelay({
    message: "OTP sent (demo). Enter any 6-digit code to continue.",
    retryIn: 30000,
  });

export const demoVerifyOTP = async () =>
  demoDelay({ message: "OTP verified (demo).", verified: true });

export const demoRequestSelfieSkipVerificationCode = async () =>
  demoDelay({
    message: "Skip-verification code generated (demo).",
    selfieVerificationSkipCode: "DEMO01",
  });

export const demoResumeBySelfieSkipCode = async () =>
  demoDelay({ message: "Resumed via skip code (demo)." });

export const demoLegalGuardianResumeBySelfieSkipCode = async () =>
  demoDelay({ message: "Resumed via legal guardian skip code (demo)." });
