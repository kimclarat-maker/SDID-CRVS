import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Empty from "@/components/empty";
import Button from "@/components/button";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { getCurrentAccountId, hasWorkspacePermission } from "@/utils/workspace";
import { demoGetAnnulmentRegistration } from "@/demo/services/crvsAnnulmentRegistrations";
import { AnnulmentRegistration } from "@/domain/crvs/types";
import { ANNULMENT_REGISTRATION_STATUS_LABELS } from "@/domain/crvs/statusMachines";
import AnnulmentRegistrationWizard from "../components/AnnulmentRegistrationWizard";
import "../../shared.css";

/** Wizard in edit mode — only reachable while the case is a DRAFT or has an
 * open correction request. Any other status opens read-only so a stale link
 * can never bypass the status machine (mirrors EditDivorceRegistration). */
export default function EditAnnulmentRegistration() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentAccountId = getCurrentAccountId();

  const canView = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_REGISTRATION_VIEW);
  const canEdit = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_REGISTRATION_EDIT);

  const [registration, setRegistration] = useState<AnnulmentRegistration | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  const load = useCallback(async () => {
    if (!id || !canView) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(undefined);
    try {
      const found = await demoGetAnnulmentRegistration(id);
      setRegistration(found);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load this annulment registration.");
      setRegistration(undefined);
    } finally {
      setLoading(false);
    }
  }, [id, canView]);

  useEffect(() => {
    load();
  }, [load]);

  if (!canView) {
    return (
      <div className="crvs-page">
        <Empty icon="lock" title="You don't have access to this annulment registration" description="Viewing an annulment registration requires annulment-registration-view access." isFullScreen />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="crvs-page">
        <Empty icon="hourglass_empty" title="Loading annulment registration…" isFullScreen />
      </div>
    );
  }

  if (error || !registration) {
    return (
      <div className="crvs-page">
        <Empty
          icon="error"
          title="Couldn't open this annulment registration"
          description={error || "This annulment registration was not found."}
          isFullScreen
          button={<Button text="Back to annulment registrations" appearance="ghost" type="button" onClick={() => navigate("/dashboard/crvs/annulment-registrations")} testId="an-edit-back" />}
        />
      </div>
    );
  }

  const editableStatus = registration.status === "DRAFT" || registration.status === "CORRECTION_REQUIRED";
  const isPreparer = !!currentAccountId && registration.officerId === currentAccountId;
  const readOnly = !canEdit || !editableStatus;

  return (
    <div className="crvs-page">
      {readOnly && (
        <div className="crvs-banner crvs-banner-warning" style={{ marginBottom: 12 }}>
          {!canEdit
            ? "You have view-only access to this case — editing an annulment registration requires annulment-registration-edit access."
            : `This case is ${ANNULMENT_REGISTRATION_STATUS_LABELS[registration.status].toLowerCase()} and can no longer be edited. Only drafts and cases with an open correction request are editable.`}
        </div>
      )}
      {!readOnly && !isPreparer && (
        <div className="crvs-banner crvs-banner-info" style={{ marginBottom: 12 }}>
          This case was prepared by {registration.officerName}. Your edits are recorded against your own account in the audit trail.
        </div>
      )}

      <AnnulmentRegistrationWizard
        registration={registration}
        onCaseChange={setRegistration}
        onExit={() => navigate("/dashboard/crvs/annulment-registrations")}
        onSubmitted={(submittedId) => navigate(`/dashboard/crvs/annulment-registrations/${submittedId}`)}
        readOnly={readOnly}
      />
    </div>
  );
}
