import StructuredReasonModal from "@/components/crvs/modals/StructuredReasonModal";
import { DeathNotification } from "@/domain/crvs/types";
import { demoCancelDeathNotification } from "@/demo/services/crvsDeathNotifications";
import { getCurrentActorName } from "@/utils/workspace";

const REASON_OPTIONS = [
  { value: "Duplicate draft created in error", label: "Duplicate draft created in error" },
  { value: "Incorrect case", label: "Incorrect / mistaken case" },
  { value: "No longer required", label: "No longer required" },
  { value: "Other", label: "Other" },
];

export default function CancelDeathNotificationModal({
  show,
  onClose,
  notification,
  onCancelled,
}: {
  show: boolean;
  onClose: () => void;
  notification: DeathNotification;
  onCancelled: (updated: DeathNotification) => void;
}) {
  return (
    <StructuredReasonModal
      show={show}
      onClose={onClose}
      title="Cancel notification"
      description={notification.reference}
      reasonOptions={REASON_OPTIONS}
      noteLabel="Additional detail"
      requireConfirmation
      confirmationLabel="I confirm I want to cancel this death notification."
      submitLabel="Cancel notification"
      destructive
      testId="cancel-death-notification-modal"
      onSubmit={async ({ reason, note }) => {
        const updated = demoCancelDeathNotification(notification.id, note ? `${reason} — ${note}` : reason, getCurrentActorName());
        onCancelled(updated);
      }}
    />
  );
}
