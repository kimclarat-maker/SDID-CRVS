import WarningModal from "@/components/crvs/modals/WarningModal";
import toastMessage from "@/utils/common/toastMessage";

/** Shown when canApproveAnnulmentCase() returns allowed: false (spec §5/§18/
 * §22) — lists every specific blocking reason (conflict of interest,
 * jurisdiction, open correction/evidence request, open exception, unconfirmed
 * legal-effect classification) rather than a generic "can't approve" error. */
export default function MakerCheckerBlockedModal({ show, onClose, reasons }: { show: boolean; onClose: () => void; reasons: string[] }) {
  return (
    <WarningModal
      show={show}
      onClose={onClose}
      title="You can't approve this registration"
      testId="annulment-maker-checker-blocked-modal"
      primaryLabel="Request reassignment"
      onPrimary={() => toastMessage("info", "Reassignment requests are handled from the Supervisor's annulment exceptions queue.")}
    >
      <p style={{ margin: "0 0 8px" }}>Approval is blocked until every one of these is resolved:</p>
      <ul style={{ margin: 0, paddingLeft: 20 }}>
        {reasons.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
    </WarningModal>
  );
}
