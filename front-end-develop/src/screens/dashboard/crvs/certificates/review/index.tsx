import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "@/components/button";
import Empty from "@/components/empty";
import Icon from "@/components/icon";
import StatusBadge from "../../components/StatusBadge";
import ConfirmActionModal from "@/components/crvs/modals/ConfirmActionModal";
import StructuredReasonModal from "@/components/crvs/modals/StructuredReasonModal";
import WarningModal from "@/components/crvs/modals/WarningModal";
import {
  demoApproveCertificateRequest,
  demoGetCertificateRequest,
  demoHoldCertificateRequest,
  demoRejectCertificateRequest,
  demoReassignCertificateRequest,
  demoRequestCertificateInformation,
  demoStartCertificateReview,
  demoWaiveFee,
} from "@/demo/services/crvsCertificates";
import { demoListCrvsAuditEvents } from "@/demo/services/crvsAudit";
import { BirthCertificateRequest } from "@/domain/crvs/types";
import { DemoAuditEvent } from "@/demo/types";
import { certificateReviewConflictReasons } from "@/utils/workspace/crvsRules";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { getCurrentAccountId, hasWorkspacePermission } from "@/utils/workspace";
import toastMessage from "@/utils/common/toastMessage";
import { formatDateTime, formatMoney, fullName, getActorReference, humanizeEnum } from "../utils";
import "../../shared.css";
import "../../review/review.css";

function ChecklistItem({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
      <Icon name={ok ? "check_circle" : "radio_button_unchecked"} styles={{ color: ok ? "var(--status-success)" : "var(--text-muted)" }} />
      <span>{label}</span>
    </li>
  );
}

