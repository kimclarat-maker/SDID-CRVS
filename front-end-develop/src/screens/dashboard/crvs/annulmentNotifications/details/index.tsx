import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Empty from "@/components/empty";
import Button from "@/components/button";
import Icon from "@/components/icon";
import { DescriptionList, DescriptionItem } from "@/components/descriptionList";
import DocumentPreviewModal from "@/components/crvs/modals/DocumentPreviewModal";
import StatusBadge from "../../components/StatusBadge";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { getCurrentAccountId, getCurrentActorName, hasWorkspacePermission } from "@/utils/workspace";
import { demoGetAnnulmentNotification } from "@/demo/services/crvsAnnulmentNotifications";
import { demoListCrvsAuditEvents } from "@/demo/services/crvsAudit";
import { DemoAuditEvent } from "@/demo/types";
import { ANNULMENT_NOTIFICATION_STATUS_LABELS } from "@/domain/crvs/statusMachines";
import { AnnulmentNotification } from "@/domain/crvs/types";
import { DEMO_ANNULMENT_OFFICE_ID, DEMO_ANNULMENT_OFFICE_NAME } from "@/demo/seed/crvsAccounts";
import { annulmentNotificationSlaState, EXISTING_MARRIAGE_MATCH_LABELS, formatDate, formatDateTime } from "../../annulmentShared";
import {
  AssignAnnulmentNotificationModal,
  ConvertAnnulmentNotificationModal,
  EscalateAnnulmentNotificationModal,
  MarkAnnulmentNotificationDuplicateModal,
  ReturnAnnulmentNotificationModal,
  ValidateAnnulmentNotificationModal,
} from "../components/modals/AnnulmentNotificationActionModals";
import "../../shared.css";
import "../../review/review.css";

type ActionKind = "ASSIGN" | "VALIDATE" | "RETURN" | "DUPLICATE" | "CONVERT" | "ESCALATE";

/** Court-notification detail: the full reported court decision, the
 * marriage-match result with every candidate listed separately, the signed
 * decision document, status history, audit trail, and the same one-at-a-time
 * action set the queue exposes (mirrors DivorceNotificationDetails). */
