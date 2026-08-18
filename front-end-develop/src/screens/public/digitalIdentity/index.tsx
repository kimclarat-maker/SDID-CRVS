import { usePublicLanguage } from "@/context/PublicLanguageContext";
import PageHeader from "@/components/public/PageHeader";
import Section from "@/components/public/Section";
import PublicButton from "@/components/public/PublicButton";
import FaqList from "@/components/public/FaqList";
import { platformConfig } from "@/config/platform.config";

export default function DigitalIdentity() {
  const { content } = usePublicLanguage();
  const page = content.digitalIdentity;

  return (
    <>
      <PageHeader
        title={page.heading}
        description={page.intro}
        breadcrumb={[
          { label: content.common.nav.home, href: "/" },
          { label: content.common.nav.digitalIdentity },
        ]}
      >
        <div style={{ marginTop: "1.5rem" }}>
          <PublicButton href={page.primaryActionHref} variant="primary">
            {page.primaryActionLabel}
          </PublicButton>
        </div>
      </PageHeader>

      <Section heading="Benefits">
        <div className="public-grid public-grid-3">
          {page.benefits.map((benefit) => (
            <div className="public-card" key={benefit.title}>
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

      <Section heading="Steps">
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

      <Section alt heading="Identity number">
        <p className="public-section-intro">
          This platform refers to your identity number as the{" "}
          <strong>{platformConfig.identityNumberLabel}</strong>.
        </p>
      </Section>

      <Section heading="Frequently asked questions">
        <FaqList items={page.faqs} />
      </Section>
    </>
  );
}
