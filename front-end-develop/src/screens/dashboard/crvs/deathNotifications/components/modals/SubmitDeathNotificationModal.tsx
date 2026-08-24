import ConfirmActionModal from "@/components/crvs/modals/ConfirmActionModal";
import { DeathNotification } from "@/domain/crvs/types";
import { demoSubmitDeathNotification } from "@/demo/services/crvsDeathNotifications";
import { getCurrentActorName } from "@/utils/workspace";

export default function SubmitDeathNotificationModal({
  show,
  onClose,
  notification,
  onSubmitted,
}: {
  show: boolean;
  onClose: () => void;
  notification: DeathNotification;
  onSubmitted: (updated: DeathNotification) => void;
}) {
  return (
    <ConfirmActionModal
      show={show}
      onClose={onClose}
      title="Submit notification"
      description={notification.reference}
      confirmLabel="Submit"
      testId="submit-death-notification-modal"
      onConfirm={async () => {
        const updated = demoSubmitDeathNotification(notification.id, getCurrentActorName());
        onSubmitted(updated);
      }}
    >
      <p style={{ margin: 0 }}>
        Submitting sends this death notification to the CRVS Registration Officer queue for acceptance.
      </p>
    </ConfirmActionModal>
  );
}
