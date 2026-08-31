import Modal from "@/components/Modal";
import Button from "@/components/button";
import Icon from "@/components/icon";
import { AnnulmentDivorceConflictCandidate } from "@/domain/crvs/annulmentDuplicateDetection";

/**
 * Informational conflict modal shown when this marriage already has a
 * REGISTERED divorce against it (spec §2/§10 EXISTING_DIVORCE_CONFLICT) — an
 * already-dissolved marriage cannot also be annulled. Explains the conflict
 * and offers to route the case to exception review rather than silently
 * blocking or silently allowing it through.
 */
export default function ExistingDivorceConflictModal({
  show,
  onClose,
  conflicts,
  onRouteToException,
}: {
  show: boolean;
  onClose: () => void;
  conflicts: AnnulmentDivorceConflictCandidate[];
  onRouteToException: () => void;
}) {
  return (
    <Modal show={show} handleClose={onClose} title="Existing divorce conflict" size="sm" testId="existing-divorce-conflict-modal">
      <div className="modal-body" style={{ padding: 16 }}>
        <div className="crvs-banner crvs-banner-danger" style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
          <Icon name="report" />
          <span>The marriage linked to this annulment case already has a registered divorce against it. A marriage that has already been dissolved by divorce cannot also be annulled.</span>
        </div>
        {conflicts.length > 0 && (
          <ul style={{ margin: "12px 0 0", paddingLeft: 18 }}>
            {conflicts.map((c) => (
              <li key={c.registrationId}>
                Divorce registration <strong>{c.reference}</strong>
              </li>
            ))}
          </ul>
        )}
        <p className="crvs-form-hint" style={{ marginTop: 12 }}>
          This conflict must be resolved by a supervisor before the case can proceed to approval. Route it to exception review to escalate.
        </p>
      </div>
      <div className="modal-footer" style={{ display: "flex", gap: 8, justifyContent: "flex-end", padding: 16 }}>
        <Button text="Close" appearance="ghost" type="button" onClick={onClose} testId="existing-divorce-conflict-close" />
        <Button text="Route to exception review" appearance="primary" type="button" onClick={onRouteToException} testId="existing-divorce-conflict-route" />
      </div>
    </Modal>
  );
}
