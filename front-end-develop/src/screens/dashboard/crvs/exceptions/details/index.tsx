import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import Button from "@/components/button";
import Empty from "@/components/empty";
import Modal from "@/components/Modal";
import { DescriptionList, DescriptionItem } from "@/components/descriptionList";
import { cfg } from "@/constants/cfg";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { hasWorkspacePermission } from "@/utils/workspace";
import { canTransitionRegistration } from "@/domain/crvs/statusMachines";
import { BirthRegistrationCase, ExceptionType } from "@/domain/crvs/types";
import { missingEvidence } from "@/domain/crvs/evidenceRequirements";
import { demoGetRegistration, demoSetException } from "@/demo/services/crvsRegistrations";
import { demoListCrvsAuditEvents } from "@/demo/services/crvsAudit";
import { DemoAuditEvent } from "@/demo/types";
import StatusBadge from "../../components/StatusBadge";
import StatusTimeline from "../../components/StatusTimeline";
import ReassignCaseModal from "../components/modals/ReassignCaseModal";
import ResolveExceptionModal from "../components/modals/ResolveExceptionModal";
import PotentialDuplicateResolutionModal from "../components/modals/PotentialDuplicateResolutionModal";
import toastMessage from "@/utils/common/toastMessage";
import "../../shared.css";

/** Mirrors utils/workspace's own session read (same storage key, same
 * account shape) to resolve a human display name for audit/actor fields —
 * there is no exported getCurrentActorName() helper in this codebase, so
 * this is a small self-contained equivalent rather than a change to that
 * shared module. */
function currentActorName(): string {
  try {
    const key = cfg.VITE_APP_NAME || "SDID-ENROLLMENT";
    const raw = sessionStorage.getItem(key);
    if (!raw) return "CRVS Supervisor";
    const session = JSON.parse(raw);
    const account = session?.account;
    const name = [account?.firstName, account?.lastName].filter(Boolean).join(" ").trim();
    return name || account?.email || session?.email || "CRVS Supervisor";
  } catch {
    return "CRVS Supervisor";
  }
}

function maskTail(value?: string, visible = 4): string {
  if (!value) return "—";
  if (value.length <= visible) return value;
  return `••••${value.slice(-visible)}`;
}

const EXCEPTION_TYPE_OPTIONS: { value: ExceptionType; label: string }[] = [
  { value: "IDENTITY_MISMATCH", label: "Identity mismatch" },
  { value: "POTENTIAL_DUPLICATE", label: "Potential duplicate" },
  { value: "MISSING_NOTIFICATION", label: "Missing notification" },
  { value: "JURISDICTION_CONFLICT", label: "Jurisdiction conflict" },
  { value: "EVIDENCE_EXCEPTION", label: "Evidence exception" },
  { value: "SYNCHRONIZATION_FAILURE", label: "Synchronization failure" },
  { value: "OTHER", label: "Other" },
];

function EscalateExceptionModal({
  show,
  onClose,
  registrationCase,
  actorName,
  onEscalated,
}: {
  show: boolean;
  onClose: () => void;
  registrationCase: BirthRegistrationCase;
  actorName: string;
  onEscalated: (updated: BirthRegistrationCase) => void;
}) {
  const existing = registrationCase.exception;
  const [type, setType] = useState<ExceptionType>(existing?.type || "OTHER");
  const [reason, setReason] = useState(existing?.reason || "");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH">(existing?.priority || "MEDIUM");
  const [assignedTo, setAssignedTo] = useState(existing?.assignedTo || "");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | undefined>(undefined);

  const handleClose = () => {
    setFormError(undefined);
    onClose();
  };

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setFormError("A reason is required to flag this exception.");
      return;
    }
    setFormError(undefined);
    setSubmitting(true);
    try {
      const updated = await demoSetException(
        registrationCase.id,
        { type, reason: reason.trim(), priority, assignedTo: assignedTo.trim() || undefined },
        actorName
      );
      toastMessage("success", "Exception flagged and routed to exception review.");
      onEscalated(updated);
      onClose();
    } catch (e) {
      toastMessage("error", e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={existing && existing.status === "OPEN" ? "Update flagged exception" : "Escalate exception"}
      show={show}
      handleClose={handleClose}
      size="sm"
    >
      <div style={{ padding: "0 24px 24px" }}>
        <div className="crvs-form-grid">
          <div className="crvs-form-group">
            <label htmlFor="escalate-type">Exception type</label>
            <select id="escalate-type" value={type} onChange={(e) => setType(e.target.value as ExceptionType)}>
              {EXCEPTION_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="crvs-form-group">
            <label htmlFor="escalate-priority">Priority</label>
            <select id="escalate-priority" value={priority} onChange={(e) => setPriority(e.target.value as "LOW" | "MEDIUM" | "HIGH")}>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>
        </div>

        <div className="crvs-form-group" style={{ marginTop: 12 }}>
          <label htmlFor="escalate-assignee">Assign to (optional)</label>
          <input id="escalate-assignee" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} placeholder="Name of investigating officer" />
        </div>

        <div className="crvs-form-group" style={{ marginTop: 12 }}>
          <label htmlFor="escalate-reason">Reason</label>
          <textarea id="escalate-reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>

        {formError && <p className="crvs-form-error" style={{ marginTop: 12 }}>{formError}</p>}

        <div className="crvs-wizard-actions" style={{ marginTop: 20 }}>
          <Button text="Cancel" appearance="ghost" onClick={handleClose} disabled={submitting} testId="escalate-cancel" />
          <Button text="Confirm" appearance="primary" onClick={handleSubmit} loading={submitting} testId="escalate-confirm" />
        </div>
      </div>
    </Modal>
  );
}

