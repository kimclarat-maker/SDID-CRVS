import ConfirmActionModal from "@/components/crvs/modals/ConfirmActionModal";
import Icon from "@/components/icon";
import { AnnulmentRegistration, AnnulmentRegistrationStatus } from "@/domain/crvs/types";
import { demoRunAnnulmentDecisionVerification, demoCompleteAnnulmentDecisionVerification } from "@/demo/services/crvsAnnulmentDecisionVerification";
import { ANNULMENT_REGISTRATION_STATUS_LABELS } from "@/domain/crvs/statusMachines";
import toastMessage from "@/utils/common/toastMessage";

/** Mirrors divorce's JudgmentVerificationModals.tsx shape: running
 * verification re-evaluates every AnnulmentDecisionVerificationRuleResult
 * separately and never changes the case status on its own; completing
 * verification is the explicit action that moves the case on. */
export function RunAnnulmentDecisionVerificationModal({
  show,
  onClose,
  registration,
  actorName,
  onRun,
}: {
  show: boolean;
  onClose: () => void;
  registration: AnnulmentRegistration;
  actorName: string;
  onRun: (updated: AnnulmentRegistration) => void;
}) {
  const handleConfirm = async () => {
    const updated = await demoRunAnnulmentDecisionVerification(registration.id, actorName);
    const failed = updated.decisionVerification.results.filter((r) => !r.passed).length;
    toastMessage(failed === 0 ? "success" : "warning", `Verification complete — ${failed} rule(s) did not pass.`);
    onRun(updated);
    onClose();
  };

  return (
    <ConfirmActionModal show={show} onClose={onClose} onConfirm={handleConfirm} title="Run decision verification" description={registration.reference} confirmLabel="Run verification" testId="run-annulment-decision-verification-modal">
      <p style={{ margin: 0 }}>
        Every rule is evaluated and recorded separately — court reference, decision authenticity placeholder, finality, marriage match, both affected parties&apos; identities, existing civil status,
        duplicate/conflict checks (divorce, judicial separation, marriage correction), foreign-decision review requirement, jurisdiction, applicant authority, maker-checker and conflict of interest.
      </p>
      <div className="crvs-banner crvs-banner-info" style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "flex-start" }}>
        <Icon name="rule" />
        <span>Running verification again replaces the previous result set. It never changes the case status on its own — completing verification does that.</span>
      </div>
    </ConfirmActionModal>
  );
}

const OUTCOME_COPY: Record<string, string> = {
  UNDER_REVIEW: "Verification is satisfactory — return this case to standard review so it can be approved or rejected.",
  CORRECTION_REQUIRED: "Verification found something the applicant must fix — this moves the case to correction required.",
  LEGAL_EFFECT_REVIEW: "Verification found the legal effect needs classification review — this moves the case to legal-effect review.",
  FOREIGN_DECISION_REVIEW: "Verification found this is a foreign decision needing recognition checks — this moves the case to foreign-decision review.",
  EXCEPTION_REVIEW: "Verification found a blocking conflict — this moves the case to a supervisor's exception queue.",
  REJECTED: "Verification found the decision cannot be registered at all — this rejects the case outright.",
};

export function CompleteAnnulmentDecisionVerificationModal({
  show,
  onClose,
  registration,
  nextStatus,
  actorName,
  onCompleted,
}: {
  show: boolean;
  onClose: () => void;
  registration: AnnulmentRegistration;
  nextStatus: AnnulmentRegistrationStatus | undefined;
  actorName: string;
  onCompleted: (updated: AnnulmentRegistration) => void;
}) {
  if (!nextStatus) return null;

  const handleConfirm = async () => {
    const updated = await demoCompleteAnnulmentDecisionVerification(registration.id, nextStatus, actorName);
    toastMessage("success", `${updated.reference} is now ${ANNULMENT_REGISTRATION_STATUS_LABELS[updated.status].toLowerCase()}.`);
    onCompleted(updated);
    onClose();
  };

  return (
    <ConfirmActionModal
      show={show}
      onClose={onClose}
      onConfirm={handleConfirm}
      title={`Complete verification — ${ANNULMENT_REGISTRATION_STATUS_LABELS[nextStatus].toLowerCase()}`}
      description={registration.reference}
      confirmLabel="Complete verification"
      destructive={nextStatus === "REJECTED"}
      testId="complete-annulment-decision-verification-modal"
    >
      <p style={{ margin: 0 }}>{OUTCOME_COPY[nextStatus] || `This moves the case to ${ANNULMENT_REGISTRATION_STATUS_LABELS[nextStatus].toLowerCase()}.`}</p>
      <div className="crvs-banner crvs-banner-info" style={{ marginTop: 12 }}>
        Recorded outcome: <strong>{registration.decisionVerification.overallOutcome || "not recorded"}</strong> ·{" "}
        {registration.decisionVerification.results.filter((r) => !r.passed).length} rule(s) did not pass.
      </div>
    </ConfirmActionModal>
  );
}
