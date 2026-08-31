import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "@/components/public/PageHeader";
import Section from "@/components/public/Section";
import Notice from "@/components/public/Notice";
import { demoGetAnnulmentRegistration } from "@/demo/services/crvsAnnulmentRegistrations";
import { ANNULMENT_REGISTRATION_STATUS_LABELS } from "@/domain/crvs/statusMachines";
import { annulmentPolicyConfig } from "@/domain/crvs/annulmentPolicyConfig";
import { AnnulmentRegistration } from "@/domain/crvs/types";
import { formatDateTime } from "../../marriageAnnulmentShared";
import toastMessage from "@/utils/common/toastMessage";

/**
 * Route /civil-registration/marriage-annulment/register/:draftId/success —
 * the submission result. No celebratory animation: this acknowledges receipt
 * of a request to register a decision that has already been made, not a
 * completed annulment (spec's framing throughout this module).
 */
export default function AnnulmentRegistrationSuccess() {
  const { draftId } = useParams<{ draftId: string }>();
  const navigate = useNavigate();
  const [registration, setRegistration] = useState<AnnulmentRegistration | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!draftId) return;
    let cancelled = false;
    demoGetAnnulmentRegistration(draftId)
      .then((found) => {
        if (!cancelled) setRegistration(found);
      })
      .catch(() => {
        if (!cancelled) setRegistration(undefined);
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
        "MARRIAGE ANNULMENT REGISTRATION — ACKNOWLEDGEMENT OF SUBMISSION",
        "",
        `Reference: ${registration.reference}`,
        `Status: ${ANNULMENT_REGISTRATION_STATUS_LABELS[registration.status]}`,
        `Submitted: ${registration.submittedAt ? new Date(registration.submittedAt).toLocaleString() : "—"}`,
        `Processing office: ${registration.processingOffice.selectedProcessingOfficeName}`,
        `Court case number: ${registration.decision.courtCaseNumber || "—"}`,
        `Decision number: ${registration.decision.decisionNumber || "—"}`,
        "",
        "WHAT THIS IS",
        "This acknowledges that a request to register an already-made annulment decision has been received.",
        "It is not an annulment certificate and it does not register the annulment. The annulment is entered",
        "in the register only after a registration officer has verified the decision, classified its legal",
        "effect, and approved the request.",
        "",
        "WHAT HAPPENS NEXT",
        `A registration officer reviews this request within about ${annulmentPolicyConfig.sla.reviewDays} working days.`,
        `Verifying the decision takes up to ${annulmentPolicyConfig.sla.decisionVerificationDays} working days.`,
        `The legal-effect classification review takes up to ${annulmentPolicyConfig.sla.legalEffectReviewDays} working days.`,
        registration.decision.isForeign
          ? `Because the decision was issued abroad, a recognition review of up to ${annulmentPolicyConfig.sla.foreignReviewDays} working days also applies.`
          : "",
        `If a correction is requested you will receive a secure link and have ${annulmentPolicyConfig.sla.correctionResponseDays} days to respond.`,
        "",
        `Track this request at: /civil-registration/marriage-annulment/case/${registration.reference}`,
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
            from the marriage annulment registration page.
          </Notice>
          <div className="public-hero-actions" style={{ marginTop: "1.5rem" }}>
            <button
              type="button"
              className="public-btn public-btn-primary"
              onClick={() => navigate("/civil-registration/marriage-annulment")}
              data-testid="annulment-success-back-to-service"
            >
              Back to marriage annulment registration
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
          { label: "Marriage annulment registration", href: "/civil-registration/marriage-annulment" },
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
            <dd>{ANNULMENT_REGISTRATION_STATUS_LABELS[registration.status]}</dd>
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
              `A registration officer checks your request and the documents you uploaded, usually within ${annulmentPolicyConfig.sla.reviewDays} working days.`,
              `The decision is verified against the issuing court or authority's details — allow up to ${annulmentPolicyConfig.sla.decisionVerificationDays} working days for this.`,
              `Authorized staff review the wording you captured and make the final legal-effect classification, taking up to ${annulmentPolicyConfig.sla.legalEffectReviewDays} working days. You are never asked to make this classification yourself.`,
              registration.decision.isForeign
                ? `Because your decision was issued abroad, a supervisor also carries out a recognition review, taking up to ${annulmentPolicyConfig.sla.foreignReviewDays} working days.`
                : "If anything is unclear, the case is referred to a supervisor before a decision is made.",
              "If the request is approved, the annulment is entered in the register, the existing marriage record is marked as annulled without being deleted, and each affected person's identity record is considered separately for an update.",
              "Once the annulment is registered you can request an annulment record or an annulment certificate.",
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
          You will be sent a secure response link by{" "}
          {[registration.applicant.phone, registration.applicant.email].filter(Boolean).join(" or ") || "the contact details you provided"}.
          That link opens a page where you can correct only the parts a registration officer has asked about, upload
          replacement documents, and confirm the resubmission. You have {annulmentPolicyConfig.sla.correctionResponseDays}{" "}
          days to respond. The link is the only way to make changes — this tracking reference on its own will not
          unlock editing.
        </Notice>

        <Notice type="info" title="This is not yet a registered annulment">
          Submitting a request does not register the annulment, and this acknowledgement is not an annulment
          certificate. The annulment is registered only once a registration officer has verified the decision,
          classified its legal effect, and approved the request.
        </Notice>

        <div className="public-hero-actions" style={{ marginTop: "1.5rem" }}>
          <button
            type="button"
            className="public-btn public-btn-primary"
            onClick={handleDownloadAcknowledgement}
            data-testid="annulment-success-download-acknowledgement"
          >
            Download acknowledgement
          </button>
          <button
            type="button"
            className="public-btn public-btn-secondary"
            onClick={() => navigate(`/civil-registration/marriage-annulment/case/${registration.reference}`)}
            data-testid="annulment-success-track"
          >
            Track this registration
          </button>
          <button type="button" className="public-btn public-btn-outline" onClick={() => navigate("/civil-registration")} data-testid="annulment-success-services">
            Return to civil registration services
          </button>
        </div>
      </Section>
    </>
  );
}
