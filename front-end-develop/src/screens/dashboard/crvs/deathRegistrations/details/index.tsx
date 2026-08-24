import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Empty from "@/components/empty";
import Button from "@/components/button";
import Icon from "@/components/icon";
import { DescriptionList, DescriptionItem } from "@/components/descriptionList";
import StatusBadge from "../../components/StatusBadge";
import RestrictedCauseOfDeathNotice from "../../components/RestrictedCauseOfDeathNotice";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { hasWorkspacePermission, getCurrentAccountId } from "@/utils/workspace";
import { demoGetDeathRegistration } from "@/demo/services/crvsDeathRegistrations";
import { demoListCrvsAuditEvents } from "@/demo/services/crvsAudit";
import { DEATH_REGISTRATION_STATUS_LABELS } from "@/domain/crvs/statusMachines";
import { DeathRegistrationCase } from "@/domain/crvs/types";
import { DemoAuditEvent } from "@/demo/types";
import { deceasedDisplayName, maskDocumentNumber, formatDateTime, formatDate, PATHWAY_LABELS, PLACE_CATEGORY_LABELS } from "../../deathShared";
import { deathConflictOfInterestReasons, canAccessDeathCaseJurisdiction } from "@/utils/workspace/crvsRules";
import "../../shared.css";

type TabKey = "overview" | "deceased" | "occurrence" | "medical" | "family" | "witnesses" | "evidence" | "identity" | "review" | "sdid" | "timeline" | "audit";

const TABS: { key: TabKey; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "deceased", label: "Deceased" },
  { key: "occurrence", label: "Occurrence" },
  { key: "medical", label: "Medical certification" },
  { key: "family", label: "Declarant & family" },
  { key: "witnesses", label: "Witnesses" },
  { key: "evidence", label: "Evidence" },
  { key: "identity", label: "Identity checks" },
  { key: "review", label: "Review" },
  { key: "sdid", label: "SDID synchronization" },
  { key: "timeline", label: "Timeline" },
  { key: "audit", label: "Audit" },
];

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="crvs-form-hint">{label}</dt>
      <dd style={{ margin: 0 }}>{value}</dd>
    </div>
  );
}

