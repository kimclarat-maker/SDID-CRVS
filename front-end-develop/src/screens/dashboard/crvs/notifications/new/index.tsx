import { useNavigate } from "react-router-dom";
import Empty from "@/components/empty";
import Button from "@/components/button";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { hasWorkspacePermission } from "@/utils/workspace";
import NotificationWizard from "../components/NotificationWizard";
import { BirthNotification } from "@/domain/crvs/types";
import "../../shared.css";

/** Hosts the notification wizard in create mode. */
export default function NewNotification() {
  const navigate = useNavigate();
  const allowed = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.BIRTH_NOTIFICATION_CREATE);

  if (!allowed) {
    return (
      <div className="crvs-page">
        <Empty
          icon="lock"
          title="You don't have access to this action"
          description="Creating birth notifications requires the Birth Notification Officer role."
          button={<Button text="Back to notifications" appearance="ghost" onClick={() => navigate("/dashboard/crvs/notifications")} testId="new-notification-back" />}
        />
      </div>
    );
  }

  const handleDone = (notification?: BirthNotification) => {
    if (notification?.status === "SUBMITTED") {
      navigate(`/dashboard/crvs/notifications/${notification.id}`);
    } else if (notification) {
      navigate("/dashboard/crvs/notifications/drafts");
    } else {
      navigate("/dashboard/crvs/notifications");
    }
  };

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">New birth notification</h1>
        <p className="crvs-page-subtitle">Notify a birth for {`your assigned facility`}.</p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <NotificationWizard mode="create" onDone={handleDone} />
    </div>
  );
}
