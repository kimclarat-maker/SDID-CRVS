import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Empty from "@/components/empty";
import Button from "@/components/button";
import Icon from "@/components/icon";
import { DescriptionList, DescriptionItem } from "@/components/descriptionList";
import WarningModal from "@/components/crvs/modals/WarningModal";
import StatusBadge from "../../components/StatusBadge";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { getCurrentActorName, hasWorkspacePermission } from "@/utils/workspace";
import { demoGetDivorceRegistration } from "@/demo/services/crvsDivorceRegistrations";
import { demoListCrvsAuditEvents } from "@/demo/services/crvsAudit";
import { DivorceSpouseKey } from "@/demo/services/crvsDivorceSdidSync";
import { DemoAuditEvent } from "@/demo/types";
import { DIVORCE_REGISTRATION_STATUS_LABELS, DIVORCE_SPOUSE_SYNC_STATUS_LABELS } from "@/domain/crvs/statusMachines";
import { DivorceRegistration, DivorceSpouseSdidSyncStatus, FormerSpouse } from "@/domain/crvs/types";
import toastMessage from "@/utils/common/toastMessage";
import {
  CERTIFICATE_ELIGIBILITY_LABELS,
  DIVORCE_DECISION_TYPE_LABELS,
  DIVORCE_SOURCE_LABELS,
  formatDate,
  formatDateTime,
  formerSpouseDisplayName,
  formerSpousesLabel,
  marriageReferenceLabel,
  maskDocumentNumber,
} from "../../divorceShared";
import {
  DivorceCertificateEligibilityModal,
  DivorceManualReviewModal,
  ReportDivorceRecordErrorModal,
  RetryAllDivorceSyncModal,
  RetryDivorceSyncModal,
} from "../components/modals/DivorceSyncModals";
import "../../shared.css";
import "../../review/review.css";

const SPOUSE_SYNC_TONE: Record<DivorceSpouseSdidSyncStatus, string> = {
  NOT_READY: "neutral",
  PENDING: "info",
  IN_PROGRESS: "info",
  IDENTITY_UPDATED: "success",
  FAILED: "danger",
  MANUAL_REVIEW: "warning",
};

function SpouseSyncCard({
  label,
  spouse,
  status,
  linkedNin,
  linkedIdentityId,
  lastAttemptAt,
  lastFailureCode,
  attempts,
  canRetry,
  canViewIdentity,
  onRetry,
  onAssignReview,
  onViewIdentity,
}: {
  label: string;
  spouse: FormerSpouse;
  status: DivorceSpouseSdidSyncStatus;
  linkedNin?: string;
  linkedIdentityId?: string;
  lastAttemptAt?: string;
  lastFailureCode?: string;
  attempts: number;
  canRetry: boolean;
  canViewIdentity: boolean;
  onRetry: () => void;
  onAssignReview: () => void;
  onViewIdentity: () => void;
}) {
  const actionable = status === "FAILED" || status === "MANUAL_REVIEW";
  return (
    <div className="crvs-review-section">
      <div className="crvs-review-section-header">
        <strong>{label}</strong>
        <span className={`crvs-status-pill crvs-status-${SPOUSE_SYNC_TONE[status]}`}>{DIVORCE_SPOUSE_SYNC_STATUS_LABELS[status]}</span>
      </div>
      <p className="crvs-form-hint">{formerSpouseDisplayName(spouse)}</p>
      <DescriptionList columns={2}>
        <DescriptionItem label="Last attempt" value={lastAttemptAt ? formatDateTime(lastAttemptAt) : "—"} />
        <DescriptionItem label="Attempts" value={String(attempts)} />
        <DescriptionItem label="Linked NIN" value={status === "IDENTITY_UPDATED" ? linkedNin : undefined} />
        <DescriptionItem label="Linked identity" value={status === "IDENTITY_UPDATED" ? linkedIdentityId : undefined} />
      </DescriptionList>
      {lastFailureCode && status !== "IDENTITY_UPDATED" && (
        <p className="crvs-form-hint" style={{ marginTop: 8 }}>
          Last failure code: <strong>{lastFailureCode}</strong>
        </p>
      )}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
        {actionable && (
          <Button
            text="Retry"
            size="sm"
            appearance="primary"
            type="button"
            disabled={!canRetry}
            onClick={onRetry}
            testId={`registered-divorce-retry-${label.toLowerCase().replace(/\s+/g, "-")}`}
          />
        )}
        {actionable && (
          <Button
            text="Assign manual review"
            size="sm"
            appearance="ghost"
            type="button"
            disabled={!canRetry}
            onClick={onAssignReview}
            testId={`registered-divorce-manual-review-${label.toLowerCase().replace(/\s+/g, "-")}`}
          />
        )}
        <Button
          text="View former spouse in SDID"
          size="sm"
          appearance="ghost"
          type="button"
          disabled={!canViewIdentity}
          onClick={onViewIdentity}
          testId={`registered-divorce-view-identity-${label.toLowerCase().replace(/\s+/g, "-")}`}
        />
      </div>
      {actionable && !canRetry && (
        <p className="crvs-form-hint" style={{ marginTop: 8 }}>
          You have view-only access to this synchronization record — retrying requires divorce-sdid-sync-retry access.
        </p>
      )}
      {!canViewIdentity && (
        <p className="crvs-form-hint" style={{ marginTop: 8 }}>
          No SDID identity is linked for this former spouse yet, so there is nothing to open.
        </p>
      )}
    </div>
  );
}

