import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../../shared.css";
import Empty from "@/components/empty";
import Button from "@/components/button";
import Icon from "@/components/icon";
import ConfirmActionModal from "@/components/crvs/modals/ConfirmActionModal";
import StructuredReasonModal from "@/components/crvs/modals/StructuredReasonModal";
import WarningModal from "@/components/crvs/modals/WarningModal";
import SuccessModal from "@/components/crvs/modals/SuccessModal";
import StickyActionBar from "../../components/StickyActionBar";
import { MarriageApplication, MarriageAppointment, MarriageCeremony, PropertyRegime, SpouseRole } from "@/domain/crvs/types";
import { demoGetMarriageApplication, demoRegisterMarriage } from "@/demo/services/crvsMarriageApplications";
import { demoGetMarriageAppointment } from "@/demo/services/crvsMarriageAppointments";
import { demoRunMarriageEligibilityCheck } from "@/demo/services/crvsMarriageEligibility";
import {
  demoStartMarriageCheckIn,
  demoCheckInMarriageApplicant,
  demoCheckInMarriageWitness,
  demoConfirmMarriageCeremonyDocuments,
  demoRecordMarriageCeremonyRechecks,
  demoConfirmMarriagePropertyRegime,
  demoRecordMarriageConsent,
  demoRecordMarriageCeremonyOutcome,
  MarriageCeremonyOutcomeInput,
} from "@/demo/services/crvsMarriageCeremony";
import { witnessRequirementForSpouse, marriagePolicyConfig, requiredDocumentsFor } from "@/domain/crvs/marriagePolicyConfig";
import { canApproveMarriageCase } from "@/utils/workspace/crvsRules";
import { getCurrentAccountId, getCurrentActorName, hasWorkspacePermission } from "@/utils/workspace";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import toastMessage from "@/utils/common/toastMessage";
import { applicantDisplayName, formatDate, formatDateTime } from "../../marriageShared";

const PROPERTY_REGIME_LABELS: Record<PropertyRegime, string> = {
  COMMUNITY_OF_PROPERTY: "Community of property",
  SEPARATION_OF_PROPERTY: "Separation of property",
  LIMITED_COMMUNITY_OF_PROPERTY: "Limited community of property",
};

function readiness(application: MarriageApplication, ceremony: MarriageCeremony) {
  const rule = witnessRequirementForSpouse();
  const witnesses1 = application.witnesses.filter((w) => w.spouseRole === "APPLICANT1" && !w.replaced).map((w) => w.id);
  const witnesses2 = application.witnesses.filter((w) => w.spouseRole === "APPLICANT2" && !w.replaced).map((w) => w.id);
  const checkedIn = new Set(ceremony.witnessCheckIns.filter((w) => w.checkedIn).map((w) => w.witnessId));
  const witnesses1Ready = witnesses1.filter((id) => checkedIn.has(id)).length >= rule.minimum;
  const witnesses2Ready = witnesses2.filter((id) => checkedIn.has(id)).length >= rule.minimum;

  const missing: string[] = [];
  if (!ceremony.applicant1CheckedIn) missing.push("applicant 1 check-in");
  if (!ceremony.applicant2CheckedIn) missing.push("applicant 2 check-in");
  if (!witnesses1Ready) missing.push("applicant 1 witness(es)");
  if (!witnesses2Ready) missing.push("applicant 2 witness(es)");
  if (!ceremony.requiredDocumentsConfirmed) missing.push("required documents");
  if (!ceremony.eligibilityRecheckPassed) missing.push("eligibility recheck");
  if (!ceremony.existingMarriageRecheckPassed) missing.push("existing-marriage recheck");
  if (!ceremony.consent.applicant1Consented || !ceremony.consent.applicant2Consented) missing.push("both consents");

  return { ready: missing.length === 0, missing, witnesses1Ready, witnesses2Ready };
}

