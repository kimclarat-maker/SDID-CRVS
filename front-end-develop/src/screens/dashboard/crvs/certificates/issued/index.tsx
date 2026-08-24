import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { saveAs } from "file-saver";
import Button from "@/components/button";
import Empty from "@/components/empty";
import StatusBadge from "../../components/StatusBadge";
import ConfirmActionModal from "@/components/crvs/modals/ConfirmActionModal";
import StructuredReasonModal from "@/components/crvs/modals/StructuredReasonModal";
import ChangeDeliveryMethodModal from "../components/modals/ChangeDeliveryMethodModal";
import ReplaceCertificateModal from "../components/modals/ReplaceCertificateModal";
import {
  demoChangeDeliveryMethod,
  demoGetCertificate,
  demoGetCertificateRequest,
  demoRecordCertificateDownload,
  demoReissueCertificate,
  demoReplaceCertificate,
  demoRetryDelivery,
  demoRevokeCertificate,
  demoVerifyCertificate,
  RevocationReason,
} from "@/demo/services/crvsCertificates";
import { getDemoData } from "@/demo/storage/demoStore";
import { generateCertificatePdfBlob } from "@/domain/crvs/certificateDocument";
import { DemoBirthCertificate, BirthCertificateRequest } from "@/domain/crvs/types";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { hasWorkspacePermission } from "@/utils/workspace";
import toastMessage from "@/utils/common/toastMessage";
import { formatDateTime, fullName, getActorReference, humanizeEnum } from "../utils";
import "../../shared.css";

