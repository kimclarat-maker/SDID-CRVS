import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers"; // Make sure this is correct
import { expect, vi } from "vitest";

expect.extend(matchers);

afterEach(() => {
  cleanup();
});

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: any) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Legacy method
    removeListener: vi.fn(), // Legacy method
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
});

