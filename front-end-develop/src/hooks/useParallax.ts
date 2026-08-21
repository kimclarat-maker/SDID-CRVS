import { useEffect, useRef } from "react";

/**
 * Restrained decorative-only parallax for hero/media elements. Moves the
 * element vertically by at most `maxOffset` px as the page scrolls past
 * it, using transform (no layout shift). Disabled entirely for
 * prefers-reduced-motion and on touch/small-viewport devices where the
 * effect is more likely to cost paint performance than add polish.
 */
export default function useParallax<T extends HTMLElement = HTMLDivElement>(
  maxOffset = 24
) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const isSmallViewport = window.matchMedia("(max-width: 767px)").matches;
    const isFinePointer = window.matchMedia(
      "(hover: hover) and (pointer: fine)"
    ).matches;

    if (reduceMotion || isSmallViewport || !isFinePointer) {
      node.style.transform = "";
      return undefined;
    }

    let frame = 0;

    const update = () => {
      frame = 0;
      const rect = node.getBoundingClientRect();
      const viewportCenter = window.innerHeight / 2;
      const distanceFromCenter = rect.top + rect.height / 2 - viewportCenter;
      const progress = Math.max(
        -1,
        Math.min(1, distanceFromCenter / window.innerHeight)
      );
      const offset = progress * maxOffset;
      node.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [maxOffset]);

  return ref;
}
