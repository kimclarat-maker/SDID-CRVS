import { HomeContent } from "@/types/PublicContent";
import Icon from "@/components/icon";
import Reveal from "./Reveal";

export default function WorkTogetherSection({
  content,
}: {
  content: HomeContent["howSdidCrvsWorkTogether"];
}) {
  return (
    <section className="public-work-together-wrap">
      <Reveal className="public-container">
        <div className="public-work-together-card">
          <div className="public-section-eyebrow">
            <span>{content.eyebrow}</span>
          </div>
          <h2 className="public-work-together-heading">{content.heading}</h2>

          <div className="public-work-together-grid">
            {content.items.map((item, index) => (
              <div className="public-work-together-item" key={item.title}>
                {index > 0 && (
                  <span className="public-work-together-connector" aria-hidden="true">
                    <Icon name="arrow_forward" />
                  </span>
                )}
                <div className="public-service-icon" aria-hidden="true">
                  <Icon name={item.icon} />
                </div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
