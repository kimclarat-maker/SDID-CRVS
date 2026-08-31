import { useState } from "react";
import ConfirmActionModal from "@/components/crvs/modals/ConfirmActionModal";
import StructuredReasonModal from "@/components/crvs/modals/StructuredReasonModal";
import Icon from "@/components/icon";
import { AnnulmentExceptionType, AnnulmentRegistration } from "@/domain/crvs/types";
import {
  demoRouteAnnulmentToDecisionVerification,
  demoRouteAnnulmentToLegalEffectReview,
  demoRouteAnnulmentToForeignReview,
  demoRouteAnnulmentToException,
} from "@/demo/services/crvsAnnulmentRegistrations";
import { ANNULMENT_EXCEPTION_TRIGGER_LABELS, annulmentPolicyConfig } from "@/domain/crvs/annulmentPolicyConfig";
import toastMessage from "@/utils/common/toastMessage";

/** The four "route this case elsewhere" decisions (spec §17/§18/§20/§21),
 * each a thin wrapper over a shared modal primitive rather than a bespoke
 * component — mirrors divorce's RouteDivorceModals.tsx shape with one extra
 * branch (legal-effect review) that has no divorce analog. */

export function RouteToAnnulmentDecisionVerificationModal({
  show,
  onClose,
  registration,
  actorName,
  onRouted,
}: {
  show: boolean;
  onClose: () => void;
  registration: AnnulmentRegistration;
  actorName: string;
  onRouted: (updated: AnnulmentRegistration) => void;
}) {
  const handleConfirm = async () => {
    const updated = await demoRouteAnnulmentToDecisionVerification(registration.id, actorName);
    toastMessage("success", `${updated.reference} routed for decision verification.`);
    onRouted(updated);
    onClose();
  };

  return (
    <ConfirmActionModal
      show={show}
      onClose={onClose}
      onConfirm={handleConfirm}
      title="Route to decision verification"
      description={registration.reference}
      confirmLabel="Route for verification"
      testId="route-annulment-decision-verification-modal"
    >
      <p style={{ margin: 0 }}>
        This moves the case into decision verification so the rule-by-rule checklist can be run against the court reference, finality, marriage match, both affected parties&apos; identities, existing
        civil status, and duplicate/conflict checks.
      </p>
      <div className="crvs-banner crvs-banner-info" style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "flex-start" }}>
        <Icon name="schedule" />
        <span>The configured allowance for decision verification is {annulmentPolicyConfig.sla.decisionVerificationDays} days. Review resumes once verification is completed.</span>
      </div>
    </ConfirmActionModal>
  );
}

export function RouteToAnnulmentLegalEffectReviewModal({
  show,
  onClose,
  registration,
  actorName,
  onRouted,
}: {
  show: boolean;
  onClose: () => void;
  registration: AnnulmentRegistration;
  actorName: string;
  onRouted: (updated: AnnulmentRegistration) => void;
}) {
  const handleConfirm = async () => {
    const updated = await demoRouteAnnulmentToLegalEffectReview(registration.id, actorName);
    toastMessage("success", `${updated.reference} routed for legal-effect classification review.`);
    onRouted(updated);
    onClose();
  };

  return (
    <ConfirmActionModal
      show={show}
      onClose={onClose}
      onConfirm={handleConfirm}
      title="Route to legal-effect review"
      description={registration.reference}
      confirmLabel="Route for legal-effect review"
      testId="route-annulment-legal-effect-review-modal"
    >
      <p style={{ margin: 0 }}>
        This moves the case into legal-effect review, where authorized staff classify what the decision means for the marriage — the application never determines this itself.
      </p>
      <div className="crvs-banner crvs-banner-info" style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "flex-start" }}>
        <Icon name="schedule" />
        <span>The configured allowance for legal-effect review is {annulmentPolicyConfig.sla.legalEffectReviewDays} days.</span>
      </div>
    </ConfirmActionModal>
  );
}

export function RouteToAnnulmentForeignReviewModal({
  show,
  onClose,
  registration,
  actorName,
  onRouted,
}: {
  show: boolean;
  onClose: () => void;
  registration: AnnulmentRegistration;
  actorName: string;
  onRouted: (updated: AnnulmentRegistration) => void;
}) {
  const handleConfirm = async () => {
    const updated = await demoRouteAnnulmentToForeignReview(registration.id, actorName);
    toastMessage("success", `${updated.reference} routed for foreign-decision review.`);
    onRouted(updated);
    onClose();
  };

  return (
    <ConfirmActionModal
      show={show}
      onClose={onClose}
      onConfirm={handleConfirm}
      title="Route to foreign-decision review"
      description={registration.reference}
      confirmLabel="Route for foreign review"
      testId="route-annulment-foreign-review-modal"
    >
      <p style={{ margin: 0 }}>
        This moves the case into the foreign-decision recognition workflow: translation, authentication or legalization, and exequatur or recognition are each checked separately, followed by a supervisor
        legal review.
      </p>
      {!registration.decision.isForeign && (
        <div className="crvs-banner crvs-banner-warning" style={{ marginTop: 12 }}>
          <Icon name="warning" />
          <span>This decision is not recorded as foreign. Routing it here anyway is allowed, but check the decision first — the country may have been entered incorrectly.</span>
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

const EXCEPTION_TYPE_OPTIONS = (Object.keys(ANNULMENT_EXCEPTION_TRIGGER_LABELS) as AnnulmentExceptionType[]).map((key) => ({ value: key, label: ANNULMENT_EXCEPTION_TRIGGER_LABELS[key] }));

export function RouteToAnnulmentExceptionModal({
  show,
  onClose,
  registration,
  actorName,
  onRouted,
  defaultType,
}: {
  show: boolean;
  onClose: () => void;
  registration: AnnulmentRegistration;
  actorName: string;
  onRouted: (updated: AnnulmentRegistration) => void;
  defaultType?: AnnulmentExceptionType;
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
      testId="route-annulment-exception-modal"
      onSubmit={async ({ reason, note }) => {
        const updated = await demoRouteAnnulmentToException(
          registration.id,
          {
            type: reason as AnnulmentExceptionType,
            reason: note || ANNULMENT_EXCEPTION_TRIGGER_LABELS[reason as AnnulmentExceptionType],
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
          <label htmlFor="route-annulment-exception-rule">Triggering rule (optional)</label>
          <input id="route-annulment-exception-rule" value={triggeringRule} onChange={(e) => setTriggeringRule(e.target.value)} placeholder="e.g. DECISION_NOT_FINAL" data-testid="route-annulment-exception-rule" />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="route-annulment-exception-data">Affected data (optional)</label>
          <input id="route-annulment-exception-data" value={affectedData} onChange={(e) => setAffectedData(e.target.value)} placeholder="e.g. Second affected party identity" data-testid="route-annulment-exception-data" />
        </div>
      </div>
      {defaultType && (
        <p className="crvs-form-hint" style={{ margin: 0 }}>
          Suggested exception type: {ANNULMENT_EXCEPTION_TRIGGER_LABELS[defaultType]}.
        </p>
      )}
    </StructuredReasonModal>
  );
}
