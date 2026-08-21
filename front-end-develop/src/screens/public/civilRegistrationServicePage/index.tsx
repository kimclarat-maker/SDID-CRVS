import { ReactNode } from "react";
import { usePublicLanguage } from "@/context/PublicLanguageContext";
import PageHeader from "@/components/public/PageHeader";
import Section from "@/components/public/Section";
import PublicButton from "@/components/public/PublicButton";
import FaqList from "@/components/public/FaqList";
import Notice from "@/components/public/Notice";

function ServiceBlock({
  heading,
  alt,
  children,
}: {
  heading?: string;
  alt?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`public-service-block${alt ? " public-service-block-alt" : ""}`}>
      {heading && <h2>{heading}</h2>}
      {children}
    </div>
  );
}

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
        eyebrow={content.common.nav.civilRegistration}
        breadcrumb={[
          { label: content.common.nav.home, href: "/" },
          { label: content.common.nav.civilRegistration, href: "/civil-registration" },
          { label: page.title },
        ]}
      >
        <PublicButton href={page.primaryActionHref} variant="primary">
          {page.primaryActionLabel}
        </PublicButton>
      </PageHeader>

      <div className="public-container public-service-layout">
        <div className="public-service-main">
          <ServiceBlock heading="Overview">
            <p className="public-section-intro">{page.description}</p>
          </ServiceBlock>

          <ServiceBlock alt>
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
          </ServiceBlock>

          <ServiceBlock heading="Evidence you will need">
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
          </ServiceBlock>

          <ServiceBlock alt heading="Registration steps">
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
          </ServiceBlock>

          <ServiceBlock heading="How to apply">
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
          </ServiceBlock>

          <ServiceBlock alt>
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
          </ServiceBlock>

          <ServiceBlock heading="Frequently asked questions">
            <FaqList items={page.faqs} />
          </ServiceBlock>

          <ServiceBlock alt>
            <Notice type="info" title="Privacy notice">
              {page.privacyNotice}
            </Notice>
          </ServiceBlock>
        </div>

        <aside className="public-service-summary">
          <div className="public-service-summary-card">
            <p className="public-eyebrow-label">{page.title}</p>
            <dl className="public-fact-list">
              <div>
                <dt>Fees</dt>
                <dd>{page.feeDescription}</dd>
              </div>
              <div>
                <dt>Processing time</dt>
                <dd>{page.processingTimeDescription}</dd>
              </div>
            </dl>
            <PublicButton href={page.primaryActionHref} variant="primary">
              {page.primaryActionLabel}
            </PublicButton>
            <PublicButton href="/service-centres" variant="secondary">
              {content.common.nav.serviceCentres}
            </PublicButton>
            <p className="public-service-summary-privacy">
              {page.privacyNotice}
            </p>
          </div>
        </aside>
      </div>

      <Section>
        <PublicButton href={page.primaryActionHref} variant="primary">
          {page.primaryActionLabel}
        </PublicButton>
      </Section>
    </>
  );
}
