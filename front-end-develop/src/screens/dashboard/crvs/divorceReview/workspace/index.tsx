import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SectionReviewCard from "../../components/SectionReviewCard";
import StatusBadge from "../../components/StatusBadge";
import Button from "@/components/button";
import Empty from "@/components/empty";
import Icon from "@/components/icon";
import { DescriptionList, DescriptionItem } from "@/components/descriptionList";
import DocumentPreviewModal from "@/components/crvs/modals/DocumentPreviewModal";
import {
  DivorceEvidence,
  DivorceRegistration,
  DivorceRegistrationStatus,
  DivorceReviewSectionKey,
  FormerSpouse,
  ReviewSectionStatus,
} from "@/domain/crvs/types";
import {
  demoGetDivorceRegistration,
  demoSetDivorceReviewSectionStatus,
  demoStartDivorceReview,
  isDivorceLateRegistration,
  runDivorceDuplicateCheck,
} from "@/demo/services/crvsDivorceRegistrations";
import { demoListCrvsAuditEvents } from "@/demo/services/crvsAudit";
import { getDemoData } from "@/demo/storage/demoStore";
import { DemoAuditEvent } from "@/demo/types";
import {
  canTransitionDivorceRegistration,
  DIVORCE_REGISTRATION_STATUS_LABELS,
  DIVORCE_SPOUSE_SYNC_STATUS_LABELS,
} from "@/domain/crvs/statusMachines";
import { canAccessDivorceCaseJurisdiction, canApproveDivorceCase, divorceConflictOfInterestReasons } from "@/utils/workspace/crvsRules";
import { DIVORCE_EXCEPTION_TRIGGER_LABELS, divorcePolicyConfig, isJudgmentFinalityValid, requiredDocumentsFor } from "@/domain/crvs/divorcePolicyConfig";
import { getCurrentAccountId, getCurrentActorName, hasWorkspacePermission } from "@/utils/workspace";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import toastMessage from "@/utils/common/toastMessage";
import {
  activeEvidence,
  applicantDisplayName,
  DIVORCE_APPLICANT_RELATIONSHIP_LABELS,
  DIVORCE_DECISION_TYPE_LABELS,
  DIVORCE_REVIEW_SECTION_LABELS,
  DIVORCE_SOURCE_LABELS,
  EXISTING_MARRIAGE_MATCH_LABELS,
  FOREIGN_RECOGNITION_STATUS_LABELS,
  IDENTITY_MATCH_CONFIDENCE_LABELS,
  JUDGMENT_VERIFICATION_RULE_LABELS,
  divorceSlaState,
  formatDate,
  formatDateTime,
  formerSpouseDisplayName,
  formerSpousesLabel,
  marriageReferenceLabel,
  maskDocumentNumber,
} from "../../divorceShared";
import { ActiveDivorceReviewConflictModal, DivorceConflictOfInterestModal, StartDivorceReviewModal } from "../components/modals/StartDivorceReviewModal";
import RequestDivorceCorrectionModal from "../components/modals/RequestDivorceCorrectionModal";
import { RouteToDivorceExceptionModal, RouteToForeignReviewModal, RouteToJudgmentVerificationModal } from "../components/modals/RouteDivorceModals";
import ApproveDivorceRegistrationModal from "../components/modals/ApproveDivorceRegistrationModal";
import RejectDivorceRegistrationModal from "../components/modals/RejectDivorceRegistrationModal";
import RegisterDivorceModal from "../components/modals/RegisterDivorceModal";
import { CompleteJudgmentVerificationModal, RunJudgmentVerificationModal } from "../components/modals/JudgmentVerificationModals";
import "../../shared.css";
import "../../review/review.css";

type TabKey =
  | "OVERVIEW"
  | "APPLICANT"
  | "EXISTING_MARRIAGE"
  | "FORMER_SPOUSE_1"
  | "FORMER_SPOUSE_2"
  | "COURT_DECISION"
  | "EVIDENCE"
  | "VERIFICATION"
  | "REVIEW"
  | "SDID"
  | "TIMELINE"
  | "AUDIT";

const TAB_META: { key: TabKey; label: string }[] = [
  { key: "OVERVIEW", label: "Overview" },
  { key: "APPLICANT", label: "Applicant" },
  { key: "EXISTING_MARRIAGE", label: "Existing marriage" },
  { key: "FORMER_SPOUSE_1", label: "Former spouse one" },
  { key: "FORMER_SPOUSE_2", label: "Former spouse two" },
  { key: "COURT_DECISION", label: "Court decision" },
  { key: "EVIDENCE", label: "Evidence" },
  { key: "VERIFICATION", label: "Verification" },
  { key: "REVIEW", label: "Review" },
  { key: "SDID", label: "SDID synchronization" },
  { key: "TIMELINE", label: "Timeline" },
  { key: "AUDIT", label: "Audit" },
];

type ChecklistItem = { key: string; label: string; passed: boolean; detail: string };

/**
 * Builds the full review checklist (spec §17). Every requirement is a
 * separate pass/fail line with its own explanation — deliberately never
 * collapsed into a single "verified" badge. Thresholds and requirements come
 * from divorcePolicyConfig; the maker-checker and conflict-of-interest lines
 * come from canApproveDivorceCase()/divorceConflictOfInterestReasons() so the
 * checklist can never disagree with the gate that actually blocks approval.
 */
