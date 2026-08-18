import { SimpleStaticPageContent } from "@/types/PublicContent";
import PageHeader from "./PageHeader";
import Section from "./Section";

export default function StaticContentSections({
  page,
  breadcrumbLabel,
}: {
  page: SimpleStaticPageContent;
  breadcrumbLabel: string;
}) {
  return (
    <>
      <PageHeader
        title={page.heading}
        description={page.intro}
        breadcrumb={[{ label: "Home", href: "/" }, { label: breadcrumbLabel }]}
      />

      {page.sections.map((section, index) => (
        <Section
          key={section.title}
          alt={index % 2 === 1}
          heading={section.title}
          headingLevel="h2"
        >
          {section.body.map((paragraph) => (
            <p className="public-section-intro" key={paragraph}>
              {paragraph}
            </p>
          ))}
        </Section>
      ))}
    </>
  );
}
