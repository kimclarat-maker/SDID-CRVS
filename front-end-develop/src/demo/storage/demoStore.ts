import { DEMO_DATA_VERSION, DEMO_STORAGE_PREFIX } from "../config";
import { buildDemoDatabase } from "../seed";
import { DemoDatabase } from "../types";

const DATA_KEY = `${DEMO_STORAGE_PREFIX}-data`;
const VERSION_KEY = `${DEMO_STORAGE_PREFIX}-version`;
export const DEMO_SESSION_KEY = `${DEMO_STORAGE_PREFIX}-session`;

const reseed = (): DemoDatabase => {
  const db = buildDemoDatabase();
  localStorage.setItem(DATA_KEY, JSON.stringify(db));
  localStorage.setItem(VERSION_KEY, DEMO_DATA_VERSION);
  return db;
};

// Reseeds automatically the first time, and again whenever DEMO_DATA_VERSION
// changes (e.g. after this codebase's seed shape changes).
export const getDemoData = (): DemoDatabase => {
  const storedVersion = localStorage.getItem(VERSION_KEY);
  const raw = localStorage.getItem(DATA_KEY);

  if (!raw || storedVersion !== DEMO_DATA_VERSION) {
    return reseed();
  }

  try {
    return JSON.parse(raw) as DemoDatabase;
  } catch {
    return reseed();
  }
};

export const setDemoData = (db: DemoDatabase): void => {
  localStorage.setItem(DATA_KEY, JSON.stringify(db));
};

export const updateDemoData = (
  mutate: (db: DemoDatabase) => DemoDatabase | void
): DemoDatabase => {
  const db = getDemoData();
  const result = mutate(db);
  const next = result ?? db;
  setDemoData(next);
  return next;
};

export const resetDemoData = (): DemoDatabase => reseed();

export const clearDemoSession = (): void => {
  sessionStorage.removeItem(DEMO_SESSION_KEY);
};
