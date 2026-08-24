import Modal from "@/components/Modal";
import Button from "@/components/button";
import Icon from "@/components/icon";
import { DeathRegistrationCase } from "@/domain/crvs/types";
import { allMandatoryDeathSectionsReviewed } from "@/demo/services/crvsDeathRegistrations";
import { canAccessDeathCaseJurisdiction, deathConflictOfInterestReasons } from "@/utils/workspace/crvsRules";

type Requirement = { label: string; met: boolean };

function buildRequirements(accountId: string | undefined, deathCase: DeathRegistrationCase): Requirement[] {
  const coiReasons = deathConflictOfInterestReasons(accountId, deathCase);
  const jurisdictionOk = canAccessDeathCaseJurisdiction(deathCase.jurisdiction);
  const duplicateOk = !deathCase.duplicateCheck || deathCase.duplicateCheck.overallLevel === "NONE" || !!deathCase.duplicateCheck.resolution;
  const identityOk = !deathCase.identityMatch || !deathCase.identityMatch.requiresManualReview || !!deathCase.identityMatch.resolution;
  const correctionsOk = !deathCase.correctionRequests.some((c) => !c.resolvedAt);
  const witnessesOk = deathCase.pathway !== "COMMUNITY" && deathCase.pathway !== "LATE" ? true : deathCase.witnesses.length > 0;
  const medicalOk = deathCase.pathway !== "HEALTH_FACILITY" || !!deathCase.medicalCertification?.isCertified;

  return [
    { label: "Deceased identity sufficiently established", met: deathCase.deceased.identityStatus === "KNOWN" || deathCase.pathway === "UNIDENTIFIED" },
    { label: "Death occurrence established", met: !!deathCase.occurrence.dateOfDeath && !!deathCase.occurrence.location },
    { label: "Declarant authorized", met: !!deathCase.declarant.relationship },
    { label: "Medical certification reviewed when applicable", met: medicalOk },
    { label: "Required witnesses verified", met: witnessesOk },
    { label: "All review sections are verified", met: allMandatoryDeathSectionsReviewed(deathCase) },
    { label: "Duplicate search completed and resolved", met: duplicateOk },
    { label: "Jurisdiction confirmed", met: jurisdictionOk },
    { label: "Identity-match exceptions resolved", met: identityOk },
    { label: "No pending correction requests", met: correctionsOk },
    { label: "Maker-checker rule satisfied (no conflict of interest)", met: coiReasons.length === 0 },
  ];
}

export default function DeathApprovalChecklistModal({
  show,
  onClose,
  deathCase,
  accountId,
  onContinue,
}: {
  show: boolean;
  onClose: () => void;
  deathCase: DeathRegistrationCase | undefined;
  accountId: string | undefined;
  onContinue: () => void;
}) {
  if (!deathCase) return null;
  const requirements = buildRequirements(accountId, deathCase);
  const allMet = requirements.every((r) => r.met);

  return (
    <Modal show={show} handleClose={onClose} title="Approval checklist" description={deathCase.reference} size="sm" testId="death-approval-checklist-modal">
      <div style={{ padding: "0 24px 8px" }}>
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
          {requirements.map((req) => (
            <li key={req.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className={`crvs-status-pill ${req.met ? "crvs-status-success" : "crvs-status-danger"} crvs-status-icon-label`}>
                <Icon name={req.met ? "check_circle" : "cancel"} />
              </span>
              <span style={{ color: req.met ? "var(--text-primary)" : "var(--status-danger)" }}>{req.label}</span>
            </li>
          ))}
        </ul>
        {!allMet && <div className="crvs-banner crvs-banner-warning" style={{ marginTop: 16 }}>Resolve the unmet items above before you can continue to approve this case.</div>}
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "16px 24px 24px" }}>
        <Button text="Close" appearance="ghost" onClick={onClose} testId="death-approval-checklist-close" />
        <Button text="Continue to approve" appearance="primary" disabled={!allMet} onClick={onContinue} testId="death-approval-checklist-continue" />
      </div>
    </Modal>
  );
}
