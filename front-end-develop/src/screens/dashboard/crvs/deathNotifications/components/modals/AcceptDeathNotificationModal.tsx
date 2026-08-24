import ConfirmActionModal from "@/components/crvs/modals/ConfirmActionModal";
import { DeathNotification } from "@/domain/crvs/types";
import { demoAcceptDeathNotification } from "@/demo/services/crvsDeathNotifications";
import { getCurrentActorName } from "@/utils/workspace";

export default function AcceptDeathNotificationModal({
  show,
  onClose,
  notification,
  onAccepted,
}: {
  show: boolean;
  onClose: () => void;
  notification: DeathNotification;
  onAccepted: (updated: DeathNotification) => void;
}) {
  return (
    <ConfirmActionModal
      show={show}
      onClose={onClose}
      title="Accept notification"
      description={notification.reference}
      confirmLabel="Accept"
      testId="accept-death-notification-modal"
      onConfirm={async () => {
        const updated = demoAcceptDeathNotification(notification.id, getCurrentActorName());
        onAccepted(updated);
      }}
    >
      <p style={{ margin: 0 }}>Accepting this notification makes it eligible for conversion into a death registration case.</p>
    </ConfirmActionModal>
  );
}
