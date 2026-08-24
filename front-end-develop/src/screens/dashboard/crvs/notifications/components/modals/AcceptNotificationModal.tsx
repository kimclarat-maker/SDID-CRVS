import ConfirmActionModal from "@/components/crvs/modals/ConfirmActionModal";
import { BirthNotification } from "@/domain/crvs/types";
import { demoAcceptNotification } from "@/demo/services/crvsNotifications";
import { childFullName, getActorName } from "../NotificationWizard";

export type AcceptNotificationModalProps = {
  show: boolean;
  onClose: () => void;
  notification: BirthNotification;
  onAccepted: (updated: BirthNotification) => void;
};

/** Registration-Officer-only action (gated by the caller on
 * BIRTH_NOTIFICATION_ACCEPT) — accepts a SUBMITTED notification, making it
 * eligible for conversion into a birth-registration case. */
export default function AcceptNotificationModal({ show, onClose, notification, onAccepted }: AcceptNotificationModalProps) {
  return (
    <ConfirmActionModal
      show={show}
      onClose={onClose}
      title="Accept this birth notification?"
      description="Accepting confirms the notification is complete and ready to be converted into a registration case."
      confirmLabel="Accept notification"
      testId="accept-notification-modal"
      onConfirm={async () => {
        const updated = demoAcceptNotification(notification.id, getActorName());
        onAccepted(updated);
      }}
    >
      <dl style={{ margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
        <div>
          <dt className="crvs-form-hint">Reference</dt>
          <dd style={{ margin: 0 }}>{notification.reference}</dd>
        </div>
        <div>
          <dt className="crvs-form-hint">Child</dt>
          <dd style={{ margin: 0 }}>{childFullName(notification.child)}</dd>
        </div>
        <div>
          <dt className="crvs-form-hint">Facility</dt>
          <dd style={{ margin: 0 }}>{notification.facilityName}</dd>
        </div>
      </dl>
    </ConfirmActionModal>
  );
}
