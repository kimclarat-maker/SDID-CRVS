import { usePublicLanguage } from "@/context/PublicLanguageContext";
import PageHeader from "@/components/public/PageHeader";
import Section from "@/components/public/Section";
import PublicButton from "@/components/public/PublicButton";
import FaqList from "@/components/public/FaqList";
import FinalCta from "@/components/public/FinalCta";
import { platformConfig } from "@/config/platform.config";

export default function DigitalIdentity() {
  const { content } = usePublicLanguage();
  const page = content.digitalIdentity;

  return (
    <>
      <PageHeader
        title={page.heading}
        description={page.intro}
        eyebrow={content.common.nav.digitalIdentity}
        breadcrumb={[
          { label: content.common.nav.home, href: "/" },
          { label: content.common.nav.digitalIdentity },
        ]}
      >
        <PublicButton href={page.primaryActionHref} variant="primary">
          {page.primaryActionLabel}
        </PublicButton>
      </PageHeader>

      <Section heading="Benefits">
        <div className="public-grid public-grid-3">
          {page.benefits.map((benefit, index) => (
            <div
              className={`public-card${index === 0 ? " public-card-featured" : ""}`}
              key={benefit.title}
            >
              <h3>{benefit.title}</h3>
              <p>{benefit.description}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section alt heading="Eligibility">
        <ul>
          {page.eligibility.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Section>

      <Section heading="Application process">
        <ol className="public-steps">
          {page.steps.map((step, index) => (
            <li className="public-step" key={step}>
              <span className="public-step-number" aria-hidden="true">
                {index + 1}
              </span>
              <p>{step}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section alt heading="How this relates to civil registration">
        <p className="public-section-intro">
          {platformConfig.identitySystemName} is built on the life events
          recorded by {platformConfig.civilRegistrationSystemName}. Registering
          a birth, death, or marriage keeps your digital identity record
          accurate and up to date, and your identity number is referred to as
          the <strong>{platformConfig.identityNumberLabel}</strong>.
        </p>
        <PublicButton href="/civil-registration" variant="secondary">
          {content.common.nav.civilRegistration}
        </PublicButton>
      </Section>

      <Section heading="Frequently asked questions">
        <FaqList items={page.faqs} />
      </Section>

      <FinalCta
        heading={content.common.common.getStarted}
        description={page.intro}
        primaryLabel={page.primaryActionLabel}
        primaryHref={page.primaryActionHref}
        secondaryLabel={content.common.nav.serviceCentres}
        secondaryHref="/service-centres"
      />
    </>
  );
}
