import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Empty from "@/components/empty";
import Button from "@/components/button";
import Icon from "@/components/icon";
import { DescriptionList, DescriptionItem } from "@/components/descriptionList";
import StatusBadge from "../../components/StatusBadge";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { getCurrentAccountId, getCurrentActorName, hasWorkspacePermission } from "@/utils/workspace";
import { demoGetDivorceRegistration } from "@/demo/services/crvsDivorceRegistrations";
import { demoListCrvsAuditEvents } from "@/demo/services/crvsAudit";
import { DemoAuditEvent } from "@/demo/types";
import { divorcePolicyConfig } from "@/domain/crvs/divorcePolicyConfig";
import { DIVORCE_REGISTRATION_STATUS_LABELS } from "@/domain/crvs/statusMachines";
import { DivorceRegistration } from "@/domain/crvs/types";
import {
  activeEvidence,
  DIVORCE_DECISION_TYPE_LABELS,
  FOREIGN_RECOGNITION_STATUS_LABELS,
  divorceSlaState,
  formatDate,
  formatDateTime,
  formerSpouseDisplayName,
  formerSpousesLabel,
} from "../../divorceShared";
import {
  ApproveForeignRecognitionModal,
  ConfirmForeignRequirementsModal,
  InitializeForeignRecognitionModal,
  RejectForeignRecognitionModal,
  RequestForeignEvidenceModal,
  RouteForeignToLegalReviewModal,
} from "../components/modals/ForeignRecognitionModals";
import "../../shared.css";
import "../../review/review.css";

type ActionKind = "INITIALIZE" | "REQUEST_EVIDENCE" | "CONFIRM" | "LEGAL_REVIEW" | "APPROVE" | "REJECT";

/** One configured recognition requirement, rendered as its own pass/fail
 * line — spec §19 requires each to be shown separately rather than as a
 * single collapsed recognition badge. */
function RequirementRow({ label, required, provided }: { label: string; required: boolean; provided: boolean }) {
  const met = !required || provided;
  return (
    <li style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
      <span className={`crvs-status-pill crvs-status-${met ? "success" : "danger"} crvs-status-icon-label`} style={{ flexShrink: 0 }}>
        <Icon name={met ? "check_circle" : "cancel"} />
        {met ? "Met" : "Outstanding"}
      </span>
      <span>
        <strong>{label}</strong>
        <div className="crvs-form-hint">{!required ? "Not required for this decision." : provided ? "Recorded as provided." : "Required by policy and not yet provided."}</div>
      </span>
    </li>
  );
}

/**
 * Specialized foreign-decision review page (spec §5D/§19). Shows the issuing
 * country, authority, both former spouses' nationalities, the judgment, and
 * each configured recognition requirement as its own line, together with the
 * supervisor's notes and the five recognition actions.
 */
