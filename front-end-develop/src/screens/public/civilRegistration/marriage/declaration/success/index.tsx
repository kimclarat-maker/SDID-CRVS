import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "@/components/public/PageHeader";
import Section from "@/components/public/Section";
import Notice from "@/components/public/Notice";
import { demoGetMarriageApplication } from "@/demo/services/crvsMarriageApplications";
import { MARRIAGE_APPLICATION_STATUS_LABELS } from "@/domain/crvs/statusMachines";
import { MarriageApplication } from "@/domain/crvs/types";

/** Submission-result page: reference, status, next steps, a downloadable
 * acknowledgement, and links to track the case or return home. Mirrors
 * DeathReportSuccess's structure. */
export default function MarriageDeclarationSuccess() {
  const { draftId } = useParams<{ draftId: string }>();
  const navigate = useNavigate();
  const [application, setApplication] = useState<MarriageApplication | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!draftId) return;
    demoGetMarriageApplication(draftId).then(setApplication).finally(() => setLoading(false));
  }, [draftId]);

  const handleDownloadAcknowledgement = () => {
    if (!application) return;
    const text = [
      "Marriage declaration acknowledgement",
      `Reference: ${application.reference}`,
      `Status: ${MARRIAGE_APPLICATION_STATUS_LABELS[application.status]}`,
      `Submitted: ${application.submittedAt ? new Date(application.submittedAt).toLocaleString() : "—"}`,
      "",
      "Submitting this declaration does not register the marriage. Registration only happens after a successful",
      "ceremony outcome, once eligibility review, any correction requests, payment (where applicable), and an",
      "appointment have all been completed.",
      "",
      "This is a demo acknowledgement. Keep your reference to track this application.",
    ].join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${application.reference}-acknowledgement.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <PageHeader title="Loading…" eyebrow="Civil registration" />;
  }

  if (!application) {
    return (
      <>
        <PageHeader title="Declaration not found" eyebrow="Civil registration" />
        <Section>
          <Notice type="warning" title="We couldn't find this declaration">
            Check your saved reference, or start a new declaration.
          </Notice>
        </Section>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Declaration submitted" eyebrow="Civil registration" />
      <Section>
        <Notice type="success" title="Your marriage declaration has been submitted">
          Keep your reference — you'll need it to track this application or respond to any correction requests.
        </Notice>

        <dl className="public-fact-list" style={{ marginTop: "1.5rem" }}>
          <div>
            <dt>Reference</dt>
            <dd>{application.reference}</dd>
          </div>
          <div>
            <dt>Current status</dt>
            <dd>{MARRIAGE_APPLICATION_STATUS_LABELS[application.status]}</dd>
          </div>
        </dl>

        <div style={{ marginTop: "1.5rem" }}>
          <h3>What happens next</h3>
          <p>
            A CRVS registration officer will review eligibility for both applicants. If anything needs clarifying,
            you'll be able to respond using your reference. Depending on your case, a fee payment may be required
            before approval can proceed. Once approved, an appointment is scheduled for both applicants to attend in
            person. A marriage is registered only after a successful ceremony outcome is recorded — submitting this
            declaration never registers the marriage on its own.
          </p>
        </div>

        <div className="public-hero-actions" style={{ marginTop: "1.5rem" }}>
          <button type="button" className="public-btn public-btn-primary" onClick={handleDownloadAcknowledgement} data-testid="marriage-success-download-acknowledgement">
            Download acknowledgement
          </button>
          <button
            type="button"
            className="public-btn public-btn-secondary"
            onClick={() => navigate(`/civil-registration/marriage/application/${application.reference}`)}
            data-testid="marriage-success-track"
          >
            Track application
          </button>
          <button type="button" className="public-btn public-btn-outline" onClick={() => navigate("/")} data-testid="marriage-success-home">
            Return home
          </button>
        </div>
      </Section>
    </>
  );
}
