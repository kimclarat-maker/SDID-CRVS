import { useContext, useEffect, useRef } from "react";
import { Panel, Tag, Stack, FlexboxGrid } from "rsuite";
import { DEFAULT_THRESHOLDS } from "./constants/defaults";
import type {
  Landmark,
  LiveEnrollFrame,
  LiveEnrollMessage,
} from "./types/enroll";
import Icon from "@/components/icon";
import Alert from "@/components/alert";
import { LanguageContext } from "@/context/LanguageContext";

/* ───────────────────────── Types / Mode helpers ───────────────────────── */

type LivenessMode =
  | "None"
  | "Passive"
  | "PassiveWithBlink"
  | "PassiveAndActive"
  | "Active"
  | "Simple"
  | (string & {});

const PASSIVE = new Set<LivenessMode>(["Passive", "PassiveWithBlink"]);

const ACTION_PRIORITY = [
  "MoveCloser",
  "MoveBack",
  "TurnToCenter",
  "TurnLeft",
  "TurnRight",
  "TurnUp",
  "TurnDown",
  "RotateYaw",
  "KeepRotatingYaw",
  "Blink",
  "KeepStill",
  "None",
] as const;

const PROMPT: Record<string, string> = {
  None: "",
  KeepStill: "Keep still",
  Blink: "Blink",
  RotateYaw: "Rotate head left/right",
  KeepRotatingYaw: "Keep rotating head",
  TurnToCenter: "Center your face towards the camera",
  TurnLeft: "Turn left",
  TurnRight: "Turn right",
  TurnUp: "Look up",
  TurnDown: "Look down",
  MoveCloser: "Move closer",
  MoveBack: "Move back",
};

const Y = "#facc15";
const G = "rgb(0 255 0)";
const R = "rgb(255 0 0)";

function pickAction(raw?: string | number | null): string {
  if (raw === undefined || raw === null) return "";
  const s = String(raw);
  const parts = s
    .split(/[,\|]/)
    .map((t) => t.trim())
    .filter(Boolean);
  if (!parts.length) return "";
  for (const a of ACTION_PRIORITY) if (parts.includes(a)) return a;
  return parts[0];
}

function qualityColor(q: number) {
  const t = DEFAULT_THRESHOLDS.quality;
  return q >= t ? G : q >= t * 0.5 ? Y : R;
}

function resolveDockText(raw: string): string {
  if (!raw) return "";
  const actions = raw.split(/[,\|]/).map((t) => t.trim());
  if (actions.includes("Blink")) return "Blink";
  if (actions.includes("RotateYaw")) return "Turn here";
  return PROMPT[actions[0]] || "";
}

/* ───────────────────────── Drawing primitives ───────────────────────── */

function drawLandmarks(
  ctx: CanvasRenderingContext2D,
  landmarks: Landmark[],
  scale: number,
  sizePx: number,
  color: string
) {
  if (!landmarks?.length) return;
  ctx.save();
  ctx.fillStyle = color;
  const s = Math.max(2, sizePx);
  for (const p of landmarks) {
    ctx.fillRect(p.x * scale - s / 2, p.y * scale - s / 2, s, s);
  }
  ctx.restore();
}

function drawKeyLandmarks(
  ctx: CanvasRenderingContext2D,
  noseTip: Landmark,
  mouthCenter: Landmark,
  leftEyeCenter: Landmark,
  rightEyeCenter: Landmark,
  color: string
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;

  const dot = (p: Landmark) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fill();
  };

  // draw dots
  dot(noseTip);
  dot(mouthCenter);
  dot(leftEyeCenter);
  dot(rightEyeCenter);

  // eye-to-eye line
  ctx.beginPath();
  ctx.moveTo(leftEyeCenter.x, leftEyeCenter.y);
  ctx.lineTo(rightEyeCenter.x, rightEyeCenter.y);
  ctx.stroke();

  ctx.restore();
}

function drawBBox(
  ctx: CanvasRenderingContext2D,
  box: { x: number; y: number; width: number; height: number },
  stroke: string,
  roll?: number
) {
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  const angle = roll ? -(roll * Math.PI) / 180 : 0;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2;
  ctx.strokeRect(-box.width / 2, -box.height / 2, box.width, box.height);
  ctx.restore();
}

