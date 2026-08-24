import StructuredReasonModal from "@/components/crvs/modals/StructuredReasonModal";
import { BirthNotification } from "@/domain/crvs/types";
import { demoCancelNotification } from "@/demo/services/crvsNotifications";
import { getActorName } from "../NotificationWizard";

const CANCEL_REASON_OPTIONS = [
  { value: "Duplicate draft", label: "Duplicate draft created in error" },
  { value: "Entered in error", label: "Notification entered in error" },
  { value: "Notifier requested withdrawal", label: "Notifier requested withdrawal" },
  { value: "Other", label: "Other" },
];

export type CancelNotificationModalProps = {
  show: boolean;
  onClose: () => void;
  notification: BirthNotification;
  onCancelled: (updated: BirthNotification) => void;
};

/** Draft-only action — the notification status machine only allows
 * DRAFT -> CANCELLED, so this is never offered for a RETURNED notification. */
export default function CancelNotificationModal({ show, onClose, notification, onCancelled }: CancelNotificationModalProps) {
  return (
    <StructuredReasonModal
      show={show}
      onClose={onClose}
      title="Cancel this draft notification?"
      description={`"${notification.reference}" will be marked cancelled and can no longer be submitted.`}
      reasonOptions={CANCEL_REASON_OPTIONS}
      noteLabel="Additional details"
      noteRequired={false}
      requireConfirmation
      confirmationLabel="I confirm this notification should be cancelled."
      submitLabel="Cancel notification"
      destructive
      testId="cancel-notification-modal"
      onSubmit={async ({ reason, note }) => {
        const combined = note ? `${reason}: ${note}` : reason;
        const updated = demoCancelNotification(notification.id, combined, getActorName());
        onCancelled(updated);
      }}
    />
  );
}
