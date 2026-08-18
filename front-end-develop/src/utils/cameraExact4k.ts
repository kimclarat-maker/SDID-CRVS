declare global {
  interface MediaTrackCapabilities {
    focusMode?: string[];
    whiteBalanceMode?: string[];
    exposureMode?: string[];
    zoom?: { min: number; max: number; step?: number };
    exposureCompensation?: { min: number; max: number; step?: number };
  }
  interface MediaTrackConstraintSet {
    focusMode?: any;
    whiteBalanceMode?: any;
    exposureMode?: any;
    zoom?: number;
    exposureCompensation?: number;
  }
}

export {};

export type InitOptions = {
  mount?: HTMLElement; // optional: where to place a <video> element
  frameRate?: number; // default 30
  mirrorPreview?: boolean; // default false (biometric: false recommended)
  previewWidth?: string;
};

export type Exact4KCameraApp = {
  stream: MediaStream;
  video: HTMLVideoElement;
  captureJPEG(quality?: number): Promise<Blob>;
  capturePNG(): Promise<Blob>;
  captureBase64(
    type?: "image/jpeg" | "image/png",
    quality?: number
  ): Promise<string>;
  /** Capture a passport-style portrait (3:4) as Base64 data URL, cropped from the 3840×2160 frame. */
  capturePassportBase64(
    type?: "image/jpeg" | "image/png",
    quality?: number
  ): Promise<string>;
  /** Try to set continuous AF/AWB/AE, modest zoom, etc. (best-effort; silently no-ops if unsupported). */
  tuneForBiometric(options?: {
    zoomLevel?: "none" | "low" | "mid" | "high";
    exposureCompensation?: number;
  }): Promise<{
    applied: Record<string, unknown>;
    capabilities?: MediaTrackCapabilities;
  }>;
  download(
    filename?: string,
    type?: "image/jpeg" | "image/png",
    quality?: number
  ): Promise<void>;
  stop(): void;
};

export const BIOMETRIC_RECOMMENDATIONS = {
  mirrorPreview: false,
  frameRate: 30,
  format: "image/jpeg" as const,
  quality: 0.92,
  notes: [
    "Neutral expression, mouth closed, eyes open",
    "Even front lighting (no hard shadows), plain light background",
    "Subject ~0.5-1 m from background to avoid shadows",
    "Keep lens at eye level; avoid wide-angle distortion",
    "Use modest zoom rather than getting too close",
  ],
};

const EXACT_WIDTH = 3840;
const EXACT_HEIGHT = 2160;

export async function initExact4KCamera(
  opts: InitOptions = {}
): Promise<Exact4KCameraApp> {
  assertBrowser();
  const frameRate = opts.frameRate ?? 30;

  // Step 1: provisional stream to unlock devices
  const provisional = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: false,
  });
  const provisionalTrack = provisional.getVideoTracks()[0];

  // Try applyConstraints on existing track first
  try {
    await provisionalTrack.applyConstraints({
      width: EXACT_WIDTH,
      height: EXACT_HEIGHT,
      frameRate,
    });
    const s = provisionalTrack.getSettings();
    if (s.width === EXACT_WIDTH && s.height === EXACT_HEIGHT) {
      const video = await attachVideo(provisional, !!opts.mirrorPreview);
      const app = makeApp(provisional, video);
      maybeMountVideo(app, opts.mount, opts?.previewWidth);
      return app;
    }
  } catch {
    // ignore; fall back to iterating devices
  }

  // Step 2: iterate devices with exact constraints
  const devices = (await navigator.mediaDevices.enumerateDevices()).filter(
    (d) => d.kind === "videoinput"
  );
  provisional.getTracks().forEach((t) => t.stop());

  let lastError: unknown = null;
  for (const dev of devices) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: { exact: dev.deviceId },
          width: { exact: EXACT_WIDTH },
          height: { exact: EXACT_HEIGHT },
          frameRate: { ideal: frameRate },
        },
        audio: false,
      });
      const track = stream.getVideoTracks()[0];
      const s = track.getSettings();
      if (s.width === EXACT_WIDTH && s.height === EXACT_HEIGHT) {
        const video = await attachVideo(stream, !!opts.mirrorPreview);
        const app = makeApp(stream, video);
        maybeMountVideo(app, opts.mount, opts?.previewWidth);
        return app;
      }
      stream.getTracks().forEach((t) => t.stop());
    } catch (e) {
      lastError = e;
    }
  }

  throw new Error(
    `No connected camera could deliver EXACT 3840x2160.\n` +
      `Tip: Ensure the webcam supports 4K, use USB 3.0+, and close other camera apps.\n` +
      `Last error: ${String(
        (lastError as Error)?.message ?? lastError ?? "unknown"
      )}`
  );
}

function assertBrowser() {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    throw new Error("Must run in a browser (window/navigator unavailable)");
  }
}

async function attachVideo(
  stream: MediaStream,
  mirror = false
): Promise<HTMLVideoElement> {
  const video = document.createElement("video");
  video.playsInline = true;
  video.muted = true;
  video.srcObject = stream;
  if (mirror) video.style.transform = "scaleX(-1)";
  await video.play().catch(() => {});
  if (!video.videoWidth || !video.videoHeight) {
    await new Promise<void>(
      (resolve) => (video.onloadedmetadata = () => resolve())
    );
  }
  return video;
}