export default function ExceptionCaseDetails() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const actorName = currentActorName();

  const [registrationCase, setRegistrationCase] = useState<BirthRegistrationCase | undefined>(undefined);
  const [auditEvents, setAuditEvents] = useState<DemoAuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);

  const [activeModal, setActiveModal] = useState<
    "reassign" | "escalate" | "return-evidence" | "return-registrar" | "reject" | "duplicate" | null
  >(null);

  const load = () => {
    if (!caseId) return;
    setLoading(true);
    setError(undefined);
    demoGetRegistration(caseId)
      .then((c) => {
        setRegistrationCase(c);
        if (c) {
          return demoListCrvsAuditEvents({ targetRef: c.reference }).then((res) => setAuditEvents(res.data));
        }
      })
      .catch((e) => setError(e?.message || "Something went wrong loading this case."))
      .finally(() => setLoading(false));
  };

  useEffect(load, [caseId]);

  if (loading) {
    return (
      <div className="crvs-page">
        <div className="crvs-section" aria-busy="true">
          Loading case…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="crvs-page">
        <Empty
          icon="error"
          title="Couldn't load this case"
          description={error}
          button={<Button text="Try again" appearance="ghost" onClick={load} testId="case-details-retry" />}
        />
      </div>
    );
  }

  if (!registrationCase) {
    return (
      <div className="crvs-page">
        <Empty icon="search_off" title="Case not found" description="This case may have been reassigned or does not exist." />
      </div>
    );
  }

  const canReassign = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.CASE_REASSIGN);
  const canEscalate = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ESCALATION_REVIEW);
  const canResolve =
    hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.EXCEPTION_RESOLVE) ||
    hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.LATE_REGISTRATION_REVIEW);
  const canReject = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.REGISTRATION_REJECT);
  const canResolveDuplicate = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DUPLICATE_CHECK_RESOLVE);

  const canReturnForEvidence = canResolve && canTransitionRegistration(registrationCase.status, "CORRECTION_REQUIRED");
  const canReturnToRegistrar = canResolve && canTransitionRegistration(registrationCase.status, "UNDER_REVIEW");
  const canRejectCase = canReject && canTransitionRegistration(registrationCase.status, "REJECTED");

  const hasUnresolvedDuplicate =
    (registrationCase.duplicateCheck?.overallLevel === "POTENTIAL" || registrationCase.duplicateCheck?.overallLevel === "PROBABLE") &&
    !registrationCase.duplicateCheck?.resolution;

  const missing = missingEvidence(registrationCase);

  const handleUpdated = (updated: BirthRegistrationCase) => {
    setRegistrationCase(updated);
    demoListCrvsAuditEvents({ targetRef: updated.reference }).then((res) => setAuditEvents(res.data));
  };

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">{registrationCase.reference}</h1>
        <p className="crvs-page-subtitle">
          {registrationCase.child.firstName} {registrationCase.child.lastName} — {registrationCase.jurisdiction}
        </p>
        <div style={{ marginTop: 8 }}>
          <StatusBadge kind="registration" status={registrationCase.status} />
        </div>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <div className="crvs-section">
        <h2 className="crvs-section-title">Status timeline</h2>
        <StatusTimeline registrationCase={registrationCase} />
      </div>

      <div className="crvs-section">
        <h2 className="crvs-section-title">Actions</h2>
        <div className="crvs-wizard-actions-right" style={{ flexWrap: "wrap" }}>
          {canReassign && <Button text="Reassign case" appearance="ghost" onClick={() => setActiveModal("reassign")} testId="action-reassign" />}
          {canEscalate && (
            <Button
              text={registrationCase.exception?.status === "OPEN" ? "Update flagged exception" : "Escalate exception"}
              appearance="ghost"
              onClick={() => setActiveModal("escalate")}
              testId="action-escalate"
            />
          )}
          {canReturnForEvidence && (
            <Button text="Return for more evidence" appearance="ghost" onClick={() => setActiveModal("return-evidence")} testId="action-return-evidence" />
          )}
          {canReturnToRegistrar && (
            <Button text="Return to Civil Registrar review" appearance="primary" onClick={() => setActiveModal("return-registrar")} testId="action-return-registrar" />
          )}
          {hasUnresolvedDuplicate && canResolveDuplicate && (
            <Button text="Resolve duplicate" appearance="ghost" onClick={() => setActiveModal("duplicate")} testId="action-resolve-duplicate" />
          )}
          {canRejectCase && (
            <Button text="Reject" appearance="ghost" color="red" onClick={() => setActiveModal("reject")} testId="action-reject" />
          )}
        </div>
        {!canReject && (
          <p className="crvs-form-hint" style={{ marginTop: 8 }}>
            Rejecting a case requires Civil Registrar authority — the Supervisor role does not reject cases directly.
          </p>
        )}
      </div>

      <div className="crvs-section">
        <h2 className="crvs-section-title">Delay / exception details</h2>
        <DescriptionList columns={3}>
          <DescriptionItem label="Days after deadline" value={registrationCase.daysAfterBirth} />
          <DescriptionItem label="Reason for delay" value={registrationCase.delayReason} />
          <DescriptionItem label="Assigned officer" value={registrationCase.reviewerName || "Unassigned"} />
          {registrationCase.exception && (
            <>
              <DescriptionItem label="Exception type" value={registrationCase.exception.type} />
              <DescriptionItem label="Exception reason" value={registrationCase.exception.reason} />
              <DescriptionItem label="Exception status" value={registrationCase.exception.status} />
            </>
          )}
        </DescriptionList>
      </div>

      <div className="crvs-section">
        <h2 className="crvs-section-title">Child, parents and declarant</h2>
        <DescriptionList columns={3}>
          <DescriptionItem
            label="Child"
            value={`${registrationCase.child.firstName || ""} ${registrationCase.child.lastName}`.trim()}
          />
          <DescriptionItem label="Date of birth" value={registrationCase.child.dateOfBirth} />
          <DescriptionItem label="Place of birth" value={registrationCase.placeOfBirth} />
          <DescriptionItem label="Mother" value={`${registrationCase.mother.firstName} ${registrationCase.mother.lastName}`} />
          <DescriptionItem label="Mother's identity" value={maskTail(registrationCase.mother.documentNumber)} />
          <DescriptionItem label="Mother verification" value={registrationCase.mother.verification} />
          <DescriptionItem
            label="Father"
            value={
              registrationCase.father.firstName
                ? `${registrationCase.father.firstName} ${registrationCase.father.lastName}`
                : registrationCase.father.availability
            }
          />
          <DescriptionItem label="Father's identity" value={maskTail(registrationCase.father.documentNumber)} />
          <DescriptionItem
            label="Declarant"
            value={`${registrationCase.declarant.firstName} ${registrationCase.declarant.lastName} (${registrationCase.declarant.relationship})`}
          />
        </DescriptionList>
      </div>

      <div className="crvs-section">
        <h2 className="crvs-section-title">Witnesses</h2>
        {registrationCase.witnesses.length === 0 ? (
          <p className="crvs-form-hint">No witnesses recorded.</p>
        ) : (
          <table className="crvs-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Relationship</th>
                <th>Identity</th>
                <th>Verification</th>
              </tr>
            </thead>
            <tbody>
              {registrationCase.witnesses.map((w) => (
                <tr key={w.id}>
                  <td>{w.firstName} {w.lastName}</td>
                  <td>{w.relationship}</td>
                  <td>{maskTail(w.documentNumber)}</td>
                  <td>{w.verification}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="crvs-section">
        <h2 className="crvs-section-title">Evidence</h2>
        <p className="crvs-form-hint">
          {missing.length === 0 ? "All required evidence has been provided." : `${missing.length} required document(s) missing.`}
        </p>
        {missing.length > 0 && (
          <ul>
            {missing.map((m) => (
              <li key={m.documentType}>
                {m.documentType} — {m.reason}
              </li>
            ))}
          </ul>
        )}
        <table className="crvs-table" style={{ marginTop: 8 }}>
          <thead>
            <tr>
              <th>Document</th>
              <th>Uploaded</th>
              <th>Verification</th>
            </tr>
          </thead>
          <tbody>
            {registrationCase.evidence.filter((e) => !e.removed).map((e) => (
              <tr key={e.id}>
                <td>{e.documentType}</td>
                <td>{new Date(e.uploadedAt).toLocaleDateString()}</td>
                <td>{e.verification}</td>
              </tr>
            ))}
            {registrationCase.evidence.filter((e) => !e.removed).length === 0 && (
              <tr>
                <td className="crvs-empty-row" colSpan={3}>No evidence uploaded.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {registrationCase.duplicateCheck && (
        <div className="crvs-section">
          <h2 className="crvs-section-title">Duplicate check</h2>
          <DescriptionList columns={3}>
            <DescriptionItem label="Overall match level" value={registrationCase.duplicateCheck.overallLevel} />
            <DescriptionItem label="Checked by" value={registrationCase.duplicateCheck.checkedBy} />
            <DescriptionItem label="Checked at" value={new Date(registrationCase.duplicateCheck.checkedAt).toLocaleString()} />
          </DescriptionList>
          <table className="crvs-table" style={{ marginTop: 8 }}>
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Match level</th>
                <th>Matched fields</th>
                <th>Existing status</th>
              </tr>
            </thead>
            <tbody>
              {registrationCase.duplicateCheck.candidates.map((c) => (
                <tr key={c.caseId}>
                  <td>{c.reference} — {c.maskedSummary}</td>
                  <td>{c.matchLevel}</td>
                  <td>{c.matchedFields.join(", ")}</td>
                  <td>{c.existingRecordStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {registrationCase.duplicateCheck.resolution && (
            <p className="crvs-form-hint" style={{ marginTop: 8 }}>
              Resolved as {registrationCase.duplicateCheck.resolution.type} by {registrationCase.duplicateCheck.resolution.resolvedBy}:{" "}
              {registrationCase.duplicateCheck.resolution.reason}
            </p>
          )}
        </div>
      )}

      <div className="crvs-section">
        <h2 className="crvs-section-title">Audit history</h2>
        {auditEvents.length === 0 ? (
          <p className="crvs-form-hint">No audit events recorded for this case yet.</p>
        ) : (
          <table className="crvs-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {auditEvents.map((e) => (
                <tr key={e.id}>
                  <td>{new Date(e.at).toLocaleString()}</td>
                  <td>{e.actor}</td>
                  <td>{e.action}</td>
                  <td>{e.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="crvs-wizard-actions">
        <Link to="/dashboard/crvs/exceptions" className="crvs-tab">
          Back to exceptions
        </Link>
      </div>

      <ReassignCaseModal
        show={activeModal === "reassign"}
        onClose={() => setActiveModal(null)}
        registrationCase={registrationCase}
        actorName={actorName}
        onReassigned={handleUpdated}
      />
      <EscalateExceptionModal
        show={activeModal === "escalate"}
        onClose={() => setActiveModal(null)}
        registrationCase={registrationCase}
        actorName={actorName}
        onEscalated={handleUpdated}
      />
      <ResolveExceptionModal
        show={activeModal === "return-evidence"}
        onClose={() => setActiveModal(null)}
        title="Return for more evidence"
        registrationCase={registrationCase}
        actorName={actorName}
        presetType="EVIDENCE_INSUFFICIENT"
        presetNextStatus="CORRECTION_REQUIRED"
        onResolved={(updated) => {
          handleUpdated(updated);
          navigate("/dashboard/crvs/exceptions/late-registrations");
        }}
      />
      <ResolveExceptionModal
        show={activeModal === "return-registrar"}
        onClose={() => setActiveModal(null)}
        title="Return to Civil Registrar review"
        registrationCase={registrationCase}
        actorName={actorName}
        presetType="REVIEW_COMPLETE"
        presetNextStatus="UNDER_REVIEW"
        onResolved={(updated) => {
          handleUpdated(updated);
          navigate("/dashboard/crvs/exceptions/late-registrations");
        }}
      />
      <ResolveExceptionModal
        show={activeModal === "reject"}
        onClose={() => setActiveModal(null)}
        title="Reject registration"
        registrationCase={registrationCase}
        actorName={actorName}
        presetType="REJECTED"
        presetNextStatus="REJECTED"
        onResolved={(updated) => {
          handleUpdated(updated);
          navigate("/dashboard/crvs/exceptions/late-registrations");
        }}
      />
      <PotentialDuplicateResolutionModal
        show={activeModal === "duplicate"}
        onClose={() => setActiveModal(null)}
        registrationCase={registrationCase}
        actorName={actorName}
        onResolved={handleUpdated}
      />
    </div>
  );
}
