import { useState } from "react";
import ConfirmActionModal from "@/components/crvs/modals/ConfirmActionModal";
import StructuredReasonModal from "@/components/crvs/modals/StructuredReasonModal";
import Icon from "@/components/icon";
import { DivorceExceptionType, DivorceRegistration } from "@/domain/crvs/types";
import { demoRouteDivorceToException, demoRouteDivorceToForeignReview, demoRouteDivorceToJudgmentVerification } from "@/demo/services/crvsDivorceRegistrations";
import { DIVORCE_EXCEPTION_TRIGGER_LABELS, divorcePolicyConfig } from "@/domain/crvs/divorcePolicyConfig";
import toastMessage from "@/utils/common/toastMessage";

/** The three "route this case elsewhere" decisions, each a thin wrapper over
 * a shared modal primitive rather than a bespoke component. */

export function RouteToJudgmentVerificationModal({
  show,
  onClose,
  registration,
  actorName,
  onRouted,
}: {
  show: boolean;
  onClose: () => void;
  registration: DivorceRegistration;
  actorName: string;
  onRouted: (updated: DivorceRegistration) => void;
}) {
  const handleConfirm = async () => {
    const updated = demoRouteDivorceToJudgmentVerification(registration.id, actorName);
    toastMessage("success", `${updated.reference} routed for judgment verification.`);
    onRouted(updated);
    onClose();
  };

  return (
    <ConfirmActionModal
      show={show}
      onClose={onClose}
      onConfirm={handleConfirm}
      title="Route to judgment verification"
      description={registration.reference}
      confirmLabel="Route for verification"
      testId="route-divorce-judgment-verification-modal"
    >
      <p style={{ margin: 0 }}>
        This moves the case into judgment verification so the rule-by-rule checklist can be run against the court reference, finality, marriage match, identities and duplicate checks.
      </p>
      <div className="crvs-banner crvs-banner-info" style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "flex-start" }}>
        <Icon name="schedule" />
        <span>The configured allowance for judgment verification is {divorcePolicyConfig.sla.judgmentVerificationDays} days. Review resumes once verification is completed.</span>
      </div>
    </ConfirmActionModal>
  );
}

export function RouteToForeignReviewModal({
  show,
  onClose,
  registration,
  actorName,
  onRouted,
}: {
  show: boolean;
  onClose: () => void;
  registration: DivorceRegistration;
  actorName: string;
  onRouted: (updated: DivorceRegistration) => void;
}) {
  const handleConfirm = async () => {
    const updated = demoRouteDivorceToForeignReview(registration.id, actorName);
    toastMessage("success", `${updated.reference} routed for foreign-decision review.`);
    onRouted(updated);
    onClose();
  };

  return (
    <ConfirmActionModal
      show={show}
      onClose={onClose}
      onConfirm={handleConfirm}
      title="Route to foreign-judgment review"
      description={registration.reference}
      confirmLabel="Route for foreign review"
      testId="route-divorce-foreign-review-modal"
    >
      <p style={{ margin: 0 }}>
        This moves the case into the foreign-decision recognition workflow: translation, authentication or legalization, and exequatur or recognition are each checked separately, followed by a supervisor
        legal review.
      </p>
      {!registration.judgment.isForeign && (
        <div className="crvs-banner crvs-banner-warning" style={{ marginTop: 12 }}>
          <Icon name="warning" />
          <span>This decision is not recorded as foreign. Routing it here anyway is allowed, but check the court decision first — the country may have been entered incorrectly.</span>
        </div>
      )}
      <div className="crvs-banner crvs-banner-info" style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "flex-start" }}>
        <Icon name="info" />
        <span>
          This is a configured frontend policy workflow only. It records whether the demo&apos;s recognition requirements are met — it is never a binding legal determination of a foreign decision&apos;s
          effect.
        </span>
      </div>
    </ConfirmActionModal>
  );
}

const EXCEPTION_TYPE_OPTIONS = (Object.keys(DIVORCE_EXCEPTION_TRIGGER_LABELS) as DivorceExceptionType[]).map((key) => ({ value: key, label: DIVORCE_EXCEPTION_TRIGGER_LABELS[key] }));

export function RouteToDivorceExceptionModal({
  show,
  onClose,
  registration,
  actorName,
  onRouted,
}: {
  show: boolean;
  onClose: () => void;
  registration: DivorceRegistration;
  actorName: string;
  onRouted: (updated: DivorceRegistration) => void;
}) {
  const [affectedData, setAffectedData] = useState("");
  const [triggeringRule, setTriggeringRule] = useState("");

  const handleClose = () => {
    setAffectedData("");
    setTriggeringRule("");
    onClose();
  };

  return (
    <StructuredReasonModal
      show={show}
      onClose={handleClose}
      title="Route to exception review"
      description={`${registration.reference} — this moves the case to a supervisor's exception queue and pauses the standard review.`}
      reasonOptions={EXCEPTION_TYPE_OPTIONS}
      noteLabel="What should the supervisor look at?"
      noteRequired
      submitLabel="Route to exception review"
      testId="route-divorce-exception-modal"
      onSubmit={async ({ reason, note }) => {
        const updated = demoRouteDivorceToException(
          registration.id,
          {
            type: reason as DivorceExceptionType,
            reason: note || DIVORCE_EXCEPTION_TRIGGER_LABELS[reason as DivorceExceptionType],
            triggeringRule: triggeringRule.trim() || undefined,
            affectedData: affectedData.trim() || undefined,
          },
          actorName
        );
        toastMessage("success", `${updated.reference} routed for exception review.`);
        onRouted(updated);
        handleClose();
      }}
    >
      <div className="crvs-form-grid">
        <div className="crvs-form-group">
          <label htmlFor="route-divorce-exception-rule">Triggering rule (optional)</label>
          <input id="route-divorce-exception-rule" value={triggeringRule} onChange={(e) => setTriggeringRule(e.target.value)} placeholder="e.g. JUDGMENT_FINALITY" data-testid="route-divorce-exception-rule" />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="route-divorce-exception-data">Affected data (optional)</label>
          <input id="route-divorce-exception-data" value={affectedData} onChange={(e) => setAffectedData(e.target.value)} placeholder="e.g. Former spouse 2 identity" data-testid="route-divorce-exception-data" />
        </div>
      </div>
    </StructuredReasonModal>
  );
}
