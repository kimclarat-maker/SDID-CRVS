import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PageHeader from "@/components/public/PageHeader";
import Section from "@/components/public/Section";
import Notice from "@/components/public/Notice";
import {
  demoGetMarriageAppointment,
  demoRequestMarriageAppointmentReschedule,
  demoRequestMarriageAppointmentCancel,
} from "@/demo/services/crvsMarriageAppointments";
import { demoGetMarriageApplication } from "@/demo/services/crvsMarriageApplications";
import { requiredDocumentsFor, witnessRequirementForSpouse } from "@/domain/crvs/marriagePolicyConfig";
import { MARRIAGE_APPOINTMENT_STATUS_LABELS } from "@/domain/crvs/statusMachines";
import { MarriageApplication, MarriageAppointment } from "@/domain/crvs/types";
import { applicantDisplayName, formatDate } from "@/screens/dashboard/crvs/marriageShared";
import { generateIcsFile } from "@/utils/common/generateIcs";
import toastMessage from "@/utils/common/toastMessage";

const PUBLIC_ACTOR_NAME = "Public applicant";

const humanizeDocument = (value: string): string =>
  value
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");

/** Best-effort parse of "date" + "timeSlot" (e.g. "09:00-09:30" or "09:00")
 * into an ISO datetime for the .ics download. Falls back to midnight on the
 * appointment date if the time slot can't be parsed. */
function combineDateAndSlotToIso(date: string, timeSlot: string): string {
  const match = timeSlot.match(/(\d{1,2}):(\d{2})/);
  const datePart = date.slice(0, 10);
  if (!match) return `${datePart}T00:00:00`;
  const hh = match[1].padStart(2, "0");
  const mm = match[2];
  return `${datePart}T${hh}:${mm}:00`;
}

/**
 * Public appointment-management page (route
 * /civil-registration/marriage/appointment/:reference). The :reference
 * param can be EITHER the appointment's own id/reference OR the parent
 * application's id/reference — resolved here rather than requiring the
 * caller to know which one it has, since the redacted public tracking view
 * (crvsMarriagePublicTracking.ts) never exposes the appointment's own
 * reference, only date/time/office. This page is allowed to call
 * demoGetMarriageAppointment/demoGetMarriageApplication directly (unlike the
 * tracking page) since it's used only once an appointment already exists.
 *
 * Applicants may only REQUEST a reschedule/cancellation here — never
 * demoApproveMarriageAppointmentReschedule or demoCancelMarriageAppointment,
 * which are staff-only actions that finalize a change without further
 * review.
 */