function drawBBoxTopMetrics(
  ctx: CanvasRenderingContext2D,
  box: { x: number; y: number; width: number; height: number },
  color: string,
  gender?: number,
  attributes?: Record<string, number>,
  roll?: number
) {
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  const angle = roll ? -(roll * Math.PI) / 180 : 0;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  ctx.fillStyle = color;
  ctx.font = "14px monospace";
  ctx.textBaseline = "bottom";
  ctx.textAlign = "center";

  const halfH = box.height / 2;

  const parts: string[] = [];
  //Showing  gender over the live feed
  // if (gender === 1) parts.push("Male");
  // else if (gender === 2) parts.push("Female");
  if (attributes && attributes?.Smiling > 50) parts.push("Smiling");
  else if (attributes && attributes?.Anger > 50) parts.push("Angry");
  if (attributes?.Age != null) parts.push(`Age≈${Math.round(attributes.Age)}`);

  if (parts.length) {
    ctx.fillText(parts.join(" • "), 0, -halfH - 6);
  }

  ctx.restore();
}

function drawBBoxBottomMetrics(
  ctx: CanvasRenderingContext2D,
  box: { x: number; y: number; width: number; height: number },
  color: string,
  opts: {
    qc?: number;
    conf?: number;
    yaw?: number;
    pitch?: number;
    roll?: number;
    liveScore?: number;
  }
) {
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  const angle = opts.roll ? -(opts.roll * Math.PI) / 180 : 0;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  ctx.fillStyle = color;
  ctx.font = "14px monospace";
  ctx.textBaseline = "top";

  const halfW = box.width / 2;
  const halfH = box.height / 2;

  // Left corner
  if (opts.conf != null && opts.qc != 254) {
    ctx.textAlign = "left";
    ctx.fillText(`${opts.conf}`, -halfW, halfH + 4);
  }

  // Right corner
  if (opts.qc != null && opts.qc != 254) {
    ctx.textAlign = "right";
    ctx.fillText(`${opts.qc}`, halfW, halfH + 4);
  }

  // Center bottom
  ctx.textAlign = "center";
  const metrics = [
    opts.yaw != null ? `Y=${opts.yaw}` : "",
    opts.pitch != null ? `P=${opts.pitch}` : "",
    opts.roll != null ? `R=${opts.roll}` : "",
  ].filter(Boolean);

  if (metrics.length) {
    ctx.fillText(metrics.join(" "), 0, halfH + 4);
  }

  ctx.restore();
}

function drawPrompt(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  topY: number
) {
  if (!text) return;
  ctx.save();
  ctx.font =
    "600 22px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";
  ctx.textAlign = "center";
  ctx.strokeStyle = "rgba(0,0,0,0.55)";
  ctx.lineWidth = 4;
  ctx.strokeText(text, cx, topY);
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.fillText(text, cx, topY);
  ctx.restore();
}

function drawOvalMaskAndStroke(
  ctx: CanvasRenderingContext2D,
  canvasW: number,
  canvasH: number,
  stroke: string
) {
  const base = Math.min(canvasW, canvasH);
  const rx = base * 0.3;
  const ry = base * 0.4;
  const cx = canvasW / 2;
  const cy = canvasH / 2;

  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.beginPath();
  ctx.rect(0, 0, canvasW, canvasH);
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill("evenodd");
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  return { cx, cy, rx, ry };
}

function drawPassiveOverlay(opts: {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
  qc: string;
  action: string;
  targetYaw: number;
  targetPitch: number;
  phase: number;
}) {
  const { ctx, w, h, qc, action, targetYaw, targetPitch, phase } = opts;
  const { cx, cy, rx, ry } = drawOvalMaskAndStroke(ctx, w, h, qc);

  let prompt = PROMPT[action] || "";
  if (action === "RotateYaw" && Number.isFinite(+targetYaw)) {
    const yaw = +targetYaw!;
    prompt =
      Math.abs(yaw) < 15
        ? "Align face to center"
        : yaw > 0
        ? "Rotate right"
        : "Rotate left";
  }
  if (action === "TurnUp" || action === "TurnDown") {
    prompt = action === "TurnUp" ? "Tilt head up" : "Tilt head down";
  }
  drawPrompt(ctx, prompt, cx, cy - ry - 28);
}

