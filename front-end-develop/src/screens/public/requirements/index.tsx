import { useId, useState } from "react";
import { Link } from "react-router-dom";
import { usePublicLanguage } from "@/context/PublicLanguageContext";
import PageHeader from "@/components/public/PageHeader";
import Section from "@/components/public/Section";

function RequirementCategory({
  category,
}: {
  category: { title: string; items: string[] };
}) {
  const [open, setOpen] = useState(true);
  const panelId = useId();

  return (
    <div className={`public-accordion-item${open ? " is-open" : ""}`}>
      <h3 className="public-accordion-heading">
        <button
          type="button"
          className="public-accordion-trigger"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
        >
          <span>{category.title}</span>
          <span className="public-accordion-icon" aria-hidden="true" />
        </button>
      </h3>
      <div
        id={panelId}
        role="region"
        className="public-accordion-panel"
        aria-hidden={!open}
      >
        <div className="public-accordion-panel-inner">
          <ul>
            {category.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function Requirements() {
  const { content } = usePublicLanguage();
  const page = content.requirements;
  const categories = page.categories;
  const [activeTab, setActiveTab] = useState(0);

  return (
    <>
      <PageHeader
        title={page.heading}
        description={page.intro}
        eyebrow="Requirements"
        breadcrumb={[
          { label: content.common.nav.home, href: "/" },
          { label: page.heading },
        ]}
      />

      <Section>
        <div
          className="public-segmented-control"
          role="tablist"
          aria-label={page.heading}
        >
          {categories.map((category, index) => (
            <button
              key={category.title}
              type="button"
              role="tab"
              aria-selected={index === activeTab}
              className={`public-segmented-control-tab${
                index === activeTab ? " is-active" : ""
              }`}
              onClick={() => setActiveTab(index)}
            >
              {category.title}
            </button>
          ))}
        </div>

        <div className="public-accordion" style={{ marginTop: "1.5rem" }}>
          {categories[activeTab] && (
            <RequirementCategory category={categories[activeTab]} />
          )}
        </div>
      </Section>

      <Section alt heading="More detail by service">
        <p className="public-section-intro">
          Each service page has requirement, fee, and processing-time
          guidance specific to that service.
        </p>
        <div className="public-hero-actions">
          <Link to="/civil-registration/birth" className="public-btn public-btn-outline">
            {content.common.nav.civilRegistration} — Birth
          </Link>
          <Link to="/civil-registration/death" className="public-btn public-btn-outline">
            {content.common.nav.civilRegistration} — Death
          </Link>
          <Link to="/civil-registration/marriage" className="public-btn public-btn-outline">
            {content.common.nav.civilRegistration} — Marriage
          </Link>
          <Link to="/certificates" className="public-btn public-btn-outline">
            {content.common.nav.certificates}
          </Link>
        </div>
      </Section>
    </>
  );
}
