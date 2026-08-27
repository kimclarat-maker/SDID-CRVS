import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import PageHeader from "@/components/public/PageHeader";
import Section from "@/components/public/Section";
import Notice from "@/components/public/Notice";
import StatusTimeline from "@/components/public/StatusTimeline";
import { demoGetDivorcePublicTrackingView } from "@/demo/services/crvsDivorcePublicTracking";
import { DIVORCE_REGISTRATION_STATUS_LABELS } from "@/domain/crvs/statusMachines";
import { divorcePolicyConfig } from "@/domain/crvs/divorcePolicyConfig";
import { DivorcePublicTrackingView } from "@/domain/crvs/types";
import { formatDateTime } from "../divorceShared";
import toastMessage from "@/utils/common/toastMessage";
import "../divorcePublic.css";

/**
 * Public tracking page (route /civil-registration/divorce/case/:reference).
 *
 * Calls ONLY demoGetDivorcePublicTrackingView. That projection is the sole
 * function guaranteed to have stripped everything this page must never show
 * — the judgment's content, restricted attachments, internal staff notes,
 * audit metadata, and the other former spouse's personal details (spec §11).
 * Fetching the DivorceRegistration itself here, even to read one extra
 * field, would defeat that guarantee, so this page never does.
 *
 * When there is an open correction, this page deliberately does NOT link to
 * /respond/:token. The token is known only to the applicant who was sent it
 * and is never derivable from the public view — anyone holding a reference
 * could otherwise open someone else's correction form.
 */
