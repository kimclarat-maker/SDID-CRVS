import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Empty from "@/components/empty";
import Button from "@/components/button";
import Icon from "@/components/icon";
import { DescriptionList, DescriptionItem } from "@/components/descriptionList";
import StatusBadge from "../../components/StatusBadge";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { hasWorkspacePermission } from "@/utils/workspace";
import { demoGetDivorceRegistration } from "@/demo/services/crvsDivorceRegistrations";
import { demoListCrvsAuditEvents } from "@/demo/services/crvsAudit";
import { DemoAuditEvent } from "@/demo/types";
import { DIVORCE_EXCEPTION_TRIGGER_LABELS } from "@/domain/crvs/divorcePolicyConfig";
import { canTransitionDivorceRegistration, DIVORCE_REGISTRATION_STATUS_LABELS } from "@/domain/crvs/statusMachines";
import { DivorceRegistration } from "@/domain/crvs/types";
import { activeEvidence, formatDateTime, formerSpousesLabel, marriageReferenceLabel } from "../../divorceShared";
import ResolveDivorceExceptionModal, { DivorceExceptionResolutionType } from "../components/modals/ResolveDivorceExceptionModal";
import "../../shared.css";
import "../../review/review.css";

const RESOLUTION_BUTTONS: { type: DivorceExceptionResolutionType; label: string; appearance: "primary" | "ghost" | "default"; color?: "red" }[] = [
  { type: "CLEAR", label: "Clear exception", appearance: "primary" },
  { type: "REQUEST_INFORMATION", label: "Request information", appearance: "default" },
  { type: "RETURN_TO_OFFICER", label: "Return to Registration Officer", appearance: "default" },
  { type: "ROUTE_TO_OFFICE", label: "Route to another office", appearance: "default" },
  { type: "ROUTE_FOREIGN_REVIEW", label: "Route to foreign-decision review", appearance: "default" },
  { type: "APPROVE_EXCEPTION", label: "Approve an authorized exception", appearance: "default" },
  { type: "ESCALATE", label: "Escalate", appearance: "ghost" },
  { type: "REJECT", label: "Reject the registration", appearance: "ghost", color: "red" },
];

/** Exception detail (spec §20): triggering rule, affected data, evidence,
 * previous actions, assigned supervisor, internal notes and resolution
 * history, plus the full resolution action set. */
