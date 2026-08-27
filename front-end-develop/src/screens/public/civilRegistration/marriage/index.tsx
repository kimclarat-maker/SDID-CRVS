import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePublicLanguage } from "@/context/PublicLanguageContext";
import PageHeader from "@/components/public/PageHeader";
import Section from "@/components/public/Section";
import Notice from "@/components/public/Notice";
import FaqList from "@/components/public/FaqList";
import { marriagePolicyConfig, witnessRequirementForSpouse } from "@/domain/crvs/marriagePolicyConfig";

/**
 * Marriage-service landing page (mirrors DeathServiceLanding's structure —
 * see that file's own comment for why the generic CivilRegistrationServicePage
 * template isn't used here: this page needs five functional entry points
 * plus marriage-specific content the generic template has no slot for).
 * Every number quoted in the prose below (advance notice days, witness
 * counts, fee amount) is read from marriagePolicyConfig rather than
 * hardcoded, per the module's "never hardcode numbers in components" rule.
 */
export default function MarriageServiceLanding() {
  const navigate = useNavigate();
  const { content } = usePublicLanguage();
  const page = content.servicePages.marriage;

  const [resumeReference, setResumeReference] = useState("");
  const [resumeError, setResumeError] = useState<string | undefined>();
  const [trackReference, setTrackReference] = useState("");
  const [trackError, setTrackError] = useState<string | undefined>();
  const [appointmentReference, setAppointmentReference] = useState("");
  const [appointmentError, setAppointmentError] = useState<string | undefined>();
  const [certificateError, setCertificateError] = useState<string | undefined>();

  const witnessRule = witnessRequirementForSpouse();

  const handleResume = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeReference.trim()) {
      setResumeError("Enter your saved declaration reference.");
      return;
    }
    navigate(`/civil-registration/marriage/declaration/${resumeReference.trim()}`);
  };

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackReference.trim()) {
      setTrackError("Enter your application reference.");
      return;
    }
    navigate(`/civil-registration/marriage/application/${trackReference.trim()}`);
  };

  const handleManageAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointmentReference.trim()) {
      setAppointmentError("Enter your appointment or application reference.");
      return;
    }
    navigate(`/civil-registration/marriage/appointment/${appointmentReference.trim()}`);
  };

  const handleRequestCertificate = () => {
    if (!trackReference.trim()) {
      setCertificateError("Enter your application reference above, then select Request marriage certificate.");
      return;
    }
    setCertificateError(undefined);
    navigate(`/civil-registration/marriage/application/${trackReference.trim()}?certificate=1`);
  };

  return (
    <>
      <PageHeader
        title="Declare and register a marriage"
        description="Start a marriage declaration, track its progress, manage a scheduled appointment, and request an official marriage certificate once registered."
        eyebrow={content.common.nav.civilRegistration}
        breadcrumb={[
          { label: content.common.nav.home, href: "/" },
          { label: content.common.nav.civilRegistration, href: "/civil-registration" },
          { label: "Marriage registration" },
        ]}
      />

      <Section spacing="compact">
        <div className="public-hero-actions" role="group" aria-label="Marriage registration actions">
          <button
            type="button"
            className="public-btn public-btn-primary"
            onClick={() => navigate("/civil-registration/marriage/declaration")}
            data-testid="marriage-landing-declare"
          >
            Start marriage declaration
          </button>

          <form onSubmit={handleResume} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input
              aria-label="Saved declaration reference"
              placeholder="Saved declaration reference"
              value={resumeReference}
              onChange={(e) => setResumeReference(e.target.value)}
              data-testid="marriage-landing-resume-input"
            />
            <button type="submit" className="public-btn public-btn-secondary" data-testid="marriage-landing-resume">
              Continue saved declaration
            </button>
          </form>

          <form onSubmit={handleTrack} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input
              aria-label="Application reference"
              placeholder="Application reference"
              value={trackReference}
              onChange={(e) => setTrackReference(e.target.value)}
              data-testid="marriage-landing-track-input"
            />
            <button type="submit" className="public-btn public-btn-outline" data-testid="marriage-landing-track">
              Track application
            </button>
          </form>

          <form onSubmit={handleManageAppointment} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input
              aria-label="Appointment or application reference"
              placeholder="Appointment reference"
              value={appointmentReference}
              onChange={(e) => setAppointmentReference(e.target.value)}
              data-testid="marriage-landing-appointment-input"
            />
            <button type="submit" className="public-btn public-btn-outline" data-testid="marriage-landing-appointment">
              Manage appointment
            </button>
          </form>

          <button type="button" className="public-btn public-btn-outline" onClick={handleRequestCertificate} data-testid="marriage-landing-certificate">
            Request marriage certificate
          </button>
        </div>
        <p className="public-form-hint" style={{ marginTop: 4 }}>
          Requesting a certificate requires the reference of an already-registered application — enter it in the
          "Application reference" field above.
        </p>
        {(resumeError || trackError || appointmentError || certificateError) && (
          <p className="public-form-error" role="alert" style={{ marginTop: 8 }}>
            {resumeError || trackError || appointmentError || certificateError}
          </p>
        )}
      </Section>

      <Section heading="Declaration and registration are two different steps">
        <p className="public-section-intro">{page.description}</p>
        <Notice type="info" title="Submitting a declaration never registers a marriage">
          A marriage declaration only starts the process: identity and eligibility review, correction if needed,
          payment where applicable, and appointment scheduling. The marriage itself is registered only after both
          applicants attend an appointment in person and a Civil Registrar records a successful ceremony outcome.
        </Notice>
      </Section>

      <Section alt heading="Who may apply">
        <ul className="public-grid public-grid-2" style={{ listStyle: "none", padding: 0 }}>
          {page.whoMayApply.map((item) => (
            <li key={item} className="public-card">
              {item}
            </li>
          ))}
        </ul>
      </Section>

      <Section heading="Where you can submit an application">
        <div className="public-grid public-grid-2">
          <div className="public-card">
            <h3>District or sector office</h3>
            <p>
              Available to citizens and residents applying within the service area, at the office of residence or the
              office where the marriage will take place.
            </p>
          </div>
          <div className="public-card">
            <h3>Embassy or consulate</h3>
            <p>Available where at least one applicant qualifies for consular civil registration services abroad.</p>
          </div>
        </div>
      </Section>

      <Section alt heading="Advance notice, eligibility, and witnesses">
        <div className="public-grid public-grid-2">
          <div className="public-card">
            <h3>Advance notice</h3>
            <p>
              The proposed ceremony date must be at least {marriagePolicyConfig.notice.minAdvanceNoticeDays} days after
              your application is submitted, and no more than {marriagePolicyConfig.notice.maxAdvanceBookingDays} days
              out — this gives time for review and a public-notice/objection window.
            </p>
          </div>
          <div className="public-card">
            <h3>Eligibility</h3>
            <ul>
              {page.eligibility.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p>Both applicants must each be at least {marriagePolicyConfig.age.minimumAge} years old, unless an approved exception applies.</p>
          </div>
          <div className="public-card">
            <h3>Witnesses</h3>
            <p>
              Each applicant must bring between {witnessRule.minimum} and {witnessRule.maximum} witnesses, each at
              least {witnessRule.minimumAge} years old. A witness cannot be the other applicant.
            </p>
          </div>
        </div>
      </Section>

      <Section heading="Information and documents you will need">
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
            <p className="public-form-hint">
              The exact document list depends on each applicant's nationality and current civil status (single,
              divorced, or widowed) — the declaration wizard tells you exactly what's needed for your case.
            </p>
          </div>
        </div>
      </Section>

      {marriagePolicyConfig.payment.required && (
        <Section alt heading="Fees that may apply">
          <p className="public-section-intro">
            A standard processing fee of {marriagePolicyConfig.payment.standardFeeAmount.toLocaleString()}{" "}
            {marriagePolicyConfig.payment.currency} applies once your application is approved. Applications routed
            through an exception or late-notice review carry a higher fee of{" "}
            {marriagePolicyConfig.payment.exceptionOrLateFeeAmount.toLocaleString()} {marriagePolicyConfig.payment.currency}.
            Ceremonies booked on a designated high-volume date carry an additional{" "}
            {marriagePolicyConfig.specialDay.additionalFeeAmount.toLocaleString()} {marriagePolicyConfig.payment.currency}{" "}
            surcharge. Payment is demonstrated here as a demo simulation only — no real transaction occurs.
          </p>
        </Section>
      )}

      <Section heading="Appointment and ceremony process">
        <ol className="public-steps">
          {[
            "Once approved and any required fee is paid, a marriage appointment is scheduled at your office.",
            "Both applicants and their witnesses must attend in person and check in at the office on the appointment date.",
            "An authorized officiant conducts the civil ceremony and records each applicant's consent.",
            "A Civil Registrar records the ceremony outcome. Only a successful outcome results in registration.",
            "Both applicants' linked national identity records are updated to reflect the marriage through a separate, tracked synchronization step.",
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

      <Section alt heading="After registration">
        <p className="public-section-intro">
          Once the marriage is registered, an official registration record is created and each applicant's national
          identity record reflects the new marital status. You may then request an official marriage certificate
          using your application reference.
        </p>
      </Section>

      <Section heading="Frequently asked questions">
        <FaqList items={page.faqs} />
      </Section>

      <Section alt heading="Privacy notice">
        <Notice type="info" title="Your partner's details are protected">
          Case-tracking pages available to the public never reveal either applicant's full identity details — only a
          masked summary, status, and next steps. {page.privacyNotice ? ` ${page.privacyNotice}` : ""}
        </Notice>
      </Section>

      <Section heading="Help and service centres">
        <div className="public-hero-actions">
          <button type="button" className="public-btn public-btn-secondary" onClick={() => navigate("/service-centres")} data-testid="marriage-landing-service-centres">
            Find a service centre
          </button>
          <button type="button" className="public-btn public-btn-outline" onClick={() => navigate("/help")} data-testid="marriage-landing-help">
            Get help
          </button>
        </div>
      </Section>
    </>
  );
}