const REVOCATION_REASONS: { value: RevocationReason; label: string }[] = [
  { value: "ISSUED_IN_ERROR", label: "Issued in error" },
  { value: "UNDERLYING_RECORD_INVALIDATED", label: "Underlying record invalidated" },
  { value: "SECURITY_COMPROMISE", label: "Security compromise" },
  { value: "REPLACED", label: "Replaced" },
  { value: "OTHER", label: "Other" },
];

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export default function IssuedCertificateDetails() {
  const { certificateId } = useParams<{ certificateId: string }>();
  const navigate = useNavigate();
  const actor = getActorReference();

  const [certificate, setCertificate] = useState<DemoBirthCertificate | undefined>();
  const [request, setRequest] = useState<BirthCertificateRequest | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [downloading, setDownloading] = useState(false);
  const [verifyResult, setVerifyResult] = useState<string | undefined>();

  const [showRetryDelivery, setShowRetryDelivery] = useState(false);
  const [showChangeDelivery, setShowChangeDelivery] = useState(false);
  const [showReplace, setShowReplace] = useState(false);
  const [showRevoke, setShowRevoke] = useState(false);
  const [showReissueConfirm, setShowReissueConfirm] = useState(false);

  const canDownload = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.CERTIFICATE_DOWNLOAD);
  const canDeliveryRetry = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.CERTIFICATE_DELIVERY_RETRY);
  const canRevoke = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.CERTIFICATE_REVOKE);
  const canReplace = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.CERTIFICATE_REPLACE);
  const canReissue = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.CERTIFICATE_REISSUE);
  const canViewAudit = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.CERTIFICATE_AUDIT_VIEW);

  const load = useCallback(async () => {
    if (!certificateId) return;
    setLoading(true);
    setError(undefined);
    try {
      const found = await demoGetCertificate(certificateId);
      if (!found) {
        setError("This certificate was not found.");
        return;
      }
      setCertificate(found);
      const req = await demoGetCertificateRequest(found.requestId);
      setRequest(req);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load this certificate.");
    } finally {
      setLoading(false);
    }
  }, [certificateId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="crvs-page">
        <Empty icon="hourglass_empty" title="Loading certificate…" isFullScreen />
      </div>
    );
  }
  if (error || !certificate) {
    return (
      <div className="crvs-page">
        <Empty
          icon="error"
          title="Couldn't open this certificate"
          description={error}
          isFullScreen
          button={<Button text="Back to issued certificates" appearance="ghost" onClick={() => navigate("/dashboard/crvs/certificates/issued")} />}
        />
      </div>
    );
  }

  const c = certificate;

  const handleDownload = async () => {
    if (c.status !== "ACTIVE") {
      toastMessage("error", `This certificate is ${humanizeEnum(c.status).toLowerCase()} and can no longer be downloaded.`);
      return;
    }
    setDownloading(true);
    try {
      const config = getDemoData().crvsCertificateConfig;
      const blob = await generateCertificatePdfBlob(c, config);
      saveAs(blob, c.document.fileName);
      const updated = demoRecordCertificateDownload(c.id, actor.name);
      setCertificate(updated);
      toastMessage("success", "Demo certificate downloaded.");
    } catch (err) {
      toastMessage("error", err);
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/certificates/birth/download/${c.download.accessToken}`;
    try {
      await navigator.clipboard.writeText(url);
      toastMessage("success", "Secure download link copied.");
    } catch {
      toastMessage("info", url);
    }
  };

  const handleVerify = () => {
    const result = demoVerifyCertificate({ certificateNumber: c.certificateNumber, verificationCode: c.verification.verificationCode });
    setVerifyResult(result.outcome);
    toastMessage(result.outcome === "VALID" ? "success" : "info", `Verification result: ${result.outcome}`);
  };

  return (
    <div className="crvs-page">
      <div className="crvs-section review-case-header">
        <div>
          <h1 className="crvs-page-title">{c.certificateNumber}</h1>
          <div className="review-case-meta">
            <StatusBadge kind="certificate" status={c.status} />
            <span>{fullName(c.subject.firstName, c.subject.middleName, c.subject.lastName)}</span>
            <span>{c.birthRecordNumber}</span>
          </div>
        </div>
      </div>

      <div className="crvs-banner crvs-banner-warning" style={{ marginBottom: 16 }}>
        DEMO — NOT A LEGALLY VALID CERTIFICATE. {c.signature.notice}.
      </div>

      <div className="review-layout">
        <div className="review-main">
          <section className="crvs-review-section">
            <h3 className="crvs-section-title">Certificate</h3>
            <dl className="review-readonly-fields">
              <Field label="Status" value={<StatusBadge kind="certificate" status={c.status} />} />
              <Field label="Issue date" value={formatDateTime(c.issuedAt)} />
              <Field label="Issuing authority" value={c.issuingAuthority} />
              <Field label="Sex" value={c.subject.sex} />
              <Field label="Date of birth" value={c.subject.dateOfBirth} />
              <Field label="Place of birth" value={c.subject.placeOfBirth} />
              <Field label="Mother" value={c.parentSummary.motherName} />
              {c.parentSummary.fatherName && <Field label="Father" value={c.parentSummary.fatherName} />}
              <Field label="Request reference" value={request?.applicationReference || "—"} />
              <Field label="Payment state" value={request ? humanizeEnum(request.payment.status) : "—"} />
              <Field label="Delivery state" value={request ? humanizeEnum(request.delivery.status) : "—"} />
              <Field label="Verification code" value={c.verification.verificationCode} />
              <Field label="Downloads" value={`${c.downloadCount}${c.lastDownloadedAt ? ` (last ${formatDateTime(c.lastDownloadedAt)})` : ""}`} />
              {verifyResult && <Field label="Last verification result" value={verifyResult} />}
            </dl>
            {c.revokedAt && (
              <div className="crvs-banner crvs-banner-danger" style={{ marginTop: 12 }}>
                Revoked {formatDateTime(c.revokedAt)} by {c.revokedBy?.name} — {c.revocationReason}
                {c.revocationNote ? `: ${c.revocationNote}` : ""}
              </div>
            )}
            {c.supersededByCertificateId && (
              <div className="crvs-banner crvs-banner-info" style={{ marginTop: 12 }}>
                Superseded by a replacement certificate.{" "}
                <Button text="View replacement" size="sm" appearance="ghost" onClick={() => navigate(`/dashboard/crvs/certificates/issued/${c.supersededByCertificateId}`)} testId="view-replacement" />
              </div>
            )}
            {c.previousCertificateId && (
              <div className="crvs-banner crvs-banner-info" style={{ marginTop: 12 }}>
                Replaces a previous certificate.{" "}
                <Button text="View previous" size="sm" appearance="ghost" onClick={() => navigate(`/dashboard/crvs/certificates/issued/${c.previousCertificateId}`)} testId="view-previous" />
              </div>
            )}
          </section>
        </div>

        <aside className="review-action-rail">
          <h3>Actions</h3>
          {canDownload && (
            <Button text="Download demo PDF" appearance="primary" block loading={downloading} onClick={handleDownload} testId="issued-download" disabled={c.status !== "ACTIVE"} />
          )}
          <Button text="Copy secure link" appearance="default" block onClick={handleCopyLink} testId="issued-copy-link" />
          <Button text="Verify" appearance="default" block onClick={handleVerify} testId="issued-verify" />
          {canDeliveryRetry && request?.status === "DELIVERY_FAILED" && (
            <Button text="Retry delivery" appearance="default" block onClick={() => setShowRetryDelivery(true)} testId="issued-retry-delivery" />
          )}
          {canDeliveryRetry && request && (
            <Button text="Change delivery method" appearance="default" block onClick={() => setShowChangeDelivery(true)} testId="issued-change-delivery" />
          )}
          {canReissue && c.status === "ACTIVE" && (
            <Button text="Reissue" appearance="default" block onClick={() => setShowReissueConfirm(true)} testId="issued-reissue" />
          )}
          {canReplace && c.status === "ACTIVE" && (
            <Button text="Replace" appearance="default" block onClick={() => setShowReplace(true)} testId="issued-replace" />
          )}
          {canRevoke && c.status === "ACTIVE" && (
            <Button text="Revoke" appearance="ghost" color="red" block onClick={() => setShowRevoke(true)} testId="issued-revoke" />
          )}
          {canViewAudit && (
            <Button text="View audit history" appearance="ghost" block onClick={() => navigate(`/dashboard/crvs/certificates/issued/${c.id}/audit`)} testId="issued-audit" />
          )}
        </aside>
      </div>

      <ConfirmActionModal
        show={showRetryDelivery}
        onClose={() => setShowRetryDelivery(false)}
        onConfirm={async () => {
          if (!request) return;
          const updated = demoRetryDelivery(request.id, actor.name);
          setRequest(updated);
          toastMessage(updated.status === "DELIVERED" ? "success" : "error", `Delivery retry: ${humanizeEnum(updated.delivery.status)}.`);
        }}
        title="Retry delivery"
        confirmLabel="Retry delivery"
        testId="issued-retry-delivery-modal"
      >
        <p className="crvs-form-hint">
          Channel: {request ? humanizeEnum(request.delivery.method) : "—"} · Attempts: {request?.delivery.attempts.length || 0}
        </p>
      </ConfirmActionModal>

      <ChangeDeliveryMethodModal
        show={showChangeDelivery}
        onClose={() => setShowChangeDelivery(false)}
        currentMethod={request?.delivery.method || "SECURE_DOWNLOAD"}
        onSubmit={async (method) => {
          if (!request) return;
          const updated = demoChangeDeliveryMethod(request.id, method, actor.name);
          setRequest(updated);
          toastMessage("success", "Delivery method updated. Requester must re-verify.");
        }}
      />

      <ReplaceCertificateModal
        show={showReplace}
        onClose={() => setShowReplace(false)}
        certificateNumber={c.certificateNumber}
        onSubmit={async (input) => {
          const newRequest = demoReplaceCertificate(c.id, input, actor);
          toastMessage("success", `Replacement request ${newRequest.applicationReference} created.`);
          navigate(newRequest.certificateId ? `/dashboard/crvs/certificates/issued/${newRequest.certificateId}` : `/dashboard/crvs/certificates/requests/${newRequest.id}`);
        }}
      />

      <ConfirmActionModal
        show={showReissueConfirm}
        onClose={() => setShowReissueConfirm(false)}
        onConfirm={async () => {
          const updated = demoReissueCertificate(c.id, actor);
          setCertificate(updated);
          toastMessage("success", "Certificate document reissued from the unchanged record.");
        }}
        title="Reissue certificate document"
        description={c.certificateNumber}
        confirmLabel="Reissue"
        testId="issued-reissue-modal"
      >
        <p>Regenerates the demo document, QR code, and signature metadata from the unchanged birth record. The certificate number does not change.</p>
      </ConfirmActionModal>

      <StructuredReasonModal
        show={showRevoke}
        onClose={() => setShowRevoke(false)}
        onSubmit={async (value) => {
          const updated = demoRevokeCertificate(c.id, { reason: value.reason as RevocationReason, note: value.note }, actor);
          setCertificate(updated);
          toastMessage("success", "Certificate revoked.");
        }}
        title="Revoke certificate"
        description={c.certificateNumber}
        reasonOptions={REVOCATION_REASONS}
        noteLabel="Supporting note"
        requireConfirmation
        confirmationLabel="I confirm this revocation. Downloads will be blocked and public verification will show revoked."
        submitLabel="Revoke certificate"
        destructive
        testId="revoke-certificate-modal"
      />
    </div>
  );
}
