import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "@/components/public/PageHeader";
import Section from "@/components/public/Section";
import Notice from "@/components/public/Notice";
import { demoGetDivorceRegistration } from "@/demo/services/crvsDivorceRegistrations";
import { DIVORCE_REGISTRATION_STATUS_LABELS } from "@/domain/crvs/statusMachines";
import { divorcePolicyConfig } from "@/domain/crvs/divorcePolicyConfig";
import { DivorceRegistration } from "@/domain/crvs/types";
import { formatDateTime } from "../../divorceShared";
import toastMessage from "@/utils/common/toastMessage";

/**
 * Route /civil-registration/divorce/register/:draftId/success — the
 * submission result. Divorce has no payment step (divorcePolicyConfig.fees
 * .required is false), so the review step leads straight here.
 */
export default function DivorceRegistrationSuccess() {
  const { draftId } = useParams<{ draftId: string }>();
  const navigate = useNavigate();
  const [registration, setRegistration] = useState<DivorceRegistration | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!draftId) return;
    let cancelled = false;
    demoGetDivorceRegistration(draftId)
      .then((found) => {
        if (!cancelled) setRegistration(found);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [draftId]);

  const handleDownloadAcknowledgement = () => {
    if (!registration) return;
    try {
      const lines = [
        "DIVORCE REGISTRATION — ACKNOWLEDGEMENT OF SUBMISSION",
        "",
        `Reference: ${registration.reference}`,
        `Status: ${DIVORCE_REGISTRATION_STATUS_LABELS[registration.status]}`,
        `Submitted: ${registration.submittedAt ? new Date(registration.submittedAt).toLocaleString() : "—"}`,
        `Processing office: ${registration.processingOffice.selectedProcessingOfficeName}`,
        `Court case number: ${registration.judgment.courtCaseNumber || "—"}`,
        `Judgment number: ${registration.judgment.judgmentNumber || "—"}`,
        "",
        "WHAT THIS IS",
        "This acknowledges that a request to register an already-granted divorce has been received.",
        "It is not a divorce certificate and it does not register the divorce. The divorce is entered",
        "in the register only after a registration officer has verified the court decision and",
        "approved the request.",
        "",
        "WHAT HAPPENS NEXT",
        `A registration officer reviews this request within about ${divorcePolicyConfig.sla.reviewDays} working days.`,
        `Verifying the court decision takes up to ${divorcePolicyConfig.sla.judgmentVerificationDays} working days.`,
        registration.judgment.isForeign
          ? `Because the decision was issued abroad, a recognition review of up to ${divorcePolicyConfig.sla.foreignReviewDays} working days also applies.`
          : "",
        `If a correction is requested you will receive a secure link and have ${divorcePolicyConfig.sla.correctionResponseDays} days to respond.`,
        "",
        `Track this request at: /civil-registration/divorce/case/${registration.reference}`,
        "",
        "This is a demo acknowledgement generated in your browser. Keep your reference.",
      ].filter((line) => line !== "");

      const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${registration.reference}-acknowledgement.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      toastMessage("error", err);
    }
  };

  if (loading) {
    return <PageHeader title="Loading…" eyebrow="Civil registration" />;
  }

  if (!registration) {
    return (
      <>
        <PageHeader title="We couldn't find that request" eyebrow="Civil registration" />
        <Section>
          <Notice type="warning" title="Check your reference">
            The reference may have been typed incorrectly. You can start a new registration or track an existing one
            from the divorce registration page.
          </Notice>
          <div className="public-hero-actions" style={{ marginTop: "1.5rem" }}>
            <button type="button" className="public-btn public-btn-primary" onClick={() => navigate("/civil-registration/divorce")} data-testid="divorce-success-back-to-service">
              Back to divorce registration
            </button>
          </div>
        </Section>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Your registration request has been submitted"
        eyebrow="Civil registration"
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "Divorce registration", href: "/civil-registration/divorce" },
          { label: "Submitted" },
        ]}
      />
      <Section>
        <Notice type="success" title={`Reference ${registration.reference}`}>
          Keep this reference. You will need it to track the request, and to respond if a registration officer asks you
          for a correction.
        </Notice>

        <dl className="public-fact-list" style={{ marginTop: "1.5rem" }}>
          <div>
            <dt>Reference</dt>
            <dd>{registration.reference}</dd>
          </div>
          <div>
            <dt>Submitted</dt>
            <dd>{formatDateTime(registration.submittedAt)}</dd>
          </div>
          <div>
            <dt>Current status</dt>
            <dd>{DIVORCE_REGISTRATION_STATUS_LABELS[registration.status]}</dd>
          </div>
          <div>
            <dt>Processing office</dt>
            <dd>{registration.processingOffice.selectedProcessingOfficeName}</dd>
          </div>
        </dl>

        <div style={{ marginTop: "1.5rem" }}>
          <h2>What happens next</h2>
          <ol className="public-steps">
            {[
              `A registration officer checks your request and the documents you uploaded, usually within ${divorcePolicyConfig.sla.reviewDays} working days.`,
              `The court decision is verified against the issuing court's details — allow up to ${divorcePolicyConfig.sla.judgmentVerificationDays} working days for this.`,
              registration.judgment.isForeign
                ? `Because your decision was issued abroad, a supervisor also carries out a recognition review, taking up to ${divorcePolicyConfig.sla.foreignReviewDays} working days.`
                : "If anything is unclear, the case is referred to a supervisor before a decision is made.",
              "If the request is approved, the divorce is entered in the register, the existing marriage record is marked as dissolved, and both former spouses' civil status is updated to divorced.",
              "Once the divorce is registered you can request a divorce record or a divorce certificate.",
            ].map((step, index) => (
              <li className="public-step" key={step}>
                <span className="public-step-number" aria-hidden="true">
                  {index + 1}
                </span>
                <p>{step}</p>
              </li>
            ))}
          </ol>
        </div>

        <Notice type="info" title="If a correction is requested">
          You will be sent a secure response link by {[registration.applicant.phone, registration.applicant.email].filter(Boolean).join(" or ") || "the contact details you provided"}.
          That link opens a page where you can correct only the parts a registration officer has asked about, upload
          replacement documents, and confirm the resubmission. You have {divorcePolicyConfig.sla.correctionResponseDays}{" "}
          days to respond. The link is the only way to make changes — this tracking reference on its own will not unlock
          editing.
        </Notice>

        <Notice type="info" title="This is not yet a registered divorce">
          Submitting a request does not register the divorce, and this acknowledgement is not a divorce certificate. The
          divorce is registered only once a registration officer has approved the request.
        </Notice>

        <div className="public-hero-actions" style={{ marginTop: "1.5rem" }}>
          <button type="button" className="public-btn public-btn-primary" onClick={handleDownloadAcknowledgement} data-testid="divorce-success-download-acknowledgement">
            Download acknowledgement
          </button>
          <button
            type="button"
            className="public-btn public-btn-secondary"
            onClick={() => navigate(`/civil-registration/divorce/case/${registration.reference}`)}
            data-testid="divorce-success-track"
          >
            Track this registration
          </button>
          <button type="button" className="public-btn public-btn-outline" onClick={() => navigate("/civil-registration")} data-testid="divorce-success-services">
            Return to civil registration services
          </button>
        </div>
      </Section>
    </>
  );
}
