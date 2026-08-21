import { usePublicLanguage } from "@/context/PublicLanguageContext";
import { Link } from "react-router-dom";
import PublicButton from "@/components/public/PublicButton";
import Section from "@/components/public/Section";
import Carousel from "@/components/public/Carousel";
import Icon from "@/components/icon";
import HeroVideo from "@/components/public/HeroVideo";
import AboutSection from "@/components/public/AboutSection";
import ServicesShowcase from "@/components/public/ServicesShowcase";
import WorkTogetherSection from "@/components/public/WorkTogetherSection";
import NoticesPanel from "@/components/public/NoticesPanel";
import FinalCta from "@/components/public/FinalCta";

const REQUIREMENT_ICONS = ["checklist", "payments", "schedule"];
const TRUST_ICONS = ["shield", "visibility_off", "gavel"];

export default function Home() {
  const { content } = usePublicLanguage();
  const { home } = content;

  return (
    <>
      <HeroVideo
        slides={home.heroSlides}
        hero={home.hero}
        floatingCards={home.serviceCards}
      />

      <AboutSection
        about={home.about}
        platformIntro={content.common.footer.aboutText}
      />

      <ServicesShowcase showcase={home.serviceShowcase} />

      <section
        id="popular-services"
        className="public-section public-section-alt"
      >
        <div className="public-container">
          <h2>{home.popularServices.heading}</h2>
          <p className="public-section-intro">{home.popularServices.intro}</p>

          <Carousel
            ariaLabel={home.popularServices.heading}
            items={home.popularServices.items.map((item, index) => ({
              id: item.id,
              content: (
                <div
                  className={`public-card public-rail-card${
                    index % 2 === 1 ? " public-rail-card-alt" : ""
                  }`}
                >
                  <div className="public-service-icon" aria-hidden="true">
                    <Icon name={item.icon} />
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  {item.meta && (
                    <div className="public-card-meta">{item.meta}</div>
                  )}
                  <Link className="public-card-link" to={item.href}>
                    <span
                      className="public-card-link-icon"
                      aria-hidden="true"
                    >
                      <Icon name="chevron_right" />
                    </span>
                    {content.common.common.readMore}
                  </Link>
                </div>
              ),
            }))}
          />
        </div>
      </section>

      <Section>
        <div className="public-grid public-grid-2">
          <div className="public-card">
            <h2>{home.trackShortcut.heading}</h2>
            <p>{home.trackShortcut.description}</p>
            <PublicButton href={home.trackShortcut.ctaHref} variant="primary">
              {home.trackShortcut.ctaLabel}
            </PublicButton>
          </div>
          <div className="public-card">
            <h2>{home.verifyShortcut.heading}</h2>
            <p>{home.verifyShortcut.description}</p>
            <PublicButton href={home.verifyShortcut.ctaHref} variant="primary">
              {home.verifyShortcut.ctaLabel}
            </PublicButton>
          </div>
        </div>
      </Section>

      <WorkTogetherSection content={home.howSdidCrvsWorkTogether} />

      <Section heading={home.howItWorks.heading}>
        <ol className="public-steps">
          {home.howItWorks.steps.map((step, index) => (
            <li className="public-step" key={step.title}>
              <span className="public-step-number" aria-hidden="true">
                {index + 1}
              </span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section
        alt
        heading={home.requirementsFeesProcessing.heading}
        intro={home.requirementsFeesProcessing.intro}
      >
        <div className="public-grid public-grid-3">
          {home.requirementsFeesProcessing.items.map((item, index) => (
            <div className="public-card" key={item.title}>
              <div className="public-service-icon" aria-hidden="true">
                <Icon name={REQUIREMENT_ICONS[index % REQUIREMENT_ICONS.length]} />
              </div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <Link className="public-card-link" to="/requirements">
                <span className="public-card-link-icon" aria-hidden="true">
                  <Icon name="chevron_right" />
                </span>
                {content.common.common.learnMore}
              </Link>
            </div>
          ))}
        </div>
      </Section>

      <section className="public-section">
        <div className="public-container">
          <div className="public-service-centre-preview">
            <div>
              <h2>{home.serviceCentreFinderPreview.heading}</h2>
              <p className="public-section-intro">
                {home.serviceCentreFinderPreview.description}
              </p>
              <PublicButton
                href={home.serviceCentreFinderPreview.ctaHref}
                variant="primary"
              >
                {home.serviceCentreFinderPreview.ctaLabel}
              </PublicButton>
            </div>
            <div className="public-service-centre-preview-visual" aria-hidden="true">
              <Icon name="location_on" />
            </div>
          </div>
        </div>
      </section>

      <Section dark heading={home.trustSection.heading}>
        <div className="public-grid public-grid-3">
          {home.trustSection.points.map((point, index) => (
            <div className="public-card" key={point.title}>
              <div className="public-service-icon" aria-hidden="true">
                <Icon name={TRUST_ICONS[index % TRUST_ICONS.length]} />
              </div>
              <h3>{point.title}</h3>
              <p>{point.description}</p>
            </div>
          ))}
        </div>
      </Section>

      <NoticesPanel notices={home.notices} />

      <FinalCta
        heading={home.hero.title}
        description={home.hero.subtitle}
        primaryLabel={home.hero.primaryCtaLabel}
        primaryHref={home.hero.primaryCtaHref}
        secondaryLabel={home.serviceCentreFinderPreview.ctaLabel}
        secondaryHref={home.serviceCentreFinderPreview.ctaHref}
      />
    </>
  );
}