export default function CertificateReviewWorkspace() {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const actor = getActorReference();
  const currentAccountId = getCurrentAccountId();

  const canView = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.CERTIFICATE_REVIEW_VIEW);
  const canStart = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.CERTIFICATE_REVIEW_START);
  const canApprove = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.CERTIFICATE_REVIEW_APPROVE);
  const canReject = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.CERTIFICATE_REVIEW_REJECT);
  const canHold = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.CERTIFICATE_REVIEW_HOLD);
  const canReassign = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.CASE_REASSIGN);
  const canWaive = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.CERTIFICATE_PAYMENT_WAIVE);
  const canViewAudit = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.CERTIFICATE_AUDIT_VIEW);

  const [request, setRequest] = useState<BirthCertificateRequest | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [auditEvents, setAuditEvents] = useState<DemoAuditEvent[]>([]);

  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [showHold, setShowHold] = useState(false);
  const [showReassign, setShowReassign] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showConflict, setShowConflict] = useState(false);
  const [showWaive, setShowWaive] = useState(false);

  const load = useCallback(async () => {
    if (!requestId) return;
    setLoading(true);
    setError(undefined);
    try {
      const found = await demoGetCertificateRequest(requestId);
      if (!found) {
        setError("This certificate request was not found.");
        return;
      }
      setRequest(found);
      if (canViewAudit) {
        const audit = await demoListCrvsAuditEvents({ targetRef: found.applicationReference });
        setAuditEvents(audit.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load this request.");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId]);

  useEffect(() => {
    load();
  }, [load]);

  const coiReasons = useMemo(
    () => (request ? certificateReviewConflictReasons(currentAccountId, request) : []),
    [request, currentAccountId]
  );

  const handleStart = async () => {
    if (!request) return;
    try {
      const updated = demoStartCertificateReview(request.id, actor);
      setRequest(updated);
      toastMessage("success", "Request locked to you for review.");
    } catch (err) {
      toastMessage("error", err);
    }
  };

  if (!canView) {
    return (
      <div className="crvs-page">
        <Empty icon="lock" title="You don't have access to certificate review" isFullScreen />
      </div>
    );
  }
  if (loading) {
    return (
      <div className="crvs-page">
        <Empty icon="hourglass_empty" title="Loading request…" isFullScreen />
      </div>
    );
  }
  if (error || !request) {
    return (
      <div className="crvs-page">
        <Empty
          icon="error"
          title="Couldn't open this request"
          description={error}
          isFullScreen
          button={<Button text="Back to manual review" appearance="ghost" onClick={() => navigate("/dashboard/crvs/certificates/manual-review")} />}
        />
      </div>
    );
  }

  const r = request;
  const paymentOk = r.payment.status === "PAID" || r.payment.status === "WAIVED" || r.payment.status === "NOT_REQUIRED";
  const isLockedByOther = !!r.assignedRegistrar && r.assignedRegistrar.id !== currentAccountId;
  const isMine = !!r.assignedRegistrar && r.assignedRegistrar.id === currentAccountId;
  const canDecide = isMine && r.status === "MANUAL_REVIEW" && coiReasons.length === 0;

  return (
    <div className="crvs-page">
      <div className="crvs-section review-case-header">
        <div>
          <h1 className="crvs-page-title">{r.applicationReference}</h1>
          <div className="review-case-meta">
            <StatusBadge kind="certificateRequest" status={r.status} />
            <span>{fullName(r.subject.firstName, undefined, r.subject.lastName) || "Subject not matched"}</span>
            <span>{r.channel.replace(/_/g, " ")}</span>
          </div>
        </div>
        {isLockedByOther ? (
          <div className="crvs-banner crvs-banner-warning">Locked by {r.assignedRegistrar?.name} — read only.</div>
        ) : !isMine && canStart && r.status === "MANUAL_REVIEW" ? (
          <Button text="Start review" appearance="primary" onClick={handleStart} testId="workspace-start-review" />
        ) : null}
      </div>

      <div className="review-layout">
        <div className="review-main">
          <section className="crvs-review-section">
            <h3 className="crvs-section-title">Requester &amp; relationship</h3>
            <dl className="review-readonly-fields">
              <Field label="Type" value={humanizeEnum(r.requester.requesterType)} />
              <Field label="Name" value={fullName(r.requester.firstName, undefined, r.requester.lastName)} />
              <Field label="Relationship" value={r.requester.relationshipToSubject || "—"} />
              <Field label="Verification" value={humanizeEnum(r.requester.verificationStatus)} />
            </dl>
          </section>

          <section className="crvs-review-section">
            <h3 className="crvs-section-title">Birth-record summary</h3>
            <dl className="review-readonly-fields">
              <Field label="Name" value={fullName(r.subject.firstName, r.subject.middleName, r.subject.lastName)} />
              <Field label="Date of birth" value={r.subject.dateOfBirth} />
              <Field label="Birth record number" value={r.subject.birthRecordNumber || "—"} />
              <Field label="NIN" value={r.subject.ninMasked || "Not yet assigned"} />
            </dl>
          </section>

          <section className="crvs-review-section">
            <h3 className="crvs-section-title">Eligibility results</h3>
            <p>Status: <strong>{humanizeEnum(r.eligibility.status)}</strong></p>
            {r.eligibility.reasons.length > 0 && (
              <ul style={{ paddingLeft: 20 }}>
                {r.eligibility.reasons.map((reason, i) => (
                  <li key={i}>{reason}</li>
                ))}
              </ul>
            )}
          </section>

          <section className="crvs-review-section">
            <h3 className="crvs-section-title">Payment</h3>
            <dl className="review-readonly-fields">
              <Field label="Status" value={humanizeEnum(r.payment.status)} />
              <Field label="Fee" value={formatMoney(r.payment.amount, r.payment.currency)} />
              {r.payment.waivedReason && <Field label="Waiver" value={`${r.payment.waivedCategory}: ${r.payment.waivedReason}`} />}
            </dl>
          </section>

          <section className="crvs-review-section">
            <h3 className="crvs-section-title">Delivery preference</h3>
            <dl className="review-readonly-fields">
              <Field label="Method" value={humanizeEnum(r.delivery.method)} />
              <Field label="Destination" value={r.delivery.destinationMasked || "—"} />
            </dl>
          </section>

          {r.informationRequested && (
            <section className="crvs-review-section">
              <h3 className="crvs-section-title">Information requested</h3>
              <p>{r.informationRequested.note}</p>
              <p className="crvs-form-hint">Requested by {r.informationRequested.by} on {formatDateTime(r.informationRequested.at)}</p>
            </section>
          )}

          {r.holdReason && (
            <div className="crvs-banner crvs-banner-warning">
              On hold: {r.holdReason}{r.holdReviewDate ? ` — review by ${r.holdReviewDate}` : ""}
            </div>
          )}

          {canViewAudit && (
            <section className="crvs-review-section">
              <h3 className="crvs-section-title">Audit history</h3>
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
            </section>
          )}
        </div>

        <aside className="review-action-rail">
          <h3>Review checklist</h3>
          <ul style={{ listStyle: "none", margin: "0 0 16px", padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            <ChecklistItem ok={r.requester.verificationStatus === "VERIFIED"} label="Requester verified" />
            <ChecklistItem ok={!!r.requester.relationshipToSubject || r.requester.requesterType === "SELF"} label="Relationship permitted" />
            <ChecklistItem ok={!!r.subject.birthRecordId} label="Birth record matched" />
            <ChecklistItem ok={paymentOk} label="Payment or waiver valid" />
            <ChecklistItem ok={coiReasons.length === 0} label="No reviewer conflict of interest" />
            <ChecklistItem ok={canDecide} label="Ready for a decision" />
          </ul>

          {coiReasons.length > 0 && (
            <Button text="View conflict of interest" appearance="ghost" color="red" block onClick={() => setShowConflict(true)} testId="rail-view-coi" />
          )}

          {canDecide && (
            <>
              {canHold && <Button text="Place on hold" appearance="default" block onClick={() => setShowHold(true)} testId="rail-hold" />}
              {canHold && <Button text="Request more information" appearance="default" block onClick={() => setShowInfo(true)} testId="rail-request-info" />}
              {canReassign && <Button text="Reassign" appearance="default" block onClick={() => setShowReassign(true)} testId="rail-reassign" />}
              {canWaive && !paymentOk && (
                <Button text="Waive fee" appearance="default" block onClick={() => setShowWaive(true)} testId="rail-waive-fee" />
              )}
              {canApprove && (
                <Button text="Approve" appearance="primary" block onClick={() => setShowApprove(true)} testId="rail-approve" disabled={!paymentOk} />
              )}
              {canReject && (
                <Button text="Reject" appearance="ghost" color="red" block onClick={() => setShowReject(true)} testId="rail-reject" />
              )}
            </>
          )}
          {!canDecide && r.status !== "MANUAL_REVIEW" && (
            <p className="crvs-form-hint">No further decision actions are available while this request is {humanizeEnum(r.status).toLowerCase()}.</p>
          )}
        </aside>
      </div>

      <ConfirmActionModal
        show={showApprove}
        onClose={() => setShowApprove(false)}
        onConfirm={async () => {
          const updated = demoApproveCertificateRequest(r.id, actor);
          toastMessage("success", `${updated.applicationReference} approved. A demo certificate has been generated.`);
          navigate(updated.certificateId ? `/dashboard/crvs/certificates/issued/${updated.certificateId}` : `/dashboard/crvs/certificates/requests/${updated.id}`);
        }}
        title="Approve certificate request"
        description={r.applicationReference}
        confirmLabel="Approve & issue"
        testId="approve-certificate-modal"
      >
        <p>
          Approving generates a demo certificate reflecting the registered record ({r.subject.birthRecordNumber}). Payment
          status: {humanizeEnum(r.payment.status)}. Delivery: {humanizeEnum(r.delivery.method)}.
        </p>
      </ConfirmActionModal>

      <StructuredReasonModal
        show={showReject}
        onClose={() => setShowReject(false)}
        onSubmit={async (value) => {
          const updated = demoRejectCertificateRequest(r.id, { reason: value.reason, explanation: value.note, applicantNotified: true }, actor);
          setRequest(updated);
          toastMessage("success", "Request rejected.");
        }}
        title="Reject certificate request"
        description="The applicant will be notified through public tracking."
        reasonOptions={[
          { value: "INELIGIBLE_REQUESTER", label: "Requester not eligible to request this certificate" },
          { value: "RECORD_ISSUE", label: "Underlying birth record issue" },
          { value: "INSUFFICIENT_EVIDENCE", label: "Insufficient supporting evidence" },
          { value: "OTHER", label: "Other" },
        ]}
        noteLabel="Explanation"
        noteRequired
        requireConfirmation
        confirmationLabel="I confirm this rejection is accurate and final."
        submitLabel="Reject request"
        destructive
        testId="reject-certificate-modal"
      />

      <StructuredReasonModal
        show={showHold}
        onClose={() => setShowHold(false)}
        onSubmit={async (value) => {
          const updated = demoHoldCertificateRequest(r.id, { reason: value.reason, note: value.note }, getActorReference().name);
          setRequest(updated);
          toastMessage("success", "Request placed on hold.");
        }}
        title="Place on hold"
        reasonOptions={[
          { value: "AWAITING_DOCUMENTS", label: "Awaiting supporting documents" },
          { value: "AWAITING_RECORD_RESOLUTION", label: "Awaiting underlying record resolution" },
          { value: "OTHER", label: "Other" },
        ]}
        submitLabel="Place on hold"
        testId="hold-certificate-modal"
      />

      <StructuredReasonModal
        show={showInfo}
        onClose={() => setShowInfo(false)}
        onSubmit={async (value) => {
          const updated = demoRequestCertificateInformation(r.id, { note: value.note }, getActorReference().name);
          setRequest(updated);
          toastMessage("success", "Information request recorded.");
        }}
        title="Request more information"
        reasonOptions={[
          { value: "IDENTITY_EVIDENCE", label: "Additional identity evidence" },
          { value: "RELATIONSHIP_EVIDENCE", label: "Relationship/authorization evidence" },
          { value: "OTHER", label: "Other" },
        ]}
        noteLabel="What is required"
        noteRequired
        submitLabel="Request information"
        testId="request-info-modal"
      />

      <StructuredReasonModal
        show={showReassign}
        onClose={() => setShowReassign(false)}
        onSubmit={async (value) => {
          const updated = demoReassignCertificateRequest(
            r.id,
            { id: `reassigned-${Date.now()}`, name: value.note || "Reassigned reviewer" },
            "REGISTRAR",
            value.reason,
            getActorReference().name
          );
          setRequest(updated);
          toastMessage("success", "Request reassigned.");
        }}
        title="Reassign request"
        description="Demo mode: enter the receiving staff member's name in the note."
        reasonOptions={[
          { value: "WORKLOAD", label: "Workload balancing" },
          { value: "JURISDICTION", label: "Jurisdiction transfer" },
          { value: "OTHER", label: "Other" },
        ]}
        noteLabel="Receiving staff member"
        noteRequired
        submitLabel="Reassign"
        testId="reassign-certificate-modal"
      />

      <StructuredReasonModal
        show={showWaive}
        onClose={() => setShowWaive(false)}
        onSubmit={async (value) => {
          const updated = demoWaiveFee(r.id, { category: value.reason, reason: value.note || value.reason, note: value.note }, actor);
          setRequest(updated);
          toastMessage("success", "Fee waived.");
        }}
        title="Waive fee"
        description={r.applicationReference}
        reasonOptions={[
          { value: "FINANCIAL_HARDSHIP", label: "Financial hardship" },
          { value: "REPLACEMENT_ERROR", label: "Replacement for platform error" },
          { value: "GOVERNMENT_PROGRAM", label: "Government program exemption" },
          { value: "OTHER", label: "Other (specify in note)" },
        ]}
        noteLabel="Supporting note"
        noteRequired
        requireConfirmation
        confirmationLabel="I confirm I have the authority to waive this fee."
        submitLabel="Waive fee"
        testId="waive-fee-modal"
      />

      <WarningModal show={showConflict} onClose={() => setShowConflict(false)} title="Conflict of interest" testId="coi-modal">
        <ul style={{ paddingLeft: 20, margin: 0 }}>
          {coiReasons.map((reason, i) => (
            <li key={i}>{reason}</li>
          ))}
        </ul>
        <p className="crvs-form-hint" style={{ marginTop: 8 }}>You cannot approve or reject this request.</p>
      </WarningModal>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