/**
 * Registered divorce record (spec §21/§22) — visibly and structurally
 * read-only: no edit control appears anywhere on this page. The permitted
 * actions are all either navigation, a synchronization retry, an eligibility
 * check, a generated acknowledgement download, or an audit-recorded error
 * report; none of them alters the registered record.
 */
export default function RegisteredDivorceDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const actorName = getCurrentActorName();

  const canView = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_REGISTERED_VIEW);
  const canViewSync = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_SDID_SYNC_VIEW);
  const canRetry = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_SDID_SYNC_RETRY);
  const canRequestCertificate = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_CERTIFICATE_REQUEST);
  const canViewAudit = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_AUDIT_VIEW);

  const [registration, setRegistration] = useState<DivorceRegistration | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [auditEvents, setAuditEvents] = useState<DemoAuditEvent[]>([]);

  const [retryTarget, setRetryTarget] = useState<DivorceSpouseKey | undefined>();
  const [manualReviewTarget, setManualReviewTarget] = useState<DivorceSpouseKey | undefined>();
  const [showRetryAll, setShowRetryAll] = useState(false);
  const [showEligibility, setShowEligibility] = useState(false);
  const [showCertNotWired, setShowCertNotWired] = useState(false);
  const [showRecordNotWired, setShowRecordNotWired] = useState(false);
  const [showReportError, setShowReportError] = useState(false);
  const [identityNotice, setIdentityNotice] = useState<string | undefined>();

  const load = useCallback(async () => {
    if (!id || !canView) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(undefined);
    try {
      const found = await demoGetDivorceRegistration(id);
      if (!found) {
        setError("This divorce record was not found.");
        setRegistration(undefined);
        return;
      }
      setRegistration(found);
      if (canViewAudit) {
        const res = await demoListCrvsAuditEvents({ targetRef: found.reference, limit: 200 });
        setAuditEvents(res.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load this record.");
    } finally {
      setLoading(false);
    }
  }, [id, canView, canViewAudit]);

  useEffect(() => {
    load();
  }, [load]);

  if (!canView) {
    return (
      <div className="crvs-page">
        <Empty icon="lock" title="You don't have access to registered divorces" description="Viewing registered divorces requires divorce-registered-view access." isFullScreen />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="crvs-page">
        <Empty icon="hourglass_empty" title="Loading registered divorce…" isFullScreen />
      </div>
    );
  }

  if (error || !registration) {
    return (
      <div className="crvs-page">
        <Empty
          icon="error"
          title="Couldn't open this record"
          description={error || "This divorce record was not found."}
          isFullScreen
          button={<Button text="Back to registered divorces" appearance="ghost" type="button" onClick={() => navigate("/dashboard/crvs/registered-divorces")} testId="rd-details-back" />}
        />
      </div>
    );
  }

  if (registration.status !== "REGISTERED" || !registration.registrationEvent) {
    return (
      <div className="crvs-page">
        <Empty
          icon="hourglass_empty"
          title="This divorce has not been registered yet"
          description={`Current status: ${DIVORCE_REGISTRATION_STATUS_LABELS[registration.status]}.`}
          button={<Button text="Open the case" appearance="ghost" type="button" onClick={() => navigate(`/dashboard/crvs/divorce-registrations/${registration.id}`)} testId="rd-details-open-case" />}
        />
      </div>
    );
  }

  const r = registration;
  const event = r.registrationEvent!;

  const openIdentity = (spouse: FormerSpouse) => {
    if (!spouse.sdidIdentityId) {
      setIdentityNotice("No SDID identity is linked to this former spouse, so there is no identity record to open.");
      return;
    }
    // The SDID identity surface isn't part of the CRVS workspace routes this
    // module owns; surface the linked identity reference rather than guessing
    // at a route that may not exist.
    setIdentityNotice(`Linked SDID identity: ${spouse.sdidIdentityId}${spouse.nin ? ` (NIN ${maskDocumentNumber(spouse.nin)})` : ""}.`);
  };

  const downloadAcknowledgement = () => {
    const lines = [
      "DIVORCE REGISTRATION ACKNOWLEDGEMENT",
      "Demo data — fictional. Not a legal document.",
      "",
      `Divorce registration number: ${event.registrationNumber}`,
      `Case reference:              ${r.reference}`,
      `Registration date:           ${formatDate(event.registeredAt)}`,
      `Effective date:              ${formatDate(event.effectiveDate)}`,
      `Registering office:          ${event.officeName}`,
      `Civil Registrar:             ${event.registeredByName}`,
      "",
      `Court or authority:          ${r.judgment.courtOrAuthorityName}`,
      `Court case number:           ${event.courtCaseNumber}`,
      `Judgment number:             ${event.judgmentNumber}`,
      `Decision type:               ${DIVORCE_DECISION_TYPE_LABELS[r.judgment.decisionType]}`,
      "",
      `Existing marriage reference: ${event.marriageRegistrationReference || marriageReferenceLabel(r)}`,
      `Former spouse one:           ${formerSpouseDisplayName(r.formerSpouse1)}`,
      `Former spouse two:           ${formerSpouseDisplayName(r.formerSpouse2)}`,
      "",
      `Source:                      ${DIVORCE_SOURCE_LABELS[r.source]}`,
      `Generated:                   ${new Date().toLocaleString()}`,
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${event.registrationNumber}-acknowledgement.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    toastMessage("success", "Registration acknowledgement downloaded.");
  };

  const failedCount = (["spouse1", "spouse2"] as DivorceSpouseKey[]).filter((key) => r.sdid[key].status === "FAILED").length;

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">Registered divorce</h1>
        <p className="crvs-page-subtitle">
          {formerSpousesLabel(r)} — divorce {event.registrationNumber} is officially registered. This record is read-only.
        </p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <div className="crvs-banner crvs-banner-info">
        <Icon name="lock" />
        <span>
          The registered record is read-only and cannot be edited from this screen. A legal change must go through the CRVS correction or rectification workflow — the original marriage record is likewise
          preserved, never deleted.
        </span>
      </div>

      <div className="crvs-section">
        <h2 className="crvs-section-title">Registration event</h2>
        <DescriptionList columns={3}>
          <DescriptionItem label="Divorce registration number" value={event.registrationNumber} />
          <DescriptionItem label="Registration date" value={formatDateTime(event.registeredAt)} />
          <DescriptionItem label="Effective date" value={formatDate(event.effectiveDate)} />
          <DescriptionItem label="Registering office" value={event.officeName} />
          <DescriptionItem label="Civil Registrar" value={event.registeredByName} />
          <DescriptionItem label="Source" value={DIVORCE_SOURCE_LABELS[r.source]} />
          <DescriptionItem label="Case reference" value={r.reference} />
          <DescriptionItem label="Source notification" value={r.sourceNotificationReference} />
          <DescriptionItem label="Jurisdiction" value={r.jurisdiction} />
        </DescriptionList>
      </div>

      <div className="crvs-section">
        <h2 className="crvs-section-title">Court decision</h2>
        <DescriptionList columns={3}>
          <DescriptionItem label="Court or authority" value={r.judgment.courtOrAuthorityName} />
          <DescriptionItem label="Court case number" value={event.courtCaseNumber} />
          <DescriptionItem label="Judgment number" value={event.judgmentNumber} />
          <DescriptionItem label="Judgment date" value={formatDate(r.judgment.judgmentDate)} />
          <DescriptionItem label="Final on" value={r.judgment.finalityDate ? formatDate(r.judgment.finalityDate) : "Not reported"} />
          <DescriptionItem label="Decision type" value={DIVORCE_DECISION_TYPE_LABELS[r.judgment.decisionType]} />
          <DescriptionItem label="Country" value={r.judgment.country} />
          <DescriptionItem label="Foreign decision" value={r.judgment.isForeign ? "Yes" : "No"} />
        </DescriptionList>
        <p className="crvs-form-hint" style={{ marginTop: 8 }}>
          Decision summary: a divorce granted by {r.judgment.courtOrAuthorityName || "the recorded authority"} under judgment {event.judgmentNumber}, effective {formatDate(event.effectiveDate)}. Grounds,
          custody, maintenance and property division are never recorded by this system.
        </p>
      </div>

      <div className="crvs-section">
        <h2 className="crvs-section-title">Former spouses</h2>
        <DescriptionList columns={2}>
          <DescriptionItem label="Former spouse one" value={`${event.formerSpouse1Summary.firstName || ""} ${event.formerSpouse1Summary.lastName || ""}`.trim() || formerSpouseDisplayName(r.formerSpouse1)} />
          <DescriptionItem label="Former spouse two" value={`${event.formerSpouse2Summary.firstName || ""} ${event.formerSpouse2Summary.lastName || ""}`.trim() || formerSpouseDisplayName(r.formerSpouse2)} />
          <DescriptionItem label="Former spouse one document" value={maskDocumentNumber(r.formerSpouse1.documentNumber)} />
          <DescriptionItem label="Former spouse two document" value={maskDocumentNumber(r.formerSpouse2.documentNumber)} />
        </DescriptionList>
      </div>

      <div className="crvs-section">
        <h2 className="crvs-section-title">Existing marriage record</h2>
        <DescriptionList columns={3}>
          <DescriptionItem label="Marriage reference" value={event.marriageRegistrationReference || marriageReferenceLabel(r)} />
          <DescriptionItem label="Marriage record update" value={r.marriageStatusUpdate ? `${r.marriageStatusUpdate.newStatus.replace(/_/g, " ").toLowerCase()} on ${formatDate(r.marriageStatusUpdate.updatedAt)}` : "Not applied"} />
          <DescriptionItem label="Update applied" value={r.marriageStatusUpdate?.applied ? "Yes" : "No"} />
        </DescriptionList>
        <p className="crvs-form-hint" style={{ marginTop: 8 }}>
          The marriage record is annotated as dissolved by this divorce. Its original registration data is preserved in full and is never overwritten or deleted.
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
          {r.marriageStatusUpdate?.marriageApplicationId ? (
            <Button
              text="View marriage"
              appearance="ghost"
              type="button"
              onClick={() => navigate(`/dashboard/crvs/marriage-applications/${r.marriageStatusUpdate!.marriageApplicationId}`)}
              testId="rd-view-marriage"
            />
          ) : (
            <span className="crvs-form-hint">
              No linked marriage application record to open — reference on file: {event.marriageRegistrationReference || marriageReferenceLabel(r)}.
            </span>
          )}
        </div>
      </div>

      <div className="crvs-section">
        <div className="crvs-review-section-header">
          <strong>SDID synchronization status</strong>
          <StatusBadge kind="divorceSync" status={r.sdid.status} />
        </div>
        {!canViewSync ? (
          <p className="crvs-form-hint" style={{ marginTop: 12 }}>
            You don&apos;t have access to synchronization details — viewing them requires divorce-sdid-sync-view access.
          </p>
        ) : (
          <>
            <p className="crvs-form-hint" style={{ marginBottom: 12 }}>
              Each former spouse&apos;s identity is synchronized independently — one spouse&apos;s outcome never affects the other&apos;s. The marriage relationship is ended using the divorce effective
              date; the former-spouse relationship itself is never deleted.
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
              <Button
                text={`Retry all failed${failedCount ? ` (${failedCount})` : ""}`}
                appearance="ghost"
                type="button"
                disabled={!canRetry || failedCount === 0}
                onClick={() => setShowRetryAll(true)}
                testId="rd-retry-all"
              />
              <Button text="View synchronization failures queue" appearance="ghost" type="button" onClick={() => navigate("/dashboard/crvs/divorce-sync-failures")} testId="rd-open-sync-queue" />
            </div>
            {!canRetry && <p className="crvs-form-hint">Retrying a synchronization requires divorce-sdid-sync-retry access.</p>}
            {canRetry && failedCount === 0 && <p className="crvs-form-hint">No former spouse on this case is currently in a failed state, so there is nothing to retry.</p>}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
              <SpouseSyncCard
                label="Former spouse one"
                spouse={r.formerSpouse1}
                status={r.sdid.spouse1.status}
                linkedNin={r.sdid.spouse1.linkedNin}
                linkedIdentityId={r.sdid.spouse1.linkedFoundationalIdentityId}
                lastAttemptAt={r.sdid.spouse1.lastAttemptAt}
                lastFailureCode={r.sdid.spouse1.lastFailureCode}
                attempts={r.sdid.spouse1.attempts.length}
                canRetry={canRetry}
                canViewIdentity={!!r.formerSpouse1.sdidIdentityId}
                onRetry={() => setRetryTarget("spouse1")}
                onAssignReview={() => setManualReviewTarget("spouse1")}
                onViewIdentity={() => openIdentity(r.formerSpouse1)}
              />
              <SpouseSyncCard
                label="Former spouse two"
                spouse={r.formerSpouse2}
                status={r.sdid.spouse2.status}
                linkedNin={r.sdid.spouse2.linkedNin}
                linkedIdentityId={r.sdid.spouse2.linkedFoundationalIdentityId}
                lastAttemptAt={r.sdid.spouse2.lastAttemptAt}
                lastFailureCode={r.sdid.spouse2.lastFailureCode}
                attempts={r.sdid.spouse2.attempts.length}
                canRetry={canRetry}
                canViewIdentity={!!r.formerSpouse2.sdidIdentityId}
                onRetry={() => setRetryTarget("spouse2")}
                onAssignReview={() => setManualReviewTarget("spouse2")}
                onViewIdentity={() => openIdentity(r.formerSpouse2)}
              />
            </div>
            <div className="crvs-banner crvs-banner-info" style={{ marginTop: 12 }}>
              Marriage relationship dissolved on both identities: <strong>{r.sdid.relationshipDissolved ? "Yes" : "Not yet"}</strong>.
            </div>
          </>
        )}
      </div>

      <div className="crvs-section">
        <h2 className="crvs-section-title">Certificate eligibility</h2>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span className={`crvs-status-pill crvs-status-${r.certificateEligibility?.status === "ELIGIBLE" ? "success" : "warning"}`}>
            {CERTIFICATE_ELIGIBILITY_LABELS[r.certificateEligibility?.status || "NOT_CHECKED"]}
          </span>
          <Button text="Check certificate eligibility" appearance="ghost" type="button" onClick={() => setShowEligibility(true)} testId="rd-open-eligibility" />
        </div>
        {r.certificateEligibility && r.certificateEligibility.reasons.length > 0 && (
          <ul className="crvs-form-hint" style={{ margin: "8px 0 0", paddingLeft: 18 }}>
            {r.certificateEligibility.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="crvs-section">
        <h2 className="crvs-section-title">Timeline</h2>
        <div className="crvs-timeline">
          {r.statusHistory.map((entry, i) => (
            <span key={`${entry.status}-${i}`} className="crvs-timeline-item is-reached">
              <span className="crvs-timeline-dot" />
              {DIVORCE_REGISTRATION_STATUS_LABELS[entry.status]} · {formatDateTime(entry.at)} · {entry.by}
              {entry.note ? ` — ${entry.note}` : ""}
            </span>
          ))}
        </div>
      </div>

      {canViewAudit && (
        <div className="crvs-section">
          <h2 className="crvs-section-title">Audit history</h2>
          {auditEvents.length === 0 ? (
            <p className="crvs-form-hint">No audit events recorded yet.</p>
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

      <div className="crvs-wizard-actions">
        <Button text="Back to registered divorces" appearance="ghost" type="button" onClick={() => navigate("/dashboard/crvs/registered-divorces")} testId="rd-details-back-bottom" />
        <Button text="Download registration acknowledgement" appearance="ghost" type="button" onClick={downloadAcknowledgement} testId="rd-download-acknowledgement" />
        <Button
          text="Request divorce record"
          appearance="ghost"
          type="button"
          disabled={!canRequestCertificate}
          onClick={() => setShowRecordNotWired(true)}
          testId="rd-request-record"
        />
        <Button
          text="Request divorce certificate"
          appearance="ghost"
          type="button"
          disabled={!canRequestCertificate}
          onClick={() => setShowCertNotWired(true)}
          testId="rd-request-certificate"
        />
        <Button text="Report an error" appearance="ghost" color="red" type="button" onClick={() => setShowReportError(true)} testId="rd-report-error" />
      </div>
      {!canRequestCertificate && (
        <p className="crvs-form-hint">Requesting a divorce record or certificate requires divorce-certificate-request access.</p>
      )}

      <RetryDivorceSyncModal show={!!retryTarget} onClose={() => setRetryTarget(undefined)} registration={r} spouseKey={retryTarget} actorName={actorName} onRetried={setRegistration} />
      <RetryAllDivorceSyncModal show={showRetryAll} onClose={() => setShowRetryAll(false)} registration={r} actorName={actorName} onRetried={setRegistration} />
      <DivorceManualReviewModal
        show={!!manualReviewTarget}
        onClose={() => setManualReviewTarget(undefined)}
        registration={r}
        spouseKey={manualReviewTarget}
        actorName={actorName}
        onAssigned={(updated) => {
          setManualReviewTarget(undefined);
          setRegistration(updated);
        }}
      />
      <DivorceCertificateEligibilityModal
        show={showEligibility}
        onClose={() => setShowEligibility(false)}
        registration={r}
        actorName={actorName}
        onChecked={setRegistration}
        onRequestCertificate={
          canRequestCertificate
            ? () => {
                setShowEligibility(false);
                setShowCertNotWired(true);
              }
            : undefined
        }
      />
      <ReportDivorceRecordErrorModal
        show={showReportError}
        onClose={() => setShowReportError(false)}
        registration={r}
        actorName={actorName}
        onReported={() => {
          setShowReportError(false);
          load();
        }}
      />

      <WarningModal show={showCertNotWired} onClose={() => setShowCertNotWired(false)} title="Certificate request not yet available" testId="rd-cert-not-wired">
        <p className="crvs-form-hint">
          <Icon name="info" /> Divorce-certificate issuance isn&apos;t wired to a request flow in this demo yet. This record&apos;s eligibility has been assessed; a CRVS Records Officer would process the
          request through a future certificate-request workspace.
        </p>
      </WarningModal>
      <WarningModal show={showRecordNotWired} onClose={() => setShowRecordNotWired(false)} title="Record request not yet available" testId="rd-record-not-wired">
        <p className="crvs-form-hint">
          <Icon name="info" /> A copy of the divorce record would be issued through the CRVS records workspace, which isn&apos;t wired into this demo yet. The registration acknowledgement below can be
          downloaded in the meantime.
        </p>
      </WarningModal>
      <WarningModal show={!!identityNotice} onClose={() => setIdentityNotice(undefined)} title="SDID identity" testId="rd-identity-notice">
        <p className="crvs-form-hint">{identityNotice}</p>
        <p className="crvs-form-hint">The SDID identity workspace isn&apos;t reachable from the CRVS divorce routes in this demo, so the linked reference is shown here instead.</p>
      </WarningModal>
    </div>
  );
}
