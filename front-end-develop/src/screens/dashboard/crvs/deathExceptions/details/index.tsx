import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Empty from "@/components/empty";
import Button from "@/components/button";
import StatusBadge from "../../components/StatusBadge";
import { DescriptionList, DescriptionItem } from "@/components/descriptionList";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { hasWorkspacePermission, getCurrentAccountId, getCurrentActorName } from "@/utils/workspace";
import { demoGetDeathRegistration } from "@/demo/services/crvsDeathRegistrations";
import { DeathRegistrationCase } from "@/domain/crvs/types";
import { deceasedDisplayName, formatDateTime } from "../../deathShared";
import ResolveDeathExceptionModal, { ExceptionResolutionType } from "../components/modals/ResolveDeathExceptionModal";
import RejectDeathRegistrationModal from "../../deathReview/components/modals/RejectDeathRegistrationModal";
import "../../shared.css";

export default function DeathExceptionDetails() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const currentAccountId = getCurrentAccountId();
  const actorName = getCurrentActorName();

  const canView = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DEATH_EXCEPTIONS_VIEW);
  const canResolve = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DEATH_LATE_REVIEW) || hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DEATH_MEDICO_LEGAL_REVIEW) || hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DEATH_UNIDENTIFIED_REVIEW);
  const canReject = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DEATH_REGISTRATION_REJECT);

  const [deathCase, setDeathCase] = useState<DeathRegistrationCase | undefined>();
  const [loading, setLoading] = useState(true);
  const [resolutionType, setResolutionType] = useState<ExceptionResolutionType | undefined>();
  const [showReject, setShowReject] = useState(false);

  const load = () => {
    if (!caseId || !canView) {
      setLoading(false);
      return;
    }
    setLoading(true);
    demoGetDeathRegistration(caseId).then(setDeathCase).finally(() => setLoading(false));
  };

  useEffect(load, [caseId, canView]);

  if (!canView) {
    return (
      <div className="crvs-page">
        <Empty icon="lock" title="You don't have access to this exception" isFullScreen />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="crvs-page">
        <p className="crvs-form-hint">Loading case…</p>
      </div>
    );
  }

  if (!deathCase) {
    return (
      <div className="crvs-page">
        <Empty icon="error" title="Case not found" button={<Button text="Back to exceptions" appearance="ghost" onClick={() => navigate("/dashboard/crvs/death-exceptions")} testId="exception-back" />} />
      </div>
    );
  }

  const c = deathCase;

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 className="crvs-page-title">{c.reference}</h1>
            <p className="crvs-page-subtitle">{deceasedDisplayName(c.deceased)}</p>
          </div>
          <StatusBadge kind="deathRegistration" status={c.status} />
        </div>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <div className="crvs-section">
        <h2 className="crvs-section-title">Exception detail</h2>
        <DescriptionList columns={3}>
          <DescriptionItem label="Exception type" value={c.exception?.type.replace(/_/g, " ") || c.status.replace(/_/g, " ")} />
          <DescriptionItem label="Reason" value={c.exception?.reason || c.delayReason} />
          <DescriptionItem label="Triggering rule" value={c.exception?.triggeringRule} />
          <DescriptionItem label="Days after death" value={String(c.daysAfterDeath)} />
          <DescriptionItem label="Assigned to" value={c.reviewerName || "Unassigned"} />
          <DescriptionItem label="Exception status" value={c.exception?.status} />
        </DescriptionList>
      </div>

      <div className="crvs-section">
        <h2 className="crvs-section-title">Evidence</h2>
        {c.evidence.filter((e) => !e.removed).length === 0 ? (
          <p className="crvs-form-hint">No evidence attached.</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {c.evidence.filter((e) => !e.removed).map((ev) => (
              <li key={ev.id}>{ev.documentType} — {ev.fileName}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="crvs-section">
        <h2 className="crvs-section-title">Previous decisions</h2>
        {c.reviewDecisions.length === 0 ? (
          <p className="crvs-form-hint">No prior decisions recorded.</p>
        ) : (
          c.reviewDecisions.map((d, i) => (
            <div key={i} className="crvs-banner crvs-banner-info" style={{ marginBottom: 8 }}>
              {d.type.replace(/_/g, " ")} by {d.decidedBy} — {formatDateTime(d.decidedAt)} {d.reason ? `— ${d.reason}` : ""}
            </div>
          ))
        )}
        {c.exception?.resolution && (
          <div className="crvs-banner crvs-banner-success">
            Resolved as {c.exception.resolution.type} by {c.exception.resolution.resolvedBy} — {c.exception.resolution.reason}
          </div>
        )}
      </div>

      {canResolve && !c.exception?.resolution && (
        <div className="crvs-section">
          <h2 className="crvs-section-title">Resolution options</h2>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Button text="Clear exception" appearance="primary" onClick={() => setResolutionType("CLEAR")} testId="exception-clear" />
            <Button text="Request more information" appearance="ghost" onClick={() => setResolutionType("REQUEST_MORE_INFO")} testId="exception-request-info" />
            <Button text="Approve exception" appearance="ghost" onClick={() => setResolutionType("APPROVE_EXCEPTION")} testId="exception-approve" />
            {canReject && <Button text="Reject registration" appearance="ghost" color="red" onClick={() => setShowReject(true)} testId="exception-reject" />}
            <Button text="Escalate" appearance="ghost" onClick={() => setResolutionType("ESCALATE")} testId="exception-escalate" />
          </div>
        </div>
      )}

      {resolutionType && (
        <ResolveDeathExceptionModal
          show={!!resolutionType}
          onClose={() => setResolutionType(undefined)}
          type={resolutionType}
          deathCase={c}
          onResolved={(updated) => {
            setDeathCase(updated);
            setResolutionType(undefined);
          }}
        />
      )}

      {currentAccountId && (
        <RejectDeathRegistrationModal show={showReject} onClose={() => setShowReject(false)} deathCase={c} accountId={currentAccountId} actorName={actorName} onRejected={(updated) => setDeathCase(updated)} />
      )}
    </div>
  );
}
