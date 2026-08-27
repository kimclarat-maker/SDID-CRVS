import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import PageHeader from "@/components/public/PageHeader";
import Section from "@/components/public/Section";
import Notice from "@/components/public/Notice";
import StatusTimeline from "@/components/public/StatusTimeline";
import { demoGetMarriagePublicTrackingView } from "@/demo/services/crvsMarriagePublicTracking";
import { MarriagePublicTrackingView } from "@/domain/crvs/types";
import toastMessage from "@/utils/common/toastMessage";

/**
 * Public application-tracking page (route
 * /civil-registration/marriage/application/:reference). Calls ONLY
 * demoGetMarriagePublicTrackingView — never the raw MarriageApplication —
 * because that is the only function guaranteed to mask both spouses'
 * protected identity details before the data ever reaches this component
 * (spec: "must NOT reveal the partner's protected identity details through
 * an unverified tracking session"). If there's an open correction, this page
 * intentionally does NOT show a direct link to /respond/:token — the token
 * is only known to the applicant who received it, never derivable from the
 * public view.
 *
 * "Manage appointment" links to /civil-registration/marriage/appointment/
 * using this SAME application reference (not a separately-fetched
 * appointment reference, which the redacted tracking view never exposes) —
 * the appointment page resolves either an appointment's own reference/id or
 * an application reference/id, so this link always works.
 */
export default function MarriagePublicTracking() {
  const { reference } = useParams<{ reference: string }>();
  const [searchParams] = useSearchParams();
  const wantsCertificate = searchParams.get("certificate") === "1";

  const [view, setView] = useState<MarriagePublicTrackingView | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!reference) return;
    demoGetMarriagePublicTrackingView(reference).then(setView).finally(() => setLoading(false));
  }, [reference]);

  if (loading) {
    return <PageHeader title="Loading…" eyebrow="Civil registration" />;
  }

  if (!view) {
    return (
      <>
        <PageHeader title="Application not found" eyebrow="Civil registration" />
        <Section>
          <Notice type="warning" title="We couldn't find this application">
            Check the reference and try again, or contact a service centre for help.
          </Notice>
        </Section>
      </>
    );
  }

  const stages = view.timeline.map((t) => t.label);
  const currentIndex = Math.max(
    view.timeline.findIndex((t) => t.status === view.status),
    stages.length - 1
  );

  return (
    <>
      <PageHeader title={view.reference} eyebrow="Civil registration — application status" />
      <Section>
        <dl className="public-fact-list">
          <div>
            <dt>Applicants</dt>
            <dd>{view.maskedSpouseSummary}</dd>
          </div>
          <div>
            <dt>Office</dt>
            <dd>{view.officeName || "—"}</dd>
          </div>
          <div>
            <dt>Submitted</dt>
            <dd>{view.submittedAt ? view.submittedAt.slice(0, 10) : "—"}</dd>
          </div>
        </dl>

        {stages.length > 0 && (
          <div style={{ marginTop: "1.5rem" }}>
            <h3>Status timeline</h3>
            <StatusTimeline stages={stages} currentIndex={currentIndex} />
          </div>
        )}

        <Notice type="info" title="What happens next">
          {view.nextAction}
        </Notice>

        {view.hasOpenCorrection && (
          <Notice type="warning" title="A correction has been requested">
            A registration officer has requested corrections on this application. The secure response link was sent
            to the applicant who needs to respond — check your notification for that link. This page cannot show it
            directly, since it never identifies who holds the response token.
          </Notice>
        )}

        {view.hasOpenObjection && (
          <Notice type="warning" title="An objection is pending review">
            An objection has been raised against this application and is pending supervisor review. No further action
            is needed from you right now.
          </Notice>
        )}

        {view.appointment && (
          <Notice type="info" title="Appointment scheduled">
            {view.appointment.date} at {view.appointment.timeSlot}, {view.appointment.officeName}.{" "}
            <Link to={`/civil-registration/marriage/appointment/${view.reference}`}>Manage appointment</Link>
          </Notice>
        )}

        {wantsCertificate && (
          <Notice type={view.certificateEligible ? "success" : "info"} title="Marriage certificate">
            {view.certificateEligible ? (
              <>
                This application is registered and eligible for a certificate.{" "}
                <button
                  type="button"
                  className="public-btn public-btn-primary"
                  style={{ marginLeft: 8 }}
                  onClick={() =>
                    toastMessage("success", `Certificate request logged for ${view.reference}. A CRVS Registration Officer will process it.`)
                  }
                  data-testid="public-tracking-request-certificate"
                >
                  Request certificate
                </button>
                <p className="public-form-hint" style={{ marginTop: 8 }}>
                  This demo does not yet have a dedicated marriage-certificate request flow — this button only logs a
                  demo notification.
                </p>
              </>
            ) : (
              "This application is not registered yet, so a certificate cannot be requested until registration is complete."
            )}
          </Notice>
        )}

        <p className="public-form-hint" style={{ marginTop: "1.5rem" }}>
          This page never shows either applicant's full identity details — only a masked summary, status, and next
          steps.
        </p>
      </Section>
    </>
  );
}
