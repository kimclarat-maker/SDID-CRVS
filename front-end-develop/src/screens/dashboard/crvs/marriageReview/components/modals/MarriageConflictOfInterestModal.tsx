import WarningModal from "@/components/crvs/modals/WarningModal";
import toastMessage from "@/utils/common/toastMessage";

export default function MarriageConflictOfInterestModal({ show, onClose, reasons }: { show: boolean; onClose: () => void; reasons: string[] }) {
  return (
    <WarningModal
      show={show}
      onClose={onClose}
      title="You can't approve this application"
      testId="marriage-conflict-of-interest-modal"
      primaryLabel="Request reassignment"
      onPrimary={() => toastMessage("info", "Reassignment requests are handled from the Supervisor's marriage exceptions queue.")}
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
