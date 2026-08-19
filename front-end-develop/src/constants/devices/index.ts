import { platformConfig } from "@/config/platform.config";

const LIMIT = 1500;
const DEVICE_PREFIX = platformConfig.platformShortName;

export const laptops = Array.from({ length: LIMIT }, (_, i) => ({
  label: `${DEVICE_PREFIX}/LAPT/IT/${(i + 1).toString().padStart(4, "0")}`,
  value: `${DEVICE_PREFIX}/LAPT/IT/${(i + 1).toString().padStart(4, "0")}`,
}));

export const fingerprints = Array.from({ length: LIMIT }, (_, i) => ({
  label: `${DEVICE_PREFIX}/FINGP/IT/${(i + 1).toString().padStart(4, "0")}`,
  value: `${DEVICE_PREFIX}/FINGP/IT/${(i + 1).toString().padStart(4, "0")}`,
}));

export const irisDevices = Array.from({ length: LIMIT }, (_, i) => ({
  label: `${DEVICE_PREFIX}/IRIS/IT/${(i + 1).toString().padStart(4, "0")}`,
  value: `${DEVICE_PREFIX}/IRIS/IT/${(i + 1).toString().padStart(4, "0")}`,
}));

export const cameras = Array.from({ length: LIMIT }, (_, i) => ({
  label: `${DEVICE_PREFIX}/CAME/IT/${(i + 1).toString().padStart(4, "0")}`,
  value: `${DEVICE_PREFIX}/CAME/IT/${(i + 1).toString().padStart(4, "0")}`,
}));

export const signaturePads = Array.from({ length: LIMIT }, (_, i) => ({
  label: `${DEVICE_PREFIX}/SIGNP/IT/${(i + 1).toString().padStart(4, "0")}`,
  value: `${DEVICE_PREFIX}/SIGNP/IT/${(i + 1).toString().padStart(4, "0")}`,
}));
