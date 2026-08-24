import StructuredReasonModal from "@/components/crvs/modals/StructuredReasonModal";
import { DeathNotification } from "@/domain/crvs/types";
import { demoReturnDeathNotification } from "@/demo/services/crvsDeathNotifications";
import { getCurrentActorName } from "@/utils/workspace";

const RETURN_REASON_OPTIONS = [
  { value: "Missing information", label: "Missing required information" },
  { value: "Incorrect information", label: "Incorrect information provided" },
  { value: "Missing medical certification", label: "Missing medical certification" },
  { value: "Possible duplicate", label: "Possible duplicate notification" },
  { value: "Other", label: "Other" },
];

const FIELD_OPTIONS = [
  { value: "deceased", label: "Deceased details" },
  { value: "occurrence", label: "Occurrence details" },
  { value: "medical", label: "Medical certification" },
  { value: "facility", label: "Facility / notifier information" },
];

export default function ReturnDeathNotificationModal({
  show,
  onClose,
  notification,
  onReturned,
}: {
  show: boolean;
  onClose: () => void;
  notification: DeathNotification;
  onReturned: (updated: DeathNotification) => void;
}) {
  return (
    <StructuredReasonModal
      show={show}
      onClose={onClose}
      title="Return for correction"
      description={`"${notification.reference}" will go back to the notifier as RETURNED so they can fix and resubmit it.`}
      reasonOptions={RETURN_REASON_OPTIONS}
      fieldOptions={FIELD_OPTIONS}
      fieldsLabel="Which sections need correction?"
      noteLabel="Notes for the notifier"
      noteRequired
      requireConfirmation
      confirmationLabel="I confirm the notifier will be notified of this return."
      submitLabel="Return notification"
      destructive
      testId="return-death-notification-modal"
      onSubmit={async ({ reason, fields, note }) => {
        const updated = demoReturnDeathNotification(notification.id, { reason, fields, note }, getCurrentActorName());
        onReturned(updated);
      }}
    />
  );
}
