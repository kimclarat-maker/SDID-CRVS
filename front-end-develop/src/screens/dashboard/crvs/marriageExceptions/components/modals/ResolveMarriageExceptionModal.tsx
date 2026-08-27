import { useState } from "react";
import StructuredReasonModal from "@/components/crvs/modals/StructuredReasonModal";
import { MarriageApplication } from "@/domain/crvs/types";
import { demoResolveMarriageException, demoReassignMarriageCase } from "@/demo/services/crvsMarriageApplications";
import { getCurrentActorName } from "@/utils/workspace";

export type MarriageExceptionResolutionType = "CLEAR" | "APPROVE" | "ESCALATE";

const COPY: Record<MarriageExceptionResolutionType, { title: string; submitLabel: string; description: string }> = {
  CLEAR: {
    title: "Clear exception",
    submitLabel: "Clear exception",
    description: "Records this exception as resolved. This does not itself change the application's status — approval/rejection stays with eligibility review.",
  },
  APPROVE: {
    title: "Approve exception",
    submitLabel: "Approve exception",
    description: "Records this exception as approved (e.g. an underage case cleared by a supervisor) so eligibility review can proceed.",
  },
  ESCALATE: {
    title: "Escalate",
    submitLabel: "Escalate",
    description: "Reassigns this application to a supervisor for further review, without changing the exception's open status.",
  },
};

const REASON_OPTIONS = [
  { value: "Reviewed and satisfactory", label: "Reviewed and satisfactory" },
  { value: "Additional evidence required", label: "Additional evidence required" },
  { value: "Requires supervisor judgement", label: "Requires supervisor judgement" },
  { value: "Other", label: "Other" },
];

/** One parameterized modal behind Clear / Approve / Escalate — mirrors
 * deathExceptions' ResolveDeathExceptionModal shape. Rejecting an
 * application from here is intentionally out of scope: that decision
 * belongs to the eligibility-review workspace this module doesn't own. */
export default function ResolveMarriageExceptionModal({
  show,
  onClose,
  type,
  application,
  onResolved,
}: {
  show: boolean;
  onClose: () => void;
  type: MarriageExceptionResolutionType;
  application: MarriageApplication;
  onResolved: (updated: MarriageApplication) => void;
}) {
  const [supervisorName, setSupervisorName] = useState("");
  const [supervisorId, setSupervisorId] = useState("");
  const copy = COPY[type];

  return (
    <StructuredReasonModal
      show={show}
      onClose={onClose}
      title={copy.title}
      description={`${application.reference} — ${copy.description}`}
      reasonOptions={REASON_OPTIONS}
      noteLabel="Notes"
      noteRequired={type !== "APPROVE"}
      submitLabel={copy.submitLabel}
      testId={`resolve-marriage-exception-${type.toLowerCase()}-modal`}
      onSubmit={async ({ reason, note }) => {
        const actorName = getCurrentActorName();
        if (type === "CLEAR" || type === "APPROVE") {
          const updated = demoResolveMarriageException(application.id, { type: type === "CLEAR" ? "CLEARED" : "APPROVED", reason: note || reason, note }, actorName);
          onResolved(updated);
        } else {
          const updated = demoReassignMarriageCase(application.id, supervisorId || "crvs.supervisor@demo.identity.local", supervisorName || "CRVS Supervisor", note || reason, actorName);
          onResolved(updated);
        }
      }}
    >
      {type === "ESCALATE" && (
        <div className="crvs-form-grid">
          <div className="crvs-form-group">
            <label htmlFor="mr-escalate-name">Supervisor name</label>
            <input id="mr-escalate-name" value={supervisorName} onChange={(e) => setSupervisorName(e.target.value)} placeholder="CRVS Supervisor" />
          </div>
          <div className="crvs-form-group">
            <label htmlFor="mr-escalate-id">Supervisor account / email</label>
            <input id="mr-escalate-id" value={supervisorId} onChange={(e) => setSupervisorId(e.target.value)} placeholder="crvs.supervisor@demo.identity.local" />
          </div>
        </div>
      )}
    </StructuredReasonModal>
  );
}
