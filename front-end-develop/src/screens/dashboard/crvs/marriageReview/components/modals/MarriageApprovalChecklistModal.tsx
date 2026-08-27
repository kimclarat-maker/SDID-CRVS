import Modal from "@/components/Modal";
import Button from "@/components/button";
import Icon from "@/components/icon";
import { MarriageApplication } from "@/domain/crvs/types";
import { marriageConflictOfInterestReasons, canAccessMarriageCaseJurisdiction } from "@/utils/workspace/crvsRules";
import { isAdvanceNoticeSatisfied } from "@/domain/crvs/marriagePolicyConfig";

type Requirement = { label: string; met: boolean };

function buildRequirements(accountId: string | undefined, application: MarriageApplication): Requirement[] {
  const coiReasons = marriageConflictOfInterestReasons(accountId, application);
  const jurisdictionOk = canAccessMarriageCaseJurisdiction(application.jurisdiction);
  const identityOk = application.applicant1.identityVerification?.matchLevel === "CONFIRMED" && application.applicant2.identityVerification?.matchLevel === "CONFIRMED";
  const partnerConfirmed = application.applicant2.partnerConfirmationStatus === "CONFIRMED";
  const civilStatusOk =
    (!application.applicant1.civilStatusVerification || application.applicant1.civilStatusVerification.consistent) &&
    (!application.applicant2.civilStatusVerification || application.applicant2.civilStatusVerification.consistent);
  const conflictOk = !application.eligibility || application.eligibility.existingMarriageConflicts.length === 0;
  const ageOk = !application.eligibility || application.eligibility.results.find((r) => r.rule === "AGE")?.passed !== false;
  const noticeOk = !application.proposedMarriageDate || isAdvanceNoticeSatisfied(application.submittedAt || application.createdAt, application.proposedMarriageDate);
  const documentsOk = !application.eligibility || application.eligibility.results.find((r) => r.rule === "REQUIRED_DOCUMENTS")?.passed !== false;
  const exceptionsOk = !application.exception || application.exception.status === "RESOLVED";
  const correctionsOk = !application.correctionRequests.some((c) => !c.resolvedAt);
  const objectionOk = !application.objection || application.objection.status !== "PENDING";

  return [
    { label: "Both applicants' identities verified", met: identityOk },
    { label: "Both applicants confirmed participation", met: partnerConfirmed },
    { label: "Civil status verified against SDID/CRVS records", met: civilStatusOk },
    { label: "No unresolved existing-marriage conflict", met: conflictOk },
    { label: "Age requirements satisfied (or approved exception)", met: ageOk },
    { label: "Jurisdiction valid", met: jurisdictionOk },
    { label: "Advance-notice period satisfied (or approved exception)", met: noticeOk },
    { label: "Required documents valid", met: documentsOk },
    // Witnesses may still be finalized/replaced up until the ceremony (spec
    // §9 "Replacement capability before ceremony"), so this is informational
    // only and never blocks approval.
    { label: "Witness requirements satisfied or scheduled for final verification", met: true },
    { label: "Exceptions resolved", met: exceptionsOk },
    { label: "No pending objection", met: objectionOk },
    { label: "No pending correction requests", met: correctionsOk },
    { label: "Maker-checker rule satisfied (no conflict of interest)", met: coiReasons.length === 0 },
  ];
}

export default function MarriageApprovalChecklistModal({
  show,
  onClose,
  application,
  accountId,
  onContinue,
}: {
  show: boolean;
  onClose: () => void;
  application: MarriageApplication | undefined;
  accountId: string | undefined;
  onContinue: () => void;
}) {
  if (!application) return null;
  const requirements = buildRequirements(accountId, application);
  const allMet = requirements.every((r) => r.met);

  return (
    <Modal show={show} handleClose={onClose} title="Approval checklist" description={application.reference} size="sm" testId="marriage-approval-checklist-modal">
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
        {!allMet && <div className="crvs-banner crvs-banner-warning" style={{ marginTop: 16 }}>Resolve the unmet items above before you can continue to approve this application.</div>}
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "16px 24px 24px" }}>
        <Button text="Close" appearance="ghost" onClick={onClose} testId="marriage-approval-checklist-close" />
        <Button text="Continue to approve" appearance="primary" disabled={!allMet} onClick={onContinue} testId="marriage-approval-checklist-continue" />
      </div>
    </Modal>
  );
}
