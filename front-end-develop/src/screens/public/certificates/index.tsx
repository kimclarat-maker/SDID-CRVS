import { usePublicLanguage } from "@/context/PublicLanguageContext";
import PageHeader from "@/components/public/PageHeader";
import Section from "@/components/public/Section";
import PublicButton from "@/components/public/PublicButton";

export default function Certificates() {
  const { content } = usePublicLanguage();
  const page = content.certificates;

  return (
    <>
      <PageHeader
        title={page.heading}
        description={page.intro}
        breadcrumb={[
          { label: content.common.nav.home, href: "/" },
          { label: content.common.nav.certificates },
        ]}
      />

      <Section>
        <div className="public-grid public-grid-3">
          {page.certificateTypes.map((cert) => (
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

      <Section alt>
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
    </>
  );
}
