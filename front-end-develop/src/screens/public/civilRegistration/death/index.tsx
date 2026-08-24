import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePublicLanguage } from "@/context/PublicLanguageContext";
import PageHeader from "@/components/public/PageHeader";
import Section from "@/components/public/Section";
import Notice from "@/components/public/Notice";
import FaqList from "@/components/public/FaqList";

/**
 * Death-service landing page (spec §5). Deliberately not the generic
 * CivilRegistrationServicePage template every other service page in
 * PublicSite.tsx uses — that template supports exactly one primary action
 * button, and this page needs four (report / continue / track / request
 * certificate) plus death-specific content (health-facility vs. community
 * paths, post-submission expectations, a privacy notice that specifically
 * names medical information) the generic template has no slot for. Content
 * for the sections that ARE generic (who may report, evidence, steps, FAQ)
 * is still pulled from content.servicePages.death rather than re-typed here.
 */
export default function DeathServiceLanding() {
  const navigate = useNavigate();
  const { content } = usePublicLanguage();
  const page = content.servicePages.death;
  const [trackReference, setTrackReference] = useState("");
  const [resumeReference, setResumeReference] = useState("");
  const [trackError, setTrackError] = useState<string | undefined>();
  const [resumeError, setResumeError] = useState<string | undefined>();

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackReference.trim()) {
      setTrackError("Enter your case reference.");
      return;
    }
    navigate(`/civil-registration/death/case/${trackReference.trim()}`);
  };

  const handleResume = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeReference.trim()) {
      setResumeError("Enter your saved draft reference.");
      return;
    }
    navigate(`/civil-registration/death/report/${resumeReference.trim()}`);
  };

  return (
    <>
      <PageHeader
        title="Report and register a death"
        description="Report a death, follow its progress, and request an official death record — online or with assistance from a service centre."
        eyebrow={content.common.nav.civilRegistration}
        breadcrumb={[
          { label: content.common.nav.home, href: "/" },
          { label: content.common.nav.civilRegistration, href: "/civil-registration" },
          { label: "Death registration" },
        ]}
      />

      <Section spacing="compact">
        <div className="public-hero-actions" role="group" aria-label="Death registration actions">
          <button type="button" className="public-btn public-btn-primary" onClick={() => navigate("/civil-registration/death/report")} data-testid="death-landing-report">
            Report a death
          </button>
          <form onSubmit={handleResume} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input
              aria-label="Saved report reference"
              placeholder="Saved report reference"
              value={resumeReference}
              onChange={(e) => setResumeReference(e.target.value)}
              data-testid="death-landing-resume-input"
            />
            <button type="submit" className="public-btn public-btn-secondary" data-testid="death-landing-resume">
              Continue saved report
            </button>
          </form>
          <form onSubmit={handleTrack} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input
              aria-label="Case reference"
              placeholder="Case reference"
              value={trackReference}
              onChange={(e) => setTrackReference(e.target.value)}
              data-testid="death-landing-track-input"
            />
            <button type="submit" className="public-btn public-btn-outline" data-testid="death-landing-track">
              Track existing case
            </button>
          </form>
          <button
            type="button"
            className="public-btn public-btn-outline"
            onClick={() => {
              if (!trackReference.trim()) {
                setTrackError("Enter your case reference above, then select Request death certificate.");
                return;
              }
              setTrackError(undefined);
              navigate(`/civil-registration/death/case/${trackReference.trim()}?certificate=1`);
            }}
            data-testid="death-landing-certificate"
          >
            Request death certificate
          </button>
        </div>
        <p className="public-form-hint" style={{ marginTop: 4 }}>
          Requesting a certificate requires the reference of an already-registered case — enter it in the "Case
          reference" field above.
        </p>
        {(trackError || resumeError) && (
          <p className="public-form-error" role="alert" style={{ marginTop: 8 }}>
            {trackError || resumeError}
          </p>
        )}
      </Section>

      <Section heading="What is death registration?">
        <p className="public-section-intro">{page.description}</p>
      </Section>

      <Section alt heading="Who may declare a death">
        <ul className="public-grid public-grid-2" style={{ listStyle: "none", padding: 0 }}>
          {page.whoMayApply.map((item) => (
            <li key={item} className="public-card">
              {item}
            </li>
          ))}
        </ul>
      </Section>

      <Section heading="Health-facility and community death paths">
        <div className="public-grid public-grid-2">
          <div className="public-card">
            <h3>Health-facility death</h3>
            <p>
              A death that occurs at a health facility is medically certified by facility staff, notified to the CRVS
              registration office, reviewed, and registered — with the medical certificate providing the primary
              evidence.
            </p>
          </div>
          <div className="public-card">
            <h3>Community or non-facility death</h3>
            <p>
              A death that occurs outside a facility is reported by a declarant, supported by witnesses and available
              evidence (such as a burial or community confirmation), then reviewed before registration. Additional
              review applies for late, medico-legal, or unidentified-person cases.
            </p>
          </div>
        </div>
      </Section>

      <Section alt heading="Information and documents you will need">
        <div className="public-grid public-grid-2">
          <div className="public-card">
            <h3>Required</h3>
            <ul>
              {page.requiredEvidence.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="public-card">
            <h3>Conditional — depending on your case</h3>
            <ul>
              {page.conditionalEvidence.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section heading="What happens after you submit">
        <ol className="public-steps">
          {[
            "Your report is checked for completeness and, where applicable, matched against existing identity and death records.",
            "A CRVS registration officer reviews the case, requesting corrections if anything is missing.",
            "Late, medico-legal, or unidentified-person cases receive additional, authorized review before a decision.",
            "A Civil Registrar approves and registers the death, creating the official record.",
            "The linked national identity record is updated to reflect the death through a separate, tracked synchronization step.",
          ].map((step, index) => (
            <li className="public-step" key={step}>
              <span className="public-step-number" aria-hidden="true">
                {index + 1}
              </span>
              <p>{step}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section alt heading="Frequently asked questions">
        <FaqList items={page.faqs} />
      </Section>

      <Section heading="Privacy notice">
        <Notice type="info" title="Medical information is handled with restricted access">
          Cause-of-death and medical certification details are only ever visible to authorized medical and civil
          registration staff. Case-tracking pages available to the public never display cause-of-death information.
          {page.privacyNotice ? ` ${page.privacyNotice}` : ""}
        </Notice>
      </Section>

      <Section alt heading="Help and service centres">
        <div className="public-hero-actions">
          <button type="button" className="public-btn public-btn-secondary" onClick={() => navigate("/service-centres")} data-testid="death-landing-service-centres">
            Find a service centre
          </button>
          <button type="button" className="public-btn public-btn-outline" onClick={() => navigate("/help")} data-testid="death-landing-help">
            Get help
          </button>
        </div>
      </Section>
    </>
  );
}
