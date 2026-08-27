// Demo-mode backing for src/api/media — a tiny base64 blob store keyed by a
// generated media id, so upload -> store -> re-fetch-by-id round-trips inside
// a demo session without a real media/file server. Kept in localStorage
// (separate from the versioned DemoDatabase, since this is opaque binary
// content rather than typed application data) so a captured selfie/signature
// survives a page refresh within the same browser.
import { demoDelay } from "../config";

const MEDIA_STORE_KEY = "sdid-demo-media-store";

type MediaStore = Record<string, string>; // mediaId -> base64 (no data: prefix)

const readStore = (): MediaStore => {
  try {
    const raw = localStorage.getItem(MEDIA_STORE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const writeStore = (store: MediaStore) => {
  try {
    localStorage.setItem(MEDIA_STORE_KEY, JSON.stringify(store));
  } catch {
    // localStorage full/unavailable — demo media just won't persist across reloads.
  }
};

const genMediaId = () =>
  `demo-media-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

// Strips a data: URL prefix (data:image/jpeg;base64,....) down to raw base64,
// matching what the real getMediaById() reconstructs client-side.
const toRawBase64 = (input: any): string => {
  if (typeof input !== "string") return "";
  const marker = "base64,";
  const idx = input.indexOf(marker);
  return idx >= 0 ? input.slice(idx + marker.length) : input;
};

export const demoHandleUpload = async (file: any) => {
  const id = genMediaId();
  const store = readStore();
  store[id] = toRawBase64(file);
  writeStore(store);
  return demoDelay({ _id: id, message: "Uploaded (demo)." });
};

export const demoHandleDownloadFile = async (fileName: string) => {
  const store = readStore();
  return demoDelay(store[fileName] || null);
};

export const demoFetchSelfie = async (selfieId: string) => {
  const store = readStore();
  return demoDelay(store[selfieId] || null);
};

export const demoGetMediaById = async ({ mediaId }: { mediaId: string }) => {
  const store = readStore();
  return demoDelay(store[mediaId] || "");
};