export default function DivorceExceptionDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const canView = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_EXCEPTIONS_VIEW);
  const canResolve = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_EXCEPTION_REVIEW);
  const canViewAudit = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_AUDIT_VIEW);

  const [registration, setRegistration] = useState<DivorceRegistration | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [auditEvents, setAuditEvents] = useState<DemoAuditEvent[]>([]);
  const [resolutionType, setResolutionType] = useState<DivorceExceptionResolutionType | undefined>();

  const load = useCallback(async () => {
    if (!id || !canView) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(undefined);
    try {
      const found = await demoGetDivorceRegistration(id);
      if (!found || !found.exception) {
        setError("This exception was not found.");
        setRegistration(undefined);
        return;
      }
      setRegistration(found);
      if (canViewAudit) {
        const res = await demoListCrvsAuditEvents({ targetRef: found.reference, limit: 200 });
        setAuditEvents(res.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load this exception.");
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
        <Empty icon="lock" title="You don't have access to this exception" description="Viewing divorce exceptions requires divorce-exceptions-view access." isFullScreen />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="crvs-page">
        <Empty icon="hourglass_empty" title="Loading exception…" isFullScreen />
      </div>
    );
  }

  if (error || !registration || !registration.exception) {
    return (
      <div className="crvs-page">
        <Empty
          icon="error"
          title="Couldn't open this exception"
          description={error || "This exception was not found."}
          isFullScreen
          button={<Button text="Back to divorce exceptions" appearance="ghost" type="button" onClick={() => navigate("/dashboard/crvs/divorce-exceptions")} testId="de-details-back" />}
        />
      </div>
    );
  }

  const r = registration;
  // Non-null: the guard above returned if exception was undefined, but that
  // narrowing doesn't carry over to the `r` alias.
  const exception = r.exception!;
  const evidence = activeEvidence(r.evidence);
  const isOpen = exception.status === "OPEN";

  const resolutionAvailability = (type: DivorceExceptionResolutionType): { enabled: boolean; reason: string } => {
    if (!canResolve) return { enabled: false, reason: "Resolving an exception requires divorce-exception-review access." };
    if (!isOpen) return { enabled: false, reason: "This exception is already resolved." };
    if (type === "ROUTE_FOREIGN_REVIEW" && !canTransitionDivorceRegistration(r.status, "FOREIGN_JUDGMENT_REVIEW")) {
      return { enabled: false, reason: `Foreign-decision review isn't reachable while the case is ${DIVORCE_REGISTRATION_STATUS_LABELS[r.status].toLowerCase()}.` };
    }
    if (type === "REJECT" && !canTransitionDivorceRegistration(r.status, "REJECTED")) {
      return { enabled: false, reason: `This case can't be rejected while it is ${DIVORCE_REGISTRATION_STATUS_LABELS[r.status].toLowerCase()}.` };
    }
    if ((type === "CLEAR" || type === "ROUTE_TO_OFFICE" || type === "APPROVE_EXCEPTION") && !canTransitionDivorceRegistration(r.status, "UNDER_REVIEW")) {
      return { enabled: false, reason: `The case can't return to review while it is ${DIVORCE_REGISTRATION_STATUS_LABELS[r.status].toLowerCase()}.` };
    }
    if ((type === "REQUEST_INFORMATION" || type === "RETURN_TO_OFFICER") && !canTransitionDivorceRegistration(r.status, "CORRECTION_REQUIRED")) {
      return { enabled: false, reason: `A correction can't be requested while the case is ${DIVORCE_REGISTRATION_STATUS_LABELS[r.status].toLowerCase()}.` };
    }
    return { enabled: true, reason: "" };
  };

  return (
    <div className="crvs-page">
      <div className="crvs-section review-case-header">
        <div>
          <h1 className="crvs-page-title">{r.reference}</h1>
          <div className="review-case-meta">
            <StatusBadge kind="divorceRegistration" status={r.status} />
            <span>{formerSpousesLabel(r)}</span>
            <span>Marriage {marriageReferenceLabel(r)}</span>
            <span className={`crvs-status-pill crvs-status-${isOpen ? "warning" : "success"}`}>{exception.status}</span>
            {exception.priority && <span className="crvs-status-pill crvs-status-info">{exception.priority} priority</span>}
          </div>
          <span className="crvs-demo-note">Demo data — fictional</span>
        </div>
      </div>

      <div className="crvs-section">
        <h2 className="crvs-section-title">Exception detail</h2>
        <DescriptionList columns={3}>
          <DescriptionItem label="Exception type" value={DIVORCE_EXCEPTION_TRIGGER_LABELS[exception.type]} />
          <DescriptionItem label="Reason" value={exception.reason} />
          <DescriptionItem label="Triggering rule" value={exception.triggeringRule} />
          <DescriptionItem label="Affected data" value={exception.affectedData} />
          <DescriptionItem label="Assigned supervisor" value={exception.assignedTo || r.reviewerName || "Unassigned"} />
          <DescriptionItem label="Priority" value={exception.priority} />
          <DescriptionItem label="Exception status" value={exception.status} />
          <DescriptionItem label="Case status" value={DIVORCE_REGISTRATION_STATUS_LABELS[r.status]} />
          <DescriptionItem label="Processing office" value={r.processingOffice.selectedProcessingOfficeName} />
        </DescriptionList>
      </div>

      <div className="crvs-section">
        <h2 className="crvs-section-title">Evidence on file</h2>
        {evidence.length === 0 && r.existingMarriage.notFoundEvidence.length === 0 ? (
          <p className="crvs-form-hint">No evidence documents are attached to this case.</p>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            {[...evidence, ...r.existingMarriage.notFoundEvidence].map((ev) => (
              <li key={ev.id} className="crvs-banner crvs-banner-info">
                <strong>{ev.documentType.replace(/_/g, " ")}</strong> — {ev.fileName}
                <div className="crvs-form-hint">
                  Uploaded {formatDateTime(ev.uploadedAt)} by {ev.uploadedBy} · {ev.verification.replace(/_/g, " ").toLowerCase()}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="crvs-section">
        <h2 className="crvs-section-title">Previous actions</h2>
        {r.reviewDecisions.length === 0 ? (
          <p className="crvs-form-hint">No prior decisions recorded on this case.</p>
        ) : (
          <div className="review-audit-list">
            {r.reviewDecisions.map((d, i) => (
              <div key={`${d.type}-${i}`} className="review-audit-item">
                <strong>{d.type.replace(/_/g, " ")}</strong> by {d.decidedBy} — {formatDateTime(d.decidedAt)}
                {d.reason && <div className="crvs-form-hint">{d.reason}</div>}
                {d.note && <div className="crvs-form-hint">{d.note}</div>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="crvs-section">
        <h2 className="crvs-section-title">Internal notes</h2>
        <p className="crvs-form-hint">
          {r.judgment.notesForStaff || r.foreignRecognition.supervisorNotes || "No internal notes have been recorded on this case."}
        </p>
      </div>

      <div className="crvs-section">
        <h2 className="crvs-section-title">Resolution history</h2>
        {exception.resolution ? (
          <div className="crvs-banner crvs-banner-success">
            Resolved as <strong>{exception.resolution.type.replace(/_/g, " ").toLowerCase()}</strong> by {exception.resolution.resolvedBy} on {formatDateTime(exception.resolution.resolvedAt)} — moved to{" "}
            {DIVORCE_REGISTRATION_STATUS_LABELS[exception.resolution.nextStatus].toLowerCase()}.
            <div className="crvs-form-hint">
              {exception.resolution.reason}
              {exception.resolution.note ? ` — ${exception.resolution.note}` : ""}
            </div>
          </div>
        ) : (
          <p className="crvs-form-hint">This exception has not been resolved yet.</p>
        )}
        <div className="crvs-timeline" style={{ marginTop: 12 }}>
          {r.statusHistory.map((entry, i) => (
            <span key={`${entry.status}-${i}`} className="crvs-timeline-item is-reached">
              <span className="crvs-timeline-dot" />
              {DIVORCE_REGISTRATION_STATUS_LABELS[entry.status]} · {formatDateTime(entry.at)} · {entry.by}
              {entry.note ? ` — ${entry.note}` : ""}
            </span>
          ))}
        </div>
      </div>

      <div className="crvs-section">
        <h2 className="crvs-section-title">Resolution options</h2>
        {!isOpen && (
          <p className="crvs-form-hint">
            <Icon name="task_alt" /> This exception is already resolved. Any further decision on the case is taken from the review workspace.
          </p>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 10 }}>
          {RESOLUTION_BUTTONS.map(({ type, label, appearance, color }) => {
            const availability = resolutionAvailability(type);
            return (
              <div key={type} title={availability.enabled ? undefined : availability.reason}>
                <Button
                  text={label}
                  appearance={appearance}
                  color={color}
                  block
                  type="button"
                  disabled={!availability.enabled}
                  onClick={() => setResolutionType(type)}
                  testId={`de-resolution-${type.toLowerCase()}`}
                />
                {!availability.enabled && (
                  <p className="crvs-form-hint" style={{ margin: "4px 0 0" }}>
                    {availability.reason}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {canViewAudit && (
        <div className="crvs-section">
          <h2 className="crvs-section-title">Audit history</h2>
          {auditEvents.length === 0 ? (
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

      <div className="crvs-wizard-actions">
        <Button text="Back to divorce exceptions" appearance="ghost" type="button" onClick={() => navigate("/dashboard/crvs/divorce-exceptions")} testId="de-details-back-bottom" />
        <Button text="Open review workspace" appearance="ghost" type="button" onClick={() => navigate(`/dashboard/crvs/divorce-review/${r.id}`)} testId="de-details-open-review" />
      </div>

      {resolutionType && (
        <ResolveDivorceExceptionModal
          show={!!resolutionType}
          onClose={() => setResolutionType(undefined)}
          type={resolutionType}
          registration={r}
          onResolved={(updated) => {
            setRegistration(updated);
            setResolutionType(undefined);
          }}
        />
      )}
    </div>
  );
}