export default function MarriageAppointmentManage() {
  const { reference } = useParams<{ reference: string }>();
  const [appointment, setAppointment] = useState<MarriageAppointment | undefined>();
  const [application, setApplication] = useState<MarriageApplication | undefined>();
  const [loading, setLoading] = useState(true);

  const [showReschedule, setShowReschedule] = useState(false);
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!reference) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      let found = await demoGetMarriageAppointment(reference);
      if (!found) {
        const app = await demoGetMarriageApplication(reference);
        if (app?.appointmentId) {
          found = await demoGetMarriageAppointment(app.appointmentId);
        }
      }
      if (cancelled) return;
      setAppointment(found);
      if (found) {
        const app = await demoGetMarriageApplication(found.applicationId);
        if (!cancelled) setApplication(app);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [reference]);

  const handleAddToCalendar = () => {
    if (!appointment) return;
    generateIcsFile({
      title: `Marriage appointment — ${appointment.applicationReference}`,
      description: "Civil marriage ceremony appointment. Arrive 15 minutes early with original documents.",
      location: [appointment.officeName, appointment.room].filter(Boolean).join(", "),
      startIso: combineDateAndSlotToIso(appointment.date, appointment.timeSlot),
      durationMinutes: 30,
    });
    toastMessage("success", "Calendar file downloaded.");
  };

  const handleRequestReschedule = async () => {
    if (!appointment) return;
    if (!rescheduleReason.trim()) {
      toastMessage("error", "Enter a reason for requesting a reschedule.");
      return;
    }
    setBusy(true);
    try {
      const updated = demoRequestMarriageAppointmentReschedule(appointment.id, "APPLICANT", rescheduleReason.trim(), preferredDate || undefined, PUBLIC_ACTOR_NAME);
      setAppointment(updated);
      setShowReschedule(false);
      toastMessage("success", "Reschedule request submitted for staff review.");
    } catch (err) {
      toastMessage("error", err);
    } finally {
      setBusy(false);
    }
  };

  const handleRequestCancel = async () => {
    if (!appointment) return;
    if (!cancelReason.trim()) {
      toastMessage("error", "Enter a reason for requesting cancellation.");
      return;
    }
    setBusy(true);
    try {
      const updated = demoRequestMarriageAppointmentCancel(appointment.id, "APPLICANT", cancelReason.trim(), PUBLIC_ACTOR_NAME);
      setAppointment(updated);
      setShowCancel(false);
      toastMessage("success", "Cancellation request submitted for staff review.");
    } catch (err) {
      toastMessage("error", err);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <PageHeader title="Loading…" eyebrow="Civil registration" />;
  }

  if (!appointment) {
    return (
      <>
        <PageHeader title="Appointment not found" eyebrow="Civil registration" />
        <Section>
          <Notice type="warning" title="We couldn't find this appointment">
            Check the reference and try again — you can use either your appointment reference or your application
            reference. Contact a service centre for help.
          </Notice>
        </Section>
      </>
    );
  }

  const canRequestChanges = appointment.status === "SCHEDULED";
  const hasPendingRequest = appointment.status === "RESCHEDULE_REQUESTED" || appointment.status === "CANCEL_REQUESTED";

  return (
    <>
      <PageHeader title={appointment.reference} eyebrow="Civil registration — appointment" description={appointment.applicationReference} />
      <Section>
        <dl className="public-fact-list">
          <div>
            <dt>Status</dt>
            <dd>{MARRIAGE_APPOINTMENT_STATUS_LABELS[appointment.status]}</dd>
          </div>
          <div>
            <dt>Date</dt>
            <dd>{formatDate(appointment.date)}</dd>
          </div>
          <div>
            <dt>Time</dt>
            <dd>{appointment.timeSlot}</dd>
          </div>
          <div>
            <dt>Office</dt>
            <dd>{appointment.officeName}</dd>
          </div>
          {appointment.room && (
            <div>
              <dt>Room</dt>
              <dd>{appointment.room}</dd>
            </div>
          )}
          {appointment.officiantName && (
            <div>
              <dt>Officiant</dt>
              <dd>{appointment.officiantName}</dd>
            </div>
          )}
        </dl>

        {hasPendingRequest && appointment.pendingRescheduleRequest && (
          <Notice type="warning" title="Reschedule request pending staff review">
            Requested: {appointment.pendingRescheduleRequest.reason}
            {appointment.pendingRescheduleRequest.preferredDate ? ` — preferred date ${formatDate(appointment.pendingRescheduleRequest.preferredDate)}` : ""}.
            Staff must review and approve this before the appointment changes — it has not been changed yet.
          </Notice>
        )}
        {hasPendingRequest && appointment.pendingCancelRequest && (
          <Notice type="warning" title="Cancellation request pending staff review">
            Requested: {appointment.pendingCancelRequest.reason}. Staff must review this before the appointment is
            cancelled — it has not been cancelled yet.
          </Notice>
        )}
        {appointment.status === "CANCELLED" && (
          <Notice type="danger" title="This appointment has been cancelled">
            Contact your service office if you need to schedule a new appointment.
          </Notice>
        )}
        {appointment.status === "COMPLETED" && (
          <Notice type="success" title="This appointment has been completed">
            The ceremony has already taken place for this appointment.
          </Notice>
        )}
        {appointment.status === "NO_SHOW" && (
          <Notice type="warning" title="This appointment was marked as a no-show">
            Contact your service office to arrange a new appointment.
          </Notice>
        )}

        <div style={{ marginTop: "1.5rem" }}>
          <h3>Arrival instructions</h3>
          <ul>
            <li>Arrive at least 15 minutes before your scheduled time.</li>
            <li>Both applicants must attend in person — this cannot be completed by one applicant alone.</li>
            <li>Bring original identity and supporting documents (copies are not accepted at check-in).</li>
            <li>Bring all required witnesses — they must also bring valid identification.</li>
          </ul>
        </div>

        {application && (
          <div className="public-grid public-grid-2" style={{ marginTop: "1.5rem" }}>
            {[application.applicant1, application.applicant2].map((applicant) => {
              const docs = requiredDocumentsFor(applicant.nationalityCategory, applicant.civilStatus);
              const witnessRule = witnessRequirementForSpouse();
              const witnessCount = application.witnesses.filter((w) => w.spouseRole === applicant.spouseRole && !w.replaced).length;
              return (
                <div className="public-card" key={applicant.spouseRole}>
                  <h3>{applicantDisplayName(applicant)}</h3>
                  <p className="public-form-hint">Required documents</p>
                  <ul>
                    {docs.map((doc) => (
                      <li key={doc}>{humanizeDocument(doc)}</li>
                    ))}
                  </ul>
                  <p className="public-form-hint">
                    Witnesses: {witnessCount} of {witnessRule.minimum}–{witnessRule.maximum} required (each at least{" "}
                    {witnessRule.minimumAge} years old)
                  </p>
                </div>
              );
            })}
          </div>
        )}

        <div className="public-hero-actions" style={{ marginTop: "1.5rem" }}>
          <button type="button" className="public-btn public-btn-primary" onClick={handleAddToCalendar} data-testid="marriage-appointment-add-to-calendar">
            Add to calendar
          </button>
          {canRequestChanges && (
            <>
              <button
                type="button"
                className="public-btn public-btn-secondary"
                onClick={() => setShowReschedule((v) => !v)}
                data-testid="marriage-appointment-reschedule-toggle"
              >
                Request reschedule
              </button>
              <button
                type="button"
                className="public-btn public-btn-outline"
                onClick={() => setShowCancel((v) => !v)}
                data-testid="marriage-appointment-cancel-toggle"
              >
                Request cancellation
              </button>
            </>
          )}
        </div>
        {!canRequestChanges && !hasPendingRequest && (
          <p className="public-form-hint" style={{ marginTop: 8 }}>
            Reschedule and cancellation requests are only available while this appointment is scheduled.
          </p>
        )}

        {showReschedule && canRequestChanges && (
          <div className="public-card" style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: 10 }}>
            <Notice type="info" title="Staff review required">
              This only submits a request — staff must review and approve it before your appointment date or time
              changes. Your current appointment stays in place until then.
            </Notice>
            <label>
              Reason
              <textarea value={rescheduleReason} onChange={(e) => setRescheduleReason(e.target.value)} rows={3} data-testid="marriage-appointment-reschedule-reason" />
            </label>
            <label>
              Preferred date (optional)
              <input type="date" value={preferredDate} onChange={(e) => setPreferredDate(e.target.value)} data-testid="marriage-appointment-reschedule-date" />
            </label>
            <div className="public-hero-actions">
              <button type="button" className="public-btn public-btn-primary" onClick={handleRequestReschedule} disabled={busy} data-testid="marriage-appointment-reschedule-submit">
                Submit request
              </button>
            </div>
          </div>
        )}

        {showCancel && canRequestChanges && (
          <div className="public-card" style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: 10 }}>
            <Notice type="warning" title="Staff review required">
              This only submits a request — staff must review it before your appointment is cancelled. Your
              appointment stays scheduled until then.
            </Notice>
            <label>
              Reason
              <textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} rows={3} data-testid="marriage-appointment-cancel-reason" />
            </label>
            <div className="public-hero-actions">
              <button type="button" className="public-btn public-btn-primary" onClick={handleRequestCancel} disabled={busy} data-testid="marriage-appointment-cancel-submit">
                Submit request
              </button>
            </div>
          </div>
        )}
      </Section>
    </>
  );
}
