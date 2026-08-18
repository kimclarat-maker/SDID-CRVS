// Ambient type augmentation only: makes jest-dom matchers (toBeInTheDocument,
// toHaveAttribute, etc.) known to TypeScript for Vitest's `expect`. Runtime
// matcher registration already happens in tests/setupTests.ts; this file
// exists purely so `tsc --noEmit` recognizes the matchers used in this
// directory's specs.
import "@testing-library/jest-dom/vitest";