function makeApp(
  stream: MediaStream,
  video: HTMLVideoElement
): Exact4KCameraApp {
  function ensure4K() {
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (w !== EXACT_WIDTH || h !== EXACT_HEIGHT) {
      throw new Error(
        `Active video is ${w}x${h}, not exact 4K ${EXACT_WIDTH}x${EXACT_HEIGHT}.`
      );
    }
    return { w, h };
  }

  async function capture(type: "image/jpeg" | "image/png", quality?: number) {
    const { w, h } = ensure4K();
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D context unavailable");
    ctx.drawImage(video, 0, 0, w, h);

    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("canvas.toBlob failed"))),
        type,
        type === "image/jpeg" ? quality : undefined
      )
    );
  }

  async function captureJPEG(quality = 1.0) {
    return capture("image/jpeg", quality);
  }
  async function capturePNG() {
    return capture("image/png");
  }
  async function captureBase64(
    type: "image/jpeg" | "image/png" = "image/jpeg",
    quality = 1.0
  ) {
    const blob =
      type === "image/png" ? await capturePNG() : await captureJPEG(quality);
    return blobToDataUrl(blob);
  }
  async function capturePassportBase64(
    type: "image/jpeg" | "image/png" = "image/jpeg",
    quality = 0.92
  ) {
    const { w, h } = ensure4K(); // w=3840, h=2160
    // Crop to portrait 3:4 (keep full height 2160, width=1620) centered
    const targetH = h;
    const targetW = Math.round((targetH * 3) / 4); // 1620
    const sx = Math.max(0, Math.floor((w - targetW) / 2));
    const sy = 0;

    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D context unavailable");
    ctx.drawImage(video, sx, sy, targetW, targetH, 0, 0, targetW, targetH);

    return canvas.toDataURL(type, type === "image/jpeg" ? quality : undefined);
  }

  async function tuneForBiometric(options?: {
    zoomLevel?: "none" | "low" | "mid" | "high";
    exposureCompensation?: number;
  }) {
    const track = stream.getVideoTracks()[0];
    const caps = track.getCapabilities?.();
    const applied: Record<string, unknown> = {};
    const advanced: MediaTrackConstraintSet[] = [];

    // Continuous modes when available
    if (
      caps?.focusMode &&
      (caps.focusMode as string[]).includes("continuous")
    ) {
      advanced.push({ focusMode: "continuous" as any });
      applied.focusMode = "continuous";
    }
    if (
      caps?.whiteBalanceMode &&
      (caps.whiteBalanceMode as string[]).includes("continuous")
    ) {
      advanced.push({ whiteBalanceMode: "continuous" as any });
      applied.whiteBalanceMode = "continuous";
    }
    if (
      caps?.exposureMode &&
      (caps.exposureMode as string[]).includes("continuous")
    ) {
      advanced.push({ exposureMode: "continuous" as any });
      applied.exposureMode = "continuous";
    }

    // Modest zoom (reduce wide-angle distortion)
    const level = options?.zoomLevel ?? "low";
    if (
      typeof (caps as any)?.zoom === "object" &&
      "min" in (caps as any).zoom &&
      "max" in (caps as any).zoom
    ) {
      const { min, max } = (caps as any).zoom as { min: number; max: number };
      const pick =
        level === "none"
          ? min
          : level === "low"
          ? min + (max - min) * 0.25
          : level === "mid"
          ? min + (max - min) * 0.5
          : min + (max - min) * 0.75;
      advanced.push({ zoom: pick as any });
      applied.zoom = pick;
    }

    // Exposure compensation if supported and provided
    if (
      (caps as any)?.exposureCompensation &&
      typeof options?.exposureCompensation === "number"
    ) {
      advanced.push({
        exposureCompensation: options.exposureCompensation as any,
      });
      applied.exposureCompensation = options.exposureCompensation;
    }

    if (advanced.length) await track.applyConstraints({ advanced });
    return { applied, capabilities: caps };
  }

  async function download(
    filename = "frame.jpg",
    type: "image/jpeg" | "image/png" = "image/jpeg",
    quality = 1.0
  ) {
    const blob =
      type === "image/png" ? await capturePNG() : await captureJPEG(quality);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  function stop() {
    stream.getTracks().forEach((t) => t.stop());
  }

  return {
    stream,
    video,
    captureJPEG,
    capturePNG,
    captureBase64,
    capturePassportBase64,
    tuneForBiometric,
    download,
    stop,
  };
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Base64 conversion failed"));
    };
    reader.readAsDataURL(blob);
  });
}

function maybeMountVideo(
  app: Exact4KCameraApp,
  mount?: HTMLElement,
  mountWidth?: string
) {
  if (!mount) return;
  // Small preview window; capture remains 4K
  const v = app.video;
  v.style.width = mountWidth || "320px";
  v.style.height = "auto";
  v.style.background = "#000";
  v.style.objectFit = "contain";
  mount.appendChild(v);
}
