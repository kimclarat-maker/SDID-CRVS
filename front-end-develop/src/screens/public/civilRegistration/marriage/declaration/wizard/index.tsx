import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "@/components/public/PageHeader";
import Notice from "@/components/public/Notice";
import MarriageApplicationWizard from "@/screens/dashboard/crvs/marriageApplications/components/MarriageApplicationWizard";
import { demoGetMarriageApplication } from "@/demo/services/crvsMarriageApplications";
import { marriagePolicyConfig } from "@/domain/crvs/marriagePolicyConfig";
import { MarriageApplication, MarriageApplicationStatus } from "@/domain/crvs/types";
import "@/screens/dashboard/crvs/shared.css";

const PUBLIC_ACTOR_NAME = "Public applicant";

const EDITABLE_STATUSES: MarriageApplicationStatus[] = ["DRAFT", "CORRECTION_REQUIRED", "PARTNER_VERIFICATION_REQUIRED"];

/**
 * Hosts the same 8-step MarriageApplicationWizard the staff dashboard uses
 * (no staff-auth coupling in that component) at both
 * /civil-registration/marriage/declaration/:draftId and its /review alias —
 * WizardShell's own stepper already lands the applicant on the review step
 * once every earlier step is complete, so both URLs render this exact same
 * component. Mirrors PublicDeathReportWizard's pattern.
 */
export default function PublicMarriageDeclarationWizard() {
  const { draftId } = useParams<{ draftId: string }>();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<MarriageApplication | undefined>();
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Mirrors `draft` synchronously so onSubmitted (fired right after
  // onCaseChange, in the same tick) can read the just-submitted application
  // without waiting on React's async state update.
  const draftRef = useRef<MarriageApplication | undefined>();

  useEffect(() => {
    if (!draftId) return;
    demoGetMarriageApplication(draftId)
      .then((found) => {
        if (!found) {
          setNotFound(true);
          return;
        }
        draftRef.current = found;
        setDraft(found);
      })
      .finally(() => setLoading(false));
  }, [draftId]);

  const handleCaseChange = (updated: MarriageApplication) => {
    draftRef.current = updated;
    setDraft(updated);
  };

  if (loading) {
    return <PageHeader title="Loading your declaration…" eyebrow="Civil registration" />;
  }

  if (notFound || !draft) {
    return (
      <>
        <PageHeader title="Declaration not found" eyebrow="Civil registration" />
        <div className="public-container" style={{ padding: "2rem 0" }}>
          <Notice type="warning" title="We couldn't find this declaration">
            Check your saved reference, or start a new declaration from the marriage registration page.
          </Notice>
        </div>
      </>
    );
  }

  if (!EDITABLE_STATUSES.includes(draft.status)) {
    return (
      <>
        <PageHeader
          title={draft.reference}
          eyebrow="Civil registration"
          description={`This declaration is now ${draft.status.replace(/_/g, " ").toLowerCase()} and can no longer be edited here.`}
        />
        <div className="public-container" style={{ padding: "2rem 0" }}>
          <button
            type="button"
            className="public-btn public-btn-primary"
            onClick={() => navigate(`/civil-registration/marriage/application/${draft.reference}`)}
            data-testid="public-marriage-wizard-view-application"
          >
            Track this application
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Marriage declaration"
        description={`Reference: ${draft.reference} — your progress is saved automatically.`}
        eyebrow="Civil registration"
      />
      <div className="public-container" style={{ padding: "0 0 3rem" }}>
        <MarriageApplicationWizard
          application={draft}
          onCaseChange={handleCaseChange}
          actorNameOverride={PUBLIC_ACTOR_NAME}
          onExit={() => navigate("/civil-registration/marriage")}
          onSubmitted={(id) => {
            const updated = draftRef.current;
            const paymentPending = marriagePolicyConfig.payment.required && updated?.payment.status === "PENDING";
            navigate(
              paymentPending
                ? `/civil-registration/marriage/declaration/${id}/payment`
                : `/civil-registration/marriage/declaration/${id}/success`
            );
          }}
        />
      </div>
    </>
  );
}
