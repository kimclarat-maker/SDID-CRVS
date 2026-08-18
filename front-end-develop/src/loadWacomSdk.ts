// src/loadWacomSdk.ts
import * as SigSDK from "@/libs/wacom-sdk/signature-sdk.js";

if (typeof window !== "undefined") {
  (window as any).SigSDK = SigSDK;
}
