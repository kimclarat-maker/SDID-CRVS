import { useMemo, useState } from "react";
import { usePublicLanguage } from "@/context/PublicLanguageContext";
import PageHeader from "@/components/public/PageHeader";
import Section from "@/components/public/Section";
import Notice from "@/components/public/Notice";
import Icon from "@/components/icon";
import { platformConfig } from "@/config/platform.config";

interface ExampleCentre {
  name: string;
  area: string;
  services: string[];
}

const EXAMPLE_CENTRES: ExampleCentre[] = [
  {
    name: "Central Service Centre",
    area: "Central area",
    services: ["Digital identity", "Civil registration"],
  },
  {
    name: "North Service Centre",
    area: "North area",
    services: ["Digital identity", "Civil registration"],
  },
  {
    name: "South Service Centre",
    area: "South area",
    services: ["Civil registration"],
  },
  {
    name: "East Service Centre",
    area: "East area",
    services: ["Digital identity", "Civil registration"],
  },
];

const AREAS = ["All areas", ...new Set(EXAMPLE_CENTRES.map((c) => c.area))];

export default function ServiceCentres() {
  const { content } = usePublicLanguage();
  const page = content.serviceCentres;
  const [query, setQuery] = useState("");
  const [area, setArea] = useState("All areas");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return EXAMPLE_CENTRES.filter((centre) => {
      const matchesArea = area === "All areas" || centre.area === area;
      const matchesQuery =
        !normalized ||
        centre.name.toLowerCase().includes(normalized) ||
        centre.area.toLowerCase().includes(normalized);
      return matchesArea && matchesQuery;
    });
  }, [query, area]);

  return (
    <>
      <PageHeader
        title={page.heading}
        description={page.intro}
        eyebrow={content.common.nav.serviceCentres}
        breadcrumb={[
          { label: content.common.nav.home, href: "/" },
          { label: content.common.nav.serviceCentres },
        ]}
      />

      <Section>
        <Notice type="info" title="Example data">
          The list below uses illustrative service centre names for preview
          purposes. Connect this page to the service centre directory to show
          real, up-to-date locations.
        </Notice>

        <div className="public-service-centre-filters">
          <div className="public-form-field">
            <label htmlFor="service-centre-search">
              {page.finderPlaceholder}
            </label>
            <input
              id="service-centre-search"
              type="search"
              placeholder={page.finderPlaceholder}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="public-form-field">
            <label htmlFor="service-centre-area">Area</label>
            <select
              id="service-centre-area"
              value={area}
              onChange={(event) => setArea(event.target.value)}
            >
              {AREAS.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="public-service-centre-results">
          <div className="public-grid public-grid-2">
            {filtered.map((centre) => (
              <div className="public-card" key={centre.name}>
                <h3>{centre.name}</h3>
                <p>{centre.area}</p>
                <div className="public-service-centre-tags">
                  {centre.services.map((service) => (
                    <span className="public-services-showcase-tag" key={service}>
                      {service}
                    </span>
                  ))}
                </div>
                {platformConfig.contact.hoursOfOperation && (
                  <p className="public-form-hint">
                    {platformConfig.contact.hoursOfOperation}
                  </p>
                )}
              </div>
            ))}
            {filtered.length === 0 && (
              <Notice type="warning" title="No matches">
                No service centres match your search. Try a different area
                or clear your search.
              </Notice>
            )}
          </div>

          <div className="public-service-centre-preview-visual" aria-hidden="true">
            <Icon name="map" />
          </div>
        </div>
      </Section>

      <Section alt spacing="compact">
        <p className="public-section-intro">{page.assistedServiceNote}</p>
        {platformConfig.contact.callCenterNumber && (
          <p>
            <strong>Call centre:</strong>{" "}
            <a href={`tel:${platformConfig.contact.callCenterNumber}`}>
              {platformConfig.contact.callCenterNumber}
            </a>
          </p>
        )}
      </Section>
    </>
  );
}
