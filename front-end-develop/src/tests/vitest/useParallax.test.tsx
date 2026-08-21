import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import useParallax from "@/hooks/useParallax";

function mockMatchMedia(reducedMotion: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes("prefers-reduced-motion") ? reducedMotion : true,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

function ParallaxProbe() {
  const ref = useParallax<HTMLDivElement>(20);
  return <div ref={ref} data-testid="parallax-target" />;
}

describe("useParallax", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not apply a transform when reduced motion is requested", () => {
    mockMatchMedia(true);
    const { getByTestId } = render(<ParallaxProbe />);
    expect(getByTestId("parallax-target").style.transform).toBe("");
  });
});
