import Modal from "@/components/Modal";
import Button from "@/components/button";
import Icon from "@/components/icon";

/**
 * Informational conflict modal shown when the linked marriage carries a
 * demo-only correction-pending marker (spec §2/§10
 * MARRIAGE_CORRECTION_IN_PROGRESS — this application does not implement
 * post-registration Marriage Correction as its own workflow; see the
 * scope-boundary note in annulmentPolicyConfig.ts). Explains the conflict
 * and offers to route to exception review.
 */
export default function MarriageCorrectionConflictModal({
  show,
  onClose,
  onRouteToException,
}: {
  show: boolean;
  onClose: () => void;
  onRouteToException: () => void;
}) {
  return (
    <Modal show={show} handleClose={onClose} title="Marriage correction in progress" size="sm" testId="marriage-correction-conflict-modal">
      <div className="modal-body" style={{ padding: 16 }}>
        <div className="crvs-banner crvs-banner-warning" style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
          <Icon name="edit" />
          <span>The marriage linked to this annulment case has a correction pending against it. Registering an annulment against a marriage record that is mid-correction risks acting on data that is
          about to change.</span>
        </div>
        <p className="crvs-form-hint" style={{ marginTop: 12 }}>
          Route this case to exception review so a supervisor can confirm the marriage record is stable before this annulment proceeds.
        </p>
      </div>
      <div className="modal-footer" style={{ display: "flex", gap: 8, justifyContent: "flex-end", padding: 16 }}>
        <Button text="Close" appearance="ghost" type="button" onClick={onClose} testId="marriage-correction-conflict-close" />
        <Button text="Route to exception review" appearance="primary" type="button" onClick={onRouteToException} testId="marriage-correction-conflict-route" />
      </div>
    </Modal>
  );
}
