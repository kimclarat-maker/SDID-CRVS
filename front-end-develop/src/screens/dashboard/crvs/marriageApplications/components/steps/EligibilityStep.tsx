import { useState } from "react";
import Button from "@/components/button";
import Icon from "@/components/icon";
import WarningModal from "@/components/crvs/modals/WarningModal";
import { WizardStepProps } from "../wizardTypes";
import { demoRunMarriageEligibilityCheck } from "@/demo/services/crvsMarriageEligibility";
import { getCurrentActorName } from "@/utils/workspace";
import toastMessage from "@/utils/common/toastMessage";
import { MarriageEligibilityRuleResult } from "@/domain/crvs/types";

const RULE_LABELS: Record<string, string> = {
  AGE: "Minimum marriage age",
  ADVANCE_NOTICE: "Advance-notice period",
  EXISTING_MARRIAGE_CONFLICT: "Existing-marriage conflict",
  CIVIL_STATUS_CONSISTENCY: "Civil-status consistency",
  JURISDICTION: "Jurisdiction",
  RESIDENCE_DOMICILE: "Residence / domicile",
  REQUIRED_DOCUMENTS: "Required documents",
  WITNESS_REQUIREMENTS: "Witness requirements",
  IDENTITY_MATCH_CONFIDENCE: "Identity match confidence",
  RELATIONSHIP_PROHIBITED_CHECK: "Prohibited-relationship check",
  DUPLICATE_DECLARATION: "Duplicate declaration",
};

/** Wizard step 5: eligibility and civil-status checks (spec §9 step 5) —
 * every rule outcome is shown discretely; the UI never collapses these into
 * a single pass/fail (spec §12 warning: "must not claim legally eligible
 * merely because a mock identity lookup succeeded"). */
export default function EligibilityStep({ draft, onChange, readOnly }: WizardStepProps) {
  const [running, setRunning] = useState(false);
  const [detail, setDetail] = useState<MarriageEligibilityRuleResult | undefined>();

  const runCheck = async () => {
    setRunning(true);
    try {
      const updated = demoRunMarriageEligibilityCheck(draft.id, getCurrentActorName());
      onChange(updated);
      toastMessage("success", `Eligibility outcome: ${updated.eligibility?.overallOutcome}.`);
    } catch (err) {
      toastMessage("error", err);
    } finally {
      setRunning(false);
    }
  };

  const severityIcon = (r: MarriageEligibilityRuleResult) => (r.passed ? "check_circle" : r.severity === "BLOCKING" ? "cancel" : "warning");
  const severityTone = (r: MarriageEligibilityRuleResult) => (r.passed ? "crvs-banner-info" : r.severity === "BLOCKING" ? "crvs-banner-danger" : "crvs-banner-warning");

  return (
    <div className="crvs-review-section">
      <h2 className="crvs-section-title">Eligibility and civil-status checks</h2>

      {!readOnly && (
        <Button text="Run eligibility check" appearance="primary" startIcon="fact_check" type="button" loading={running} onClick={runCheck} testId="wizard-run-eligibility" />
      )}

      {!draft.eligibility ? (
        <p className="crvs-form-hint" style={{ marginTop: 12 }}>No eligibility check has been run yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
          {draft.eligibility.results.map((r) => (
            <div key={r.rule} className={`crvs-banner ${severityTone(r)}`} style={{ alignItems: "flex-start" }}>
              <Icon name={severityIcon(r)} />
              <div style={{ flex: 1 }}>
                <strong>{RULE_LABELS[r.rule] || r.rule}</strong>
                <div className="crvs-form-hint">{r.message}</div>
              </div>
              {!r.passed && (
                <button type="button" className="crvs-tab" onClick={() => setDetail(r)} data-testid={`eligibility-detail-${r.rule}`}>
                  Details
                </button>
              )}
            </div>
          ))}

          {draft.eligibility.existingMarriageConflicts.length > 0 && (
            <div className="crvs-section" style={{ marginTop: 8 }}>
              <h3 className="crvs-section-title" style={{ fontSize: "var(--font-size-body)" }}>Existing-marriage conflicts</h3>
              {draft.eligibility.existingMarriageConflicts.map((c, i) => (
                <div key={i} className="crvs-form-hint">
                  {c.spouseRole}: {c.candidate.maskedSummary} ({c.candidate.status})
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <WarningModal
        show={!!detail}
        onClose={() => setDetail(undefined)}
        title={detail ? RULE_LABELS[detail.rule] || detail.rule : ""}
        testId="eligibility-rule-detail-modal"
      >
        <p style={{ margin: 0 }}>{detail?.message}</p>
      </WarningModal>
    </div>
  );
}
