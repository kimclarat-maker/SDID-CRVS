import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Empty from "@/components/empty";
import Button from "@/components/button";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { getCurrentAccountId, hasWorkspacePermission } from "@/utils/workspace";
import { demoGetDivorceRegistration } from "@/demo/services/crvsDivorceRegistrations";
import { DivorceRegistration } from "@/domain/crvs/types";
import { DIVORCE_REGISTRATION_STATUS_LABELS } from "@/domain/crvs/statusMachines";
import DivorceRegistrationWizard from "../components/DivorceRegistrationWizard";
import "../../shared.css";

/** Wizard in edit mode — only reachable while the case is a DRAFT or has an
 * open correction request (spec §3/§18). Any other status opens read-only so
 * a stale link can never bypass the status machine. */
export default function EditDivorceRegistration() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentAccountId = getCurrentAccountId();

  const canView = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_REGISTRATION_VIEW);
  const canEdit = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_REGISTRATION_EDIT);

  const [registration, setRegistration] = useState<DivorceRegistration | undefined>();
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
      const found = await demoGetDivorceRegistration(id);
      if (!found) {
        setError("This divorce registration was not found.");
        setRegistration(undefined);
        return;
      }
      setRegistration(found);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load this divorce registration.");
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
        <Empty icon="lock" title="You don't have access to this divorce registration" description="Viewing a divorce registration requires divorce-registration-view access." isFullScreen />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="crvs-page">
        <Empty icon="hourglass_empty" title="Loading divorce registration…" isFullScreen />
      </div>
    );
  }

  if (error || !registration) {
    return (
      <div className="crvs-page">
        <Empty
          icon="error"
          title="Couldn't open this divorce registration"
          description={error || "This divorce registration was not found."}
          isFullScreen
          button={<Button text="Back to divorce registrations" appearance="ghost" type="button" onClick={() => navigate("/dashboard/crvs/divorce-registrations")} testId="dr-edit-back" />}
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
            ? "You have view-only access to this case — editing a divorce registration requires divorce-registration-edit access."
            : `This case is ${DIVORCE_REGISTRATION_STATUS_LABELS[registration.status].toLowerCase()} and can no longer be edited. Only drafts and cases with an open correction request are editable.`}
        </div>
      )}
      {!readOnly && !isPreparer && (
        <div className="crvs-banner crvs-banner-info" style={{ marginBottom: 12 }}>
          This case was prepared by {registration.officerName}. Your edits are recorded against your own account in the audit trail.
        </div>
      )}

      <DivorceRegistrationWizard
        registration={registration}
        onCaseChange={setRegistration}
        onExit={() => navigate("/dashboard/crvs/divorce-registrations")}
        onSubmitted={(submittedId) => navigate(`/dashboard/crvs/divorce-registrations/${submittedId}`)}
        readOnly={readOnly}
      />
    </div>
  );
}