// Keep persistent arrow direction between frames
let arrowDir: 1 | -1 = 1;

function drawActiveOverlay(opts: {
  ctx: CanvasRenderingContext2D;
  canvasW: number;
  canvasH: number;
  yaw: number;
  livenessYaw: number;
  action: string;
}) {
  const {
    ctx,
    canvasW: w,
    canvasH: h,
    yaw = 0,
    livenessYaw = 0,
    action = "",
  } = opts;

  const dockW = Math.min(280, Math.max(140, w * 0.35));
  const dockH = 42;
  const dockX = (w - dockW) / 2;
  const dockY = h - 70;
  const cx = dockX + dockW / 2;
  const cy = dockY + dockH / 2;

  const innerPad = 20;
  const range = dockW / 2 - innerPad;

  const clamp = (v: number) => Math.max(-1, Math.min(1, v / 30));
  const ballNorm = clamp(livenessYaw);
  const arrowNorm = clamp(yaw);
  const ballX = cx + ballNorm * range;
  const arrowX = cx + arrowNorm * range;

  if (livenessYaw < yaw) arrowDir = -1;
  if (livenessYaw > yaw) arrowDir = 1;

  const isBlink = /(^|,)\s*Blink/i.test(action);
  const label = isBlink ? "Blink" : action || "Turn here";

  ctx.save();

  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.fillRect(dockX - 6, dockY - 6, dockW + 12, dockH + 12);
  ctx.strokeStyle = Y;
  ctx.lineWidth = 3;
  ctx.strokeRect(dockX, dockY, dockW, dockH);

  const ballDiameter = dockH - 12;

  if (isBlink) {
    drawBlinkIcon(ctx, ballX, cy, ballDiameter * 1.5, Y);
    ctx.font =
      "700 22px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";
    ctx.textAlign = "center";
    ctx.fillStyle = Y;
    ctx.fillText(label, ballX, dockY - 16);
  } else {
    drawTargetIconSVG(ctx, ballX, cy, ballDiameter, Y);
    drawArrowIcon(ctx, arrowX, cy, ballDiameter, Y, arrowDir);
    ctx.font =
      "700 22px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";
    ctx.textAlign = "center";
    ctx.fillStyle = Y;
    ctx.fillText(label, ballX, dockY - 16);
  }

  ctx.restore();
}

