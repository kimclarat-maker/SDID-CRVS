import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SectionReviewCard from "../../components/SectionReviewCard";
import StatusBadge from "../../components/StatusBadge";
import AnnulmentStatusPill, { MARRIAGE_CIVIL_STATUS_LABELS } from "../components/AnnulmentStatusPill";
import AffectedPartyPanel from "../components/AffectedPartyPanel";
import Button from "@/components/button";
import Empty from "@/components/empty";
import Icon from "@/components/icon";
import { DescriptionList, DescriptionItem } from "@/components/descriptionList";
import DocumentPreviewModal from "@/components/crvs/modals/DocumentPreviewModal";
import {
  AnnulmentEvidence,
  AnnulmentRegistration,
  AnnulmentRegistrationStatus,
  AnnulmentReviewSectionKey,
  ReviewSectionStatus,
  VerificationState,
} from "@/domain/crvs/types";
import {
  demoGetAnnulmentRegistration,
  demoSetAnnulmentReviewSectionStatus,
  demoStartAnnulmentReview,
  demoUpdateAnnulmentRegistrationDraft,
  isAnnulmentLateRegistration,
} from "@/demo/services/crvsAnnulmentRegistrations";
import { demoRetryAnnulmentSdidSync, demoRetryAllFailedAnnulmentSdidSync } from "@/demo/services/crvsAnnulmentSdidSync";
import { demoListCrvsAuditEvents } from "@/demo/services/crvsAudit";
import { getDemoData } from "@/demo/storage/demoStore";
import { DemoAuditEvent } from "@/demo/types";
import {
  canTransitionAnnulmentRegistration,
  ANNULMENT_REGISTRATION_STATUS_LABELS,
  ANNULMENT_PARTY_SYNC_STATUS_LABELS,
} from "@/domain/crvs/statusMachines";
import { canAccessAnnulmentCaseJurisdiction, canApproveAnnulmentCase, annulmentConflictOfInterestReasons } from "@/utils/workspace/crvsRules";
import {
  ANNULMENT_EXCEPTION_TRIGGER_LABELS,
  annulmentPolicyConfig,
  isDecisionFinalityValid,
  isRestrictedAnnulmentDocumentCategory,
  requiredDocumentsFor,
} from "@/domain/crvs/annulmentPolicyConfig";
import {
  findAnnulmentDuplicateCandidates,
  findExistingAnnulmentConflicts,
  findExistingDivorceConflictForMarriage,
  findJudicialSeparationOrCorrectionFlags,
  overallAnnulmentMatchLevel,
} from "@/domain/crvs/annulmentDuplicateDetection";
import { deriveMarriageCivilStatus } from "@/domain/crvs/marriageCivilStatus";
import { getCurrentAccountId, getCurrentActorName, hasWorkspacePermission } from "@/utils/workspace";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import toastMessage from "@/utils/common/toastMessage";
import {
  activeEvidence,
  affectedPartiesLabel,
  affectedPartyDisplayName,
  applicantDisplayName,
  ANNULMENT_APPLICANT_RELATIONSHIP_LABELS,
  ANNULMENT_DECISION_TYPE_LABELS,
  ANNULMENT_REVIEW_SECTION_LABELS,
  ANNULMENT_SOURCE_LABELS,
  DECISION_VERIFICATION_RULE_LABELS,
  DOCUMENT_TYPE_LABELS,
  EXISTING_MARRIAGE_MATCH_LABELS,
  FOREIGN_RECOGNITION_STATUS_LABELS,
  LEGAL_EFFECT_CLASSIFICATION_LABELS,
  annulmentSlaState,
  formatDate,
  formatDateTime,
  marriageReferenceLabel,
  maskDocumentNumber,
} from "../../annulmentShared";
import { ActiveAnnulmentReviewConflictModal, StartAnnulmentReviewModal } from "../components/modals/StartAnnulmentReviewModal";
import ConflictOfInterestBlockedModal from "../components/modals/ConflictOfInterestBlockedModal";
import MakerCheckerBlockedModal from "../components/modals/MakerCheckerBlockedModal";
import RequestAnnulmentCorrectionModal from "../components/modals/RequestAnnulmentCorrectionModal";
import RequestAnnulmentEvidenceModal from "../components/modals/RequestAnnulmentEvidenceModal";
import {
  RouteToAnnulmentDecisionVerificationModal,
  RouteToAnnulmentExceptionModal,
  RouteToAnnulmentForeignReviewModal,
  RouteToAnnulmentLegalEffectReviewModal,
} from "../components/modals/RouteAnnulmentModals";
import ApproveAnnulmentRegistrationModal from "../components/modals/ApproveAnnulmentRegistrationModal";
import RejectAnnulmentRegistrationModal from "../components/modals/RejectAnnulmentRegistrationModal";
import RegisterAnnulmentModal from "../components/modals/RegisterAnnulmentModal";
import { CompleteAnnulmentDecisionVerificationModal, RunAnnulmentDecisionVerificationModal } from "../components/modals/DecisionVerificationModals";
import SelectLegalEffectClassificationModal from "../components/modals/SelectLegalEffectClassificationModal";
import LegalEffectManualReviewModal from "../components/modals/LegalEffectManualReviewModal";
import ConfirmEffectiveDateModal from "../components/modals/ConfirmEffectiveDateModal";
import ExistingDivorceConflictModal from "../components/modals/ExistingDivorceConflictModal";
import ExistingJudicialSeparationConflictModal from "../components/modals/ExistingJudicialSeparationConflictModal";
import MarriageCorrectionConflictModal from "../components/modals/MarriageCorrectionConflictModal";
import "../../shared.css";
import "../../review/review.css";

type TabKey =
  | "OVERVIEW"
  | "APPLICANT"
  | "EXISTING_MARRIAGE"
  | "FIRST_PARTY"
  | "SECOND_PARTY"
  | "DECISION"
  | "EVIDENCE"
  | "VERIFICATION"
  | "LEGAL_EFFECT"
  | "REVIEW"
  | "SDID"
  | "TIMELINE"
  | "AUDIT";

const TAB_META: { key: TabKey; label: string }[] = [
  { key: "OVERVIEW", label: "Overview" },
  { key: "APPLICANT", label: "Applicant" },
  { key: "EXISTING_MARRIAGE", label: "Existing marriage" },
  { key: "FIRST_PARTY", label: "Affected party one" },
  { key: "SECOND_PARTY", label: "Affected party two" },
  { key: "DECISION", label: "Decision" },
  { key: "EVIDENCE", label: "Evidence" },
  { key: "VERIFICATION", label: "Verification" },
  { key: "LEGAL_EFFECT", label: "Legal effect" },
  { key: "REVIEW", label: "Review" },
  { key: "SDID", label: "SDID synchronization" },
  { key: "TIMELINE", label: "Timeline" },
  { key: "AUDIT", label: "Audit" },
];

type ChecklistItem = { key: string; label: string; passed: boolean; detail: string };

/**
 * Builds the full review checklist (spec §18) — every requirement is a
 * separate pass/fail line with its own explanation, never collapsed into a
 * single "verified" badge. Thresholds/requirements come from
 * annulmentPolicyConfig; the maker-checker and conflict-of-interest lines
 * come from canApproveAnnulmentCase()/annulmentConflictOfInterestReasons() so
 * the checklist can never disagree with the gate that actually blocks
 * approval.
 */
