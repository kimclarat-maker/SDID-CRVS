import { useState } from "react";
import ConfirmActionModal from "@/components/crvs/modals/ConfirmActionModal";
import StructuredReasonModal, { ReasonOption } from "@/components/crvs/modals/StructuredReasonModal";
import Icon from "@/components/icon";
import { DivorceRegistration, DivorceRegistrationStatus } from "@/domain/crvs/types";
import {
  demoApproveForeignRecognition,
  demoConfirmForeignRequirementsSatisfied,
  demoInitializeForeignRecognition,
  demoRejectForeignRecognition,
  demoRequestForeignEvidence,
  demoRouteForeignToLegalReview,
} from "@/demo/services/crvsDivorceForeignReview";
import { canTransitionDivorceRegistration, DIVORCE_REGISTRATION_STATUS_LABELS } from "@/domain/crvs/statusMachines";
import { divorcePolicyConfig } from "@/domain/crvs/divorcePolicyConfig";
import toastMessage from "@/utils/common/toastMessage";

/** A standing reminder on every foreign-decision action: this workflow only
 * records whether the demo's configured recognition requirements are met. */
function PolicyOnlyNotice() {
  return (
    <div className="crvs-banner crvs-banner-info" style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
      <Icon name="info" />
      <span>
        This is a configured frontend policy workflow only. Recording an outcome here is never a binding legal determination about the effect of a foreign decision.
      </span>
    </div>
  );
}

export function InitializeForeignRecognitionModal({
  show,
  onClose,
  registration,
  actorName,
  onInitialized,
}: {
  show: boolean;
  onClose: () => void;
  registration: DivorceRegistration;
  actorName: string;
  onInitialized: (updated: DivorceRegistration) => void;
}) {
  const [country, setCountry] = useState(registration.judgment.country || "");
  const [authority, setAuthority] = useState(registration.judgment.courtOrAuthorityName || "");
  const [spouse1Nationality, setSpouse1Nationality] = useState(registration.formerSpouse1.nationality || "");
  const [spouse2Nationality, setSpouse2Nationality] = useState(registration.formerSpouse2.nationality || "");

  const handleConfirm = async () => {
    if (!country.trim() || !authority.trim()) throw new Error("The issuing country and the foreign court or authority are both required.");
    const updated = demoInitializeForeignRecognition(
      registration.id,
      {
        country: country.trim(),
        foreignCourtOrAuthority: authority.trim(),
        spouse1Nationality: spouse1Nationality.trim() || undefined,
        spouse2Nationality: spouse2Nationality.trim() || undefined,
      },
      actorName
    );
    toastMessage("success", `Recognition review started for ${updated.reference}.`);
    onInitialized(updated);
    onClose();
  };

  return (
    <ConfirmActionModal
      show={show}
      onClose={onClose}
      onConfirm={handleConfirm}
      title="Start foreign-decision recognition review"
      description={registration.reference}
      confirmLabel="Start recognition review"
      testId="initialize-foreign-recognition-modal"
    >
      <PolicyOnlyNotice />
      <p className="crvs-form-hint" style={{ marginTop: 12 }}>
        The configured requirements — certified translation, authentication or legalization, and exequatur or recognition — are applied automatically from policy, then tracked individually below.
      </p>
      <div className="crvs-form-grid">
        <div className="crvs-form-group">
          <label htmlFor="foreign-init-country">Issuing country</label>
          <input id="foreign-init-country" value={country} onChange={(e) => setCountry(e.target.value)} data-testid="foreign-init-country" />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="foreign-init-authority">Foreign court or authority</label>
          <input id="foreign-init-authority" value={authority} onChange={(e) => setAuthority(e.target.value)} data-testid="foreign-init-authority" />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="foreign-init-nat1">Former spouse 1 nationality</label>
          <input id="foreign-init-nat1" value={spouse1Nationality} onChange={(e) => setSpouse1Nationality(e.target.value)} data-testid="foreign-init-nat1" />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="foreign-init-nat2">Former spouse 2 nationality</label>
          <input id="foreign-init-nat2" value={spouse2Nationality} onChange={(e) => setSpouse2Nationality(e.target.value)} data-testid="foreign-init-nat2" />
        </div>
      </div>
    </ConfirmActionModal>
  );
}