function drawTargetIconSVG(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;

  ctx.beginPath();
  ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(0, 0, size / 8, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

function drawArrowIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  ballSize: number,
  color: string,
  dir: 1 | -1
) {
  ctx.save();
  ctx.translate(x, y);
  const scale = (ballSize / 60) * 1.7;
  ctx.scale(dir * scale, scale);
  ctx.translate(0, -30);

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(5, 10);
  ctx.lineTo(40, 30);
  ctx.lineTo(5, 50);
  ctx.lineTo(20, 30);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawBlinkIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  ballSize: number,
  color: string
) {
  ctx.save();
  ctx.translate(x, y);
  const scale = ballSize / 297;
  ctx.scale(scale, scale);
  ctx.translate(-148.5, -148.5);

  ctx.fillStyle = color;
  ctx.beginPath();

  // Eye shape path (simplified for brevity)
  ctx.moveTo(294.908, 124.97);
  ctx.bezierCurveTo(294.342, 124.215, 280.74, 106.25, 256.027, 88.278);
  // ... (rest of the eye path)
  ctx.closePath();

  // Iris path
  ctx.moveTo(243.167, 157.701);
  ctx.bezierCurveTo(213.653, 178.996, 181.804, 189.808, 148.502, 189.808);
  // ... (rest of the iris path)
  ctx.closePath();

  ctx.fill();
  ctx.restore();
}

/* ───────────────────────── Background Analysis ───────────────────────── */

function analyzeBackground(
  ctx: CanvasRenderingContext2D,
  canvasW: number,
  canvasH: number
): number {
  // Sample background areas (corners and edges, excluding center face area)
  const samplePoints = [
    { x: 10, y: 10 }, // top-left
    { x: canvasW - 10, y: 10 }, // top-right
    { x: 10, y: canvasH - 10 }, // bottom-left
    { x: canvasW - 10, y: canvasH - 10 }, // bottom-right
    { x: canvasW / 2, y: 10 }, // top-center
    { x: canvasW / 2, y: canvasH - 10 }, // bottom-center
    { x: 10, y: canvasH / 2 }, // left-center
    { x: canvasW - 10, y: canvasH / 2 }, // right-center
  ];

  let whitePixelCount = 0;
  let totalPixels = 0;

  samplePoints.forEach((point) => {
    const imageData = ctx.getImageData(point.x, point.y, 1, 1).data;
    const [r, g, b] = imageData;

    // Check if pixel is white (RGB values close to 255)
    const isWhite = r > 200 && g > 200 && b > 200;
    if (isWhite) whitePixelCount++;
    totalPixels++;
  });

  return (whitePixelCount / totalPixels) * 100;
}

function drawBackgroundValidation(
  ctx: CanvasRenderingContext2D,
  canvasW: number,
  canvasH: number,
  backgroundScore: number
) {
  const isValid = backgroundScore >= 70; // 70% white background threshold
  const color = isValid ? "rgba(0, 255, 0, 0.3)" : "rgba(255, 0, 0, 0.3)";
  const textColor = isValid ? "green" : "red";
  const status = isValid ? "Good" : "Poor";

  ctx.save();

  // Draw semi-transparent overlay
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvasW, canvasH);

  // Add background status text
  ctx.fillStyle = textColor;
  ctx.font = "bold 16px Arial";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(
    `Background: ${status} (${Math.round(backgroundScore)}%)`,
    10,
    10
  );

  ctx.restore();
}

/* ───────────────────────── Heuristics fallback ───────────────────────── */

function heuristicGuide(attrs: Record<string, number>) {
  if (attrs.LookingAway && attrs.LookingAway > 50)
    return "Please look at the camera";
  if (attrs.FaceMask && attrs.FaceMask > 50)
    return "Remove face mask if possible";
  if (attrs.AdditionalFacesDetected && attrs.AdditionalFacesDetected > 0)
    return "Ensure only one face is visible";
  if (attrs.EyesOpen != null && attrs.EyesOpen < 50) return "Open your eyes";
  if (attrs.MouthOpen != null && attrs.MouthOpen > 50)
    return "Ensure the mouth is not open";
  return "";
}

/* ───────────────────────── Component ───────────────────────── */

