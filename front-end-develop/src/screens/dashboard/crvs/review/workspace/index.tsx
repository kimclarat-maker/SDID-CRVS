import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import "../../shared.css";
import "../review.css";
import SectionReviewCard from "../../components/SectionReviewCard";
import StatusBadge from "../../components/StatusBadge";
import StatusTimeline from "../../components/StatusTimeline";
import Button from "@/components/button";
import Empty from "@/components/empty";
import {
  BirthRegistrationCase,
  ReviewSectionKey,
  ReviewSectionStatus,
} from "@/domain/crvs/types";
import { demoGetRegistration, demoSetReviewSectionStatus, demoStartReview } from "@/demo/services/crvsRegistrations";
import { demoListCrvsAuditEvents } from "@/demo/services/crvsAudit";
import { DemoAuditEvent } from "@/demo/types";
import { canTransitionRegistration } from "@/domain/crvs/statusMachines";
import { canAccessCaseJurisdiction, conflictOfInterestReasons } from "@/utils/workspace/crvsRules";
import { getCurrentAccountId, hasWorkspacePermission } from "@/utils/workspace";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import toastMessage from "@/utils/common/toastMessage";
import StartReviewModal from "../components/modals/StartReviewModal";
import ActiveReviewConflictModal from "../components/modals/ActiveReviewConflictModal";
import RequestCorrectionModal from "../components/modals/RequestCorrectionModal";
import ApprovalChecklistModal from "../components/modals/ApprovalChecklistModal";
import ApproveRegistrationModal from "../components/modals/ApproveRegistrationModal";
import RejectRegistrationModal from "../components/modals/RejectRegistrationModal";
import ConflictOfInterestModal from "../components/modals/ConflictOfInterestModal";
import { formatDateTime, fullName, getCurrentActorName, maskId } from "../utils";

const SECTION_LABELS: Record<ReviewSectionKey, string> = {
  CHILD: "Child",
  PARENTS: "Parents",
  DECLARANT: "Declarant",
  WITNESSES: "Witnesses",
  EVIDENCE: "Evidence",
  DUPLICATE_CHECK: "Duplicate check",
  LATE_OR_EXCEPTION: "Late / exception resolution",
  OFFICER_DECLARATION: "Officer declaration",
};

const SECTION_ORDER = Object.keys(SECTION_LABELS) as ReviewSectionKey[];

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

/**
 * Civil Registrar review workspace — routed at both /dashboard/crvs/review/:caseId
 * and /dashboard/crvs/review/:caseId/decision (the integrator wires both
 * routes to this component). The only difference between the two paths is
 * that "/decision" auto-scrolls to the decision action rail on mount, per
 * spec — everything else (data, permissions, modals) is identical.
 */
