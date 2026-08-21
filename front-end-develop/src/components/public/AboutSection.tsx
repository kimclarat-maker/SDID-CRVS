import { HomeContent } from "@/types/PublicContent";
import Reveal from "./Reveal";

export default function AboutSection({
  about,
  platformIntro,
}: {
  about: HomeContent["about"];
  platformIntro: string;
}) {
  return (
    <section className="public-about public-section-xl">
      <Reveal className="public-container">
        <p className="public-eyebrow-label public-about-index">
          {about.index} — {about.eyebrow}
        </p>

        <div className="public-about-top">
          <h2 className="public-about-heading">{about.heading}</h2>
          <p className="public-about-intro">{platformIntro}</p>
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
