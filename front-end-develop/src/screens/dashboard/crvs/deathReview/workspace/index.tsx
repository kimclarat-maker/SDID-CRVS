import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import "../../shared.css";
import SectionReviewCard from "../../components/SectionReviewCard";
import StatusBadge from "../../components/StatusBadge";
import RestrictedCauseOfDeathNotice from "../../components/RestrictedCauseOfDeathNotice";
import Button from "@/components/button";
import Empty from "@/components/empty";
import { DeathRegistrationCase, DeathReviewSectionKey, ReviewSectionStatus } from "@/domain/crvs/types";
import { demoGetDeathRegistration, demoSetDeathReviewSectionStatus, demoStartDeathReview } from "@/demo/services/crvsDeathRegistrations";
import { demoListCrvsAuditEvents } from "@/demo/services/crvsAudit";
import { DemoAuditEvent } from "@/demo/types";
import { canTransitionDeathRegistration } from "@/domain/crvs/statusMachines";
import { canAccessDeathCaseJurisdiction, deathConflictOfInterestReasons } from "@/utils/workspace/crvsRules";
import { getCurrentAccountId, getCurrentActorName, hasWorkspacePermission } from "@/utils/workspace";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import toastMessage from "@/utils/common/toastMessage";
import StartDeathReviewModal from "../components/modals/StartDeathReviewModal";
import ActiveDeathReviewConflictModal from "../components/modals/ActiveDeathReviewConflictModal";
import DeathConflictOfInterestModal from "../components/modals/DeathConflictOfInterestModal";
import RequestDeathCorrectionModal from "../components/modals/RequestDeathCorrectionModal";
import RouteToExceptionModal from "../components/modals/RouteToExceptionModal";
import { DeathExceptionRouteTarget } from "@/demo/services/crvsDeathRegistrations";
import DeathApprovalChecklistModal from "../components/modals/DeathApprovalChecklistModal";
import ApproveDeathRegistrationModal from "../components/modals/ApproveDeathRegistrationModal";
import RejectDeathRegistrationModal from "../components/modals/RejectDeathRegistrationModal";
import { deceasedDisplayName, formatDateTime, maskDocumentNumber } from "../../deathShared";

const SECTION_LABELS: Record<DeathReviewSectionKey, string> = {
  DECEASED: "Deceased",
  OCCURRENCE: "Occurrence",
  MEDICAL_CERTIFICATION: "Medical certification",
  DECLARANT: "Declarant",
  NEXT_OF_KIN: "Next of kin",
  WITNESSES: "Witnesses",
  EVIDENCE: "Evidence",
  IDENTITY_CHECK: "Identity check",
  DUPLICATE_CHECK: "Duplicate check",
  OFFICER_DECLARATION: "Officer declaration",
};