export default function ReviewWorkspace() {
  const { caseId } = useParams<{ caseId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const isDecisionRoute = location.pathname.endsWith("/decision");

  const currentAccountId = getCurrentAccountId();
  const actorName = getCurrentActorName();

  const canView = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.REGISTRATION_VIEW);
  const canReview = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.EVIDENCE_REVIEW);
  const canRequestCorrection = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.CORRECTION_REQUEST);
  const canApprovePermission = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.REGISTRATION_APPROVE);
  const canRejectPermission = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.REGISTRATION_REJECT);
  const canViewAudit = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.AUDIT_VIEW);

  const [registrationCase, setRegistrationCase] = useState<BirthRegistrationCase | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [auditEvents, setAuditEvents] = useState<DemoAuditEvent[]>([]);

  const [showStart, setShowStart] = useState(false);
  const [showConflictLock, setShowConflictLock] = useState(false);
  const [showRequestCorrection, setShowRequestCorrection] = useState(false);
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
      const found = await demoGetRegistration(caseId);
      if (!found) {
        setError("This registration case was not found.");
        setRegistrationCase(undefined);
        return;
      }
      setRegistrationCase(found);
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
    if (isDecisionRoute && registrationCase) {
      actionRailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDecisionRoute, !!registrationCase]);

  const coiReasons = useMemo(() => {
    if (!registrationCase) return [] as string[];
    const reasons = conflictOfInterestReasons(currentAccountId, registrationCase);
    if (!canAccessCaseJurisdiction(registrationCase.jurisdiction)) {
      reasons.push("This case is outside your assigned jurisdiction.");
    }
    return reasons;
  }, [registrationCase, currentAccountId]);

  useEffect(() => {
    if (registrationCase && coiReasons.length > 0 && !coiShownRef.current) {
      coiShownRef.current = true;
      setShowConflictOfInterest(true);
    }
  }, [registrationCase, coiReasons]);

  const isLockedByOther = !!registrationCase?.reviewerId && registrationCase.reviewerId !== currentAccountId;
  const isMine = !!registrationCase && registrationCase.reviewerId === currentAccountId;
  const canStartHere = registrationCase ? canTransitionRegistration(registrationCase.status, "UNDER_REVIEW") : false;
  const canEdit = isMine;

  const handleSectionStatusChange = async (section: ReviewSectionKey, status: ReviewSectionStatus) => {
    if (!registrationCase) return;
    try {
      const updated = demoSetReviewSectionStatus(registrationCase.id, section, status, actorName);
      setRegistrationCase(updated);
    } catch (err) {
      toastMessage("error", err);
    }
  };

  const handleStartClick = () => {
    if (!registrationCase) return;
    if (isLockedByOther) {
      setShowConflictLock(true);
      return;
    }
    setShowStart(true);
  };

  const handleConfirmStart = async () => {
    if (!registrationCase || !currentAccountId) return;
    try {
      const updated = demoStartReview(registrationCase.id, currentAccountId, actorName);
      setRegistrationCase(updated);
      toastMessage("success", "You're now reviewing this case.");
    } catch (err) {
      if (err instanceof Error && err.message.toLowerCase().includes("already being reviewed")) {
        setShowStart(false);
        setShowConflictLock(true);
        return;
      }
      throw err;
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

  if (error || !registrationCase) {
    return (
      <div className="crvs-page">
        <Empty
          icon="error"
          title="Couldn't open this case"
          description={error || "This registration case was not found."}
          isFullScreen
          button={
            <Button text="Back to review queue" appearance="ghost" onClick={() => navigate("/dashboard/crvs/review")} />
          }
        />
      </div>
    );
  }

  const c = registrationCase;

  return (
    <div className="crvs-page">
      <div className="crvs-section review-case-header">
        <div>
          <h1 className="crvs-page-title">{c.reference}</h1>
          <div className="review-case-meta">
            <StatusBadge kind="registration" status={c.status} />
            <span>{fullName(c.child.firstName, c.child.middleName, c.child.lastName)}</span>
            <span>DOB {c.child.dateOfBirth}</span>
            <span>{c.jurisdiction}</span>
            {c.isLate && <span className="crvs-status-pill crvs-status-warning">Late registration</span>}
          </div>
        </div>
        {isLockedByOther ? (
          <div className="crvs-banner crvs-banner-warning">Locked by {c.reviewerName || "another registrar"} — read only.</div>
        ) : !isMine && canStartHere && canReview ? (
          <Button text="Start review" appearance="primary" onClick={handleStartClick} testId="workspace-start-review" />
        ) : null}
      </div>

      <div className="crvs-section">
        <StatusTimeline registrationCase={c} />
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
          <div id="section-CHILD">
            <SectionReviewCard
              title="Child"
              status={c.reviewSections.CHILD}
              disabled={!canEdit}
              onStatusChange={canReview ? (s) => handleSectionStatusChange("CHILD", s) : undefined}
            >
              <dl className="review-readonly-fields">
                <Field label="Name" value={fullName(c.child.firstName, c.child.middleName, c.child.lastName)} />
                <Field label="Sex" value={c.child.sex} />
                <Field label="Date of birth" value={c.child.dateOfBirth} />
                <Field label="Time of birth" value={c.child.timeOfBirth || "—"} />
                <Field label="Place of birth" value={c.child.placeOfBirth} />
                <Field label="Country" value={c.child.country || "—"} />
                <Field label="Admin place of birth" value={c.child.adminPlaceOfBirth || "—"} />
                <Field
                  label="Multiple birth"
                  value={
                    c.child.multipleBirth.isMultiple
                      ? `Yes (${c.child.multipleBirth.birthOrder ?? "?"} of ${c.child.multipleBirth.totalBirths ?? "?"})`
                      : "No"
                  }
                />
              </dl>
            </SectionReviewCard>
          </div>

          <div id="section-PARENTS">
            <SectionReviewCard
              title="Parents"
              status={c.reviewSections.PARENTS}
              disabled={!canEdit}
              onStatusChange={canReview ? (s) => handleSectionStatusChange("PARENTS", s) : undefined}
            >
              <h4 className="crvs-form-hint" style={{ marginBottom: 4 }}>Mother</h4>
              <dl className="review-readonly-fields">
                <Field label="Name" value={fullName(c.mother.firstName, undefined, c.mother.lastName)} />
                <Field label="Document" value={`${c.mother.documentType} · ${maskId(c.mother.documentNumber)}`} />
                <Field label="Nationality" value={c.mother.nationality} />
                <Field label="Phone" value={c.mother.phone || "—"} />
                <Field label="Email" value={c.mother.email || "—"} />
                <Field label="Residence" value={c.mother.residence || "—"} />
                <Field label="Verification" value={c.mother.verification} />
                <Field label="SDID identity" value={maskId(c.mother.sdidIdentityId)} />
              </dl>
              <h4 className="crvs-form-hint" style={{ margin: "12px 0 4px" }}>Father</h4>
              {c.father.availability === "PROVIDED_VERIFIED" || c.father.availability === "PROVIDED_UNVERIFIED" ? (
                <dl className="review-readonly-fields">
                  <Field label="Name" value={fullName(c.father.firstName, undefined, c.father.lastName)} />
                  <Field label="Document" value={`${c.father.documentType || "—"} · ${maskId(c.father.documentNumber)}`} />
                  <Field label="Nationality" value={c.father.nationality || "—"} />
                  <Field label="Phone" value={c.father.phone || "—"} />
                  <Field label="Verification" value={c.father.verification || "—"} />
                  <Field label="SDID identity" value={maskId(c.father.sdidIdentityId)} />
                </dl>
              ) : (
                <p className="crvs-form-hint">Father availability: {c.father.availability.replace(/_/g, " ")}</p>
              )}
            </SectionReviewCard>
          </div>

          <div id="section-DECLARANT">
            <SectionReviewCard
              title="Declarant"
              status={c.reviewSections.DECLARANT}
              disabled={!canEdit}
              onStatusChange={canReview ? (s) => handleSectionStatusChange("DECLARANT", s) : undefined}
            >
              <dl className="review-readonly-fields">
                <Field label="Name" value={fullName(c.declarant.firstName, undefined, c.declarant.lastName)} />
                <Field label="Relationship to child" value={c.declarant.relationship} />
                <Field label="Document" value={`${c.declarant.documentType} · ${maskId(c.declarant.documentNumber)}`} />
                <Field label="Phone" value={c.declarant.phone || "—"} />
                <Field label="Email" value={c.declarant.email || "—"} />
                <Field label="Verification" value={c.declarant.verification} />
              </dl>
            </SectionReviewCard>
          </div>

          <div id="section-WITNESSES">
            <SectionReviewCard
              title="Witnesses"
              status={c.reviewSections.WITNESSES}
              disabled={!canEdit}
              onStatusChange={canReview ? (s) => handleSectionStatusChange("WITNESSES", s) : undefined}
            >
              {c.witnesses.length === 0 ? (
                <p className="crvs-form-hint">No witnesses recorded on this case.</p>
              ) : (
                c.witnesses.map((w) => (
                  <dl className="review-readonly-fields" key={w.id} style={{ marginBottom: 8 }}>
                    <Field label="Name" value={fullName(w.firstName, undefined, w.lastName)} />
                    <Field label="Relationship" value={w.relationship} />
                    <Field label="Document" value={`${w.documentType} · ${maskId(w.documentNumber)}`} />
                    <Field label="Phone" value={w.phone || "—"} />
                    <Field label="Verification" value={w.verification} />
                  </dl>
                ))
              )}
            </SectionReviewCard>
          </div>

          <div id="section-EVIDENCE">
            <SectionReviewCard
              title="Evidence"
              status={c.reviewSections.EVIDENCE}
              disabled={!canEdit}
              onStatusChange={canReview ? (s) => handleSectionStatusChange("EVIDENCE", s) : undefined}
            >
              {c.evidence.length === 0 ? (
                <p className="crvs-form-hint">No evidence documents attached.</p>
              ) : (
                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                  {c.evidence.map((ev) => (
                    <li key={ev.id} className="crvs-banner crvs-banner-info" style={{ opacity: ev.removed ? 0.5 : 1 }}>
                      <div>
                        <strong>{ev.documentType}</strong> — {ev.fileName} ({ev.fileType}, {ev.fileSizeKb}KB)
                        <div className="crvs-form-hint">
                          Uploaded {formatDateTime(ev.uploadedAt)} by {ev.uploadedBy} · {ev.verification}
                          {ev.removed ? " · Removed" : ""}
                        </div>
                        {ev.description && <div className="crvs-form-hint">{ev.description}</div>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </SectionReviewCard>
          </div>

          <div id="section-DUPLICATE_CHECK">
            <SectionReviewCard
              title="Duplicate check"
              status={c.reviewSections.DUPLICATE_CHECK}
              disabled={!canEdit}
              onStatusChange={canReview ? (s) => handleSectionStatusChange("DUPLICATE_CHECK", s) : undefined}
            >
              {!c.duplicateCheck ? (
                <p className="crvs-form-hint">No duplicate check has been run on this case.</p>
              ) : (
                <>
                  <dl className="review-readonly-fields">
                    <Field label="Overall level" value={c.duplicateCheck.overallLevel} />
                    <Field label="Checked at" value={formatDateTime(c.duplicateCheck.checkedAt)} />
                    <Field label="Checked by" value={c.duplicateCheck.checkedBy} />
                  </dl>
                  {c.duplicateCheck.candidates.length > 0 && (
                    <ul style={{ margin: "8px 0 0", paddingLeft: 20 }}>
                      {c.duplicateCheck.candidates.map((cand) => (
                        <li key={cand.caseId}>
                          {cand.reference} — {cand.matchLevel} ({cand.matchedFields.join(", ")}) — {cand.maskedSummary}
                        </li>
                      ))}
                    </ul>
                  )}
                  {c.duplicateCheck.resolution && (
                    <div className="crvs-form-hint" style={{ marginTop: 8 }}>
                      Resolved as {c.duplicateCheck.resolution.type} by {c.duplicateCheck.resolution.resolvedBy} —{" "}
                      {c.duplicateCheck.resolution.reason}
                    </div>
                  )}
                </>
              )}
            </SectionReviewCard>
          </div>

          <div id="section-LATE_OR_EXCEPTION">
            <SectionReviewCard
              title="Late / exception resolution"
              status={c.reviewSections.LATE_OR_EXCEPTION}
              disabled={!canEdit}
              onStatusChange={canReview ? (s) => handleSectionStatusChange("LATE_OR_EXCEPTION", s) : undefined}
            >
              <dl className="review-readonly-fields">
                <Field label="Is late registration" value={c.isLate ? "Yes" : "No"} />
                <Field label="Days after birth" value={String(c.daysAfterBirth)} />
                <Field label="Requires supervisor review" value={c.requiresSupervisorReview ? "Yes" : "No"} />
                <Field label="Delay reason" value={c.delayReason || "—"} />
                <Field label="Direct registration reason" value={c.directRegistrationReason || "—"} />
                <Field label="Registration category" value={c.registrationCategory} />
              </dl>
              {c.exception && (
                <div className="crvs-banner crvs-banner-warning" style={{ marginTop: 12 }}>
                  Exception: {c.exception.type} — {c.exception.reason} ({c.exception.status})
                </div>
              )}
            </SectionReviewCard>
          </div>

          <div id="section-OFFICER_DECLARATION">
            <SectionReviewCard
              title="Officer declaration"
              status={c.reviewSections.OFFICER_DECLARATION}
              disabled={!canEdit}
              onStatusChange={canReview ? (s) => handleSectionStatusChange("OFFICER_DECLARATION", s) : undefined}
            >
              <dl className="review-readonly-fields">
                <Field label="Officer" value={c.officerName} />
                <Field label="Declaration confirmed" value={c.declarationConfirmed ? "Yes" : "No"} />
                <Field label="Declarant confirmed" value={c.declarantConfirmed ? "Yes" : "No"} />
                <Field label="Privacy acknowledged" value={c.privacyAcknowledged ? "Yes" : "No"} />
                <Field label="Submitted" value={formatDateTime(c.submittedAt)} />
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

        <aside className="review-action-rail" ref={actionRailRef} id="review-action-rail">
          <h3>Decision</h3>
          {isLockedByOther && (
            <div className="crvs-banner crvs-banner-warning">
              This case is locked to {c.reviewerName || "another registrar"}. You can preview it but can't take
              action until it's released or reassigned.
            </div>
          )}
          {!isLockedByOther && !isMine && canStartHere && canReview && (
            <Button text="Start review" appearance="primary" block onClick={handleStartClick} testId="rail-start-review" />
          )}
          {canEdit && canRequestCorrection && canTransitionRegistration(c.status, "CORRECTION_REQUIRED") && (
            <Button
              text="Request correction"
              appearance="default"
              block
              onClick={() => setShowRequestCorrection(true)}
              testId="rail-request-correction"
            />
          )}
          {canEdit && canApprovePermission && canTransitionRegistration(c.status, "APPROVED") && (
            <Button
              text="Review approval checklist"
              appearance="primary"
              block
              onClick={() => setShowChecklist(true)}
              testId="rail-open-checklist"
            />
          )}
          {canEdit && canRejectPermission && canTransitionRegistration(c.status, "REJECTED") && (
            <Button
              text="Reject registration"
              appearance="ghost"
              color="red"
              block
              onClick={() => setShowReject(true)}
              testId="rail-reject"
            />
          )}
          {canEdit &&
            !canTransitionRegistration(c.status, "CORRECTION_REQUIRED") &&
            !canTransitionRegistration(c.status, "APPROVED") &&
            !canTransitionRegistration(c.status, "REJECTED") && (
              <p className="crvs-form-hint">No further decision actions are available while this case is {c.status.replace(/_/g, " ").toLowerCase()}.</p>
            )}
        </aside>
      </div>

      <StartReviewModal show={showStart} onClose={() => setShowStart(false)} registrationCase={c} onConfirm={handleConfirmStart} />
      <ActiveReviewConflictModal show={showConflictLock} onClose={() => setShowConflictLock(false)} registrationCase={c} />
      <ConflictOfInterestModal show={showConflictOfInterest} onClose={() => setShowConflictOfInterest(false)} reasons={coiReasons} />

      {canRequestCorrection && (
        <RequestCorrectionModal
          show={showRequestCorrection}
          onClose={() => setShowRequestCorrection(false)}
          registrationCase={c}
          actorName={actorName}
          onRequested={(updated) => setRegistrationCase(updated)}
        />
      )}

      {canApprovePermission && (
        <>
          <ApprovalChecklistModal
            show={showChecklist}
            onClose={() => setShowChecklist(false)}
            registrationCase={c}
            accountId={currentAccountId}
            onContinue={() => {
              setShowChecklist(false);
              setShowApprove(true);
            }}
          />
          {currentAccountId && (
            <ApproveRegistrationModal
              show={showApprove}
              onClose={() => setShowApprove(false)}
              registrationCase={c}
              accountId={currentAccountId}
              actorName={actorName}
            />
          )}
        </>
      )}

      {canRejectPermission && currentAccountId && (
        <RejectRegistrationModal
          show={showReject}
          onClose={() => setShowReject(false)}
          registrationCase={c}
          accountId={currentAccountId}
          actorName={actorName}
          onRejected={(updated) => setRegistrationCase(updated)}
        />
      )}
    </div>
  );
}