function buildAnnulmentChecklist(registration: AnnulmentRegistration, accountId: string | undefined, db: ReturnType<typeof getDemoData>): ChecklistItem[] {
  const r = registration;
  const applicantIsParty = r.applicant.relationshipToCase === "AFFECTED_PARTY_1" || r.applicant.relationshipToCase === "AFFECTED_PARTY_2" || r.applicant.relationshipToCase === "BOTH_AFFECTED_PARTIES";
  const evidence = activeEvidence(r.evidence);
  const requiredDocs = requiredDocumentsFor({ applicantIsParty, isForeign: r.decision.isForeign });
  const missingDocs = requiredDocs.filter((doc) => !evidence.some((e) => e.documentType === doc));

  const marriageId = r.existingMarriage.selected?.marriageApplicationId;
  const marriage = marriageId ? db.crvsMarriageApplications.find((m) => m.id === marriageId) : undefined;
  const duplicateCandidates = findAnnulmentDuplicateCandidates(
    { marriageApplicationId: marriageId, courtCaseNumber: r.decision.courtCaseNumber, decisionNumber: r.decision.decisionNumber },
    db.crvsAnnulmentRegistrations,
    r.id
  );
  const duplicateLevel = overallAnnulmentMatchLevel(duplicateCandidates);
  const conflictingAnnulments = findExistingAnnulmentConflicts(marriageId, db.crvsAnnulmentRegistrations, r.id);
  const divorceConflicts = findExistingDivorceConflictForMarriage(marriageId, db.crvsDivorceRegistrations);
  const separationOrCorrection = findJudicialSeparationOrCorrectionFlags(marriage);

  const coiReasons = annulmentConflictOfInterestReasons(accountId, r);
  const verificationResults = r.decisionVerification.results;
  const ruleFailed = (rule: string) => verificationResults.some((v) => v.rule === rule && !v.passed);
  const ruleMessage = (rule: string) => verificationResults.find((v) => v.rule === rule)?.message;

  const bothPartiesIdentified =
    r.affectedParty1.identityMatchConfidence === "CONFIRMED" &&
    r.affectedParty2.identityMatchConfidence === "CONFIRMED" &&
    !!r.affectedParty1.firstName &&
    !!r.affectedParty2.firstName;

  const decisionFinal = annulmentPolicyConfig.finality.requireFinalityDateBeforeApproval
    ? isDecisionFinalityValid(r.decision.decisionDate, r.decision.finalityDate)
    : !!r.decision.finalityDate;

  const effectiveDate = r.legalEffect.effectiveDate || r.decision.effectiveDate;
  const effectiveDateValid = !!effectiveDate && (!r.decision.decisionDate || effectiveDate.slice(0, 10) >= r.decision.decisionDate.slice(0, 10));
  const applicantAuthorized = applicantIsParty || !!r.applicant.authorizationBasis?.trim();
  const jurisdictionOk = canAccessAnnulmentCaseJurisdiction(r.jurisdiction) && r.processingOffice.jurisdictionResult !== "UNRESOLVED";
  const foreignResolved = !r.decision.isForeign || r.foreignRecognition.status === "REQUIREMENTS_SATISFIED";
  const latestApproval = [...r.reviewDecisions].reverse().find((d) => d.type === "APPROVE");
  const sdidRelationshipReviewed = r.affectedParty1.linkedToSelectedMarriage && r.affectedParty2.linkedToSelectedMarriage;
  const certificateResolved = r.legalEffect.certificateConsequence !== "MANUAL_REVIEW";

  return [
    {
      key: "MARRIAGE_IDENTIFIED",
      label: "Existing marriage identified",
      passed: r.existingMarriage.status === "MATCHED" && !!r.existingMarriage.selected,
      detail: r.existingMarriage.selected ? `Linked to ${r.existingMarriage.selected.registrationNumber}.` : `Match status is ${EXISTING_MARRIAGE_MATCH_LABELS[r.existingMarriage.status].toLowerCase()}.`,
    },
    {
      key: "PARTIES_IDENTIFIED",
      label: "Both affected parties identified",
      passed: bothPartiesIdentified,
      detail: bothPartiesIdentified
        ? "Both affected parties' identities are confirmed."
        : `Affected party 1: ${r.affectedParty1.identityMatchConfidence.toLowerCase()}; affected party 2: ${r.affectedParty2.identityMatchConfidence.toLowerCase()}.`,
    },
    {
      key: "DECISION_RELATES_TO_MARRIAGE",
      label: "Decision relates to the selected marriage",
      passed: !!r.existingMarriage.selected && !ruleFailed("MARRIAGE_MATCH"),
      detail: ruleMessage("MARRIAGE_MATCH") || (r.existingMarriage.selected ? "The decision matches the linked marriage record." : "No marriage record is linked to match against."),
    },
    {
      key: "COURT_AUTHORITY_IDENTIFIED",
      label: "Court or authority identified",
      passed: !!r.decision.courtOrAuthorityName && !!r.decision.courtCaseNumber && !ruleFailed("COURT_REFERENCE"),
      detail: ruleMessage("COURT_REFERENCE") || (r.decision.courtOrAuthorityName ? `${r.decision.courtOrAuthorityName}, case ${r.decision.courtCaseNumber}.` : "No court or authority recorded."),
    },
    {
      key: "CASE_DECISION_NUMBERS_VERIFIED",
      label: "Case and decision numbers verified",
      passed: !!r.decision.decisionNumber && !ruleFailed("DECISION_NUMBER_DUPLICATE") && !ruleFailed("COURT_REFERENCE_DUPLICATE"),
      detail: ruleMessage("DECISION_NUMBER_DUPLICATE") || ruleMessage("COURT_REFERENCE_DUPLICATE") || (r.decision.decisionNumber ? `Decision ${r.decision.decisionNumber}.` : "No decision number recorded."),
    },
    {
      key: "DECISION_FINAL",
      label: "Decision is final",
      passed: decisionFinal,
      detail: r.decision.finalityDate ? `Reported final on ${formatDate(r.decision.finalityDate)}.` : "No finality date is recorded; a decision must be reported as final before it can be approved.",
    },
    {
      key: "EFFECTIVE_DATE",
      label: "Effective date verified",
      passed: effectiveDateValid,
      detail: effectiveDate ? `Effective ${formatDate(effectiveDate)}.` : "No confirmed effective date has been recorded yet.",
    },
    {
      key: "LEGAL_EFFECT_WORDING_REVIEWED",
      label: "Legal-effect wording reviewed",
      passed: !!r.legalEffect.wordingFromDecision,
      detail: r.legalEffect.wordingFromDecision ? "Wording from the decision has been captured for classification." : "No legal-effect wording has been captured from the decision yet.",
    },
    {
      key: "LEGAL_EFFECT_CLASSIFICATION_SUPPORTED",
      label: "Legal-effect classification supported",
      passed: !!r.legalEffect.confirmedClassification,
      detail: r.legalEffect.confirmedClassification
        ? `Confirmed: ${LEGAL_EFFECT_CLASSIFICATION_LABELS[r.legalEffect.confirmedClassification]}${r.legalEffect.supportingEvidenceRef ? `, supported by ${r.legalEffect.supportingEvidenceRef}` : ""}.`
        : "No legal-effect classification has been confirmed yet.",
    },
    {
      key: "EVIDENCE_PRESENT",
      label: "Required evidence present",
      passed: missingDocs.length === 0,
      detail: missingDocs.length === 0 ? `All ${requiredDocs.length} required document(s) attached.` : `Missing: ${missingDocs.map((d) => d.replace(/_/g, " ").toLowerCase()).join(", ")}.`,
    },
    {
      key: "APPLICANT_AUTHORIZED",
      label: "Applicant authorized",
      passed: applicantAuthorized,
      detail: applicantIsParty
        ? "The applicant is one of the affected parties."
        : r.applicant.authorizationBasis
        ? `Authorization basis recorded: ${r.applicant.authorizationBasis}`
        : "The applicant is not an affected party and has recorded no authorization basis.",
    },
    {
      key: "NO_DUPLICATE",
      label: "No duplicate annulment",
      passed: duplicateLevel === "NONE" && conflictingAnnulments.length === 0,
      detail: duplicateLevel === "NONE" && conflictingAnnulments.length === 0 ? "No duplicate registration or existing-annulment conflict found." : `Match level ${duplicateLevel}; ${duplicateCandidates.length} candidate(s), ${conflictingAnnulments.length} conflict(s).`,
    },
    {
      key: "NO_DIVORCE_CONFLICT",
      label: "No unresolved divorce conflict",
      passed: divorceConflicts.length === 0,
      detail: divorceConflicts.length === 0 ? "No registered divorce found against this marriage." : `Registered divorce found: ${divorceConflicts.map((c) => c.reference).join(", ")}.`,
    },
    {
      key: "NO_SEPARATION_CONFLICT",
      label: "No unresolved judicial-separation conflict",
      passed: !separationOrCorrection.judicialSeparation,
      detail: separationOrCorrection.judicialSeparation ? "This marriage is recorded as judicially separated." : "No judicial-separation marker found on this marriage.",
    },
    {
      key: "NO_MARRIAGE_CORRECTION",
      label: "No unresolved marriage correction",
      passed: !separationOrCorrection.correctionPending,
      detail: separationOrCorrection.correctionPending ? "This marriage has a correction pending." : "No correction is pending on this marriage.",
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
      detail: !r.decision.isForeign
        ? "Not a foreign decision — this requirement does not apply."
        : `Recognition status: ${FOREIGN_RECOGNITION_STATUS_LABELS[r.foreignRecognition.status].toLowerCase()}${
            r.foreignRecognition.missingRequirements.length > 0 ? `; still missing: ${r.foreignRecognition.missingRequirements.join(", ")}.` : "."
          }`,
    },
    {
      key: "SDID_RELATIONSHIP_REVIEWED",
      label: "SDID relationship reviewed",
      passed: sdidRelationshipReviewed,
      detail: sdidRelationshipReviewed ? "Both affected parties are linked to the selected marriage's SDID relationship." : "One or both affected parties are not yet linked to the selected marriage.",
    },
    {
      key: "CERTIFICATE_CONSEQUENCES_REVIEWED",
      label: "Certificate consequences reviewed",
      passed: certificateResolved,
      detail: certificateResolved
        ? `Existing marriage certificate consequence: ${r.legalEffect.certificateConsequence.replace(/_/g, " ").toLowerCase()}.`
        : "The existing marriage certificate consequence requires manual review before approval.",
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

/**
 * The Civil Registrar's marriage-annulment case workspace (spec §18) —
 * structural template copied from divorceReview/workspace/index.tsx (the
 * hand-rolled role="tablist" pattern, sticky case header, review-layout main
 * + action rail), extended with one extra tab (Legal Effect, annulment's own
 * concept with no divorce analog) and one extra review branch. Every
 * decision routes through a modal built on the shared ConfirmActionModal /
 * StructuredReasonModal primitives. Every action is permission-gated and,
 * where a gate would reject it, disabled with the specific reason shown
 * rather than hidden or silently broken.
 */
export default function AnnulmentReviewWorkspace() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();

  const currentAccountId = getCurrentAccountId();
  const actorName = getCurrentActorName();

  const canView = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_REGISTRATION_VIEW);
  const canReview = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_REGISTRATION_REVIEW);
  const canRequestCorrection = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_CORRECTION_REQUEST);
  const canRequestEvidence = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_EVIDENCE_REQUEST);
  const canApprovePermission = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_REGISTRATION_APPROVE);
  const canRejectPermission = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_REGISTRATION_REJECT);
  const canRegisterPermission = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_REGISTRATION_REGISTER);
  const canVerifyDecision = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_ORDER_VERIFY);
  const canClassifyLegalEffect = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_LEGAL_EFFECT_CLASSIFY);
  const canForeignReview = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_FOREIGN_DECISION_REVIEW);
  const canExceptionReview = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_EXCEPTION_REVIEW);
  const canViewSync = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_SDID_SYNC_VIEW);
  const canRetrySync = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_SDID_SYNC_RETRY);
  const canViewAudit = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_AUDIT_VIEW);
  const canViewRestricted = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_RESTRICTED_DOCUMENTS_VIEW);

  const [registration, setRegistration] = useState<AnnulmentRegistration | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [auditEvents, setAuditEvents] = useState<DemoAuditEvent[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("OVERVIEW");

  const [showStart, setShowStart] = useState(false);
  const [showConflictLock, setShowConflictLock] = useState(false);
  const [showConflictOfInterest, setShowConflictOfInterest] = useState(false);
  const [showMakerCheckerBlocked, setShowMakerCheckerBlocked] = useState(false);
  const [showRequestCorrection, setShowRequestCorrection] = useState(false);
  const [showRequestEvidence, setShowRequestEvidence] = useState(false);
  const [showRouteDecisionVerification, setShowRouteDecisionVerification] = useState(false);
  const [showRouteLegalEffect, setShowRouteLegalEffect] = useState(false);
  const [showRouteForeign, setShowRouteForeign] = useState(false);
  const [showRouteException, setShowRouteException] = useState(false);
  const [routeExceptionDefaultType, setRouteExceptionDefaultType] = useState<Parameters<typeof RouteToAnnulmentExceptionModal>[0]["defaultType"]>();
  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showRunVerification, setShowRunVerification] = useState(false);
  const [completeTarget, setCompleteTarget] = useState<AnnulmentRegistrationStatus | undefined>();
  const [showSelectClassification, setShowSelectClassification] = useState(false);
  const [showLegalEffectManualReview, setShowLegalEffectManualReview] = useState(false);
  const [showConfirmEffectiveDate, setShowConfirmEffectiveDate] = useState(false);
  const [showDivorceConflict, setShowDivorceConflict] = useState(false);
  const [showSeparationConflict, setShowSeparationConflict] = useState(false);
  const [showCorrectionConflict, setShowCorrectionConflict] = useState(false);
  const [previewTarget, setPreviewTarget] = useState<AnnulmentEvidence | undefined>();
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [busyEvidenceId, setBusyEvidenceId] = useState<string | undefined>();

  const coiShownRef = useRef(false);

  const load = useCallback(async () => {
    if (!caseId) {
      setLoading(false);
      setError("No annulment registration reference was provided.");
      return;
    }
    setLoading(true);
    setError(undefined);
    coiShownRef.current = false;
    try {
      const found = await demoGetAnnulmentRegistration(caseId);
      setRegistration(found);
      if (canViewAudit) {
        const res = await demoListCrvsAuditEvents({ targetRef: found.reference, limit: 200 });
        setAuditEvents(res.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load this annulment registration.");
      setRegistration(undefined);
    } finally {
      setLoading(false);
    }
  }, [caseId, canViewAudit]);

  useEffect(() => {
    load();
  }, [load]);

  const coiReasons = useMemo(() => {
    if (!registration) return [] as string[];
    const reasons = annulmentConflictOfInterestReasons(currentAccountId, registration);
    if (!canAccessAnnulmentCaseJurisdiction(registration.jurisdiction)) reasons.push("This registration is outside your assigned jurisdiction.");
    return reasons;
  }, [registration, currentAccountId]);

  useEffect(() => {
    if (registration && coiReasons.length > 0 && !coiShownRef.current) {
      coiShownRef.current = true;
      setShowConflictOfInterest(true);
    }
  }, [registration, coiReasons]);

  const db = getDemoData();
  const checklist = useMemo(() => (registration ? buildAnnulmentChecklist(registration, currentAccountId, db) : []), [registration, currentAccountId, db]);

  const marriage = useMemo(() => {
    const marriageId = registration?.existingMarriage.selected?.marriageApplicationId;
    return marriageId ? db.crvsMarriageApplications.find((m) => m.id === marriageId) : undefined;
  }, [registration, db]);

  const civilStatus = marriage ? deriveMarriageCivilStatus(marriage, { annulmentRegistrations: db.crvsAnnulmentRegistrations }) : undefined;
  const divorceConflicts = registration ? findExistingDivorceConflictForMarriage(registration.existingMarriage.selected?.marriageApplicationId, db.crvsDivorceRegistrations) : [];
  const separationOrCorrection = findJudicialSeparationOrCorrectionFlags(marriage);

  const handleSectionStatusChange = async (section: AnnulmentReviewSectionKey, status: ReviewSectionStatus) => {
    if (!registration) return;
    try {
      const updated = await demoSetAnnulmentReviewSectionStatus(registration.id, section, status, actorName);
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
      const updated = await demoStartAnnulmentReview(registration.id, currentAccountId, actorName);
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

  const handleMarkEvidence = async (ev: AnnulmentEvidence, verification: VerificationState) => {
    if (!registration) return;
    setBusyEvidenceId(ev.id);
    try {
      const nextEvidence = registration.evidence.map((e) => (e.id === ev.id ? { ...e, verification } : e));
      const updated = await demoUpdateAnnulmentRegistrationDraft(registration.id, { evidence: nextEvidence }, actorName);
      setRegistration(updated);
      toastMessage("success", `${ev.fileName} marked ${verification.replace(/_/g, " ").toLowerCase()}.`);
    } catch (err) {
      toastMessage("error", err);
    } finally {
      setBusyEvidenceId(undefined);
    }
  };

  const handleSaveEvidenceNote = async (ev: AnnulmentEvidence) => {
    if (!registration) return;
    const note = noteDrafts[ev.id] ?? ev.description ?? "";
    setBusyEvidenceId(ev.id);
    try {
      const nextEvidence = registration.evidence.map((e) => (e.id === ev.id ? { ...e, description: note } : e));
      const updated = await demoUpdateAnnulmentRegistrationDraft(registration.id, { evidence: nextEvidence }, actorName);
      setRegistration(updated);
      toastMessage("success", "Internal note saved.");
    } catch (err) {
      toastMessage("error", err);
    } finally {
      setBusyEvidenceId(undefined);
    }
  };

  const handleRetrySync = async (party: "PARTY_1" | "PARTY_2") => {
    if (!registration) return;
    try {
      const updated = await demoRetryAnnulmentSdidSync(registration.id, party, actorName);
      setRegistration(updated);
      toastMessage("success", "Retry requested.");
    } catch (err) {
      toastMessage("error", err);
    }
  };

  const handleRetryAllSync = async () => {
    if (!registration) return;
    try {
      const updated = await demoRetryAllFailedAnnulmentSdidSync(registration.id, actorName);
      setRegistration(updated);
      toastMessage("success", "Retry requested for every failed party.");
    } catch (err) {
      toastMessage("error", err);
    }
  };

  if (!canView) {
    return (
      <div className="crvs-page">
        <Empty icon="lock" title="You don't have access to this annulment registration" description="Reviewing an annulment registration requires annulment-registration-view access." isFullScreen />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="crvs-page">
        <Empty icon="hourglass_empty" title="Loading annulment registration…" isFullScreen />
      </div>
    );
  }

  if (error || !registration) {
    return (
      <div className="crvs-page">
        <Empty
          icon="error"
          title="Couldn't open this annulment registration"
          description={error || "This annulment registration was not found."}
          isFullScreen
          button={<Button text="Back to annulment review queue" appearance="ghost" type="button" onClick={() => navigate("/dashboard/crvs/annulment-review")} testId="an-workspace-back" />}
        />
      </div>
    );
  }

  const r = registration;
  const sla = annulmentSlaState(r);
  const evidence = activeEvidence(r.evidence);
  const isLate = isAnnulmentLateRegistration(r);
  const approvalGate = canApproveAnnulmentCase(currentAccountId, r);

  const isLockedByOther = !!r.reviewerId && r.reviewerId !== currentAccountId;
  const isMine = r.reviewerId === currentAccountId;
  const canStartHere = canTransitionAnnulmentRegistration(r.status, "UNDER_REVIEW");
  const canAct = isMine && !isLockedByOther;

  const openCorrection = r.correctionRequests.find((c) => !c.resolvedAt);

  const riskFlags: string[] = [];
  if (r.decision.isForeign) riskFlags.push("Foreign decision");
  if (isLate) riskFlags.push("Late registration");
  if (r.exception?.status === "OPEN") riskFlags.push(`Exception: ${ANNULMENT_EXCEPTION_TRIGGER_LABELS[r.exception.type]}`);
  if (openCorrection) riskFlags.push("Open correction");
  if (!checklist.find((c) => c.key === "NO_DUPLICATE")?.passed) riskFlags.push("Possible duplicate");
  if (divorceConflicts.length > 0) riskFlags.push("Existing divorce conflict");
  if (separationOrCorrection.judicialSeparation) riskFlags.push("Judicial-separation conflict");
  if (separationOrCorrection.correctionPending) riskFlags.push("Marriage correction in progress");

  const actionState = (permitted: boolean, permissionLabel: string, transitionOk: boolean, transitionLabel: string) => {
    if (!permitted) return { enabled: false, reason: permissionLabel };
    if (!canAct) return { enabled: false, reason: isLockedByOther ? `This case is locked to ${r.reviewerName || "another registrar"}.` : "Start the review to take action on this case." };
    if (!transitionOk) return { enabled: false, reason: transitionLabel };
    return { enabled: true, reason: "" };
  };

  const correctionAction = actionState(
    canRequestCorrection,
    "Requesting a correction requires annulment-correction-request access.",
    canTransitionAnnulmentRegistration(r.status, "CORRECTION_REQUIRED"),
    `A correction can't be requested while this case is ${ANNULMENT_REGISTRATION_STATUS_LABELS[r.status].toLowerCase()}.`
  );
  const evidenceRequestAction = actionState(
    canRequestEvidence,
    "Requesting additional evidence requires annulment-evidence-request access.",
    canTransitionAnnulmentRegistration(r.status, "CORRECTION_REQUIRED"),
    `Additional evidence can't be requested while this case is ${ANNULMENT_REGISTRATION_STATUS_LABELS[r.status].toLowerCase()}.`
  );
  const decisionVerificationAction = actionState(
    canVerifyDecision,
    "Routing for decision verification requires annulment-order-verify access.",
    canTransitionAnnulmentRegistration(r.status, "DECISION_VERIFICATION"),
    `Decision verification isn't reachable while this case is ${ANNULMENT_REGISTRATION_STATUS_LABELS[r.status].toLowerCase()}.`
  );
  const legalEffectReviewAction = actionState(
    canClassifyLegalEffect,
    "Routing for legal-effect review requires annulment-legal-effect-classify access.",
    canTransitionAnnulmentRegistration(r.status, "LEGAL_EFFECT_REVIEW"),
    `Legal-effect review isn't reachable while this case is ${ANNULMENT_REGISTRATION_STATUS_LABELS[r.status].toLowerCase()}.`
  );
  const foreignReviewAction = actionState(
    canForeignReview,
    "Routing for foreign-decision review requires annulment-foreign-decision-review access.",
    canTransitionAnnulmentRegistration(r.status, "FOREIGN_DECISION_REVIEW"),
    `Foreign-decision review isn't reachable while this case is ${ANNULMENT_REGISTRATION_STATUS_LABELS[r.status].toLowerCase()}.`
  );
  const exceptionAction = actionState(
    canExceptionReview,
    "Routing for exception review requires annulment-exception-review access.",
    canTransitionAnnulmentRegistration(r.status, "EXCEPTION_REVIEW"),
    `Exception review isn't reachable while this case is ${ANNULMENT_REGISTRATION_STATUS_LABELS[r.status].toLowerCase()}.`
  );
  const approveAction = (() => {
    const base = actionState(
      canApprovePermission,
      "Approving requires annulment-registration-approve access.",
      canTransitionAnnulmentRegistration(r.status, "APPROVED"),
      `This case can't be approved while it is ${ANNULMENT_REGISTRATION_STATUS_LABELS[r.status].toLowerCase()}.`
    );
    if (!base.enabled) return base;
    if (!approvalGate.allowed) return { enabled: false, reason: approvalGate.reasons.join(" ") };
    return base;
  })();
  const rejectAction = actionState(
    canRejectPermission,
    "Rejecting requires annulment-registration-reject access.",
    canTransitionAnnulmentRegistration(r.status, "REJECTED"),
    `This case can't be rejected while it is ${ANNULMENT_REGISTRATION_STATUS_LABELS[r.status].toLowerCase()}.`
  );
  const registerAction = (() => {
    if (!canRegisterPermission) return { enabled: false, reason: "Registering requires annulment-registration-register access." };
    if (r.status !== "APPROVED") return { enabled: false, reason: "An annulment can only be registered once the case has been approved." };
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

  const sectionCard = (section: AnnulmentReviewSectionKey, children: React.ReactNode) => (
    <SectionReviewCard
      title={ANNULMENT_REVIEW_SECTION_LABELS[section]}
      status={r.reviewSections[section]}
      disabled={!canAct}
      onStatusChange={canReview ? (s) => handleSectionStatusChange(section, s) : undefined}
    >
      {children}
    </SectionReviewCard>
  );

  const decisionDocument = evidence.find((e) => e.documentType === "FINAL_ANNULMENT_DECISION");

  return (
    <div className="crvs-page">
      <div className="crvs-section review-case-header">
        <div>
          <h1 className="crvs-page-title">{r.reference}</h1>
          <div className="review-case-meta">
            <AnnulmentStatusPill kind="annulmentRegistration" status={r.status} />
            <span>{affectedPartiesLabel(r)}</span>
            <span>Marriage {marriageReferenceLabel(r)}</span>
            <span>Court {r.decision.courtCaseNumber || "—"}</span>
            <span>{r.reviewerName ? `Reviewer: ${r.reviewerName}` : "Unassigned"}</span>
            <span>{r.processingOffice.selectedProcessingOfficeName || "No processing office"}</span>
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
          <Button text="Start review" appearance="primary" type="button" disabled={!canReview} onClick={handleStartClick} testId="an-workspace-start-review" />
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
                <DescriptionItem label="Status" value={ANNULMENT_REGISTRATION_STATUS_LABELS[r.status]} />
                <DescriptionItem label="Source" value={ANNULMENT_SOURCE_LABELS[r.source]} />
                <DescriptionItem label="Source notification" value={r.sourceNotificationReference} />
                <DescriptionItem label="Applicant" value={applicantDisplayName(r.applicant)} />
                <DescriptionItem label="Prepared by" value={r.officerName} />
                <DescriptionItem label="Reviewer" value={r.reviewerName || "Unassigned"} />
                <DescriptionItem label="Review locked at" value={r.reviewLockedAt ? formatDateTime(r.reviewLockedAt) : "Not locked"} />
                <DescriptionItem label="Processing office" value={r.processingOffice.selectedProcessingOfficeName} />
                <DescriptionItem label="Jurisdiction" value={r.jurisdiction} />
                <DescriptionItem label="Submitted" value={r.submittedAt ? formatDateTime(r.submittedAt) : "Not submitted"} />
              </DescriptionList>

              <h3 className="crvs-section-title" style={{ marginTop: 16 }}>
                Decision summary
              </h3>
              <DescriptionList columns={3}>
                <DescriptionItem label="Court / authority" value={r.decision.courtOrAuthorityName} />
                <DescriptionItem label="Decision number" value={r.decision.decisionNumber} />
                <DescriptionItem label="Describes marriage as" value={r.decision.describesMarriageAs} />
                <DescriptionItem label="Legal-effect classification" value={r.legalEffect.confirmedClassification ? LEGAL_EFFECT_CLASSIFICATION_LABELS[r.legalEffect.confirmedClassification] : "Not yet confirmed"} />
              </DescriptionList>

              {openCorrection && (
                <div className="crvs-banner crvs-banner-warning" style={{ marginTop: 12 }}>
                  <Icon name="edit" />
                  <span>
                    {openCorrection.requestType === "EVIDENCE" ? "Evidence requested" : "Correction requested"} by {openCorrection.requestedBy} on {formatDateTime(openCorrection.requestedAt)}
                    {openCorrection.responseDeadline ? `, due ${formatDate(openCorrection.responseDeadline)}` : ""}: {openCorrection.items.map((i) => i.reason).join("; ")}
                  </span>
                </div>
              )}

              {r.exception && (
                <div className={`crvs-banner ${r.exception.status === "OPEN" ? "crvs-banner-warning" : "crvs-banner-info"}`} style={{ marginTop: 12 }}>
                  <strong>{ANNULMENT_EXCEPTION_TRIGGER_LABELS[r.exception.type]}</strong> — {r.exception.reason}
                  {r.exception.resolution && (
                    <div className="crvs-form-hint">
                      Resolved as {r.exception.resolution.type} by {r.exception.resolution.resolvedBy} on {formatDateTime(r.exception.resolution.resolvedAt)}.
                    </div>
                  )}
                </div>
              )}

              {divorceConflicts.length > 0 && (
                <div className="crvs-banner crvs-banner-danger" style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span>This marriage already has a registered divorce against it.</span>
                  <Button text="View conflict" size="sm" appearance="ghost" type="button" onClick={() => setShowDivorceConflict(true)} testId="an-overview-view-divorce-conflict" />
                </div>
              )}
              {separationOrCorrection.judicialSeparation && (
                <div className="crvs-banner crvs-banner-warning" style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span>This marriage is recorded as judicially separated.</span>
                  <Button text="View conflict" size="sm" appearance="ghost" type="button" onClick={() => setShowSeparationConflict(true)} testId="an-overview-view-separation-conflict" />
                </div>
              )}
              {separationOrCorrection.correctionPending && (
                <div className="crvs-banner crvs-banner-warning" style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span>This marriage has a correction pending.</span>
                  <Button text="View conflict" size="sm" appearance="ghost" type="button" onClick={() => setShowCorrectionConflict(true)} testId="an-overview-view-correction-conflict" />
                </div>
              )}

              <h3 className="crvs-section-title" style={{ marginTop: 16 }}>
                Next action
              </h3>
              <p className="crvs-form-hint">
                {!canAct
                  ? isLockedByOther
                    ? `Locked to ${r.reviewerName || "another registrar"}.`
                    : "Start review to take action on this case."
                  : !r.legalEffect.confirmedClassification
                  ? "Confirm a legal-effect classification on the Legal Effect tab before this case can be approved."
                  : approvalGate.allowed
                  ? "This case is ready for a decision — approve, reject, or route it for further review."
                  : `Approval is currently blocked: ${approvalGate.reasons.join(" ")}`}
              </p>

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

              <h3 className="crvs-section-title" style={{ marginTop: 16 }}>
                Processing office
              </h3>
              {sectionCard(
                "PROCESSING_OFFICE",
                <dl className="review-readonly-fields">
                  <Field label="Marriage registered office" value={r.processingOffice.marriageRegisteredOfficeName || "—"} />
                  <Field label="Applicant domicile office" value={r.processingOffice.applicantDomicileOfficeName || "—"} />
                  <Field label="Selected processing office" value={r.processingOffice.selectedProcessingOfficeName || "—"} />
                  <Field label="Embassy / foreign office path" value={r.processingOffice.embassyOrForeignOfficePath ? "Yes" : "No"} />
                  <Field label="Jurisdiction result" value={r.processingOffice.jurisdictionResult.replace(/_/g, " ").toLowerCase()} />
                  <Field label="Alternative-office reason" value={r.processingOffice.alternativeReason || "—"} />
                </dl>
              )}

              <h3 className="crvs-section-title" style={{ marginTop: 16 }}>
                Officer declaration
              </h3>
              {sectionCard(
                "OFFICER_DECLARATION",
                <dl className="review-readonly-fields">
                  <Field label="Accuracy declaration confirmed" value={r.accuracyDeclarationConfirmed ? "Yes" : "No"} />
                  <Field label="Authority to submit confirmed" value={r.authorityToSubmitConfirmed ? "Yes" : "No"} />
                  <Field label="Authoritative decision exists confirmed" value={r.authoritativeDecisionExistsConfirmed ? "Yes" : "No"} />
                  <Field label="Decision complete confirmed" value={r.decisionCompleteConfirmed ? "Yes" : "No"} />
                  <Field label="Privacy acknowledged" value={r.privacyAcknowledged ? "Yes" : "No"} />
                  <Field label="Electronic submission confirmed" value={r.electronicSubmissionConfirmed ? "Yes" : "No"} />
                </dl>
              )}
            </section>
          )}

          {activeTab === "APPLICANT" &&
            sectionCard(
              "APPLICANT",
              <dl className="review-readonly-fields">
                <Field label="Name" value={applicantDisplayName(r.applicant)} />
                <Field label="Relationship to marriage" value={r.applicant.relationshipToMarriage || "—"} />
                <Field label="Relationship to case" value={ANNULMENT_APPLICANT_RELATIONSHIP_LABELS[r.applicant.relationshipToCase]} />
                <Field label="Document" value={`${DOCUMENT_TYPE_LABELS[r.applicant.documentType]} · ${maskDocumentNumber(r.applicant.documentNumber)}`} />
                <Field label="NIN" value={maskDocumentNumber(r.applicant.nin)} />
                <Field label="Date of birth" value={formatDate(r.applicant.dateOfBirth)} />
                <Field label="Nationality" value={r.applicant.nationality || "—"} />
                <Field label="Residence" value={r.applicant.residence || "—"} />
                <Field label="Phone" value={r.applicant.phone || "—"} />
                <Field label="Email" value={r.applicant.email || "—"} />
                <Field label="Identity verification" value={<StatusBadge kind="verification" status={r.applicant.identityVerification} />} />
                <Field label="Authorization basis" value={r.applicant.authorizationBasis || "Not required — the applicant is an affected party"} />
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
                  <Field label="Parties on the marriage record" value={r.existingMarriage.selected ? `${r.existingMarriage.selected.party1Name} & ${r.existingMarriage.selected.party2Name}` : "—"} />
                  <Field label="Searched" value={r.existingMarriage.searchedAt ? `${formatDateTime(r.existingMarriage.searchedAt)} by ${r.existingMarriage.searchedBy || "—"}` : "Not searched"} />
                  <Field label="Current civil status" value={civilStatus ? <AnnulmentStatusPill kind="marriageCivilStatus" status={civilStatus} /> : "Marriage record not linked"} />
                  <Field label="Marriage certificate eligibility" value={marriage?.certificateEligibility ? marriage.certificateEligibility.status.replace(/_/g, " ").toLowerCase() : "—"} />
                  <Field label="SDID synchronization" value={marriage ? <StatusBadge kind="marriageSync" status={marriage.sdid.status} /> : "—"} />
                </dl>

                <h4 className="crvs-section-title" style={{ marginTop: 12 }}>
                  Conflicts and prior events on this marriage
                </h4>
                <ul style={{ listStyle: "none", margin: "8px 0 0", padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                  <li className={`crvs-banner ${divorceConflicts.length > 0 ? "crvs-banner-danger" : "crvs-banner-info"}`}>
                    Registered divorce: {divorceConflicts.length > 0 ? divorceConflicts.map((c) => c.reference).join(", ") : "None found."}
                  </li>
                  <li className={`crvs-banner ${separationOrCorrection.judicialSeparation ? "crvs-banner-warning" : "crvs-banner-info"}`}>
                    Judicial separation: {separationOrCorrection.judicialSeparation ? "Recorded on this marriage." : "None recorded."}
                  </li>
                  <li className={`crvs-banner ${separationOrCorrection.correctionPending ? "crvs-banner-warning" : "crvs-banner-info"}`}>
                    Marriage correction: {separationOrCorrection.correctionPending ? "Pending on this marriage." : "None pending."}
                  </li>
                  <li className={`crvs-banner ${marriage?.annulment ? "crvs-banner-warning" : "crvs-banner-info"}`}>
                    Previous annulment: {marriage?.annulment ? `${marriage.annulment.annulmentRegistrationReference} — already annulled ${formatDate(marriage.annulment.effectiveDate)}.` : "None recorded."}
                  </li>
                </ul>

                {r.existingMarriage.candidates.length > 0 && (
                  <>
                    <h4 className="crvs-section-title" style={{ marginTop: 12 }}>
                      Candidates considered
                    </h4>
                    <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                      {r.existingMarriage.candidates.map((c) => (
                        <li key={c.registrationNumber} className={`crvs-banner ${r.existingMarriage.selected?.registrationNumber === c.registrationNumber ? "crvs-banner-info" : "crvs-banner-warning"}`}>
                          <strong>{c.registrationNumber}</strong> — {c.party1Name} &amp; {c.party2Name} · {c.matchConfidence} confidence
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

                {r.marriageAnnulmentUpdate?.applied && (
                  <div className="crvs-banner crvs-banner-info" style={{ marginTop: 12 }}>
                    Marriage record {r.marriageAnnulmentUpdate.marriageApplicationReference || "—"} was annotated as annulled on {formatDateTime(r.marriageAnnulmentUpdate.updatedAt)}. The original marriage
                    registration data is preserved.
                  </div>
                )}

                {marriage && (
                  <>
                    <h4 className="crvs-section-title" style={{ marginTop: 12 }}>
                      Full status history
                    </h4>
                    <div className="crvs-timeline">
                      {marriage.statusHistory.map((entry, i) => (
                        <span key={`${entry.status}-${i}`} className="crvs-timeline-item is-reached">
                          <span className="crvs-timeline-dot" />
                          {entry.status.replace(/_/g, " ")} · {formatDateTime(entry.at)} · {entry.by}
                          {entry.note ? ` — ${entry.note}` : ""}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}

          {activeTab === "FIRST_PARTY" && sectionCard("AFFECTED_PARTY_1", <AffectedPartyPanel party={r.affectedParty1} label="Affected party 1" />)}
          {activeTab === "SECOND_PARTY" && sectionCard("AFFECTED_PARTY_2", <AffectedPartyPanel party={r.affectedParty2} label="Affected party 2" />)}

          {activeTab === "DECISION" &&
            sectionCard(
              "DECISION",
              <>
                <dl className="review-readonly-fields">
                  <Field label="Country" value={r.decision.country || "—"} />
                  <Field label="Court or authority" value={r.decision.courtOrAuthorityName || "—"} />
                  <Field label="Jurisdiction" value={r.decision.jurisdiction || "—"} />
                  <Field label="Court case number" value={r.decision.courtCaseNumber || "—"} />
                  <Field label="Decision number" value={r.decision.decisionNumber || "—"} />
                  <Field label="Decision date" value={formatDate(r.decision.decisionDate)} />
                  <Field label="Final on" value={r.decision.finalityDate ? formatDate(r.decision.finalityDate) : "Not reported"} />
                  <Field label="Decision type" value={ANNULMENT_DECISION_TYPE_LABELS[r.decision.decisionType]} />
                  <Field label="Effective date (as reported)" value={formatDate(r.decision.effectiveDate)} />
                  <Field label="Confirmed effective date" value={formatDate(r.legalEffect.effectiveDate)} />
                  <Field label="Court registry reference" value={r.decision.courtRegistryReference || "—"} />
                  <Field label="Verification source" value={r.decision.verificationSource || "—"} />
                  <Field label="Describes marriage as" value={r.decision.describesMarriageAs} />
                  <Field label="Legal-effect wording" value={r.decision.legalEffectWording || "—"} />
                  <Field label="Foreign decision" value={r.decision.isForeign ? "Yes" : "No"} />
                </dl>

                {canViewRestricted ? (
                  <dl className="review-readonly-fields" style={{ marginTop: 12 }}>
                    <Field label="Notes for staff (restricted)" value={r.decision.notesForStaff || "—"} />
                  </dl>
                ) : (
                  <div className="crvs-banner crvs-banner-info" style={{ marginTop: 12 }}>
                    <Icon name="lock" />
                    <span>Staff notes on this decision are restricted. Viewing them requires annulment-restricted-documents-view access.</span>
                  </div>
                )}

                {decisionDocument && (canViewRestricted || !isRestrictedAnnulmentDocumentCategory(decisionDocument.documentType)) && (
                  <div style={{ marginTop: 12 }}>
                    <Button text="Preview decision document" size="sm" appearance="ghost" type="button" onClick={() => setPreviewTarget(decisionDocument)} testId="an-workspace-preview-decision" />
                  </div>
                )}

                <div className="crvs-banner crvs-banner-info" style={{ marginTop: 12 }}>
                  Verification result: <strong>{r.decisionVerification.overallOutcome || r.decisionVerification.status}</strong>
                  {r.decisionVerification.checkedAt ? ` · last run ${formatDateTime(r.decisionVerification.checkedAt)} by ${r.decisionVerification.checkedBy || "—"}` : " · not yet run"}.{" "}
                  <Button text="Open verification" size="sm" appearance="ghost" type="button" onClick={() => setActiveTab("VERIFICATION")} testId="an-workspace-open-verification" />
                </div>

                {r.decision.isForeign && (
                  <div className="crvs-banner crvs-banner-warning" style={{ marginTop: 12 }}>
                    <Icon name="public" />
                    <span>
                      Foreign decision — recognition status is {FOREIGN_RECOGNITION_STATUS_LABELS[r.foreignRecognition.status].toLowerCase()}. Country: {r.foreignRecognition.country || "—"}, authority:{" "}
                      {r.foreignRecognition.foreignCourtOrAuthority || "—"}.{" "}
                      <Button text="Open foreign-decision review" size="sm" appearance="ghost" type="button" onClick={() => navigate(`/dashboard/crvs/foreign-annulments/${r.id}`)} testId="an-workspace-open-foreign" />
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
                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                  {evidence.map((ev) => {
                    const restricted = isRestrictedAnnulmentDocumentCategory(ev.documentType);
                    const hidden = restricted && !canViewRestricted;
                    const busy = busyEvidenceId === ev.id;
                    return (
                      <li key={ev.id} className="crvs-banner crvs-banner-info" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                          <span>
                            <strong>{ev.documentType.replace(/_/g, " ")}</strong>
                            {restricted && (
                              <span className="crvs-status-pill crvs-status-neutral" style={{ marginLeft: 8 }}>
                                <Icon name="lock" /> Restricted
                              </span>
                            )}
                            {!hidden && <div className="crvs-form-hint">{ev.fileName} — uploaded {formatDateTime(ev.uploadedAt)} by {ev.uploadedBy}</div>}
                            {hidden && <div className="crvs-form-hint">Requires annulment-restricted-documents-view access to view details.</div>}
                            <div style={{ marginTop: 4 }}>
                              <StatusBadge kind="verification" status={ev.verification} />
                            </div>
                          </span>
                          {!hidden && (
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                              <Button text="Preview" size="sm" appearance="ghost" type="button" onClick={() => setPreviewTarget(ev)} testId={`an-workspace-preview-${ev.id}`} />
                              <Button
                                text="Mark valid"
                                size="sm"
                                appearance="ghost"
                                type="button"
                                disabled={!canAct || !canReview || busy}
                                loading={busy}
                                onClick={() => handleMarkEvidence(ev, "VERIFIED")}
                                testId={`an-workspace-mark-valid-${ev.id}`}
                              />
                              <Button
                                text="Mark invalid"
                                size="sm"
                                appearance="ghost"
                                color="red"
                                type="button"
                                disabled={!canAct || !canReview || busy}
                                loading={busy}
                                onClick={() => handleMarkEvidence(ev, "MANUAL_REVIEW_REQUIRED")}
                                testId={`an-workspace-mark-invalid-${ev.id}`}
                              />
                              <Button
                                text="Request replacement"
                                size="sm"
                                appearance="ghost"
                                type="button"
                                disabled={!evidenceRequestAction.enabled}
                                onClick={() => setShowRequestEvidence(true)}
                                testId={`an-workspace-request-replacement-${ev.id}`}
                              />
                            </div>
                          )}
                        </div>
                        {!hidden && (
                          <div className="crvs-form-group" style={{ margin: 0 }}>
                            <label htmlFor={`an-evidence-note-${ev.id}`}>Internal note (staff only, demo)</label>
                            <textarea
                              id={`an-evidence-note-${ev.id}`}
                              rows={2}
                              value={noteDrafts[ev.id] ?? ev.description ?? ""}
                              disabled={!canAct || !canReview}
                              onChange={(e) => setNoteDrafts((prev) => ({ ...prev, [ev.id]: e.target.value }))}
                              data-testid={`an-evidence-note-${ev.id}`}
                            />
                            <Button
                              text="Save note"
                              size="sm"
                              appearance="ghost"
                              type="button"
                              disabled={!canAct || !canReview || busy}
                              loading={busy}
                              onClick={() => handleSaveEvidenceNote(ev)}
                              testId={`an-evidence-save-note-${ev.id}`}
                            />
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )
            )}

          {activeTab === "VERIFICATION" &&
            sectionCard(
              "IDENTITY_CHECKS",
              <>
                <div className="crvs-review-section-header">
                  <h3 className="crvs-section-title" style={{ margin: 0 }}>
                    Decision verification
                  </h3>
                  <AnnulmentStatusPill kind="annulmentDecisionVerification" status={r.decisionVerification.status} />
                </div>
                <p className="crvs-form-hint">
                  {r.decisionVerification.checkedAt
                    ? `Last run ${formatDateTime(r.decisionVerification.checkedAt)} by ${r.decisionVerification.checkedBy || "—"} · overall outcome ${r.decisionVerification.overallOutcome || "not recorded"}.`
                    : "Verification has not been run for this case yet."}
                </p>

                {r.decisionVerification.results.length === 0 ? (
                  <p className="crvs-form-hint">No rule results recorded. Run verification to evaluate every rule separately.</p>
                ) : (
                  <ul style={{ listStyle: "none", margin: "8px 0 0", padding: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                    {r.decisionVerification.results.map((result) => (
                      <li key={result.rule} className={`crvs-banner ${result.passed ? "crvs-banner-info" : result.severity === "BLOCKING" ? "crvs-banner-danger" : "crvs-banner-warning"}`}>
                        <span className={`crvs-status-pill crvs-status-${result.passed ? "success" : result.severity === "BLOCKING" ? "danger" : "warning"} crvs-status-icon-label`}>
                          <Icon name={result.passed ? "check_circle" : "cancel"} />
                          {result.passed ? "Pass" : result.severity === "BLOCKING" ? "Blocking" : "Review"}
                        </span>{" "}
                        <strong>{DECISION_VERIFICATION_RULE_LABELS[result.rule] || result.rule.replace(/_/g, " ")}</strong> — {result.message}
                      </li>
                    ))}
                  </ul>
                )}

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                  <Button
                    text="Run decision verification"
                    appearance="primary"
                    type="button"
                    disabled={!canVerifyDecision}
                    onClick={() => setShowRunVerification(true)}
                    testId="an-workspace-run-verification"
                  />
                  {r.status === "DECISION_VERIFICATION" &&
                    (["UNDER_REVIEW", "CORRECTION_REQUIRED", "LEGAL_EFFECT_REVIEW", "FOREIGN_DECISION_REVIEW", "EXCEPTION_REVIEW", "REJECTED"] as AnnulmentRegistrationStatus[])
                      .filter((next) => canTransitionAnnulmentRegistration(r.status, next))
                      .map((next) => (
                        <Button
                          key={next}
                          text={`Complete — ${ANNULMENT_REGISTRATION_STATUS_LABELS[next].toLowerCase()}`}
                          appearance="ghost"
                          color={next === "REJECTED" ? "red" : undefined}
                          type="button"
                          disabled={!canVerifyDecision}
                          onClick={() => setCompleteTarget(next)}
                          testId={`an-workspace-complete-verification-${next}`}
                        />
                      ))}
                </div>
                {!canVerifyDecision && <p className="crvs-form-hint">Running or completing decision verification requires annulment-order-verify access.</p>}
                {canVerifyDecision && r.status !== "DECISION_VERIFICATION" && (
                  <p className="crvs-form-hint">Completing verification is only available while the case is in decision verification.</p>
                )}
              </>
            )}

          {activeTab === "LEGAL_EFFECT" &&
            sectionCard(
              "LEGAL_EFFECT",
              <>
                {r.legalEffect.lockedAt && (
                  <div className="crvs-banner crvs-banner-warning" style={{ marginBottom: 12 }}>
                    <Icon name="lock" /> Locked at {formatDateTime(r.legalEffect.lockedAt)} — this case has been approved, so the classification can no longer be changed.
                  </div>
                )}

                {r.legalEffect.wordingFromDecision && (
                  <div className="crvs-banner crvs-banner-info" style={{ marginBottom: 12 }}>
                    <strong>Wording from the decision:</strong> &ldquo;{r.legalEffect.wordingFromDecision}&rdquo;
                  </div>
                )}

                <DescriptionList columns={2}>
                  <DescriptionItem
                    label="Proposed classification"
                    value={r.legalEffect.proposedClassification ? `${LEGAL_EFFECT_CLASSIFICATION_LABELS[r.legalEffect.proposedClassification]} (suggestion only)` : "Not yet proposed"}
                  />
                  <DescriptionItem
                    label="Confirmed classification"
                    value={r.legalEffect.confirmedClassification ? LEGAL_EFFECT_CLASSIFICATION_LABELS[r.legalEffect.confirmedClassification] : "Not yet confirmed"}
                  />
                  <DescriptionItem label="Supporting evidence reference" value={r.legalEffect.supportingEvidenceRef} />
                  <DescriptionItem label="Effective date" value={formatDate(r.legalEffect.effectiveDate)} />
                  <DescriptionItem label="Marriage-status result" value={r.legalEffect.marriageStatusResult === "ANNULLED" ? "Annulled" : "Requires manual review"} />
                  <DescriptionItem label="Certificate consequence" value={r.legalEffect.certificateConsequence.replace(/_/g, " ").toLowerCase()} />
                  <DescriptionItem label="Reviewing officer" value={r.legalEffect.reviewingOfficerName} />
                  <DescriptionItem label="Supervisor reviewed by" value={r.legalEffect.supervisorReviewedBy ? `${r.legalEffect.supervisorReviewedBy} — ${formatDateTime(r.legalEffect.supervisorReviewedAt)}` : undefined} />
                </DescriptionList>

                <h4 className="crvs-section-title" style={{ marginTop: 16 }}>
                  Proposed SDID consequences
                </h4>
                <DescriptionList columns={2}>
                  <DescriptionItem label="Affected party 1" value={`${affectedPartyDisplayName(r.affectedParty1)} — ${r.legalEffect.proposedSdid.party1.proposedCivilStatus.replace(/_/g, " ").toLowerCase()}`} />
                  <DescriptionItem label="Rationale (party 1)" value={r.legalEffect.proposedSdid.party1.rationale} />
                  <DescriptionItem label="Affected party 2" value={`${affectedPartyDisplayName(r.affectedParty2)} — ${r.legalEffect.proposedSdid.party2.proposedCivilStatus.replace(/_/g, " ").toLowerCase()}`} />
                  <DescriptionItem label="Rationale (party 2)" value={r.legalEffect.proposedSdid.party2.rationale} />
                </DescriptionList>

                <div className="crvs-banner crvs-banner-info" style={{ marginTop: 12 }}>
                  <strong>Relationship history treatment:</strong> The marriage relationship is marked annulled on both identities — its full history is always preserved, never deleted.
                </div>

                <h4 className="crvs-section-title" style={{ marginTop: 16 }}>
                  This will NOT change
                </h4>
                <ul style={{ margin: "4px 0 0", paddingLeft: 18 }}>
                  {r.legalEffect.downstreamChangesExplicitlyExcluded.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>

                <h4 className="crvs-section-title" style={{ marginTop: 16 }}>
                  Classification history
                </h4>
                {r.legalEffect.classificationHistory.length === 0 ? (
                  <p className="crvs-form-hint">No classification has been confirmed yet.</p>
                ) : (
                  <div className="review-audit-list">
                    {r.legalEffect.classificationHistory.map((entry, i) => (
                      <div key={`${entry.classification}-${i}`} className="review-audit-item">
                        <strong>{LEGAL_EFFECT_CLASSIFICATION_LABELS[entry.classification]}</strong> by {entry.setBy} — {formatDateTime(entry.setAt)}
                        {entry.locked && " · locked"}
                        {entry.note && <div className="crvs-form-hint">{entry.note}</div>}
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
                  <Button
                    text="Propose classification"
                    appearance="ghost"
                    type="button"
                    disabled={!canClassifyLegalEffect || !!r.legalEffect.lockedAt || !canAct}
                    onClick={async () => {
                      try {
                        const { demoProposeAnnulmentLegalEffectClassification } = await import("@/demo/services/crvsAnnulmentLegalEffect");
                        const updated = await demoProposeAnnulmentLegalEffectClassification(r.id, actorName);
                        setRegistration(updated);
                        toastMessage("success", "Classification proposed (suggestion only, not confirmed).");
                      } catch (err) {
                        toastMessage("error", err);
                      }
                    }}
                    testId="an-workspace-propose-classification"
                  />
                  <Button
                    text="Confirm classification"
                    appearance="primary"
                    type="button"
                    disabled={!canClassifyLegalEffect || !!r.legalEffect.lockedAt || !canAct}
                    onClick={() => setShowSelectClassification(true)}
                    testId="an-workspace-confirm-classification"
                  />
                  <Button
                    text="Route to manual review"
                    appearance="ghost"
                    type="button"
                    disabled={!canClassifyLegalEffect || !!r.legalEffect.lockedAt || !canAct}
                    onClick={() => setShowLegalEffectManualReview(true)}
                    testId="an-workspace-legal-effect-manual-review"
                  />
                  <Button
                    text="Confirm effective date"
                    appearance="ghost"
                    type="button"
                    disabled={!canClassifyLegalEffect || !!r.legalEffect.lockedAt || !canAct}
                    onClick={() => setShowConfirmEffectiveDate(true)}
                    testId="an-workspace-confirm-effective-date"
                  />
                </div>
                {!canClassifyLegalEffect && <p className="crvs-form-hint">These actions require annulment-legal-effect-classify access.</p>}
              </>
            )}

          {activeTab === "REVIEW" && (
            <section className="crvs-review-section">
              <h3 className="crvs-section-title">Review checklist</h3>
              <p className="crvs-form-hint">
                Every requirement is shown separately with its own result — this is never collapsed into a single &ldquo;verified&rdquo; badge. Unmet items must be resolved or explicitly routed before the
                case can be approved.
              </p>
              <ul style={{ listStyle: "none", margin: "12px 0 0", padding: 0, display: "flex", flexDirection: "column", gap: 10 }} data-testid="annulment-review-checklist">
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
                {(Object.keys(ANNULMENT_REVIEW_SECTION_LABELS) as AnnulmentReviewSectionKey[]).map((key) => (
                  <DescriptionItem key={key} label={ANNULMENT_REVIEW_SECTION_LABELS[key]} value={r.reviewSections[key].replace(/_/g, " ").toLowerCase()} />
                ))}
              </DescriptionList>
            </section>
          )}

          {activeTab === "SDID" && (
            <section className="crvs-review-section">
              {!canViewSync ? (
                <Empty icon="lock" title="You don't have access to synchronization details" description="Viewing SDID synchronization requires annulment-sdid-sync-view access." />
              ) : (
                <>
                  <div className="crvs-review-section-header">
                    <h3 className="crvs-section-title" style={{ margin: 0 }}>
                      SDID synchronization
                    </h3>
                    <AnnulmentStatusPill kind="annulmentSync" status={r.sdid.status} />
                  </div>
                  <p className="crvs-form-hint">
                    Each affected party&apos;s identity is synchronized independently — one party&apos;s outcome never affects the other&apos;s. Synchronization only starts after the annulment is registered.
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12, marginTop: 12 }}>
                    {(
                      [
                        { key: "party1" as const, partyKey: "PARTY_1" as const, label: "Affected party 1", party: r.affectedParty1 },
                        { key: "party2" as const, partyKey: "PARTY_2" as const, label: "Affected party 2", party: r.affectedParty2 },
                      ]
                    ).map(({ key, partyKey, label, party }) => {
                      const sub = r.sdid[key];
                      return (
                        <div key={key} className="crvs-review-section">
                          <div className="crvs-review-section-header">
                            <strong>{label}</strong>
                            <AnnulmentStatusPill kind="annulmentPartySync" status={sub.status} />
                          </div>
                          <p className="crvs-form-hint">{affectedPartyDisplayName(party)}</p>
                          <DescriptionList columns={2}>
                            <DescriptionItem label="Last attempt" value={sub.lastAttemptAt ? formatDateTime(sub.lastAttemptAt) : "—"} />
                            <DescriptionItem label="Attempts" value={String(sub.attempts.length)} />
                            <DescriptionItem label="Resulting civil status" value={sub.resultingCivilStatus ? sub.resultingCivilStatus.replace(/_/g, " ").toLowerCase() : undefined} />
                            <DescriptionItem label="Linked NIN" value={sub.status === "IDENTITY_UPDATED" ? sub.linkedNin : undefined} />
                            <DescriptionItem label="Last failure code" value={sub.lastFailureCode} />
                          </DescriptionList>
                          {(sub.status === "FAILED" || sub.status === "MANUAL_REVIEW") && (
                            <div style={{ marginTop: 8 }}>
                              <Button
                                text="Retry synchronization"
                                size="sm"
                                appearance="ghost"
                                type="button"
                                disabled={!canRetrySync}
                                onClick={() => handleRetrySync(partyKey)}
                                testId={`an-workspace-retry-sync-${partyKey}`}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="crvs-banner crvs-banner-info" style={{ marginTop: 12 }}>
                    Relationship reclassified on both identities: <strong>{r.sdid.relationshipUpdated ? "Yes" : "Not yet"}</strong>.
                  </div>
                  {(r.sdid.party1.status === "FAILED" || r.sdid.party2.status === "FAILED") && (
                    <div style={{ marginTop: 12 }}>
                      <Button text="Retry all failed" appearance="ghost" type="button" disabled={!canRetrySync} onClick={handleRetryAllSync} testId="an-workspace-retry-all-sync" />
                    </div>
                  )}
                  {!canRetrySync && <p className="crvs-form-hint">Retrying synchronization requires annulment-sdid-sync-retry access.</p>}
                  {r.status === "REGISTERED" && (
                    <div style={{ marginTop: 12 }}>
                      <Button text="Manage synchronization" appearance="ghost" type="button" onClick={() => navigate(`/dashboard/crvs/registered-annulments/${r.id}`)} testId="an-workspace-manage-sync" />
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
                    {ANNULMENT_REGISTRATION_STATUS_LABELS[entry.status]} · {formatDateTime(entry.at)} · {entry.by}
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
                <Empty icon="lock" title="You don't have access to audit history" description="Viewing the annulment audit trail requires annulment-audit-view access." />
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

        <aside className="review-action-rail" id="annulment-review-action-rail">
          <h3>Decision</h3>
          {isLockedByOther && <div className="crvs-banner crvs-banner-warning">This case is locked to {r.reviewerName || "another registrar"}. You can preview it but can&apos;t take action.</div>}
          {!isLockedByOther && !isMine && canStartHere && (
            <Button text="Start review" appearance="primary" block type="button" disabled={!canReview} onClick={handleStartClick} testId="an-rail-start-review" />
          )}

          <ActionButton label="Request correction" state={correctionAction} onClick={() => setShowRequestCorrection(true)} testId="an-rail-request-correction" />
          <ActionButton label="Request additional evidence" state={evidenceRequestAction} onClick={() => setShowRequestEvidence(true)} testId="an-rail-request-evidence" />
          <ActionButton label="Route to decision verification" state={decisionVerificationAction} onClick={() => setShowRouteDecisionVerification(true)} testId="an-rail-route-decision-verification" />
          <ActionButton label="Route to legal-effect review" state={legalEffectReviewAction} onClick={() => setShowRouteLegalEffect(true)} testId="an-rail-route-legal-effect" />
          <ActionButton label="Route to foreign-decision review" state={foreignReviewAction} onClick={() => setShowRouteForeign(true)} testId="an-rail-route-foreign" />
          <ActionButton
            label="Route to exception review"
            state={exceptionAction}
            onClick={() => {
              setRouteExceptionDefaultType(undefined);
              setShowRouteException(true);
            }}
            testId="an-rail-route-exception"
          />

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ flex: 1 }}>
              <ActionButton label="Approve" state={approveAction} appearance="primary" onClick={() => setShowApprove(true)} testId="an-rail-approve" />
            </div>
            {!approveAction.enabled && !approvalGate.allowed && (
              <Button text="Why?" size="sm" appearance="ghost" type="button" onClick={() => setShowMakerCheckerBlocked(true)} testId="an-rail-approve-why" />
            )}
          </div>
          <ActionButton label="Reject" state={rejectAction} appearance="ghost" color="red" onClick={() => setShowReject(true)} testId="an-rail-reject" />
          {r.status === "APPROVED" && <ActionButton label="Register annulment" state={registerAction} appearance="primary" onClick={() => setShowRegister(true)} testId="an-rail-register" />}

          {r.status === "REGISTERED" && (
            <>
              <div className="crvs-banner crvs-banner-info">This annulment is registered. The record is read-only.</div>
              <Button text="Open registered record" appearance="ghost" block type="button" onClick={() => navigate(`/dashboard/crvs/registered-annulments/${r.id}`)} testId="an-rail-open-registered" />
            </>
          )}
        </aside>
      </div>

      <StartAnnulmentReviewModal show={showStart} onClose={() => setShowStart(false)} registration={r} onConfirm={handleConfirmStart} />
      <ActiveAnnulmentReviewConflictModal show={showConflictLock} onClose={() => setShowConflictLock(false)} registration={r} />
      <ConflictOfInterestBlockedModal show={showConflictOfInterest} onClose={() => setShowConflictOfInterest(false)} reasons={coiReasons} />
      <MakerCheckerBlockedModal show={showMakerCheckerBlocked} onClose={() => setShowMakerCheckerBlocked(false)} reasons={approvalGate.reasons} />

      <RequestAnnulmentCorrectionModal
        show={showRequestCorrection}
        onClose={() => setShowRequestCorrection(false)}
        registration={r}
        actorName={actorName}
        onRequested={(updated) => {
          setRegistration(updated);
          setShowRequestCorrection(false);
        }}
      />
      <RequestAnnulmentEvidenceModal
        show={showRequestEvidence}
        onClose={() => setShowRequestEvidence(false)}
        registration={r}
        actorName={actorName}
        onRequested={(updated) => {
          setRegistration(updated);
          setShowRequestEvidence(false);
        }}
      />

      <RouteToAnnulmentDecisionVerificationModal show={showRouteDecisionVerification} onClose={() => setShowRouteDecisionVerification(false)} registration={r} actorName={actorName} onRouted={setRegistration} />
      <RouteToAnnulmentLegalEffectReviewModal show={showRouteLegalEffect} onClose={() => setShowRouteLegalEffect(false)} registration={r} actorName={actorName} onRouted={setRegistration} />
      <RouteToAnnulmentForeignReviewModal show={showRouteForeign} onClose={() => setShowRouteForeign(false)} registration={r} actorName={actorName} onRouted={setRegistration} />
      <RouteToAnnulmentExceptionModal
        show={showRouteException}
        onClose={() => setShowRouteException(false)}
        registration={r}
        actorName={actorName}
        onRouted={setRegistration}
        defaultType={routeExceptionDefaultType}
      />

      {currentAccountId && (
        <>
          <ApproveAnnulmentRegistrationModal show={showApprove} onClose={() => setShowApprove(false)} registration={r} accountId={currentAccountId} actorName={actorName} onApproved={setRegistration} />
          <RejectAnnulmentRegistrationModal show={showReject} onClose={() => setShowReject(false)} registration={r} accountId={currentAccountId} actorName={actorName} onRejected={setRegistration} />
          <RegisterAnnulmentModal show={showRegister} onClose={() => setShowRegister(false)} registration={r} accountId={currentAccountId} actorName={actorName} onRegistered={setRegistration} />
        </>
      )}

      <RunAnnulmentDecisionVerificationModal show={showRunVerification} onClose={() => setShowRunVerification(false)} registration={r} actorName={actorName} onRun={setRegistration} />
      <CompleteAnnulmentDecisionVerificationModal
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

      <SelectLegalEffectClassificationModal
        show={showSelectClassification}
        onClose={() => setShowSelectClassification(false)}
        registration={r}
        actorName={actorName}
        onConfirmed={(updated) => {
          setRegistration(updated);
          setShowSelectClassification(false);
        }}
      />
      <LegalEffectManualReviewModal
        show={showLegalEffectManualReview}
        onClose={() => setShowLegalEffectManualReview(false)}
        registration={r}
        actorName={actorName}
        onRouted={(updated) => {
          setRegistration(updated);
          setShowLegalEffectManualReview(false);
        }}
      />
      <ConfirmEffectiveDateModal
        show={showConfirmEffectiveDate}
        onClose={() => setShowConfirmEffectiveDate(false)}
        registration={r}
        actorName={actorName}
        onConfirmed={(updated) => {
          setRegistration(updated);
          setShowConfirmEffectiveDate(false);
        }}
      />

      <ExistingDivorceConflictModal
        show={showDivorceConflict}
        onClose={() => setShowDivorceConflict(false)}
        conflicts={divorceConflicts}
        onRouteToException={() => {
          setShowDivorceConflict(false);
          setRouteExceptionDefaultType("EXISTING_DIVORCE_CONFLICT");
          setShowRouteException(true);
        }}
      />
      <ExistingJudicialSeparationConflictModal
        show={showSeparationConflict}
        onClose={() => setShowSeparationConflict(false)}
        onRouteToException={() => {
          setShowSeparationConflict(false);
          setRouteExceptionDefaultType("EXISTING_JUDICIAL_SEPARATION_CONFLICT");
          setShowRouteException(true);
        }}
      />
      <MarriageCorrectionConflictModal
        show={showCorrectionConflict}
        onClose={() => setShowCorrectionConflict(false)}
        onRouteToException={() => {
          setShowCorrectionConflict(false);
          setRouteExceptionDefaultType("MARRIAGE_CORRECTION_IN_PROGRESS");
          setShowRouteException(true);
        }}
      />

      <DocumentPreviewModal show={!!previewTarget} onClose={() => setPreviewTarget(undefined)} evidence={previewTarget} />
    </div>
  );
}
