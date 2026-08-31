import { useState } from "react";
import StructuredReasonModal, { ReasonOption } from "@/components/crvs/modals/StructuredReasonModal";
import Icon from "@/components/icon";
import { AnnulmentRegistration, AnnulmentRegistrationStatus } from "@/domain/crvs/types";
import {
  demoReassignAnnulmentCase,
  demoResolveAnnulmentException,
  demoRouteAnnulmentToDecisionVerification,
  demoRouteAnnulmentToForeignReview,
  demoRouteAnnulmentToLegalEffectReview,
} from "@/demo/services/crvsAnnulmentRegistrations";
import { ANNULMENT_REGISTRATION_STATUS_LABELS, canTransitionAnnulmentRegistration } from "@/domain/crvs/statusMachines";
import { getCurrentActorName } from "@/utils/workspace";
import toastMessage from "@/utils/common/toastMessage";
import {
  ANNULMENT_REGISTRATION_OFFICER_DEMO_ID,
  ANNULMENT_REGISTRATION_OFFICER_DEMO_NAME,
  CRVS_SUPERVISOR_DEMO_ID,
  CRVS_SUPERVISOR_DEMO_NAME,
} from "@/demo/seed/crvsAccounts";

export type AnnulmentExceptionResolutionType =
  | "CLEAR"
  | "REQUEST_INFORMATION"
  | "RETURN_TO_OFFICER"
  | "ROUTE_TO_OFFICE"
  | "ROUTE_DECISION_VERIFICATION"
  | "ROUTE_LEGAL_EFFECT_REVIEW"
  | "ROUTE_FOREIGN_REVIEW"
  | "APPROVE_EXCEPTION"
  | "REJECT"
  | "ESCALATE";

type Copy = {
  title: string;
  submitLabel: string;
  description: string;
  /** The status the case moves to. Undefined for resolutions that use a
   * dedicated service call (decision verification / legal-effect review /
   * foreign review) or that only reassign. */
  nextStatus?: AnnulmentRegistrationStatus;
  destructive?: boolean;
};

const COPY: Record<AnnulmentExceptionResolutionType, Copy> = {
  CLEAR: {
    title: "Clear exception",
    submitLabel: "Clear exception",
    description: "Records the exception as resolved and returns the case to standard review so it can be approved or rejected.",
    nextStatus: "UNDER_REVIEW",
  },
  REQUEST_INFORMATION: {
    title: "Request information",
    submitLabel: "Request information",
    description: "Records the exception as resolved pending an applicant response and moves the case to correction required.",
    nextStatus: "CORRECTION_REQUIRED",
  },
  RETURN_TO_OFFICER: {
    title: "Return to the Registration Officer",
    submitLabel: "Return to officer",
    description: "Sends the case back for correction by the preparing officer. The case moves to correction required.",
    nextStatus: "CORRECTION_REQUIRED",
  },
  ROUTE_TO_OFFICE: {
    title: "Route to another office",
    submitLabel: "Route to office",
    description: "Records the exception as resolved, returns the case to review, and reassigns it so the correct office can take it on.",
    nextStatus: "UNDER_REVIEW",
  },
  ROUTE_DECISION_VERIFICATION: {
    title: "Route to decision verification",
    submitLabel: "Route to decision verification",
    description: "Moves the case into the decision-verification workflow. This uses the decision-verification route rather than a plain exception resolution.",
  },
  ROUTE_LEGAL_EFFECT_REVIEW: {
    title: "Route to legal-effect review",
    submitLabel: "Route to legal-effect review",
    description: "Moves the case into the legal-effect classification workflow. This uses the legal-effect-review route rather than a plain exception resolution.",
  },
  ROUTE_FOREIGN_REVIEW: {
    title: "Route to foreign-decision review",
    submitLabel: "Route to foreign review",
    description: "Moves the case into the foreign-decision recognition workflow. This uses the foreign-review route rather than a plain exception resolution.",
  },
  APPROVE_EXCEPTION: {
    title: "Approve an authorized exception",
    submitLabel: "Approve exception",
    description: "Records a supervisor-authorized exception (for example a late registration accepted on its merits) and returns the case to review.",
    nextStatus: "UNDER_REVIEW",
  },
  REJECT: {
    title: "Reject the registration",
    submitLabel: "Reject registration",
    description: "Rejects the case outright. This is final and cannot be undone from this screen.",
    nextStatus: "REJECTED",
    destructive: true,
  },
  ESCALATE: {
    title: "Escalate to a supervisor",
    submitLabel: "Escalate",
    description: "Reassigns the case to a supervisor for further review. The exception stays open.",
  },
};

