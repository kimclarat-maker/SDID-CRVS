import ConfirmActionModal from "@/components/crvs/modals/ConfirmActionModal";
import { BirthNotification } from "@/domain/crvs/types";
import { demoSubmitNotification } from "@/demo/services/crvsNotifications";
import { childFullName, getActorName } from "../NotificationWizard";

export type SubmitNotificationModalProps = {
  show: boolean;
  onClose: () => void;
  notification: BirthNotification;
  onSubmitted: (updated: BirthNotification) => void;
};

/** Confirms submitting a DRAFT/RETURNED notification for registration-officer
 * review. Editing becomes restricted once submitted, so this calls that out. */
export default function SubmitNotificationModal({ show, onClose, notification, onSubmitted }: SubmitNotificationModalProps) {
  return (
    <ConfirmActionModal
      show={show}
      onClose={onClose}
      title="Submit this birth notification?"
      description="Once submitted, this notification can no longer be edited unless a Registration Officer returns it for correction."
      confirmLabel="Submit notification"
      testId="submit-notification-modal"
      onConfirm={async () => {
        const updated = demoSubmitNotification(notification.id, getActorName());
        onSubmitted(updated);
      }}
    >
      <dl style={{ margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
        <div>
          <dt className="crvs-form-hint">Reference</dt>
          <dd style={{ margin: 0 }}>{notification.reference}</dd>
        </div>
        <div>
          <dt className="crvs-form-hint">Facility</dt>
          <dd style={{ margin: 0 }}>{notification.facilityName}</dd>
        </div>
        <div>
          <dt className="crvs-form-hint">Child</dt>
          <dd style={{ margin: 0 }}>{childFullName(notification.child)}</dd>
        </div>
      </dl>
    </ConfirmActionModal>
  );
}
