const LIMIT = 1500;

export const laptops = Array.from({ length: LIMIT }, (_, i) => ({
  label: `NIDA/LAPT/IT/${(i + 1).toString().padStart(4, "0")}`,
  value: `NIDA/LAPT/IT/${(i + 1).toString().padStart(4, "0")}`,
}));

export const fingerprints = Array.from({ length: LIMIT }, (_, i) => ({
  label: `NIDA/FINGP/IT/${(i + 1).toString().padStart(4, "0")}`,
  value: `NIDA/FINGP/IT/${(i + 1).toString().padStart(4, "0")}`,
}));

export const irisDevices = Array.from({ length: LIMIT }, (_, i) => ({
  label: `NIDA/IRIS/IT/${(i + 1).toString().padStart(4, "0")}`,
  value: `NIDA/IRIS/IT/${(i + 1).toString().padStart(4, "0")}`,
}));

export const cameras = Array.from({ length: LIMIT }, (_, i) => ({
  label: `NIDA/CAME/IT/${(i + 1).toString().padStart(4, "0")}`,
  value: `NIDA/CAME/IT/${(i + 1).toString().padStart(4, "0")}`,
}));

export const signaturePads = Array.from({ length: LIMIT }, (_, i) => ({
  label: `NIDA/SIGNP/IT/${(i + 1).toString().padStart(4, "0")}`,
  value: `NIDA/SIGNP/IT/${(i + 1).toString().padStart(4, "0")}`,
}));
