import { usePublicLanguage } from "@/context/PublicLanguageContext";
import PublicButton from "@/components/public/PublicButton";
import Section from "@/components/public/Section";
import ServiceCardGrid from "@/components/public/ServiceCardGrid";
import Notice from "@/components/public/Notice";
import HeroVideo from "@/components/public/HeroVideo";
import AboutSection from "@/components/public/AboutSection";
import ServicesShowcase from "@/components/public/ServicesShowcase";

export default function Home() {
  const { content } = usePublicLanguage();
  const { home } = content;

  return (
    <>
      <HeroVideo slides={home.heroSlides} />

      <AboutSection about={home.about} />

      <ServicesShowcase showcase={home.serviceShowcase} />

      <Section
        id="popular-services"
        alt
        heading={home.popularServices.heading}
        intro={home.popularServices.intro}
      >
        <ServiceCardGrid items={home.popularServices.items} columns={4} />
      </Section>

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

      <Section alt heading={home.howSdidCrvsWorkTogether.heading}>
        {home.howSdidCrvsWorkTogether.body.map((paragraph) => (
          <p className="public-section-intro" key={paragraph}>
            {paragraph}
          </p>
        ))}
      </Section>

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
          {home.requirementsFeesProcessing.items.map((item) => (
            <div className="public-card" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section heading={home.serviceCentreFinderPreview.heading}>
        <p className="public-section-intro">
          {home.serviceCentreFinderPreview.description}
        </p>
        <PublicButton
          href={home.serviceCentreFinderPreview.ctaHref}
          variant="primary"
        >
          {home.serviceCentreFinderPreview.ctaLabel}
        </PublicButton>
      </Section>

      <Section alt heading={home.trustSection.heading}>
        <div className="public-grid public-grid-3">
          {home.trustSection.points.map((point) => (
            <div className="public-card" key={point.title}>
              <h3>{point.title}</h3>
              <p>{point.description}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section heading={home.notices.heading}>
        {home.notices.items.map((notice) => (
          <Notice type={notice.type} title={notice.title} key={notice.title}>
            {notice.message}
          </Notice>
        ))}
      </Section>
    </>
  );
}
