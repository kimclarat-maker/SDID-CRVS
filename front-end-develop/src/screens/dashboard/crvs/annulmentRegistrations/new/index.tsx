import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Empty from "@/components/empty";
import Button from "@/components/button";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { getCurrentAccountId, getCurrentActorName, hasWorkspacePermission } from "@/utils/workspace";
import { AnnulmentRegistration } from "@/domain/crvs/types";
import { demoCreateAnnulmentRegistrationDraft } from "@/demo/services/crvsAnnulmentRegistrations";
import { DEMO_ANNULMENT_OFFICE_ID, DEMO_ANNULMENT_OFFICE_NAME, DEMO_JURISDICTION } from "@/demo/seed/crvsAccounts";
import { emptyAnnulmentApplicant } from "../../annulmentShared";
import AnnulmentRegistrationWizard from "../components/AnnulmentRegistrationWizard";
import toastMessage from "@/utils/common/toastMessage";
import "../../shared.css";

/** Staff-assisted annulment-registration entry point: creates an empty
 * STAFF_ASSISTED draft and hands straight off to the wizard, the same way
 * NewDivorceRegistration does. Source is always STAFF_ASSISTED here — the
 * only other entry point into a registration draft is converting a validated
 * court notification (handled from the notifications queue/details pages). */
export default function NewAnnulmentRegistration() {
  const navigate = useNavigate();
  const canCreate = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_REGISTRATION_CREATE);
  const [draft, setDraft] = useState<AnnulmentRegistration | undefined>();
  const [creating, setCreating] = useState(false);

  const actorId = getCurrentAccountId() || "unknown";
  const actorName = getCurrentActorName();

  const startDraft = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const created = await demoCreateAnnulmentRegistrationDraft(
        {
          source: "STAFF_ASSISTED",
          jurisdiction: DEMO_JURISDICTION,
          applicant: emptyAnnulmentApplicant("STAFF"),
          processingOffice: {
            selectedProcessingOfficeId: DEMO_ANNULMENT_OFFICE_ID,
            selectedProcessingOfficeName: DEMO_ANNULMENT_OFFICE_NAME,
            embassyOrForeignOfficePath: false,
            jurisdictionResult: "UNRESOLVED",
          },
        },
        actorId,
        actorName
      );
      setDraft(created);
    } catch (err) {
      toastMessage("error", err);
    } finally {
      setCreating(false);
    }
  };

  if (!canCreate) {
    return (
      <div className="crvs-page">
        <Empty
          icon="lock"
          title="You don't have access to this action"
          description="Creating a marriage-annulment registration requires annulment-registration-create access."
          isFullScreen
          button={<Button text="Back to annulment registrations" appearance="ghost" type="button" onClick={() => navigate("/dashboard/crvs/annulment-registrations")} testId="new-annulment-registration-back" />}
        />
      </div>
    );
  }

  if (draft) {
    return (
      <div className="crvs-page">
        <AnnulmentRegistrationWizard
          registration={draft}
          onCaseChange={setDraft}
          onExit={() => navigate("/dashboard/crvs/annulment-registrations")}
          onSubmitted={(id) => navigate(`/dashboard/crvs/annulment-registrations/${id}`)}
        />
      </div>
    );
  }

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">New marriage-annulment registration</h1>
        <p className="crvs-page-subtitle">Record an annulment a competent court or legally recognized authority has already decided, on behalf of an applicant at the counter.</p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <button type="button" className="crvs-case-card" style={{ textAlign: "left" }} disabled={creating} onClick={startDraft} data-testid="start-annulment-registration">
        <strong>Start a staff-assisted annulment registration</strong>
        <p className="crvs-form-hint" style={{ margin: 0 }}>
          Opens the registration wizard: applicant &amp; authority, existing marriage, both affected parties, the annulment decision, evidence, processing office, and review.
        </p>
      </button>
    </div>
  );
}
