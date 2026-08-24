import { useState } from "react";
import Button from "@/components/button";
import Icon from "@/components/icon";
import WarningModal from "@/components/crvs/modals/WarningModal";
import ResolveDuplicateModal from "../modals/ResolveDuplicateModal";
import { WizardStepProps } from "../wizardTypes";
import { demoRunDeathDuplicateCheck } from "@/demo/services/crvsDeathDuplicateCheck";
import { demoSearchDeathIdentity } from "@/demo/services/crvsDeathIdentitySearch";
import { getCurrentActorName } from "@/utils/workspace";
import { DeathRegistrationCase } from "@/domain/crvs/types";

/** Wizard step 7: SDID identity match + existing-death-registration
 * duplicate search, similar-person warnings, manual-review fallback (spec
 * §5 step 8). */
export default function IdentityDuplicateStep({ draft, onChange, readOnly }: WizardStepProps) {
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  const [checkingIdentity, setCheckingIdentity] = useState(false);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [showResolve, setShowResolve] = useState(false);

  const runDuplicateCheck = async () => {
    setCheckingDuplicate(true);
    try {
      const result = await demoRunDeathDuplicateCheck(
        draft.id,
        { deceased: draft.deceased, dateOfDeath: draft.dateOfDeath, facilityId: draft.facilityId, location: draft.occurrence.location },
        getCurrentActorName()
      );
      onChange({ duplicateCheck: result });
      if (result.overallLevel !== "NONE") setShowDuplicateWarning(true);
    } finally {
      setCheckingDuplicate(false);
    }
  };

  const runIdentityMatch = async () => {
    setCheckingIdentity(true);
    try {
      const match = await demoSearchDeathIdentity(
        draft.deceased.documentType || "NATIONAL_ID",
        draft.deceased.documentNumber || draft.deceased.nin || "",
        getCurrentActorName(),
        draft.id,
        draft.reference
      );
      onChange({ identityMatch: match });
    } finally {
      setCheckingIdentity(false);
    }
  };

  const onResolved = (updated: DeathRegistrationCase) => onChange({ duplicateCheck: updated.duplicateCheck });

  return (
    <div className="crvs-review-section">
      <h2 className="crvs-section-title">Identity &amp; duplicate checks</h2>

      <div className="crvs-review-section" style={{ marginBottom: 16 }}>
        <div className="crvs-review-section-header">
          <strong>SDID identity match</strong>
          {!readOnly && <Button text="Run identity match" size="sm" appearance="ghost" type="button" loading={checkingIdentity} onClick={runIdentityMatch} testId="run-identity-match" />}
        </div>
        {!draft.identityMatch ? (
          <p className="crvs-form-hint">No identity match has been run yet.</p>
        ) : (
          <>
            <p className="crvs-form-hint">
              Result: <strong>{draft.identityMatch.matchLevel.replace(/_/g, " ")}</strong>
              {draft.identityMatch.maskedSummary ? ` — ${draft.identityMatch.maskedSummary}` : ""}
            </p>
            {draft.identityMatch.requiresManualReview && (
              <div className="crvs-banner crvs-banner-warning">
                <Icon name="flag" /> This identity match needs manual review before approval.
              </div>
            )}
          </>
        )}
      </div>

      <div className="crvs-review-section">
        <div className="crvs-review-section-header">
          <strong>Existing death-registration search</strong>
          {!readOnly && <Button text="Run duplicate check" size="sm" appearance="ghost" type="button" loading={checkingDuplicate} onClick={runDuplicateCheck} testId="run-duplicate-check" />}
        </div>
        {!draft.duplicateCheck ? (
          <p className="crvs-form-hint">No duplicate check has been run yet.</p>
        ) : draft.duplicateCheck.candidates.length === 0 ? (
          <p className="crvs-form-hint">No similar death registrations were found.</p>
        ) : (
          <>
            <ul style={{ margin: "8px 0", paddingLeft: 20 }}>
              {draft.duplicateCheck.candidates.map((c) => (
                <li key={c.caseId}>
                  {c.reference} — {c.matchLevel} ({c.matchedFields.join(", ")}) — {c.maskedSummary}
                </li>
              ))}
            </ul>
            {draft.duplicateCheck.resolution ? (
              <p className="crvs-form-hint">
                Resolved as {draft.duplicateCheck.resolution.type} by {draft.duplicateCheck.resolution.resolvedBy} —{" "}
                {draft.duplicateCheck.resolution.reason}
              </p>
            ) : (
              !readOnly && <Button text="Resolve duplicate" size="sm" appearance="primary" type="button" onClick={() => setShowResolve(true)} testId="open-resolve-duplicate" />
            )}
          </>
        )}
      </div>

      <WarningModal show={showDuplicateWarning} onClose={() => setShowDuplicateWarning(false)} title="Possible duplicate death" testId="possible-duplicate-death-modal">
        <p style={{ margin: 0 }}>
          One or more existing death registrations closely match this case. Review the candidates below and resolve
          the match before submitting.
        </p>
      </WarningModal>
      <ResolveDuplicateModal show={showResolve} onClose={() => setShowResolve(false)} deathCase={draft} onResolved={onResolved} />
    </div>
  );
}
