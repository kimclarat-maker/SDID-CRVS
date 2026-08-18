import { useContext, useEffect, useMemo, useState } from "react";
import {
  Panel,
  List,
  Tag,
  TagGroup,
  Button,
  Stack,
  FlexboxGrid,
  Divider,
} from "rsuite";
import { DEFAULT_THRESHOLDS } from "./constants/defaults";
import type { LiveEnrollMessage } from "./types/enroll";
import Icon from "@/components/icon";
import { SelfieContext } from "@/context/SelfieContext";

/* ───────────────────────────────── Types ───────────────────────────────── */

type RuleType =
  | "higherBetter" // higher values are better (e.g., quality)
  | "lowerBetter" // lower values are better (e.g., blur)
  | "presenceBad" // >0 is bad (e.g., TooClose)
  | "presenceWarn" // >0 is warning (e.g., Smile)
  | "classification"; // categorical (not used for numeric thresholds)

/* ───────────────────────────── Label / Rules ─────────────────────────────
   IMPORTANT: This intentionally includes *all* names we may receive.
   Labels for ICAO warnings reuse these if they match; otherwise we print
   the raw string from the backend.
---------------------------------------------------------------------------*/

export const ATTRIBUTE_RULES: Record<
  string,
  { label: string; rule: RuleType }
> = {
  // ---- Core detection / pose (also in screenshot default set) ----
  DetectionConfidence: { label: "Face detected", rule: "higherBetter" },
  Roll: { label: "Roll", rule: "lowerBetter" },
  Yaw: { label: "Yaw", rule: "lowerBetter" },
  Pitch: { label: "Pitch", rule: "lowerBetter" },

  TooClose: { label: "Too Close", rule: "presenceBad" },
  TooFar: { label: "Too Far", rule: "presenceBad" },
  TooNorth: { label: "Too North", rule: "presenceBad" },
  TooSouth: { label: "Too South", rule: "presenceBad" },
  TooWest: { label: "Too West", rule: "presenceBad" },
  TooEast: { label: "Too East", rule: "presenceBad" },

  // ---- Quality / image properties ----
  Quality: { label: "Overall quality", rule: "higherBetter" },
  Resolution: { label: "Resolution", rule: "higherBetter" },
  ImageResolution: { label: "Image resolution", rule: "higherBetter" },
  TokenImageQuality: { label: "Token image quality", rule: "higherBetter" },
  Occlusion: { label: "Occlusion", rule: "lowerBetter" },
  MotionBlur: { label: "Motion blur", rule: "lowerBetter" },
  CompressionArtifacts: { label: "Compression artifacts", rule: "lowerBetter" },
  Overexposure: { label: "Overexposure", rule: "lowerBetter" },
  Underexposure: { label: "Underexposure", rule: "lowerBetter" },
  Noise: { label: "Noise", rule: "lowerBetter" },
  GrayscaleDensity: { label: "Grayscale Density", rule: "higherBetter" },
  Saturation: { label: "Saturation", rule: "higherBetter" },
  Sharpness: { label: "Sharpness", rule: "higherBetter" },
  Contrast: { label: "Contrast", rule: "higherBetter" },
  BackgroundUniformity: {
    label: "Background Uniformity",
    rule: "higherBetter",
  },
  WashedOut: { label: "Colors Washed Out", rule: "lowerBetter" },
  Pixelation: { label: "Pixelation", rule: "lowerBetter" },
  Interlace: { label: "Interlace", rule: "lowerBetter" },

  // ---- Liveness / movement / pose composites ----
  Liveness: { label: "Liveness", rule: "higherBetter" },
  LivenessQuality: { label: "Liveness Quality", rule: "higherBetter" },
  HeadMovement: { label: "Head Movement", rule: "lowerBetter" },
  Pose: { label: "Pose", rule: "lowerBetter" },

  // ---- Expressions / gaze ----
  EyesOpen: { label: "Eyes Open", rule: "higherBetter" },
  MouthOpen: { label: "Mouth Open", rule: "presenceWarn" },
  Smile: { label: "Expression", rule: "presenceWarn" },
  LookingAway: { label: "Looking Away", rule: "presenceWarn" },
  Blink: { label: "Blink", rule: "presenceWarn" },

  // ---- Obstructions / glasses ----
  FaceMask: { label: "Face Mask", rule: "presenceBad" },
  HeadCovering: { label: "Head Covering", rule: "presenceBad" },
  Glasses: { label: "Glasses", rule: "presenceWarn" },
  DarkGlasses: { label: "Dark Glasses", rule: "presenceWarn" },
  HeavyFrameGlasses: { label: "Heavy Frame", rule: "presenceWarn" },
  RedEye: { label: "Red Eye", rule: "presenceBad" },
  GlassesReflection: { label: "Glasses Reflection", rule: "lowerBetter" },
  SkinReflection: { label: "Skin Reflection", rule: "lowerBetter" },

  // ---- Lighting / skin ----
  FaceDarkness: { label: "Face Darkness", rule: "lowerBetter" },
  SkinTone: { label: "Unnatural Skin Tone", rule: "lowerBetter" },

  // ---- Facial hair ----
  Mustache: { label: "Mustache", rule: "presenceWarn" },
  Beard: { label: "Beard", rule: "presenceWarn" },

  // ---- Contacts ----
  CosmeticLenses: { label: "Cosmetic Lenses", rule: "presenceWarn" },

  // ---- Misc seen in datasets (defensive) ----
  AdditionalFacesDetected: { label: "Additional Faces", rule: "presenceBad" },

  // ---- New validation rules ----
  ClearFaceVisibility: { label: "Clear Face Visibility", rule: "higherBetter" },
  BothEarsVisible: { label: "Both Ears Visible", rule: "presenceBad" },
  WhiteBackground: { label: "White Background", rule: "higherBetter" },
  FaceCentered: { label: "Face Centered", rule: "higherBetter" },
  NeutralExpression: { label: "Neutral Expression", rule: "higherBetter" },
  NoShadows: { label: "No Shadows", rule: "lowerBetter" },
  ProperLighting: { label: "Proper Lighting", rule: "higherBetter" },
  NoReflections: { label: "No Reflections", rule: "lowerBetter" },
  FaceSize: { label: "Proper Face Size", rule: "higherBetter" },
};