const EVIDENCE_REASON_OPTIONS: ReasonOption[] = [
  { value: "Certified translation missing", label: "Certified translation missing" },
  { value: "Authentication or legalization missing", label: "Authentication or legalization missing" },
  { value: "Exequatur or recognition judgment missing", label: "Exequatur or recognition judgment missing" },
  { value: "Document illegible", label: "Document illegible" },
  { value: "Other", label: "Other" },
];

export function RequestForeignEvidenceModal({
  show,
  onClose,
  registration,
  actorName,
  onRequested,
}: {
  show: boolean;
  onClose: () => void;
  registration: DivorceRegistration;
  actorName: string;
  onRequested: (updated: DivorceRegistration) => void;
}) {
  return (
    <StructuredReasonModal
      show={show}
      onClose={onClose}
      title="Request recognition evidence"
      description={`${registration.reference} — records which configured requirements are still outstanding and notes what is being asked for.`}
      reasonOptions={EVIDENCE_REASON_OPTIONS}
      noteLabel="What the applicant must provide"
      noteRequired
      submitLabel="Request evidence"
      testId="request-foreign-evidence-modal"
      onSubmit={async ({ reason, note }) => {
        const updated = demoRequestForeignEvidence(registration.id, `${reason}: ${note}`, actorName);
        toastMessage("success", `Recognition evidence requested on ${updated.reference}.`);
        onRequested(updated);
      }}
    >
      <PolicyOnlyNotice />
    </StructuredReasonModal>
  );
}

export function ConfirmForeignRequirementsModal({
  show,
  onClose,
  registration,
  actorName,
  onConfirmed,
}: {
  show: boolean;
  onClose: () => void;
  registration: DivorceRegistration;
  actorName: string;
  onConfirmed: (updated: DivorceRegistration) => void;
}) {
  const missing = registration.foreignRecognition.missingRequirements;

  const handleConfirm = async () => {
    const updated = demoConfirmForeignRequirementsSatisfied(registration.id, actorName);
    if (updated.foreignRecognition.status === "REQUIREMENTS_SATISFIED") {
      toastMessage("success", `Recognition requirements satisfied on ${updated.reference}.`);
    } else {
      toastMessage("warning", `${updated.reference} still has outstanding requirements: ${updated.foreignRecognition.missingRequirements.join(", ")}.`);
    }
    onConfirmed(updated);
    onClose();
  };

  return (
    <ConfirmActionModal
      show={show}
      onClose={onClose}
      onConfirm={handleConfirm}
      title="Confirm recognition requirements satisfied"
      description={registration.reference}
      confirmLabel="Confirm requirements"
      testId="confirm-foreign-requirements-modal"
    >
      <PolicyOnlyNotice />
      <p style={{ marginTop: 12 }}>
        This re-evaluates each configured requirement against what has been recorded as provided. It only marks the recognition satisfied when every applicable requirement is met.
      </p>
      {missing.length > 0 && (
        <div className="crvs-banner crvs-banner-warning" style={{ marginTop: 12 }}>
          <Icon name="warning" />
          <span>Currently outstanding: {missing.join(", ")}. Confirming now will leave the recognition pending.</span>
        </div>
      )}
    </ConfirmActionModal>
  );
}

const LEGAL_REVIEW_REASON_OPTIONS: ReasonOption[] = [
  { value: "Recognition basis unclear", label: "Recognition basis unclear" },
  { value: "Conflicting foreign and domestic records", label: "Conflicting foreign and domestic records" },
  { value: "Document authenticity in doubt", label: "Document authenticity in doubt" },
  { value: "Requires supervisor legal judgement", label: "Requires supervisor legal judgement" },
  { value: "Other", label: "Other" },
];

