import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Empty from "@/components/empty";
import Button from "@/components/button";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { hasWorkspacePermission, getCurrentActorName } from "@/utils/workspace";
import DeathNotificationForm, { DeathNotificationFormValue } from "../components/DeathNotificationForm";
import SubmitDeathNotificationModal from "../components/modals/SubmitDeathNotificationModal";
import { demoGetDeathNotification, demoUpdateDeathNotificationDraft } from "@/demo/services/crvsDeathNotifications";
import { DeathNotification } from "@/domain/crvs/types";
import toastMessage from "@/utils/common/toastMessage";
import "../../shared.css";

export default function EditDeathNotification() {
  const navigate = useNavigate();
  const { notificationId } = useParams<{ notificationId: string }>();
  const actorName = getCurrentActorName();

  const canEdit = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DEATH_NOTIFICATION_EDIT);

  const [notification, setNotification] = useState<DeathNotification | undefined>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSubmit, setShowSubmit] = useState(false);

  useEffect(() => {
    if (!notificationId || !canEdit) {
      setLoading(false);
      return;
    }
    demoGetDeathNotification(notificationId)
      .then(setNotification)
      .finally(() => setLoading(false));
  }, [notificationId, canEdit]);

  if (!canEdit) {
    return (
      <div className="crvs-page">
        <Empty icon="lock" title="You don't have access to this action" description="Editing death notifications requires notification-edit access." />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="crvs-page">
        <p className="crvs-form-hint">Loading notification…</p>
      </div>
    );
  }

  if (!notification) {
    return (
      <div className="crvs-page">
        <Empty
          icon="error"
          title="Notification not found"
          button={<Button text="Back to death notifications" appearance="ghost" onClick={() => navigate("/dashboard/crvs/death-notifications")} testId="dn-edit-not-found-back" />}
        />
      </div>
    );
  }

  if (notification.status !== "DRAFT" && notification.status !== "RETURNED") {
    return (
      <div className="crvs-page">
        <Empty
          icon="lock"
          title="This notification can no longer be edited"
          description={`Current status: ${notification.status}.`}
          button={<Button text="View notification" appearance="ghost" onClick={() => navigate(`/dashboard/crvs/death-notifications/${notification.id}`)} testId="dn-edit-view-instead" />}
        />
      </div>
    );
  }

  const persist = (value: DeathNotificationFormValue) => {
    setSaving(true);
    try {
      const updated = demoUpdateDeathNotificationDraft(notification.id, value, actorName, notification.version);
      setNotification(updated);
      toastMessage("success", "Changes saved.");
      return updated;
    } catch (err) {
      toastMessage("error", err);
      return undefined;
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">{notification.status === "RETURNED" ? "Respond to correction" : "Edit death notification"}</h1>
        <p className="crvs-page-subtitle">{notification.reference}</p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      {notification.status === "RETURNED" && notification.returnReason && (
        <div className="crvs-banner crvs-banner-warning">
          <strong>Correction requested:</strong> {notification.returnReason.reason}
          {notification.returnReason.note ? ` — ${notification.returnReason.note}` : ""}
        </div>
      )}

      <DeathNotificationForm
        initial={notification}
        saving={saving}
        onSaveDraft={persist}
        onSubmit={(value) => {
          if (persist(value)) setShowSubmit(true);
        }}
      />

      <SubmitDeathNotificationModal
        show={showSubmit}
        onClose={() => setShowSubmit(false)}
        notification={notification}
        onSubmitted={(updated) => {
          setShowSubmit(false);
          navigate(`/dashboard/crvs/death-notifications/${updated.id}`);
        }}
      />
    </div>
  );
}
