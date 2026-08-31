import Modal from "@/components/Modal";
import Button from "@/components/button";
import Icon from "@/components/icon";

/**
 * Informational conflict modal shown when the linked marriage carries a
 * demo-only judicial-separation marker (spec §2/§10
 * EXISTING_JUDICIAL_SEPARATION_CONFLICT — this application does not
 * implement Judicial Separation as its own workflow; see the scope-boundary
 * note in annulmentPolicyConfig.ts). Explains the conflict and offers to
 * route to exception review.
 */
export default function ExistingJudicialSeparationConflictModal({
  show,
  onClose,
  onRouteToException,
}: {
  show: boolean;
  onClose: () => void;
  onRouteToException: () => void;
}) {
  return (
    <Modal show={show} handleClose={onClose} title="Existing judicial-separation conflict" size="sm" testId="existing-judicial-separation-conflict-modal">
      <div className="modal-body" style={{ padding: 16 }}>
        <div className="crvs-banner crvs-banner-warning" style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
          <Icon name="report" />
          <span>The marriage linked to this annulment case is recorded as judicially separated. This application does not manage judicial separation as its own workflow, so a staff member must review this
          conflict directly before the case can proceed.</span>
        </div>
        <p className="crvs-form-hint" style={{ marginTop: 12 }}>
          Route this case to exception review so a supervisor can confirm whether the judicial separation affects eligibility for annulment.
        </p>
      </div>
      <div className="modal-footer" style={{ display: "flex", gap: 8, justifyContent: "flex-end", padding: 16 }}>
        <Button text="Close" appearance="ghost" type="button" onClick={onClose} testId="existing-judicial-separation-conflict-close" />
        <Button text="Route to exception review" appearance="primary" type="button" onClick={onRouteToException} testId="existing-judicial-separation-conflict-route" />
      </div>
    </Modal>
  );
}
