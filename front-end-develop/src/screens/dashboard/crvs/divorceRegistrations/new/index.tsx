import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Empty from "@/components/empty";
import Button from "@/components/button";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { getCurrentAccountId, getCurrentActorName, hasWorkspacePermission } from "@/utils/workspace";
import { DivorceRegistration } from "@/domain/crvs/types";
import { demoCreateDivorceRegistrationDraft } from "@/demo/services/crvsDivorceRegistrations";
import { DEMO_DIVORCE_OFFICE_ID, DEMO_DIVORCE_OFFICE_NAME, DEMO_JURISDICTION } from "@/demo/seed/crvsAccounts";
import { emptyDivorceApplicant } from "../../divorceShared";
import DivorceRegistrationWizard from "../components/DivorceRegistrationWizard";
import toastMessage from "@/utils/common/toastMessage";
import "../../shared.css";

/** Staff-assisted divorce-registration entry point (spec §3): creates an
 * empty STAFF_ASSISTED draft and hands straight off to the wizard, the same
 * way NewMarriageApplication does. */
export default function NewDivorceRegistration() {
  const navigate = useNavigate();
  const canCreate = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_REGISTRATION_CREATE);
  const [draft, setDraft] = useState<DivorceRegistration | undefined>();
  const [creating, setCreating] = useState(false);

  const actorId = getCurrentAccountId() || "unknown";
  const actorName = getCurrentActorName();

  const startDraft = () => {
    if (creating) return;
    setCreating(true);
    try {
      const created = demoCreateDivorceRegistrationDraft(
        {
          source: "STAFF_ASSISTED",
          jurisdiction: DEMO_JURISDICTION,
          applicant: emptyDivorceApplicant("STAFF"),
          processingOfficeId: DEMO_DIVORCE_OFFICE_ID,
          processingOfficeName: DEMO_DIVORCE_OFFICE_NAME,
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
          description="Creating a divorce registration requires divorce-registration-create access."
          isFullScreen
          button={<Button text="Back to divorce registrations" appearance="ghost" type="button" onClick={() => navigate("/dashboard/crvs/divorce-registrations")} testId="new-divorce-registration-back" />}
        />
      </div>
    );
  }

  if (draft) {
    return (
      <div className="crvs-page">
        <DivorceRegistrationWizard
          registration={draft}
          onCaseChange={setDraft}
          onExit={() => navigate("/dashboard/crvs/divorce-registrations")}
          onSubmitted={(id) => navigate(`/dashboard/crvs/divorce-registrations/${id}`)}
        />
      </div>
    );
  }

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">New divorce registration</h1>
        <p className="crvs-page-subtitle">Record a divorce a court has already granted, on behalf of an applicant at the counter.</p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <button type="button" className="crvs-case-card" style={{ textAlign: "left" }} disabled={creating} onClick={startDraft} data-testid="start-divorce-registration">
        <strong>Start a staff-assisted divorce registration</strong>
        <p className="crvs-form-hint" style={{ margin: 0 }}>
          Opens the registration wizard: applicant &amp; authority, existing marriage, both former spouses, the court decision, evidence, processing office, and review.
        </p>
      </button>
    </div>
  );
}
