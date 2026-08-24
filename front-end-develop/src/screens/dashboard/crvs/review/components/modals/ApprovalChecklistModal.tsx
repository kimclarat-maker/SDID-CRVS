import Modal from "@/components/Modal";
import Button from "@/components/button";
import Icon from "@/components/icon";
import { BirthRegistrationCase } from "@/domain/crvs/types";
import { allMandatorySectionsReviewed } from "@/demo/services/crvsRegistrations";
import { canAccessCaseJurisdiction, conflictOfInterestReasons } from "@/utils/workspace/crvsRules";

type Requirement = { label: string; met: boolean };

function buildRequirements(accountId: string | undefined, registrationCase: BirthRegistrationCase): Requirement[] {
  const coiReasons = conflictOfInterestReasons(accountId, registrationCase);
  const jurisdictionOk = canAccessCaseJurisdiction(registrationCase.jurisdiction);
  const duplicateOk =
    !registrationCase.duplicateCheck ||
    registrationCase.duplicateCheck.overallLevel === "NONE" ||
    !!registrationCase.duplicateCheck.resolution;
  const correctionsOk = !registrationCase.correctionRequests.some((c) => !c.resolvedAt);

  return [
    { label: "All review sections are verified", met: allMandatorySectionsReviewed(registrationCase) },
    { label: "Duplicate check is resolved", met: duplicateOk },
    { label: "No pending correction requests", met: correctionsOk },
    { label: "Case is within your assigned jurisdiction", met: jurisdictionOk },
    { label: "No conflict of interest for you on this case", met: coiReasons.length === 0 },
  ];
}

/**
 * Non-destructive pre-flight list shown before ApproveRegistrationModal.
 * "Continue to approve" stays disabled until every requirement is met —
 * this mirrors (and itemizes, for the UI) what canApproveCase() +
 * allMandatorySectionsReviewed() already gate server-side in
 * demoApproveRegistration, so a registrar never reaches the high-risk
 * confirm step only to have it rejected by the service.
 */
export default function ApprovalChecklistModal({
  show,
  onClose,
  registrationCase,
  accountId,
  onContinue,
}: {
  show: boolean;
  onClose: () => void;
  registrationCase: BirthRegistrationCase | undefined;
  accountId: string | undefined;
  onContinue: () => void;
}) {
  if (!registrationCase) return null;
  const requirements = buildRequirements(accountId, registrationCase);
  const allMet = requirements.every((r) => r.met);

  return (
    <Modal show={show} handleClose={onClose} title="Approval checklist" description={registrationCase.reference} size="sm" testId="approval-checklist-modal">
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
        {!allMet && (
          <div className="crvs-banner crvs-banner-warning" style={{ marginTop: 16 }}>
            Resolve the unmet items above before you can continue to approve this case.
          </div>
        )}
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "16px 24px 24px" }}>
        <Button text="Close" appearance="ghost" onClick={onClose} testId="approval-checklist-close" />
        <Button
          text="Continue to approve"
          appearance="primary"
          disabled={!allMet}
          onClick={onContinue}
          testId="approval-checklist-continue"
        />
      </div>
    </Modal>
  );
}
