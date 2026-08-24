import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "@/components/public/PageHeader";
import Notice from "@/components/public/Notice";
import DeathRegistrationWizard from "@/screens/dashboard/crvs/deathRegistrations/components/DeathRegistrationWizard";
import { demoGetDeathRegistration } from "@/demo/services/crvsDeathRegistrations";
import { DeathRegistrationCase } from "@/domain/crvs/types";
import "@/screens/dashboard/crvs/shared.css";

const PUBLIC_ACTOR_NAME = "Public reporter";

/**
 * Hosts the same 8-step DeathRegistrationWizard the staff dashboard uses
 * (spec §5/§6 decision to share one wizard component between the staff and
 * public flows) at both /civil-registration/death/report/:draftId and its
 * /review alias — WizardShell's own stepper already lands the reporter on
 * the review step once every earlier step is complete, so both URLs render
 * this exact same component.
 */
export default function PublicDeathReportWizard() {
  const { draftId } = useParams<{ draftId: string }>();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<DeathRegistrationCase | undefined>();
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!draftId) return;
    demoGetDeathRegistration(draftId)
      .then((found) => {
        if (!found) {
          setNotFound(true);
          return;
        }
        setDraft(found);
      })
      .finally(() => setLoading(false));
  }, [draftId]);

  if (loading) {
    return (
      <>
        <PageHeader title="Loading your report…" eyebrow="Civil registration" />
      </>
    );
  }

  if (notFound || !draft) {
    return (
      <>
        <PageHeader title="Report not found" eyebrow="Civil registration" />
        <div className="public-container" style={{ padding: "2rem 0" }}>
          <Notice type="warning" title="We couldn't find this report">
            Check your saved reference, or start a new report from the death registration page.
          </Notice>
        </div>
      </>
    );
  }

  if (draft.status !== "DRAFT" && draft.status !== "CORRECTION_REQUIRED") {
    return (
      <>
        <PageHeader title={draft.reference} eyebrow="Civil registration" description={`This report is now ${draft.status.replace(/_/g, " ").toLowerCase()} and can no longer be edited here.`} />
        <div className="public-container" style={{ padding: "2rem 0" }}>
          <button type="button" className="public-btn public-btn-primary" onClick={() => navigate(`/civil-registration/death/case/${draft.reference}`)} data-testid="public-wizard-view-case">
            Track this case
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Report a death" description={`Reference: ${draft.reference} — your progress is saved automatically.`} eyebrow="Civil registration" />
      <div className="public-container" style={{ padding: "0 0 3rem" }}>
        <DeathRegistrationWizard
          registrationCase={draft}
          onCaseChange={setDraft}
          actorNameOverride={PUBLIC_ACTOR_NAME}
          onExit={() => navigate("/civil-registration/death")}
          onSubmitted={(id) => navigate(`/civil-registration/death/report/${id}/success`)}
        />
      </div>
    </>
  );
}
