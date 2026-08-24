import { useNavigate } from "react-router-dom";
import ConfirmActionModal from "@/components/crvs/modals/ConfirmActionModal";
import { BirthNotification } from "@/domain/crvs/types";
import { childFullName } from "../NotificationWizard";

export type ConvertToRegistrationModalProps = {
  show: boolean;
  onClose: () => void;
  notification: BirthNotification;
};

/** Registration-Officer-only action (gated by the caller on
 * REGISTRATION_CONVERT and canConvertNotification()). This never creates the
 * registration draft itself — it only hands off to the birth-registration
 * wizard's "from notification" entry point, which is owned by a different
 * milestone slice. */
export default function ConvertToRegistrationModal({ show, onClose, notification }: ConvertToRegistrationModalProps) {
  const navigate = useNavigate();

  return (
    <ConfirmActionModal
      show={show}
      onClose={onClose}
      title="Convert to birth registration?"
      description="This will start a new birth-registration case pre-filled with the accepted notification's information."
      confirmLabel="Continue to registration"
      testId="convert-to-registration-modal"
      onConfirm={async () => {
        navigate(`/dashboard/crvs/births/new/from-notification/${notification.id}`);
      }}
    >
      <div className="crvs-banner crvs-banner-info" style={{ marginBottom: 12 }}>
        Child, mother, father, facility and event details will be pre-filled on the registration form for review — nothing
        is submitted automatically.
      </div>
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