export function RouteForeignToLegalReviewModal({
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
  return (
    <StructuredReasonModal
      show={show}
      onClose={onClose}
      title="Route to legal or manual review"
      description={`${registration.reference} — flags this recognition for a supervisor's legal review.`}
      reasonOptions={LEGAL_REVIEW_REASON_OPTIONS}
      noteLabel="What should the supervisor look at?"
      noteRequired
      submitLabel="Route to legal review"
      testId="route-foreign-legal-review-modal"
      onSubmit={async ({ reason, note }) => {
        const updated = demoRouteForeignToLegalReview(registration.id, `${reason}: ${note}`, actorName);
        toastMessage("success", `${updated.reference} routed for legal review.`);
        onRouted(updated);
      }}
    >
      <PolicyOnlyNotice />
      {divorcePolicyConfig.foreignJudgment.alwaysRequiresSupervisorLegalReview && (
        <p className="crvs-form-hint">Policy requires a supervisor legal review on every foreign decision before it can be approved.</p>
      )}
    </StructuredReasonModal>
  );
}

export function ApproveForeignRecognitionModal({
  show,
  onClose,
  registration,
  nextStatus,
  actorName,
  onApproved,
}: {
  show: boolean;
  onClose: () => void;
  registration: DivorceRegistration;
  nextStatus: DivorceRegistrationStatus;
  actorName: string;
  onApproved: (updated: DivorceRegistration) => void;
}) {
  const missing = registration.foreignRecognition.missingRequirements;
  const transitionOk = canTransitionDivorceRegistration(registration.status, nextStatus);

  const handleConfirm = async () => {
    if (!transitionOk) throw new Error(`This case can't move to ${DIVORCE_REGISTRATION_STATUS_LABELS[nextStatus].toLowerCase()} from ${DIVORCE_REGISTRATION_STATUS_LABELS[registration.status].toLowerCase()}.`);
    const updated = demoApproveForeignRecognition(registration.id, nextStatus, actorName);
    toastMessage("success", `Foreign-decision verification approved — ${updated.reference} is now ${DIVORCE_REGISTRATION_STATUS_LABELS[updated.status].toLowerCase()}.`);
    onApproved(updated);
    onClose();
  };

  return (
    <ConfirmActionModal
      show={show}
      onClose={onClose}
      onConfirm={handleConfirm}
      title="Approve foreign-decision verification"
      description={registration.reference}
      confirmLabel="Approve verification"
      disabled={!transitionOk}
      testId="approve-foreign-recognition-modal"
    >
      <PolicyOnlyNotice />
      <p style={{ marginTop: 12 }}>
        This records that the configured recognition requirements have been reviewed and returns the case to standard review. It does not approve the divorce registration itself — that remains a separate
        Civil Registrar decision.
      </p>
      {missing.length > 0 && (
        <div className="crvs-banner crvs-banner-warning" style={{ marginTop: 12 }}>
          <Icon name="warning" />
          <span>Requirements still recorded as outstanding: {missing.join(", ")}.</span>
        </div>
      )}
      {!transitionOk && (
        <div className="crvs-banner crvs-banner-danger" role="alert" style={{ marginTop: 12 }}>
          This case can&apos;t move to {DIVORCE_REGISTRATION_STATUS_LABELS[nextStatus].toLowerCase()} while it is {DIVORCE_REGISTRATION_STATUS_LABELS[registration.status].toLowerCase()}.
        </div>
      )}
    </ConfirmActionModal>
  );
}

const REJECT_REASON_OPTIONS: ReasonOption[] = [
  { value: "Recognition requirements not met", label: "Recognition requirements not met" },
  { value: "Foreign decision could not be authenticated", label: "Foreign decision could not be authenticated" },
  { value: "No exequatur or recognition judgment provided", label: "No exequatur or recognition judgment provided" },
  { value: "Decision conflicts with a domestic record", label: "Decision conflicts with a domestic record" },
  { value: "Other", label: "Other" },
];

export function RejectForeignRecognitionModal({
  show,
  onClose,
  registration,
  accountId,
  actorName,
  onRejected,
}: {
  show: boolean;
  onClose: () => void;
  registration: DivorceRegistration;
  accountId: string;
  actorName: string;
  onRejected: (updated: DivorceRegistration) => void;
}) {
  return (
    <StructuredReasonModal
      show={show}
      onClose={onClose}
      title="Reject foreign-decision verification"
      description={`${registration.reference} — this rejects the registration. It is final and cannot be undone from this screen.`}
      reasonOptions={REJECT_REASON_OPTIONS}
      noteLabel="Detailed explanation for the applicant"
      noteRequired
      requireConfirmation
      confirmationLabel="I understand this rejects the divorce registration and cannot be undone from this screen."
      submitLabel="Reject verification"
      destructive
      testId="reject-foreign-recognition-modal"
      onSubmit={async ({ reason, note }) => {
        // demoRejectForeignRecognition takes a single reason string (it builds
        // the DivorceRejectionReason itself), so the structured explanation is
        // folded into that string to reach the audit trail intact.
        const updated = demoRejectForeignRecognition(registration.id, `${reason}: ${note}`, accountId, actorName);
        toastMessage("success", `${updated.reference} — foreign-decision verification rejected.`);
        onRejected(updated);
      }}
    >
      <PolicyOnlyNotice />
    </StructuredReasonModal>
  );
}