const REASON_OPTIONS: ReasonOption[] = [
  { value: "Reviewed and satisfactory", label: "Reviewed and satisfactory" },
  { value: "Additional evidence required", label: "Additional evidence required" },
  { value: "Court details need confirming", label: "Court details need confirming" },
  { value: "Identity could not be resolved", label: "Identity could not be resolved" },
  { value: "Marriage record could not be resolved", label: "Marriage record could not be resolved" },
  { value: "Decision verification required", label: "Decision verification required" },
  { value: "Legal-effect classification unclear", label: "Legal-effect classification unclear" },
  { value: "Wrong processing office", label: "Wrong processing office" },
  { value: "Requires supervisor judgement", label: "Requires supervisor judgement" },
  { value: "Other", label: "Other" },
];

/**
 * One parameterized modal behind every exception resolution — mirrors
 * divorceExceptions' ResolveDivorceExceptionModal shape rather than
 * spawning ten bespoke components. Most resolutions map to
 * demoResolveAnnulmentException() with a different nextStatus; decision
 * verification / legal-effect review / foreign review each use their own
 * dedicated route*() service call, and escalation/office routing add a
 * demoReassignAnnulmentCase() call.
 */
export default function ResolveAnnulmentExceptionModal({
  show,
  onClose,
  type,
  registration,
  onResolved,
}: {
  show: boolean;
  onClose: () => void;
  type: AnnulmentExceptionResolutionType;
  registration: AnnulmentRegistration;
  onResolved: (updated: AnnulmentRegistration) => void;
}) {
  const [assigneeName, setAssigneeName] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const copy = COPY[type];

  const transitionBlocked = !!copy.nextStatus && !canTransitionAnnulmentRegistration(registration.status, copy.nextStatus);
  const decisionVerificationBlocked = type === "ROUTE_DECISION_VERIFICATION" && !canTransitionAnnulmentRegistration(registration.status, "DECISION_VERIFICATION");
  const legalEffectBlocked = type === "ROUTE_LEGAL_EFFECT_REVIEW" && !canTransitionAnnulmentRegistration(registration.status, "LEGAL_EFFECT_REVIEW");
  const foreignBlocked = type === "ROUTE_FOREIGN_REVIEW" && !canTransitionAnnulmentRegistration(registration.status, "FOREIGN_DECISION_REVIEW");
  const anyBlocked = transitionBlocked || decisionVerificationBlocked || legalEffectBlocked || foreignBlocked;

  const handleClose = () => {
    setAssigneeName("");
    setAssigneeId("");
    onClose();
  };

  return (
    <StructuredReasonModal
      show={show}
      onClose={handleClose}
      title={copy.title}
      description={`${registration.reference} — ${copy.description}`}
      reasonOptions={REASON_OPTIONS}
      noteLabel="Resolution note"
      noteRequired={type !== "APPROVE_EXCEPTION"}
      requireConfirmation={type === "REJECT"}
      confirmationLabel="I understand this rejection is final and cannot be undone from this screen."
      submitLabel={copy.submitLabel}
      destructive={copy.destructive}
      testId={`resolve-annulment-exception-${type.toLowerCase()}-modal`}
      onSubmit={async ({ reason, note }) => {
        if (anyBlocked) {
          throw new Error(`This resolution isn't available while the case is ${ANNULMENT_REGISTRATION_STATUS_LABELS[registration.status].toLowerCase()}.`);
        }
        const actorName = getCurrentActorName();

        if (type === "ROUTE_DECISION_VERIFICATION") {
          const updated = await demoRouteAnnulmentToDecisionVerification(registration.id, actorName);
          toastMessage("success", `${updated.reference} routed for decision verification.`);
          onResolved(updated);
          handleClose();
          return;
        }

        if (type === "ROUTE_LEGAL_EFFECT_REVIEW") {
          const updated = await demoRouteAnnulmentToLegalEffectReview(registration.id, actorName);
          toastMessage("success", `${updated.reference} routed for legal-effect classification review.`);
          onResolved(updated);
          handleClose();
          return;
        }

        if (type === "ROUTE_FOREIGN_REVIEW") {
          const updated = await demoRouteAnnulmentToForeignReview(registration.id, actorName);
          toastMessage("success", `${updated.reference} routed for foreign-decision review.`);
          onResolved(updated);
          handleClose();
          return;
        }

        if (type === "ESCALATE") {
          const updated = await demoReassignAnnulmentCase(
            registration.id,
            assigneeId.trim() || CRVS_SUPERVISOR_DEMO_ID,
            assigneeName.trim() || CRVS_SUPERVISOR_DEMO_NAME,
            note || reason,
            actorName
          );
          toastMessage("success", `${updated.reference} escalated to ${assigneeName.trim() || CRVS_SUPERVISOR_DEMO_NAME}.`);
          onResolved(updated);
          handleClose();
          return;
        }

        let updated = await demoResolveAnnulmentException(registration.id, { type, reason, note: note || undefined, nextStatus: copy.nextStatus! }, actorName);

        if (type === "ROUTE_TO_OFFICE" || type === "RETURN_TO_OFFICER") {
          const fallbackId = type === "ROUTE_TO_OFFICE" ? CRVS_SUPERVISOR_DEMO_ID : ANNULMENT_REGISTRATION_OFFICER_DEMO_ID;
          const fallbackName = type === "ROUTE_TO_OFFICE" ? CRVS_SUPERVISOR_DEMO_NAME : ANNULMENT_REGISTRATION_OFFICER_DEMO_NAME;
          updated = await demoReassignAnnulmentCase(registration.id, assigneeId.trim() || fallbackId, assigneeName.trim() || fallbackName, note || reason, actorName);
        }

        toastMessage("success", `${updated.reference} — ${copy.title.toLowerCase()} recorded.`);
        onResolved(updated);
        handleClose();
      }}
    >
      {anyBlocked && (
        <div className="crvs-banner crvs-banner-warning" role="alert">
          <Icon name="warning" />
          <span>This resolution isn&apos;t available while the case is {ANNULMENT_REGISTRATION_STATUS_LABELS[registration.status].toLowerCase()}.</span>
        </div>
      )}
      {(type === "ESCALATE" || type === "ROUTE_TO_OFFICE" || type === "RETURN_TO_OFFICER") && (
        <div className="crvs-form-grid">
          <div className="crvs-form-group">
            <label htmlFor="resolve-annulment-assignee-name">Assign to (name)</label>
            <input
              id="resolve-annulment-assignee-name"
              value={assigneeName}
              placeholder={type === "RETURN_TO_OFFICER" ? registration.officerName : CRVS_SUPERVISOR_DEMO_NAME}
              onChange={(e) => setAssigneeName(e.target.value)}
              data-testid="resolve-annulment-assignee-name"
            />
          </div>
          <div className="crvs-form-group">
            <label htmlFor="resolve-annulment-assignee-id">Assign to (account)</label>
            <input
              id="resolve-annulment-assignee-id"
              value={assigneeId}
              placeholder={type === "RETURN_TO_OFFICER" ? registration.officerId : CRVS_SUPERVISOR_DEMO_ID}
              onChange={(e) => setAssigneeId(e.target.value)}
              data-testid="resolve-annulment-assignee-id"
            />
          </div>
        </div>
      )}
    </StructuredReasonModal>
  );
}