export default function EnrollFromCameraFeed({
  lastMsg,
  livenessMode = "None",
}: {
  lastMsg: LiveEnrollMessage | null;
  livenessMode?: LivenessMode;
  removeBackground?: boolean;
  applyWhiteBackground?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawSeq = useRef(0);
  const phaseRef = useRef(0);
  const { translation } = useContext(LanguageContext);

  useEffect(() => {
    if (lastMsg?.type !== "frame") return;

    const c = canvasRef.current;
    if (!c) return;

    const seq = ++drawSeq.current;
    const ctx = c.getContext("2d");
    if (!ctx) return;

    const payload: LiveEnrollFrame = lastMsg.payload || {};
    const {
      imageBase64,
      attributes = {},
      livenessAction,
      livenessTargetYaw,
      livenessTargetPitch,
      detectionConfidence,
      livenessConfidence,
      livenessScore,
      quality,
      gender,
      yaw,
      pitch,
      roll,
    } = payload;
    if (!imageBase64) return;

    const toBlob = (b64: string) => {
      const bin = atob(b64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return new Blob([bytes], { type: "image/jpeg" });
    };

    const draw = async () => {
      let img: ImageBitmap | HTMLImageElement;
      try {
        if ("createImageBitmap" in window) {
          img = await createImageBitmap(toBlob(imageBase64));
        } else {
          img = await new Promise<HTMLImageElement>((resolve, reject) => {
            const im = new Image();
            im.onload = () => resolve(im);
            im.onerror = reject;
            im.src = `data:image/jpeg;base64,${imageBase64}`;
          });
        }
      } catch {
        return;
      }
      if (seq !== drawSeq.current) return;

      const parent = c.parentElement;
      const iw = img.width;
      const ih = img.height;
      const maxW = parent?.clientWidth ?? iw;
      const maxH = parent?.clientHeight ?? ih;
      const ratio = Math.min(maxW / iw, maxH / ih);
      const cssW = Math.max(1, Math.floor(iw * ratio));
      const cssH = Math.max(1, Math.floor(ih * ratio));
      const dpr = window.devicePixelRatio || 1;
      c.style.width = `${cssW}px`;
      c.style.height = `${cssH}px`;
      c.width = Math.floor(cssW * dpr);
      c.height = Math.floor(cssH * dpr);

      ctx.resetTransform?.();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssW, cssH);

      // Draw frame
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(img, -cssW, 0, cssW, cssH);
      ctx.restore();

      // Derived values
      const isPassive = PASSIVE.has(livenessMode);
      const isActive = livenessMode === "Active";
      const qual =
        (lastMsg.payload.quality === 254 ? 0 : lastMsg.payload.quality) ?? 0;
      const qc = qualityColor(qual);
      const action = pickAction(livenessAction);
      const prompt = resolveDockText(livenessAction);
      const phase = (phaseRef.current += 0.6);

      // Landmarks
      const landmarks = (payload.landmarks || []).map((p) => ({
        x: cssW - p.x * ratio,
        y: p.y * ratio,
      }));

      // Bounding box
      const bBox = payload.bBox
        ? {
            x: cssW - (payload.bBox.x + payload.bBox.width) * ratio,
            y: payload.bBox.y * ratio,
            width: payload.bBox.width * ratio,
            height: payload.bBox.height * ratio,
          }
        : null;

      // Mirror + scale key landmarks
      const keyPoints =
        payload.noseTip != null
          ? {
              noseTip: {
                ...payload.noseTip,
                x: cssW - payload.noseTip.x * ratio,
                y: payload.noseTip.y * ratio,
              },
              mouthCenter: {
                ...payload.mouthCenter,
                x: cssW - payload.mouthCenter.x * ratio,
                y: payload.mouthCenter.y * ratio,
              },
              leftEyeCenter: {
                ...payload.leftEyeCenter,
                x: cssW - payload.leftEyeCenter.x * ratio,
                y: payload.leftEyeCenter.y * ratio,
              },
              rightEyeCenter: {
                ...payload.rightEyeCenter,
                x: cssW - payload.rightEyeCenter.x * ratio,
                y: payload.rightEyeCenter.y * ratio,
              },
            }
          : null;

      // Draw key points and eye-line
      if (keyPoints) {
        drawKeyLandmarks(
          ctx,
          keyPoints.noseTip,
          keyPoints.mouthCenter,
          keyPoints.leftEyeCenter,
          keyPoints.rightEyeCenter,
          "rgb(0 255 0)"
        );
      }

      // Draw bbox metrics
      if (bBox) {
        drawBBox(ctx, bBox, qc, roll);
        drawBBoxTopMetrics(ctx, bBox, qc, gender, attributes, roll);

        if (livenessMode && livenessMode !== "None") {
          drawBBoxBottomMetrics(ctx, bBox, qc, {
            qc: quality,
            conf: livenessConfidence,
            yaw: livenessTargetYaw,
            pitch: livenessTargetPitch,
            roll: roll,
            liveScore: livenessScore,
          });
        } else {
          drawBBoxBottomMetrics(ctx, bBox, qc, {
            qc: quality,
            conf: detectionConfidence,
            yaw: yaw,
            pitch: pitch,
            roll: roll,
          });
        }
      }

      // Overlays
      if (isPassive) {
        drawPassiveOverlay({
          ctx,
          w: cssW,
          h: cssH,
          qc,
          action,
          targetYaw: livenessTargetYaw,
          phase,
          targetPitch: livenessTargetPitch,
        });

        drawLandmarks(
          ctx,
          landmarks,
          1,
          bBox
            ? Math.max(
                2,
                Math.floor(Math.min(bBox.width, bBox.height) * ratio * 0.008)
              )
            : 3,
          "rgb(0 255 0)"
        );
      } else if (isActive) {
        drawActiveOverlay({
          ctx,
          canvasW: cssW,
          canvasH: cssH,
          livenessYaw: Number.isFinite(+livenessTargetYaw)
            ? +livenessTargetYaw!
            : 0,
          action: prompt,
          yaw,
        });

        drawPrompt(ctx, prompt, cssW / 2, 32);

        drawLandmarks(
          ctx,
          landmarks,
          1,
          bBox
            ? Math.max(
                2,
                Math.floor(Math.min(bBox.width, bBox.height) * ratio * 0.008)
              )
            : 3,
          "rgb(0 255 0)"
        );
      } else {
        const guide = heuristicGuide(attributes);
        if (guide) drawPrompt(ctx, guide, cssW / 2, 28);
        drawLandmarks(
          ctx,
          landmarks,
          1,
          bBox
            ? Math.max(
                2,
                Math.floor(Math.min(bBox.width, bBox.height) * ratio * 0.008)
              )
            : 3,
          qc
        );
      }
    };

    void draw();

    return () => {
      drawSeq.current++;
    };
  }, [lastMsg, livenessMode]);

  const getPanelColor = () => {
    if (lastMsg?.type === "failed") return "red";

    const quality =
      (lastMsg?.payload?.quality === 254 ? 0 : lastMsg?.payload?.quality) ?? 0;
    if (quality >= DEFAULT_THRESHOLDS.quality) return "green";
    if (quality >= DEFAULT_THRESHOLDS.quality * 0.5) return "yellow";
    return "red";
  };

  const getStatusTag = () => {
    if (lastMsg?.type === "failed") {
      return <Tag color="red">Failed</Tag>;
    }

    const hasPass = lastMsg?.payload?.icaoWarnings?.failed?.length === 0;

    const quality =
      (lastMsg?.payload?.quality === 254 ? 0 : lastMsg?.payload?.quality) ?? 0;

    if (quality >= DEFAULT_THRESHOLDS.quality && hasPass) {
      return <Tag color="green">Good Quality</Tag>;
    }
    if (quality >= DEFAULT_THRESHOLDS.quality * 0.5 && hasPass) {
      return <Tag color="yellow">Medium Quality</Tag>;
    }
    return <Tag color="red">Poor Quality</Tag>;
  };

  return (
    <Panel
      bordered
      header={
        <FlexboxGrid justify="space-between" align="middle">
          <FlexboxGrid.Item>
            <Stack spacing={8}>
              <Icon name="camera" />
              <h5 className="mb-0">Live Preview</h5>
            </Stack>
          </FlexboxGrid.Item>
          <FlexboxGrid.Item>{getStatusTag()}</FlexboxGrid.Item>
        </FlexboxGrid>
      }
    >
      <div
        className="position-relative w-100 bg-light rounded overflow-hidden"
        style={{ aspectRatio: "16/9", minHeight: "300px" }}
      >
        {!lastMsg && (
          <div className="position-absolute top-50 start-50 translate-middle text-center">
            {/* <Loader size="lg" /> */}
            <Icon name="camera" />
            <div className="mt-3 text-muted">
              {translation.start_capturing_biometric_photo}
            </div>
          </div>
        )}

        <canvas
          ref={canvasRef}
          className="w-100 h-100"
          style={{ display: lastMsg?.type === "frame" ? "block" : "none" }}
        />
      </div>

      {lastMsg?.type === "failed" && (
        <>
          <br />
          <Alert type="error">
            <strong>Error:</strong> {lastMsg.payload.errorReason}
          </Alert>
        </>
      )}

      {lastMsg?.type === "frame" && (
        <Stack spacing={8} className="mt-3">
          <div className="text-muted small">
            <strong>Liveness Mode:</strong> {livenessMode}
          </div>
          <div className="text-muted small">
            <strong>Quality Score:</strong>{" "}
            {(lastMsg.payload.quality === 254 ? 0 : lastMsg.payload.quality) ??
              0}
          </div>
        </Stack>
      )}
    </Panel>
  );
}
