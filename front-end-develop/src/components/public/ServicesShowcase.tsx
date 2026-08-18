import { useState } from "react";
import { Link } from "react-router-dom";
import { HomeContent } from "@/types/PublicContent";
import Reveal from "./Reveal";

export default function ServicesShowcase({
  showcase,
}: {
  showcase: HomeContent["serviceShowcase"];
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <section className="public-services-showcase-wrap">
      <Reveal className="public-container">
        <div className="public-services-showcase">
          <div className="public-services-showcase-top">
            <div>
              <div className="public-section-eyebrow">
                <span>{showcase.eyebrow}</span>
                <small>({showcase.index}-08)</small>
              </div>
              <Link
                to={showcase.viewAllHref}
                className="public-services-showcase-cta"
              >
                <span
                  className="public-services-showcase-cta-icon"
                  aria-hidden="true"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M5 12h14M13 6l6 6-6 6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                {showcase.viewAllLabel}
              </Link>
            </div>

            <div>
              <h2 className="public-services-showcase-heading">
                {showcase.heading}
              </h2>
              <div className="public-services-showcase-tags">
                {showcase.tags.map((tag) => (
                  <span className="public-services-showcase-tag" key={tag}>
                    {tag}
                  </span>
                ))}
                {showcase.moreTagsLabel && (
                  <span className="public-services-showcase-tag-more">
                    {showcase.moreTagsLabel}
                  </span>
                )}
              </div>
            </div>
          </div>

          <ul className="public-services-showcase-list">
            {showcase.items.map((item, index) => {
              const isActive = index === activeIndex;
              return (
                <li
                  className={`public-services-showcase-row ${
                    isActive ? "is-active" : ""
                  }`}
                  key={item.title}
                >
                  <button
                    type="button"
                    className="public-services-showcase-row-trigger"
                    aria-expanded={isActive}
                    onClick={() => setActiveIndex(index)}
                  >
                    <span className="public-services-showcase-row-title">
                      {item.title}
                    </span>
                    {isActive && (
                      <span className="public-services-showcase-row-description">
                        {item.description}
                      </span>
                    )}
                  </button>
                  <Link
                    to={item.href}
                    className="public-services-showcase-row-arrow"
                    aria-label={item.title}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M7 17L17 7M17 7H8M17 7V16"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </Reveal>
    </section>
  );
}
