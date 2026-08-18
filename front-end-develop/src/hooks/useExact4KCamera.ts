import { useCallback, useEffect, useRef, useState } from "react";
import type { Exact4KCameraApp } from "@/utils/cameraExact4k";
import {
  initExact4KCamera,
  BIOMETRIC_RECOMMENDATIONS,
} from "@/utils/cameraExact4k";

export { BIOMETRIC_RECOMMENDATIONS };

export function useExact4KCamera(options?: {
  mirrorPreview?: boolean;
  frameRate?: number;
  previewWidth?: string;
  zoom?: number;
  bottomOffset?: number;
  brightness?: number;
  topOffset?: number;
}) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<Exact4KCameraApp | null>(null);

  const [status, setStatus] = useState<
    | { kind: "idle" }
    | { kind: "starting" }
    | { kind: "ready"; width: number; height: number }
    | { kind: "error"; message: string }
  >({ kind: "idle" });

  // New state for adjustments
  const [zoomFactor, setZoomFactor] = useState(options?.zoom); // default: no zoom
  const [brightness, setBrightness] = useState(options?.brightness); // default: normal brightness
  const [topOffset, setTopOffset] = useState(options?.topOffset); // cropping offsets
  const [bottomOffset, setBottomOffset] = useState(options?.bottomOffset);

  const start = useCallback(async () => {
    if (!mountRef.current) return;
    setStatus({ kind: "starting" });
    try {
      console.log("Starting camera...");
      const app = await initExact4KCamera({
        mount: mountRef.current,
        frameRate: options?.frameRate ?? BIOMETRIC_RECOMMENDATIONS.frameRate,
        mirrorPreview:
          options?.mirrorPreview ?? BIOMETRIC_RECOMMENDATIONS.mirrorPreview,
        previewWidth: options?.previewWidth,
      });
      appRef.current = app;
      setStatus({
        kind: "ready",
        width: app.video.videoWidth,
        height: app.video.videoHeight,
      });
      console.log("Camera started");
    } catch (err: any) {
      console.log("Error starting camera:", err);
      setStatus({ kind: "error", message: err?.message ?? String(err) });
    }
  }, [options?.frameRate, options?.mirrorPreview, options?.previewWidth]);

  const stop = useCallback(() => {
    appRef.current?.stop();
    appRef.current = null;
    if (mountRef.current) mountRef.current.innerHTML = "";
    setStatus({ kind: "idle" });
  }, []);

  const captureJPEG = useCallback(async (quality = 1.0) => {
    if (!appRef.current) throw new Error("Camera not ready");
    return appRef.current.captureJPEG(quality);
  }, []);

  const capturePNG = useCallback(async () => {
    if (!appRef.current) throw new Error("Camera not ready");
    return appRef.current.capturePNG();
  }, []);

  const captureBase64 = useCallback(
    async (
      type: "image/jpeg" | "image/png" = BIOMETRIC_RECOMMENDATIONS.format,
      quality = BIOMETRIC_RECOMMENDATIONS.quality
    ) => {
      if (!appRef.current) throw new Error("Camera not ready");
      return appRef.current.captureBase64(type, quality);
    },
    []
  );

  const capturePassportBase64 = useCallback(
    async (
      type: "image/jpeg" | "image/png" = BIOMETRIC_RECOMMENDATIONS.format,
      quality = BIOMETRIC_RECOMMENDATIONS.quality
    ) => {
      if (!appRef.current) throw new Error("Camera not ready");
      return appRef.current.capturePassportBase64(type, quality);
    },
    []
  );

  const tuneForBiometric = useCallback(
    async (opts?: {
      zoomLevel?: "none" | "low" | "mid" | "high";
      exposureCompensation?: number;
    }) => {
      if (!appRef.current) throw new Error("Camera not ready");
      return appRef.current.tuneForBiometric(opts);
    },
    []
  );

  const download = useCallback(
    async (
      filename = "frame.jpg",
      type: "image/jpeg" | "image/png" = BIOMETRIC_RECOMMENDATIONS.format,
      quality = BIOMETRIC_RECOMMENDATIONS.quality
    ) => {
      if (!appRef.current) throw new Error("Camera not ready");
      await appRef.current.download(filename, type, quality);
    },
    []
  );

  useEffect(() => {
    return () => appRef.current?.stop();
  }, []);

  return {
    mountRef,
    status,
    start,
    stop,
    captureJPEG,
    capturePNG,
    captureBase64,
    capturePassportBase64,
    tuneForBiometric,
    download,
    // Expose new states and setters
    zoomFactor,
    setZoomFactor,
    brightness,
    setBrightness,
    topOffset,
    setTopOffset,
    bottomOffset,
    setBottomOffset,
  };
}
