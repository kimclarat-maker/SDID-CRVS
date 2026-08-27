import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Empty from "@/components/empty";
import Button from "@/components/button";
import Icon from "@/components/icon";
import { DescriptionList, DescriptionItem } from "@/components/descriptionList";
import StatusBadge from "../../components/StatusBadge";
import StickyActionBar from "../../components/StickyActionBar";
import StructuredReasonModal from "@/components/crvs/modals/StructuredReasonModal";
import ApproveRescheduleModal from "./components/modals/ApproveRescheduleModal";
import ReassignOfficiantModal from "./components/modals/ReassignOfficiantModal";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { hasWorkspacePermission, getCurrentActorName } from "@/utils/workspace";
import { demoGetMarriageAppointment, demoCancelMarriageAppointment, demoRequestMarriageAppointmentReschedule } from "@/demo/services/crvsMarriageAppointments";
import { demoGetMarriageApplication } from "@/demo/services/crvsMarriageApplications";
import { canTransitionMarriageAppointment, MARRIAGE_APPOINTMENT_STATUS_LABELS } from "@/domain/crvs/statusMachines";
import { requiredDocumentsFor, witnessRequirementForSpouse } from "@/domain/crvs/marriagePolicyConfig";
import { MarriageAppointment, MarriageApplication } from "@/domain/crvs/types";
import { applicantDisplayName, formatDate, formatDateTime, currencyLabel } from "../../marriageShared";
import toastMessage from "@/utils/common/toastMessage";
import "../../shared.css";

const CANCEL_REASON_OPTIONS = [
  { value: "APPLICANT_REQUEST", label: "Applicant requested cancellation" },
  { value: "OFFICE_CLOSURE", label: "Office closure / unavailability" },
  { value: "INELIGIBLE", label: "Application no longer eligible" },
  { value: "OTHER", label: "Other" },
];

const RESCHEDULE_REASON_OPTIONS = [
  { value: "OFFICIANT_UNAVAILABLE", label: "Officiant unavailable" },
  { value: "OFFICE_CAPACITY", label: "Office capacity constraint" },
  { value: "APPLICANT_REQUEST", label: "Applicant requested a new date" },
  { value: "OTHER", label: "Other" },
];

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="crvs-form-hint">{label}</dt>
      <dd style={{ margin: 0 }}>{value}</dd>
    </div>
  );
}