/* ───────── Screenshot default set & deterministic order (exact sequence) ───────── */

const DEFAULT_ORDERED_KEYS: string[] = [
  "DetectionConfidence",
  "ClearFaceVisibility",
  "BothEarsVisible",
  "WhiteBackground",
  "EyesOpen",
  "FaceCentered",
  "NeutralExpression",
  "Roll",
  "Yaw",
  "Pitch",
  "TooClose",
  "TooFar",
  "TooNorth",
  "TooSouth",
  "TooWest",
  "TooEast",
];

const DEFAULT_SHOWN = new Set(DEFAULT_ORDERED_KEYS);

/* ─────────────────────────── Threshold / Colors ─────────────────────────── */

function getTagColor(
  name: string,
  value: number | undefined | null,
  thresholds: Record<string, number>,
  overallQuality: number | undefined
): "green" | "yellow" | "red" | "blue" | undefined {
  if (value === undefined || value === null) return undefined;

  const rule = ATTRIBUTE_RULES[name]?.rule;

  // Some sub-attributes visually follow overall "Quality"
  const qualityRelated = new Set<string>([
    "Occlusion",
    "Resolution",
    "MotionBlur",
    "CompressionArtifacts",
    "Overexposure",
    "Underexposure",
    "Noise",
    "Pose",
    "ClearFaceVisibility",
    "FaceCentered",
    "NeutralExpression",
    "ProperLighting",
    "FaceSize",
  ]);

  if (qualityRelated.has(name) && overallQuality !== undefined) {
    return overallQuality >= (DEFAULT_THRESHOLDS.quality ?? 50)
      ? "green"
      : overallQuality >= (DEFAULT_THRESHOLDS.quality ?? 50) * 0.5
      ? "yellow"
      : "red";
  }

  // Per-attribute numeric thresholds, falling back to sensible defaults.
  const defaultThresholds: Record<string, number> = {
    ClearFaceVisibility: 80,
    WhiteBackground: 70,
    EyesOpen: 80,
    FaceCentered: 75,
    NeutralExpression: 70,
    NoShadows: 20,
    ProperLighting: 75,
    NoReflections: 15,
    FaceSize: 70,
    // ... other default thresholds
  };

  const threshold = thresholds[name] ?? defaultThresholds[name];

  switch (rule) {
    case "higherBetter": {
      const th = (typeof threshold === "number" ? threshold : 80) as number;
      return value >= th ? "green" : value >= th * 0.5 ? "yellow" : "red";
    }
    case "lowerBetter": {
      const th = (typeof threshold === "number" ? threshold : 20) as number;
      return value <= th ? "green" : value <= th * 2 ? "yellow" : "red";
    }
    case "presenceBad":
      return value > 0 ? "red" : "green";
    case "presenceWarn":
      return value > 0 ? "yellow" : "green";
    case "classification":
      return "blue";
    default:
      return undefined;
  }
}

