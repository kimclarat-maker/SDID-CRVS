import { Link } from "react-router-dom";
import Icon from "@/components/icon";
import { ServiceCard } from "@/types/PublicContent";
import { usePublicLanguage } from "@/context/PublicLanguageContext";
import Reveal from "./Reveal";

const MAX_STAGGER_STEPS = 6;
const STAGGER_STEP_MS = 70;

export default function ServiceCardGrid({
  items,
  columns = 3,
}: {
  items: ServiceCard[];
  columns?: 2 | 3 | 4;
}) {
  const { content } = usePublicLanguage();

  return (
    <div className={`public-grid public-grid-${columns}`}>
      {items.map((item, index) => (
        <Reveal
          key={item.id}
          className="public-card"
          delay={(index % MAX_STAGGER_STEPS) * STAGGER_STEP_MS}
        >
          <div className="public-service-icon" aria-hidden="true">
            <Icon name={item.icon} />
          </div>
          <h3>{item.title}</h3>
          <p>{item.description}</p>
          {item.meta && <div className="public-card-meta">{item.meta}</div>}
          <Link className="public-card-link" to={item.href}>
            <span className="public-card-link-icon" aria-hidden="true">
              <Icon name="chevron_right" />
            </span>
            {content.common.common.readMore}
          </Link>
        </Reveal>
      ))}
    </div>
  );
}