export default function DeathRegistrationDetails() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const currentAccountId = getCurrentAccountId();

  const canView = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DEATH_REGISTRATION_VIEW);
  const canViewAudit = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DEATH_AUDIT_VIEW);

  const [deathCase, setDeathCase] = useState<DeathRegistrationCase | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [auditEvents, setAuditEvents] = useState<DemoAuditEvent[]>([]);
  const [tab, setTab] = useState<TabKey>("overview");

  const load = () => {
    if (!caseId || !canView) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(undefined);
    demoGetDeathRegistration(caseId)
      .then((found) => {
        if (!found) {
          setError("This death registration case was not found.");
          return;
        }
        setDeathCase(found);
        if (canViewAudit) {
          demoListCrvsAuditEvents({ targetRef: found.reference }).then((res) => setAuditEvents(res.data));
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Couldn't load this case."))
      .finally(() => setLoading(false));
  };

  useEffect(load, [caseId, canView, canViewAudit]);

  if (!canView) {
    return (
      <div className="crvs-page">
        <Empty icon="lock" title="You don't have access to this case" isFullScreen />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="crvs-page">
        <Empty icon="hourglass_empty" title="Loading case…" isFullScreen />
      </div>
    );
  }

  if (error || !deathCase) {
    return (
      <div className="crvs-page">
        <Empty
          icon="error"
          title="Couldn't open this case"
          description={error || "This death registration case was not found."}
          isFullScreen
          button={<Button text="Back to death registrations" appearance="ghost" onClick={() => navigate("/dashboard/crvs/death-registrations")} testId="dr-details-back" />}
        />
      </div>
    );
  }

  const c = deathCase;
  const coiReasons = deathConflictOfInterestReasons(currentAccountId, c);
  const jurisdictionOk = canAccessDeathCaseJurisdiction(c.jurisdiction);
  const riskFlags = [
    c.isLate && "Late",
    c.pathway === "MEDICO_LEGAL" && "Medico-legal",
    c.pathway === "UNIDENTIFIED" && "Unidentified",
    c.duplicateCheck && c.duplicateCheck.overallLevel !== "NONE" && `Duplicate: ${c.duplicateCheck.overallLevel}`,
    !jurisdictionOk && "Outside jurisdiction",
  ].filter(Boolean) as string[];

  return (
    <div className="crvs-page">
      <div className="crvs-section" style={{ position: "sticky", top: 0, zIndex: 2, background: "var(--surface-page)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 className="crvs-page-title">{c.reference}</h1>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <StatusBadge kind="deathRegistration" status={c.status} />
              <span>{deceasedDisplayName(c.deceased)}</span>
              <span>{c.jurisdiction}</span>
              <span>Owner: {c.reviewerName || c.officerName}</span>
              {riskFlags.map((f) => (
                <span key={f} className="crvs-status-pill crvs-status-warning">
                  {f}
                </span>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {(c.status === "DRAFT" || c.status === "CORRECTION_REQUIRED") && c.officerId === currentAccountId && (
              <Button text="Edit" appearance="primary" onClick={() => navigate(`/dashboard/crvs/death-registrations/${c.id}/edit`)} testId="dr-details-edit" />
            )}
            {(c.status === "SUBMITTED" || c.status === "UNDER_REVIEW" || c.status.endsWith("_REVIEW")) && hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DEATH_REGISTRATION_REVIEW) && (
              <Button text="Open in review" appearance="primary" onClick={() => navigate(`/dashboard/crvs/death-review/${c.id}`)} testId="dr-details-open-review" />
            )}
            {c.status === "REGISTERED" && (
              <Button text="View registered record" appearance="primary" onClick={() => navigate(`/dashboard/crvs/registered-deaths/${c.id}`)} testId="dr-details-view-registered" />
            )}
          </div>
        </div>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <nav className="review-section-nav" role="tablist">
        {TABS.map((t) => (
          <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} className={`crvs-tab ${tab === t.key ? "is-active" : ""}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "overview" && (
        <div className="crvs-section">
          <DescriptionList columns={3}>
            <DescriptionItem label="Reference" value={c.reference} />
            <DescriptionItem label="Pathway" value={PATHWAY_LABELS[c.pathway]} />
            <DescriptionItem label="Status" value={DEATH_REGISTRATION_STATUS_LABELS[c.status]} />
            <DescriptionItem label="Notification reference" value={c.notificationReference} />
            <DescriptionItem label="Date of death" value={formatDate(c.dateOfDeath)} />
            <DescriptionItem label="Date reported" value={formatDate(c.dateReported)} />
            <DescriptionItem label="Days after death" value={String(c.daysAfterDeath)} />
            <DescriptionItem label="Jurisdiction" value={c.jurisdiction} />
            <DescriptionItem label="Processing office" value={c.processingOfficeName} />
            <DescriptionItem label="Officer" value={c.officerName} />
            <DescriptionItem label="Reviewer" value={c.reviewerName} />
            <DescriptionItem label="Official death record number" value={c.officialDeathRecordNumber} />
          </DescriptionList>
          {coiReasons.length > 0 && (
            <div className="crvs-banner crvs-banner-warning" style={{ marginTop: 12 }}>
              <Icon name="warning" /> Conflict of interest for the current account: {coiReasons.join(" ")}
            </div>
          )}
        </div>
      )}

      {tab === "deceased" && (
        <div className="crvs-section">
          {c.deceased.identityStatus === "IDENTITY_UNKNOWN" ? (
            <p className="crvs-form-hint">{c.deceased.descriptivePhysicalSummary || "No description recorded."}</p>
          ) : (
            <dl className="review-readonly-fields">
              <Field label="Name" value={deceasedDisplayName(c.deceased)} />
              <Field label="Sex" value={c.deceased.sex} />
              <Field label="Date of birth" value={formatDate(c.deceased.dateOfBirth)} />
              <Field label="Estimated age" value={c.deceased.estimatedAge} />
              <Field label="Nationality" value={c.deceased.nationality || "—"} />
              <Field label="Residence" value={c.deceased.residence || "—"} />
              <Field label="Document" value={`${c.deceased.documentType || "—"} · ${maskDocumentNumber(c.deceased.documentNumber)}`} />
              <Field label="NIN" value={maskDocumentNumber(c.deceased.nin)} />
              <Field label="Verification" value={c.deceased.verification} />
            </dl>
          )}
        </div>
      )}

      {tab === "occurrence" && (
        <div className="crvs-section">
          <dl className="review-readonly-fields">
            <Field label="Date of death" value={formatDate(c.occurrence.dateOfDeath)} />
            <Field label="Time of death" value={c.occurrence.timeOfDeath || "—"} />
            <Field label="Place category" value={PLACE_CATEGORY_LABELS[c.occurrence.placeCategory]} />
            <Field label="Facility" value={c.occurrence.facilityName || "—"} />
            <Field label="Location" value={c.occurrence.location} />
            <Field label="Administrative location" value={c.occurrence.adminLocation} />
            <Field label="Jurisdiction" value={c.occurrence.jurisdiction} />
            <Field label="Circumstances" value={c.occurrence.circumstanceCategory.replace(/_/g, " ")} />
            <Field label="Circumstance note" value={c.occurrence.circumstanceNote || "—"} />
          </dl>
        </div>
      )}

      {tab === "medical" && (
        <div className="crvs-section">
          <RestrictedCauseOfDeathNotice cause={c.medicalCertification?.cause}>
            {c.medicalCertification?.isCertified ? (
              <dl className="review-readonly-fields">
                <Field label="Certifying facility" value={c.medicalCertification.certifyingFacilityName || "—"} />
                <Field label="Certifier" value={c.medicalCertification.certifierName || "—"} />
                <Field label="Certifier role" value={c.medicalCertification.certifierRole || "—"} />
                <Field label="Certificate reference" value={c.medicalCertification.certificateReferenceNumber || "—"} />
                <Field label="Date certified" value={formatDate(c.medicalCertification.dateCertified)} />
                <Field label="Manner of death" value={c.medicalCertification.cause.mannerOfDeath || "—"} />
                <Field label="Immediate cause" value={c.medicalCertification.cause.immediateCause || "—"} />
                <Field label="Antecedent cause" value={c.medicalCertification.cause.antecedentCause || "—"} />
                <Field label="Underlying cause" value={c.medicalCertification.cause.underlyingCause || "—"} />
              </dl>
            ) : (
              <p className="crvs-form-hint">This case has not been medically certified.</p>
            )}
          </RestrictedCauseOfDeathNotice>
        </div>
      )}

      {tab === "family" && (
        <div className="crvs-section">
          <h3 className="crvs-section-title">Declarant</h3>
          <dl className="review-readonly-fields">
            <Field label="Name" value={`${c.declarant.firstName} ${c.declarant.lastName}`} />
            <Field label="Relationship" value={c.declarant.relationship} />
            <Field label="Document" value={`${c.declarant.documentType} · ${maskDocumentNumber(c.declarant.documentNumber)}`} />
            <Field label="Phone" value={c.declarant.phone || "—"} />
            <Field label="Email" value={c.declarant.email || "—"} />
            <Field label="Verification" value={c.declarant.verification} />
          </dl>
          <h3 className="crvs-section-title" style={{ marginTop: 16 }}>Next of kin</h3>
          {c.nextOfKin.length === 0 ? (
            <p className="crvs-form-hint">No next of kin recorded.</p>
          ) : (
            c.nextOfKin.map((k, i) => (
              <dl className="review-readonly-fields" key={i} style={{ marginBottom: 8 }}>
                <Field label="Name" value={`${k.firstName} ${k.lastName}`} />
                <Field label="Relationship" value={k.relationship} />
                <Field label="Contact" value={k.phone || k.email || "—"} />
              </dl>
            ))
          )}
        </div>
      )}

      {tab === "witnesses" && (
        <div className="crvs-section">
          {c.witnesses.length === 0 ? (
            <p className="crvs-form-hint">No witnesses recorded on this case.</p>
          ) : (
            c.witnesses.map((w) => (
              <dl className="review-readonly-fields" key={w.id} style={{ marginBottom: 8 }}>
                <Field label="Name" value={`${w.firstName} ${w.lastName}`} />
                <Field label="Relationship" value={w.relationship} />
                <Field label="Basis of knowledge" value={w.basisOfKnowledge || "—"} />
                <Field label="Document" value={maskDocumentNumber(w.documentNumber)} />
                <Field label="Verification" value={w.verification} />
              </dl>
            ))
          )}
        </div>
      )}

      {tab === "evidence" && (
        <div className="crvs-section">
          {c.evidence.filter((e) => !e.removed).length === 0 ? (
            <p className="crvs-form-hint">No evidence attached.</p>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
              {c.evidence
                .filter((e) => !e.removed)
                .map((ev) => (
                  <li key={ev.id} className="crvs-banner crvs-banner-info">
                    <strong>{ev.documentType}</strong> — {ev.fileName} ({ev.fileType}, {ev.fileSizeKb}KB)
                    <div className="crvs-form-hint">Uploaded {formatDateTime(ev.uploadedAt)} by {ev.uploadedBy} · {ev.verification}</div>
                  </li>
                ))}
            </ul>
          )}
        </div>
      )}

      {tab === "identity" && (
        <div className="crvs-section">
          <h3 className="crvs-section-title">SDID identity match</h3>
          {!c.identityMatch ? (
            <p className="crvs-form-hint">No identity match has been run.</p>
          ) : (
            <dl className="review-readonly-fields">
              <Field label="Match level" value={c.identityMatch.matchLevel.replace(/_/g, " ")} />
              <Field label="Confidence" value={c.identityMatch.confidenceScore} />
              <Field label="Requires manual review" value={c.identityMatch.requiresManualReview ? "Yes" : "No"} />
            </dl>
          )}
          <h3 className="crvs-section-title" style={{ marginTop: 16 }}>Duplicate check</h3>
          {!c.duplicateCheck ? (
            <p className="crvs-form-hint">No duplicate check has been run.</p>
          ) : (
            <>
              <p className="crvs-form-hint">Overall level: {c.duplicateCheck.overallLevel}</p>
              <ul style={{ margin: "8px 0", paddingLeft: 20 }}>
                {c.duplicateCheck.candidates.map((cand) => (
                  <li key={cand.caseId}>{cand.reference} — {cand.matchLevel} ({cand.matchedFields.join(", ")})</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {tab === "review" && (
        <div className="crvs-section">
          {c.reviewDecisions.length === 0 ? (
            <p className="crvs-form-hint">No review decisions recorded yet.</p>
          ) : (
            c.reviewDecisions.map((d, i) => (
              <div key={i} className="crvs-banner crvs-banner-info" style={{ marginBottom: 8 }}>
                <strong>{d.type.replace(/_/g, " ")}</strong> by {d.decidedBy} — {formatDateTime(d.decidedAt)}
                {d.reason ? ` — ${d.reason}` : ""}
              </div>
            ))
          )}
          {c.correctionRequests.length > 0 && (
            <>
              <h3 className="crvs-section-title" style={{ marginTop: 16 }}>Correction requests</h3>
              {c.correctionRequests.map((cr) => (
                <div key={cr.id} className="crvs-banner crvs-banner-warning" style={{ marginBottom: 8 }}>
                  Requested by {cr.requestedBy} — {formatDateTime(cr.requestedAt)} {cr.resolvedAt ? `(resolved ${formatDateTime(cr.resolvedAt)})` : "(open)"}
                  <ul style={{ margin: "6px 0 0", paddingLeft: 20 }}>
                    {cr.items.map((item) => (
                      <li key={item.id}>{item.section}: {item.reason}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {tab === "sdid" && (
        <div className="crvs-section">
          <div className="crvs-review-section-header">
            <strong>Status</strong>
            <StatusBadge kind="deathSync" status={c.sdid.status} />
          </div>
          <DescriptionList columns={3}>
            <DescriptionItem label="Attempts" value={c.sdid.attempts.length} />
            <DescriptionItem label="Last attempt" value={c.sdid.lastAttemptAt ? formatDateTime(c.sdid.lastAttemptAt) : "—"} />
            <DescriptionItem label="Linked NIN" value={c.sdid.status === "IDENTITY_MARKED_DECEASED" ? c.sdid.linkedNin : undefined} />
          </DescriptionList>
          {c.status === "REGISTERED" && (
            <Button text="View full synchronization detail" appearance="ghost" onClick={() => navigate(`/dashboard/crvs/registered-deaths/${c.id}`)} testId="dr-details-view-sync" styles={{ marginTop: 12 }} />
          )}
        </div>
      )}

      {tab === "timeline" && (
        <div className="crvs-section">
          <div className="crvs-timeline">
            {c.statusHistory.map((entry, i) => (
              <span key={`${entry.status}-${i}`} className="crvs-timeline-item is-reached">
                <span className="crvs-timeline-dot" />
                {DEATH_REGISTRATION_STATUS_LABELS[entry.status]} · {formatDateTime(entry.at)} · {entry.by}
                {entry.note ? ` — ${entry.note}` : ""}
              </span>
            ))}
          </div>
        </div>
      )}

      {tab === "audit" && (
        <div className="crvs-section">
          {!canViewAudit ? (
            <p className="crvs-form-hint">You don't have access to audit history.</p>
          ) : auditEvents.length === 0 ? (
            <p className="crvs-form-hint">No audit events recorded for this case yet.</p>
          ) : (
            <div className="review-audit-list">
              {auditEvents.map((ev) => (
                <div key={ev.id} className="review-audit-item">
                  <strong>{ev.actor}</strong> {ev.action} — {formatDateTime(ev.at)}
                  {ev.details && <div className="crvs-form-hint">{ev.details}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