/* ─────────────────────────────── Utilities ─────────────────────────────── */

function titleFor(name: string): string {
  return ATTRIBUTE_RULES[name]?.label ?? name;
}

function stableSortByDefaultOrder(keys: string[]): string[] {
  const idx = new Map(DEFAULT_ORDERED_KEYS.map((k, i) => [k, i]));
  return keys.slice().sort((a, b) => {
    const ia = idx.has(a) ? idx.get(a)! : Number.POSITIVE_INFINITY;
    const ib = idx.has(b) ? idx.get(b)! : Number.POSITIVE_INFINITY;
    if (ia !== ib) return ia - ib;
    // fallback alpha for non-default keys
    return a.localeCompare(b);
  });
}

/* ─────────────────────────── Main Component ─────────────────────────── */

export default function EnrollFromCameraAttributesPanel({
  lastMsg,
  icao,
  thresholds = {},
  initialExpanded = false,
  computedAttributes = {}, // Add computed attributes prop
  mode,
}: {
  lastMsg: LiveEnrollMessage | null;
  icao: boolean;
  thresholds?: Record<string, number>;
  initialExpanded?: boolean;
  computedAttributes?: Record<string, number>;
  mode: string;
}) {
  const [expanded, setExpanded] = useState<boolean>(initialExpanded);
  const { setIcaoAttributes } = useContext(SelfieContext);

  const backendAttrs: Record<string, number> =
    lastMsg?.payload?.attributes ?? {};
  const icaoWarnings = lastMsg?.payload?.icaoWarnings ?? {
    passed: [],
    failed: [],
  };

  // Merge backend attributes with computed attributes (computed takes precedence)
  const attrs: Record<string, number> = useMemo(() => {
    return {
      ...backendAttrs,
      ...computedAttributes,
    };
  }, [backendAttrs, computedAttributes]);

  // Compute derived validations based on available data
  const derivedValidations = useMemo(() => {
    const derived: Record<string, number> = {};

    // Face Centered - based on roll, yaw, pitch and distance warnings
    if (
      attrs.Roll !== undefined &&
      attrs.Yaw !== undefined &&
      attrs.Pitch !== undefined
    ) {
      const centeredScore = Math.max(
        0,
        100 -
          (Math.abs(attrs.Roll || 0) * 0.5 +
            Math.abs(attrs.Yaw || 0) * 0.3 +
            Math.abs(attrs.Pitch || 0) * 0.2)
      );
      derived.FaceCentered = Math.round(centeredScore);
    }

    // Neutral Expression - based on smile and mouth open
    if (attrs.Smile !== undefined || attrs.MouthOpen !== undefined) {
      const smilePenalty = (attrs.Smile || 0) > 50 ? 30 : 0;
      const mouthPenalty = (attrs.MouthOpen || 0) > 50 ? 30 : 0;
      derived.NeutralExpression = Math.max(
        0,
        100 - smilePenalty - mouthPenalty
      );
    }

    // Proper Lighting - based on exposure and face darkness
    if (
      attrs.Overexposure !== undefined ||
      attrs.Underexposure !== undefined ||
      attrs.FaceDarkness !== undefined
    ) {
      const overExposurePenalty = (attrs.Overexposure || 0) > 30 ? 25 : 0;
      const underExposurePenalty = (attrs.Underexposure || 0) > 30 ? 25 : 0;
      const darknessPenalty = (attrs.FaceDarkness || 0) > 30 ? 25 : 0;
      derived.ProperLighting = Math.max(
        0,
        100 - overExposurePenalty - underExposurePenalty - darknessPenalty
      );
    }

    // No Reflections - based on glasses and skin reflections
    if (
      attrs.GlassesReflection !== undefined ||
      attrs.SkinReflection !== undefined
    ) {
      const glassesReflection = attrs.GlassesReflection || 0;
      const skinReflection = attrs.SkinReflection || 0;
      derived.NoReflections = Math.max(
        0,
        100 - (glassesReflection + skinReflection) / 2
      );
    }

    // Face Size - based on distance warnings
    if (attrs.TooClose !== undefined || attrs.TooFar !== undefined) {
      const tooClosePenalty = (attrs.TooClose || 0) > 0 ? 50 : 0;
      const tooFarPenalty = (attrs.TooFar || 0) > 0 ? 50 : 0;
      derived.FaceSize = tooClosePenalty || tooFarPenalty ? 50 : 100;
    }

    // Clear Face Visibility - based on occlusion and quality
    if (attrs.Occlusion !== undefined || attrs.Quality !== undefined) {
      const occlusionPenalty = (attrs.Occlusion || 0) * 0.8;
      const qualityBonus = (attrs.Quality || 0) * 0.2;
      derived.ClearFaceVisibility = Math.max(
        0,
        Math.min(100, 100 - occlusionPenalty + qualityBonus)
      );
    }

    return derived;
  }, [attrs]);

  // Merge all attributes including derived ones
  const allAttrs = useMemo(() => {
    return {
      ...attrs,
      ...derivedValidations,
    };
  }, [attrs, derivedValidations]);

  // Partition attributes into default vs. "more"
  const { defaultPairs, morePairs } = useMemo(() => {
    const entries = Object.entries(allAttrs);
    const def: Array<[string, number]> = [];
    const more: Array<[string, number]> = [];
    for (const [k, v] of entries) {
      (DEFAULT_SHOWN.has(k) ? def : more).push([k, v]);
    }
    // Keep deterministic order matching screenshot first, then alpha
    const order = (pairs: Array<[string, number]>) =>
      stableSortByDefaultOrder(pairs.map((p) => p[0])).map(
        (k) => [k, allAttrs[k]] as [string, number]
      );

    return { defaultPairs: order(def), morePairs: order(more) };
  }, [allAttrs]);

  const overallQuality = allAttrs?.Quality;

  /* ────────────── ICAO mode: show all warnings (passed + failed) ────────────── */
  if (icao) {
    // Create enhanced ICAO warnings that include our new validations
    const enhancedICaOWarnings = {
      passed: [...(icaoWarnings.passed || [])],
      failed: [...(icaoWarnings.failed || [])],
    };

    // Add our custom validations to ICAO checks
    const validationThresholds = {
      ClearFaceVisibility: thresholds.clearFaceVisibilityThreshold || 80,
      WhiteBackground: thresholds.whiteBackgroundThreshold || 70,
      EyesOpen: thresholds.eyesOpenThreshold || 80,
      FaceCentered: thresholds.faceCenteredThreshold || 75,
      NeutralExpression: thresholds.neutralExpressionThreshold || 70,
      BothEarsVisible: 0, // Presence-based (0 = good)
    };

    // Check each validation and add to appropriate list
    Object.entries(validationThresholds).forEach(([key, threshold]) => {
      const value = allAttrs[key];
      if (value !== undefined) {
        const rule = ATTRIBUTE_RULES[key]?.rule;
        let isPassed = false;

        if (rule === "higherBetter") {
          isPassed = value >= threshold;
        } else if (rule === "presenceBad") {
          isPassed = value <= threshold;
        } else if (rule === "lowerBetter") {
          isPassed = value <= threshold;
        }

        if (isPassed) {
          if (!enhancedICaOWarnings.passed.includes(key)) {
            enhancedICaOWarnings.passed.push(key);
          }
          // Remove from failed if it was there
          enhancedICaOWarnings.failed = enhancedICaOWarnings.failed.filter(
            (k) => k !== key
          );
        } else {
          if (!enhancedICaOWarnings.failed.includes(key)) {
            enhancedICaOWarnings.failed.push(key);
          }
          // Remove from passed if it was there
          enhancedICaOWarnings.passed = enhancedICaOWarnings.passed.filter(
            (k) => k !== key
          );
        }
      }
    });

    useEffect(() => {
      if (mode === "off") return;
      if (enhancedICaOWarnings) {
        setIcaoAttributes(enhancedICaOWarnings);
      }
    }, [enhancedICaOWarnings]);

    const nothing =
      enhancedICaOWarnings.failed.length === 0 &&
      enhancedICaOWarnings.passed.length === 0;

    return (
      <Panel
        bordered
        header={
          <FlexboxGrid justify="space-between" align="middle">
            <FlexboxGrid.Item>
              <h5 className="mb-0">ICAO Compliance</h5>
            </FlexboxGrid.Item>
            <FlexboxGrid.Item>
              <Tag
                color={
                  enhancedICaOWarnings.failed.length === 0 ? "green" : "red"
                }
              >
                {enhancedICaOWarnings.failed.length === 0
                  ? "Compliant"
                  : "Non-Compliant"}
              </Tag>
            </FlexboxGrid.Item>
          </FlexboxGrid>
        }
      >
        {nothing ? (
          <div className="text-muted text-center py-3">
            No validation data available
          </div>
        ) : (
          <Stack direction="column" spacing={8}>
            {/* Failed warnings */}
            {enhancedICaOWarnings.failed.length > 0 && (
              <div>
                <div className="text-danger mb-2">
                  Failed Validations ({enhancedICaOWarnings.failed.length}):
                </div>
                <TagGroup>
                  {enhancedICaOWarnings.failed.map((w: string) => (
                    <Tag key={`f-${w}`} color="red" className="mb-1 mr-1">
                      {titleFor(w)}
                    </Tag>
                  ))}
                </TagGroup>
              </div>
            )}

            {/* Passed warnings */}
            {enhancedICaOWarnings.passed.length > 0 && (
              <div>
                <div className="text-success mb-2">
                  Passed Validations ({enhancedICaOWarnings.passed.length}):
                </div>
                <TagGroup>
                  {enhancedICaOWarnings.passed.map((w: string) => (
                    <Tag key={`p-${w}`} color="green" className="mb-1 mr-1">
                      {titleFor(w)}
                    </Tag>
                  ))}
                </TagGroup>
              </div>
            )}
          </Stack>
        )}
      </Panel>
    );
  }

  console.log("mode", mode);

  /* ────────────── Normal mode: default (screenshot) + Show more ────────────── */
  return (
    <Panel
      bordered
      header={
        <FlexboxGrid justify="space-between" align="middle">
          <FlexboxGrid.Item>
            <h5 className="mb-0">Face Validation</h5>
          </FlexboxGrid.Item>
          <FlexboxGrid.Item>
            <Button
              size="xs"
              appearance="subtle"
              startIcon={
                expanded ? (
                  <Icon name="keyboard_arrow_up" />
                ) : (
                  <Icon name="keyboard_arrow_down" />
                )
              }
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? "Show less" : "Show more"}
            </Button>
          </FlexboxGrid.Item>
        </FlexboxGrid>
      }
    >
      {/* Default set (exactly what's in the screenshot, ordered) */}
      {defaultPairs.length === 0 ? (
        <div className="text-muted text-center py-3">
          No validation data available
        </div>
      ) : (
        <Stack direction="column" spacing={6}>
          <div className="text-muted small mb-2">Key Validations:</div>
          <TagGroup>
            {defaultPairs.map(([name, value]) => (
              <Tag
                key={`def-${name}`}
                color={getTagColor(name, value, thresholds, overallQuality)}
                className="mb-1 mr-1"
              >
                {titleFor(name)}:{" "}
                {typeof value === "number" ? Math.round(value) : value}%
              </Tag>
            ))}
          </TagGroup>

          {/* "More" set (only when expanded) */}
          {expanded && morePairs.length > 0 && (
            <>
              <Divider />
              <div className="text-muted text-sm">Additional Attributes:</div>
              <TagGroup>
                {morePairs.map(([name, value]) => (
                  <Tag
                    key={`more-${name}`}
                    color={getTagColor(name, value, thresholds, overallQuality)}
                    className="mb-1 mr-1"
                  >
                    {titleFor(name)}:{" "}
                    {typeof value === "number" ? Math.round(value) : value}%
                  </Tag>
                ))}
              </TagGroup>
            </>
          )}
        </Stack>
      )}
    </Panel>
  );
}
