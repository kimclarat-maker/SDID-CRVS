import { ReactNode, useEffect, useRef, useState } from "react";
import Icon from "@/components/icon";

interface CarouselProps {
  ariaLabel: string;
  items: { id: string; content: ReactNode }[];
  className?: string;
}

/**
 * Hand-rolled editorial rail: a native horizontal scroll-snap track plus
 * prev/next buttons and a position indicator. Touch dragging and keyboard
 * scrolling come for free from the native scroll container — no carousel
 * library needed. Rotation only ever happens on explicit user action.
 */
export default function Carousel({ ariaLabel, items, className = "" }: CarouselProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;

    const onScroll = () => {
      const children = Array.from(track.children) as HTMLElement[];
      if (!children.length) return;
      const trackCenter = track.scrollLeft + track.clientWidth / 2;
      let closest = 0;
      let closestDistance = Infinity;
      children.forEach((child, index) => {
        const childCenter = child.offsetLeft + child.offsetWidth / 2;
        const distance = Math.abs(childCenter - trackCenter);
        if (distance < closestDistance) {
          closestDistance = distance;
          closest = index;
        }
      });
      setActiveIndex(closest);
    };

    onScroll();
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => track.removeEventListener("scroll", onScroll);
  }, [items.length]);

  const scrollToIndex = (index: number) => {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.max(0, Math.min(items.length - 1, index));
    const child = track.children[clamped] as HTMLElement | undefined;
    if (!child) return;
    setActiveIndex(clamped);
    try {
      track.scrollTo({
        left: child.offsetLeft - (track.clientWidth - child.offsetWidth) / 2,
        behavior: "smooth",
      });
    } catch {
      // scrollTo/smooth-scroll is unavailable in some test/embedded
      // environments (e.g. jsdom) — the active-index state above already
      // keeps dots/buttons in sync regardless.
    }
  };

  if (items.length === 0) return null;

  return (
    <div className={`public-carousel ${className}`.trim()}>
      <div
        className="public-carousel-track"
        ref={trackRef}
        role="group"
        aria-label={ariaLabel}
        tabIndex={0}
      >
        {items.map((item) => (
          <div className="public-carousel-item" key={item.id}>
            {item.content}
          </div>
        ))}
      </div>

      {items.length > 1 && (
        <div className="public-carousel-controls">
          <button
            type="button"
            className="public-carousel-nav"
            aria-label="Previous"
            onClick={() => scrollToIndex(activeIndex - 1)}
            disabled={activeIndex === 0}
          >
            <Icon name="chevron_left" />
          </button>

          <div
            className="public-carousel-dots"
            role="tablist"
            aria-label={`${ariaLabel} position`}
          >
            {items.map((item, index) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={index === activeIndex}
                aria-label={`Go to item ${index + 1} of ${items.length}`}
                className={`public-carousel-dot${
                  index === activeIndex ? " is-active" : ""
                }`}
                onClick={() => scrollToIndex(index)}
              />
            ))}
          </div>

          <button
            type="button"
            className="public-carousel-nav"
            aria-label="Next"
            onClick={() => scrollToIndex(activeIndex + 1)}
            disabled={activeIndex === items.length - 1}
          >
            <Icon name="chevron_right" />
          </button>
        </div>
      )}
    </div>
  );
}
