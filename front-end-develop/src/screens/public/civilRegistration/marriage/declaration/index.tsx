import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/public/PageHeader";
import Section from "@/components/public/Section";
import { demoCreateMarriageApplicationDraft } from "@/demo/services/crvsMarriageApplications";
import { emptyApplicant } from "@/screens/dashboard/crvs/marriageShared";
import toastMessage from "@/utils/common/toastMessage";

const PUBLIC_ACTOR = { id: "public-applicant", name: "Public applicant" };

/**
 * Public marriage-declaration entry point. Unlike death, marriage has no
 * pathway to pick first (see NewMarriageApplication's staff-side equivalent,
 * which this page's visual treatment mirrors) — a single "start" action
 * creates an empty draft and hands off directly to the wizard.
 */
export default function MarriageDeclarationStart() {
  const navigate = useNavigate();

  const handleStart = () => {
    try {
      const draft = demoCreateMarriageApplicationDraft(
        {
          officeId: "",
          officeName: "",
          officeType: "DISTRICT_SECTOR_OFFICE",
          jurisdiction: "",
          applicant1: emptyApplicant("APPLICANT1"),
          applicant2: emptyApplicant("APPLICANT2"),
          ceremonyType: "CIVIL",
          isSpecialDayRequest: false,
        },
        PUBLIC_ACTOR.id,
        PUBLIC_ACTOR.name
      );
      navigate(`/civil-registration/marriage/declaration/${draft.id}`);
    } catch (err) {
      toastMessage("error", err);
    }
  };

  return (
    <>
      <PageHeader
        title="Start a marriage declaration"
        description="Tell us about both applicants, your proposed marriage date, and supporting evidence. You can save your progress at any time and continue later using your declaration reference."
        eyebrow="Civil registration"
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "Marriage registration", href: "/civil-registration/marriage" },
          { label: "Start declaration" },
        ]}
      />
      <Section>
        <button
          type="button"
          className="public-card"
          style={{ textAlign: "left", cursor: "pointer", border: "1px solid var(--border-default, #ccc)", width: "100%" }}
          onClick={handleStart}
          data-testid="marriage-declaration-start"
        >
          <h3>Start a marriage declaration</h3>
          <p className="public-form-hint" style={{ margin: 0 }}>
            Opens the declaration wizard: service &amp; jurisdiction, both applicants, proposed marriage details,
            eligibility, evidence, witnesses, and review. Both applicants' details are needed, and the second
            applicant will be sent a secure link to confirm participation before the declaration can be submitted.
          </p>
        </button>
      </Section>
    </>
  );
}
