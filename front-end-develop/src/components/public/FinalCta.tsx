import { Link } from "react-router-dom";
import Reveal from "./Reveal";

interface FinalCtaProps {
  heading: string;
  description?: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
}

export default function FinalCta({
  heading,
  description,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
}: FinalCtaProps) {
  return (
    <section className="public-section-compact">
      <div className="public-container">
        <Reveal className="public-final-cta">
          <h2>{heading}</h2>
          {description && <p>{description}</p>}
          <div className="public-final-cta-actions">
            <Link
              to={primaryHref}
              className="public-btn public-final-cta-primary"
            >
              {primaryLabel}
            </Link>
            {secondaryLabel && secondaryHref && (
              <Link
                to={secondaryHref}
                className="public-btn public-btn-secondary public-final-cta-secondary"
              >
                {secondaryLabel}
              </Link>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