export default function MarriageAppointmentDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const canView = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_APPOINTMENT_VIEW);
  const canReschedule = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_APPOINTMENT_RESCHEDULE);
  const canCancel = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_APPOINTMENT_CANCEL);

  const [appointment, setAppointment] = useState<MarriageAppointment | undefined>();
  const [application, setApplication] = useState<MarriageApplication | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  const [showApproveReschedule, setShowApproveReschedule] = useState(false);
  const [showReassign, setShowReassign] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [showRequestReschedule, setShowRequestReschedule] = useState(false);
  const [preferredDate, setPreferredDate] = useState("");

  const load = useCallback(() => {
    if (!id || !canView) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(undefined);
    demoGetMarriageAppointment(id)
      .then((found) => {
        if (!found) {
          setError("This appointment was not found.");
          return;
        }
        setAppointment(found);
        return demoGetMarriageApplication(found.applicationId).then(setApplication);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Couldn't load this appointment."))
      .finally(() => setLoading(false));
  }, [id, canView]);

  useEffect(() => {
    load();
  }, [load]);

  if (!canView) {
    return (
      <div className="crvs-page">
        <Empty icon="lock" title="You don't have access to marriage appointments" isFullScreen />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="crvs-page">
        <Empty icon="hourglass_empty" title="Loading appointment…" isFullScreen />
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="crvs-page">
        <Empty
          icon="error"
          title="Couldn't open this appointment"
          description={error || "This appointment was not found."}
          isFullScreen
          button={<Button text="Back to appointments" appearance="ghost" onClick={() => navigate("/dashboard/crvs/marriage-appointments")} testId="ma-details-back" />}
        />
      </div>
    );
  }

  const a = appointment;
  const canCancelNow = canTransitionMarriageAppointment(a.status, "CANCELLED");
  const canRequestRescheduleNow = canTransitionMarriageAppointment(a.status, "RESCHEDULE_REQUESTED");
  const canReassignNow = a.status !== "CANCELLED" && a.status !== "COMPLETED" && a.status !== "NO_SHOW";

  return (
    <div className="crvs-page">
      <div className="crvs-section" style={{ position: "sticky", top: 0, zIndex: 2, background: "var(--surface-page)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 className="crvs-page-title">{a.reference}</h1>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <StatusBadge kind="marriageAppointment" status={a.status} />
              <span>{a.officeName}</span>
              <span>{formatDate(a.date)} · {a.timeSlot}</span>
              {a.isSpecialDay && (
                <span className="crvs-status-pill crvs-status-warning">
                  <Icon name="star" /> Special day
                </span>
              )}
            </div>
          </div>
          <Button
            text="View application"
            appearance="ghost"
            type="button"
            onClick={() => navigate(`/dashboard/crvs/marriage-applications/${a.applicationId}`)}
            testId="ma-details-view-application"
          />
        </div>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <div className="crvs-section">
        <h3 className="crvs-section-title">Applicants</h3>
        {!application ? (
          <p className="crvs-form-hint">Couldn't load the parent application for this appointment.</p>
        ) : (
          <DescriptionList columns={2}>
            <DescriptionItem label="Applicant 1" value={applicantDisplayName(application.applicant1)} />
            <DescriptionItem label="Applicant 2" value={applicantDisplayName(application.applicant2)} />
            <DescriptionItem label="Application reference" value={application.reference} />
            <DescriptionItem label="Payment status" value={application.payment.status.replace(/_/g, " ")} />
            <DescriptionItem label="Payment amount" value={currencyLabel(application.payment.amount, application.payment.currency)} />
          </DescriptionList>
        )}
      </div>

      <div className="crvs-section">
        <h3 className="crvs-section-title">Schedule</h3>
        <dl className="review-readonly-fields">
          <Field label="Office" value={a.officeName} />
          <Field label="Room" value={a.room || "Not assigned"} />
          <Field label="Date" value={formatDate(a.date)} />
          <Field label="Time slot" value={a.timeSlot} />
          <Field label="Officiant" value={a.officiantName || "Unassigned"} />
          <Field label="Scheduled by" value={`${a.scheduledByName} · ${formatDateTime(a.scheduledAt)}`} />
          <Field label="Notes" value={a.notes || "—"} />
        </dl>
      </div>

      {application && (
        <div className="crvs-section">
          <h3 className="crvs-section-title">Documents &amp; witness readiness</h3>
          {([application.applicant1, application.applicant2] as const).map((applicant) => {
            const required = requiredDocumentsFor(applicant.nationalityCategory, applicant.civilStatus);
            const presentTypes = new Set(application.evidence.filter((e) => !e.removed).map((e) => e.documentType.toUpperCase()));
            const witnessRule = witnessRequirementForSpouse();
            const spouseWitnesses = application.witnesses.filter((w) => w.spouseRole === applicant.spouseRole && !w.replaced);
            const witnessOk = spouseWitnesses.length >= witnessRule.minimum;
            return (
              <div key={applicant.spouseRole} style={{ marginBottom: 12 }}>
                <strong>{applicantDisplayName(applicant)}</strong>
                <ul style={{ margin: "6px 0", paddingLeft: 20 }}>
                  {required.map((doc) => (
                    <li key={doc}>
                      {doc.replace(/_/g, " ")} — {presentTypes.has(doc.toUpperCase()) ? "Present" : "Missing"}
                    </li>
                  ))}
                </ul>
                <span className={`crvs-status-pill ${witnessOk ? "crvs-status-success" : "crvs-status-warning"}`}>
                  Witnesses: {spouseWitnesses.length}/{witnessRule.minimum} minimum
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div className="crvs-section">
        <h3 className="crvs-section-title">Reschedule requests &amp; history</h3>
        {a.pendingRescheduleRequest && (
          <div className="crvs-banner crvs-banner-warning" style={{ marginBottom: 8 }}>
            Pending reschedule request from {a.pendingRescheduleRequest.requestedBy.toLowerCase()} — {a.pendingRescheduleRequest.reason}
            {a.pendingRescheduleRequest.preferredDate && ` (preferred: ${formatDate(a.pendingRescheduleRequest.preferredDate)})`}
          </div>
        )}
        {a.rescheduleHistory.length === 0 ? (
          <p className="crvs-form-hint">No reschedule history recorded.</p>
        ) : (
          a.rescheduleHistory.map((r, i) => (
            <div key={i} className="crvs-banner crvs-banner-info" style={{ marginBottom: 8 }}>
              Moved from {formatDate(r.previousDate)} {r.previousTimeSlot} — requested by {r.requestedBy.toLowerCase()}: {r.reason}
              {r.approvedBy && ` — approved by ${r.approvedBy} (${formatDateTime(r.approvedAt)})`}
            </div>
          ))
        )}
      </div>

      <div className="crvs-section">
        <h3 className="crvs-section-title">Cancellation requests &amp; history</h3>
        {a.pendingCancelRequest && (
          <div className="crvs-banner crvs-banner-warning" style={{ marginBottom: 8 }}>
            Pending cancellation request from {a.pendingCancelRequest.requestedBy.toLowerCase()} — {a.pendingCancelRequest.reason}
          </div>
        )}
        {a.cancellationHistory.length === 0 ? (
          <p className="crvs-form-hint">No cancellation history recorded.</p>
        ) : (
          a.cancellationHistory.map((c, i) => (
            <div key={i} className="crvs-banner crvs-banner-danger" style={{ marginBottom: 8 }}>
              Requested by {c.requestedBy.toLowerCase()} — {c.reason} — {c.by} ({formatDateTime(c.at)})
            </div>
          ))
        )}
      </div>

      <StickyActionBar align="end">
        {a.status === "RESCHEDULE_REQUESTED" &&
          (canReschedule ? (
            <Button text="Approve reschedule" appearance="primary" type="button" onClick={() => setShowApproveReschedule(true)} testId="ma-details-approve-reschedule" />
          ) : (
            <span className="crvs-form-hint" title="You don't have permission to approve reschedules.">
              Approve reschedule (no permission)
            </span>
          ))}

        {canReschedule ? (
          <span title={!canReassignNow ? "This appointment can no longer be reassigned." : undefined}>
            <Button
              text="Reassign officiant"
              appearance="ghost"
              type="button"
              disabled={!canReassignNow}
              onClick={() => setShowReassign(true)}
              testId="ma-details-reassign"
            />
          </span>
        ) : (
          <span className="crvs-form-hint" title="You don't have permission to reassign officiants.">
            Reassign officiant (no permission)
          </span>
        )}

        {canReschedule ? (
          <span title={!canRequestRescheduleNow ? `Cannot request a reschedule while status is ${MARRIAGE_APPOINTMENT_STATUS_LABELS[a.status]}.` : undefined}>
            <Button
              text="Request reschedule"
              appearance="ghost"
              type="button"
              disabled={!canRequestRescheduleNow}
              onClick={() => {
                setPreferredDate("");
                setShowRequestReschedule(true);
              }}
              testId="ma-details-request-reschedule"
            />
          </span>
        ) : (
          <span className="crvs-form-hint" title="You don't have permission to request reschedules.">
            Request reschedule (no permission)
          </span>
        )}

        {canCancel ? (
          <span title={!canCancelNow ? `Cannot cancel while status is ${MARRIAGE_APPOINTMENT_STATUS_LABELS[a.status]}.` : undefined}>
            <Button
              text="Cancel appointment"
              appearance="primary"
              color="red"
              type="button"
              disabled={!canCancelNow}
              onClick={() => setShowCancel(true)}
              testId="ma-details-cancel"
            />
          </span>
        ) : (
          <span className="crvs-form-hint" title="You don't have permission to cancel appointments.">
            Cancel appointment (no permission)
          </span>
        )}
      </StickyActionBar>

      <ApproveRescheduleModal show={showApproveReschedule} onClose={() => setShowApproveReschedule(false)} appointment={a} onApproved={(updated) => { setAppointment(updated); setShowApproveReschedule(false); }} />

      <ReassignOfficiantModal show={showReassign} onClose={() => setShowReassign(false)} appointment={a} onReassigned={(updated) => { setAppointment(updated); setShowReassign(false); }} />

      <StructuredReasonModal
        show={showCancel}
        onClose={() => setShowCancel(false)}
        title="Cancel appointment"
        description={`${a.reference} — this also cancels the linked application if it hasn't moved past scheduling.`}
        reasonOptions={CANCEL_REASON_OPTIONS}
        noteRequired
        noteLabel="Cancellation details"
        requireConfirmation
        confirmationLabel="I confirm this appointment should be cancelled."
        submitLabel="Cancel appointment"
        destructive
        testId="cancel-appointment-modal"
        onSubmit={async ({ reason, note }) => {
          const label = CANCEL_REASON_OPTIONS.find((o) => o.value === reason)?.label || reason;
          const actorName = getCurrentActorName();
          const updated = demoCancelMarriageAppointment(a.id, `${label}: ${note}`, actorName);
          toastMessage("success", `${updated.reference} cancelled.`);
          setAppointment(updated);
          setShowCancel(false);
        }}
      />

      <StructuredReasonModal
        show={showRequestReschedule}
        onClose={() => setShowRequestReschedule(false)}
        title="Request reschedule"
        description={`${a.reference} — flags this appointment for reschedule; a staff member later finalizes the new slot via Approve reschedule.`}
        reasonOptions={RESCHEDULE_REASON_OPTIONS}
        noteLabel="Additional detail"
        submitLabel="Request reschedule"
        testId="request-reschedule-modal"
        onSubmit={async ({ reason, note }) => {
          const label = RESCHEDULE_REASON_OPTIONS.find((o) => o.value === reason)?.label || reason;
          const actorName = getCurrentActorName();
          const fullReason = note ? `${label}: ${note}` : label;
          const updated = demoRequestMarriageAppointmentReschedule(a.id, "STAFF", fullReason, preferredDate || undefined, actorName);
          toastMessage("success", `Reschedule requested for ${updated.reference}.`);
          setAppointment(updated);
          setShowRequestReschedule(false);
        }}
      >
        <div className="crvs-form-group">
          <label htmlFor="request-reschedule-preferred-date">Preferred new date (optional)</label>
          <input id="request-reschedule-preferred-date" type="date" value={preferredDate} onChange={(e) => setPreferredDate(e.target.value)} data-testid="request-reschedule-preferred-date" />
        </div>
      </StructuredReasonModal>
    </div>
  );
}
