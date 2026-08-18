import { usePublicLanguage } from "@/context/PublicLanguageContext";
import PageHeader from "@/components/public/PageHeader";
import Section from "@/components/public/Section";
import PublicButton from "@/components/public/PublicButton";
import FaqList from "@/components/public/FaqList";
import Notice from "@/components/public/Notice";

export default function CivilRegistrationServicePage({
  serviceId,
}: {
  serviceId: string;
}) {
  const { content } = usePublicLanguage();
  const page = content.servicePages[serviceId];

  if (!page) return null;

  return (
    <>
      <PageHeader
        title={page.title}
        description={page.summary}
        breadcrumb={[
          { label: content.common.nav.home, href: "/" },
          { label: content.common.nav.civilRegistration, href: "/civil-registration" },
          { label: page.title },
        ]}
      >
        <div style={{ marginTop: "1.5rem" }}>
          <PublicButton href={page.primaryActionHref} variant="primary">
            {page.primaryActionLabel}
          </PublicButton>
        </div>
      </PageHeader>

      <Section heading="Overview">
        <p className="public-section-intro">{page.description}</p>
      </Section>

      <Section alt>
        <div className="public-grid public-grid-2">
          <div className="public-card">
            <h3>Who may apply or report this event</h3>
            <ul>
              {page.whoMayApply.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="public-card">
            <h3>Eligibility</h3>
            <ul>
              {page.eligibility.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section heading="Evidence you will need">
        <div className="public-grid public-grid-2">
          <div className="public-card">
            <h3>Required evidence</h3>
            <ul>
              {page.requiredEvidence.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="public-card">
            <h3>Conditional evidence</h3>
            <ul>
              {page.conditionalEvidence.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section alt heading="Registration steps">
        <ol className="public-steps">
          {page.registrationSteps.map((step, index) => (
            <li className="public-step" key={step}>
              <span className="public-step-number" aria-hidden="true">
                {index + 1}
              </span>
              <p>{step}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section heading="How to apply">
        <div className="public-grid public-grid-2">
          <div className="public-card">
            <h3>Online</h3>
            <p>{page.onlineOption}</p>
          </div>
          <div className="public-card">
            <h3>Assisted service</h3>
            <p>{page.assistedOption}</p>
          </div>
        </div>
      </Section>

      <Section alt>
        <dl className="public-fact-list">
          <div>
            <dt>Fees</dt>
            <dd>{page.feeDescription}</dd>
          </div>
          <div>
            <dt>Waivers</dt>
            <dd>{page.waiverDescription}</dd>
          </div>
          <div>
            <dt>Expected processing time</dt>
            <dd>{page.processingTimeDescription}</dd>
          </div>
        </dl>
      </Section>

      <Section heading="Frequently asked questions">
        <FaqList items={page.faqs} />
      </Section>

      <Section alt>
        <Notice type="info" title="Privacy notice">
          {page.privacyNotice}
        </Notice>
      </Section>

      <Section>
        <PublicButton href={page.primaryActionHref} variant="primary">
          {page.primaryActionLabel}
        </PublicButton>
      </Section>
    </>
  );
}
