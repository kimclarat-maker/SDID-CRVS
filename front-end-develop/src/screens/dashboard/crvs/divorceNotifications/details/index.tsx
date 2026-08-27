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
import { demoGetDivorceNotification } from "@/demo/services/crvsDivorceNotifications";
import { demoListCrvsAuditEvents } from "@/demo/services/crvsAudit";
import { DemoAuditEvent } from "@/demo/types";
import { DIVORCE_NOTIFICATION_STATUS_LABELS } from "@/domain/crvs/statusMachines";
import { DivorceNotification } from "@/domain/crvs/types";
import { DEMO_DIVORCE_OFFICE_ID, DEMO_DIVORCE_OFFICE_NAME } from "@/demo/seed/crvsAccounts";
import { divorceNotificationSlaState, EXISTING_MARRIAGE_MATCH_LABELS, formatDate, formatDateTime } from "../../divorceShared";
import {
  AssignDivorceNotificationModal,
  ConvertDivorceNotificationModal,
  EscalateDivorceNotificationModal,
  MarkDivorceNotificationDuplicateModal,
  ReturnDivorceNotificationModal,
  ValidateDivorceNotificationModal,
} from "../components/modals/DivorceNotificationActionModals";
import "../../shared.css";
import "../../review/review.css";

type ActionKind = "ASSIGN" | "VALIDATE" | "RETURN" | "DUPLICATE" | "CONVERT" | "ESCALATE";

/** Court-notification detail (spec §14): the full reported court decision,
 * the marriage-match result with every candidate listed separately, the
 * signed judgment document, status history, audit trail, and the same
 * one-at-a-time action set the queue exposes. */
