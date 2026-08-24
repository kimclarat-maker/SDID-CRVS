import Modal from "@/components/Modal";
import Button from "@/components/button";
import Icon from "@/components/icon";
import { DeathRegistrationCase } from "@/domain/crvs/types";

/** "Death certificate eligibility" modal (spec §8) — a registered death is
 * always eligible for a certificate (spec §13 definition of done); this
 * surfaces that determination and hands off to the staff-assisted
 * certificate-request flow rather than issuing anything itself (out of
 * scope for this module — see the module report's "remaining backend
 * integration points"). */
export default function DeathCertificateEligibilityModal({
  show,
  onClose,
  deathCase,
  onRequestCertificate,
}: {
  show: boolean;
  onClose: () => void;
  deathCase: DeathRegistrationCase;
  onRequestCertificate?: () => void;
}) {
  const eligible = deathCase.status === "REGISTERED";

  return (
    <Modal show={show} handleClose={onClose} title="Death certificate eligibility" description={deathCase.reference} size="sm" testId="death-certificate-eligibility-modal">
      <div style={{ padding: "0 24px 24px" }}>
        <div className={`crvs-banner ${eligible ? "crvs-banner-info" : "crvs-banner-warning"}`} style={{ alignItems: "center" }}>
          <Icon name={eligible ? "check_circle" : "hourglass_empty"} />
          <span>{eligible ? "This record is eligible for a death certificate." : "This death has not been registered yet, so no certificate can be issued."}</span>
        </div>
        <div className="crvs-wizard-actions" style={{ marginTop: 20 }}>
          <Button text="Close" appearance="ghost" onClick={onClose} testId="death-certificate-eligibility-close" />
          {eligible && onRequestCertificate && <Button text="Request certificate" appearance="primary" onClick={onRequestCertificate} testId="death-certificate-eligibility-request" />}
        </div>
      </div>
    </Modal>
  );
}
