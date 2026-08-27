import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import Button from "@/components/button";
import Empty from "@/components/empty";
import Icon from "@/components/icon";
import { DescriptionList, DescriptionItem } from "@/components/descriptionList";
import WarningModal from "@/components/crvs/modals/WarningModal";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { hasWorkspacePermission, getCurrentActorName } from "@/utils/workspace";
import { demoGetMarriageApplication } from "@/demo/services/crvsMarriageApplications";
import { demoListCrvsAuditEvents } from "@/demo/services/crvsAudit";
import { MARRIAGE_APPLICATION_STATUS_LABELS, MARRIAGE_SPOUSE_SYNC_STATUS_LABELS } from "@/domain/crvs/statusMachines";
import { MarriageApplication, MarriageSpouseSdidSyncStatus } from "@/domain/crvs/types";
import { MarriageSpouseKey } from "@/demo/services/crvsMarriageSdidSync";
import { DemoAuditEvent } from "@/demo/types";
import StatusBadge from "../../components/StatusBadge";
import RetryMarriageSyncModal from "../components/modals/RetryMarriageSyncModal";
import MarriageManualReviewModal from "../components/modals/MarriageManualReviewModal";
import MarriageCertificateEligibilityModal from "../components/modals/MarriageCertificateEligibilityModal";
import { applicantDisplayName, maskDocumentNumber, formatDate, formatDateTime } from "../../marriageShared";
import toastMessage from "@/utils/common/toastMessage";
import "../../shared.css";

const SPOUSE_SYNC_TONE: Record<MarriageSpouseSdidSyncStatus, string> = {
  NOT_READY: "neutral",
  PENDING: "info",
  IN_PROGRESS: "info",
  IDENTITY_UPDATED: "success",
  FAILED: "danger",
  MANUAL_REVIEW: "warning",
};

function SpouseSyncCard({
  label,
  name,
  status,
  linkedNin,
  lastAttemptAt,
  lastFailureCode,
  canRetry,
  onRetry,
  onAssignReview,
}: {
  label: string;
  name: string;
  status: MarriageSpouseSdidSyncStatus;
  linkedNin?: string;
  lastAttemptAt?: string;
  lastFailureCode?: string;
  canRetry: boolean;
  onRetry: () => void;
  onAssignReview: () => void;
}) {
  const actionable = status === "FAILED" || status === "MANUAL_REVIEW";
  return (
    <div className="crvs-review-section">
      <div className="crvs-review-section-header">
        <strong>{label}</strong>
        <span className={`crvs-status-pill crvs-status-${SPOUSE_SYNC_TONE[status]}`}>{MARRIAGE_SPOUSE_SYNC_STATUS_LABELS[status]}</span>
      </div>
      <p className="crvs-form-hint">{name}</p>
      <DescriptionList columns={2}>
        <DescriptionItem label="Last attempt" value={lastAttemptAt ? formatDateTime(lastAttemptAt) : "—"} />
        <DescriptionItem label="Linked NIN" value={status === "IDENTITY_UPDATED" ? linkedNin : undefined} />
      </DescriptionList>
      {lastFailureCode && status !== "IDENTITY_UPDATED" && (
        <p className="crvs-form-hint" style={{ marginTop: 8 }}>
          Last failure code: <strong>{lastFailureCode}</strong>
        </p>
      )}
      {actionable && canRetry && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
          <Button text="Retry" size="sm" appearance="primary" onClick={onRetry} testId={`registered-marriage-retry-${label.toLowerCase().replace(/\s+/g, "-")}`} />
          {status === "FAILED" && <Button text="Assign manual review" size="sm" appearance="ghost" onClick={onAssignReview} testId={`registered-marriage-manual-review-${label.toLowerCase().replace(/\s+/g, "-")}`} />}
        </div>
      )}
      {actionable && !canRetry && (
        <p className="crvs-form-hint" style={{ marginTop: 8 }} title="You don't have MARRIAGE_SDID_SYNC_RETRY permission">
          You have view-only access to this synchronization record.
        </p>
      )}
    </div>
  );
}