function buildChecklist(registration: DivorceRegistration, accountId: string | undefined, allRegistrations: DivorceRegistration[]): ChecklistItem[] {
  const r = registration;
  const applicantIsSpouse = r.applicant.relationshipToCase === "FORMER_SPOUSE_1" || r.applicant.relationshipToCase === "FORMER_SPOUSE_2" || r.applicant.relationshipToCase === "BOTH_FORMER_SPOUSES";
  const evidence = activeEvidence(r.evidence);
  const requiredDocs = requiredDocumentsFor({ applicantIsSpouse, isForeign: r.judgment.isForeign });
  const missingDocs = requiredDocs.filter((doc) => !evidence.some((e) => e.documentType === doc));
  const duplicate = runDivorceDuplicateCheck(r, allRegistrations);
  const coiReasons = divorceConflictOfInterestReasons(accountId, r);
  const verificationResults = r.judgmentVerification.results;
  const ruleFailed = (rule: string) => verificationResults.some((v) => v.rule === rule && !v.passed);
  const ruleMessage = (rule: string) => verificationResults.find((v) => v.rule === rule)?.message;

  const bothSpousesIdentified =
    r.formerSpouse1.identityMatchConfidence === "CONFIRMED" &&
    r.formerSpouse2.identityMatchConfidence === "CONFIRMED" &&
    !!r.formerSpouse1.firstName &&
    !!r.formerSpouse2.firstName;

  const civilStatusConflict = ruleFailed("EXISTING_CIVIL_STATUS") || ruleFailed("CONFLICTING_ACTIVE_MARRIAGE");
  const annulmentConflict = ruleFailed("POSSIBLE_ANNULMENT") || ruleFailed("POSSIBLE_JUDICIAL_SEPARATION");
  const foreignResolved = !r.judgment.isForeign || r.foreignRecognition.status === "REQUIREMENTS_SATISFIED";
  const effectiveDate = r.registrationEvent?.effectiveDate || r.judgment.registrationEffectiveDate;
  const effectiveDateValid = !!effectiveDate && (!r.judgment.judgmentDate || effectiveDate.slice(0, 10) >= r.judgment.judgmentDate.slice(0, 10));
  const applicantAuthorized = applicantIsSpouse || !!r.applicant.authorizationBasis?.trim();
  const jurisdictionOk = canAccessDivorceCaseJurisdiction(r.jurisdiction) && r.processingOffice.jurisdictionResult !== "UNRESOLVED";
  const latestApproval = [...r.reviewDecisions].reverse().find((d) => d.type === "APPROVE");

  return [
    {
      key: "MARRIAGE_IDENTIFIED",
      label: "Existing marriage identified",
      passed: r.existingMarriage.status === "MATCHED" && !!r.existingMarriage.selected,
      detail: r.existingMarriage.selected ? `Linked to ${r.existingMarriage.selected.registrationNumber}.` : `Match status is ${EXISTING_MARRIAGE_MATCH_LABELS[r.existingMarriage.status].toLowerCase()}.`,
    },
    {
      key: "MARRIAGE_UPDATABLE",
      label: "Marriage eligible to be updated",
      passed: !!r.existingMarriage.selected && !ruleFailed("MARRIAGE_MATCH"),
      detail: ruleMessage("MARRIAGE_MATCH") || (r.existingMarriage.selected ? "The linked marriage record can be annotated as dissolved." : "No marriage record is linked to update."),
    },
    {
      key: "SPOUSES_IDENTIFIED",
      label: "Both former spouses identified",
      passed: bothSpousesIdentified,
      detail: bothSpousesIdentified
        ? "Both former spouses' identities are confirmed."
        : `Former spouse 1: ${IDENTITY_MATCH_CONFIDENCE_LABELS[r.formerSpouse1.identityMatchConfidence].toLowerCase()}; former spouse 2: ${IDENTITY_MATCH_CONFIDENCE_LABELS[r.formerSpouse2.identityMatchConfidence].toLowerCase()}.`,
    },
    {
      key: "COURT_IDENTIFIED",
      label: "Court or authority identified",
      passed: !!r.judgment.courtOrAuthorityName && !!r.judgment.courtCaseNumber && !ruleFailed("COURT_REFERENCE"),
      detail: ruleMessage("COURT_REFERENCE") || (r.judgment.courtOrAuthorityName ? `${r.judgment.courtOrAuthorityName}, case ${r.judgment.courtCaseNumber}.` : "No court or authority recorded."),
    },
    {
      key: "JUDGMENT_NUMBER",
      label: "Judgment number verified",
      passed: !!r.judgment.judgmentNumber && !ruleFailed("JUDGMENT_NUMBER_DUPLICATE") && !ruleFailed("JUDGMENT_AUTHENTICITY_PLACEHOLDER"),
      detail: ruleMessage("JUDGMENT_NUMBER_DUPLICATE") || (r.judgment.judgmentNumber ? `Judgment ${r.judgment.judgmentNumber}.` : "No judgment number recorded."),
    },
    {
      key: "JUDGMENT_FINAL",
      label: "Judgment is final",
      passed: divorcePolicyConfig.finality.requireFinalityDateBeforeApproval ? isJudgmentFinalityValid(r.judgment.judgmentDate, r.judgment.finalityDate) : !!r.judgment.finalityDate,
      detail: r.judgment.finalityDate ? `Reported final on ${formatDate(r.judgment.finalityDate)}.` : "No finality date is recorded; a decision must be reported as final before it can be approved.",
    },
    {
      key: "EFFECTIVE_DATE",
      label: "Effective date verified",
      passed: effectiveDateValid,
      detail: effectiveDate ? `Effective ${formatDate(effectiveDate)}.` : "No registration effective date has been recorded yet.",
    },
    {
      key: "EVIDENCE_PRESENT",
      label: "Required evidence present",
      passed: missingDocs.length === 0,
      detail: missingDocs.length === 0 ? `All ${requiredDocs.length} required document(s) attached.` : `Missing: ${missingDocs.map((d) => d.replace(/_/g, " ").toLowerCase()).join(", ")}.`,
    },
    {
      key: "NO_DUPLICATE",
      label: "No duplicate divorce",
      passed: duplicate.overallLevel === "NONE" && duplicate.conflicts.length === 0,
      detail: duplicate.overallLevel === "NONE" && duplicate.conflicts.length === 0 ? "No duplicate registration or existing-divorce conflict found." : `Match level ${duplicate.overallLevel}; ${duplicate.candidates.length} candidate(s), ${duplicate.conflicts.length} conflict(s).`,
    },
    {
      key: "NO_ANNULMENT_CONFLICT",
      label: "No unresolved annulment or judicial-separation conflict",
      passed: !annulmentConflict,
      detail: annulmentConflict ? `${ruleMessage("POSSIBLE_ANNULMENT") || ""} ${ruleMessage("POSSIBLE_JUDICIAL_SEPARATION") || ""}`.trim() : "No annulment or judicial-separation conflict recorded.",
    },
    {
      key: "NO_CIVIL_STATUS_CONFLICT",
      label: "No unresolved civil-status conflict",
      passed: !civilStatusConflict,
      detail: civilStatusConflict ? `${ruleMessage("EXISTING_CIVIL_STATUS") || ""} ${ruleMessage("CONFLICTING_ACTIVE_MARRIAGE") || ""}`.trim() : "Both former spouses' recorded civil status is consistent with this divorce.",
    },
    {
      key: "JURISDICTION",
      label: "Jurisdiction confirmed",
      passed: jurisdictionOk,
      detail: jurisdictionOk
        ? `${r.processingOffice.selectedProcessingOfficeName} — ${r.processingOffice.jurisdictionResult.replace(/_/g, " ").toLowerCase()}.`
        : "This case is outside your assigned jurisdiction, or its jurisdiction is unresolved.",
    },
    {
      key: "FOREIGN_RESOLVED",
      label: "Foreign-decision requirements resolved",
      passed: foreignResolved,
      detail: !r.judgment.isForeign
        ? "Not a foreign decision — this requirement does not apply."
        : `Recognition status: ${FOREIGN_RECOGNITION_STATUS_LABELS[r.foreignRecognition.status].toLowerCase()}${
            r.foreignRecognition.missingRequirements.length > 0 ? `; still missing: ${r.foreignRecognition.missingRequirements.join(", ")}.` : "."
          }`,
    },
    {
      key: "APPLICANT_AUTHORIZED",
      label: "Applicant authorized",
      passed: applicantAuthorized,
      detail: applicantIsSpouse
        ? "The applicant is one of the former spouses."
        : r.applicant.authorizationBasis
        ? `Authorization basis recorded: ${r.applicant.authorizationBasis}`
        : "The applicant is not a former spouse and has recorded no authorization basis.",
    },
    {
      key: "MAKER_CHECKER",
      label: "Maker-checker rule satisfied",
      passed: coiReasons.length === 0,
      detail: coiReasons.length === 0 ? "You did not prepare this case and are not a party to it." : coiReasons.join(" "),
    },
    {
      key: "COI_DECLARED",
      label: "Conflict-of-interest declaration completed",
      passed: !!latestApproval?.confirmedNoConflictOfInterest,
      detail: latestApproval?.confirmedNoConflictOfInterest
        ? `Declared by ${latestApproval.decidedBy} on ${formatDateTime(latestApproval.decidedAt)}.`
        : "The declaration is made as part of the approval action and is recorded once approval is confirmed.",
    },
  ];
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function FormerSpouseFields({ spouse }: { spouse: FormerSpouse }) {
  return (
    <dl className="review-readonly-fields">
      <Field label="Name" value={formerSpouseDisplayName(spouse)} />
      <Field label="Sex" value={spouse.sex} />
      <Field label="Date of birth" value={formatDate(spouse.dateOfBirth)} />
      <Field label="Nationality" value={spouse.nationality || "—"} />
      <Field label="Document" value={`${(spouse.documentType || "NONE").replace(/_/g, " ")} · ${maskDocumentNumber(spouse.documentNumber)}`} />
      <Field label="NIN" value={maskDocumentNumber(spouse.nin)} />
      <Field label="Civil status on record" value={spouse.currentCivilStatus || "—"} />
      <Field label="Identity match confidence" value={IDENTITY_MATCH_CONFIDENCE_LABELS[spouse.identityMatchConfidence]} />
      <Field label="Identity verification" value={spouse.identityVerification.replace(/_/g, " ").toLowerCase()} />
      <Field label="Linked to selected marriage" value={spouse.linkedToSelectedMarriage ? "Yes" : "Not linked"} />
      <Field label="Phone" value={spouse.phone || "—"} />
      <Field label="Email" value={spouse.email || "—"} />
    </dl>
  );
}

/**
 * The Civil Registrar's divorce case workspace (spec §17). Sticky case
 * header plus twelve tabs, with every decision routed through a modal built
 * on the shared ConfirmActionModal / StructuredReasonModal primitives. Every
 * action is permission-gated and, where a gate would reject it, disabled
 * with the specific reason shown rather than hidden or silently broken.
 */
export default function DivorceReviewWorkspace() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();

  const currentAccountId = getCurrentAccountId();
  const actorName = getCurrentActorName();

  const canView = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_REGISTRATION_VIEW);
  const canReview = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_REGISTRATION_REVIEW);
  const canRequestCorrection = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_CORRECTION_REQUEST);
  const canApprovePermission = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_REGISTRATION_APPROVE);
  const canRejectPermission = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_REGISTRATION_REJECT);
  const canRegisterPermission = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_REGISTRATION_REGISTER);
  const canVerifyJudgment = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_JUDGMENT_VERIFY);
  const canForeignReview = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_FOREIGN_JUDGMENT_REVIEW);
  const canExceptionReview = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_EXCEPTION_REVIEW);
  const canViewSync = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_SDID_SYNC_VIEW);
  const canViewAudit = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_AUDIT_VIEW);

  const [registration, setRegistration] = useState<DivorceRegistration | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [auditEvents, setAuditEvents] = useState<DemoAuditEvent[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("OVERVIEW");

  const [showStart, setShowStart] = useState(false);
  const [showConflictLock, setShowConflictLock] = useState(false);
  const [showConflictOfInterest, setShowConflictOfInterest] = useState(false);
  const [showRequestCorrection, setShowRequestCorrection] = useState(false);
  const [showRequestEvidence, setShowRequestEvidence] = useState(false);
  const [showRouteJudgment, setShowRouteJudgment] = useState(false);
  const [showRouteForeign, setShowRouteForeign] = useState(false);
  const [showRouteException, setShowRouteException] = useState(false);
  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showRunVerification, setShowRunVerification] = useState(false);
  const [completeTarget, setCompleteTarget] = useState<DivorceRegistrationStatus | undefined>();
  const [previewTarget, setPreviewTarget] = useState<DivorceEvidence | undefined>();

  const coiShownRef = useRef(false);

  const load = useCallback(async () => {
    if (!caseId) {
      setLoading(false);
      setError("No divorce registration reference was provided.");
      return;
    }
    setLoading(true);
    setError(undefined);
    coiShownRef.current = false;
    try {
      const found = await demoGetDivorceRegistration(caseId);
      if (!found) {
        setError("This divorce registration was not found.");
        setRegistration(undefined);
        return;
      }
      setRegistration(found);
      if (canViewAudit) {
        const res = await demoListCrvsAuditEvents({ targetRef: found.reference, limit: 200 });
        setAuditEvents(res.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load this divorce registration.");
    } finally {
      setLoading(false);
    }
  }, [caseId, canViewAudit]);

  useEffect(() => {
    load();
  }, [load]);

  const coiReasons = useMemo(() => {
    if (!registration) return [] as string[];
    const reasons = divorceConflictOfInterestReasons(currentAccountId, registration);
    if (!canAccessDivorceCaseJurisdiction(registration.jurisdiction)) reasons.push("This registration is outside your assigned jurisdiction.");
    return reasons;
  }, [registration, currentAccountId]);

  useEffect(() => {
    if (registration && coiReasons.length > 0 && !coiShownRef.current) {
      coiShownRef.current = true;
      setShowConflictOfInterest(true);
    }
  }, [registration, coiReasons]);

  const checklist = useMemo(() => (registration ? buildChecklist(registration, currentAccountId, getDemoData().crvsDivorceRegistrations) : []), [registration, currentAccountId]);

  const handleSectionStatusChange = async (section: DivorceReviewSectionKey, status: ReviewSectionStatus) => {
    if (!registration) return;
    try {
      const updated = demoSetDivorceReviewSectionStatus(registration.id, section, status, actorName);
      setRegistration(updated);
    } catch (err) {
      toastMessage("error", err);
    }
  };

  const handleStartClick = () => {
    if (!registration) return;
    if (registration.reviewerId && registration.reviewerId !== currentAccountId) {
      setShowConflictLock(true);
      return;
    }
    setShowStart(true);
  };

  const handleConfirmStart = async () => {
    if (!registration || !currentAccountId) return;
    try {
      const updated = demoStartDivorceReview(registration.id, currentAccountId, actorName);
      setRegistration(updated);
      setShowStart(false);
      toastMessage("success", "You're now reviewing this registration.");
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
        <Empty icon="lock" title="You don't have access to this divorce registration" description="Reviewing a divorce registration requires divorce-registration-view access." isFullScreen />
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
          button={<Button text="Back to divorce review queue" appearance="ghost" type="button" onClick={() => navigate("/dashboard/crvs/divorce-review")} testId="dv-workspace-back" />}
        />
      </div>
    );
  }

  const r = registration;
  const sla = divorceSlaState(r);
  const evidence = activeEvidence(r.evidence);
  const isLate = isDivorceLateRegistration(r);
  const approvalGate = canApproveDivorceCase(currentAccountId, r);

  const isLockedByOther = !!r.reviewerId && r.reviewerId !== currentAccountId;
  const isMine = r.reviewerId === currentAccountId;
  const canStartHere = canTransitionDivorceRegistration(r.status, "UNDER_REVIEW");
  const canAct = isMine && !isLockedByOther;

  const openCorrection = r.correctionRequests.find((c) => !c.resolvedAt);

  const riskFlags: string[] = [];
  if (r.judgment.isForeign) riskFlags.push("Foreign decision");
  if (isLate) riskFlags.push("Late registration");
  if (r.exception?.status === "OPEN") riskFlags.push(`Exception: ${DIVORCE_EXCEPTION_TRIGGER_LABELS[r.exception.type]}`);
  if (openCorrection) riskFlags.push("Open correction");
  if (!checklist.find((c) => c.key === "NO_DUPLICATE")?.passed) riskFlags.push("Possible duplicate");

  // Each action's availability = permission AND legal transition AND case lock.
  const actionState = (permitted: boolean, permissionLabel: string, transitionOk: boolean, transitionLabel: string) => {
    if (!permitted) return { enabled: false, reason: permissionLabel };
    if (!canAct) return { enabled: false, reason: isLockedByOther ? `This case is locked to ${r.reviewerName || "another registrar"}.` : "Start the review to take action on this case." };
    if (!transitionOk) return { enabled: false, reason: transitionLabel };
    return { enabled: true, reason: "" };
  };

  const correctionAction = actionState(
    canRequestCorrection,
    "Requesting a correction requires divorce-correction-request access.",
    canTransitionDivorceRegistration(r.status, "CORRECTION_REQUIRED"),
    `A correction can't be requested while this case is ${DIVORCE_REGISTRATION_STATUS_LABELS[r.status].toLowerCase()}.`
  );
  const judgmentAction = actionState(
    canVerifyJudgment,
    "Routing for judgment verification requires divorce-judgment-verify access.",
    canTransitionDivorceRegistration(r.status, "JUDGMENT_VERIFICATION"),
    `Judgment verification isn't reachable while this case is ${DIVORCE_REGISTRATION_STATUS_LABELS[r.status].toLowerCase()}.`
  );
  const foreignAction = actionState(
    canForeignReview,
    "Routing for foreign-judgment review requires divorce-foreign-judgment-review access.",
    canTransitionDivorceRegistration(r.status, "FOREIGN_JUDGMENT_REVIEW"),
    `Foreign-judgment review isn't reachable while this case is ${DIVORCE_REGISTRATION_STATUS_LABELS[r.status].toLowerCase()}.`
  );
  const exceptionAction = actionState(
    canExceptionReview,
    "Routing for exception review requires divorce-exception-review access.",
    canTransitionDivorceRegistration(r.status, "EXCEPTION_REVIEW"),
    `Exception review isn't reachable while this case is ${DIVORCE_REGISTRATION_STATUS_LABELS[r.status].toLowerCase()}.`
  );
  const approveAction = (() => {
    const base = actionState(
      canApprovePermission,
      "Approving requires divorce-registration-approve access.",
      canTransitionDivorceRegistration(r.status, "APPROVED"),
      `This case can't be approved while it is ${DIVORCE_REGISTRATION_STATUS_LABELS[r.status].toLowerCase()}.`
    );
    if (!base.enabled) return base;
    if (!approvalGate.allowed) return { enabled: false, reason: approvalGate.reasons.join(" ") };
    return base;
  })();
  const rejectAction = actionState(
    canRejectPermission,
    "Rejecting requires divorce-registration-reject access.",
    canTransitionDivorceRegistration(r.status, "REJECTED"),
    `This case can't be rejected while it is ${DIVORCE_REGISTRATION_STATUS_LABELS[r.status].toLowerCase()}.`
  );
  const registerAction = (() => {
    if (!canRegisterPermission) return { enabled: false, reason: "Registering requires divorce-registration-register access." };
    if (r.status !== "APPROVED") return { enabled: false, reason: "A divorce can only be registered once the case has been approved." };
    return { enabled: true, reason: "" };
  })();

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

  const sectionCard = (section: DivorceReviewSectionKey, children: React.ReactNode) => (
    <SectionReviewCard
      title={DIVORCE_REVIEW_SECTION_LABELS[section]}
      status={r.reviewSections[section]}
      disabled={!canAct}
      onStatusChange={canReview ? (s) => handleSectionStatusChange(section, s) : undefined}
    >
      {children}
    </SectionReviewCard>
  );

  return (
    <div className="crvs-page">
      <div className="crvs-section review-case-header">
        <div>
          <h1 className="crvs-page-title">{r.reference}</h1>
          <div className="review-case-meta">
            <StatusBadge kind="divorceRegistration" status={r.status} />
            <span>{formerSpousesLabel(r)}</span>
            <span>Marriage {marriageReferenceLabel(r)}</span>
            <span>{r.reviewerName ? `Reviewer: ${r.reviewerName}` : "Unassigned"}</span>
            <span>{r.processingOffice.selectedProcessingOfficeName}</span>
            {r.status !== "REGISTERED" && r.status !== "REJECTED" && r.status !== "CANCELLED" && <span className={`crvs-status-pill crvs-status-${sla.tone}`}>{sla.label}</span>}
            {riskFlags.map((flag) => (
              <span key={flag} className="crvs-status-pill crvs-status-warning">
                {flag}
              </span>
            ))}
          </div>
        </div>
        {isLockedByOther ? (
          <div className="crvs-banner crvs-banner-warning">Locked by {r.reviewerName || "another registrar"} — read only.</div>
        ) : !isMine && canStartHere ? (
          <Button text="Start review" appearance="primary" type="button" disabled={!canReview} onClick={handleStartClick} testId="dv-workspace-start-review" />
        ) : null}
      </div>

      <div className="crvs-tabs" role="tablist">
        {TAB_META.map((tab) => (
          <button key={tab.key} type="button" role="tab" aria-selected={activeTab === tab.key} className={`crvs-tab ${activeTab === tab.key ? "is-active" : ""}`} onClick={() => setActiveTab(tab.key)}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="review-layout">
        <div className="review-main">
          {activeTab === "OVERVIEW" && (
            <section className="crvs-review-section">
              <h3 className="crvs-section-title">Overview</h3>
              <DescriptionList columns={3}>
                <DescriptionItem label="Status" value={DIVORCE_REGISTRATION_STATUS_LABELS[r.status]} />
                <DescriptionItem label="Source" value={DIVORCE_SOURCE_LABELS[r.source]} />
                <DescriptionItem label="Source notification" value={r.sourceNotificationReference} />
                <DescriptionItem label="Prepared by" value={r.officerName} />
                <DescriptionItem label="Reviewer" value={r.reviewerName || "Unassigned"} />
                <DescriptionItem label="Review locked at" value={r.reviewLockedAt ? formatDateTime(r.reviewLockedAt) : "Not locked"} />
                <DescriptionItem label="Processing office" value={r.processingOffice.selectedProcessingOfficeName} />
                <DescriptionItem label="Jurisdiction" value={r.jurisdiction} />
                <DescriptionItem label="Submitted" value={r.submittedAt ? formatDateTime(r.submittedAt) : "Not submitted"} />
              </DescriptionList>

              {openCorrection && (
                <div className="crvs-banner crvs-banner-warning" style={{ marginTop: 12 }}>
                  <Icon name="edit" />
                  <span>
                    Correction requested by {openCorrection.requestedBy} on {formatDateTime(openCorrection.requestedAt)}
                    {openCorrection.responseDeadline ? `, due ${formatDate(openCorrection.responseDeadline)}` : ""}: {openCorrection.items.map((i) => i.reason).join("; ")}
                  </span>
                </div>
              )}

              {r.exception && (
                <div className={`crvs-banner ${r.exception.status === "OPEN" ? "crvs-banner-warning" : "crvs-banner-info"}`} style={{ marginTop: 12 }}>
                  <strong>{DIVORCE_EXCEPTION_TRIGGER_LABELS[r.exception.type]}</strong> — {r.exception.reason}
                  {r.exception.resolution && (
                    <div className="crvs-form-hint">
                      Resolved as {r.exception.resolution.type} by {r.exception.resolution.resolvedBy} on {formatDateTime(r.exception.resolution.resolvedAt)}.
                    </div>
                  )}
                </div>
              )}

              <h3 className="crvs-section-title" style={{ marginTop: 16 }}>
                Decisions so far
              </h3>
              {r.reviewDecisions.length === 0 ? (
                <p className="crvs-form-hint">No review decisions recorded yet.</p>
              ) : (
                <div className="review-audit-list">
                  {r.reviewDecisions.map((d, i) => (
                    <div key={`${d.type}-${i}`} className="review-audit-item">
                      <strong>{d.type.replace(/_/g, " ")}</strong> by {d.decidedBy} — {formatDateTime(d.decidedAt)}
                      {d.reason && <div className="crvs-form-hint">{d.reason}</div>}
                      {d.note && <div className="crvs-form-hint">{d.note}</div>}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {activeTab === "APPLICANT" &&
            sectionCard(
              "APPLICANT",
              <dl className="review-readonly-fields">
                <Field label="Name" value={applicantDisplayName(r.applicant)} />
                <Field label="Relationship to case" value={DIVORCE_APPLICANT_RELATIONSHIP_LABELS[r.applicant.relationshipToCase]} />
                <Field label="Document" value={`${r.applicant.documentType.replace(/_/g, " ")} · ${maskDocumentNumber(r.applicant.documentNumber)}`} />
                <Field label="NIN" value={maskDocumentNumber(r.applicant.nin)} />
                <Field label="Date of birth" value={formatDate(r.applicant.dateOfBirth)} />
                <Field label="Nationality" value={r.applicant.nationality || "—"} />
                <Field label="Residence" value={r.applicant.residence || "—"} />
                <Field label="Phone" value={r.applicant.phone || "—"} />
                <Field label="Email" value={r.applicant.email || "—"} />
                <Field label="Identity verification" value={r.applicant.identityVerification.replace(/_/g, " ").toLowerCase()} />
                <Field label="Authorization basis" value={r.applicant.authorizationBasis || "Not required — the applicant is a former spouse"} />
              </dl>
            )}

          {activeTab === "EXISTING_MARRIAGE" &&
            sectionCard(
              "EXISTING_MARRIAGE",
              <>
                <dl className="review-readonly-fields">
                  <Field label="Match status" value={EXISTING_MARRIAGE_MATCH_LABELS[r.existingMarriage.status]} />
                  <Field label="Marriage number" value={marriageReferenceLabel(r)} />
                  <Field label="Marriage date" value={formatDate(r.existingMarriage.selected?.marriageDate)} />
                  <Field label="Marriage place" value={r.existingMarriage.selected?.marriagePlace || r.existingMarriage.selected?.officeName || "—"} />
                  <Field label="Spouses on the marriage record" value={r.existingMarriage.selected ? `${r.existingMarriage.selected.spouse1Name} & ${r.existingMarriage.selected.spouse2Name}` : "—"} />
                  <Field label="Searched" value={r.existingMarriage.searchedAt ? `${formatDateTime(r.existingMarriage.searchedAt)} by ${r.existingMarriage.searchedBy || "—"}` : "Not searched"} />
                </dl>
                {r.existingMarriage.candidates.length > 0 && (
                  <>
                    <h4 className="crvs-section-title" style={{ marginTop: 12 }}>
                      Candidates considered
                    </h4>
                    <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                      {r.existingMarriage.candidates.map((c) => (
                        <li key={c.registrationNumber} className={`crvs-banner ${r.existingMarriage.selected?.registrationNumber === c.registrationNumber ? "crvs-banner-info" : "crvs-banner-warning"}`}>
                          <strong>{c.registrationNumber}</strong> — {c.spouse1Name} &amp; {c.spouse2Name} · {c.matchConfidence} confidence
                          {r.existingMarriage.selected?.registrationNumber === c.registrationNumber ? " · selected" : ""}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                {r.existingMarriage.notFoundEvidence.length > 0 && (
                  <>
                    <h4 className="crvs-section-title" style={{ marginTop: 12 }}>
                      Marriage evidence provided instead
                    </h4>
                    <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                      {r.existingMarriage.notFoundEvidence.map((ev) => (
                        <li key={ev.id} className="crvs-banner crvs-banner-info">
                          <strong>{ev.documentType.replace(/_/g, " ")}</strong> — {ev.fileName} · {ev.verification.replace(/_/g, " ").toLowerCase()}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                {r.marriageStatusUpdate && (
                  <div className="crvs-banner crvs-banner-info" style={{ marginTop: 12 }}>
                    Marriage record {r.marriageStatusUpdate.marriageApplicationReference || "—"} was annotated as {r.marriageStatusUpdate.newStatus.replace(/_/g, " ").toLowerCase()} on{" "}
                    {formatDateTime(r.marriageStatusUpdate.updatedAt)}. The original marriage registration data is preserved.
                  </div>
                )}
              </>
            )}

          {activeTab === "FORMER_SPOUSE_1" && sectionCard("FORMER_SPOUSE_1", <FormerSpouseFields spouse={r.formerSpouse1} />)}
          {activeTab === "FORMER_SPOUSE_2" && sectionCard("FORMER_SPOUSE_2", <FormerSpouseFields spouse={r.formerSpouse2} />)}

          {activeTab === "COURT_DECISION" &&
            sectionCard(
              "COURT_DECISION",
              <>
                <dl className="review-readonly-fields">
                  <Field label="Country" value={r.judgment.country || "—"} />
                  <Field label="Court or authority" value={r.judgment.courtOrAuthorityName || "—"} />
                  <Field label="Court case number" value={r.judgment.courtCaseNumber || "—"} />
                  <Field label="Judgment number" value={r.judgment.judgmentNumber || "—"} />
                  <Field label="Judgment date" value={formatDate(r.judgment.judgmentDate)} />
                  <Field label="Final on" value={r.judgment.finalityDate ? formatDate(r.judgment.finalityDate) : "Not reported"} />
                  <Field label="Decision type" value={DIVORCE_DECISION_TYPE_LABELS[r.judgment.decisionType]} />
                  <Field label="Effective date" value={formatDate(r.judgment.registrationEffectiveDate)} />
                  <Field label="Court registry reference" value={r.judgment.courtRegistryReference || "—"} />
                  <Field label="Verification source" value={r.judgment.verificationSource || "—"} />
                  <Field label="Foreign decision" value={r.judgment.isForeign ? "Yes" : "No"} />
                  <Field label="Notes for staff" value={r.judgment.notesForStaff || "—"} />
                </dl>
                {r.judgment.isForeign && (
                  <div className="crvs-banner crvs-banner-warning" style={{ marginTop: 12 }}>
                    <Icon name="public" />
                    <span>
                      Foreign decision — recognition status is {FOREIGN_RECOGNITION_STATUS_LABELS[r.foreignRecognition.status].toLowerCase()}.{" "}
                      <Button text="Open foreign-decision review" size="sm" appearance="ghost" type="button" onClick={() => navigate(`/dashboard/crvs/foreign-divorces/${r.id}`)} testId="dv-workspace-open-foreign" />
                    </span>
                  </div>
                )}
              </>
            )}

          {activeTab === "EVIDENCE" &&
            sectionCard(
              "EVIDENCE",
              evidence.length === 0 ? (
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
                      <Button text="Preview" size="sm" appearance="ghost" type="button" onClick={() => setPreviewTarget(ev)} testId={`dv-workspace-preview-${ev.id}`} />
                    </li>
                  ))}
                </ul>
              )
            )}

          {activeTab === "VERIFICATION" && (
            <section className="crvs-review-section">
              <div className="crvs-review-section-header">
                <h3 className="crvs-section-title" style={{ margin: 0 }}>
                  Judgment verification
                </h3>
                <StatusBadge kind="divorceJudgmentVerification" status={r.judgmentVerification.status} />
              </div>
              <p className="crvs-form-hint">
                {r.judgmentVerification.checkedAt
                  ? `Last run ${formatDateTime(r.judgmentVerification.checkedAt)} by ${r.judgmentVerification.checkedBy || "—"} · overall outcome ${r.judgmentVerification.overallOutcome || "not recorded"}.`
                  : "Verification has not been run for this case yet."}
              </p>

              {r.judgmentVerification.results.length === 0 ? (
                <p className="crvs-form-hint">No rule results recorded. Run verification to evaluate every rule separately.</p>
              ) : (
                <ul style={{ listStyle: "none", margin: "8px 0 0", padding: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                  {r.judgmentVerification.results.map((result) => (
                    <li key={result.rule} className={`crvs-banner ${result.passed ? "crvs-banner-info" : result.severity === "BLOCKING" ? "crvs-banner-danger" : "crvs-banner-warning"}`}>
                      <span className={`crvs-status-pill crvs-status-${result.passed ? "success" : result.severity === "BLOCKING" ? "danger" : "warning"} crvs-status-icon-label`}>
                        <Icon name={result.passed ? "check_circle" : "cancel"} />
                        {result.passed ? "Pass" : result.severity === "BLOCKING" ? "Blocking" : "Review"}
                      </span>{" "}
                      <strong>{JUDGMENT_VERIFICATION_RULE_LABELS[result.rule] || result.rule.replace(/_/g, " ")}</strong> — {result.message}
                    </li>
                  ))}
                </ul>
              )}

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                <Button
                  text="Run judgment verification"
                  appearance="primary"
                  type="button"
                  disabled={!canVerifyJudgment}
                  onClick={() => setShowRunVerification(true)}
                  testId="dv-workspace-run-verification"
                />
                {r.status === "JUDGMENT_VERIFICATION" &&
                  (["UNDER_REVIEW", "CORRECTION_REQUIRED", "FOREIGN_JUDGMENT_REVIEW", "EXCEPTION_REVIEW", "REJECTED"] as DivorceRegistrationStatus[])
                    .filter((next) => canTransitionDivorceRegistration(r.status, next))
                    .map((next) => (
                      <Button
                        key={next}
                        text={`Complete — ${DIVORCE_REGISTRATION_STATUS_LABELS[next].toLowerCase()}`}
                        appearance="ghost"
                        color={next === "REJECTED" ? "red" : undefined}
                        type="button"
                        disabled={!canVerifyJudgment}
                        onClick={() => setCompleteTarget(next)}
                        testId={`dv-workspace-complete-verification-${next}`}
                      />
                    ))}
              </div>
              {!canVerifyJudgment && <p className="crvs-form-hint">Running or completing judgment verification requires divorce-judgment-verify access.</p>}
              {canVerifyJudgment && r.status !== "JUDGMENT_VERIFICATION" && (
                <p className="crvs-form-hint">Completing verification is only available while the case is in judgment verification.</p>
              )}
            </section>
          )}

          {activeTab === "REVIEW" && (
            <section className="crvs-review-section">
              <h3 className="crvs-section-title">Review checklist</h3>
              <p className="crvs-form-hint">
                Every requirement is shown separately with its own result — this is never collapsed into a single &ldquo;verified&rdquo; badge. Unmet items must be resolved or explicitly routed before the
                case can be approved.
              </p>
              <ul style={{ listStyle: "none", margin: "12px 0 0", padding: 0, display: "flex", flexDirection: "column", gap: 10 }} data-testid="divorce-review-checklist">
                {checklist.map((item) => (
                  <li key={item.key} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <span className={`crvs-status-pill ${item.passed ? "crvs-status-success" : "crvs-status-danger"} crvs-status-icon-label`} style={{ flexShrink: 0 }}>
                      <Icon name={item.passed ? "check_circle" : "cancel"} />
                      {item.passed ? "Pass" : "Not met"}
                    </span>
                    <span>
                      <strong style={{ color: item.passed ? "var(--text-primary)" : "var(--status-danger)" }}>{item.label}</strong>
                      <div className="crvs-form-hint">{item.detail}</div>
                    </span>
                  </li>
                ))}
              </ul>

              <h3 className="crvs-section-title" style={{ marginTop: 20 }}>
                Section review states
              </h3>
              <DescriptionList columns={3}>
                {(Object.keys(DIVORCE_REVIEW_SECTION_LABELS) as DivorceReviewSectionKey[]).map((key) => (
                  <DescriptionItem key={key} label={DIVORCE_REVIEW_SECTION_LABELS[key]} value={r.reviewSections[key].replace(/_/g, " ").toLowerCase()} />
                ))}
              </DescriptionList>
            </section>
          )}

          {activeTab === "SDID" && (
            <section className="crvs-review-section">
              {!canViewSync ? (
                <Empty icon="lock" title="You don't have access to synchronization details" description="Viewing SDID synchronization requires divorce-sdid-sync-view access." />
              ) : (
                <>
                  <div className="crvs-review-section-header">
                    <h3 className="crvs-section-title" style={{ margin: 0 }}>
                      SDID synchronization
                    </h3>
                    <StatusBadge kind="divorceSync" status={r.sdid.status} />
                  </div>
                  <p className="crvs-form-hint">
                    Each former spouse&apos;s identity is synchronized independently — one spouse&apos;s outcome never affects the other&apos;s. Synchronization only starts after the divorce is registered.
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12, marginTop: 12 }}>
                    {([
                      { key: "spouse1" as const, label: "Former spouse 1", spouse: r.formerSpouse1 },
                      { key: "spouse2" as const, label: "Former spouse 2", spouse: r.formerSpouse2 },
                    ]).map(({ key, label, spouse }) => {
                      const sub = r.sdid[key];
                      return (
                        <div key={key} className="crvs-review-section">
                          <div className="crvs-review-section-header">
                            <strong>{label}</strong>
                            <span className={`crvs-status-pill crvs-status-${sub.status === "IDENTITY_UPDATED" ? "success" : sub.status === "FAILED" ? "danger" : sub.status === "MANUAL_REVIEW" ? "warning" : "info"}`}>
                              {DIVORCE_SPOUSE_SYNC_STATUS_LABELS[sub.status]}
                            </span>
                          </div>
                          <p className="crvs-form-hint">{formerSpouseDisplayName(spouse)}</p>
                          <DescriptionList columns={2}>
                            <DescriptionItem label="Last attempt" value={sub.lastAttemptAt ? formatDateTime(sub.lastAttemptAt) : "—"} />
                            <DescriptionItem label="Attempts" value={String(sub.attempts.length)} />
                            <DescriptionItem label="Linked NIN" value={sub.status === "IDENTITY_UPDATED" ? sub.linkedNin : undefined} />
                            <DescriptionItem label="Last failure code" value={sub.lastFailureCode} />
                          </DescriptionList>
                        </div>
                      );
                    })}
                  </div>
                  <div className="crvs-banner crvs-banner-info" style={{ marginTop: 12 }}>
                    Relationship dissolved on both identities: <strong>{r.sdid.relationshipDissolved ? "Yes" : "Not yet"}</strong>.
                  </div>
                  {r.status === "REGISTERED" && (
                    <div style={{ marginTop: 12 }}>
                      <Button text="Manage synchronization" appearance="ghost" type="button" onClick={() => navigate(`/dashboard/crvs/registered-divorces/${r.id}`)} testId="dv-workspace-manage-sync" />
                    </div>
                  )}
                </>
              )}
            </section>
          )}

          {activeTab === "TIMELINE" && (
            <section className="crvs-review-section">
              <h3 className="crvs-section-title">Timeline</h3>
              <div className="crvs-timeline">
                {r.statusHistory.map((entry, i) => (
                  <span key={`${entry.status}-${i}`} className="crvs-timeline-item is-reached">
                    <span className="crvs-timeline-dot" />
                    {DIVORCE_REGISTRATION_STATUS_LABELS[entry.status]} · {formatDateTime(entry.at)} · {entry.by}
                    {entry.note ? ` — ${entry.note}` : ""}
                  </span>
                ))}
              </div>
            </section>
          )}

          {activeTab === "AUDIT" && (
            <section className="crvs-review-section">
              <h3 className="crvs-section-title">Audit history</h3>
              {!canViewAudit ? (
                <Empty icon="lock" title="You don't have access to audit history" description="Viewing the divorce audit trail requires divorce-audit-view access." />
              ) : auditEvents.length === 0 ? (
                <p className="crvs-form-hint">No audit events recorded for this registration yet.</p>
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

        <aside className="review-action-rail" id="divorce-review-action-rail">
          <h3>Decision</h3>
          {isLockedByOther && <div className="crvs-banner crvs-banner-warning">This case is locked to {r.reviewerName || "another registrar"}. You can preview it but can&apos;t take action.</div>}
          {!isLockedByOther && !isMine && canStartHere && (
            <Button text="Start review" appearance="primary" block type="button" disabled={!canReview} onClick={handleStartClick} testId="dv-rail-start-review" />
          )}

          <ActionButton label="Request correction" state={correctionAction} onClick={() => setShowRequestCorrection(true)} testId="dv-rail-request-correction" />
          <ActionButton label="Request additional evidence" state={correctionAction} onClick={() => setShowRequestEvidence(true)} testId="dv-rail-request-evidence" />
          <ActionButton label="Route to judgment verification" state={judgmentAction} onClick={() => setShowRouteJudgment(true)} testId="dv-rail-route-judgment" />
          <ActionButton label="Route to foreign-judgment review" state={foreignAction} onClick={() => setShowRouteForeign(true)} testId="dv-rail-route-foreign" />
          <ActionButton label="Route to exception review" state={exceptionAction} onClick={() => setShowRouteException(true)} testId="dv-rail-route-exception" />
          <ActionButton label="Approve" state={approveAction} appearance="primary" onClick={() => setShowApprove(true)} testId="dv-rail-approve" />
          <ActionButton label="Reject" state={rejectAction} appearance="ghost" color="red" onClick={() => setShowReject(true)} testId="dv-rail-reject" />
          {r.status === "APPROVED" && <ActionButton label="Register divorce" state={registerAction} appearance="primary" onClick={() => setShowRegister(true)} testId="dv-rail-register" />}

          {r.status === "REGISTERED" && (
            <>
              <div className="crvs-banner crvs-banner-info">This divorce is registered. The record is read-only.</div>
              <Button text="Open registered record" appearance="ghost" block type="button" onClick={() => navigate(`/dashboard/crvs/registered-divorces/${r.id}`)} testId="dv-rail-open-registered" />
            </>
          )}
        </aside>
      </div>

      <StartDivorceReviewModal show={showStart} onClose={() => setShowStart(false)} registration={r} onConfirm={handleConfirmStart} />
      <ActiveDivorceReviewConflictModal show={showConflictLock} onClose={() => setShowConflictLock(false)} registration={r} />
      <DivorceConflictOfInterestModal show={showConflictOfInterest} onClose={() => setShowConflictOfInterest(false)} reasons={coiReasons} />

      <RequestDivorceCorrectionModal
        show={showRequestCorrection}
        onClose={() => setShowRequestCorrection(false)}
        registration={r}
        actorName={actorName}
        mode="CORRECTION"
        onRequested={(updated) => {
          setRegistration(updated);
          setShowRequestCorrection(false);
        }}
      />
      <RequestDivorceCorrectionModal
        show={showRequestEvidence}
        onClose={() => setShowRequestEvidence(false)}
        registration={r}
        actorName={actorName}
        mode="EVIDENCE"
        onRequested={(updated) => {
          setRegistration(updated);
          setShowRequestEvidence(false);
        }}
      />

      <RouteToJudgmentVerificationModal show={showRouteJudgment} onClose={() => setShowRouteJudgment(false)} registration={r} actorName={actorName} onRouted={setRegistration} />
      <RouteToForeignReviewModal show={showRouteForeign} onClose={() => setShowRouteForeign(false)} registration={r} actorName={actorName} onRouted={setRegistration} />
      <RouteToDivorceExceptionModal show={showRouteException} onClose={() => setShowRouteException(false)} registration={r} actorName={actorName} onRouted={setRegistration} />

      {currentAccountId && (
        <>
          <ApproveDivorceRegistrationModal show={showApprove} onClose={() => setShowApprove(false)} registration={r} accountId={currentAccountId} actorName={actorName} onApproved={setRegistration} />
          <RejectDivorceRegistrationModal show={showReject} onClose={() => setShowReject(false)} registration={r} accountId={currentAccountId} actorName={actorName} onRejected={setRegistration} />
          <RegisterDivorceModal show={showRegister} onClose={() => setShowRegister(false)} registration={r} accountId={currentAccountId} actorName={actorName} onRegistered={setRegistration} />
        </>
      )}

      <RunJudgmentVerificationModal show={showRunVerification} onClose={() => setShowRunVerification(false)} registration={r} actorName={actorName} onRun={setRegistration} />
      <CompleteJudgmentVerificationModal
        show={!!completeTarget}
        onClose={() => setCompleteTarget(undefined)}
        registration={r}
        nextStatus={completeTarget}
        actorName={actorName}
        onCompleted={(updated) => {
          setCompleteTarget(undefined);
          setRegistration(updated);
        }}
      />

      <DocumentPreviewModal show={!!previewTarget} onClose={() => setPreviewTarget(undefined)} evidence={previewTarget} />
    </div>
  );
}
