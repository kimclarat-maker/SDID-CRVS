import { useState } from "react";
import Modal from "@/components/Modal";
import Button from "@/components/button";
import Icon from "@/components/icon";
import { MarriageApplication } from "@/domain/crvs/types";
import { demoCheckMarriageCertificateEligibility } from "@/demo/services/crvsMarriageCertificateEligibility";
import toastMessage from "@/utils/common/toastMessage";

/** "Marriage certificate eligibility" modal — runs the pure eligibility
 * engine (assessMarriageCertificateEligibility, via the thin service
 * wrapper) and displays the resulting status + reasons. Mirrors
 * DeathCertificateEligibilityModal's in-place banner pattern rather than
 * nesting a second Modal for the result. Requesting a certificate hands off
 * to the honest "not yet wired" notice — see the module report's remaining
 * backend-integration points — instead of faking a working request flow. */
export default function MarriageCertificateEligibilityModal({
  show,
  onClose,
  application,
  actorName,
  onChecked,
  onRequestCertificate,
}: {
  show: boolean;
  onClose: () => void;
  application: MarriageApplication;
  actorName: string;
  onChecked: (updated: MarriageApplication) => void;
  onRequestCertificate?: () => void;
}) {
  const [checking, setChecking] = useState(false);
  const eligibility = application.certificateEligibility;
  const status = eligibility?.status || "NOT_CHECKED";

  const handleCheck = async () => {
    setChecking(true);
    try {
      const updated = demoCheckMarriageCertificateEligibility(application.id, actorName);
      onChecked(updated);
      toastMessage("success", "Certificate eligibility checked.");
    } catch (e) {
      toastMessage("error", e);
    } finally {
      setChecking(false);
    }
  };

  const tone = status === "ELIGIBLE" ? "info" : status === "NOT_CHECKED" ? "warning" : "warning";
  const icon = status === "ELIGIBLE" ? "check_circle" : status === "NOT_CHECKED" ? "hourglass_empty" : "flag";

  return (
    <Modal show={show} handleClose={onClose} title="Marriage certificate eligibility" description={application.reference} size="sm" testId="marriage-certificate-eligibility-modal">
      <div style={{ padding: "0 24px 24px" }}>
        <div className={`crvs-banner crvs-banner-${tone}`} style={{ alignItems: "center" }}>
          <Icon name={icon} />
          <span>
            {status === "NOT_CHECKED" && "Eligibility has not been checked yet."}
            {status === "ELIGIBLE" && "This record is eligible for a marriage certificate."}
            {status === "INELIGIBLE" && "This record is not currently eligible for a marriage certificate."}
            {status === "MANUAL_REVIEW" && "This record requires manual review before a certificate can be issued."}
          </span>
        </div>
        {eligibility && eligibility.reasons.length > 0 && (
          <ul style={{ margin: "12px 0 0", paddingLeft: 20 }}>
            {eligibility.reasons.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        )}
        <div className="crvs-wizard-actions" style={{ marginTop: 20 }}>
          <Button text="Close" appearance="ghost" onClick={onClose} testId="marriage-certificate-eligibility-close" />
          <Button text="Check eligibility" appearance="ghost" onClick={handleCheck} loading={checking} testId="marriage-certificate-eligibility-check" />
          {status === "ELIGIBLE" && onRequestCertificate && (
            <Button text="Request certificate" appearance="primary" onClick={onRequestCertificate} testId="marriage-certificate-eligibility-request" />
          )}
        </div>
      </div>
    </Modal>
  );
}
