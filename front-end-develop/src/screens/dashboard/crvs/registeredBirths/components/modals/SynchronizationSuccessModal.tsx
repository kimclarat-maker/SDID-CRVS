import Modal from "@/components/Modal";
import Button from "@/components/button";
import Icon from "@/components/icon";
import { BirthRegistrationCase } from "@/domain/crvs/types";

/** Success confirmation shown right after a retry resolves to
 * IDENTITY_CREATED. There is no shared SuccessModal primitive in this
 * codebase (see components/crvs/modals/* in the spec) — this is a small,
 * self-contained modal built on the base Modal component instead. */
export default function SynchronizationSuccessModal({
  show,
  onClose,
  registrationCase,
}: {
  show: boolean;
  onClose: () => void;
  registrationCase: BirthRegistrationCase;
}) {
  return (
    <Modal title="Synchronization complete" show={show} handleClose={onClose} size="sm">
      <div style={{ padding: "0 24px 24px" }}>
        <div className="crvs-banner crvs-banner-info" style={{ alignItems: "center" }}>
          <Icon name="check_circle" styles={{ color: "var(--status-success)" }} />
          <span>A foundational identity has been created for this birth record.</span>
        </div>

        <dl style={{ marginTop: 16 }}>
          <dt className="crvs-form-hint">Fictional NIN</dt>
          <dd style={{ fontWeight: 600, marginBottom: 12 }}>{registrationCase.sdid.fictionalNin || "—"}</dd>
          <dt className="crvs-form-hint">Completed at</dt>
          <dd style={{ fontWeight: 600 }}>
            {registrationCase.sdid.completedAt ? new Date(registrationCase.sdid.completedAt).toLocaleString() : "—"}
          </dd>
        </dl>

        <div className="crvs-wizard-actions" style={{ marginTop: 20 }}>
          <Button text="View identity-link summary" appearance="primary" onClick={onClose} testId="sync-success-close" />
        </div>
      </div>
    </Modal>
  );
}
