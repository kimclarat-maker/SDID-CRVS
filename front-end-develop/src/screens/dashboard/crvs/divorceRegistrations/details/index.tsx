import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Empty from "@/components/empty";
import Button from "@/components/button";
import Icon from "@/components/icon";
import { DescriptionList, DescriptionItem } from "@/components/descriptionList";
import DocumentPreviewModal from "@/components/crvs/modals/DocumentPreviewModal";
import StatusBadge from "../../components/StatusBadge";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { getCurrentAccountId, hasWorkspacePermission } from "@/utils/workspace";
import { demoGetDivorceRegistration, isDivorceLateRegistration } from "@/demo/services/crvsDivorceRegistrations";
import { DIVORCE_REGISTRATION_STATUS_LABELS } from "@/domain/crvs/statusMachines";
import { DIVORCE_EXCEPTION_TRIGGER_LABELS } from "@/domain/crvs/divorcePolicyConfig";
import { DivorceEvidence, DivorceRegistration } from "@/domain/crvs/types";
import {
  activeEvidence,
  applicantDisplayName,
  DIVORCE_APPLICANT_RELATIONSHIP_LABELS,
  DIVORCE_DECISION_TYPE_LABELS,
  DIVORCE_SOURCE_LABELS,
  EXISTING_MARRIAGE_MATCH_LABELS,
  divorceSlaState,
  formatDate,
  formatDateTime,
  formerSpouseDisplayName,
  formerSpousesLabel,
  marriageReferenceLabel,
  maskDocumentNumber,
} from "../../divorceShared";
import "../../shared.css";
import "../../review/review.css";

/** Read view of one divorce registration (spec §3). Deliberately has no edit
 * controls of its own — editing goes through the wizard's edit route, and
 * every decision goes through the review workspace. */
