import { useMemo, useState } from "react";
import { usePublicLanguage } from "@/context/PublicLanguageContext";
import PageHeader from "@/components/public/PageHeader";
import Section from "@/components/public/Section";
import Notice from "@/components/public/Notice";

interface ExampleCentre {
  name: string;
  area: string;
  services: string;
}

const EXAMPLE_CENTRES: ExampleCentre[] = [
  { name: "Central Service Centre", area: "Central area", services: "Digital identity and civil registration" },
  { name: "North Service Centre", area: "North area", services: "Digital identity and civil registration" },
  { name: "South Service Centre", area: "South area", services: "Civil registration only" },
  { name: "East Service Centre", area: "East area", services: "Digital identity and civil registration" },
];

export default function ServiceCentres() {
  const { content } = usePublicLanguage();
  const page = content.serviceCentres;
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return EXAMPLE_CENTRES;
    return EXAMPLE_CENTRES.filter(
      (centre) =>
        centre.name.toLowerCase().includes(normalized) ||
        centre.area.toLowerCase().includes(normalized)
    );
  }, [query]);

  return (
    <>
      <PageHeader
        title={page.heading}
        description={page.intro}
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

        <div className="public-form-field" style={{ marginTop: "1.5rem", maxWidth: 420 }}>
          <label htmlFor="service-centre-search">{page.finderPlaceholder}</label>
          <input
            id="service-centre-search"
            type="search"
            placeholder={page.finderPlaceholder}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <div className="public-grid public-grid-2" style={{ marginTop: "1.5rem" }}>
          {filtered.map((centre) => (
            <div className="public-card" key={centre.name}>
              <h3>{centre.name}</h3>
              <p>{centre.area}</p>
              <p>{centre.services}</p>
            </div>
          ))}
          {filtered.length === 0 && <p>No matching service centres found.</p>}
        </div>
      </Section>

      <Section alt>
        <p className="public-section-intro">{page.assistedServiceNote}</p>
      </Section>
    </>
  );
}