export default function MarriageCeremonyWorkspace() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentAccountId = getCurrentAccountId();
  const actorName = getCurrentActorName();

  const canView = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_CEREMONY_VIEW);
  const canCheckIn = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_CHECKIN_MANAGE);
  const canConduct = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_CEREMONY_CONDUCT);
  const canRecordOutcome = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_CEREMONY_RECORD_OUTCOME);
  const canRegister = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_REGISTRATION_CREATE) && hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_REGISTRATION_APPROVE);

  const [application, setApplication] = useState<MarriageApplication | undefined>();
  const [appointment, setAppointment] = useState<MarriageAppointment | undefined>();
  const [ceremony, setCeremony] = useState<MarriageCeremony | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  const [regime, setRegime] = useState<PropertyRegime | "">("");
  const [applicant1Consent, setApplicant1Consent] = useState(false);
  const [applicant2Consent, setApplicant2Consent] = useState(false);
  const [showConsentDeclineReason, setShowConsentDeclineReason] = useState<SpouseRole | undefined>();
  const [showOutcomeReason, setShowOutcomeReason] = useState<Exclude<MarriageCeremonyOutcomeInput, "COMPLETED"> | undefined>();
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [showConsentDeclinedWarning, setShowConsentDeclinedWarning] = useState(false);
  const [showRegisterConfirm, setShowRegisterConfirm] = useState(false);
  const [showRegisterSuccess, setShowRegisterSuccess] = useState<string | undefined>();
  const [runningEligibility, setRunningEligibility] = useState(false);
  const [checkingIdentity, setCheckingIdentity] = useState<SpouseRole | undefined>();

  const load = useCallback(async () => {
    if (!id) {
      setLoading(false);
      setError("No application reference was provided.");
      return;
    }
    setLoading(true);
    setError(undefined);
    try {
      const app = await demoGetMarriageApplication(id);
      if (!app) {
        setError("This marriage application was not found.");
        return;
      }
      setApplication(app);
      if (!app.appointmentId) {
        setError("This application has no scheduled appointment yet.");
        return;
      }
      const appt = await demoGetMarriageAppointment(app.appointmentId);
      setAppointment(appt);
      const cer = demoStartMarriageCheckIn(app.id, app.appointmentId, actorName);
      setCeremony(cer);
      setRegime((app.propertyRegime as PropertyRegime) || "");
      setApplicant1Consent(cer.consent.applicant1Consented);
      setApplicant2Consent(cer.consent.applicant2Consented);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load this ceremony.");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const refreshApplication = async () => {
    if (!application) return;
    const updated = await demoGetMarriageApplication(application.id);
    if (updated) setApplication(updated);
  };

  if (!canView) {
    return (
      <div className="crvs-page">
        <Empty icon="lock" title="You don't have access to marriage ceremonies" isFullScreen />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="crvs-page">
        <Empty icon="hourglass_empty" title="Loading ceremony…" isFullScreen />
      </div>
    );
  }

  if (error || !application || !appointment || !ceremony) {
    return (
      <div className="crvs-page">
        <Empty
          icon="error"
          title="Couldn't open this ceremony"
          description={error || "This ceremony could not be loaded."}
          isFullScreen
          button={<Button text="Back to ceremony queue" appearance="ghost" onClick={() => navigate("/dashboard/crvs/marriage-ceremonies")} />}
        />
      </div>
    );
  }

  const a = application;
  const closed = ceremony.outcome !== "NOT_STARTED";
  const ready = readiness(a, ceremony);

  const checkInApplicant = async (spouseRole: SpouseRole) => {
    setCheckingIdentity(undefined);
    try {
      const updated = demoCheckInMarriageApplicant(ceremony.id, spouseRole, actorName);
      setCeremony(updated);
      toastMessage("success", `${spouseRole === "APPLICANT1" ? "Applicant 1" : "Applicant 2"} checked in.`);
      refreshApplication();
    } catch (err) {
      toastMessage("error", err);
    }
  };

  const checkInWitness = async (witnessId: string) => {
    try {
      const updated = demoCheckInMarriageWitness(ceremony.id, witnessId, actorName);
      setCeremony(updated);
      toastMessage("success", "Witness checked in.");
    } catch (err) {
      toastMessage("error", err);
    }
  };

  const confirmDocuments = async () => {
    try {
      const updated = demoConfirmMarriageCeremonyDocuments(ceremony.id, actorName);
      setCeremony(updated);
      toastMessage("success", "Required documents confirmed present.");
    } catch (err) {
      toastMessage("error", err);
    }
  };

  const runEligibilityRecheck = async () => {
    setRunningEligibility(true);
    try {
      await demoRunMarriageEligibilityCheck(a.id, actorName);
      const updated = demoRecordMarriageCeremonyRechecks(ceremony.id, { eligibilityRecheckPassed: true, existingMarriageRecheckPassed: ceremony.existingMarriageRecheckPassed ?? false }, actorName);
      setCeremony(updated);
      await refreshApplication();
      toastMessage("success", "Eligibility recheck confirmed passed.");
    } catch (err) {
      toastMessage("error", err);
    } finally {
      setRunningEligibility(false);
    }
  };

  const confirmExistingMarriageRecheck = async () => {
    try {
      const updated = demoRecordMarriageCeremonyRechecks(ceremony.id, { eligibilityRecheckPassed: ceremony.eligibilityRecheckPassed ?? false, existingMarriageRecheckPassed: true }, actorName);
      setCeremony(updated);
      toastMessage("success", "Confirmed no existing-marriage conflict.");
    } catch (err) {
      toastMessage("error", err);
    }
  };

  const recordConsent = async (a1: boolean, a2: boolean, declinedBy?: SpouseRole, declineReason?: string) => {
    try {
      const updated = demoRecordMarriageConsent(ceremony.id, { applicant1Consented: a1, applicant2Consented: a2, declinedBy, declineReason }, actorName);
      setCeremony(updated);
      if (updated.outcome === "CONSENT_DECLINED") {
        setShowConsentDeclinedWarning(true);
        await refreshApplication();
      } else {
        toastMessage("success", "Consent recorded for both applicants.");
      }
    } catch (err) {
      toastMessage("error", err);
    }
  };

  const handleConsentSubmit = () => {
    if (applicant1Consent && applicant2Consent) {
      recordConsent(true, true);
      return;
    }
    setShowConsentDeclineReason(!applicant1Consent ? "APPLICANT1" : "APPLICANT2");
  };

  const confirmRegime = async () => {
    if (!regime) return;
    try {
      const updated = demoConfirmMarriagePropertyRegime(ceremony.id, regime, actorName);
      setCeremony(updated);
      toastMessage("success", `Marriage regime confirmed: ${PROPERTY_REGIME_LABELS[regime]}.`);
    } catch (err) {
      toastMessage("error", err);
    }
  };

  const recordOutcome = async (outcome: MarriageCeremonyOutcomeInput, detail: { postponedReason?: string; noShowNote?: string; cancellationReason?: string }) => {
    try {
      const updated = demoRecordMarriageCeremonyOutcome(ceremony.id, outcome, detail, actorName);
      setCeremony(updated);
      toastMessage("success", `Ceremony outcome recorded: ${outcome.toLowerCase()}.`);
      await refreshApplication();
      setShowCompleteConfirm(false);
      setShowOutcomeReason(undefined);
    } catch (err) {
      toastMessage("error", err);
    }
  };

  const coiCheck = currentAccountId ? canApproveMarriageCase(currentAccountId, a, ceremony.officiantId) : { allowed: false, reasons: ["No account signed in."] };

  const handleRegister = async () => {
    if (!currentAccountId) return;
    try {
      const updated = demoRegisterMarriage(a.id, ceremony.id, appointment.id, currentAccountId, actorName);
      setApplication(updated);
      setShowRegisterConfirm(false);
      setShowRegisterSuccess(updated.registrationEvent?.registrationNumber);
      toastMessage("success", `Marriage registered as ${updated.registrationEvent?.registrationNumber}.`);
    } catch (err) {
      toastMessage("error", err);
    }
  };

  const witnesses1 = a.witnesses.filter((w) => w.spouseRole === "APPLICANT1" && !w.replaced);
  const witnesses2 = a.witnesses.filter((w) => w.spouseRole === "APPLICANT2" && !w.replaced);
  const checkedInIds = new Set(ceremony.witnessCheckIns.filter((w) => w.checkedIn).map((w) => w.witnessId));

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">{a.reference} — Ceremony workspace</h1>
        <p className="crvs-page-subtitle">{applicantDisplayName(a.applicant1)} &amp; {applicantDisplayName(a.applicant2)} · Attempt {ceremony.attemptNumber}</p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      {closed && ceremony.outcome !== "COMPLETED" && (
        <div className="crvs-banner crvs-banner-warning" style={{ marginBottom: 16 }}>
          This ceremony attempt ended as {ceremony.outcome.replace(/_/g, " ").toLowerCase()}. The workspace is now read-only.
          <Button text="Back to ceremony queue" appearance="ghost" size="sm" onClick={() => navigate("/dashboard/crvs/marriage-ceremonies")} testId="ceremony-back-to-queue" styles={{ marginLeft: 12 }} />
        </div>
      )}

      {/* 1. Appointment confirmation */}
      <div className="crvs-section">
        <h2 className="crvs-section-title">1. Appointment confirmation</h2>
        <dl className="review-readonly-fields">
          <div><dt>Office</dt><dd>{appointment.officeName}</dd></div>
          <div><dt>Date</dt><dd>{formatDate(appointment.date)} {appointment.timeSlot}</dd></div>
          <div><dt>Officiant</dt><dd>{appointment.officiantName || "Unassigned"}</dd></div>
        </dl>
      </div>

      {/* 2 & 3. Applicant check-in */}
      {(["APPLICANT1", "APPLICANT2"] as SpouseRole[]).map((role, idx) => {
        const applicant = role === "APPLICANT1" ? a.applicant1 : a.applicant2;
        const checkedIn = role === "APPLICANT1" ? ceremony.applicant1CheckedIn : ceremony.applicant2CheckedIn;
        return (
          <div className="crvs-section" key={role}>
            <h2 className="crvs-section-title">{idx + 2}. Applicant {idx + 1} check-in</h2>
            <dl className="review-readonly-fields">
              <div><dt>Name</dt><dd>{applicantDisplayName(applicant)}</dd></div>
              <div><dt>Document</dt><dd>{applicant.documentType} · {applicant.documentNumber || "—"}</dd></div>
              <div><dt>Status</dt><dd>{checkedIn ? "Checked in" : "Not checked in"}</dd></div>
            </dl>
            {!checkedIn && !closed && (
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <Button text={`Check in applicant ${idx + 1}`} appearance="primary" size="sm" disabled={!canCheckIn} onClick={() => setCheckingIdentity(role)} testId={`ceremony-checkin-${role}`} />
                <Button text="Flag identity mismatch" appearance="ghost" size="sm" color="red" onClick={() => toastMessage("info", "Escalate this case via marriage exceptions before proceeding.")} testId={`ceremony-flag-mismatch-${role}`} />
              </div>
            )}
          </div>
        );
      })}

      {/* 4. Witness check-in grouped by applicant */}
      <div className="crvs-section">
        <h2 className="crvs-section-title">4. Witness check-in</h2>
        {[{ role: "APPLICANT1" as SpouseRole, label: "Applicant 1's witnesses", list: witnesses1, ready: ready.witnesses1Ready }, { role: "APPLICANT2" as SpouseRole, label: "Applicant 2's witnesses", list: witnesses2, ready: ready.witnesses2Ready }].map((group) => (
          <div key={group.role} style={{ marginBottom: 12 }}>
            <h3 className="crvs-section-title" style={{ fontSize: "var(--font-size-body)" }}>{group.label}</h3>
            {!group.ready && (
              <div className="crvs-banner crvs-banner-warning">
                <Icon name="warning" /> Required witness missing — needs at least {witnessRequirementForSpouse().minimum} checked in.
              </div>
            )}
            {group.list.length === 0 ? (
              <p className="crvs-form-hint">No witnesses recorded.</p>
            ) : (
              group.list.map((w) => (
                <div key={w.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0" }}>
                  <span>{w.firstName} {w.lastName} — {w.relationship}</span>
                  {checkedInIds.has(w.id) ? (
                    <span className="crvs-status-pill crvs-status-success">Checked in</span>
                  ) : (
                    <Button text="Check in" size="sm" appearance="ghost" disabled={!canCheckIn || closed} onClick={() => checkInWitness(w.id)} testId={`ceremony-checkin-witness-${w.id}`} />
                  )}
                </div>
              ))
            )}
          </div>
        ))}
      </div>

      {/* 5. Required documents */}
      <div className="crvs-section">
        <h2 className="crvs-section-title">5. Required-document confirmation</h2>
        <p className="crvs-form-hint">Applicant 1 requires: {requiredDocumentsFor(a.applicant1.nationalityCategory, a.applicant1.civilStatus).join(", ")}</p>
        <p className="crvs-form-hint">Applicant 2 requires: {requiredDocumentsFor(a.applicant2.nationalityCategory, a.applicant2.civilStatus).join(", ")}</p>
        {ceremony.requiredDocumentsConfirmed ? (
          <span className="crvs-status-pill crvs-status-success">Confirmed present</span>
        ) : (
          <Button text="Confirm documents present" appearance="primary" size="sm" disabled={!canConduct || closed} onClick={confirmDocuments} testId="ceremony-confirm-documents" />
        )}
      </div>

      {/* 6. Eligibility recheck */}
      <div className="crvs-section">
        <h2 className="crvs-section-title">6. Eligibility recheck</h2>
        {ceremony.eligibilityRecheckPassed ? (
          <span className="crvs-status-pill crvs-status-success">Passed</span>
        ) : (
          <Button text="Re-run and confirm eligibility recheck" appearance="primary" size="sm" loading={runningEligibility} disabled={!canConduct || closed} onClick={runEligibilityRecheck} testId="ceremony-eligibility-recheck" />
        )}
      </div>

      {/* 7. Existing-marriage conflict recheck */}
      <div className="crvs-section">
        <h2 className="crvs-section-title">7. Existing-marriage conflict recheck</h2>
        {ceremony.existingMarriageRecheckPassed ? (
          <span className="crvs-status-pill crvs-status-success">No conflict found</span>
        ) : (
          <Button text="Confirm no existing-marriage conflict" appearance="primary" size="sm" disabled={!canConduct || closed} onClick={confirmExistingMarriageRecheck} testId="ceremony-existing-marriage-recheck" />
        )}
      </div>

      {/* 8. Consent and declarations */}
      <div className="crvs-section">
        <h2 className="crvs-section-title">8. Consent and declarations</h2>
        {ceremony.outcome === "CONSENT_DECLINED" ? (
          <div className="crvs-banner crvs-banner-danger">Consent was declined by {ceremony.consent.declinedBy}. Registration is blocked.</div>
        ) : ceremony.consent.applicant1Consented && ceremony.consent.applicant2Consented ? (
          <span className="crvs-status-pill crvs-status-success">Both applicants consented</span>
        ) : (
          !closed && (
            <>
              <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="checkbox" checked={applicant1Consent} onChange={(e) => setApplicant1Consent(e.target.checked)} disabled={!canConduct} /> Applicant 1 consents
              </label>
              <label style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
                <input type="checkbox" checked={applicant2Consent} onChange={(e) => setApplicant2Consent(e.target.checked)} disabled={!canConduct} /> Applicant 2 consents
              </label>
              <Button text="Record consent" appearance="primary" size="sm" disabled={!canConduct} onClick={handleConsentSubmit} testId="ceremony-record-consent" styles={{ marginTop: 8 }} />
            </>
          )
        )}
      </div>

      {/* 9. Marriage/property-regime confirmation */}
      <div className="crvs-section">
        <h2 className="crvs-section-title">9. Marriage / property-regime confirmation</h2>
        {a.propertyRegime ? (
          <span className="crvs-status-pill crvs-status-success">{PROPERTY_REGIME_LABELS[a.propertyRegime]}</span>
        ) : (
          !closed && (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <select value={regime} onChange={(e) => setRegime(e.target.value as PropertyRegime)} disabled={!canConduct}>
                <option value="">Select regime…</option>
                {marriagePolicyConfig.propertyRegimes.map((r) => (
                  <option key={r} value={r}>{PROPERTY_REGIME_LABELS[r]}</option>
                ))}
              </select>
              <Button text="Confirm regime" appearance="primary" size="sm" disabled={!canConduct || !regime} onClick={confirmRegime} testId="ceremony-confirm-regime" />
            </div>
          )
        )}
      </div>

      {/* 10. Officiant details */}
      <div className="crvs-section">
        <h2 className="crvs-section-title">10. Officiant details</h2>
        <p className="crvs-form-hint">{ceremony.officiantName ? `${ceremony.officiantName} (assigned via appointment)` : "No officiant assigned yet — reassign from the appointment detail page."}</p>
        <Button text="View appointment" appearance="ghost" size="sm" onClick={() => navigate(`/dashboard/crvs/marriage-appointments/${appointment.id}`)} testId="ceremony-view-appointment" />
      </div>

      {/* 11. Ceremony outcome */}
      <div className="crvs-section">
        <h2 className="crvs-section-title">11. Ceremony outcome</h2>
        {!ready.ready && !closed && (
          <div className="crvs-banner crvs-banner-warning">Missing: {ready.missing.join(", ")}</div>
        )}
        {!closed && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span title={!ready.ready ? `Missing: ${ready.missing.join(", ")}` : undefined}>
              <Button text="Complete" appearance="primary" disabled={!canRecordOutcome || !ready.ready} onClick={() => setShowCompleteConfirm(true)} testId="ceremony-outcome-complete" />
            </span>
            <Button text="Postpone" appearance="ghost" disabled={!canRecordOutcome} onClick={() => setShowOutcomeReason("POSTPONED")} testId="ceremony-outcome-postpone" />
            <Button text="No-show" appearance="ghost" disabled={!canRecordOutcome} onClick={() => setShowOutcomeReason("NO_SHOW")} testId="ceremony-outcome-noshow" />
            <Button text="Cancel" appearance="ghost" color="red" disabled={!canRecordOutcome} onClick={() => setShowOutcomeReason("CANCELLED")} testId="ceremony-outcome-cancel" />
          </div>
        )}
        {ceremony.outcome !== "NOT_STARTED" && <p className="crvs-form-hint" style={{ marginTop: 8 }}>Outcome: {ceremony.outcome.replace(/_/g, " ").toLowerCase()}</p>}
      </div>

      {/* 12. Registration preview */}
      {ceremony.outcome === "COMPLETED" && a.status === "CEREMONY_COMPLETED" && (
        <div className="crvs-section">
          <h2 className="crvs-section-title">12. Registration preview</h2>
          <dl className="review-readonly-fields">
            <div><dt>Spouse 1</dt><dd>{applicantDisplayName(a.applicant1)}</dd></div>
            <div><dt>Spouse 2</dt><dd>{applicantDisplayName(a.applicant2)}</dd></div>
            <div><dt>Marriage date</dt><dd>{formatDate(a.proposedMarriageDate)}</dd></div>
            <div><dt>Office</dt><dd>{a.officeName}</dd></div>
            <div><dt>Property regime</dt><dd>{a.propertyRegime ? PROPERTY_REGIME_LABELS[a.propertyRegime] : "—"}</dd></div>
            <div><dt>Officiant</dt><dd>{ceremony.officiantName || "—"}</dd></div>
          </dl>
          {!coiCheck.allowed && (
            <div className="crvs-banner crvs-banner-warning" style={{ marginTop: 8 }}>Cannot register: {coiCheck.reasons.join(" ")}</div>
          )}
          <span title={!coiCheck.allowed ? coiCheck.reasons.join(" ") : undefined}>
            <Button
              text="Register marriage"
              appearance="primary"
              disabled={!canRegister || !coiCheck.allowed}
              onClick={() => setShowRegisterConfirm(true)}
              testId="ceremony-register-marriage"
              styles={{ marginTop: 12 }}
            />
          </span>
        </div>
      )}

      <StickyActionBar align="between">
        <span className="crvs-form-hint">{a.reference} · {a.status.replace(/_/g, " ")}</span>
        {ceremony.outcome === "COMPLETED" && a.status === "CEREMONY_COMPLETED" && (
          <span title={!coiCheck.allowed ? coiCheck.reasons.join(" ") : undefined}>
            <Button text="Register marriage" appearance="primary" disabled={!canRegister || !coiCheck.allowed} onClick={() => setShowRegisterConfirm(true)} testId="ceremony-sticky-register" />
          </span>
        )}
      </StickyActionBar>

      <ConfirmActionModal
        show={!!checkingIdentity}
        onClose={() => setCheckingIdentity(undefined)}
        onConfirm={async () => checkingIdentity && checkInApplicant(checkingIdentity)}
        title="Check in applicant"
        description={checkingIdentity ? applicantDisplayName(checkingIdentity === "APPLICANT1" ? a.applicant1 : a.applicant2) : undefined}
        confirmLabel="Confirm identity and check in"
        testId="ceremony-checkin-confirm-modal"
      >
        <p style={{ margin: 0 }}>Confirm this person's identity matches the documents on file before checking them in.</p>
      </ConfirmActionModal>

      <ConfirmActionModal
        show={showCompleteConfirm}
        onClose={() => setShowCompleteConfirm(false)}
        onConfirm={async () => recordOutcome("COMPLETED", {})}
        title="Complete ceremony"
        description={a.reference}
        confirmLabel="Complete ceremony"
        testId="ceremony-complete-confirm-modal"
      >
        <p style={{ margin: 0 }}>This records the ceremony as completed. Registration is a separate, explicit next step.</p>
      </ConfirmActionModal>

      <StructuredReasonModal
        show={!!showOutcomeReason}
        onClose={() => setShowOutcomeReason(undefined)}
        onSubmit={async ({ reason, note }) => {
          if (!showOutcomeReason) return;
          const detail = showOutcomeReason === "POSTPONED" ? { postponedReason: note || reason } : showOutcomeReason === "NO_SHOW" ? { noShowNote: note || reason } : { cancellationReason: note || reason };
          await recordOutcome(showOutcomeReason, detail);
        }}
        title={showOutcomeReason === "POSTPONED" ? "Postpone ceremony" : showOutcomeReason === "NO_SHOW" ? "Record no-show" : "Cancel ceremony"}
        description={a.reference}
        reasonOptions={[
          { value: "Officiant unavailable", label: "Officiant unavailable" },
          { value: "Applicant unavailable", label: "Applicant unavailable" },
          { value: "Documentation incomplete", label: "Documentation incomplete" },
          { value: "Other", label: "Other" },
        ]}
        noteLabel="Detail"
        submitLabel="Confirm"
        destructive={showOutcomeReason === "CANCELLED"}
        testId="ceremony-outcome-reason-modal"
      />

      <StructuredReasonModal
        show={!!showConsentDeclineReason}
        onClose={() => setShowConsentDeclineReason(undefined)}
        onSubmit={async ({ reason, note }) => {
          if (!showConsentDeclineReason) return;
          await recordConsent(applicant1Consent, applicant2Consent, showConsentDeclineReason, note || reason);
          setShowConsentDeclineReason(undefined);
        }}
        title="Consent declined"
        description={showConsentDeclineReason ? applicantDisplayName(showConsentDeclineReason === "APPLICANT1" ? a.applicant1 : a.applicant2) : undefined}
        reasonOptions={[
          { value: "Not voluntary", label: "Consent was not given voluntarily" },
          { value: "Changed mind", label: "Applicant changed their mind" },
          { value: "Other", label: "Other" },
        ]}
        noteLabel="Detail"
        noteRequired
        submitLabel="Record decline"
        destructive
        testId="ceremony-consent-decline-modal"
      />

      <WarningModal
        show={showConsentDeclinedWarning}
        onClose={() => setShowConsentDeclinedWarning(false)}
        title="Consent declined — registration blocked"
        testId="ceremony-consent-declined-warning-modal"
      >
        <p style={{ margin: 0 }}>This application has been rejected. Registration cannot proceed for this ceremony attempt.</p>
      </WarningModal>

      <ConfirmActionModal
        show={showRegisterConfirm}
        onClose={() => setShowRegisterConfirm(false)}
        onConfirm={handleRegister}
        title="Register marriage"
        description={a.reference}
        confirmLabel="Register"
        testId="ceremony-register-confirm-modal"
      >
        <p style={{ margin: 0 }}>This creates the immutable marriage registration record and triggers SDID synchronization for both spouses.</p>
      </ConfirmActionModal>

      <SuccessModal
        show={!!showRegisterSuccess}
        onClose={() => setShowRegisterSuccess(undefined)}
        title="Marriage registered"
        description={showRegisterSuccess ? `Registration number: ${showRegisterSuccess}` : undefined}
        primaryLabel="View registered marriage"
        onPrimary={() => navigate(`/dashboard/crvs/registered-marriages/${a.id}`)}
        testId="ceremony-register-success-modal"
      />
    </div>
  );
}
