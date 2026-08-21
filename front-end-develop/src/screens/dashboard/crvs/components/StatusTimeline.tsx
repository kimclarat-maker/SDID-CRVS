import Icon from "@/components/icon";
import { BirthRegistrationCase } from "@/domain/crvs/types";
import { REGISTRATION_STATUS_LABELS, REGISTRATION_TIMELINE_ORDER } from "@/domain/crvs/statusMachines";

/** Only the stages a case has actually reached, or is on the applicable
 * standard path for, are shown (spec §11) — a rejected case, for example,
 * never shows "Approved"/"Registered". */
export default function StatusTimeline({ registrationCase }: { registrationCase: BirthRegistrationCase }) {
  const reachedStatuses = new Set(registrationCase.statusHistory.map((h) => h.status));
  const isTerminalNegative = registrationCase.status === "REJECTED" || registrationCase.status === "CANCELLED";

  const stages = REGISTRATION_TIMELINE_ORDER.filter((status) => {
    if (isTerminalNegative && (status === "APPROVED" || status === "REGISTERED")) return false;
    if (status === "CORRECTION_REQUIRED" && !reachedStatuses.has("CORRECTION_REQUIRED")) return false;
    if (status === "RESUBMITTED" && !reachedStatuses.has("RESUBMITTED")) return false;
    return true;
  });

  const syncReached = registrationCase.sdid.status === "IDENTITY_CREATED";

  return (
    <div className="crvs-timeline">
      {stages.map((status) => {
        const reached = reachedStatuses.has(status);
        return (
          <span key={status} className={`crvs-timeline-item ${reached ? "is-reached" : ""}`}>
            <span className="crvs-timeline-dot" />
            {REGISTRATION_STATUS_LABELS[status]}
          </span>
        );
      })}
      {registrationCase.status === "REGISTERED" && (
        <span className={`crvs-timeline-item ${syncReached ? "is-reached" : ""}`}>
          <span className="crvs-timeline-dot" />
          SDID identity created
        </span>
      )}
      {isTerminalNegative && (
        <span className="crvs-timeline-item is-reached">
          <Icon name={registrationCase.status === "REJECTED" ? "cancel" : "block"} />
          {registrationCase.status === "REJECTED" ? "Rejected" : "Cancelled"}
        </span>
      )}
    </div>
  );
}
