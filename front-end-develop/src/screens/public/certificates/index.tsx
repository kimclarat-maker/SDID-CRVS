import { usePublicLanguage } from "@/context/PublicLanguageContext";
import PageHeader from "@/components/public/PageHeader";
import Section from "@/components/public/Section";
import PublicButton from "@/components/public/PublicButton";

export default function Certificates() {
  const { content } = usePublicLanguage();
  const page = content.certificates;
  const [featured, ...rest] = page.certificateTypes;

  return (
    <>
      <PageHeader
        title={page.heading}
        description={page.intro}
        eyebrow={content.common.nav.certificates}
        breadcrumb={[
          { label: content.common.nav.home, href: "/" },
          { label: content.common.nav.certificates },
        ]}
      />

      {featured && (
        <Section spacing="compact">
          <div className="public-card public-card-featured">
            <h3>{featured.title}</h3>
            <p>{featured.description}</p>
            <PublicButton href={featured.href} variant="primary">
              {content.common.common.learnMore}
            </PublicButton>
          </div>
        </Section>
      )}

      <Section alt heading="All certificate types" spacing="compact">
        <div className="public-grid public-grid-3">
          {rest.map((cert) => (
            <div className="public-card" key={cert.title}>
              <h3>{cert.title}</h3>
              <p>{cert.description}</p>
              <PublicButton href={cert.href} variant="outline">
                {content.common.common.learnMore}
              </PublicButton>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <dl className="public-fact-list">
          <div>
            <dt>Fees</dt>
            <dd>{page.feeDescription}</dd>
          </div>
          <div>
            <dt>Expected processing time</dt>
            <dd>{page.processingTimeDescription}</dd>
          </div>
        </dl>
      </Section>

      <Section alt>
        <p className="public-section-intro">
          Registering a life event and requesting a certificate for it are
          two different steps: registration creates the official record,
          and a certificate is a document you request afterwards, once the
          event is registered.
        </p>
        <div className="public-hero-actions">
          <PublicButton href="/track" variant="secondary">
            {content.common.nav.track}
          </PublicButton>
          <PublicButton href="/verify" variant="secondary">
            {content.common.nav.verify}
          </PublicButton>
        </div>
      </Section>
    </>
  );
}
