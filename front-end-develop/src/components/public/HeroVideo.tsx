import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { HeroSlide } from "@/types/PublicContent";

const SLIDE_DURATION_MS = 7000;

export default function HeroVideo({ slides }: { slides: HeroSlide[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (slides.length < 2) return;

    const startTimer = () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setActiveIndex((current) => (current + 1) % slides.length);
      }, SLIDE_DURATION_MS);
    };

    startTimer();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [slides.length]);

  const goToSlide = (index: number) => {
    setActiveIndex(index);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, SLIDE_DURATION_MS);
  };

  const activeSlide = slides[activeIndex];

  return (
    <section className="public-hero-video" aria-label="Introduction">
      {slides.map((slide, index) => (
        <video
          key={slide.video}
          className={`public-hero-video-media ${
            index === activeIndex ? "is-active" : ""
          }`}
          src={slide.video}
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
        />
      ))}

      <div className="public-container public-hero-video-content">
        <h1 data-testid="home-hero-title">{activeSlide.title}</h1>
        <p>{activeSlide.subtitle}</p>
        <Link to={activeSlide.ctaHref} className="public-hero-video-cta">
          <span className="public-hero-video-cta-icon" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 12h14M13 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          {activeSlide.ctaLabel}
        </Link>

        {slides.length > 1 && (
          <div className="public-hero-video-dots">
            {slides.map((slide, index) => (
              <button
                key={slide.video}
                type="button"
                className={`public-hero-video-dot ${
                  index === activeIndex ? "is-active" : ""
                }`}
                aria-label={`Show slide ${index + 1}: ${slide.title}`}
                aria-current={index === activeIndex}
                onClick={() => goToSlide(index)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