export default function DivorcePublicTracking() {
  const { reference } = useParams<{ reference: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const requestedDocument = searchParams.get("request");
  const wantsRecord = requestedDocument === "record";
  const wantsCertificate = requestedDocument === "certificate";

  const [view, setView] = useState<DivorcePublicTrackingView | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!reference) return;
    let cancelled = false;
    demoGetDivorcePublicTrackingView(reference)
      .then((found) => {
        if (!cancelled) setView(found);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reference]);

  if (loading) {
    return <PageHeader title="Loading…" eyebrow="Civil registration" />;
  }

  if (!view) {
    return (
      <>
        <PageHeader
          title="We couldn't find that registration"
          eyebrow="Civil registration"
          breadcrumb={[
            { label: "Home", href: "/" },
            { label: "Divorce registration", href: "/civil-registration/divorce" },
            { label: "Not found" },
          ]}
        />
        <Section>
          <Notice type="warning" title="Check the reference and try again">
            References look like DR-DEMO-2026-0001. If you have lost yours, a service centre can help you find it — we
            cannot search by name on this page, to protect people's privacy.
          </Notice>
          <div className="public-hero-actions" style={{ marginTop: "1.5rem" }}>
            <button type="button" className="public-btn public-btn-primary" onClick={() => navigate("/civil-registration/divorce")} data-testid="divorce-tracking-back">
              Back to divorce registration
            </button>
            <button type="button" className="public-btn public-btn-outline" onClick={() => navigate("/help")} data-testid="divorce-tracking-help-notfound">
              Get help
            </button>
          </div>
        </Section>
      </>
    );
  }

  const stages = view.timeline.map((entry) => entry.label);
  const foundIndex = view.timeline.findIndex((entry) => entry.status === view.status);
  const currentIndex = foundIndex >= 0 ? foundIndex : Math.max(0, stages.length - 1);

  return (
    <>
      <PageHeader
        title={view.reference}
        description="Divorce registration status"
        eyebrow="Civil registration"
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "Divorce registration", href: "/civil-registration/divorce" },
          { label: view.reference },
        ]}
      />

      <Section>
        <dl className="public-fact-list">
          <div>
            <dt>Reference</dt>
            <dd>{view.reference}</dd>
          </div>
          <div>
            <dt>Submitted</dt>
            <dd>{view.submittedAt ? formatDateTime(view.submittedAt) : "Not submitted yet"}</dd>
          </div>
          <div>
            <dt>Processing office</dt>
            <dd>{view.processingOfficeName || "—"}</dd>
          </div>
          <div>
            <dt>Current status</dt>
            <dd>{DIVORCE_REGISTRATION_STATUS_LABELS[view.status]}</dd>
          </div>
        </dl>

        {stages.length > 0 && (
          <div style={{ marginTop: "1.5rem" }}>
            <h2>Progress</h2>
            <StatusTimeline stages={stages} currentIndex={currentIndex} />
          </div>
        )}

        <Notice type="info" title="What happens next">
          {view.nextAction}
        </Notice>

        {view.applicantActionRequired && (
          <Notice type="warning" title="Something is needed from you">
            This request cannot move forward until you respond. Use the secure response link that was sent to the phone
            number or email address given on the request. You have {divorcePolicyConfig.sla.correctionResponseDays} days
            from the date of the request to reply.
          </Notice>
        )}

        {view.hasOpenCorrection && (
          <Notice type="warning" title="A correction has been requested">
            A registration officer has asked for a correction on this request. The secure response link was sent to
            whoever submitted it — check your messages for that link. This page cannot show or recreate the link,
            because it never identifies who holds it.
          </Notice>
        )}

        {view.additionalEvidenceRequested && (
          <Notice type="warning" title="Additional documents have been requested">
            One or more documents need to be provided or replaced. You can upload them through the same secure response
            link, which also lists exactly what is needed.
          </Notice>
        )}

        {view.registrationCompleted && (
          <Notice type="success" title="This divorce has been registered">
            The divorce is now recorded in the civil register. The marriage record has been marked as dissolved — it is
            not deleted — and both former spouses' civil status is being updated to divorced.
          </Notice>
        )}

        {(wantsRecord || wantsCertificate) && (
          <Notice
            type={view.certificateEligible ? "success" : "info"}
            title={wantsCertificate ? "Divorce certificate" : "Divorce record"}
          >
            {view.certificateEligible ? (
              <>
                This divorce is registered and a {wantsCertificate ? "certificate" : "record copy"} can now be requested.
                <span style={{ display: "block", marginTop: 8 }}>
                  <button
                    type="button"
                    className="public-btn public-btn-primary"
                    onClick={() =>
                      toastMessage(
                        "success",
                        `Request logged for ${view.reference}. A CRVS registration officer will process your ${
                          wantsCertificate ? "certificate" : "record"
                        } request.`
                      )
                    }
                    data-testid="divorce-tracking-request-document"
                  >
                    Request {wantsCertificate ? "a certificate" : "a record copy"}
                  </button>
                </span>
                <span className="public-form-hint" style={{ display: "block", marginTop: 8 }}>
                  This demonstration environment does not yet include a full divorce-certificate issuing flow — this
                  action records the request for the processing office.
                </span>
              </>
            ) : view.registrationCompleted ? (
              "This divorce is registered, but a record or certificate cannot be issued while a correction or review is still open. This page will show when it becomes available."
            ) : (
              "A divorce record or certificate can only be issued once the divorce has been registered. Keep tracking this reference — this page will tell you when it becomes available."
            )}
          </Notice>
        )}

        {!wantsRecord && !wantsCertificate && (
          <Notice type={view.certificateEligible ? "success" : "info"} title="Records and certificates">
            {view.certificateEligible
              ? "This divorce is registered and eligible for a record copy or certificate. Use the actions on the divorce registration page to request one."
              : "A divorce record or certificate can be requested once this divorce has been registered and any open correction or review has been resolved."}
          </Notice>
        )}

        <div style={{ marginTop: "1.5rem" }}>
          <h2>Need help?</h2>
          <p>
            If a status has not changed for longer than you expect, or you have lost your secure response link, contact
            the processing office ({view.processingOfficeName || "your registration office"}) or visit any service
            centre. Staff can see the full case; this page deliberately cannot.
          </p>
          <div className="public-hero-actions">
            <button type="button" className="public-btn public-btn-secondary" onClick={() => navigate("/service-centres")} data-testid="divorce-tracking-service-centres">
              Find a service centre
            </button>
            <button type="button" className="public-btn public-btn-outline" onClick={() => navigate("/help")} data-testid="divorce-tracking-help">
              Get help
            </button>
            <button type="button" className="public-btn public-btn-outline" onClick={() => navigate("/civil-registration/divorce")} data-testid="divorce-tracking-service">
              Back to divorce registration
            </button>
          </div>
        </div>

        <p className="public-form-hint" style={{ marginTop: "1.5rem" }}>
          For privacy, this page shows only the status of the request and what happens next. It never shows the court
          decision or its contents, the documents that were uploaded, internal notes made by staff, or any personal
          details of either former spouse.
        </p>
      </Section>
    </>
  );
}