export default function ForeignDivorceDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentAccountId = getCurrentAccountId();
  const actorName = getCurrentActorName();

  const canView = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_FOREIGN_JUDGMENT_REVIEW);
  const canViewAudit = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_AUDIT_VIEW);

  const [registration, setRegistration] = useState<DivorceRegistration | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [auditEvents, setAuditEvents] = useState<DemoAuditEvent[]>([]);
  const [action, setAction] = useState<ActionKind | undefined>();

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
        setError("This divorce registration was not found.");
        setRegistration(undefined);
        return;
      }
      setRegistration(found);
      if (canViewAudit) {
        const res = await demoListCrvsAuditEvents({ targetRef: found.reference, limit: 200 });
        setAuditEvents(res.data.filter((e) => e.module === "crvs.divorce_foreign_review" || e.module.startsWith("crvs.divorce")));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load this foreign decision.");
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
        <Empty
          icon="lock"
          title="You don't have access to foreign-decision review"
          description="Reviewing foreign divorce decisions requires divorce-foreign-judgment-review access."
          isFullScreen
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="crvs-page">
        <Empty icon="hourglass_empty" title="Loading foreign decision…" isFullScreen />
      </div>
    );
  }

  if (error || !registration) {
    return (
      <div className="crvs-page">
        <Empty
          icon="error"
          title="Couldn't open this foreign decision"
          description={error || "This divorce registration was not found."}
          isFullScreen
          button={<Button text="Back to foreign divorce decisions" appearance="ghost" type="button" onClick={() => navigate("/dashboard/crvs/foreign-divorces")} testId="fd-details-back" />}
        />
      </div>
    );
  }

  const r = registration;
  const recognition = r.foreignRecognition;
  const sla = divorceSlaState(r);
  const notStarted = recognition.status === "NOT_APPLICABLE";
  const decided = recognition.status === "REJECTED";
  const evidence = activeEvidence(r.evidence);
  const foreignDocs = evidence.filter((e) => divorcePolicyConfig.requiredDocuments.FOREIGN.includes(e.documentType));

  const gate = (permitted: boolean, extraBlock?: string) => {
    if (!permitted) return { enabled: false, reason: "Foreign-decision actions require divorce-foreign-judgment-review access." };
    if (decided) return { enabled: false, reason: "This foreign-decision verification has already been rejected." };
    if (extraBlock) return { enabled: false, reason: extraBlock };
    return { enabled: true, reason: "" };
  };

  const initializeState = gate(canView, notStarted ? undefined : "Recognition review has already been started for this case.");
  const evidenceState = gate(canView, notStarted ? "Start the recognition review before requesting evidence." : undefined);
  const confirmState = gate(canView, notStarted ? "Start the recognition review before confirming requirements." : undefined);
  const legalReviewState = gate(canView, notStarted ? "Start the recognition review before routing for legal review." : undefined);
  const approveState = gate(
    canView,
    notStarted
      ? "Start the recognition review before approving verification."
      : r.status !== "FOREIGN_JUDGMENT_REVIEW"
      ? `Approval is only available while the case is in foreign judgment review (currently ${DIVORCE_REGISTRATION_STATUS_LABELS[r.status].toLowerCase()}).`
      : undefined
  );
  const rejectState = gate(canView, r.status !== "FOREIGN_JUDGMENT_REVIEW" ? `Rejection is only available while the case is in foreign judgment review (currently ${DIVORCE_REGISTRATION_STATUS_LABELS[r.status].toLowerCase()}).` : undefined);

  const ActionButton = ({
    label,
    state,
    onClick,
    appearance = "default",
    color,
    testId,
  }: {
    label: string;
    state: { enabled: boolean; reason: string };
    onClick: () => void;
    appearance?: "primary" | "ghost" | "default";
    color?: "red";
    testId: string;
  }) => (
    <div title={state.enabled ? undefined : state.reason}>
      <Button text={label} appearance={appearance} color={color} block type="button" disabled={!state.enabled} onClick={onClick} testId={testId} />
      {!state.enabled && (
        <p className="crvs-form-hint" style={{ margin: "4px 0 0" }}>
          {state.reason}
        </p>
      )}
    </div>
  );

  return (
    <div className="crvs-page">
      <div className="crvs-section review-case-header">
        <div>
          <h1 className="crvs-page-title">{r.reference}</h1>
          <div className="review-case-meta">
            <StatusBadge kind="divorceRegistration" status={r.status} />
            <span>{formerSpousesLabel(r)}</span>
            <span>{recognition.country || r.judgment.country || "Country not recorded"}</span>
            <span className="crvs-status-pill crvs-status-info">{FOREIGN_RECOGNITION_STATUS_LABELS[recognition.status]}</span>
            {r.status !== "REGISTERED" && r.status !== "REJECTED" && r.status !== "CANCELLED" && <span className={`crvs-status-pill crvs-status-${sla.tone}`}>{sla.label}</span>}
          </div>
          <span className="crvs-demo-note">Demo data — fictional</span>
        </div>
      </div>

      <div className="crvs-banner crvs-banner-info">
        <Icon name="info" />
        <span>
          This page is a configured frontend policy workflow only. Recording an outcome here documents whether the demo&apos;s recognition requirements are met — it is never a binding legal determination
          about the effect of a foreign decision.
        </span>
      </div>

      <div className="crvs-section">
        <h2 className="crvs-section-title">Foreign decision</h2>
        <DescriptionList columns={3}>
          <DescriptionItem label="Issuing country" value={recognition.country || r.judgment.country} />
          <DescriptionItem label="Foreign court or authority" value={recognition.foreignCourtOrAuthority || r.judgment.courtOrAuthorityName} />
          <DescriptionItem label="Court case number" value={r.judgment.courtCaseNumber} />
          <DescriptionItem label="Judgment number" value={r.judgment.judgmentNumber} />
          <DescriptionItem label="Judgment date" value={formatDate(r.judgment.judgmentDate)} />
          <DescriptionItem label="Final on" value={r.judgment.finalityDate ? formatDate(r.judgment.finalityDate) : "Not reported"} />
          <DescriptionItem label="Decision type" value={DIVORCE_DECISION_TYPE_LABELS[r.judgment.decisionType]} />
          <DescriptionItem label="Court registry reference" value={r.judgment.courtRegistryReference} />
          <DescriptionItem label="Verification source" value={r.judgment.verificationSource} />
        </DescriptionList>
      </div>

      <div className="crvs-section">
        <h2 className="crvs-section-title">Former spouses&apos; nationalities</h2>
        <DescriptionList columns={2}>
          <DescriptionItem label={formerSpouseDisplayName(r.formerSpouse1)} value={recognition.spouse1Nationality || r.formerSpouse1.nationality} />
          <DescriptionItem label={formerSpouseDisplayName(r.formerSpouse2)} value={recognition.spouse2Nationality || r.formerSpouse2.nationality} />
        </DescriptionList>
      </div>

      <div className="crvs-section">
        <h2 className="crvs-section-title">Applicable recognition requirements</h2>
        <p className="crvs-form-hint">
          Each configured requirement is assessed and shown separately. Policy defaults: translation {divorcePolicyConfig.foreignJudgment.translationRequiredByDefault ? "required" : "not required"},
          authentication {divorcePolicyConfig.foreignJudgment.authenticationRequiredByDefault ? "required" : "not required"}, exequatur or recognition{" "}
          {divorcePolicyConfig.foreignJudgment.exequaturOrRecognitionRequiredByDefault ? "required" : "not required"}
          {divorcePolicyConfig.foreignJudgment.alwaysRequiresSupervisorLegalReview ? ", supervisor legal review always required" : ""}.
        </p>
        <ul style={{ listStyle: "none", margin: "12px 0 0", padding: 0, display: "flex", flexDirection: "column", gap: 10 }} data-testid="foreign-recognition-requirements">
          <RequirementRow label="Certified translation" required={recognition.translationRequired} provided={recognition.translationProvided} />
          <RequirementRow label="Authentication or legalization" required={recognition.authenticationRequired} provided={recognition.authenticationProvided} />
          <RequirementRow label="Rwandan recognition (exequatur or recognition judgment)" required={recognition.exequaturOrRecognitionRequired} provided={recognition.exequaturOrRecognitionProvided} />
        </ul>
        <div className={`crvs-banner ${recognition.missingRequirements.length === 0 ? "crvs-banner-info" : "crvs-banner-warning"}`} style={{ marginTop: 12 }}>
          {recognition.missingRequirements.length === 0 ? "No outstanding requirements are currently recorded." : `Recorded as outstanding: ${recognition.missingRequirements.join(", ")}.`}
        </div>
      </div>

      <div className="crvs-section">
        <h2 className="crvs-section-title">Foreign supporting documents</h2>
        {foreignDocs.length === 0 ? (
          <p className="crvs-form-hint">No foreign-specific supporting documents are attached to this case.</p>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            {foreignDocs.map((ev) => (
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
        <h2 className="crvs-section-title">Supervisor notes</h2>
        <p className="crvs-form-hint">{recognition.supervisorNotes || "No supervisor notes have been recorded on this recognition review."}</p>
        {recognition.reviewedBy && (
          <p className="crvs-form-hint">
            Last reviewed by {recognition.reviewedBy}
            {recognition.reviewedAt ? ` on ${formatDateTime(recognition.reviewedAt)}` : ""}.
          </p>
        )}
      </div>

      <div className="crvs-section">
        <h2 className="crvs-section-title">Recognition actions</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 10 }}>
          {notStarted && <ActionButton label="Start recognition review" state={initializeState} appearance="primary" onClick={() => setAction("INITIALIZE")} testId="fd-action-initialize" />}
          <ActionButton label="Request evidence" state={evidenceState} onClick={() => setAction("REQUEST_EVIDENCE")} testId="fd-action-request-evidence" />
          <ActionButton label="Confirm recognition requirements satisfied" state={confirmState} onClick={() => setAction("CONFIRM")} testId="fd-action-confirm" />
          <ActionButton label="Route to legal or manual review" state={legalReviewState} onClick={() => setAction("LEGAL_REVIEW")} testId="fd-action-legal-review" />
          <ActionButton label="Approve foreign-decision verification" state={approveState} appearance="primary" onClick={() => setAction("APPROVE")} testId="fd-action-approve" />
          <ActionButton label="Reject foreign-decision verification" state={rejectState} appearance="ghost" color="red" onClick={() => setAction("REJECT")} testId="fd-action-reject" />
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
        <Button text="Back to foreign divorce decisions" appearance="ghost" type="button" onClick={() => navigate("/dashboard/crvs/foreign-divorces")} testId="fd-details-back-bottom" />
        <Button text="Open review workspace" appearance="ghost" type="button" onClick={() => navigate(`/dashboard/crvs/divorce-review/${r.id}`)} testId="fd-details-open-review" />
      </div>

      <InitializeForeignRecognitionModal show={action === "INITIALIZE"} onClose={() => setAction(undefined)} registration={r} actorName={actorName} onInitialized={setRegistration} />
      <RequestForeignEvidenceModal
        show={action === "REQUEST_EVIDENCE"}
        onClose={() => setAction(undefined)}
        registration={r}
        actorName={actorName}
        onRequested={(updated) => {
          setRegistration(updated);
          setAction(undefined);
        }}
      />
      <ConfirmForeignRequirementsModal show={action === "CONFIRM"} onClose={() => setAction(undefined)} registration={r} actorName={actorName} onConfirmed={setRegistration} />
      <RouteForeignToLegalReviewModal
        show={action === "LEGAL_REVIEW"}
        onClose={() => setAction(undefined)}
        registration={r}
        actorName={actorName}
        onRouted={(updated) => {
          setRegistration(updated);
          setAction(undefined);
        }}
      />
      <ApproveForeignRecognitionModal show={action === "APPROVE"} onClose={() => setAction(undefined)} registration={r} nextStatus="UNDER_REVIEW" actorName={actorName} onApproved={setRegistration} />
      {currentAccountId && (
        <RejectForeignRecognitionModal
          show={action === "REJECT"}
          onClose={() => setAction(undefined)}
          registration={r}
          accountId={currentAccountId}
          actorName={actorName}
          onRejected={(updated) => {
            setRegistration(updated);
            setAction(undefined);
          }}
        />
      )}
    </div>
  );
}
