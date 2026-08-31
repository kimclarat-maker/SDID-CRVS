import WarningModal from "@/components/crvs/modals/WarningModal";
import toastMessage from "@/utils/common/toastMessage";

/** Shown automatically the first time a reviewer opens a case they have a
 * conflict of interest in (spec §5/§17/§22) — they may still preview
 * sections, but approval will be blocked. Distinct from
 * MakerCheckerBlockedModal, which is surfaced from the Approve action itself
 * and lists the FULL canApproveAnnulmentCase() gate (conflict of interest +
 * jurisdiction + open correction/exception + unconfirmed legal effect). */
export default function ConflictOfInterestBlockedModal({ show, onClose, reasons }: { show: boolean; onClose: () => void; reasons: string[] }) {
  return (
    <WarningModal
      show={show}
      onClose={onClose}
      title="You have a conflict of interest on this case"
      testId="annulment-conflict-of-interest-modal"
      primaryLabel="Request reassignment"
      onPrimary={() => toastMessage("info", "Reassignment requests are handled from the Supervisor's annulment exceptions queue.")}
    >
      <p style={{ margin: "0 0 8px" }}>You may still review sections and request corrections, but approval will be blocked for this reason:</p>
      <ul style={{ margin: 0, paddingLeft: 20 }}>
        {reasons.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
    </WarningModal>
  );
}
