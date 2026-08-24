import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ConfirmActionModal from "@/components/crvs/modals/ConfirmActionModal";
import Checkbox from "@/components/checkbox";
import Icon from "@/components/icon";
import { BirthRegistrationCase } from "@/domain/crvs/types";
import { demoApproveRegistration } from "@/demo/services/crvsRegistrations";
import toastMessage from "@/utils/common/toastMessage";
import { fullName, maskId } from "../../utils";

/**
 * Final, high-risk confirm step — only reachable after ApprovalChecklistModal
 * passes. Framed as a positive/official action (not a red "danger" dialog):
 * approving a birth registration creates an official CRVS record, it's not
 * a destructive operation, so this deliberately does not use `destructive`
 * styling even though it is irreversible via this screen.
 *
 * The final-confirmation checkbox is managed as local state here (per spec)
 * and gates ConfirmActionModal's `disabled` prop — the primitive itself has
 * no concept of a required checkbox.
 */
export default function ApproveRegistrationModal({
  show,
  onClose,
  registrationCase,
  accountId,
  actorName,
}: {
  show: boolean;
  onClose: () => void;
  registrationCase: BirthRegistrationCase | undefined;
  accountId: string;
  actorName: string;
}) {
  const [confirmed, setConfirmed] = useState(false);
  const navigate = useNavigate();

  if (!registrationCase) return null;

  const handleClose = () => {
    setConfirmed(false);
    onClose();
  };

  const handleConfirm = async () => {
    const updated = demoApproveRegistration(registrationCase.id, accountId, actorName);
    toastMessage("success", `${updated.reference} approved and registered as ${updated.officialBirthRecordNumber}.`);
    setConfirmed(false);
    navigate(`/dashboard/crvs/registered-births/${updated.id}`);
  };

  return (
    <ConfirmActionModal
      show={show}
      onClose={handleClose}
      onConfirm={handleConfirm}
      title="Approve registration"
      description={registrationCase.reference}
      confirmLabel="Approve & register"
      cancelLabel="Cancel"
      disabled={!confirmed}
      testId="approve-registration-modal"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="crvs-form-grid">
          <div>
            <div style={{ fontSize: "var(--font-size-caption)", color: "var(--text-muted)" }}>Child</div>
            <div>{fullName(registrationCase.child.firstName, registrationCase.child.middleName, registrationCase.child.lastName)}</div>
          </div>
          <div>
            <div style={{ fontSize: "var(--font-size-caption)", color: "var(--text-muted)" }}>Date of birth</div>
            <div>{registrationCase.child.dateOfBirth}</div>
          </div>
          <div>
            <div style={{ fontSize: "var(--font-size-caption)", color: "var(--text-muted)" }}>Mother</div>
            <div>
              {fullName(registrationCase.mother.firstName, undefined, registrationCase.mother.lastName)} ·{" "}
              {maskId(registrationCase.mother.documentNumber)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "var(--font-size-caption)", color: "var(--text-muted)" }}>Jurisdiction</div>
            <div>{registrationCase.jurisdiction}</div>
          </div>
        </div>

        <div className="crvs-banner crvs-banner-info" style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
          <Icon name="verified" />
          <span>
            Approving this case creates an official CRVS birth record and moves it to Registered. SDID identity
            synchronization will begin separately after approval — it is not part of this action.
          </span>
        </div>

        <p style={{ margin: 0, fontSize: "var(--font-size-body-sm)" }}>
          By approving, I declare that I have reviewed every section of this registration and confirm the
          information is complete and accurate to the best of my knowledge as the reviewing Civil Registrar.
        </p>

        <Checkbox
          label="I confirm the above and want to approve this registration."
          checked={confirmed}
          onChange={() => setConfirmed((c) => !c)}
          testId="approve-registration-confirm-checkbox"
        />
      </div>
    </ConfirmActionModal>
  );
}