export default function DivorceRegistrationDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentAccountId = getCurrentAccountId();

  const canView = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_REGISTRATION_VIEW);
  const canEdit = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_REGISTRATION_EDIT);
  const canReview = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_REGISTRATION_REVIEW);

  const [registration, setRegistration] = useState<DivorceRegistration | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [previewTarget, setPreviewTarget] = useState<DivorceEvidence | undefined>();

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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load this divorce registration.");
    } finally {
      setLoading(false);
    }
  }, [id, canView]);

  useEffect(() => {
    load();
  }, [load]);

  if (!canView) {
    return (
      <div className="crvs-page">
        <Empty icon="lock" title="You don't have access to this divorce registration" description="Viewing a divorce registration requires divorce-registration-view access." isFullScreen />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="crvs-page">
        <Empty icon="hourglass_empty" title="Loading divorce registration…" isFullScreen />
      </div>
    );
  }

  if (error || !registration) {
    return (
      <div className="crvs-page">
        <Empty
          icon="error"
          title="Couldn't open this divorce registration"
          description={error || "This divorce registration was not found."}
          isFullScreen
          button={<Button text="Back to divorce registrations" appearance="ghost" type="button" onClick={() => navigate("/dashboard/crvs/divorce-registrations")} testId="dr-details-back" />}
        />
      </div>
    );
  }

  const r = registration;
  const sla = divorceSlaState(r);
  const evidence = activeEvidence(r.evidence);
  const isLate = isDivorceLateRegistration(r);
  const editableStatus = r.status === "DRAFT" || r.status === "CORRECTION_REQUIRED";
  const openCorrection = r.correctionRequests.find((c) => !c.resolvedAt);

  return (
    <div className="crvs-page">
      <div className="crvs-section review-case-header">
        <div>
          <h1 className="crvs-page-title">{r.reference}</h1>
          <div className="review-case-meta">
            <StatusBadge kind="divorceRegistration" status={r.status} />
            <span>{formerSpousesLabel(r)}</span>
            <span>Marriage {marriageReferenceLabel(r)}</span>
            <span>{r.processingOffice.selectedProcessingOfficeName}</span>
            {r.status !== "REGISTERED" && r.status !== "REJECTED" && r.status !== "CANCELLED" && r.status !== "DRAFT" && (
              <span className={`crvs-status-pill crvs-status-${sla.tone}`}>{sla.label}</span>
            )}
            {r.judgment.isForeign && <span className="crvs-status-pill crvs-status-warning">Foreign decision</span>}
            {isLate && <span className="crvs-status-pill crvs-status-warning">Late registration</span>}
            {r.exception?.status === "OPEN" && <span className="crvs-status-pill crvs-status-danger">Exception open</span>}
          </div>
          <span className="crvs-demo-note">Demo data — fictional</span>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {editableStatus && <Button text="Edit" appearance="ghost" type="button" disabled={!canEdit} onClick={() => navigate(`/dashboard/crvs/divorce-registrations/${r.id}/edit`)} testId="dr-details-edit" />}
          {canReview && <Button text="Open in review workspace" appearance="primary" type="button" onClick={() => navigate(`/dashboard/crvs/divorce-review/${r.id}`)} testId="dr-details-open-review" />}
          {r.status === "REGISTERED" && <Button text="Open registered record" appearance="primary" type="button" onClick={() => navigate(`/dashboard/crvs/registered-divorces/${r.id}`)} testId="dr-details-open-registered" />}
        </div>
      </div>

      {openCorrection && (
        <div className="crvs-banner crvs-banner-warning">
          <Icon name="edit" />
          <span>
            A correction was requested by {openCorrection.requestedBy} on {formatDateTime(openCorrection.requestedAt)}
            {openCorrection.responseDeadline ? `, due ${formatDate(openCorrection.responseDeadline)}` : ""}: {openCorrection.items.map((i) => i.reason).join("; ")}
          </span>
        </div>
      )}

      <div className="crvs-section">
        <h2 className="crvs-section-title">Case</h2>
        <DescriptionList columns={3}>
          <DescriptionItem label="Status" value={DIVORCE_REGISTRATION_STATUS_LABELS[r.status]} />
          <DescriptionItem label="Source" value={DIVORCE_SOURCE_LABELS[r.source]} />
          <DescriptionItem label="Source notification" value={r.sourceNotificationReference} />
          <DescriptionItem label="Prepared by" value={r.officerName} />
          <DescriptionItem label="Reviewer" value={r.reviewerName || "Unassigned"} />
          <DescriptionItem label="Jurisdiction" value={r.jurisdiction} />
          <DescriptionItem label="Created" value={formatDateTime(r.createdAt)} />
          <DescriptionItem label="Submitted" value={r.submittedAt ? formatDateTime(r.submittedAt) : "Not submitted"} />
          <DescriptionItem label="Last updated" value={formatDateTime(r.updatedAt)} />
        </DescriptionList>
      </div>

      <div className="crvs-section">
        <h2 className="crvs-section-title">Applicant</h2>
        <DescriptionList columns={3}>
          <DescriptionItem label="Name" value={applicantDisplayName(r.applicant)} />
          <DescriptionItem label="Relationship to case" value={DIVORCE_APPLICANT_RELATIONSHIP_LABELS[r.applicant.relationshipToCase]} />
          <DescriptionItem label="Document" value={`${r.applicant.documentType.replace(/_/g, " ")} · ${maskDocumentNumber(r.applicant.documentNumber)}`} />
          <DescriptionItem label="Date of birth" value={formatDate(r.applicant.dateOfBirth)} />
          <DescriptionItem label="Nationality" value={r.applicant.nationality} />
          <DescriptionItem label="Identity verification" value={r.applicant.identityVerification.replace(/_/g, " ").toLowerCase()} />
          <DescriptionItem label="Authorization basis" value={r.applicant.authorizationBasis} />
        </DescriptionList>
      </div>

      <div className="crvs-section">
        <h2 className="crvs-section-title">Existing marriage</h2>
        <DescriptionList columns={3}>
          <DescriptionItem label="Match status" value={EXISTING_MARRIAGE_MATCH_LABELS[r.existingMarriage.status]} />
          <DescriptionItem label="Marriage number" value={marriageReferenceLabel(r)} />
          <DescriptionItem label="Marriage date" value={formatDate(r.existingMarriage.selected?.marriageDate)} />
          <DescriptionItem label="Searched" value={r.existingMarriage.searchedAt ? `${formatDateTime(r.existingMarriage.searchedAt)} by ${r.existingMarriage.searchedBy || "—"}` : "Not searched"} />
        </DescriptionList>
      </div>

      <div className="crvs-section">
        <h2 className="crvs-section-title">Former spouses</h2>
        <DescriptionList columns={2}>
          <DescriptionItem label="Former spouse 1" value={formerSpouseDisplayName(r.formerSpouse1)} />
          <DescriptionItem label="Former spouse 2" value={formerSpouseDisplayName(r.formerSpouse2)} />
          <DescriptionItem label="Former spouse 1 document" value={maskDocumentNumber(r.formerSpouse1.documentNumber)} />
          <DescriptionItem label="Former spouse 2 document" value={maskDocumentNumber(r.formerSpouse2.documentNumber)} />
          <DescriptionItem label="Former spouse 1 identity" value={r.formerSpouse1.identityMatchConfidence.replace(/_/g, " ").toLowerCase()} />
          <DescriptionItem label="Former spouse 2 identity" value={r.formerSpouse2.identityMatchConfidence.replace(/_/g, " ").toLowerCase()} />
        </DescriptionList>
      </div>

      <div className="crvs-section">
        <h2 className="crvs-section-title">Court decision</h2>
        <DescriptionList columns={3}>
          <DescriptionItem label="Country" value={r.judgment.country} />
          <DescriptionItem label="Court or authority" value={r.judgment.courtOrAuthorityName} />
          <DescriptionItem label="Court case number" value={r.judgment.courtCaseNumber} />
          <DescriptionItem label="Judgment number" value={r.judgment.judgmentNumber} />
          <DescriptionItem label="Judgment date" value={formatDate(r.judgment.judgmentDate)} />
          <DescriptionItem label="Final on" value={r.judgment.finalityDate ? formatDate(r.judgment.finalityDate) : "Not reported"} />
          <DescriptionItem label="Decision type" value={DIVORCE_DECISION_TYPE_LABELS[r.judgment.decisionType]} />
          <DescriptionItem label="Effective date" value={formatDate(r.judgment.registrationEffectiveDate)} />
          <DescriptionItem label="Foreign decision" value={r.judgment.isForeign ? "Yes" : "No"} />
        </DescriptionList>
      </div>

      <div className="crvs-section">
        <h2 className="crvs-section-title">Evidence</h2>
        {evidence.length === 0 ? (
          <p className="crvs-form-hint">No evidence documents attached.</p>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            {evidence.map((ev) => (
              <li key={ev.id} className="crvs-banner crvs-banner-info" style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                <span>
                  <strong>{ev.documentType.replace(/_/g, " ")}</strong> — {ev.fileName}
                  <div className="crvs-form-hint">
                    Uploaded {formatDateTime(ev.uploadedAt)} by {ev.uploadedBy} · {ev.verification.replace(/_/g, " ").toLowerCase()}
                  </div>
                </span>
                <Button text="Preview" size="sm" appearance="ghost" type="button" onClick={() => setPreviewTarget(ev)} testId={`dr-details-preview-${ev.id}`} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {r.exception && (
        <div className="crvs-section">
          <h2 className="crvs-section-title">Exception</h2>
          <div className={`crvs-banner ${r.exception.status === "OPEN" ? "crvs-banner-warning" : "crvs-banner-info"}`}>
            <strong>{DIVORCE_EXCEPTION_TRIGGER_LABELS[r.exception.type]}</strong> — {r.exception.reason}
            {r.exception.resolution && (
              <div className="crvs-form-hint">
                Resolved as {r.exception.resolution.type} by {r.exception.resolution.resolvedBy} on {formatDateTime(r.exception.resolution.resolvedAt)}.
              </div>
            )}
          </div>
        </div>
      )}

      <div className="crvs-section">
        <h2 className="crvs-section-title">Timeline</h2>
        <div className="crvs-timeline">
          {r.statusHistory.map((entry, i) => (
            <span key={`${entry.status}-${i}`} className="crvs-timeline-item is-reached">
              <span className="crvs-timeline-dot" />
              {DIVORCE_REGISTRATION_STATUS_LABELS[entry.status]} · {formatDateTime(entry.at)} · {entry.by}
              {entry.note ? ` — ${entry.note}` : ""}
            </span>
          ))}
        </div>
      </div>

      <div className="crvs-wizard-actions">
        <Button text="Back to divorce registrations" appearance="ghost" type="button" onClick={() => navigate("/dashboard/crvs/divorce-registrations")} testId="dr-details-back-bottom" />
        {editableStatus && r.officerId === currentAccountId && canEdit && (
          <Button text="Continue editing" appearance="primary" type="button" onClick={() => navigate(`/dashboard/crvs/divorce-registrations/${r.id}/edit`)} testId="dr-details-continue-edit" />
        )}
      </div>

      <DocumentPreviewModal show={!!previewTarget} onClose={() => setPreviewTarget(undefined)} evidence={previewTarget} />
    </div>
  );
}
