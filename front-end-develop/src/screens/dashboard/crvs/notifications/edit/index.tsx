import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Empty from "@/components/empty";
import Button from "@/components/button";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { hasWorkspacePermission } from "@/utils/workspace";
import { demoGetNotification } from "@/demo/services/crvsNotifications";
import { BirthNotification } from "@/domain/crvs/types";
import NotificationWizard from "../components/NotificationWizard";
import "../../shared.css";

/** Hosts the notification wizard in edit mode for a DRAFT or RETURNED
 * notification, reached at /dashboard/crvs/notifications/:notificationId/edit. */
export default function EditNotification() {
  const navigate = useNavigate();
  const { notificationId } = useParams<{ notificationId: string }>();
  const allowed = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.BIRTH_NOTIFICATION_EDIT);

  const [notification, setNotification] = useState<BirthNotification | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (!notificationId || !allowed) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    demoGetNotification(notificationId)
      .then((result) => {
        if (cancelled) return;
        setNotification(result);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.message || "Couldn't load this notification.");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [notificationId, allowed]);

  if (!allowed) {
    return (
      <div className="crvs-page">
        <Empty
          icon="lock"
          title="You don't have access to this action"
          description="Editing birth notifications requires the Birth Notification Officer role."
          button={<Button text="Back to notifications" appearance="ghost" onClick={() => navigate("/dashboard/crvs/notifications")} testId="edit-notification-back" />}
        />
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

  if (error || !notification) {
    return (
      <div className="crvs-page">
        <Empty
          icon="error"
          title="Notification not found"
          description={error || "This birth notification doesn't exist or has been removed."}
          button={<Button text="Back to notifications" appearance="ghost" onClick={() => navigate("/dashboard/crvs/notifications")} testId="edit-notification-not-found-back" />}
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
          description="Only draft or returned notifications can be edited."
          button={<Button text="View notification" appearance="ghost" onClick={() => navigate(`/dashboard/crvs/notifications/${notification.id}`)} testId="edit-notification-view-instead" />}
        />
      </div>
    );
  }

  const handleDone = (updated?: BirthNotification) => {
    if (updated?.status === "SUBMITTED") {
      navigate(`/dashboard/crvs/notifications/${updated.id}`);
    } else if (updated) {
      navigate(`/dashboard/crvs/notifications/${updated.id}`);
    } else {
      navigate("/dashboard/crvs/notifications");
    }
  };

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">Edit birth notification</h1>
        <p className="crvs-page-subtitle">{notification.reference}</p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <NotificationWizard mode="edit" notification={notification} onDone={handleDone} />
    </div>
  );
}
