import { useCallback, useEffect, useRef, useState } from "react";
import {
  initExact4KCamera,
  BIOMETRIC_RECOMMENDATIONS,
  Exact4KCameraApp,
} from "@/utils/cameraExact4k";

export function useExact4KCameraISO(initial?: {
  zoomFactor?: number;
  brightness?: number;
  topOffset?: number;
  bottomOffset?: number;
}) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const appRef = useRef<Exact4KCameraApp | null>(null);

  const [zoomFactor, setZoomFactor] = useState(initial?.zoomFactor ?? 1.3);
  const [brightness, setBrightness] = useState(initial?.brightness ?? 1.1);
  const [topOffset, setTopOffset] = useState(initial?.topOffset ?? 0);
  const [bottomOffset, setBottomOffset] = useState(initial?.bottomOffset ?? 0);
  const [status, setStatus] = useState<
    | { kind: "idle" }
    | { kind: "starting" }
    | { kind: "ready"; width: number; height: number }
    | { kind: "error"; message: string }
  >({ kind: "idle" });

  const start = useCallback(async () => {
    if (!mountRef.current) return;
    setStatus({ kind: "starting" });
    try {
      const app = await initExact4KCamera({
        mount: mountRef.current,
        mirrorPreview: BIOMETRIC_RECOMMENDATIONS.mirrorPreview,
        previewWidth: "413px",
      });

      if (app.video) {
        app.video.style.width = "100%";
        app.video.style.height = "100%";
        app.video.style.objectFit = "cover";
        app.video.style.position = "absolute";
      }

      appRef.current = app;
      setStatus({
        kind: "ready",
        width: app.video.videoWidth,
        height: app.video.videoHeight,
      });
    } catch (err: any) {
      setStatus({ kind: "error", message: err?.message ?? String(err) });
    }
  }, []);

  const stop = useCallback(() => {
    if (!appRef.current) return;
    const stream = appRef.current.video.srcObject as MediaStream;
    if (stream) stream.getTracks().forEach((track) => track.stop());
    appRef.current.video.srcObject = null;
    appRef.current = null;
    setStatus({ kind: "idle" });
  }, []);

  // Draw live preview
  useEffect(() => {
    let frameId: number;
    const draw = () => {
      if (!appRef.current || !previewCanvasRef.current) {
        frameId = requestAnimationFrame(draw);
        return;
      }
      const { video } = appRef.current;
      const ctx = previewCanvasRef.current.getContext("2d");
      if (!ctx) {
        frameId = requestAnimationFrame(draw);
        return;
      }

      const videoWidth = video.videoWidth || 1280;
      const videoHeight = video.videoHeight || 720;

      // Calculate the target area to crop from the video
      const targetHeight = videoHeight / zoomFactor;
      const targetWidth = (targetHeight * 3) / 4;

      // Center the crop area horizontally and apply vertical offset
      const sx = (videoWidth - targetWidth) / 2;
      const sy = (videoHeight - targetHeight) / 2 + topOffset - bottomOffset;

      ctx.clearRect(
        0,
        0,
        previewCanvasRef.current.width,
        previewCanvasRef.current.height
      );
      ctx.filter = `brightness(${brightness})`;

      try {
        ctx.drawImage(
          video,
          Math.max(0, sx), // Ensure we don't go negative
          Math.max(0, sy), // Ensure we don't go negative
          Math.min(targetWidth, videoWidth - sx), // Don't exceed video bounds
          Math.min(targetHeight, videoHeight - sy), // Don't exceed video bounds
          0,
          0,
          previewCanvasRef.current.width,
          previewCanvasRef.current.height
        );
      } catch (e) {
        console.error("Error drawing image:", e);
      }

      frameId = requestAnimationFrame(draw);
    };

    frameId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameId);
  }, [zoomFactor, brightness, topOffset, bottomOffset]);

  useEffect(() => {
    return () => stop();
  }, [stop]);

  // Capture current preview as Base64
  const captureImage = useCallback((): string | null => {
    if (!previewCanvasRef.current) return null;
    return previewCanvasRef.current.toDataURL("image/jpeg", 0.92);
  }, []);

  return {
    mountRef,
    previewCanvasRef,
    status,
    zoomFactor,
    setZoomFactor,
    brightness,
    setBrightness,
    topOffset,
    setTopOffset,
    bottomOffset,
    setBottomOffset,
    start,
    stop,
    captureImage,
  };
}