const SECTION_ORDER = Object.keys(SECTION_LABELS) as DeathReviewSectionKey[];

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export default function DeathReviewWorkspace() {
  const { caseId } = useParams<{ caseId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const isDecisionRoute = location.pathname.endsWith("/decision");

  const currentAccountId = getCurrentAccountId();
  const actorName = getCurrentActorName();

  const canView = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DEATH_REGISTRATION_VIEW);
  const canReview = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DEATH_REGISTRATION_REVIEW);
  const canRequestCorrection = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DEATH_CORRECTION_REQUEST);
  const canApprovePermission = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DEATH_REGISTRATION_APPROVE);
  const canRejectPermission = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DEATH_REGISTRATION_REJECT);
  const canRouteLate = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DEATH_LATE_REVIEW);
  const canRouteMedicoLegal = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DEATH_MEDICO_LEGAL_REVIEW);
  const canRouteUnidentified = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DEATH_UNIDENTIFIED_REVIEW);
  const canViewAudit = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DEATH_AUDIT_VIEW);

  const [deathCase, setDeathCase] = useState<DeathRegistrationCase | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [auditEvents, setAuditEvents] = useState<DemoAuditEvent[]>([]);

  const [showStart, setShowStart] = useState(false);
  const [showConflictLock, setShowConflictLock] = useState(false);
  const [showRequestCorrection, setShowRequestCorrection] = useState(false);
  const [routeTarget, setRouteTarget] = useState<DeathExceptionRouteTarget | undefined>();
  const [showChecklist, setShowChecklist] = useState(false);
  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [showConflictOfInterest, setShowConflictOfInterest] = useState(false);
  const coiShownRef = useRef(false);
  const actionRailRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (!caseId) {
      setLoading(false);
      setError("No case reference was provided.");
      return;
    }
    setLoading(true);
    setError(undefined);
    coiShownRef.current = false;
    try {
      const found = await demoGetDeathRegistration(caseId);
      if (!found) {
        setError("This death registration case was not found.");
        setDeathCase(undefined);
        return;
      }
      setDeathCase(found);
      if (canViewAudit) {
        const auditRes = await demoListCrvsAuditEvents({ targetRef: found.reference });
        setAuditEvents(auditRes.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load this case.");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (isDecisionRoute && deathCase) {
      actionRailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDecisionRoute, !!deathCase]);

  const coiReasons = useMemo(() => {
    if (!deathCase) return [] as string[];
    const reasons = deathConflictOfInterestReasons(currentAccountId, deathCase);
    if (!canAccessDeathCaseJurisdiction(deathCase.jurisdiction)) reasons.push("This case is outside your assigned jurisdiction.");
    return reasons;
  }, [deathCase, currentAccountId]);

  useEffect(() => {
    if (deathCase && coiReasons.length > 0 && !coiShownRef.current) {
      coiShownRef.current = true;
      setShowConflictOfInterest(true);
    }
  }, [deathCase, coiReasons]);

  const isLockedByOther = !!deathCase?.reviewerId && deathCase.reviewerId !== currentAccountId;
  const isMine = !!deathCase && deathCase.reviewerId === currentAccountId;
  const canStartHere = deathCase ? canTransitionDeathRegistration(deathCase.status, "UNDER_REVIEW") : false;
  const canEdit = isMine;

  const handleSectionStatusChange = async (section: DeathReviewSectionKey, status: ReviewSectionStatus) => {
    if (!deathCase) return;
    try {
      const updated = demoSetDeathReviewSectionStatus(deathCase.id, section, status, actorName);
      setDeathCase(updated);
    } catch (err) {
      toastMessage("error", err);
    }
  };

  const handleStartClick = () => {
    if (!deathCase) return;
    if (isLockedByOther) {
      setShowConflictLock(true);
      return;
    }
    setShowStart(true);
  };

  const handleConfirmStart = async () => {
    if (!deathCase || !currentAccountId) return;
    try {
      const updated = demoStartDeathReview(deathCase.id, currentAccountId, actorName);
      setDeathCase(updated);
      toastMessage("success", "You're now reviewing this case.");
    } catch (err) {
      if (err instanceof Error && err.message.toLowerCase().includes("already being reviewed")) {
        setShowStart(false);
        setShowConflictLock(true);
        return;
      }
      toastMessage("error", err);
    }
  };

  if (!canView) {
    return (
      <div className="crvs-page">
        <Empty icon="lock" title="You don't have access to this case" isFullScreen />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="crvs-page">
        <Empty icon="hourglass_empty" title="Loading case…" isFullScreen />
      </div>
    );
  }

  if (error || !deathCase) {
    return (
      <div className="crvs-page">
        <Empty
          icon="error"
          title="Couldn't open this case"
          description={error || "This death registration case was not found."}
          isFullScreen
          button={<Button text="Back to death review queue" appearance="ghost" onClick={() => navigate("/dashboard/crvs/death-review")} />}
        />
      </div>
    );
  }

  const c = deathCase;
  const canRouteAny = canRouteLate || canRouteMedicoLegal || canRouteUnidentified;

  return (
    <div className="crvs-page">
      <div className="crvs-section review-case-header">
        <div>
          <h1 className="crvs-page-title">{c.reference}</h1>
          <div className="review-case-meta">
            <StatusBadge kind="deathRegistration" status={c.status} />
            <span>{deceasedDisplayName(c.deceased)}</span>
            <span>Died {c.dateOfDeath?.slice(0, 10)}</span>
            <span>{c.jurisdiction}</span>
            {c.isLate && <span className="crvs-status-pill crvs-status-warning">Late registration</span>}
            {c.pathway === "MEDICO_LEGAL" && <span className="crvs-status-pill crvs-status-warning">Medico-legal</span>}
            {c.pathway === "UNIDENTIFIED" && <span className="crvs-status-pill crvs-status-warning">Unidentified</span>}
          </div>
        </div>
        {isLockedByOther ? (
          <div className="crvs-banner crvs-banner-warning">Locked by {c.reviewerName || "another registrar"} — read only.</div>
        ) : !isMine && canStartHere && canReview ? (
          <Button text="Start review" appearance="primary" onClick={handleStartClick} testId="death-workspace-start-review" />
        ) : null}
      </div>

      <nav className="review-section-nav">
        {SECTION_ORDER.map((key) => (
          <a
            key={key}
            href={`#section-${key}`}
            className="crvs-tab"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById(`section-${key}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          >
            {SECTION_LABELS[key]}
          </a>
        ))}
      </nav>

      <div className="review-layout">
        <div className="review-main">
          <div id="section-DECEASED">
            <SectionReviewCard title="Deceased" status={c.reviewSections.DECEASED} disabled={!canEdit} onStatusChange={canReview ? (s) => handleSectionStatusChange("DECEASED", s) : undefined}>
              {c.deceased.identityStatus === "IDENTITY_UNKNOWN" ? (
                <p className="crvs-form-hint">{c.deceased.descriptivePhysicalSummary || "No description recorded."}</p>
              ) : (
                <dl className="review-readonly-fields">
                  <Field label="Name" value={deceasedDisplayName(c.deceased)} />
                  <Field label="Sex" value={c.deceased.sex} />
                  <Field label="Date of birth" value={c.deceased.dateOfBirth || "—"} />
                  <Field label="Document" value={`${c.deceased.documentType || "—"} · ${maskDocumentNumber(c.deceased.documentNumber)}`} />
                  <Field label="NIN" value={maskDocumentNumber(c.deceased.nin)} />
                </dl>
              )}
            </SectionReviewCard>
          </div>

          <div id="section-OCCURRENCE">
            <SectionReviewCard title="Occurrence" status={c.reviewSections.OCCURRENCE} disabled={!canEdit} onStatusChange={canReview ? (s) => handleSectionStatusChange("OCCURRENCE", s) : undefined}>
              <dl className="review-readonly-fields">
                <Field label="Date of death" value={c.occurrence.dateOfDeath} />
                <Field label="Place category" value={c.occurrence.placeCategory} />
                <Field label="Location" value={c.occurrence.location} />
                <Field label="Jurisdiction" value={c.occurrence.jurisdiction} />
                <Field label="Circumstances" value={c.occurrence.circumstanceCategory} />
              </dl>
            </SectionReviewCard>
          </div>

          <div id="section-MEDICAL_CERTIFICATION">
            <SectionReviewCard title="Medical certification" status={c.reviewSections.MEDICAL_CERTIFICATION} disabled={!canEdit} onStatusChange={canReview ? (s) => handleSectionStatusChange("MEDICAL_CERTIFICATION", s) : undefined}>
              <RestrictedCauseOfDeathNotice cause={c.medicalCertification?.cause}>
                {c.medicalCertification?.isCertified ? (
                  <dl className="review-readonly-fields">
                    <Field label="Certifier" value={c.medicalCertification.certifierName || "—"} />
                    <Field label="Reference" value={c.medicalCertification.certificateReferenceNumber || "—"} />
                    <Field label="Manner of death" value={c.medicalCertification.cause.mannerOfDeath || "—"} />
                    <Field label="Immediate cause" value={c.medicalCertification.cause.immediateCause || "—"} />
                  </dl>
                ) : (
                  <p className="crvs-form-hint">Not medically certified.</p>
                )}
              </RestrictedCauseOfDeathNotice>
            </SectionReviewCard>
          </div>

          <div id="section-DECLARANT">
            <SectionReviewCard title="Declarant" status={c.reviewSections.DECLARANT} disabled={!canEdit} onStatusChange={canReview ? (s) => handleSectionStatusChange("DECLARANT", s) : undefined}>
              <dl className="review-readonly-fields">
                <Field label="Name" value={`${c.declarant.firstName} ${c.declarant.lastName}`} />
                <Field label="Relationship" value={c.declarant.relationship} />
                <Field label="Document" value={`${c.declarant.documentType} · ${maskDocumentNumber(c.declarant.documentNumber)}`} />
                <Field label="Verification" value={c.declarant.verification} />
              </dl>
            </SectionReviewCard>
          </div>

          <div id="section-NEXT_OF_KIN">
            <SectionReviewCard title="Next of kin" status={c.reviewSections.NEXT_OF_KIN} disabled={!canEdit} onStatusChange={canReview ? (s) => handleSectionStatusChange("NEXT_OF_KIN", s) : undefined}>
              {c.nextOfKin.length === 0 ? (
                <p className="crvs-form-hint">No next of kin recorded.</p>
              ) : (
                c.nextOfKin.map((k, i) => (
                  <dl className="review-readonly-fields" key={i} style={{ marginBottom: 8 }}>
                    <Field label="Name" value={`${k.firstName} ${k.lastName}`} />
                    <Field label="Relationship" value={k.relationship} />
                  </dl>
                ))
              )}
            </SectionReviewCard>
          </div>

          <div id="section-WITNESSES">
            <SectionReviewCard title="Witnesses" status={c.reviewSections.WITNESSES} disabled={!canEdit} onStatusChange={canReview ? (s) => handleSectionStatusChange("WITNESSES", s) : undefined}>
              {c.witnesses.length === 0 ? (
                <p className="crvs-form-hint">No witnesses recorded on this case.</p>
              ) : (
                c.witnesses.map((w) => (
                  <dl className="review-readonly-fields" key={w.id} style={{ marginBottom: 8 }}>
                    <Field label="Name" value={`${w.firstName} ${w.lastName}`} />
                    <Field label="Relationship" value={w.relationship} />
                    <Field label="Verification" value={w.verification} />
                  </dl>
                ))
              )}
            </SectionReviewCard>
          </div>

          <div id="section-EVIDENCE">
            <SectionReviewCard title="Evidence" status={c.reviewSections.EVIDENCE} disabled={!canEdit} onStatusChange={canReview ? (s) => handleSectionStatusChange("EVIDENCE", s) : undefined}>
              {c.evidence.filter((e) => !e.removed).length === 0 ? (
                <p className="crvs-form-hint">No evidence documents attached.</p>
              ) : (
                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                  {c.evidence
                    .filter((e) => !e.removed)
                    .map((ev) => (
                      <li key={ev.id} className="crvs-banner crvs-banner-info">
                        <strong>{ev.documentType}</strong> — {ev.fileName}
                        <div className="crvs-form-hint">
                          Uploaded {formatDateTime(ev.uploadedAt)} by {ev.uploadedBy} · {ev.verification}
                        </div>
                      </li>
                    ))}
                </ul>
              )}
            </SectionReviewCard>
          </div>

          <div id="section-IDENTITY_CHECK">
            <SectionReviewCard title="Identity check" status={c.reviewSections.IDENTITY_CHECK} disabled={!canEdit} onStatusChange={canReview ? (s) => handleSectionStatusChange("IDENTITY_CHECK", s) : undefined}>
              {!c.identityMatch ? (
                <p className="crvs-form-hint">No identity match has been run for this case.</p>
              ) : (
                <p className="crvs-form-hint">
                  {c.identityMatch.matchLevel.replace(/_/g, " ")} {c.identityMatch.requiresManualReview ? "— requires manual review" : ""}
                </p>
              )}
            </SectionReviewCard>
          </div>

          <div id="section-DUPLICATE_CHECK">
            <SectionReviewCard title="Duplicate check" status={c.reviewSections.DUPLICATE_CHECK} disabled={!canEdit} onStatusChange={canReview ? (s) => handleSectionStatusChange("DUPLICATE_CHECK", s) : undefined}>
              {!c.duplicateCheck ? (
                <p className="crvs-form-hint">No duplicate check has been run on this case.</p>
              ) : (
                <>
                  <dl className="review-readonly-fields">
                    <Field label="Overall level" value={c.duplicateCheck.overallLevel} />
                  </dl>
                  {c.duplicateCheck.resolution && (
                    <div className="crvs-form-hint" style={{ marginTop: 8 }}>
                      Resolved as {c.duplicateCheck.resolution.type} by {c.duplicateCheck.resolution.resolvedBy}
                    </div>
                  )}
                </>
              )}
            </SectionReviewCard>
          </div>

          <div id="section-OFFICER_DECLARATION">
            <SectionReviewCard title="Officer declaration" status={c.reviewSections.OFFICER_DECLARATION} disabled={!canEdit} onStatusChange={canReview ? (s) => handleSectionStatusChange("OFFICER_DECLARATION", s) : undefined}>
              <dl className="review-readonly-fields">
                <Field label="Officer" value={c.officerName} />
                <Field label="Declaration confirmed" value={c.declarationConfirmed ? "Yes" : "No"} />
                <Field label="Privacy acknowledged" value={c.privacyAcknowledged ? "Yes" : "No"} />
              </dl>
            </SectionReviewCard>
          </div>

          {canViewAudit && (
            <section className="crvs-review-section">
              <h3 className="crvs-section-title">Audit summary</h3>
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
            </section>
          )}
        </div>

        <aside className="review-action-rail" ref={actionRailRef} id="death-review-action-rail">
          <h3>Decision</h3>
          {isLockedByOther && (
            <div className="crvs-banner crvs-banner-warning">This case is locked to {c.reviewerName || "another registrar"}. You can preview it but can&apos;t take action.</div>
          )}
          {!isLockedByOther && !isMine && canStartHere && canReview && <Button text="Start review" appearance="primary" block onClick={handleStartClick} testId="death-rail-start-review" />}
          {canEdit && canRequestCorrection && canTransitionDeathRegistration(c.status, "CORRECTION_REQUIRED") && (
            <Button text="Request correction" appearance="default" block onClick={() => setShowRequestCorrection(true)} testId="death-rail-request-correction" />
          )}
          {canEdit && canRouteAny && (
            <>
              {canRouteLate && canTransitionDeathRegistration(c.status, "LATE_REGISTRATION_REVIEW") && (
                <Button text="Route to late-registration review" appearance="default" block onClick={() => setRouteTarget("LATE_REGISTRATION_REVIEW")} testId="death-rail-route-late" />
              )}
              {canRouteMedicoLegal && canTransitionDeathRegistration(c.status, "MEDICO_LEGAL_REVIEW") && (
                <Button text="Route to medico-legal review" appearance="default" block onClick={() => setRouteTarget("MEDICO_LEGAL_REVIEW")} testId="death-rail-route-medico-legal" />
              )}
              {canRouteUnidentified && canTransitionDeathRegistration(c.status, "UNIDENTIFIED_PERSON_REVIEW") && (
                <Button text="Route to unidentified-person review" appearance="default" block onClick={() => setRouteTarget("UNIDENTIFIED_PERSON_REVIEW")} testId="death-rail-route-unidentified" />
              )}
            </>
          )}
          {canEdit && canApprovePermission && canTransitionDeathRegistration(c.status, "APPROVED") && (
            <Button text="Review approval checklist" appearance="primary" block onClick={() => setShowChecklist(true)} testId="death-rail-open-checklist" />
          )}
          {canEdit && canRejectPermission && canTransitionDeathRegistration(c.status, "REJECTED") && (
            <Button text="Reject registration" appearance="ghost" color="red" block onClick={() => setShowReject(true)} testId="death-rail-reject" />
          )}
          {canEdit &&
            !canTransitionDeathRegistration(c.status, "CORRECTION_REQUIRED") &&
            !canTransitionDeathRegistration(c.status, "APPROVED") &&
            !canTransitionDeathRegistration(c.status, "REJECTED") &&
            !canTransitionDeathRegistration(c.status, "LATE_REGISTRATION_REVIEW") &&
            !canTransitionDeathRegistration(c.status, "MEDICO_LEGAL_REVIEW") &&
            !canTransitionDeathRegistration(c.status, "UNIDENTIFIED_PERSON_REVIEW") && (
              <p className="crvs-form-hint">No further decision actions are available while this case is {c.status.replace(/_/g, " ").toLowerCase()}.</p>
            )}
        </aside>
      </div>

      <StartDeathReviewModal show={showStart} onClose={() => setShowStart(false)} deathCase={c} onConfirm={handleConfirmStart} />
      <ActiveDeathReviewConflictModal show={showConflictLock} onClose={() => setShowConflictLock(false)} deathCase={c} />
      <DeathConflictOfInterestModal show={showConflictOfInterest} onClose={() => setShowConflictOfInterest(false)} reasons={coiReasons} />

      {canRequestCorrection && (
        <RequestDeathCorrectionModal show={showRequestCorrection} onClose={() => setShowRequestCorrection(false)} deathCase={c} actorName={actorName} onRequested={(updated) => setDeathCase(updated)} />
      )}

      {routeTarget && (
        <RouteToExceptionModal
          show={!!routeTarget}
          onClose={() => setRouteTarget(undefined)}
          target={routeTarget}
          deathCase={c}
          onRouted={(updated) => {
            setDeathCase(updated);
            setRouteTarget(undefined);
          }}
        />
      )}

      {canApprovePermission && (
        <>
          <DeathApprovalChecklistModal
            show={showChecklist}
            onClose={() => setShowChecklist(false)}
            deathCase={c}
            accountId={currentAccountId}
            onContinue={() => {
              setShowChecklist(false);
              setShowApprove(true);
            }}
          />
          {currentAccountId && <ApproveDeathRegistrationModal show={showApprove} onClose={() => setShowApprove(false)} deathCase={c} accountId={currentAccountId} actorName={actorName} />}
        </>
      )}

      {canRejectPermission && currentAccountId && (
        <RejectDeathRegistrationModal show={showReject} onClose={() => setShowReject(false)} deathCase={c} accountId={currentAccountId} actorName={actorName} onRejected={(updated) => setDeathCase(updated)} />
      )}
    </div>
  );
}
