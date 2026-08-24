import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Icon from "@/components/icon";
import Button from "@/components/button";
import Empty from "@/components/empty";
import StatusBadge from "../../components/StatusBadge";
import StatusTimeline from "../../components/StatusTimeline";
import DocumentPreviewModal from "@/components/crvs/modals/DocumentPreviewModal";
import { demoGetRegistration } from "@/demo/services/crvsRegistrations";
import { demoListCrvsAuditEvents } from "@/demo/services/crvsAudit";
import { BirthRegistrationCase, EvidenceItem } from "@/domain/crvs/types";
import { hasWorkspacePermission, getCurrentAccountId } from "@/utils/workspace";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { REGISTRATION_STATUS_LABELS } from "@/domain/crvs/statusMachines";
import {
  childDisplayName,
  formatDate,
  formatDateTime,
  maskDocumentNumber,
  DOCUMENT_TYPE_LABELS,
  FATHER_AVAILABILITY_LABELS,
  VERIFICATION_LABELS,
  VERIFICATION_TONE,
  VERIFICATION_ICON,
  SOURCE_TYPE_LABELS,
  OCCURRENCE_TYPE_LABELS,
} from "../shared";
import { VerificationState } from "@/domain/crvs/types";
import "../../shared.css";

type AuditEvent = Awaited<ReturnType<typeof demoListCrvsAuditEvents>>["data"][number];

/** StatusBadge has no "verification" kind, so this page builds its own
 * pill for VerificationState using shared VERIFICATION_TONE/ICON maps. */
function VerificationBadge({ state }: { state: VerificationState }) {
  return (
    <span className={`crvs-status-pill crvs-status-${VERIFICATION_TONE[state]} crvs-status-icon-label`}>
      <Icon name={VERIFICATION_ICON[state]} />
      {VERIFICATION_LABELS[state]}
    </span>
  );
}

const TABS = [
  "Overview",
  "Child",
  "Parents",
  "Declarant and witnesses",
  "Evidence",
  "Verification",
  "Duplicate review",
  "Review history",
  "Audit trail",
  "SDID status",
] as const;

/** Read-only case-details page shared by every CRVS role (spec §11): header
 * with status/actions, tabbed detail sections, and the shared status
 * timeline. Whichever officer is viewing, identity document numbers are
 * masked to their last 4 characters outside the officer's own editing flow
 * — this page never shows a full document number. */
