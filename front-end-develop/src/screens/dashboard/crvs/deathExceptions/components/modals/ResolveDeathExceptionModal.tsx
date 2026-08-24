import { useState } from "react";
import StructuredReasonModal from "@/components/crvs/modals/StructuredReasonModal";
import { DeathRegistrationCase } from "@/domain/crvs/types";
import { demoResolveDeathExceptionReview, demoReassignDeathCase, demoRequestDeathCorrection } from "@/demo/services/crvsDeathRegistrations";
import { getCurrentActorName } from "@/utils/workspace";
import { newLocalId } from "../../../deathShared";

export type ExceptionResolutionType = "CLEAR" | "REQUEST_MORE_INFO" | "APPROVE_EXCEPTION" | "ESCALATE";

const COPY: Record<ExceptionResolutionType, { title: string; submitLabel: string; description: string }> = {
  CLEAR: { title: "Clear exception", submitLabel: "Clear and return to review", description: "Returns this case to the normal Under review state." },
  REQUEST_MORE_INFO: { title: "Request more information", submitLabel: "Request information", description: "Sends the case back to the officer as Correction required." },
  APPROVE_EXCEPTION: { title: "Approve exception", submitLabel: "Approve exception", description: "Clears the exception and moves the case to Under review for the Civil Registrar's normal decision." },
  ESCALATE: { title: "Escalate", submitLabel: "Escalate", description: "Reassigns this case to a supervisor for further review without changing its status." },
};

const REASON_OPTIONS = [
  { value: "Reviewed and satisfactory", label: "Reviewed and satisfactory" },
  { value: "Additional evidence required", label: "Additional evidence required" },
  { value: "Requires supervisor judgement", label: "Requires supervisor judgement" },
  { value: "Other", label: "Other" },
];

/** One parameterized modal behind Clear / Request more information /
 * Approve exception / Escalate (spec §6 "Exception review page"
 * resolution options) — Reject registration reuses
 * deathReview/components/modals/RejectDeathRegistrationModal directly
 * rather than a fifth variant here. */
export default function ResolveDeathExceptionModal({
  show,
  onClose,
  type,
  deathCase,
  onResolved,
}: {
  show: boolean;
  onClose: () => void;
  type: ExceptionResolutionType;
  deathCase: DeathRegistrationCase;
  onResolved: (updated: DeathRegistrationCase) => void;
}) {
  const [supervisorName, setSupervisorName] = useState("");
  const [supervisorId, setSupervisorId] = useState("");
  const copy = COPY[type];

  return (
    <StructuredReasonModal
      show={show}
      onClose={onClose}
      title={copy.title}
      description={`${deathCase.reference} — ${copy.description}`}
      reasonOptions={REASON_OPTIONS}
      noteLabel="Notes"
      noteRequired={type !== "APPROVE_EXCEPTION"}
      submitLabel={copy.submitLabel}
      testId={`resolve-death-exception-${type.toLowerCase()}-modal`}
      onSubmit={async ({ reason, note }) => {
        const actorName = getCurrentActorName();
        if (type === "CLEAR" || type === "APPROVE_EXCEPTION") {
          const updated = demoResolveDeathExceptionReview(
            deathCase.id,
            { type: type === "CLEAR" ? "CLEARED" : "APPROVED", reason: note || reason, nextStatus: "UNDER_REVIEW" },
            actorName
          );
          onResolved(updated);
        } else if (type === "REQUEST_MORE_INFO") {
          const updated = demoRequestDeathCorrection(
            deathCase.id,
            {
              requestedBy: actorName,
              notifyOfficer: true,
              items: [{ id: newLocalId("DCI"), section: "OFFICER_DECLARATION", fields: [], reason, note, requiredEvidenceReplacement: false, addressed: false }],
            },
            actorName
          );
          onResolved(updated);
        } else {
          const updated = demoReassignDeathCase(deathCase.id, supervisorId || "crvs.supervisor@demo.identity.local", supervisorName || "CRVS Supervisor", note || reason, actorName);
          onResolved(updated);
        }
      }}
    >
      {type === "ESCALATE" && (
        <div className="crvs-form-grid">
          <div className="crvs-form-group">
            <label htmlFor="escalate-name">Supervisor name</label>
            <input id="escalate-name" value={supervisorName} onChange={(e) => setSupervisorName(e.target.value)} placeholder="CRVS Supervisor" />
          </div>
          <div className="crvs-form-group">
            <label htmlFor="escalate-id">Supervisor account / email</label>
            <input id="escalate-id" value={supervisorId} onChange={(e) => setSupervisorId(e.target.value)} placeholder="crvs.supervisor@demo.identity.local" />
          </div>
        </div>
      )}
    </StructuredReasonModal>
  );
}
