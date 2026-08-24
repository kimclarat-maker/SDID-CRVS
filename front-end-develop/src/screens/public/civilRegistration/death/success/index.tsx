import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "@/components/public/PageHeader";
import Section from "@/components/public/Section";
import Notice from "@/components/public/Notice";
import { demoGetDeathRegistration } from "@/demo/services/crvsDeathRegistrations";
import { DEATH_REGISTRATION_STATUS_LABELS } from "@/domain/crvs/statusMachines";
import { DeathRegistrationCase } from "@/domain/crvs/types";

/** Submission-result page (spec §5 step 10): reference, status, next
 * steps, a downloadable acknowledgement, and links to track the case or
 * return home. Cause-of-death is never shown here — this route only reads
 * fields already safe for public display. */
export default function DeathReportSuccess() {
  const { draftId } = useParams<{ draftId: string }>();
  const navigate = useNavigate();
  const [deathCase, setDeathCase] = useState<DeathRegistrationCase | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!draftId) return;
    demoGetDeathRegistration(draftId).then(setDeathCase).finally(() => setLoading(false));
  }, [draftId]);

  const handleDownloadAcknowledgement = () => {
    if (!deathCase) return;
    const text = [
      "Death registration report acknowledgement",
      `Reference: ${deathCase.reference}`,
      `Status: ${DEATH_REGISTRATION_STATUS_LABELS[deathCase.status]}`,
      `Submitted: ${deathCase.submittedAt ? new Date(deathCase.submittedAt).toLocaleString() : "—"}`,
      "",
      "This is a demo acknowledgement. Keep your reference to track this case.",
    ].join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${deathCase.reference}-acknowledgement.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <PageHeader title="Loading…" eyebrow="Civil registration" />;
  }

  if (!deathCase) {
    return (
      <>
        <PageHeader title="Report not found" eyebrow="Civil registration" />
        <Section>
          <Notice type="warning" title="We couldn't find this report">
            Check your saved reference, or start a new report.
          </Notice>
        </Section>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Report submitted" eyebrow="Civil registration" />
      <Section>
        <Notice type="success" title="Your death report has been submitted">
          Keep your reference — you'll need it to track this case or respond to any correction requests.
        </Notice>

        <dl className="public-fact-list" style={{ marginTop: "1.5rem" }}>
          <div>
            <dt>Reference</dt>
            <dd>{deathCase.reference}</dd>
          </div>
          <div>
            <dt>Current status</dt>
            <dd>{DEATH_REGISTRATION_STATUS_LABELS[deathCase.status]}</dd>
          </div>
        </dl>

        <div style={{ marginTop: "1.5rem" }}>
          <h3>What happens next</h3>
          <p>
            A CRVS registration officer will review your report. If anything needs clarifying, you'll be able to
            respond using your reference. Once approved, a Civil Registrar registers the death and creates the
            official record.
          </p>
        </div>

        <div className="public-hero-actions" style={{ marginTop: "1.5rem" }}>
          <button type="button" className="public-btn public-btn-primary" onClick={handleDownloadAcknowledgement} data-testid="success-download-acknowledgement">
            Download acknowledgement
          </button>
          <button type="button" className="public-btn public-btn-secondary" onClick={() => navigate(`/civil-registration/death/case/${deathCase.reference}`)} data-testid="success-track">
            Track case
          </button>
          <button type="button" className="public-btn public-btn-outline" onClick={() => navigate("/")} data-testid="success-home">
            Return home
          </button>
        </div>
      </Section>
    </>
  );
}
