import Modal from "@/components/Modal";
import Button from "@/components/button";
import Icon from "@/components/icon";
import { DeathRegistrationCase } from "@/domain/crvs/types";

export default function DeathSyncSuccessModal({ show, onClose, deathCase }: { show: boolean; onClose: () => void; deathCase: DeathRegistrationCase }) {
  return (
    <Modal title="Synchronization complete" show={show} handleClose={onClose} size="sm" testId="death-sync-success-modal">
      <div style={{ padding: "0 24px 24px" }}>
        <div className="crvs-banner crvs-banner-info" style={{ alignItems: "center" }}>
          <Icon name="check_circle" styles={{ color: "var(--status-success)" }} />
          <span>The linked SDID identity has been marked deceased.</span>
        </div>
        <dl style={{ marginTop: 16 }}>
          <dt className="crvs-form-hint">Linked NIN</dt>
          <dd style={{ fontWeight: 600, marginBottom: 12 }}>{deathCase.sdid.linkedNin || "—"}</dd>
          <dt className="crvs-form-hint">Completed at</dt>
          <dd style={{ fontWeight: 600 }}>{deathCase.sdid.completedAt ? new Date(deathCase.sdid.completedAt).toLocaleString() : "—"}</dd>
        </dl>
        <p className="crvs-form-hint" style={{ marginTop: 12 }}>
          The identity, NIN, and full history are preserved — nothing was deleted or recreated.
        </p>
        <div className="crvs-wizard-actions" style={{ marginTop: 20 }}>
          <Button text="Close" appearance="primary" onClick={onClose} testId="death-sync-success-close" />
        </div>
      </div>
    </Modal>
  );
}
