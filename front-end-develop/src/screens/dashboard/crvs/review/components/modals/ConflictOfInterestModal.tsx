import WarningModal from "@/components/crvs/modals/WarningModal";
import toastMessage from "@/utils/common/toastMessage";

/**
 * Proactive warning shown as soon as the workspace determines (via
 * canApproveCase/conflictOfInterestReasons) that the current registrar is
 * disqualified from approving this case — creator, personally named on it,
 * or outside their jurisdiction. This blocks the approval action, not the
 * whole page: the registrar can still review sections and request
 * corrections, they just can't be the one who approves.
 */
export default function ConflictOfInterestModal({
  show,
  onClose,
  reasons,
}: {
  show: boolean;
  onClose: () => void;
  reasons: string[];
}) {
  return (
    <WarningModal
      show={show}
      onClose={onClose}
      title="You can't approve this case"
      testId="conflict-of-interest-modal"
      primaryLabel="Request reassignment"
      onPrimary={() =>
        toastMessage("info", "Reassignment requests are handled from the Supervisor's exceptions queue.")
      }
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
