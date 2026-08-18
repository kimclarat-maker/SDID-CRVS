export const DEFAULT_THRESHOLDS: Record<string, number> = {
  quality: 80, // 0-100
  faceConfidence: 90, // 0-100
  additionalFacesThreshold: 20, // deg

  livenessThreshold: 80, // 0-100
  livenessConfidenceThreshold: 95, // 0-100

  minInterOcularDistance: 64, // px
  maxRoll: 90, // deg
  maxYaw: 90, // deg
  maxPitch: 90, // deg

  thumbnailWidth: 90, // px
  tokenImageWidth: 480, // px
  tokenQualityThreshold: 95, // 0-100
};

export const API = "https://localhost:11401";
export const API_KEY =
  "723259e0dee63366e057c8b9ee6369e7062d832c9c4bbf87452cf2fbb4120a83";
