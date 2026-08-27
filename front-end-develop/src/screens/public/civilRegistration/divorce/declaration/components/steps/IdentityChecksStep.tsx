import Icon from "@/components/icon";
import StatusBadge from "@/screens/dashboard/crvs/components/StatusBadge";
import { DivorceWizardStepProps } from "../wizardTypes";
import ErrorSummary from "../ErrorSummary";
import { divorcePolicyConfig } from "@/domain/crvs/divorcePolicyConfig";
import {
  DIVORCE_IDENTITY_CONFIDENCE_LABELS,
  DIVORCE_VERIFICATION_LABELS,
  EXISTING_MARRIAGE_STATUS_LABELS,
  applicantDisplayName,
  formerSpouseDisplayName,
  formerSpousesConflict,
} from "../../../divorceShared";

type CheckRow = {
  id: string;
  label: string;
  detail: string;
  status: React.ReactNode;
};

/**
 * Wizard step 8 — a read-only account of the checks already recorded on this
 * draft. It computes nothing: it renders what earlier steps and the demo
 * services put on the record.
 *
 * Every check is shown as its own row with its own outcome. There is
 * deliberately no single collapsed "verified" badge — a request can be
 * perfectly submittable with several checks still open, and hiding that
 * behind one green tick would misrepresent where the case stands (spec §8).
 */
export default function IdentityChecksStep({ draft, errors }: DivorceWizardStepProps) {
  const conflict = formerSpousesConflict(draft.formerSpouse1, draft.formerSpouse2);

  const rows: CheckRow[] = [
    {
      id: "applicant-identity",
      label: "Applicant identity",
      detail: `${applicantDisplayName(draft.applicant)} — ${DIVORCE_VERIFICATION_LABELS[draft.applicant.identityVerification]}`,
      status: <StatusBadge kind="verification" status={draft.applicant.identityVerification} />,
    },
    {
      id: "marriage-record",
      label: "Marriage record",
      detail: draft.existingMarriage.selected
        ? `Linked to marriage ${draft.existingMarriage.selected.registrationNumber}`
        : EXISTING_MARRIAGE_STATUS_LABELS[draft.existingMarriage.status],
      status: (
        <span className={`crvs-status-pill ${draft.existingMarriage.status === "MATCHED" ? "crvs-status-success" : "crvs-status-warning"}`}>
          <Icon name={draft.existingMarriage.status === "MATCHED" ? "check_circle" : "help"} />
          {EXISTING_MARRIAGE_STATUS_LABELS[draft.existingMarriage.status]}
        </span>
      ),
    },
    {
      id: "spouse1-identity",
      label: "Former spouse 1 identity",
      detail: `${formerSpouseDisplayName(draft.formerSpouse1)} — ${DIVORCE_IDENTITY_CONFIDENCE_LABELS[draft.formerSpouse1.identityMatchConfidence]}`,
      status: <StatusBadge kind="verification" status={draft.formerSpouse1.identityVerification} />,
    },
    {
      id: "spouse2-identity",
      label: "Former spouse 2 identity",
      detail: `${formerSpouseDisplayName(draft.formerSpouse2)} — ${DIVORCE_IDENTITY_CONFIDENCE_LABELS[draft.formerSpouse2.identityMatchConfidence]}`,
      status: <StatusBadge kind="verification" status={draft.formerSpouse2.identityVerification} />,
    },
    {
      id: "distinct-persons",
      label: "The two former spouses are different people",
      detail: conflict
        ? "The identity details recorded for both former spouses point at the same person."
        : "No conflict found between the identity details recorded on steps 4 and 5.",
      status: (
        <span className={`crvs-status-pill ${conflict ? "crvs-status-danger" : "crvs-status-success"}`}>
          <Icon name={conflict ? "error" : "check_circle"} />
          {conflict ? "Conflict" : "No conflict"}
        </span>
      ),
    },
    {
      id: "judgment-finality",
      label: "The court decision is final",
      detail: draft.judgment.finalityDate
        ? `Recorded as final on ${draft.judgment.finalityDate.slice(0, 10)}. A registrar checks this against your documents.`
        : "No date of finality has been entered yet.",
      status: (
        <span className={`crvs-status-pill ${draft.judgment.finalityDate ? "crvs-status-info" : "crvs-status-warning"}`}>
          <Icon name={draft.judgment.finalityDate ? "schedule" : "pending"} />
          {draft.judgment.finalityDate ? "Awaiting registrar check" : "Not yet provided"}
        </span>
      ),
    },
    {
      id: "foreign-decision",
      label: "Recognition of a decision issued abroad",
      detail: draft.judgment.isForeign
        ? `This decision was issued outside the country, so a supervisor reviews it separately. Allow up to ${divorcePolicyConfig.sla.foreignReviewDays} working days.`
        : "Not applicable — the decision was issued by a court in this country.",
      status: (
        <span className={`crvs-status-pill ${draft.judgment.isForeign ? "crvs-status-warning" : "crvs-status-neutral"}`}>
          <Icon name={draft.judgment.isForeign ? "public" : "remove"} />
          {draft.judgment.isForeign ? "Supervisor review required" : "Not applicable"}
        </span>
      ),
    },
  ];

  return (
    <div className="crvs-review-section">
      <h2 className="crvs-section-title">Identity and conflict checks</h2>
      <ErrorSummary errors={errors} />

      <div className="crvs-banner crvs-banner-info" style={{ alignItems: "flex-start" }}>
        <Icon name="fact_check" />
        <div>
          <strong>These are preliminary results, not decisions.</strong>
          <p style={{ margin: "6px 0 0" }}>
            Everything below reflects only what has been recorded so far. A registrar re-runs each of these checks
            properly once your request reaches review, together with duplicate and civil-status checks that can only be
            done by staff. An open or unverified result here does not stop you submitting.
          </p>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        {rows.map((row) => (
          <div key={row.id} className="divorce-check-row" data-testid={`divorce-check-${row.id}`}>
            <div className="divorce-check-row-label">
              <strong>{row.label}</strong>
              <p className="crvs-form-hint" style={{ margin: "4px 0 0" }}>
                {row.detail}
              </p>
            </div>
            {row.status}
          </div>
        ))}
      </div>

      <h3 style={{ marginTop: 20 }}>Checks only a registrar can complete</h3>
      <ul className="crvs-form-hint" style={{ paddingInlineStart: 20 }}>
        <li>Confirming the court decision against the issuing court's own records.</li>
        <li>Checking that this divorce has not already been registered.</li>
        <li>Checking each former spouse's current civil status for anything that conflicts with the decision.</li>
        <li>
          Confirming that this office has jurisdiction, and whether the request counts as a late registration (more than{" "}
          {divorcePolicyConfig.lateRegistration.thresholdDays} days after the decision became final).
        </li>
      </ul>
    </div>
  );
}
