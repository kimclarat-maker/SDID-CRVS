import { usePublicLanguage } from "@/context/PublicLanguageContext";
import PageHeader from "@/components/public/PageHeader";
import Section from "@/components/public/Section";
import ServiceCardGrid from "@/components/public/ServiceCardGrid";

export default function CrvsOverview() {
  const { content } = usePublicLanguage();
  const page = content.crvsOverview;

  const items = page.services.map((service) => ({
    id: service.id,
    title: service.title,
    description: service.description,
    href: service.href,
    icon:
      service.id === "birth"
        ? "child_care"
        : service.id === "death"
        ? "sentiment_neutral"
        : service.id === "marriage"
        ? "favorite"
        : service.id === "certificates"
        ? "workspace_premium"
        : "edit_document",
  }));

  return (
    <>
      <PageHeader
        title={page.heading}
        description={page.intro}
        breadcrumb={[
          { label: content.common.nav.home, href: "/" },
          { label: content.common.nav.civilRegistration },
        ]}
      />

      <Section>
        <ServiceCardGrid items={items} columns={3} />
      </Section>

      <Section alt heading={page.otherEvents.title}>
        <p className="public-section-intro">{page.otherEvents.description}</p>
      </Section>
    </>
  );
}