export default function RegisteredMarriageDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const actorName = getCurrentActorName();

  const canView = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_REGISTERED_VIEW);
  const canRetry = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_SDID_SYNC_RETRY);
  const canViewAudit = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_AUDIT_VIEW);
  const canRequestCertificate = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_CERTIFICATE_REQUEST);

  const [application, setApplication] = useState<MarriageApplication | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [auditEvents, setAuditEvents] = useState<DemoAuditEvent[]>([]);
  const [retryTarget, setRetryTarget] = useState<MarriageSpouseKey | undefined>();
  const [manualReviewTarget, setManualReviewTarget] = useState<MarriageSpouseKey | undefined>();
  const [showEligibility, setShowEligibility] = useState(false);
  const [showCertNotWired, setShowCertNotWired] = useState(false);

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
          setError("This marriage record was not found.");
          return;
        }
        setApplication(found);
        if (canViewAudit) demoListCrvsAuditEvents({ targetRef: found.reference }).then((res) => setAuditEvents(res.data));
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Couldn't load this record."))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id, canView, canViewAudit]);

  if (!canView) {
    return (
      <div className="crvs-page">
        <Empty icon="lock" title="You don't have access to registered marriages" isFullScreen />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="crvs-page">
        <Empty icon="hourglass_empty" title="Loading registered marriage…" isFullScreen />
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="crvs-page">
        <Empty
          icon="error"
          title="Couldn't open this record"
          description={error || "This marriage record was not found."}
          isFullScreen
          button={<Button text="Back to registered marriages" appearance="ghost" onClick={() => navigate("/dashboard/crvs/registered-marriages")} testId="registered-marriage-back" />}
        />
      </div>
    );
  }

  if (application.status !== "REGISTERED" || !application.registrationEvent) {
    return (
      <div className="crvs-page">
        <Empty icon="hourglass_empty" title="This application has not been registered yet" description={`Current status: ${application.status.replace(/_/g, " ")}.`} />
      </div>
    );
  }

  const a = application;
  const reg = a.registrationEvent!;
  const activeWitnesses = a.witnesses.filter((w) => !w.replaced);

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">Marriage registration successful</h1>
        <p className="crvs-page-subtitle">
          {applicantDisplayName(a.applicant1)} &amp; {applicantDisplayName(a.applicant2)} are officially registered. This record is read-only.
        </p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <div className="crvs-banner crvs-banner-info">
        The registered record is read-only. Any legal changes must go through the correction/amendment or dissolution workflow.
      </div>

      <div className="crvs-section">
        <h2 className="crvs-section-title">Registration event</h2>
        <DescriptionList columns={3}>
          <DescriptionItem label="Registration number" value={reg.registrationNumber} />
          <DescriptionItem label="Registered at" value={formatDateTime(reg.registeredAt)} />
          <DescriptionItem label="Registered by" value={reg.registeredByName} />
          <DescriptionItem label="Office" value={reg.officeName} />
          <DescriptionItem label="Marriage date" value={formatDate(reg.marriageDate)} />
          <DescriptionItem label="Officiant" value={reg.officiantName} />
          <DescriptionItem label="Property regime" value={reg.propertyRegime?.replace(/_/g, " ")} />
          <DescriptionItem label="Case reference" value={a.reference} />
        </DescriptionList>
      </div>

      <div className="crvs-section">
        <h2 className="crvs-section-title">Spouses</h2>
        <DescriptionList columns={2}>
          <DescriptionItem label="Applicant 1" value={`${reg.spouse1Summary.firstName || ""} ${reg.spouse1Summary.lastName || ""} (${reg.spouse1Summary.sex})`} />
          <DescriptionItem label="Applicant 1 document" value={maskDocumentNumber(a.applicant1.documentNumber)} />
          <DescriptionItem label="Applicant 2" value={`${reg.spouse2Summary.firstName || ""} ${reg.spouse2Summary.lastName || ""} (${reg.spouse2Summary.sex})`} />
          <DescriptionItem label="Applicant 2 document" value={maskDocumentNumber(a.applicant2.documentNumber)} />
        </DescriptionList>
      </div>

      <div className="crvs-section">
        <h2 className="crvs-section-title">Witnesses</h2>
        {activeWitnesses.length === 0 ? (
          <p className="crvs-form-hint">No witnesses recorded.</p>
        ) : (
          activeWitnesses.map((w) => (
            <div key={w.id} className="crvs-form-hint" style={{ marginBottom: 4 }}>
              {w.firstName} {w.lastName} — for {w.spouseRole} ({w.relationship})
            </div>
          ))
        )}
      </div>

      <div className="crvs-section">
        <h2 className="crvs-section-title">Source records</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Button text="View source declaration" appearance="ghost" onClick={() => navigate(`/dashboard/crvs/marriage-applications/${a.id}`)} testId="registered-marriage-view-source" />
          {a.appointmentId && (
            <Button text="View source appointment" appearance="ghost" onClick={() => navigate(`/dashboard/crvs/marriage-appointments/${a.appointmentId}`)} testId="registered-marriage-view-appointment" />
          )}
        </div>
      </div>

      <div className="crvs-section">
        <div className="crvs-review-section-header">
          <strong>SDID synchronization status</strong>
          <StatusBadge kind="marriageSync" status={a.sdid.status} />
        </div>
        <p className="crvs-form-hint" style={{ marginBottom: 12 }}>
          Each spouse's identity is synchronized independently — one spouse's outcome never affects the other's.
        </p>
        <div style={{ marginBottom: 12 }}>
          <Button text="Open full synchronization status" appearance="ghost" onClick={() => navigate(`/dashboard/crvs/registered-marriages/${a.id}/sdid-status`)} testId="registered-marriage-open-sdid-status" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
          <SpouseSyncCard
            label="Applicant 1"
            name={applicantDisplayName(a.applicant1)}
            status={a.sdid.applicant1.status}
            linkedNin={a.sdid.applicant1.linkedNin}
            lastAttemptAt={a.sdid.applicant1.lastAttemptAt}
            lastFailureCode={a.sdid.applicant1.lastFailureCode}
            canRetry={canRetry}
            onRetry={() => setRetryTarget("applicant1")}
            onAssignReview={() => setManualReviewTarget("applicant1")}
          />
          <SpouseSyncCard
            label="Applicant 2"
            name={applicantDisplayName(a.applicant2)}
            status={a.sdid.applicant2.status}
            linkedNin={a.sdid.applicant2.linkedNin}
            lastAttemptAt={a.sdid.applicant2.lastAttemptAt}
            lastFailureCode={a.sdid.applicant2.lastFailureCode}
            canRetry={canRetry}
            onRetry={() => setRetryTarget("applicant2")}
            onAssignReview={() => setManualReviewTarget("applicant2")}
          />
        </div>
      </div>

      <div className="crvs-section">
        <h2 className="crvs-section-title">Certificate eligibility</h2>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <StatusBadge kind="marriageApplication" status="REGISTERED" />
          <span>{a.certificateEligibility ? a.certificateEligibility.status.replace(/_/g, " ") : "Not checked"}</span>
          <Button text="Check certificate eligibility" appearance="ghost" onClick={() => setShowEligibility(true)} testId="registered-marriage-open-eligibility" />
        </div>
      </div>

      <div className="crvs-section">
        <h2 className="crvs-section-title">Timeline</h2>
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

      {canViewAudit && (
        <div className="crvs-section">
          <h2 className="crvs-section-title">Full audit timeline</h2>
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
        <Link to="/dashboard/crvs/registered-marriages" className="crvs-tab">
          Back to registered marriages
        </Link>
        {canRequestCertificate && <Button text="Request certificate" appearance="ghost" onClick={() => setShowCertNotWired(true)} testId="registered-marriage-request-certificate" />}
      </div>

      <RetryMarriageSyncModal
        show={!!retryTarget}
        onClose={() => setRetryTarget(undefined)}
        application={a}
        spouseKey={retryTarget}
        actorName={actorName}
        onRetried={(_outcome, updated) => setApplication(updated)}
      />
      <MarriageManualReviewModal
        show={!!manualReviewTarget}
        onClose={() => setManualReviewTarget(undefined)}
        application={a}
        spouseKey={manualReviewTarget}
        actorName={actorName}
        onAssigned={setApplication}
      />
      <MarriageCertificateEligibilityModal
        show={showEligibility}
        onClose={() => setShowEligibility(false)}
        application={a}
        actorName={actorName}
        onChecked={setApplication}
        onRequestCertificate={
          canRequestCertificate
            ? () => {
                setShowEligibility(false);
                setShowCertNotWired(true);
              }
            : undefined
        }
      />
      <WarningModal show={showCertNotWired} onClose={() => setShowCertNotWired(false)} title="Certificate request not yet available" testId="registered-marriage-cert-not-wired">
        <p className="crvs-form-hint">
          <Icon name="info" /> Marriage-certificate issuance isn't wired to a request flow in this demo yet. This record is
          eligible; a CRVS Registration Officer would process the request through a future certificate-request workspace.
        </p>
      </WarningModal>
    </div>
  );
}
