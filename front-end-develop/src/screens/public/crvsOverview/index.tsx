import { usePublicLanguage } from "@/context/PublicLanguageContext";
import PageHeader from "@/components/public/PageHeader";
import Section from "@/components/public/Section";
import ServiceCardGrid from "@/components/public/ServiceCardGrid";
import FinalCta from "@/components/public/FinalCta";
import { platformConfig } from "@/config/platform.config";

const VITAL_EVENT_IDS = ["birth", "death", "marriage", "divorce"];

const ICONS: Record<string, string> = {
  birth: "child_care",
  death: "sentiment_neutral",
  marriage: "favorite",
  divorce: "heart_broken",
  certificates: "workspace_premium",
};

export default function CrvsOverview() {
  const { content } = usePublicLanguage();
  const page = content.crvsOverview;

  const withIcon = (service: (typeof page.services)[number]) => ({
    id: service.id,
    title: service.title,
    description: service.description,
    href: service.href,
    icon: ICONS[service.id] ?? "edit_document",
  });

  const primaryServices = page.services
    .filter((service) => VITAL_EVENT_IDS.includes(service.id))
    .map(withIcon);
  const secondaryServices = page.services
    .filter((service) => !VITAL_EVENT_IDS.includes(service.id))
    .map(withIcon);

  return (
    <>
      <PageHeader
        title={page.heading}
        description={page.intro}
        eyebrow={content.common.nav.civilRegistration}
        breadcrumb={[
          { label: content.common.nav.home, href: "/" },
          { label: content.common.nav.civilRegistration },
        ]}
      />

      <Section heading="Register a life event">
        <ServiceCardGrid items={primaryServices} columns={3} />
      </Section>

      {secondaryServices.length > 0 && (
        <Section alt heading="Certificates and corrections" spacing="compact">
          <ServiceCardGrid items={secondaryServices} columns={3} />
        </Section>
      )}

      <Section heading={page.otherEvents.title}>
        <p className="public-section-intro">{page.otherEvents.description}</p>
      </Section>

      <Section alt heading="How this connects to digital identity">
        <p className="public-section-intro">
          {platformConfig.civilRegistrationSystemName} records life events
          that {platformConfig.identitySystemName} uses to create and keep
          your digital identity accurate, so registering a life event and
          maintaining your identity are part of the same trusted process.
        </p>
      </Section>

      <FinalCta
        heading={content.common.common.startNow}
        description={page.intro}
        primaryLabel={content.common.common.getStarted}
        primaryHref="/digital-identity"
        secondaryLabel={content.common.nav.certificates}
        secondaryHref="/certificates"
      />
    </>
  );
}