export default function BirthRegistrationDetails() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const [registrationCase, setRegistrationCase] = useState<BirthRegistrationCase | undefined>();
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("Overview");
  const [previewEvidence, setPreviewEvidence] = useState<EvidenceItem | undefined>();

  const accountId = getCurrentAccountId();
  const canEdit = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.BIRTH_DRAFT_EDIT);

  const load = () => {
    if (!caseId) return;
    setLoading(true);
    setError(undefined);
    demoGetRegistration(caseId)
      .then(async (c) => {
        if (!c) {
          setError("This registration case could not be found.");
          return;
        }
        setRegistrationCase(c);
        const audit = await demoListCrvsAuditEvents({ targetRef: c.reference, limit: 100 });
        setAuditEvents(audit.data);
      })
      .catch((err) => setError(err?.message || "Couldn't load this case."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  if (loading) {
    return (
      <div className="crvs-page">
        <p className="crvs-form-hint">Loading case…</p>
      </div>
    );
  }

  if (error || !registrationCase) {
    return (
      <div className="crvs-page">
        <Empty icon="error" title="Case not found" description={error} button={<Button type="button" text="Back" appearance="ghost" onClick={() => navigate(-1)} testId="details-back" />} />
      </div>
    );
  }

  const c = registrationCase;
  const isMyDraft = c.status === "DRAFT" && c.officerId === accountId;
  const isMyCorrection = c.status === "CORRECTION_REQUIRED" && c.officerId === accountId;

  return (
    <div className="crvs-page">
      <div className="crvs-page-header" style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 className="crvs-page-title">{c.reference}</h1>
          <p className="crvs-page-subtitle">{childDisplayName(c.child)} · {SOURCE_TYPE_LABELS[c.sourceType]}</p>
          <span className="crvs-demo-note">Demo data — fictional</span>
        </div>
        <div style={{ textAlign: "right" }}>
          <StatusBadge kind="registration" status={c.status} />
          <div className="crvs-form-hint" style={{ marginTop: 8 }}>
            Submitted {formatDate(c.submittedAt)} · Assigned to {c.reviewerName || c.officerName}
          </div>
          <div style={{ marginTop: 12, display: "flex", gap: 8, justifyContent: "flex-end" }}>
            {isMyDraft && canEdit && (
              <Button type="button" text="Continue editing" appearance="primary" onClick={() => navigate(`/dashboard/crvs/births/${c.id}/edit`)} testId="details-edit" />
            )}
            {isMyCorrection && hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.CORRECTION_RESPOND) && (
              <Button type="button" text="Respond to correction" appearance="primary" onClick={() => navigate(`/dashboard/crvs/births/${c.id}/correct`)} testId="details-correct" />
            )}
          </div>
        </div>
      </div>

      <div className="crvs-section">
        <StatusTimeline registrationCase={c} />
      </div>

      <div className="crvs-tabs" role="tablist">
        {TABS.map((tab) => (
          <button key={tab} type="button" role="tab" aria-selected={activeTab === tab} className={`crvs-tab ${activeTab === tab ? "is-active" : ""}`} onClick={() => setActiveTab(tab)} data-testid={`tab-${tab.replace(/\s+/g, "-").toLowerCase()}`}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Overview" && (
        <section className="crvs-section">
          <div className="crvs-form-grid">
            <div className="crvs-form-group"><label>Occurrence type</label><span>{OCCURRENCE_TYPE_LABELS[c.occurrenceType]}</span></div>
            <div className="crvs-form-group"><label>Facility</label><span>{c.facilityName || "—"}</span></div>
            <div className="crvs-form-group"><label>Place of birth</label><span>{c.placeOfBirth}</span></div>
            <div className="crvs-form-group"><label>Processing office</label><span>{c.processingOfficeName}</span></div>
            <div className="crvs-form-group"><label>Jurisdiction</label><span>{c.jurisdiction}</span></div>
            <div className="crvs-form-group"><label>Registration category</label><span>{c.registrationCategory}</span></div>
            <div className="crvs-form-group"><label>Date of birth</label><span>{formatDate(c.dateOfBirth)}</span></div>
            <div className="crvs-form-group"><label>Date reported</label><span>{formatDate(c.dateReported)}</span></div>
            <div className="crvs-form-group"><label>Days after birth</label><span>{c.daysAfterBirth}</span></div>
            <div className="crvs-form-group"><label>Late registration</label><span>{c.isLate ? "Yes" : "No"}{c.requiresSupervisorReview ? " (supervisor review required)" : ""}</span></div>
            {c.notificationReference && <div className="crvs-form-group"><label>Source notification</label><span>{c.notificationReference}</span></div>}
            {c.officialBirthRecordNumber && <div className="crvs-form-group"><label>Official birth record</label><span>{c.officialBirthRecordNumber}</span></div>}
          </div>
          {c.delayReason && (
            <div className="crvs-banner crvs-banner-warning" style={{ marginTop: 12 }}>
              <Icon name="schedule" />
              <span>Delay reason: {c.delayReason}</span>
            </div>
          )}
          {c.exception && (
            <div className="crvs-banner crvs-banner-danger" style={{ marginTop: 12 }}>
              <Icon name="report" />
              <span>Exception ({c.exception.type}, {c.exception.status}): {c.exception.reason}</span>
            </div>
          )}
        </section>
      )}

      {activeTab === "Child" && (
        <section className="crvs-section">
          <div className="crvs-form-grid">
            <div className="crvs-form-group"><label>Full name</label><span>{childDisplayName(c.child)}</span></div>
            <div className="crvs-form-group"><label>Sex</label><span>{c.child.sex}</span></div>
            <div className="crvs-form-group"><label>Date of birth</label><span>{formatDate(c.child.dateOfBirth)}</span></div>
            <div className="crvs-form-group"><label>Time of birth</label><span>{c.child.timeOfBirth || "—"}</span></div>
            <div className="crvs-form-group"><label>Country</label><span>{c.child.country || "—"}</span></div>
            <div className="crvs-form-group"><label>Administrative place of birth</label><span>{c.child.adminPlaceOfBirth || "—"}</span></div>
            <div className="crvs-form-group"><label>Multiple birth</label><span>{c.child.multipleBirth.isMultiple ? `Yes (${c.child.multipleBirth.birthOrder} of ${c.child.multipleBirth.totalBirths})` : "No"}</span></div>
          </div>
          {c.notificationValueChanges.length > 0 && (
            <div className="crvs-section" style={{ marginTop: 12 }}>
              <h3 className="crvs-section-title">Changes from original notification</h3>
              <div className="crvs-table-scroll">
                <table className="crvs-table">
                  <thead><tr><th>Field</th><th>Original</th><th>New</th><th>Reason</th><th>By</th></tr></thead>
                  <tbody>
                    {c.notificationValueChanges.map((change, i) => (
                      <tr key={i}>
                        <td>{change.field}</td>
                        <td>{change.originalValue || "—"}</td>
                        <td>{change.newValue || "—"}</td>
                        <td>{change.reason}</td>
                        <td>{change.by}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}

      {activeTab === "Parents" && (
        <>
          <section className="crvs-section">
            <h3 className="crvs-section-title">Mother</h3>
            <div className="crvs-form-grid">
              <div className="crvs-form-group"><label>Name</label><span>{c.mother.firstName} {c.mother.lastName}</span></div>
              <div className="crvs-form-group"><label>Document</label><span>{DOCUMENT_TYPE_LABELS[c.mother.documentType]} — {maskDocumentNumber(c.mother.documentNumber)}</span></div>
              <div className="crvs-form-group"><label>Date of birth</label><span>{formatDate(c.mother.dateOfBirth)}</span></div>
              <div className="crvs-form-group"><label>Nationality</label><span>{c.mother.nationality || "—"}</span></div>
              <div className="crvs-form-group"><label>Residence</label><span>{c.mother.residence || "—"}</span></div>
              <div className="crvs-form-group"><label>Verification</label><VerificationBadge state={c.mother.verification} /></div>
            </div>
          </section>
          <section className="crvs-section">
            <h3 className="crvs-section-title">Father</h3>
            <div className="crvs-form-grid">
              <div className="crvs-form-group"><label>Availability</label><span>{FATHER_AVAILABILITY_LABELS[c.father.availability]}</span></div>
              {c.father.firstName && (
                <>
                  <div className="crvs-form-group"><label>Name</label><span>{c.father.firstName} {c.father.lastName}</span></div>
                  <div className="crvs-form-group"><label>Document</label><span>{c.father.documentType ? DOCUMENT_TYPE_LABELS[c.father.documentType] : "—"} — {maskDocumentNumber(c.father.documentNumber)}</span></div>
                  {c.father.verification && <div className="crvs-form-group"><label>Verification</label><VerificationBadge state={c.father.verification} /></div>}
                </>
              )}
            </div>
          </section>
        </>
      )}

      {activeTab === "Declarant and witnesses" && (
        <>
          <section className="crvs-section">
            <h3 className="crvs-section-title">Declarant</h3>
            <div className="crvs-form-grid">
              <div className="crvs-form-group"><label>Name</label><span>{c.declarant.firstName} {c.declarant.lastName}</span></div>
              <div className="crvs-form-group"><label>Relationship</label><span>{c.declarant.relationship}</span></div>
              <div className="crvs-form-group"><label>Document</label><span>{DOCUMENT_TYPE_LABELS[c.declarant.documentType]} — {maskDocumentNumber(c.declarant.documentNumber)}</span></div>
              <div className="crvs-form-group"><label>Verification</label><VerificationBadge state={c.declarant.verification} /></div>
            </div>
          </section>
          <section className="crvs-section">
            <h3 className="crvs-section-title">Witnesses ({c.witnesses.length})</h3>
            {c.witnesses.length === 0 && <p className="crvs-form-hint">No witnesses recorded.</p>}
            <div className="crvs-card-grid">
              {c.witnesses.map((w) => (
                <div key={w.id} className="crvs-case-card">
                  <strong>{w.firstName} {w.lastName}</strong>
                  <span className="crvs-form-hint">{w.relationship}</span>
                  <span className="crvs-form-hint">{maskDocumentNumber(w.documentNumber)}</span>
                  <VerificationBadge state={w.verification} />
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {activeTab === "Evidence" && (
        <section className="crvs-section">
          <div className="crvs-card-grid">
            {c.evidence.filter((e) => !e.removed).map((e) => (
              <div key={e.id} className="crvs-case-card">
                <div className="crvs-case-card-header">
                  <strong>{e.documentType}</strong>
                  <VerificationBadge state={e.verification} />
                </div>
                <span className="crvs-form-hint">{e.fileName} · {e.fileSizeKb} KB</span>
                <span className="crvs-form-hint">Uploaded {formatDateTime(e.uploadedAt)} by {e.uploadedBy}</span>
                <Button type="button" text="Preview" size="sm" appearance="ghost" onClick={() => setPreviewEvidence(e)} testId={`details-preview-${e.id}`} />
              </div>
            ))}
            {c.evidence.filter((e) => !e.removed).length === 0 && <p className="crvs-form-hint">No evidence attached.</p>}
          </div>
        </section>
      )}

      {activeTab === "Verification" && (
        <section className="crvs-section">
          <div className="crvs-form-grid">
            <div className="crvs-form-group"><label>Mother</label><VerificationBadge state={c.mother.verification} /></div>
            {c.father.verification && <div className="crvs-form-group"><label>Father</label><VerificationBadge state={c.father.verification} /></div>}
            <div className="crvs-form-group"><label>Declarant</label><VerificationBadge state={c.declarant.verification} /></div>
          </div>
          {c.witnesses.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <h3 className="crvs-section-title">Witnesses</h3>
              {c.witnesses.map((w) => (
                <div key={w.id} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                  <span>{w.firstName} {w.lastName}</span>
                  <VerificationBadge state={w.verification} />
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === "Duplicate review" && (
        <section className="crvs-section">
          {c.duplicateCheck ? (
            <>
              <p className="crvs-form-hint">Checked {formatDateTime(c.duplicateCheck.checkedAt)} by {c.duplicateCheck.checkedBy} — overall: <strong>{c.duplicateCheck.overallLevel}</strong></p>
              <div className="crvs-table-scroll">
                <table className="crvs-table">
                  <thead><tr><th>Candidate</th><th>Match level</th><th>Matched fields</th><th>Status</th></tr></thead>
                  <tbody>
                    {c.duplicateCheck.candidates.map((cand) => (
                      <tr key={cand.caseId}>
                        <td>{cand.maskedSummary}</td>
                        <td>{cand.matchLevel}</td>
                        <td>{cand.matchedFields.join(", ")}</td>
                        <td>{REGISTRATION_STATUS_LABELS[cand.existingRecordStatus]}</td>
                      </tr>
                    ))}
                    {c.duplicateCheck.candidates.length === 0 && (
                      <tr><td colSpan={4} className="crvs-empty-row">No candidates found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              {c.duplicateCheck.resolution && (
                <div className="crvs-banner crvs-banner-info" style={{ marginTop: 12 }}>
                  <Icon name="check" />
                  <span>Resolved as {c.duplicateCheck.resolution.type} by {c.duplicateCheck.resolution.resolvedBy}: {c.duplicateCheck.resolution.reason}</span>
                </div>
              )}
            </>
          ) : (
            <p className="crvs-form-hint">No duplicate check has been run on this case yet.</p>
          )}
        </section>
      )}

      {activeTab === "Review history" && (
        <section className="crvs-section">
          {c.correctionRequests.length === 0 ? (
            <p className="crvs-form-hint">No correction requests on this case.</p>
          ) : (
            c.correctionRequests.map((req) => (
              <div key={req.id} className="crvs-case-card" style={{ marginBottom: 8 }}>
                <div className="crvs-case-card-header">
                  <strong>Requested by {req.requestedBy}</strong>
                  <span className="crvs-form-hint">{formatDateTime(req.requestedAt)}{req.resolvedAt ? ` · Resolved ${formatDateTime(req.resolvedAt)}` : ""}</span>
                </div>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {req.items.map((item) => (
                    <li key={item.id}>
                      [{item.section}] {item.fields.join(", ")}: {item.reason} {item.addressed ? "(addressed)" : "(open)"}
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </section>
      )}

      {activeTab === "Audit trail" && (
        <section className="crvs-section">
          <div className="crvs-table-scroll">
            <table className="crvs-table">
              <thead><tr><th>When</th><th>Actor</th><th>Action</th><th>Details</th></tr></thead>
              <tbody>
                {auditEvents.map((e) => (
                  <tr key={e.id}>
                    <td>{formatDateTime(e.at)}</td>
                    <td>{e.actor}</td>
                    <td>{e.action}</td>
                    <td>{e.details}</td>
                  </tr>
                ))}
                {auditEvents.length === 0 && <tr><td colSpan={4} className="crvs-empty-row">No audit events recorded yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === "SDID status" && (
        <section className="crvs-section">
          <div className="crvs-form-grid">
            <div className="crvs-form-group"><label>Sync status</label><StatusBadge kind="sync" status={c.sdid.status} /></div>
            {c.sdid.fictionalNin && <div className="crvs-form-group"><label>Fictional NIN</label><span>{c.sdid.fictionalNin}</span></div>}
            {c.sdid.completedAt && <div className="crvs-form-group"><label>Completed</label><span>{formatDateTime(c.sdid.completedAt)}</span></div>}
            {c.sdid.lastFailureCode && <div className="crvs-form-group"><label>Last failure</label><span>{c.sdid.lastFailureCode}</span></div>}
          </div>
          {c.sdid.attempts.length > 0 && (
            <div className="crvs-table-scroll" style={{ marginTop: 12 }}>
              <table className="crvs-table">
                <thead><tr><th>When</th><th>Outcome</th><th>Detail</th></tr></thead>
                <tbody>
                  {c.sdid.attempts.map((a, i) => (
                    <tr key={i}>
                      <td>{formatDateTime(a.at)}</td>
                      <td>{a.outcome}</td>
                      <td>{a.failureMessage || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      <DocumentPreviewModal show={!!previewEvidence} evidence={previewEvidence} onClose={() => setPreviewEvidence(undefined)} />
    </div>
  );
}