export default function DivorceNotificationDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentAccountId = getCurrentAccountId();
  const actorName = getCurrentActorName();

  const canView = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_NOTIFICATION_VIEW);
  const canEdit = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_NOTIFICATION_EDIT);
  const canValidate = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_NOTIFICATION_VALIDATE);
  const canReturn = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_NOTIFICATION_RETURN);
  const canMarkDuplicate = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_NOTIFICATION_MARK_DUPLICATE);
  const canConvert = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_NOTIFICATION_CONVERT);
  const canViewAudit = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_AUDIT_VIEW);

  const [notification, setNotification] = useState<DivorceNotification | undefined>();
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
      const found = await demoGetDivorceNotification(id);
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
        <Empty icon="lock" title="You don't have access to this court notification" description="Viewing divorce court notifications requires divorce-notification-view access." isFullScreen />
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
          button={<Button text="Back to court notifications" appearance="ghost" type="button" onClick={() => navigate("/dashboard/crvs/divorce-notifications")} testId="dn-details-back" />}
        />
      </div>
    );
  }

  const n = notification;
  const isOpen = n.status !== "CONVERTED_TO_REGISTRATION" && n.status !== "DUPLICATE" && n.status !== "CANCELLED";
  const sla = divorceNotificationSlaState(n.notifiedAt);

  const applyUpdated = (updated: DivorceNotification) => {
    setNotification(updated);
    setAction(undefined);
  };

  return (
    <div className="crvs-page">
      <div className="crvs-section review-case-header">
        <div>
          <h1 className="crvs-page-title">{n.reference}</h1>
          <div className="review-case-meta">
            <StatusBadge kind="divorceNotification" status={n.status} />
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
          <DescriptionItem label="Judgment number" value={n.judgmentNumber} />
          <DescriptionItem label="Judgment date" value={formatDate(n.judgmentDate)} />
          <DescriptionItem label="Finality date" value={n.finalityDate ? formatDate(n.finalityDate) : "Not reported"} />
          <DescriptionItem label="Notified at" value={formatDateTime(n.notifiedAt)} />
          <DescriptionItem label="Former spouses as reported" value={n.applicantNamesAsReported} />
          <DescriptionItem label="Reported marriage reference" value={n.marriageReferenceAsReported} />
          <DescriptionItem label="Assigned officer" value={n.assignedOfficerName || "Unassigned"} />
        </DescriptionList>
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
                <strong>{candidate.registrationNumber}</strong> — {candidate.spouse1Name} &amp; {candidate.spouse2Name}
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
        <h2 className="crvs-section-title">Signed judgment document</h2>
        {!n.signedJudgmentDocument ? (
          <p className="crvs-form-hint">The court did not attach a signed judgment to this notification.</p>
        ) : (
          <div className="crvs-banner crvs-banner-info" style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
            <span>
              <strong>{n.signedJudgmentDocument.documentType}</strong> — {n.signedJudgmentDocument.fileName} ({n.signedJudgmentDocument.fileSizeKb} KB)
              <div className="crvs-form-hint">
                Uploaded {formatDateTime(n.signedJudgmentDocument.uploadedAt)} by {n.signedJudgmentDocument.uploadedBy}
              </div>
            </span>
            <Button text="Preview" size="sm" appearance="ghost" type="button" onClick={() => setShowDocument(true)} testId="dn-preview-judgment" />
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
              text="Open divorce registration"
              size="sm"
              appearance="ghost"
              type="button"
              onClick={() => navigate(`/dashboard/crvs/divorce-registrations/${n.convertedRegistrationId}`)}
              testId="dn-open-converted"
            />
          </div>
        </div>
      )}

      <div className="crvs-section">
        <h2 className="crvs-section-title">Actions</h2>
        {!isOpen ? (
          <p className="crvs-form-hint">
            <Icon name="lock" /> This notification is closed ({DIVORCE_NOTIFICATION_STATUS_LABELS[n.status]}) and can no longer be acted on.
          </p>
        ) : (
          <>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Button text="Assign" appearance="ghost" type="button" disabled={!canEdit} onClick={() => setAction("ASSIGN")} testId="dn-details-assign" />
              <Button
                text="Validate"
                appearance="primary"
                type="button"
                disabled={!canValidate || !(n.status === "RECEIVED" || n.status === "RETURNED")}
                onClick={() => setAction("VALIDATE")}
                testId="dn-details-validate"
              />
              <Button text="Return to court" appearance="ghost" type="button" disabled={!canReturn || n.status !== "VALIDATION_PENDING"} onClick={() => setAction("RETURN")} testId="dn-details-return" />
              <Button text="Mark duplicate" appearance="ghost" color="red" type="button" disabled={!canMarkDuplicate} onClick={() => setAction("DUPLICATE")} testId="dn-details-duplicate" />
              <Button
                text="Convert to registration"
                appearance="primary"
                type="button"
                disabled={!canConvert || n.status !== "VALIDATED"}
                onClick={() => setAction("CONVERT")}
                testId="dn-details-convert"
              />
              <Button text="Escalate" appearance="ghost" type="button" disabled={!canReturn || n.status !== "VALIDATION_PENDING"} onClick={() => setAction("ESCALATE")} testId="dn-details-escalate" />
            </div>
            <ul className="crvs-form-hint" style={{ margin: "10px 0 0", paddingLeft: 18 }}>
              {!canEdit && <li>Assigning requires divorce-notification-edit access.</li>}
              {!canValidate && <li>Validating requires divorce-notification-validate access.</li>}
              {!canReturn && <li>Returning and escalating require divorce-notification-return access.</li>}
              {!canMarkDuplicate && <li>Marking a duplicate requires divorce-notification-mark-duplicate access.</li>}
              {!canConvert && <li>Converting requires divorce-notification-convert access.</li>}
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
              {DIVORCE_NOTIFICATION_STATUS_LABELS[entry.status]} · {formatDateTime(entry.at)} · {entry.by}
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
        <Button text="Back to court notifications" appearance="ghost" type="button" onClick={() => navigate("/dashboard/crvs/divorce-notifications")} testId="dn-details-back-bottom" />
      </div>

      <DocumentPreviewModal show={showDocument} onClose={() => setShowDocument(false)} evidence={n.signedJudgmentDocument} />

      <AssignDivorceNotificationModal
        show={action === "ASSIGN"}
        onClose={() => setAction(undefined)}
        notification={n}
        actorName={actorName}
        defaultOfficerId={currentAccountId}
        defaultOfficerName={actorName}
        onAssigned={applyUpdated}
      />
      <ValidateDivorceNotificationModal show={action === "VALIDATE"} onClose={() => setAction(undefined)} notification={n} actorName={actorName} onValidated={applyUpdated} />
      <ReturnDivorceNotificationModal show={action === "RETURN"} onClose={() => setAction(undefined)} notification={n} actorName={actorName} onReturned={applyUpdated} />
      <MarkDivorceNotificationDuplicateModal show={action === "DUPLICATE"} onClose={() => setAction(undefined)} notification={n} actorName={actorName} onMarked={applyUpdated} />
      <EscalateDivorceNotificationModal show={action === "ESCALATE"} onClose={() => setAction(undefined)} notification={n} actorName={actorName} onEscalated={applyUpdated} />
      <ConvertDivorceNotificationModal
        show={action === "CONVERT"}
        onClose={() => setAction(undefined)}
        notification={n}
        actorId={currentAccountId || "unknown"}
        actorName={actorName}
        defaultOfficeId={DEMO_DIVORCE_OFFICE_ID}
        defaultOfficeName={DEMO_DIVORCE_OFFICE_NAME}
        onConverted={(created) => {
          setAction(undefined);
          navigate(`/dashboard/crvs/divorce-registrations/${created.id}/edit`);
        }}
      />
    </div>
  );
}
