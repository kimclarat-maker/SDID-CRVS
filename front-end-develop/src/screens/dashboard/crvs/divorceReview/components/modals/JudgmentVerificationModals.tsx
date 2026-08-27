import ConfirmActionModal from "@/components/crvs/modals/ConfirmActionModal";
import Icon from "@/components/icon";
import { DivorceRegistration, DivorceRegistrationStatus } from "@/domain/crvs/types";
import { demoCompleteDivorceJudgmentVerification, demoRunDivorceJudgmentVerification } from "@/demo/services/crvsDivorceJudgmentVerification";
import { DIVORCE_REGISTRATION_STATUS_LABELS } from "@/domain/crvs/statusMachines";
import toastMessage from "@/utils/common/toastMessage";

export function RunJudgmentVerificationModal({
  show,
  onClose,
  registration,
  actorName,
  onRun,
}: {
  show: boolean;
  onClose: () => void;
  registration: DivorceRegistration;
  actorName: string;
  onRun: (updated: DivorceRegistration) => void;
}) {
  const handleConfirm = async () => {
    const updated = demoRunDivorceJudgmentVerification(registration.id, actorName);
    const failed = updated.judgmentVerification.results.filter((r) => !r.passed).length;
    toastMessage(failed === 0 ? "success" : "warning", `Verification complete — ${failed} rule(s) did not pass.`);
    onRun(updated);
    onClose();
  };

  return (
    <ConfirmActionModal show={show} onClose={onClose} onConfirm={handleConfirm} title="Run judgment verification" description={registration.reference} confirmLabel="Run verification" testId="run-divorce-judgment-verification-modal">
      <p style={{ margin: 0 }}>
        Every rule is evaluated and recorded separately — court reference, judgment authenticity placeholder, finality, marriage match, both former spouses&apos; identities, existing civil status,
        duplicate and conflicting-record checks, jurisdiction, maker-checker and conflict of interest.
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
  FOREIGN_JUDGMENT_REVIEW: "Verification found this is a foreign decision needing recognition checks — this moves the case to foreign-judgment review.",
  EXCEPTION_REVIEW: "Verification found a blocking conflict — this moves the case to a supervisor's exception queue.",
  REJECTED: "Verification found the decision cannot be registered at all — this rejects the case outright.",
};

export function CompleteJudgmentVerificationModal({
  show,
  onClose,
  registration,
  nextStatus,
  actorName,
  onCompleted,
}: {
  show: boolean;
  onClose: () => void;
  registration: DivorceRegistration;
  nextStatus: DivorceRegistrationStatus | undefined;
  actorName: string;
  onCompleted: (updated: DivorceRegistration) => void;
}) {
  if (!nextStatus) return null;

  const handleConfirm = async () => {
    const updated = demoCompleteDivorceJudgmentVerification(registration.id, nextStatus, actorName);
    toastMessage("success", `${updated.reference} is now ${DIVORCE_REGISTRATION_STATUS_LABELS[updated.status].toLowerCase()}.`);
    onCompleted(updated);
    onClose();
  };

  return (
    <ConfirmActionModal
      show={show}
      onClose={onClose}
      onConfirm={handleConfirm}
      title={`Complete verification — ${DIVORCE_REGISTRATION_STATUS_LABELS[nextStatus].toLowerCase()}`}
      description={registration.reference}
      confirmLabel="Complete verification"
      destructive={nextStatus === "REJECTED"}
      testId="complete-divorce-judgment-verification-modal"
    >
      <p style={{ margin: 0 }}>{OUTCOME_COPY[nextStatus] || `This moves the case to ${DIVORCE_REGISTRATION_STATUS_LABELS[nextStatus].toLowerCase()}.`}</p>
      <div className="crvs-banner crvs-banner-info" style={{ marginTop: 12 }}>
        Recorded outcome: <strong>{registration.judgmentVerification.overallOutcome || "not recorded"}</strong> ·{" "}
        {registration.judgmentVerification.results.filter((r) => !r.passed).length} rule(s) did not pass.
      </div>
    </ConfirmActionModal>
  );
}
