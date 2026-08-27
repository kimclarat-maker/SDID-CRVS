import ConfirmActionModal from "@/components/crvs/modals/ConfirmActionModal";
import WarningModal from "@/components/crvs/modals/WarningModal";
import toastMessage from "@/utils/common/toastMessage";
import { DivorceRegistration } from "@/domain/crvs/types";
import { formerSpousesLabel } from "../../../divorceShared";

export function StartDivorceReviewModal({
  show,
  onClose,
  registration,
  onConfirm,
}: {
  show: boolean;
  onClose: () => void;
  registration: DivorceRegistration | undefined;
  onConfirm: () => Promise<void>;
}) {
  if (!registration) return null;
  return (
    <ConfirmActionModal show={show} onClose={onClose} onConfirm={onConfirm} title="Start review" description={registration.reference} confirmLabel="Start review" testId="start-divorce-review-modal">
      <p style={{ margin: 0 }}>
        You&apos;re about to start reviewing <strong>{registration.reference}</strong> ({formerSpousesLabel(registration)}).
      </p>
      <p style={{ margin: "8px 0 0", color: "var(--text-secondary)", fontSize: "var(--font-size-body-sm)" }}>
        {registration.reviewerId ? `Currently assigned to ${registration.reviewerName || "another registrar"}.` : "This registration is not currently assigned to anyone."}
      </p>
      <div className="crvs-banner crvs-banner-info" style={{ marginTop: 12 }}>
        Starting review assigns this case to you and locks it, so no other registrar can review it at the same time.
      </div>
    </ConfirmActionModal>
  );
}

export function ActiveDivorceReviewConflictModal({ show, onClose, registration }: { show: boolean; onClose: () => void; registration: DivorceRegistration | undefined }) {
  return (
    <WarningModal
      show={show}
      onClose={onClose}
      title="This registration is already being reviewed"
      testId="active-divorce-review-conflict-modal"
      primaryLabel="Request reassignment"
      onPrimary={() => toastMessage("info", "Reassignment requests are handled from the Supervisor's divorce exceptions queue.")}
    >
      <p style={{ margin: 0 }}>
        {registration ? (
          <>
            <strong>{registration.reference}</strong> is currently locked to <strong>{registration.reviewerName || "another registrar"}</strong>. You can&apos;t start a review on it until they finish or it
            is reassigned.
          </>
        ) : (
          "This registration is currently locked to another registrar."
        )}
      </p>
    </WarningModal>
  );
}

export function DivorceConflictOfInterestModal({ show, onClose, reasons }: { show: boolean; onClose: () => void; reasons: string[] }) {
  return (
    <WarningModal
      show={show}
      onClose={onClose}
      title="You can't approve this registration"
      testId="divorce-conflict-of-interest-modal"
      primaryLabel="Request reassignment"
      onPrimary={() => toastMessage("info", "Reassignment requests are handled from the Supervisor's divorce exceptions queue.")}
    >
      <p style={{ margin: "0 0 8px" }}>You may still review sections and request corrections, but approval is blocked for this reason:</p>
      <ul style={{ margin: 0, paddingLeft: 20 }}>
        {reasons.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
    </WarningModal>
  );
}
