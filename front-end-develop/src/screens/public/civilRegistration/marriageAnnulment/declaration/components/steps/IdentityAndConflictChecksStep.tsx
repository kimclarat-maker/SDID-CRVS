import Icon from "@/components/icon";
import StatusBadge from "@/screens/dashboard/crvs/components/StatusBadge";
import { AnnulmentWizardStepProps } from "../wizardTypes";
import ErrorSummary from "../ErrorSummary";
import { annulmentPolicyConfig } from "@/domain/crvs/annulmentPolicyConfig";
import {
  ANNULMENT_IDENTITY_CONFIDENCE_LABELS,
  ANNULMENT_VERIFICATION_LABELS,
  EXISTING_MARRIAGE_MATCH_STATUS_LABELS,
  affectedPartiesConflict,
  affectedPartyDisplayName,
  applicantDisplayName,
} from "../../../marriageAnnulmentShared";

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
 * Every check is shown as its own row with its own outcome — deliberately no
 * single collapsed "verified" badge. A request can be perfectly submittable
 * with several checks still open, and hiding that behind one green tick would
 * misrepresent where the case stands (spec §8, and this module's own note
 * that verification results must never be collapsed into one pass-fail
 * badge).
 */
export default function IdentityAndConflictChecksStep({ draft, errors }: AnnulmentWizardStepProps) {
  const conflict = affectedPartiesConflict(draft.affectedParty1, draft.affectedParty2);

  const rows: CheckRow[] = [
    {
      id: "applicant-identity",
      label: "Applicant identity",
      detail: `${applicantDisplayName(draft.applicant)} — ${ANNULMENT_VERIFICATION_LABELS[draft.applicant.identityVerification]}`,
      status: <StatusBadge kind="verification" status={draft.applicant.identityVerification} />,
    },
    {
      id: "marriage-record",
      label: "Marriage record",
      detail: draft.existingMarriage.selected
        ? `Linked to marriage ${draft.existingMarriage.selected.registrationNumber}`
        : EXISTING_MARRIAGE_MATCH_STATUS_LABELS[draft.existingMarriage.status],
      status: (
        <span className={`crvs-status-pill ${draft.existingMarriage.status === "MATCHED" ? "crvs-status-success" : "crvs-status-warning"}`}>
          <Icon name={draft.existingMarriage.status === "MATCHED" ? "check_circle" : "help"} />
          {EXISTING_MARRIAGE_MATCH_STATUS_LABELS[draft.existingMarriage.status]}
        </span>
      ),
    },
    {
      id: "party1-identity",
      label: "First affected person identity",
      detail: `${affectedPartyDisplayName(draft.affectedParty1)} — ${ANNULMENT_IDENTITY_CONFIDENCE_LABELS[draft.affectedParty1.identityMatchConfidence]}`,
      status: <StatusBadge kind="verification" status={draft.affectedParty1.identityVerification} />,
    },
    {
      id: "party2-identity",
      label: "Second affected person identity",
      detail: `${affectedPartyDisplayName(draft.affectedParty2)} — ${ANNULMENT_IDENTITY_CONFIDENCE_LABELS[draft.affectedParty2.identityMatchConfidence]}`,
      status: <StatusBadge kind="verification" status={draft.affectedParty2.identityVerification} />,
    },
    {
      id: "distinct-persons",
      label: "The two affected people are different people",
      detail: conflict
        ? "The identity details recorded for both affected people point at the same person."
        : "No conflict found between the identity details recorded on steps 4 and 5.",
      status: (
        <span className={`crvs-status-pill ${conflict ? "crvs-status-danger" : "crvs-status-success"}`}>
          <Icon name={conflict ? "error" : "check_circle"} />
          {conflict ? "Conflict" : "No conflict"}
        </span>
      ),
    },
    {
      id: "decision-finality",
      label: "The decision is final",
      detail: draft.decision.finalityDate
        ? `Recorded as final on ${draft.decision.finalityDate.slice(0, 10)}. A registrar checks this against your documents.`
        : "No date of finality has been entered yet.",
      status: (
        <span className={`crvs-status-pill ${draft.decision.finalityDate ? "crvs-status-info" : "crvs-status-warning"}`}>
          <Icon name={draft.decision.finalityDate ? "schedule" : "pending"} />
          {draft.decision.finalityDate ? "Awaiting registrar check" : "Not yet provided"}
        </span>
      ),
    },
    {
      id: "foreign-decision",
      label: "Recognition of a decision issued abroad",
      detail: draft.decision.isForeign
        ? `This decision was issued outside the country, so a supervisor reviews it separately. Allow up to ${annulmentPolicyConfig.sla.foreignReviewDays} working days.`
        : "Not applicable — the decision was issued by a court or authority in this country.",
      status: (
        <span className={`crvs-status-pill ${draft.decision.isForeign ? "crvs-status-warning" : "crvs-status-neutral"}`}>
          <Icon name={draft.decision.isForeign ? "public" : "remove"} />
          {draft.decision.isForeign ? "Supervisor review required" : "Not applicable"}
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
          <div key={row.id} className="annulment-check-row" data-testid={`annulment-check-${row.id}`}>
            <div className="annulment-check-row-label">
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
        <li>Confirming the decision against the issuing court or authority's own records.</li>
        <li>Checking that this annulment has not already been registered.</li>
        <li>Checking each affected person's current civil status for anything that conflicts with the decision.</li>
        <li>Checking for an existing divorce, judicial separation, or in-progress correction on the marriage record.</li>
        <li>Making the final legal-effect classification from the wording you captured on the decision step.</li>
        <li>
          Confirming that this office has jurisdiction, and whether the request counts as a late registration (more than{" "}
          {annulmentPolicyConfig.lateRegistration.thresholdDays} days after the decision became final).
        </li>
      </ul>
    </div>
  );
}
