import { useState } from "react";
import StructuredReasonModal, { ReasonOption } from "@/components/crvs/modals/StructuredReasonModal";
import Icon from "@/components/icon";
import { DivorceRegistration, DivorceRegistrationStatus } from "@/domain/crvs/types";
import { demoReassignDivorceCase, demoResolveDivorceException, demoRouteDivorceToForeignReview } from "@/demo/services/crvsDivorceRegistrations";
import { canTransitionDivorceRegistration, DIVORCE_REGISTRATION_STATUS_LABELS } from "@/domain/crvs/statusMachines";
import { getCurrentActorName } from "@/utils/workspace";
import toastMessage from "@/utils/common/toastMessage";
import { CRVS_SUPERVISOR_DEMO_ID, CRVS_SUPERVISOR_DEMO_NAME, DIVORCE_REGISTRATION_OFFICER_DEMO_ID, DIVORCE_REGISTRATION_OFFICER_DEMO_NAME } from "@/demo/seed/crvsAccounts";

export type DivorceExceptionResolutionType =
  | "CLEAR"
  | "REQUEST_INFORMATION"
  | "RETURN_TO_OFFICER"
  | "ROUTE_TO_OFFICE"
  | "ROUTE_FOREIGN_REVIEW"
  | "APPROVE_EXCEPTION"
  | "REJECT"
  | "ESCALATE";

type Copy = {
  title: string;
  submitLabel: string;
  description: string;
  /** The status the case moves to. Undefined for resolutions that use a
   * dedicated service call (foreign review) or that only reassign. */
  nextStatus?: DivorceRegistrationStatus;
  destructive?: boolean;
};

const COPY: Record<DivorceExceptionResolutionType, Copy> = {
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
  { value: "Wrong processing office", label: "Wrong processing office" },
  { value: "Requires supervisor judgement", label: "Requires supervisor judgement" },
  { value: "Other", label: "Other" },
];

/**
 * One parameterized modal behind every exception resolution — mirrors
 * marriageExceptions' ResolveMarriageExceptionModal shape rather than
 * spawning eight bespoke components. Most resolutions map to
 * demoResolveDivorceException() with a different nextStatus; foreign review
 * uses demoRouteDivorceToForeignReview() and escalation/office routing add a
 * demoReassignDivorceCase() call.
 */
export default function ResolveDivorceExceptionModal({
  show,
  onClose,
  type,
  registration,
  onResolved,
}: {
  show: boolean;
  onClose: () => void;
  type: DivorceExceptionResolutionType;
  registration: DivorceRegistration;
  onResolved: (updated: DivorceRegistration) => void;
}) {
  const [assigneeName, setAssigneeName] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const copy = COPY[type];

  const transitionBlocked = !!copy.nextStatus && !canTransitionDivorceRegistration(registration.status, copy.nextStatus);
  const foreignBlocked = type === "ROUTE_FOREIGN_REVIEW" && !canTransitionDivorceRegistration(registration.status, "FOREIGN_JUDGMENT_REVIEW");

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
      testId={`resolve-divorce-exception-${type.toLowerCase()}-modal`}
      onSubmit={async ({ reason, note }) => {
        if (transitionBlocked || foreignBlocked) {
          throw new Error(`This resolution isn't available while the case is ${DIVORCE_REGISTRATION_STATUS_LABELS[registration.status].toLowerCase()}.`);
        }
        const actorName = getCurrentActorName();

        if (type === "ROUTE_FOREIGN_REVIEW") {
          const updated = demoRouteDivorceToForeignReview(registration.id, actorName);
          toastMessage("success", `${updated.reference} routed for foreign-decision review.`);
          onResolved(updated);
          handleClose();
          return;
        }

        if (type === "ESCALATE") {
          const updated = demoReassignDivorceCase(
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

        let updated = demoResolveDivorceException(registration.id, { type, reason, note: note || undefined, nextStatus: copy.nextStatus! }, actorName);

        if (type === "ROUTE_TO_OFFICE" || type === "RETURN_TO_OFFICER") {
          const fallbackId = type === "ROUTE_TO_OFFICE" ? CRVS_SUPERVISOR_DEMO_ID : DIVORCE_REGISTRATION_OFFICER_DEMO_ID;
          const fallbackName = type === "ROUTE_TO_OFFICE" ? CRVS_SUPERVISOR_DEMO_NAME : DIVORCE_REGISTRATION_OFFICER_DEMO_NAME;
          updated = demoReassignDivorceCase(registration.id, assigneeId.trim() || fallbackId, assigneeName.trim() || fallbackName, note || reason, actorName);
        }

        toastMessage("success", `${updated.reference} — ${copy.title.toLowerCase()} recorded.`);
        onResolved(updated);
        handleClose();
      }}
    >
      {(transitionBlocked || foreignBlocked) && (
        <div className="crvs-banner crvs-banner-warning" role="alert">
          <Icon name="warning" />
          <span>This resolution isn&apos;t available while the case is {DIVORCE_REGISTRATION_STATUS_LABELS[registration.status].toLowerCase()}.</span>
        </div>
      )}
      {(type === "ESCALATE" || type === "ROUTE_TO_OFFICE" || type === "RETURN_TO_OFFICER") && (
        <div className="crvs-form-grid">
          <div className="crvs-form-group">
            <label htmlFor="resolve-divorce-assignee-name">Assign to (name)</label>
            <input
              id="resolve-divorce-assignee-name"
              value={assigneeName}
              placeholder={type === "RETURN_TO_OFFICER" ? registration.officerName : CRVS_SUPERVISOR_DEMO_NAME}
              onChange={(e) => setAssigneeName(e.target.value)}
              data-testid="resolve-divorce-assignee-name"
            />
          </div>
          <div className="crvs-form-group">
            <label htmlFor="resolve-divorce-assignee-id">Assign to (account)</label>
            <input
              id="resolve-divorce-assignee-id"
              value={assigneeId}
              placeholder={type === "RETURN_TO_OFFICER" ? registration.officerId : CRVS_SUPERVISOR_DEMO_ID}
              onChange={(e) => setAssigneeId(e.target.value)}
              data-testid="resolve-divorce-assignee-id"
            />
          </div>
        </div>
      )}
    </StructuredReasonModal>
  );
}
