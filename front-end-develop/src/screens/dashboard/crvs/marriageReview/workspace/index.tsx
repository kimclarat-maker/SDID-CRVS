import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import "../../shared.css";
import SectionReviewCard from "../../components/SectionReviewCard";
import StatusBadge from "../../components/StatusBadge";
import Button from "@/components/button";
import Empty from "@/components/empty";
import { MarriageApplication, MarriageReviewSectionKey, ReviewSectionStatus } from "@/domain/crvs/types";
import {
  demoGetMarriageApplication,
  demoSetMarriageReviewSectionStatus,
  demoStartMarriageEligibilityReview,
} from "@/demo/services/crvsMarriageApplications";
import { demoListCrvsAuditEvents } from "@/demo/services/crvsAudit";
import { DemoAuditEvent } from "@/demo/types";
import { canTransitionMarriageApplication } from "@/domain/crvs/statusMachines";
import { canAccessMarriageCaseJurisdiction, marriageConflictOfInterestReasons } from "@/utils/workspace/crvsRules";
import { marriagePolicyConfig } from "@/domain/crvs/marriagePolicyConfig";
import { getCurrentAccountId, getCurrentActorName, hasWorkspacePermission } from "@/utils/workspace";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import toastMessage from "@/utils/common/toastMessage";
import StartMarriageReviewModal from "../components/modals/StartMarriageReviewModal";
import ActiveMarriageReviewConflictModal from "../components/modals/ActiveMarriageReviewConflictModal";
import MarriageConflictOfInterestModal from "../components/modals/MarriageConflictOfInterestModal";
import RequestMarriageCorrectionModal from "../components/modals/RequestMarriageCorrectionModal";
import RouteToMarriageExceptionModal from "../components/modals/RouteToMarriageExceptionModal";
import MarriageApprovalChecklistModal from "../components/modals/MarriageApprovalChecklistModal";
import ApproveMarriageApplicationModal from "../components/modals/ApproveMarriageApplicationModal";
import RejectMarriageApplicationModal from "../components/modals/RejectMarriageApplicationModal";
import OpenMarriageObjectionModal from "../components/modals/OpenMarriageObjectionModal";
import {
  applicantDisplayName,
  CIVIL_STATUS_LABELS,
  currencyLabel,
  DOCUMENT_TYPE_LABELS,
  formatDate,
  formatDateTime,
  maskDocumentNumber,
  NATIONALITY_CATEGORY_LABELS,
  PARTNER_CONFIRMATION_LABELS,
  VERIFICATION_LABELS,
} from "../../marriageShared";

const SECTION_LABELS: Record<MarriageReviewSectionKey, string> = {
  APPLICANT1: "Applicant 1",
  APPLICANT2: "Applicant 2",
  PROPOSED_MARRIAGE: "Proposed marriage",
  ELIGIBILITY: "Eligibility",
  EVIDENCE: "Evidence",
  WITNESSES: "Witnesses",
  PAYMENT: "Payment",
  OFFICER_DECLARATION: "Officer declaration",
};

const SECTION_ORDER = Object.keys(SECTION_LABELS) as MarriageReviewSectionKey[];

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function ApplicantFields({ applicant }: { applicant: MarriageApplication["applicant1"] }) {
  return (
    <dl className="review-readonly-fields">
      <Field label="Name" value={applicantDisplayName(applicant)} />
      <Field label="Sex" value={applicant.sex} />
      <Field label="Date of birth" value={formatDate(applicant.dateOfBirth)} />
      <Field label="Nationality" value={applicant.nationality || "—"} />
      <Field label="Category" value={NATIONALITY_CATEGORY_LABELS[applicant.nationalityCategory]} />
      <Field label="Document" value={`${DOCUMENT_TYPE_LABELS[applicant.documentType] || applicant.documentType} · ${maskDocumentNumber(applicant.documentNumber)}`} />
      <Field label="NIN" value={maskDocumentNumber(applicant.nin)} />
      <Field label="Civil status" value={CIVIL_STATUS_LABELS[applicant.civilStatus]} />
      <Field label="Civil status verified" value={applicant.civilStatusVerification ? (applicant.civilStatusVerification.consistent ? "Consistent" : "Inconsistent") : "Not checked"} />
      <Field
        label="Identity verification"
        value={applicant.identityVerification ? `${applicant.identityVerification.matchLevel.replace(/_/g, " ")}${applicant.identityVerification.requiresManualReview ? " — needs manual review" : ""}` : "Not run"}
      />
      <Field label="Participation" value={PARTNER_CONFIRMATION_LABELS[applicant.partnerConfirmationStatus]} />
      <Field label="Verification" value={VERIFICATION_LABELS[applicant.verification] || applicant.verification} />
    </dl>
  );
}

