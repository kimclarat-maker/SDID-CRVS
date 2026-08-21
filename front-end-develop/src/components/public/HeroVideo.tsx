import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { HeroSlide, HomeContent } from "@/types/PublicContent";
import { platformConfig } from "@/config/platform.config";
import { usePublicLanguage } from "@/context/PublicLanguageContext";
import Icon from "@/components/icon";
import useParallax from "@/hooks/useParallax";

const SLIDE_DURATION_MS = 7000;

interface NetworkInformationLike {
  saveData?: boolean;
}

function prefersDataSaver(): boolean {
  if (typeof navigator === "undefined") return false;
  const connection = (
    navigator as Navigator & { connection?: NetworkInformationLike }
  ).connection;
  return Boolean(connection?.saveData);
}

export default function HeroVideo({
  slides,
  hero,
  floatingCards,
}: {
  slides: HeroSlide[];
  hero: HomeContent["hero"];
  floatingCards: HomeContent["serviceCards"];
}) {
  const { content } = usePublicLanguage();
  const [activeIndex, setActiveIndex] = useState(0);
  const [dataSaverPause, setDataSaverPause] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const parallaxRef = useParallax<HTMLDivElement>(20);

  useEffect(() => {
    setDataSaverPause(prefersDataSaver());
  }, []);

  useEffect(() => {
    if (slides.length < 2) return undefined;

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
    if (slides.length > 1) {
      timerRef.current = setInterval(() => {
        setActiveIndex((current) => (current + 1) % slides.length);
      }, SLIDE_DURATION_MS);
    }
  };

  const activeSlide = slides[activeIndex];

  return (
    <section className="public-hero" aria-label="Introduction">
      <div className="public-container public-hero-inner">
        <div className="public-hero-copy">
          <p
            className="public-eyebrow-label public-hero-eyebrow"
            data-reveal="eyebrow"
          >
            {platformConfig.platformName} — {content.common.nav.digitalIdentity}{" "}
            &amp; {content.common.nav.civilRegistration}
          </p>
          <h1 data-testid="home-hero-title" data-reveal="heading">
            {activeSlide.title}
          </h1>
          <p className="public-hero-subtitle" data-reveal="body">
            {activeSlide.subtitle}
          </p>

          <div className="public-hero-actions" data-reveal="actions">
            <Link to={activeSlide.ctaHref} className="public-btn public-btn-primary">
              {activeSlide.ctaLabel}
            </Link>
            {hero.secondaryCtaLabel && (
              <Link
                to={hero.secondaryCtaHref}
                className="public-btn public-btn-secondary"
              >
                {hero.secondaryCtaLabel}
              </Link>
            )}
          </div>

          {platformConfig.authorities.platformAuthority && (
            <p className="public-hero-trust">
              {content.common.common.trustStatementPrefix}{" "}
              {platformConfig.authorities.platformAuthority}.
            </p>
          )}

          {slides.length > 1 && (
            <div className="public-hero-dots">
              {slides.map((slide, index) => (
                <button
                  key={slide.video}
                  type="button"
                  className={`public-hero-dot ${
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

        <div className="public-hero-media-wrap" ref={parallaxRef}>
          <div className="public-hero-media">
            {slides.map((slide, index) =>
              dataSaverPause ? null : (
                <video
                  key={slide.video}
                  className={`public-hero-media-item ${
                    index === activeIndex ? "is-active" : ""
                  }`}
                  src={slide.video}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  aria-hidden="true"
                />
              )
            )}
            {dataSaverPause && (
              <div className="public-hero-media-fallback" aria-hidden="true" />
            )}
            <div className="public-hero-media-overlay" />
          </div>

          {floatingCards.slice(0, 2).map((card, index) => (
            <div
              className={`public-hero-floating-card public-hero-floating-card-${index}`}
              key={card.id}
            >
              <span className="public-hero-floating-card-icon" aria-hidden="true">
                <Icon name={card.icon} />
              </span>
              <span>{card.title}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
