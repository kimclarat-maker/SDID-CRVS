import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ConfirmActionModal from "@/components/crvs/modals/ConfirmActionModal";
import Checkbox from "@/components/checkbox";
import Icon from "@/components/icon";
import { DeathRegistrationCase } from "@/domain/crvs/types";
import { demoApproveDeathRegistration } from "@/demo/services/crvsDeathRegistrations";
import toastMessage from "@/utils/common/toastMessage";
import { deceasedDisplayName, maskDocumentNumber } from "../../../deathShared";

/**
 * Final, high-risk confirm step — mirrors ApproveRegistrationModal for
 * birth but adds the maker-checker "I did not prepare this case"
 * confirmation the spec requires specifically for death (§2), separate
 * from and in addition to the general "I reviewed everything" declaration.
 * Both checkboxes gate the confirm button; demoApproveDeathRegistration
 * enforces the "did not prepare" confirmation server-side too.
 */
export default function ApproveDeathRegistrationModal({
  show,
  onClose,
  deathCase,
  accountId,
  actorName,
}: {
  show: boolean;
  onClose: () => void;
  deathCase: DeathRegistrationCase | undefined;
  accountId: string;
  actorName: string;
}) {
  const [reviewedConfirmed, setReviewedConfirmed] = useState(false);
  const [didNotPrepareConfirmed, setDidNotPrepareConfirmed] = useState(false);
  const navigate = useNavigate();

  if (!deathCase) return null;

  const handleClose = () => {
    setReviewedConfirmed(false);
    setDidNotPrepareConfirmed(false);
    onClose();
  };

  const handleConfirm = async () => {
    const updated = demoApproveDeathRegistration(deathCase.id, accountId, actorName, didNotPrepareConfirmed);
    toastMessage("success", `${updated.reference} approved and registered as ${updated.officialDeathRecordNumber}.`);
    handleClose();
    navigate(`/dashboard/crvs/registered-deaths/${updated.id}`);
  };

  return (
    <ConfirmActionModal
      show={show}
      onClose={handleClose}
      onConfirm={handleConfirm}
      title="Approve death registration"
      description={deathCase.reference}
      confirmLabel="Approve & register"
      cancelLabel="Cancel"
      disabled={!reviewedConfirmed || !didNotPrepareConfirmed}
      testId="approve-death-registration-modal"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="crvs-form-grid">
          <div>
            <div style={{ fontSize: "var(--font-size-caption)", color: "var(--text-muted)" }}>Deceased</div>
            <div>{deceasedDisplayName(deathCase.deceased)}</div>
          </div>
          <div>
            <div style={{ fontSize: "var(--font-size-caption)", color: "var(--text-muted)" }}>Date of death</div>
            <div>{deathCase.dateOfDeath?.slice(0, 10)}</div>
          </div>
          <div>
            <div style={{ fontSize: "var(--font-size-caption)", color: "var(--text-muted)" }}>Declarant</div>
            <div>
              {deathCase.declarant.firstName} {deathCase.declarant.lastName} · {maskDocumentNumber(deathCase.declarant.documentNumber)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "var(--font-size-caption)", color: "var(--text-muted)" }}>Jurisdiction</div>
            <div>{deathCase.jurisdiction}</div>
          </div>
        </div>

        <div className="crvs-banner crvs-banner-info" style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
          <Icon name="verified" />
          <span>
            Approving this case creates an official CRVS death record and moves it to Registered. SDID synchronization
            (marking the linked identity deceased) happens separately after approval.
          </span>
        </div>

        <p style={{ margin: 0, fontSize: "var(--font-size-body-sm)" }}>
          By approving, I declare that I have reviewed every section of this registration and confirm the information
          is complete and accurate to the best of my knowledge as the reviewing Civil Registrar.
        </p>
        <Checkbox label="I confirm the above and want to approve this registration." checked={reviewedConfirmed} onChange={() => setReviewedConfirmed((c) => !c)} testId="approve-death-review-confirm" />

        <Checkbox
          label="I confirm that I did not prepare, declare, certify, or otherwise participate in creating this case."
          checked={didNotPrepareConfirmed}
          onChange={() => setDidNotPrepareConfirmed((c) => !c)}
          testId="approve-death-no-conflict-confirm"
        />
      </div>
    </ConfirmActionModal>
  );
}
