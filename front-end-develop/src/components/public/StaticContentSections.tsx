import { ReactNode, useMemo } from "react";
import { SimpleStaticPageContent } from "@/types/PublicContent";
import { usePublicLanguage } from "@/context/PublicLanguageContext";
import PageHeader from "./PageHeader";
import Section from "./Section";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function StaticContentSections({
  page,
  breadcrumbLabel,
  readingLayout = false,
  children,
}: {
  page: SimpleStaticPageContent;
  breadcrumbLabel: string;
  readingLayout?: boolean;
  children?: ReactNode;
}) {
  const { content } = usePublicLanguage();
  const tocItems = useMemo(
    () => page.sections.map((section) => ({ id: slugify(section.title), title: section.title })),
    [page.sections]
  );

  if (readingLayout) {
    return (
      <>
        <PageHeader
          title={page.heading}
          description={page.intro}
          breadcrumb={[
            { label: content.common.nav.home, href: "/" },
            { label: breadcrumbLabel },
          ]}
        />

        <div className="public-container public-reading-layout">
          <nav className="public-reading-toc" aria-label="On this page">
            <p className="public-eyebrow-label">On this page</p>
            <ul>
              {tocItems.map((item) => (
                <li key={item.id}>
                  <a href={`#${item.id}`}>{item.title}</a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="public-reading-content">
            {page.sections.map((section) => (
              <section
                id={slugify(section.title)}
                className="public-reading-section"
                key={section.title}
              >
                <h2>{section.title}</h2>
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </section>
            ))}
            {children}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={page.heading}
        description={page.intro}
        eyebrow={breadcrumbLabel}
        breadcrumb={[
          { label: content.common.nav.home, href: "/" },
          { label: breadcrumbLabel },
        ]}
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

      {children}
    </>
  );
}

export function StaticContentAside({ children }: { children: ReactNode }) {
  return (
    <Section alt spacing="compact">
      {children}
    </Section>
  );
}