export default function AnnulmentNotificationDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentAccountId = getCurrentAccountId();
  const actorName = getCurrentActorName();

  const canView = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_NOTIFICATION_VIEW);
  const canEdit = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_NOTIFICATION_EDIT);
  const canValidate = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_NOTIFICATION_VALIDATE);
  const canReturn = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_NOTIFICATION_RETURN);
  const canMarkDuplicate = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_NOTIFICATION_MARK_DUPLICATE);
  const canConvert = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_NOTIFICATION_CONVERT);
  const canViewAudit = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_AUDIT_VIEW);

  const [notification, setNotification] = useState<AnnulmentNotification | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [auditEvents, setAuditEvents] = useState<DemoAuditEvent[]>([]);
  const [action, setAction] = useState<ActionKind | undefined>();
  const [showDocument, setShowDocument] = useState(false);

  const load = useCallback(async () => {
    if (!id || !canView) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(undefined);
    try {
      const found = await demoGetAnnulmentNotification(id);
      if (!found) {
        setError("This court notification was not found.");
        setNotification(undefined);
        return;
      }
      setNotification(found);
      if (canViewAudit) {
        const res = await demoListCrvsAuditEvents({ targetRef: found.reference });
        setAuditEvents(res.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load this court notification.");
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
        <Empty icon="lock" title="You don't have access to this court notification" description="Viewing marriage-annulment court notifications requires annulment-notification-view access." isFullScreen />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="crvs-page">
        <Empty icon="hourglass_empty" title="Loading court notification…" isFullScreen />
      </div>
    );
  }

  if (error || !notification) {
    return (
      <div className="crvs-page">
        <Empty
          icon="error"
          title="Couldn't open this court notification"
          description={error || "This court notification was not found."}
          isFullScreen
          button={<Button text="Back to court notifications" appearance="ghost" type="button" onClick={() => navigate("/dashboard/crvs/annulment-notifications")} testId="an-notif-details-back" />}
        />
      </div>
    );
  }

  const n = notification;
  const isOpen = n.status !== "CONVERTED_TO_REGISTRATION" && n.status !== "DUPLICATE" && n.status !== "CANCELLED";
  const sla = annulmentNotificationSlaState(n.notifiedAt);

  const applyUpdated = (updated: AnnulmentNotification) => {
    setNotification(updated);
    setAction(undefined);
  };

  return (
    <div className="crvs-page">
      <div className="crvs-section review-case-header">
        <div>
          <h1 className="crvs-page-title">{n.reference}</h1>
          <div className="review-case-meta">
            <StatusBadge kind="annulmentNotification" status={n.status} />
            <span>{n.applicantNamesAsReported}</span>
            <span>{n.courtName}</span>
            <span>Case {n.courtCaseNumber}</span>
            {isOpen && <span className={`crvs-status-pill crvs-status-${sla.tone}`}>{sla.label}</span>}
            {n.duplicateWarning && <span className="crvs-status-pill crvs-status-warning">Possible duplicate</span>}
          </div>
          <span className="crvs-demo-note">Demo data — fictional</span>
        </div>
      </div>

      <div className="crvs-section">
        <h2 className="crvs-section-title">Reported court decision</h2>
        <DescriptionList columns={3}>
          <DescriptionItem label="Court or authority" value={n.courtName} />
          <DescriptionItem label="Court case number" value={n.courtCaseNumber} />
          <DescriptionItem label="Decision number" value={n.decisionNumber} />
          <DescriptionItem label="Decision date" value={formatDate(n.decisionDate)} />
          <DescriptionItem label="Finality date" value={n.finalityDate ? formatDate(n.finalityDate) : "Not reported"} />
          <DescriptionItem label="Effective date" value={n.effectiveDate ? formatDate(n.effectiveDate) : "Not reported"} />
          <DescriptionItem label="Notified at" value={formatDateTime(n.notifiedAt)} />
          <DescriptionItem label="Affected persons as reported" value={n.applicantNamesAsReported} />
          <DescriptionItem label="Reported marriage reference" value={n.marriageReferenceAsReported} />
          <DescriptionItem label="Assigned officer" value={n.assignedOfficerName || "Unassigned"} />
        </DescriptionList>
        {n.legalEffectWordingAsReported && (
          <p className="crvs-form-hint" style={{ marginTop: 8 }}>
            Legal-effect wording as reported: “{n.legalEffectWordingAsReported}” — not a legal-effect classification; that is set later by authorized staff.
          </p>
        )}
      </div>

      <div className="crvs-section">
        <h2 className="crvs-section-title">Marriage match</h2>
        <p className="crvs-form-hint">
          Result: <strong>{EXISTING_MARRIAGE_MATCH_LABELS[n.marriageMatch.status]}</strong>
          {n.marriageMatch.searchedAt ? ` · searched ${formatDateTime(n.marriageMatch.searchedAt)} by ${n.marriageMatch.searchedBy || "—"}` : " · not searched yet"}
        </p>
        {n.marriageMatch.candidates.length === 0 ? (
          <p className="crvs-form-hint">No candidate marriage records have been recorded for this notification.</p>
        ) : (
          <ul style={{ listStyle: "none", margin: "8px 0 0", padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            {n.marriageMatch.candidates.map((candidate) => (
              <li key={candidate.registrationNumber} className={`crvs-banner ${n.marriageMatch.selected?.registrationNumber === candidate.registrationNumber ? "crvs-banner-info" : "crvs-banner-warning"}`}>
                <strong>{candidate.registrationNumber}</strong> — {candidate.party1Name} &amp; {candidate.party2Name}
                <div className="crvs-form-hint">
                  Married {formatDate(candidate.marriageDate)} · {candidate.marriagePlace || candidate.officeName || "Office not recorded"} · {candidate.matchConfidence} confidence
                  {n.marriageMatch.selected?.registrationNumber === candidate.registrationNumber ? " · selected" : ""}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="crvs-section">
        <h2 className="crvs-section-title">Signed decision document</h2>
        {!n.signedDecisionDocument ? (
          <p className="crvs-form-hint">The court did not attach a signed decision document to this notification.</p>
        ) : (
          <div className="crvs-banner crvs-banner-info" style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
            <span>
              <strong>{n.signedDecisionDocument.documentType}</strong> — {n.signedDecisionDocument.fileName} ({n.signedDecisionDocument.fileSizeKb} KB)
              <div className="crvs-form-hint">
                Uploaded {formatDateTime(n.signedDecisionDocument.uploadedAt)} by {n.signedDecisionDocument.uploadedBy}
              </div>
            </span>
            <Button text="Preview" size="sm" appearance="ghost" type="button" onClick={() => setShowDocument(true)} testId="an-notif-preview-decision" />
          </div>
        )}
      </div>

      {n.returnReason && (
        <div className="crvs-section">
          <h2 className="crvs-section-title">Return reason</h2>
          <div className="crvs-banner crvs-banner-warning">
            {n.returnReason.reason}
            {n.returnReason.note ? ` — ${n.returnReason.note}` : ""}
          </div>
        </div>
      )}

      {n.convertedRegistrationReference && (
        <div className="crvs-section">
          <h2 className="crvs-section-title">Converted registration</h2>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <span>
              This notification became <strong>{n.convertedRegistrationReference}</strong>.
            </span>
            <Button
              text="Open annulment registration"
              size="sm"
              appearance="ghost"
              type="button"
              onClick={() => navigate(`/dashboard/crvs/annulment-registrations/${n.convertedRegistrationId}`)}
              testId="an-notif-open-converted"
            />
          </div>
        </div>
      )}

      <div className="crvs-section">
        <h2 className="crvs-section-title">Actions</h2>
        {!isOpen ? (
          <p className="crvs-form-hint">
            <Icon name="lock" /> This notification is closed ({ANNULMENT_NOTIFICATION_STATUS_LABELS[n.status]}) and can no longer be acted on.
          </p>
        ) : (
          <>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Button text="Assign" appearance="ghost" type="button" disabled={!canEdit} onClick={() => setAction("ASSIGN")} testId="an-notif-details-assign" />
              <Button
                text="Validate"
                appearance="primary"
                type="button"
                disabled={!canValidate || !(n.status === "RECEIVED" || n.status === "RETURNED")}
                onClick={() => setAction("VALIDATE")}
                testId="an-notif-details-validate"
              />
              <Button text="Return to court" appearance="ghost" type="button" disabled={!canReturn || n.status !== "VALIDATION_PENDING"} onClick={() => setAction("RETURN")} testId="an-notif-details-return" />
              <Button text="Mark duplicate" appearance="ghost" color="red" type="button" disabled={!canMarkDuplicate} onClick={() => setAction("DUPLICATE")} testId="an-notif-details-duplicate" />
              <Button
                text="Convert to registration"
                appearance="primary"
                type="button"
                disabled={!canConvert || n.status !== "VALIDATED"}
                onClick={() => setAction("CONVERT")}
                testId="an-notif-details-convert"
              />
              <Button text="Escalate" appearance="ghost" type="button" disabled={!canReturn || n.status !== "VALIDATION_PENDING"} onClick={() => setAction("ESCALATE")} testId="an-notif-details-escalate" />
            </div>
            <ul className="crvs-form-hint" style={{ margin: "10px 0 0", paddingLeft: 18 }}>
              {!canEdit && <li>Assigning requires annulment-notification-edit access.</li>}
              {!canValidate && <li>Validating requires annulment-notification-validate access.</li>}
              {!canReturn && <li>Returning and escalating require annulment-notification-return access.</li>}
              {!canMarkDuplicate && <li>Marking a duplicate requires annulment-notification-mark-duplicate access.</li>}
              {!canConvert && <li>Converting requires annulment-notification-convert access.</li>}
              {canValidate && !(n.status === "RECEIVED" || n.status === "RETURNED") && <li>Validation is only available while the notification is received or returned.</li>}
              {canConvert && n.status !== "VALIDATED" && <li>Conversion is only available once the notification has been validated.</li>}
              {(canReturn || canValidate) && n.status !== "VALIDATION_PENDING" && <li>Returning and escalating are only available while validation is pending.</li>}
            </ul>
          </>
        )}
      </div>

      <div className="crvs-section">
        <h2 className="crvs-section-title">Status history</h2>
        <div className="crvs-timeline">
          {n.statusHistory.map((entry, i) => (
            <span key={`${entry.status}-${i}`} className="crvs-timeline-item is-reached">
              <span className="crvs-timeline-dot" />
              {ANNULMENT_NOTIFICATION_STATUS_LABELS[entry.status]} · {formatDateTime(entry.at)} · {entry.by}
              {entry.note ? ` — ${entry.note}` : ""}
            </span>
          ))}
        </div>
      </div>

      {canViewAudit && (
        <div className="crvs-section">
          <h2 className="crvs-section-title">Audit history</h2>
          {auditEvents.length === 0 ? (
            <p className="crvs-form-hint">No audit events recorded for this notification yet.</p>
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
        <Button text="Back to court notifications" appearance="ghost" type="button" onClick={() => navigate("/dashboard/crvs/annulment-notifications")} testId="an-notif-details-back-bottom" />
      </div>

      <DocumentPreviewModal show={showDocument} onClose={() => setShowDocument(false)} evidence={n.signedDecisionDocument} />

      <AssignAnnulmentNotificationModal
        show={action === "ASSIGN"}
        onClose={() => setAction(undefined)}
        notification={n}
        actorName={actorName}
        defaultOfficerId={currentAccountId}
        defaultOfficerName={actorName}
        onAssigned={applyUpdated}
      />
      <ValidateAnnulmentNotificationModal show={action === "VALIDATE"} onClose={() => setAction(undefined)} notification={n} actorName={actorName} onValidated={applyUpdated} />
      <ReturnAnnulmentNotificationModal show={action === "RETURN"} onClose={() => setAction(undefined)} notification={n} actorName={actorName} onReturned={applyUpdated} />
      <MarkAnnulmentNotificationDuplicateModal show={action === "DUPLICATE"} onClose={() => setAction(undefined)} notification={n} actorName={actorName} onMarked={applyUpdated} />
      <EscalateAnnulmentNotificationModal show={action === "ESCALATE"} onClose={() => setAction(undefined)} notification={n} actorName={actorName} onEscalated={applyUpdated} />
      <ConvertAnnulmentNotificationModal
        show={action === "CONVERT"}
        onClose={() => setAction(undefined)}
        notification={n}
        actorId={currentAccountId || "unknown"}
        actorName={actorName}
        defaultOfficeId={DEMO_ANNULMENT_OFFICE_ID}
        defaultOfficeName={DEMO_ANNULMENT_OFFICE_NAME}
        onConverted={(created) => {
          setAction(undefined);
          navigate(`/dashboard/crvs/annulment-registrations/${created.id}/edit`);
        }}
      />
    </div>
  );
}
