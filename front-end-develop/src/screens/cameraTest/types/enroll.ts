export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Landmark {
  type?: string;
  x: number;
  y: number;
}

export interface IcaoCompliance {
  passed: string[];
  failed: string[];
}

export interface LiveEnrollRequest {
  deviceId: string;
  checkIcao: boolean;
  detectLiveness: boolean;
  frameInterval: number;
  livenessMode:
    | "None"
    | "Passive"
    | "Active"
    | "PassiveAndActive"
    | "Simple"
    | "Custom"
    | "PassiveWithBlink";

  width: number;
  height: number;
  frameRate: number;
  mediaSubtype: number;

  // ───────── Advanced: Template & Token ─────────
  createTemplate?: boolean;
  templateSize: "Small" | "Medium" | "Large";
  tokenImageWidth?: number;
  tokenQualityThreshold?: number;

  // ───────── Position ─────────
  minInterOcularDistance?: number;
  maxRoll?: number;
  maxYaw?: number;
  maxPitch?: number;

  // ───────── Quality ─────────
  faceConfidenceThreshold?: number;
  additionalFacesThreshold?: number;
  qualityThreshold?: number;

  // ───────── Liveness ─────────
  livenessThreshold?: number;
  livenessConfidenceThreshold?: number;

  // ───────── Detection ─────────
  detectAllFeaturePoints?: boolean;
  determineGender?: boolean;
  determineAge?: boolean;
  detectProperties?: boolean;

  // ───────── Output ─────────
  createThumbnail?: boolean;
  thumbnailWidth?: number;

  // ───────── Corrections ─────────
  removeRedEyes?: boolean;
  removeBackground?: boolean;

  applyWhiteBackground?: boolean;

  tokenFaceBackgroundPercentage?: number;
  icaoSharpnessThreshold?: number;
  icaoFaceDarknessThreshold?: number;
  icaoUnnaturalSkinToneThreshold?: number;
  icaoGlassesReflectionThreshold?: number;
  icaoResolutionThreshold?: number;
  icaoMotionBlurThreshold?: number;
  icaoOverexposureThreshold?: number;
  icaoUnderexposureThreshold?: number;

  icaoWashedOutThreshold?: number;
  icaoBackgroundUniformityThreshold?: number;
  icaoTooDarkThreshold?: number;
  icaoTooSmallThreshold?: number;
  icaoTooLargeThreshold?: number;
  icaoTooCloseThreshold?: number;
  icaoTooFarThreshold?: number;
  icaoTooLeftThreshold?: number;
  icaoTooRightThreshold?: number;
  icaoWarningsFilter?: string;
}

export type LiveEnrollFrame = {
  bBox: Rect;
  detectionConfidence?: number;
  quality: number;
  yaw: number;
  pitch: number;
  roll: number;
  gender: number;
  attributes: Record<string, number>;
  landmarks: Landmark[];
  noseTip: Landmark;
  mouthCenter: Landmark;
  leftEyeCenter: Landmark;
  rightEyeCenter: Landmark;
  icaoWarnings: { passed: string[]; failed: string[] };
  imageBase64: string;
  templateBase64: string;
  tokenImageBase64: string;
  errorReason: string;
  livenessScore: number;
  livenessConfidence: number;
  livenessAction: string;
  livenessTargetPitch: number;
  livenessTargetYaw: number;
};

export type LiveEnrollComplete = LiveEnrollFrame & {};

export type LiveEnrollFailed = LiveEnrollFrame & {
  errorReason?: string;
};

export type LiveEnrollMessage =
  | { type: "frame"; payload: LiveEnrollFrame }
  | { type: "complete"; payload: LiveEnrollComplete }
  | { type: "failed"; payload: LiveEnrollFailed }
  | { type: "forceCapture"; payload: LiveEnrollFrame };
