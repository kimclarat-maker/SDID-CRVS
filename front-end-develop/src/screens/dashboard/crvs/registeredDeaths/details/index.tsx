import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import Button from "@/components/button";
import Empty from "@/components/empty";
import RequirePermission from "@/navigation/guards/RequirePermission";
import { DescriptionList, DescriptionItem } from "@/components/descriptionList";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { hasWorkspacePermission, getCurrentActorName } from "@/utils/workspace";
import { DeathRegistrationCase } from "@/domain/crvs/types";
import { demoGetDeathRegistration } from "@/demo/services/crvsDeathRegistrations";
import { demoProcessDeathSdidSync } from "@/demo/services/crvsDeathSdidSync";
import { demoListCrvsAuditEvents } from "@/demo/services/crvsAudit";
import { DemoAuditEvent } from "@/demo/types";
import StatusBadge from "../../components/StatusBadge";
import RestrictedCauseOfDeathNotice from "../../components/RestrictedCauseOfDeathNotice";
import DeathCertificateEligibilityModal from "../components/modals/DeathCertificateEligibilityModal";
import { deceasedDisplayName, maskDocumentNumber, formatDate, formatDateTime } from "../../deathShared";
import toastMessage from "@/utils/common/toastMessage";
import "../../shared.css";

function RegisteredDeathDetailsInner() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const actorName = getCurrentActorName();

  const [deathCase, setDeathCase] = useState<DeathRegistrationCase | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [auditEvents, setAuditEvents] = useState<DemoAuditEvent[]>([]);
  const [showEligibility, setShowEligibility] = useState(false);
  const syncKicked = useRef(false);

  const canViewAudit = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DEATH_AUDIT_VIEW);
  const canRequestCertificate = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DEATH_CERTIFICATE_REQUEST);

  const load = () => {
    if (!caseId) return;
    setLoading(true);
    setError(undefined);
    demoGetDeathRegistration(caseId)
      .then((c) => {
        setDeathCase(c);
        if (c && canViewAudit) demoListCrvsAuditEvents({ targetRef: c.reference }).then((res) => setAuditEvents(res.data));
      })
      .catch((e) => setError(e?.message || "Something went wrong loading this case."))
      .finally(() => setLoading(false));
  };

  useEffect(load, [caseId]);

  // Visibly progress the demo sync simulation exactly once per mount when a
  // just-registered case is still PENDING (mirrors registeredBirths' own
  // auto-kickoff-on-mount behavior).
  useEffect(() => {
    if (!deathCase || syncKicked.current) return;
    if (deathCase.sdid.status !== "PENDING") return;
    syncKicked.current = true;
    demoProcessDeathSdidSync(deathCase.id, actorName).catch(() => undefined).finally(load);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deathCase]);

  if (loading) {
    return (
      <div className="crvs-page">
        <div className="crvs-section" aria-busy="true">
          Loading registered death…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="crvs-page">
        <Empty icon="error" title="Couldn't load this case" description={error} button={<Button text="Try again" appearance="ghost" onClick={load} testId="registered-death-retry" />} />
      </div>
    );
  }

  if (!deathCase) {
    return (
      <div className="crvs-page">
        <Empty icon="search_off" title="Case not found" description="This case does not exist or is no longer accessible." />
      </div>
    );
  }

  if (deathCase.status !== "REGISTERED") {
    return (
      <div className="crvs-page">
        <Empty icon="hourglass_empty" title="This case has not been registered yet" description={`Current status: ${deathCase.status.replace(/_/g, " ")}.`} />
      </div>
    );
  }

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">Death registration successful</h1>
        <p className="crvs-page-subtitle">{deceasedDisplayName(deathCase.deceased)} has been officially registered. This record is read-only.</p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <div className="crvs-banner crvs-banner-info">
        The registered record is read-only. Any legal changes must go through the corrections/amendments workflow.
      </div>

      <div className="crvs-section">
        <DescriptionList columns={3}>
          <DescriptionItem label="Official death record number" value={deathCase.officialDeathRecordNumber} />
          <DescriptionItem label="Registration date" value={formatDateTime(deathCase.registeredAt)} />
          <DescriptionItem label="Civil Registrar" value={deathCase.approvedByName} />
          <DescriptionItem label="Processing jurisdiction" value={deathCase.jurisdiction} />
          <DescriptionItem label="Processing office" value={deathCase.processingOfficeName} />
          <DescriptionItem label="Case reference" value={deathCase.reference} />
          <DescriptionItem label="Source notification" value={deathCase.notificationReference} />
        </DescriptionList>

        <div className="crvs-review-section" style={{ marginTop: 16 }}>
          <div className="crvs-review-section-header">
            <strong>SDID synchronization status</strong>
            <StatusBadge kind="deathSync" status={deathCase.sdid.status} />
          </div>
          {deathCase.sdid.status === "IDENTITY_MARKED_DECEASED" ? (
            <p className="crvs-form-hint">Linked NIN: {deathCase.sdid.linkedNin}</p>
          ) : (
            <p className="crvs-form-hint">
              The linked SDID identity is only shown as deceased once synchronization completes successfully.
            </p>
          )}
        </div>

        <div className="crvs-wizard-actions" style={{ marginTop: 20 }}>
          <Button text="View SDID synchronization" appearance="primary" onClick={() => navigate(`/dashboard/crvs/registered-deaths/${deathCase.id}/sdid-status`)} testId="view-death-sdid-status" />
          {canRequestCertificate && <Button text="Death certificate eligibility" appearance="ghost" onClick={() => setShowEligibility(true)} testId="open-death-certificate-eligibility" />}
        </div>
      </div>

      <div className="crvs-section">
        <h2 className="crvs-section-title">Deceased summary</h2>
        {deathCase.deceased.identityStatus === "IDENTITY_UNKNOWN" ? (
          <p className="crvs-form-hint">{deathCase.deceased.descriptivePhysicalSummary}</p>
        ) : (
          <DescriptionList columns={3}>
            <DescriptionItem label="Name" value={deceasedDisplayName(deathCase.deceased)} />
            <DescriptionItem label="Sex" value={deathCase.deceased.sex} />
            <DescriptionItem label="Date of death" value={formatDate(deathCase.dateOfDeath)} />
            <DescriptionItem label="Place of death" value={deathCase.occurrence.location} />
            <DescriptionItem label="Declarant" value={`${deathCase.declarant.firstName} ${deathCase.declarant.lastName} (${deathCase.declarant.relationship})`} />
            <DescriptionItem label="Deceased document" value={maskDocumentNumber(deathCase.deceased.documentNumber)} />
          </DescriptionList>
        )}
        <div style={{ marginTop: 12 }}>
          <RestrictedCauseOfDeathNotice cause={deathCase.medicalCertification?.cause}>
            {deathCase.medicalCertification?.isCertified && (
              <p className="crvs-form-hint">Certified by {deathCase.medicalCertification.certifierName} — {deathCase.medicalCertification.cause.immediateCause}</p>
            )}
          </RestrictedCauseOfDeathNotice>
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
        <Link to="/dashboard/crvs" className="crvs-tab">
          Back to CRVS home
        </Link>
      </div>

      <DeathCertificateEligibilityModal
        show={showEligibility}
        onClose={() => setShowEligibility(false)}
        deathCase={deathCase}
        onRequestCertificate={() => {
          setShowEligibility(false);
          toastMessage("success", `Certificate request logged for ${deathCase.reference}. A CRVS Registration Officer will process it.`);
        }}
      />
    </div>
  );
}

export default function RegisteredDeathDetails() {
  return (
    <RequirePermission
      workspace="CRVS"
      permission={CRVS_PERMISSIONS.DEATH_REGISTRATION_VIEW}
      fallback={
        <div className="crvs-page">
          <Empty icon="lock" title="You don't have access to registered deaths" />
        </div>
      }
    >
      <RegisteredDeathDetailsInner />
    </RequirePermission>
  );
}
