import { HomeContent } from "@/types/PublicContent";
import Reveal from "./Reveal";

export default function AboutSection({ about }: { about: HomeContent["about"] }) {
  return (
    <section className="public-about">
      <Reveal className="public-container">
        <div className="public-about-top">
          <div className="public-section-eyebrow">
            <span>{about.eyebrow}</span>
            <small>
              ({about.index}-08)
            </small>
          </div>
          <h2 className="public-about-heading">{about.heading}</h2>
        </div>

        <div className="public-about-stats">
          {about.stats.map((stat) => (
            <div className="public-about-stat" key={stat.label}>
              <div className="public-about-stat-value">{stat.value}</div>
              <div className="public-about-stat-label">{stat.label}</div>
              <p className="public-about-stat-description">
                {stat.description}
              </p>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
