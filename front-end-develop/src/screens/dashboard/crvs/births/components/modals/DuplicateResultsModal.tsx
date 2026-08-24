import { useState } from "react";
import Modal from "@/components/Modal";
import Button from "@/components/button";
import Icon from "@/components/icon";
import { DuplicateCheckResult, DuplicateMatchLevel, DuplicateResolutionType } from "@/domain/crvs/types";
import { REGISTRATION_STATUS_LABELS } from "@/domain/crvs/statusMachines";

export type DuplicateResultsModalProps = {
  show: boolean;
  result?: DuplicateCheckResult;
  canResolve: boolean;
  busy?: boolean;
  onClose: () => void;
  /** Officer-level action: just closes the modal so they can go fix the
   * conflicting data — no server resolution, since a Registration Officer
   * doesn't hold DUPLICATE_CHECK_RESOLVE. */
  onReturnAndCorrect: () => void;
  /** Supervisor/Registrar-level resolution, gated by canResolve. */
  onResolve: (resolution: { type: DuplicateResolutionType; reason: string; linkedCaseId?: string }) => Promise<void>;
};

const LEVEL_TONE: Record<DuplicateMatchLevel, string> = {
  NONE: "success",
  POTENTIAL: "warning",
  PROBABLE: "warning",
  EXACT: "danger",
};

const RESOLUTION_OPTIONS: { type: DuplicateResolutionType; label: string }[] = [
  { type: "NOT_DUPLICATE", label: "Mark not a duplicate" },
  { type: "LINKED", label: "Link to existing record" },
  { type: "RETURNED_FOR_CORRECTION", label: "Return for correction" },
  { type: "ESCALATED", label: "Escalate" },
];

/** Shows masked duplicate candidates with match level/matched fields and
 * gates full resolution actions behind DUPLICATE_CHECK_RESOLVE — a
 * Registration Officer only ever sees "return and correct" here (spec §14). */
export default function DuplicateResultsModal({ show, result, canResolve, busy, onClose, onReturnAndCorrect, onResolve }: DuplicateResultsModalProps) {
  const [resolutionType, setResolutionType] = useState<DuplicateResolutionType>("NOT_DUPLICATE");
  const [linkedCaseId, setLinkedCaseId] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | undefined>();

  if (!result) return null;

  const handleResolve = async () => {
    if (!reason.trim()) {
      setError("A reason is required to resolve this duplicate check.");
      return;
    }
    setError(undefined);
    await onResolve({
      type: resolutionType,
      reason: reason.trim(),
      linkedCaseId: resolutionType === "LINKED" ? linkedCaseId.trim() || undefined : undefined,
    });
    setReason("");
    setLinkedCaseId("");
  };

  return (
    <Modal show={show} handleClose={onClose} title="Duplicate check results" size="lg" testId="duplicate-results-modal">
      <div style={{ padding: "0 24px 24px" }}>
        <div className={`crvs-banner crvs-banner-${result.overallLevel === "EXACT" ? "danger" : result.overallLevel === "NONE" ? "info" : "warning"}`}>
          <Icon name={result.overallLevel === "NONE" ? "check_circle" : "report"} />
          <span>
            Overall result: <strong>{result.overallLevel}</strong>
            {result.overallLevel === "EXACT" && " — this blocks submission until resolved."}
          </span>
        </div>

        {result.candidates.length === 0 ? (
          <p className="crvs-form-hint" style={{ marginTop: 12 }}>No matching candidates found.</p>
        ) : (
          <div className="crvs-table-scroll" style={{ marginTop: 12 }}>
            <table className="crvs-table">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Match level</th>
                  <th>Matched fields</th>
                  <th>Existing status</th>
                </tr>
              </thead>
              <tbody>
                {result.candidates.map((c) => (
                  <tr key={c.caseId}>
                    <td>{c.maskedSummary} <span className="crvs-form-hint">({c.reference})</span></td>
                    <td>
                      <span className={`crvs-status-pill crvs-status-${LEVEL_TONE[c.matchLevel]}`}>{c.matchLevel}</span>
                    </td>
                    <td>{c.matchedFields.join(", ") || "—"}</td>
                    <td>{REGISTRATION_STATUS_LABELS[c.existingRecordStatus]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {result.resolution && (
          <div className="crvs-banner crvs-banner-info" style={{ marginTop: 12 }}>
            <Icon name="check" />
            <span>
              Already resolved as <strong>{result.resolution.type}</strong> by {result.resolution.resolvedBy}: {result.resolution.reason}
            </span>
          </div>
        )}

        {!result.resolution && result.candidates.length > 0 && (
          <div className="crvs-section" style={{ marginTop: 16 }}>
            {canResolve ? (
              <>
                <h3 className="crvs-section-title">Resolve duplicate check</h3>
                <div className="crvs-form-grid">
                  <div className="crvs-form-group">
                    <label htmlFor="dup-resolution-type">Resolution</label>
                    <select id="dup-resolution-type" value={resolutionType} onChange={(e) => setResolutionType(e.target.value as DuplicateResolutionType)}>
                      {RESOLUTION_OPTIONS.map((o) => (
                        <option key={o.type} value={o.type}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  {resolutionType === "LINKED" && (
                    <div className="crvs-form-group">
                      <label htmlFor="dup-linked-case">Linked case ID</label>
                      <input id="dup-linked-case" value={linkedCaseId} onChange={(e) => setLinkedCaseId(e.target.value)} />
                    </div>
                  )}
                </div>
                <div className="crvs-form-group" style={{ marginTop: 8 }}>
                  <label htmlFor="dup-reason">Reason</label>
                  <textarea id="dup-reason" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
                  {error && <span className="crvs-form-error">{error}</span>}
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                  <Button type="button" text="Resolve" appearance="primary" loading={busy} onClick={handleResolve} testId="duplicate-resolve-confirm" />
                </div>
              </>
            ) : (
              <>
                <p className="crvs-form-hint" style={{ marginTop: 0 }}>
                  Only a Civil Registrar or CRVS Supervisor can fully resolve a duplicate match. You can return to the
                  application and correct the conflicting details.
                </p>
                <Button type="button" text="Return and correct application" appearance="ghost" onClick={onReturnAndCorrect} testId="duplicate-return-and-correct" />
              </>
            )}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
          <Button type="button" text="Close" appearance="ghost" onClick={onClose} testId="duplicate-results-close" />
        </div>
      </div>
    </Modal>
  );
}