export default function MarriageReviewWorkspace() {
  const { caseId } = useParams<{ caseId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const isDecisionRoute = location.pathname.endsWith("/decision");

  const currentAccountId = getCurrentAccountId();
  const actorName = getCurrentActorName();

  const canView = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_APPLICATION_VIEW);
  const canReview = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_APPLICATION_REVIEW);
  const canRequestCorrection = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_CORRECTION_REQUEST);
  const canApprovePermission = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_APPLICATION_APPROVE);
  const canRejectPermission = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_APPLICATION_REJECT);
  const canViewAudit = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_AUDIT_VIEW);

  const [application, setApplication] = useState<MarriageApplication | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [auditEvents, setAuditEvents] = useState<DemoAuditEvent[]>([]);

  const [showStart, setShowStart] = useState(false);
  const [showConflictLock, setShowConflictLock] = useState(false);
  const [showRequestCorrection, setShowRequestCorrection] = useState(false);
  const [showRouteException, setShowRouteException] = useState(false);
  const [showOpenObjection, setShowOpenObjection] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [showConflictOfInterest, setShowConflictOfInterest] = useState(false);
  const coiShownRef = useRef(false);
  const actionRailRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (!caseId) {
      setLoading(false);
      setError("No application reference was provided.");
      return;
    }
    setLoading(true);
    setError(undefined);
    coiShownRef.current = false;
    try {
      const found = await demoGetMarriageApplication(caseId);
      if (!found) {
        setError("This marriage application was not found.");
        setApplication(undefined);
        return;
      }
      setApplication(found);
      if (canViewAudit) {
        const auditRes = await demoListCrvsAuditEvents({ targetRef: found.reference });
        setAuditEvents(auditRes.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load this application.");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (isDecisionRoute && application) {
      actionRailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDecisionRoute, !!application]);

  const coiReasons = useMemo(() => {
    if (!application) return [] as string[];
    const reasons = marriageConflictOfInterestReasons(currentAccountId, application);
    if (!canAccessMarriageCaseJurisdiction(application.jurisdiction)) reasons.push("This application is outside your assigned jurisdiction.");
    return reasons;
  }, [application, currentAccountId]);

  useEffect(() => {
    if (application && coiReasons.length > 0 && !coiShownRef.current) {
      coiShownRef.current = true;
      setShowConflictOfInterest(true);
    }
  }, [application, coiReasons]);

  const isLockedByOther = !!application?.reviewerId && application.reviewerId !== currentAccountId;
  const isMine = !!application && application.reviewerId === currentAccountId;
  const canStartHere = application ? canTransitionMarriageApplication(application.status, "ELIGIBILITY_REVIEW") : false;
  const canEdit = isMine;

  const handleSectionStatusChange = async (section: MarriageReviewSectionKey, status: ReviewSectionStatus) => {
    if (!application) return;
    try {
      const updated = demoSetMarriageReviewSectionStatus(application.id, section, status, actorName);
      setApplication(updated);
    } catch (err) {
      toastMessage("error", err);
    }
  };

  const handleStartClick = () => {
    if (!application) return;
    if (isLockedByOther) {
      setShowConflictLock(true);
      return;
    }
    setShowStart(true);
  };

  const handleConfirmStart = async () => {
    if (!application || !currentAccountId) return;
    try {
      const updated = demoStartMarriageEligibilityReview(application.id, currentAccountId, actorName);
      setApplication(updated);
      toastMessage("success", "You're now reviewing this application.");
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
        <Empty icon="lock" title="You don't have access to this application" isFullScreen />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="crvs-page">
        <Empty icon="hourglass_empty" title="Loading application…" isFullScreen />
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="crvs-page">
        <Empty
          icon="error"
          title="Couldn't open this application"
          description={error || "This marriage application was not found."}
          isFullScreen
          button={<Button text="Back to marriage review queue" appearance="ghost" onClick={() => navigate("/dashboard/crvs/marriage-review")} />}
        />
      </div>
    );
  }

  const a = application;
  const canRouteException = canEdit && canReview && (!a.exception || a.exception.status === "RESOLVED");
  const canOpenObjection = marriagePolicyConfig.objection.enabled && canEdit && canReview && (!a.objection || a.objection.status !== "PENDING");
  const canApproveHere = canTransitionMarriageApplication(a.status, "APPROVED") || canTransitionMarriageApplication(a.status, "PAYMENT_PENDING");

  return (
    <div className="crvs-page">
      <div className="crvs-section review-case-header">
        <div>
          <h1 className="crvs-page-title">{a.reference}</h1>
          <div className="review-case-meta">
            <StatusBadge kind="marriageApplication" status={a.status} />
            <span>
              {applicantDisplayName(a.applicant1)} &amp; {applicantDisplayName(a.applicant2)}
            </span>
            <span>Proposed {formatDate(a.proposedMarriageDate)}</span>
            <span>{a.jurisdiction}</span>
            {a.isSpecialDayRequest && <span className="crvs-status-pill crvs-status-warning">Special-day request</span>}
            {a.exception && a.exception.status === "OPEN" && <span className="crvs-status-pill crvs-status-warning">Exception open</span>}
            {a.objection && a.objection.status === "PENDING" && <span className="crvs-status-pill crvs-status-warning">Objection pending</span>}
          </div>
        </div>
        {isLockedByOther ? (
          <div className="crvs-banner crvs-banner-warning">Locked by {a.reviewerName || "another registrar"} — read only.</div>
        ) : !isMine && canStartHere && canReview ? (
          <Button text="Start review" appearance="primary" onClick={handleStartClick} testId="marriage-workspace-start-review" />
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
          <div id="section-APPLICANT1">
            <SectionReviewCard title="Applicant 1" status={a.reviewSections.APPLICANT1} disabled={!canEdit} onStatusChange={canReview ? (s) => handleSectionStatusChange("APPLICANT1", s) : undefined}>
              <ApplicantFields applicant={a.applicant1} />
            </SectionReviewCard>
          </div>

          <div id="section-APPLICANT2">
            <SectionReviewCard title="Applicant 2" status={a.reviewSections.APPLICANT2} disabled={!canEdit} onStatusChange={canReview ? (s) => handleSectionStatusChange("APPLICANT2", s) : undefined}>
              <ApplicantFields applicant={a.applicant2} />
            </SectionReviewCard>
          </div>

          <div id="section-PROPOSED_MARRIAGE">
            <SectionReviewCard title="Proposed marriage" status={a.reviewSections.PROPOSED_MARRIAGE} disabled={!canEdit} onStatusChange={canReview ? (s) => handleSectionStatusChange("PROPOSED_MARRIAGE", s) : undefined}>
              <dl className="review-readonly-fields">
                <Field label="Proposed date" value={formatDate(a.proposedMarriageDate)} />
                <Field label="Preferred window" value={a.preferredTimeWindow || "—"} />
                <Field label="Ceremony type" value={a.ceremonyType.replace(/_/g, " ")} />
                <Field label="Property regime" value={a.propertyRegime?.replace(/_/g, " ") || "Not selected"} />
                <Field label="Office" value={`${a.officeName} (${a.officeType.replace(/_/g, " ")})`} />
                <Field label="Special-day request" value={a.isSpecialDayRequest ? "Yes" : "No"} />
                <Field label="Accessibility note" value={a.languageOrAccessibilityNote || "—"} />
              </dl>
            </SectionReviewCard>
          </div>

          <div id="section-ELIGIBILITY">
            <SectionReviewCard title="Eligibility" status={a.reviewSections.ELIGIBILITY} disabled={!canEdit} onStatusChange={canReview ? (s) => handleSectionStatusChange("ELIGIBILITY", s) : undefined}>
              {!a.eligibility ? (
                <p className="crvs-form-hint">No eligibility check has been run for this application.</p>
              ) : (
                <>
                  <p className="crvs-form-hint">Overall: {a.eligibility.overallOutcome.replace(/_/g, " ")}</p>
                  <ul style={{ listStyle: "none", margin: "8px 0 0", padding: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                    {a.eligibility.results.map((r) => (
                      <li key={r.rule} className={`crvs-banner ${r.passed ? "crvs-banner-info" : "crvs-banner-warning"}`}>
                        <strong>{r.rule.replace(/_/g, " ")}</strong> — {r.message}
                      </li>
                    ))}
                  </ul>
                  {a.eligibility.existingMarriageConflicts.length > 0 && (
                    <div className="crvs-banner crvs-banner-warning" style={{ marginTop: 8 }}>
                      Existing-marriage conflicts found for {a.eligibility.existingMarriageConflicts.map((c) => c.spouseRole).join(", ")}.
                    </div>
                  )}
                </>
              )}
            </SectionReviewCard>
          </div>

          <div id="section-EVIDENCE">
            <SectionReviewCard title="Evidence" status={a.reviewSections.EVIDENCE} disabled={!canEdit} onStatusChange={canReview ? (s) => handleSectionStatusChange("EVIDENCE", s) : undefined}>
              {a.evidence.filter((e) => !e.removed).length === 0 ? (
                <p className="crvs-form-hint">No evidence documents attached.</p>
              ) : (
                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                  {a.evidence
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

          <div id="section-WITNESSES">
            <SectionReviewCard title="Witnesses" status={a.reviewSections.WITNESSES} disabled={!canEdit} onStatusChange={canReview ? (s) => handleSectionStatusChange("WITNESSES", s) : undefined}>
              {a.witnesses.filter((w) => !w.replaced).length === 0 ? (
                <p className="crvs-form-hint">No witnesses recorded on this application.</p>
              ) : (
                a.witnesses
                  .filter((w) => !w.replaced)
                  .map((w) => (
                    <dl className="review-readonly-fields" key={w.id} style={{ marginBottom: 8 }}>
                      <Field label="Name" value={`${w.firstName} ${w.lastName}`} />
                      <Field label="For" value={w.spouseRole === "APPLICANT1" ? "Applicant 1" : "Applicant 2"} />
                      <Field label="Relationship" value={w.relationship} />
                      <Field label="Verification" value={w.verification} />
                    </dl>
                  ))
              )}
            </SectionReviewCard>
          </div>

          <div id="section-PAYMENT">
            <SectionReviewCard title="Payment" status={a.reviewSections.PAYMENT} disabled={!canEdit} onStatusChange={canReview ? (s) => handleSectionStatusChange("PAYMENT", s) : undefined}>
              <dl className="review-readonly-fields">
                <Field label="Status" value={a.payment.status.replace(/_/g, " ")} />
                <Field label="Amount" value={currencyLabel(a.payment.amount, a.payment.currency)} />
                <Field label="Special-day fee" value={a.payment.isSpecialDayFee ? "Yes" : "No"} />
                <Field label="Method" value={a.payment.method?.replace(/_/g, " ") || "—"} />
                <Field label="Reference" value={a.payment.reference || "—"} />
                {a.payment.waivedBy && <Field label="Waived by" value={`${a.payment.waivedBy} — ${a.payment.waivedReason || "no reason recorded"}`} />}
              </dl>
            </SectionReviewCard>
          </div>

          <div id="section-OFFICER_DECLARATION">
            <SectionReviewCard title="Officer declaration" status={a.reviewSections.OFFICER_DECLARATION} disabled={!canEdit} onStatusChange={canReview ? (s) => handleSectionStatusChange("OFFICER_DECLARATION", s) : undefined}>
              <dl className="review-readonly-fields">
                <Field label="Officer" value={a.officerName} />
                <Field label="Declaration confirmed" value={a.declarationConfirmed ? "Yes" : "No"} />
                <Field label="Consent to verification" value={a.consentToVerification ? "Yes" : "No"} />
                <Field label="Privacy acknowledged" value={a.privacyAcknowledged ? "Yes" : "No"} />
              </dl>
            </SectionReviewCard>
          </div>

          {canViewAudit && (
            <section className="crvs-review-section">
              <h3 className="crvs-section-title">Audit summary</h3>
              {auditEvents.length === 0 ? (
                <p className="crvs-form-hint">No audit events recorded for this application yet.</p>
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

        <aside className="review-action-rail" ref={actionRailRef} id="marriage-review-action-rail">
          <h3>Decision</h3>
          {isLockedByOther && (
            <div className="crvs-banner crvs-banner-warning">This application is locked to {a.reviewerName || "another registrar"}. You can preview it but can&apos;t take action.</div>
          )}
          {!isLockedByOther && !isMine && canStartHere && canReview && <Button text="Start review" appearance="primary" block onClick={handleStartClick} testId="marriage-rail-start-review" />}
          {canEdit && canRequestCorrection && canTransitionMarriageApplication(a.status, "CORRECTION_REQUIRED") && (
            <Button text="Request correction" appearance="default" block onClick={() => setShowRequestCorrection(true)} testId="marriage-rail-request-correction" />
          )}
          {canRouteException && (
            <Button text="Route to exception review" appearance="default" block onClick={() => setShowRouteException(true)} testId="marriage-rail-route-exception" />
          )}
          {canOpenObjection && <Button text="Open objection" appearance="default" block onClick={() => setShowOpenObjection(true)} testId="marriage-rail-open-objection" />}
          {canEdit && canApprovePermission && canApproveHere && (
            <Button text="Review approval checklist" appearance="primary" block onClick={() => setShowChecklist(true)} testId="marriage-rail-open-checklist" />
          )}
          {canEdit && canRejectPermission && canTransitionMarriageApplication(a.status, "REJECTED") && (
            <Button text="Reject application" appearance="ghost" color="red" block onClick={() => setShowReject(true)} testId="marriage-rail-reject" />
          )}
          {canEdit && !canTransitionMarriageApplication(a.status, "CORRECTION_REQUIRED") && !canApproveHere && !canTransitionMarriageApplication(a.status, "REJECTED") && !canRouteException && !canOpenObjection && (
            <p className="crvs-form-hint">No further decision actions are available while this application is {a.status.replace(/_/g, " ").toLowerCase()}.</p>
          )}
        </aside>
      </div>

      <StartMarriageReviewModal show={showStart} onClose={() => setShowStart(false)} application={a} onConfirm={handleConfirmStart} />
      <ActiveMarriageReviewConflictModal show={showConflictLock} onClose={() => setShowConflictLock(false)} application={a} />
      <MarriageConflictOfInterestModal show={showConflictOfInterest} onClose={() => setShowConflictOfInterest(false)} reasons={coiReasons} />

      {canRequestCorrection && (
        <RequestMarriageCorrectionModal show={showRequestCorrection} onClose={() => setShowRequestCorrection(false)} application={a} actorName={actorName} onRequested={(updated) => setApplication(updated)} />
      )}

      <RouteToMarriageExceptionModal
        show={showRouteException}
        onClose={() => setShowRouteException(false)}
        application={a}
        onRouted={(updated) => {
          setApplication(updated);
          setShowRouteException(false);
        }}
      />

      <OpenMarriageObjectionModal
        show={showOpenObjection}
        onClose={() => setShowOpenObjection(false)}
        application={a}
        onOpened={(updated) => {
          setApplication(updated);
          setShowOpenObjection(false);
        }}
      />

      {canApprovePermission && (
        <>
          <MarriageApprovalChecklistModal
            show={showChecklist}
            onClose={() => setShowChecklist(false)}
            application={a}
            accountId={currentAccountId}
            onContinue={() => {
              setShowChecklist(false);
              setShowApprove(true);
            }}
          />
          {currentAccountId && (
            <ApproveMarriageApplicationModal
              show={showApprove}
              onClose={() => setShowApprove(false)}
              application={a}
              accountId={currentAccountId}
              actorName={actorName}
              onApproved={(updated) => setApplication(updated)}
            />
          )}
        </>
      )}

      {canRejectPermission && currentAccountId && (
        <RejectMarriageApplicationModal show={showReject} onClose={() => setShowReject(false)} application={a} accountId={currentAccountId} actorName={actorName} onRejected={(updated) => setApplication(updated)} />
      )}
    </div>
  );
}
