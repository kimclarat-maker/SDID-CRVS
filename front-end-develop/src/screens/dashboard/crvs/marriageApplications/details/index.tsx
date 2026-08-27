import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Empty from "@/components/empty";
import Button from "@/components/button";
import Icon from "@/components/icon";
import { DescriptionList, DescriptionItem } from "@/components/descriptionList";
import StatusBadge from "../../components/StatusBadge";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { hasWorkspacePermission, getCurrentAccountId } from "@/utils/workspace";
import { demoGetMarriageApplication } from "@/demo/services/crvsMarriageApplications";
import { demoGetMarriageAppointment } from "@/demo/services/crvsMarriageAppointments";
import { demoGetMarriageCeremony } from "@/demo/services/crvsMarriageCeremony";
import { demoListCrvsAuditEvents } from "@/demo/services/crvsAudit";
import { MARRIAGE_APPLICATION_STATUS_LABELS, MARRIAGE_APPOINTMENT_STATUS_LABELS, MARRIAGE_CEREMONY_OUTCOME_LABELS } from "@/domain/crvs/statusMachines";
import { MarriageApplication, MarriageAppointment, MarriageCeremony } from "@/domain/crvs/types";
import { DemoAuditEvent } from "@/demo/types";
import { applicantDisplayName, maskDocumentNumber, formatDateTime, formatDate, currencyLabel, CIVIL_STATUS_LABELS } from "../../marriageShared";
import { marriageConflictOfInterestReasons, canAccessMarriageCaseJurisdiction } from "@/utils/workspace/crvsRules";
import "../../shared.css";

type TabKey = "overview" | "applicant1" | "applicant2" | "proposed" | "eligibility" | "evidence" | "witnesses" | "payment" | "review" | "appointment" | "ceremony" | "sdid" | "timeline" | "audit";

const TABS: { key: TabKey; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "applicant1", label: "Applicant 1" },
  { key: "applicant2", label: "Applicant 2" },
  { key: "proposed", label: "Proposed marriage" },
  { key: "eligibility", label: "Eligibility" },
  { key: "evidence", label: "Evidence" },
  { key: "witnesses", label: "Witnesses" },
  { key: "payment", label: "Payment" },
  { key: "review", label: "Review" },
  { key: "appointment", label: "Appointment" },
  { key: "ceremony", label: "Ceremony" },
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

function ApplicantFields({ applicant }: { applicant: MarriageApplication["applicant1"] }) {
  return (
    <dl className="review-readonly-fields">
      <Field label="Name" value={applicantDisplayName(applicant)} />
      <Field label="Sex" value={applicant.sex} />
      <Field label="Date of birth" value={formatDate(applicant.dateOfBirth)} />
      <Field label="Nationality" value={applicant.nationality || "—"} />
      <Field label="Nationality category" value={applicant.nationalityCategory} />
      <Field label="Residence" value={applicant.residence || "—"} />
      <Field label="Contact" value={applicant.phone || applicant.email || "—"} />
      <Field label="Document" value={`${applicant.documentType} · ${maskDocumentNumber(applicant.documentNumber)}`} />
      <Field label="Civil status" value={CIVIL_STATUS_LABELS[applicant.civilStatus]} />
      <Field label="Identity verification" value={applicant.verification} />
      {applicant.partnerConfirmationStatus !== "NOT_REQUIRED" && <Field label="Partner confirmation" value={applicant.partnerConfirmationStatus} />}
    </dl>
  );
}

