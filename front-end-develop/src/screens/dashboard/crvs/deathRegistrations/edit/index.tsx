import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Empty from "@/components/empty";
import Button from "@/components/button";
import { hasWorkspacePermission } from "@/utils/workspace";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { demoGetDeathRegistration } from "@/demo/services/crvsDeathRegistrations";
import { DeathRegistrationCase } from "@/domain/crvs/types";
import DeathRegistrationWizard from "../components/DeathRegistrationWizard";
import "../../shared.css";

export default function EditDeathRegistration() {
  const navigate = useNavigate();
  const { caseId } = useParams<{ caseId: string }>();
  const canEdit = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DEATH_DRAFT_EDIT);

  const [deathCase, setDeathCase] = useState<DeathRegistrationCase | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!caseId || !canEdit) {
      setLoading(false);
      return;
    }
    demoGetDeathRegistration(caseId).then(setDeathCase).finally(() => setLoading(false));
  }, [caseId, canEdit]);

  if (!canEdit) {
    return (
      <div className="crvs-page">
        <Empty icon="lock" title="You don't have access to this action" description="Editing death registrations requires death-draft-edit access." />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="crvs-page">
        <p className="crvs-form-hint">Loading case…</p>
      </div>
    );
  }

  if (!deathCase) {
    return (
      <div className="crvs-page">
        <Empty
          icon="error"
          title="Case not found"
          button={<Button text="Back to death registrations" appearance="ghost" onClick={() => navigate("/dashboard/crvs/death-registrations")} testId="dr-edit-not-found-back" />}
        />
      </div>
    );
  }

  if (deathCase.status !== "DRAFT" && deathCase.status !== "CORRECTION_REQUIRED") {
    return (
      <div className="crvs-page">
        <Empty
          icon="lock"
          title="This case can no longer be edited from here"
          description={`Current status: ${deathCase.status.replace(/_/g, " ")}.`}
          button={<Button text="View case" appearance="ghost" onClick={() => navigate(`/dashboard/crvs/death-registrations/${deathCase.id}`)} testId="dr-edit-view-instead" />}
        />
      </div>
    );
  }

  return (
    <div className="crvs-page">
      {deathCase.status === "CORRECTION_REQUIRED" && (
        <div className="crvs-banner crvs-banner-warning" style={{ marginBottom: 16 }}>
          Correction requested — address the items below, then submit to resubmit for review.
          {deathCase.correctionRequests
            .filter((c) => !c.resolvedAt)
            .map((c) => (
              <ul key={c.id} style={{ margin: "8px 0 0", paddingLeft: 20 }}>
                {c.items.map((item) => (
                  <li key={item.id}>
                    <strong>{item.section.replace(/_/g, " ")}:</strong> {item.reason} {item.note ? `— ${item.note}` : ""}
                  </li>
                ))}
              </ul>
            ))}
        </div>
      )}

      <DeathRegistrationWizard
        registrationCase={deathCase}
        onCaseChange={setDeathCase}
        onExit={() => navigate(`/dashboard/crvs/death-registrations/${deathCase.id}`)}
        onSubmitted={(id) => navigate(`/dashboard/crvs/death-registrations/${id}`)}
      />
    </div>
  );
}
