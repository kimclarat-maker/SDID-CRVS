import StructuredReasonModal from "@/components/crvs/modals/StructuredReasonModal";
import { BirthNotification } from "@/domain/crvs/types";
import { demoReturnNotification } from "@/demo/services/crvsNotifications";
import { getActorName } from "../NotificationWizard";

const RETURN_REASON_OPTIONS = [
  { value: "Missing information", label: "Missing required information" },
  { value: "Incorrect information", label: "Incorrect information provided" },
  { value: "Illegible or incomplete source document", label: "Illegible or incomplete source document" },
  { value: "Possible duplicate", label: "Possible duplicate notification" },
  { value: "Other", label: "Other" },
];

const FIELD_OPTIONS = [
  { value: "child", label: "Child details" },
  { value: "mother", label: "Mother's details" },
  { value: "father", label: "Father's details" },
  { value: "birth_source", label: "Birth source / occurrence details" },
  { value: "facility", label: "Facility / notifier information" },
];

export type ReturnNotificationModalProps = {
  show: boolean;
  onClose: () => void;
  notification: BirthNotification;
  onReturned: (updated: BirthNotification) => void;
};

/** Registration-Officer-only action (gated by the caller on
 * BIRTH_NOTIFICATION_RETURN) — sends a SUBMITTED notification back to the
 * Notification Officer with structured correction feedback. */
export default function ReturnNotificationModal({ show, onClose, notification, onReturned }: ReturnNotificationModalProps) {
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
      testId="return-notification-modal"
      onSubmit={async ({ reason, fields, note }) => {
        const updated = demoReturnNotification(notification.id, { reason, fields, note }, getActorName());
        onReturned(updated);
      }}
    />
  );
}
