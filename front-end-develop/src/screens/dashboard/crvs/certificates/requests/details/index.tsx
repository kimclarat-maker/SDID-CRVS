import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "@/components/button";
import Empty from "@/components/empty";
import StatusBadge from "../../../components/StatusBadge";
import ConfirmActionModal from "@/components/crvs/modals/ConfirmActionModal";
import {
  demoGetCertificateRequest,
  demoRetryDelivery,
  demoRetryPayment,
} from "@/demo/services/crvsCertificates";
import { demoListCrvsAuditEvents } from "@/demo/services/crvsAudit";
import { BirthCertificateRequest } from "@/domain/crvs/types";
import { DemoAuditEvent } from "@/demo/types";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { hasWorkspacePermission } from "@/utils/workspace";
import { formatDateTime, formatMoney, fullName, getCurrentActorName, humanizeEnum } from "../../utils";
import toastMessage from "@/utils/common/toastMessage";
import "../../../shared.css";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export default function CertificateRequestDetails() {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const actorName = getCurrentActorName();

  const [request, setRequest] = useState<BirthCertificateRequest | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [auditEvents, setAuditEvents] = useState<DemoAuditEvent[]>([]);
  const [showRetryDelivery, setShowRetryDelivery] = useState(false);

  const canView = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.CERTIFICATE_REQUEST_VIEW);
  const canRecordPayment = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.CERTIFICATE_PAYMENT_RECORD);
  const canRetryDelivery = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.CERTIFICATE_DELIVERY_RETRY);
  const canViewAudit = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.CERTIFICATE_AUDIT_VIEW);

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

  if (!canView) {
    return (
      <div className="crvs-page">
        <Empty icon="lock" title="You don't have access to this request" isFullScreen />
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
          button={<Button text="Back to requests" appearance="ghost" onClick={() => navigate("/dashboard/crvs/certificates/requests")} />}
        />
      </div>
    );
  }

  const r = request;

  return (
    <div className="crvs-page">
      <div className="crvs-section review-case-header">
        <div>
          <h1 className="crvs-page-title">{r.applicationReference}</h1>
          <div className="review-case-meta">
            <StatusBadge kind="certificateRequest" status={r.status} />
            <span>{r.channel.replace(/_/g, " ")}</span>
            {r.subject.lastName && <span>{fullName(r.subject.firstName, undefined, r.subject.lastName)}</span>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {r.status === "MANUAL_REVIEW" && (
            <Button text="Open review workspace" appearance="primary" onClick={() => navigate(`/dashboard/crvs/certificates/review/${r.id}`)} testId="detail-open-review" />
          )}
          {canRecordPayment && r.status === "PAYMENT_FAILED" && (
            <Button
              text="Retry payment"
              appearance="ghost"
              onClick={async () => {
                try {
                  const updated = demoRetryPayment(r.id, actorName);
                  setRequest(updated);
                  toastMessage("success", "Payment moved back to pending.");
                } catch (err) {
                  toastMessage("error", err);
                }
              }}
              testId="detail-retry-payment"
            />
          )}
          {canRetryDelivery && r.status === "DELIVERY_FAILED" && (
            <Button text="Retry delivery" appearance="ghost" onClick={() => setShowRetryDelivery(true)} testId="detail-retry-delivery" />
          )}
          {r.certificateId && (
            <Button text="View certificate" appearance="ghost" onClick={() => navigate(`/dashboard/crvs/certificates/issued/${r.certificateId}`)} testId="detail-view-certificate" />
          )}
        </div>
      </div>

      <div className="review-layout">
        <div className="review-main">
          <section className="crvs-review-section">
            <h3 className="crvs-section-title">Requester</h3>
            <dl className="review-readonly-fields">
              <Field label="Type" value={humanizeEnum(r.requester.requesterType)} />
              <Field label="Name" value={fullName(r.requester.firstName, undefined, r.requester.lastName)} />
              <Field label="Document" value={`${humanizeEnum(r.requester.documentType)} · ${r.requester.documentNumberMasked}`} />
              <Field label="Relationship to subject" value={r.requester.relationshipToSubject || "—"} />
              <Field label="Phone" value={r.requester.phoneNumberMasked || "—"} />
              <Field label="Email" value={r.requester.emailMasked || "—"} />
              <Field label="Verification status" value={humanizeEnum(r.requester.verificationStatus)} />
            </dl>
          </section>

          <section className="crvs-review-section">
            <h3 className="crvs-section-title">Subject &amp; birth record</h3>
            {r.subject.birthRecordId ? (
              <dl className="review-readonly-fields">
                <Field label="Name" value={fullName(r.subject.firstName, r.subject.middleName, r.subject.lastName)} />
                <Field label="Date of birth" value={r.subject.dateOfBirth} />
                <Field label="Birth record number" value={r.subject.birthRecordNumber} />
                <Field label="NIN" value={r.subject.ninMasked || "Not yet assigned"} />
                <Field label="Place of birth" value={r.subject.placeOfBirthSummary} />
              </dl>
            ) : (
              <p className="crvs-form-hint">No birth record has been matched to this request yet.</p>
            )}
          </section>

          <section className="crvs-review-section">
            <h3 className="crvs-section-title">Purpose &amp; delivery</h3>
            <dl className="review-readonly-fields">
              <Field label="Purpose" value={humanizeEnum(r.purpose)} />
              {r.purposeDescription && <Field label="Details" value={r.purposeDescription} />}
              {r.replacementIndicator && <Field label="Replacing certificate" value={r.replacedCertificateNumber || "—"} />}
              <Field label="Delivery method" value={humanizeEnum(r.delivery.method)} />
              <Field label="Delivery status" value={humanizeEnum(r.delivery.status)} />
              <Field label="Destination" value={r.delivery.destinationMasked || "—"} />
            </dl>
          </section>

          <section className="crvs-review-section">
            <h3 className="crvs-section-title">Eligibility</h3>
            <dl className="review-readonly-fields">
              <Field label="Status" value={humanizeEnum(r.eligibility.status)} />
              <Field label="Checked" value={formatDateTime(r.eligibility.checkedAt)} />
            </dl>
            {r.eligibility.reasons.length > 0 && (
              <ul style={{ margin: "8px 0 0", paddingLeft: 20 }}>
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
              <Field label="Billing reference" value={r.payment.billingReference || "—"} />
              <Field label="Receipt reference" value={r.payment.receiptReference || "—"} />
              {r.payment.waivedReason && <Field label="Waiver" value={`${r.payment.waivedCategory}: ${r.payment.waivedReason}`} />}
            </dl>
          </section>

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
          <h3>Status history</h3>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            {r.statusHistory.map((h, i) => (
              <li key={i} className="crvs-form-hint">
                <StatusBadge kind="certificateRequest" status={h.status} /> — {formatDateTime(h.at)} by {h.by}
                {h.note && <div>{h.note}</div>}
              </li>
            ))}
          </ul>
        </aside>
      </div>

      <ConfirmActionModal
        show={showRetryDelivery}
        onClose={() => setShowRetryDelivery(false)}
        onConfirm={async () => {
          const updated = demoRetryDelivery(r.id, actorName);
          setRequest(updated);
          toastMessage(updated.status === "DELIVERED" ? "success" : "error", `Delivery retry: ${humanizeEnum(updated.delivery.status)}.`);
        }}
        title="Retry delivery"
        description={`Previous failure: ${r.delivery.attempts[r.delivery.attempts.length - 1]?.failureReason || "—"}`}
        confirmLabel="Retry delivery"
        testId="retry-delivery-modal"
      >
        <p className="crvs-form-hint">
          Channel: {humanizeEnum(r.delivery.method)} · Destination: {r.delivery.destinationMasked || "—"} · Attempts:{" "}
          {r.delivery.attempts.length}
        </p>
      </ConfirmActionModal>
    </div>
  );
}
