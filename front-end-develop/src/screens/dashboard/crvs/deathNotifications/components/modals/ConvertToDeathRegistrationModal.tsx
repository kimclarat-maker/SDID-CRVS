import { useNavigate } from "react-router-dom";
import ConfirmActionModal from "@/components/crvs/modals/ConfirmActionModal";
import { DeathNotification } from "@/domain/crvs/types";
import { deceasedDisplayName } from "../../../deathShared";

/** Hands off to the death-registration wizard's "from notification" entry
 * point — never creates the registration draft itself, mirroring
 * ConvertToRegistrationModal for birth. */
export default function ConvertToDeathRegistrationModal({
  show,
  onClose,
  notification,
}: {
  show: boolean;
  onClose: () => void;
  notification: DeathNotification;
}) {
  const navigate = useNavigate();

  return (
    <ConfirmActionModal
      show={show}
      onClose={onClose}
      title="Convert to death registration?"
      description="This will start a new death-registration case pre-filled with the accepted notification's information."
      confirmLabel="Continue to registration"
      testId="convert-to-death-registration-modal"
      onConfirm={async () => {
        navigate(`/dashboard/crvs/death-registrations/new?fromNotification=${notification.id}`);
      }}
    >
      <div className="crvs-banner crvs-banner-info" style={{ marginBottom: 12 }}>
        Deceased, occurrence, and medical certification details will be pre-filled on the registration form for
        review — nothing is submitted automatically.
      </div>
      <dl style={{ margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
        <div>
          <dt className="crvs-form-hint">Reference</dt>
          <dd style={{ margin: 0 }}>{notification.reference}</dd>
        </div>
        <div>
          <dt className="crvs-form-hint">Deceased</dt>
          <dd style={{ margin: 0 }}>{deceasedDisplayName(notification.deceased)}</dd>
        </div>
        <div>
          <dt className="crvs-form-hint">Facility</dt>
          <dd style={{ margin: 0 }}>{notification.facilityName || "—"}</dd>
        </div>
      </dl>
    </ConfirmActionModal>
  );
}
