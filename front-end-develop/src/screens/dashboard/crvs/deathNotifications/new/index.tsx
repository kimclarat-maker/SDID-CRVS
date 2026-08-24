import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Empty from "@/components/empty";
import Button from "@/components/button";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { hasWorkspacePermission, getCurrentAccountId, getCurrentActorName } from "@/utils/workspace";
import DeathNotificationForm, { DeathNotificationFormValue } from "../components/DeathNotificationForm";
import ConfirmActionModal from "@/components/crvs/modals/ConfirmActionModal";
import { demoCreateDeathNotificationDraft, demoSubmitDeathNotification, demoUpdateDeathNotificationDraft } from "@/demo/services/crvsDeathNotifications";
import { DeathNotification } from "@/domain/crvs/types";
import toastMessage from "@/utils/common/toastMessage";
import "../../shared.css";

export default function NewDeathNotification() {
  const navigate = useNavigate();
  const allowed = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DEATH_NOTIFICATION_CREATE);
  const actorId = getCurrentAccountId() || "unknown";
  const actorName = getCurrentActorName();

  const [draft, setDraft] = useState<DeathNotification | undefined>();
  const [saving, setSaving] = useState(false);
  const [showSubmit, setShowSubmit] = useState(false);

  if (!allowed) {
    return (
      <div className="crvs-page">
        <Empty
          icon="lock"
          title="You don't have access to this action"
          description="Creating death notifications requires the Death Notification Officer role."
          button={<Button text="Back to death notifications" appearance="ghost" onClick={() => navigate("/dashboard/crvs/death-notifications")} testId="new-death-notification-back" />}
        />
      </div>
    );
  }

  const persistDraft = (value: DeathNotificationFormValue) => {
    setSaving(true);
    try {
      const saved = draft
        ? demoUpdateDeathNotificationDraft(draft.id, value, actorName)
        : demoCreateDeathNotificationDraft(value, actorId, actorName);
      setDraft(saved);
      toastMessage("success", "Draft saved.");
      return saved;
    } catch (err) {
      toastMessage("error", err);
      return undefined;
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitRequest = (value: DeathNotificationFormValue) => {
    const saved = persistDraft(value);
    if (!saved) return;
    setShowSubmit(true);
  };

  const handleConfirmSubmit = async () => {
    if (!draft) return;
    const updated = demoSubmitDeathNotification(draft.id, actorName);
    toastMessage("success", `${updated.reference} submitted.`);
    navigate(`/dashboard/crvs/death-notifications/${updated.id}`);
  };

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">New death notification</h1>
        <p className="crvs-page-subtitle">Notify a death for registration processing.</p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <DeathNotificationForm
        initial={draft}
        saving={saving}
        onSaveDraft={(value) => persistDraft(value)}
        onSubmit={handleSubmitRequest}
      />

      <ConfirmActionModal
        show={showSubmit}
        onClose={() => setShowSubmit(false)}
        onConfirm={handleConfirmSubmit}
        title="Submit notification"
        description={draft?.reference}
        confirmLabel="Submit"
        cancelLabel="Keep editing"
        testId="submit-death-notification-modal"
      >
        <p style={{ margin: 0 }}>
          Submitting sends this notification to the CRVS Registration Officer queue for acceptance. You can still
          make changes if it is returned for correction.
        </p>
      </ConfirmActionModal>
    </div>
  );
}
