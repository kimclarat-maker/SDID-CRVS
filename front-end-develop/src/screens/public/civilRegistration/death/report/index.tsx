import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/public/PageHeader";
import Section from "@/components/public/Section";
import { demoCreateDeathRegistrationDraft } from "@/demo/services/crvsDeathRegistrations";
import { DeathReportingPathway } from "@/domain/crvs/types";
import { emptyDeceased, emptyOccurrence, emptyDeathDeclarant, todayIsoDate, PATHWAY_LABELS } from "@/screens/dashboard/crvs/deathShared";
import { DEMO_FACILITY_ID, DEMO_FACILITY_NAME, DEMO_JURISDICTION, DEMO_PROCESSING_OFFICE } from "@/demo/seed/crvsAccounts";
import toastMessage from "@/utils/common/toastMessage";

const PUBLIC_ACTOR = { id: "public-reporter", name: "Public reporter" };

/** Public death-report entry point (spec §5 step 1 "Reporting pathway"). */
export default function DeathReportStart() {
  const navigate = useNavigate();

  const handleSelect = (pathway: DeathReportingPathway) => {
    try {
      const draft = demoCreateDeathRegistrationDraft(
        {
          pathway,
          processingOfficeId: "OFFICE-DEMO-01",
          processingOfficeName: DEMO_PROCESSING_OFFICE,
          jurisdiction: DEMO_JURISDICTION,
          dateOfDeath: "",
          dateReported: todayIsoDate(),
          deceased: emptyDeceased(),
          occurrence: { ...emptyOccurrence(), placeCategory: pathway === "HEALTH_FACILITY" ? "HEALTH_FACILITY" : "HOME" },
          facilityId: pathway === "HEALTH_FACILITY" ? DEMO_FACILITY_ID : undefined,
          facilityName: pathway === "HEALTH_FACILITY" ? DEMO_FACILITY_NAME : undefined,
          declarant: emptyDeathDeclarant(),
        },
        PUBLIC_ACTOR.id,
        PUBLIC_ACTOR.name
      );
      navigate(`/civil-registration/death/report/${draft.id}`);
    } catch (err) {
      toastMessage("error", err);
    }
  };

  return (
    <>
      <PageHeader
        title="Report a death"
        description="Step 1: tell us which pathway matches this case."
        eyebrow="Civil registration"
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "Death registration", href: "/civil-registration/death" },
          { label: "Report a death" },
        ]}
      />
      <Section>
        <p className="public-section-intro">
          Choose the option that best matches the death you are reporting. You can save your progress at any time and
          continue later using your report reference.
        </p>
        <div className="public-grid public-grid-2">
          {(Object.keys(PATHWAY_LABELS) as DeathReportingPathway[]).map((pathway) => (
            <button
              key={pathway}
              type="button"
              className="public-card"
              style={{ textAlign: "left", cursor: "pointer", border: "1px solid var(--border-default, #ccc)" }}
              onClick={() => handleSelect(pathway)}
              data-testid={`public-pathway-${pathway}`}
            >
              <h3>{PATHWAY_LABELS[pathway]}</h3>
            </button>
          ))}
        </div>
      </Section>
    </>
  );
}