export default function MarriageApplicationDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentAccountId = getCurrentAccountId();

  const canView = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_APPLICATION_VIEW);
  const canViewAudit = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_AUDIT_VIEW);

  const [application, setApplication] = useState<MarriageApplication | undefined>();
  const [appointment, setAppointment] = useState<MarriageAppointment | undefined>();
  const [ceremony, setCeremony] = useState<MarriageCeremony | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [auditEvents, setAuditEvents] = useState<DemoAuditEvent[]>([]);
  const [tab, setTab] = useState<TabKey>("overview");

  const load = () => {
    if (!id || !canView) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(undefined);
    demoGetMarriageApplication(id)
      .then((found) => {
        if (!found) {
          setError("This marriage application was not found.");
          return;
        }
        setApplication(found);
        if (found.appointmentId) demoGetMarriageAppointment(found.appointmentId).then(setAppointment);
        if (found.ceremonyId) setCeremony(demoGetMarriageCeremony(found.ceremonyId));
        if (canViewAudit) demoListCrvsAuditEvents({ targetRef: found.reference }).then((res) => setAuditEvents(res.data));
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Couldn't load this application."))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id, canView, canViewAudit]);

  if (!canView) {
    return (
      <div className="crvs-page">
        <Empty icon="lock" title="You don't have access to this application" isFullScreen />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="crvs-page">
        <Empty icon="hourglass_empty" title="Loading application…" isFullScreen />
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="crvs-page">
        <Empty
          icon="error"
          title="Couldn't open this application"
          description={error || "This marriage application was not found."}
          isFullScreen
          button={<Button text="Back to marriage applications" appearance="ghost" onClick={() => navigate("/dashboard/crvs/marriage-applications")} testId="mr-details-back" />}
        />
      </div>
    );
  }

  const a = application;
  const coiReasons = marriageConflictOfInterestReasons(currentAccountId, a);
  const jurisdictionOk = canAccessMarriageCaseJurisdiction(a.jurisdiction);
  const riskFlags = [
    a.duplicateCheck && a.duplicateCheck.overallLevel !== "NONE" && `Duplicate: ${a.duplicateCheck.overallLevel}`,
    a.eligibility?.existingMarriageConflicts.length ? "Existing-marriage conflict" : undefined,
    a.objection?.status === "PENDING" && "Objection pending",
    a.exception?.status === "OPEN" && `Exception: ${a.exception.type}`,
    !jurisdictionOk && "Outside jurisdiction",
  ].filter(Boolean) as string[];

  return (
    <div className="crvs-page">
      <div className="crvs-section" style={{ position: "sticky", top: 0, zIndex: 2, background: "var(--surface-page)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 className="crvs-page-title">{a.reference}</h1>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <StatusBadge kind="marriageApplication" status={a.status} />
              <span>{applicantDisplayName(a.applicant1)} &amp; {applicantDisplayName(a.applicant2)}</span>
              <span>{formatDate(a.proposedMarriageDate)}</span>
              <span>{a.officeName}</span>
              <span>Owner: {a.reviewerName || a.officerName}</span>
              {riskFlags.map((f) => (
                <span key={f} className="crvs-status-pill crvs-status-warning">{f}</span>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {(a.status === "DRAFT" || a.status === "CORRECTION_REQUIRED") && a.officerId === currentAccountId && (
              <Button text="Edit" appearance="primary" onClick={() => navigate(`/dashboard/crvs/marriage-applications/${a.id}/edit`)} testId="mr-details-edit" />
            )}
            {(a.status === "SUBMITTED" || a.status === "RESUBMITTED" || a.status === "ELIGIBILITY_REVIEW") && hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_APPLICATION_REVIEW) && (
              <Button text="Open in review" appearance="primary" onClick={() => navigate(`/dashboard/crvs/marriage-review/${a.id}`)} testId="mr-details-open-review" />
            )}
            {a.status === "APPROVED" && hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_APPOINTMENT_CREATE) && (
              <Button text="Schedule appointment" appearance="primary" onClick={() => navigate(`/dashboard/crvs/marriage-appointments/calendar?applicationId=${a.id}`)} testId="mr-details-schedule" />
            )}
            {a.appointmentId && hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_APPOINTMENT_VIEW) && (
              <Button text="View appointment" appearance="ghost" onClick={() => navigate(`/dashboard/crvs/marriage-appointments/${a.appointmentId}`)} testId="mr-details-view-appointment" />
            )}
            {a.status === "REGISTERED" && (
              <Button text="View registered record" appearance="primary" onClick={() => navigate(`/dashboard/crvs/registered-marriages/${a.id}`)} testId="mr-details-view-registered" />
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
            <DescriptionItem label="Reference" value={a.reference} />
            <DescriptionItem label="Status" value={MARRIAGE_APPLICATION_STATUS_LABELS[a.status]} />
            <DescriptionItem label="Office" value={a.officeName} />
            <DescriptionItem label="Office type" value={a.officeType.replace(/_/g, " ")} />
            <DescriptionItem label="Jurisdiction" value={a.jurisdiction} />
            <DescriptionItem label="Proposed marriage date" value={formatDate(a.proposedMarriageDate)} />
            <DescriptionItem label="Ceremony type" value={a.ceremonyType.replace(/_/g, " ")} />
            <DescriptionItem label="Property regime" value={a.propertyRegime?.replace(/_/g, " ")} />
            <DescriptionItem label="Special-day request" value={a.isSpecialDayRequest ? "Yes" : "No"} />
            <DescriptionItem label="Officer" value={a.officerName} />
            <DescriptionItem label="Reviewer" value={a.reviewerName} />
          </DescriptionList>
          {coiReasons.length > 0 && (
            <div className="crvs-banner crvs-banner-warning" style={{ marginTop: 12 }}>
              <Icon name="warning" /> Conflict of interest for the current account: {coiReasons.join(" ")}
            </div>
          )}
        </div>
      )}

      {tab === "applicant1" && <div className="crvs-section"><ApplicantFields applicant={a.applicant1} /></div>}
      {tab === "applicant2" && <div className="crvs-section"><ApplicantFields applicant={a.applicant2} /></div>}

      {tab === "proposed" && (
        <div className="crvs-section">
          <dl className="review-readonly-fields">
            <Field label="Proposed date" value={formatDate(a.proposedMarriageDate)} />
            <Field label="Preferred time window" value={a.preferredTimeWindow || "—"} />
            <Field label="Ceremony type" value={a.ceremonyType.replace(/_/g, " ")} />
            <Field label="Property regime" value={a.propertyRegime?.replace(/_/g, " ") || "Not specified"} />
            <Field label="Accessibility note" value={a.languageOrAccessibilityNote || "—"} />
          </dl>
        </div>
      )}

      {tab === "eligibility" && (
        <div className="crvs-section">
          {!a.eligibility ? (
            <p className="crvs-form-hint">No eligibility check has been run.</p>
          ) : (
            <>
              <p className="crvs-form-hint">Overall outcome: <strong>{a.eligibility.overallOutcome}</strong></p>
              <ul style={{ margin: "8px 0", paddingLeft: 20 }}>
                {a.eligibility.results.map((r) => (
                  <li key={r.rule}>{r.rule.replace(/_/g, " ")}: {r.passed ? "Passed" : `${r.severity} — ${r.message}`}</li>
                ))}
              </ul>
              {a.eligibility.existingMarriageConflicts.length > 0 && (
                <>
                  <h3 className="crvs-section-title">Existing-marriage conflicts</h3>
                  {a.eligibility.existingMarriageConflicts.map((c, i) => (
                    <div key={i} className="crvs-form-hint">{c.spouseRole}: {c.candidate.maskedSummary}</div>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      )}

      {tab === "evidence" && (
        <div className="crvs-section">
          {a.evidence.filter((e) => !e.removed).length === 0 ? (
            <p className="crvs-form-hint">No evidence attached.</p>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
              {a.evidence.filter((e) => !e.removed).map((ev) => (
                <li key={ev.id} className="crvs-banner crvs-banner-info">
                  <strong>{ev.documentType}</strong> — {ev.fileName} ({ev.fileType}, {ev.fileSizeKb}KB)
                  <div className="crvs-form-hint">Uploaded {formatDateTime(ev.uploadedAt)} by {ev.uploadedBy} · {ev.verification}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === "witnesses" && (
        <div className="crvs-section">
          {a.witnesses.filter((w) => !w.replaced).length === 0 ? (
            <p className="crvs-form-hint">No witnesses recorded.</p>
          ) : (
            a.witnesses.filter((w) => !w.replaced).map((w) => (
              <dl className="review-readonly-fields" key={w.id} style={{ marginBottom: 8 }}>
                <Field label="Name" value={`${w.firstName} ${w.lastName}`} />
                <Field label="For" value={w.spouseRole} />
                <Field label="Relationship" value={w.relationship} />
                <Field label="Date of birth" value={formatDate(w.dateOfBirth)} />
                <Field label="Verification" value={w.verification} />
              </dl>
            ))
          )}
        </div>
      )}

      {tab === "payment" && (
        <div className="crvs-section">
          <dl className="review-readonly-fields">
            <Field label="Status" value={a.payment.status.replace(/_/g, " ")} />
            <Field label="Amount" value={currencyLabel(a.payment.amount, a.payment.currency)} />
            <Field label="Special-day fee" value={a.payment.isSpecialDayFee ? "Yes" : "No"} />
            <Field label="Method" value={a.payment.method || "—"} />
            <Field label="Reference" value={a.payment.reference || "—"} />
            <Field label="Paid at" value={a.payment.paidAt ? formatDateTime(a.payment.paidAt) : "—"} />
          </dl>
        </div>
      )}

      {tab === "review" && (
        <div className="crvs-section">
          {a.reviewDecisions.length === 0 ? (
            <p className="crvs-form-hint">No review decisions recorded yet.</p>
          ) : (
            a.reviewDecisions.map((d, i) => (
              <div key={i} className="crvs-banner crvs-banner-info" style={{ marginBottom: 8 }}>
                <strong>{d.type.replace(/_/g, " ")}</strong> by {d.decidedBy} — {formatDateTime(d.decidedAt)}
                {d.reason ? ` — ${d.reason}` : ""}
              </div>
            ))
          )}
          {a.correctionRequests.length > 0 && (
            <>
              <h3 className="crvs-section-title" style={{ marginTop: 16 }}>Correction requests</h3>
              {a.correctionRequests.map((cr) => (
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

      {tab === "appointment" && (
        <div className="crvs-section">
          {!appointment ? (
            <p className="crvs-form-hint">No appointment scheduled yet.</p>
          ) : (
            <dl className="review-readonly-fields">
              <Field label="Reference" value={appointment.reference} />
              <Field label="Status" value={MARRIAGE_APPOINTMENT_STATUS_LABELS[appointment.status]} />
              <Field label="Office" value={appointment.officeName} />
              <Field label="Date" value={formatDate(appointment.date)} />
              <Field label="Time slot" value={appointment.timeSlot} />
              <Field label="Special day" value={appointment.isSpecialDay ? "Yes" : "No"} />
              <Field label="Officiant" value={appointment.officiantName || "Unassigned"} />
            </dl>
          )}
        </div>
      )}

      {tab === "ceremony" && (
        <div className="crvs-section">
          {!ceremony ? (
            <p className="crvs-form-hint">No ceremony record yet.</p>
          ) : (
            <dl className="review-readonly-fields">
              <Field label="Outcome" value={MARRIAGE_CEREMONY_OUTCOME_LABELS[ceremony.outcome]} />
              <Field label="Officiant" value={ceremony.officiantName || "—"} />
              <Field label="Applicant 1 checked in" value={ceremony.applicant1CheckedIn ? "Yes" : "No"} />
              <Field label="Applicant 2 checked in" value={ceremony.applicant2CheckedIn ? "Yes" : "No"} />
              <Field label="Witnesses checked in" value={`${ceremony.witnessCheckIns.filter((w) => w.checkedIn).length}/${ceremony.witnessCheckIns.length}`} />
              <Field label="Consent" value={ceremony.consent.applicant1Consented && ceremony.consent.applicant2Consented ? "Both consented" : ceremony.consent.declinedBy ? `Declined by ${ceremony.consent.declinedBy}` : "Pending"} />
            </dl>
          )}
        </div>
      )}

      {tab === "sdid" && (
        <div className="crvs-section">
          <div className="crvs-review-section-header">
            <strong>Status</strong>
            <StatusBadge kind="marriageSync" status={a.sdid.status} />
          </div>
          <DescriptionList columns={2}>
            <DescriptionItem label="Applicant 1 sync" value={a.sdid.applicant1.status.replace(/_/g, " ")} />
            <DescriptionItem label="Applicant 2 sync" value={a.sdid.applicant2.status.replace(/_/g, " ")} />
          </DescriptionList>
          {a.status === "REGISTERED" && (
            <Button text="View full synchronization detail" appearance="ghost" onClick={() => navigate(`/dashboard/crvs/registered-marriages/${a.id}`)} testId="mr-details-view-sync" styles={{ marginTop: 12 }} />
          )}
        </div>
      )}

      {tab === "timeline" && (
        <div className="crvs-section">
          <div className="crvs-timeline">
            {a.statusHistory.map((entry, i) => (
              <span key={`${entry.status}-${i}`} className="crvs-timeline-item is-reached">
                <span className="crvs-timeline-dot" />
                {MARRIAGE_APPLICATION_STATUS_LABELS[entry.status]} · {formatDateTime(entry.at)} · {entry.by}
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
            <p className="crvs-form-hint">No audit events recorded for this application yet.</p>
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
