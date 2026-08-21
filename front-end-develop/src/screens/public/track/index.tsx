import { FormEvent, useState } from "react";
import { usePublicLanguage } from "@/context/PublicLanguageContext";
import PageHeader from "@/components/public/PageHeader";
import Section from "@/components/public/Section";
import Notice from "@/components/public/Notice";
import StatusTimeline from "@/components/public/StatusTimeline";
import { isDemoMode } from "@/demo/config";
import { demoTrackApplication, DemoTrackingResult, demoTrackBirthRegistration, DemoBirthTrackingResult } from "@/demo/services/public";
import DemoBadge from "@/components/demoBadge";

interface TrackFormErrors {
  reference?: string;
  otp?: string;
}

export default function Track() {
  const { content } = usePublicLanguage();
  const page = content.track;

  const [reference, setReference] = useState("");
  const [otp, setOtp] = useState("");
  const [errors, setErrors] = useState<TrackFormErrors>({});
  const [result, setResult] = useState<{ stageIndex: number } | null>(null);
  const [demoResult, setDemoResult] = useState<DemoTrackingResult | null>(
    null
  );
  const [birthResult, setBirthResult] = useState<DemoBirthTrackingResult | null>(
    null
  );
  const [submitting, setSubmitting] = useState(false);

  const validate = (): boolean => {
    const nextErrors: TrackFormErrors = {};
    if (!reference.trim()) {
      nextErrors.reference = "Enter your application reference.";
    }
    if (!otp.trim()) {
      nextErrors.otp = "Enter the one-time code sent to you.";
    } else if (!/^\d{4,8}$/.test(otp.trim())) {
      nextErrors.otp = "Enter the numeric code exactly as received.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) {
      setResult(null);
      setDemoResult(null);
      return;
    }

    setSubmitting(true);
    window.setTimeout(() => {
      if (isDemoMode()) {
        const found = demoTrackApplication(reference, otp);
        if (found) {
          setDemoResult(found);
          setBirthResult(null);
          setResult({ stageIndex: found.currentStageIndex });
          setSubmitting(false);
          return;
        }

        const foundBirth = demoTrackBirthRegistration(reference, otp);
        if (foundBirth) {
          setBirthResult(foundBirth);
          setDemoResult(null);
          setResult({ stageIndex: foundBirth.currentStageIndex });
          setSubmitting(false);
          return;
        }

        setDemoResult(null);
        setBirthResult(null);
        setResult(null);
        setSubmitting(false);
        return;
      }

      // Deterministic mock status derived from the reference so this page
      // never needs a live backend to demonstrate the tracking experience.
      const mockStageIndex =
        reference.trim().length % page.statusStages.length;
      setDemoResult(null);
      setBirthResult(null);
      setResult({ stageIndex: mockStageIndex });
      setSubmitting(false);
    }, 400);
  };

  return (
    <>
      <PageHeader
        title={page.heading}
        description={page.intro}
        eyebrow={content.common.nav.track}
        breadcrumb={[
          { label: content.common.nav.home, href: "/" },
          { label: content.common.nav.track },
        ]}
      />

      <Section>
        <form
          className="public-form"
          onSubmit={handleSubmit}
          data-testid="track-form"
          noValidate
        >
          <div className="public-form-field">
            <label htmlFor="track-reference">{page.referenceLabel}</label>
            <input
              id="track-reference"
              type="text"
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              aria-invalid={!!errors.reference}
              aria-describedby={
                errors.reference ? "track-reference-error" : undefined
              }
              data-testid="track-reference-input"
            />
            {errors.reference && (
              <p
                id="track-reference-error"
                className="public-form-error"
                role="alert"
              >
                {errors.reference}
              </p>
            )}
          </div>

          <div className="public-form-field">
            <label htmlFor="track-otp">{page.otpLabel}</label>
            <input
              id="track-otp"
              type="text"
              inputMode="numeric"
              value={otp}
              onChange={(event) => setOtp(event.target.value)}
              aria-invalid={!!errors.otp}
              aria-describedby={errors.otp ? "track-otp-error" : undefined}
              data-testid="track-otp-input"
            />
            {errors.otp && (
              <p id="track-otp-error" className="public-form-error" role="alert">
                {errors.otp}
              </p>
            )}
            <p className="public-form-hint">{page.privacyNote}</p>
          </div>

          <button
            type="submit"
            className="public-btn public-btn-primary"
            data-testid="track-submit"
            disabled={submitting}
            aria-busy={submitting}
          >
            {submitting ? "Checking…" : page.submitLabel}
          </button>
        </form>

        {isDemoMode() && (
          <p style={{ marginTop: "1rem" }}>
            <DemoBadge /> Try it: reference{" "}
            <code>APP-DEMO-2026-0001</code>, code <code>246810</code> — or a
            birth registration, reference <code>BR-DEMO-2026-0002</code>,
            code <code>135791</code>
          </p>
        )}

        <div
          style={{ marginTop: "1rem", maxWidth: 560 }}
          role="status"
          aria-live="polite"
        >
          {submitting ? (
            <Notice type="info" title="Checking">
              Looking up your application status…
            </Notice>
          ) : result ? (
            <>
              {demoResult && (
                <dl className="public-form-hint" style={{ marginBottom: "1rem" }}>
                  <div>
                    <strong>Application type:</strong> {demoResult.applicationType}
                  </div>
                  <div>
                    <strong>Submitted:</strong>{" "}
                    {new Date(demoResult.submittedAt).toLocaleDateString()}
                  </div>
                  {demoResult.centerName && (
                    <div>
                      <strong>Service centre:</strong> {demoResult.centerName}
                    </div>
                  )}
                  {demoResult.outstandingAction && (
                    <div>
                      <strong>Outstanding action:</strong>{" "}
                      {demoResult.outstandingAction}
                    </div>
                  )}
                  {demoResult.nextAppointment && (
                    <div>
                      <strong>Next appointment:</strong>{" "}
                      {demoResult.nextAppointment.date} at{" "}
                      {demoResult.nextAppointment.time}
                    </div>
                  )}
                </dl>
              )}
              {birthResult && (
                <dl className="public-form-hint" style={{ marginBottom: "1rem" }}>
                  <div>
                    <strong>Application reference:</strong> {birthResult.reference}
                  </div>
                  {birthResult.submittedAt && (
                    <div>
                      <strong>Submitted:</strong>{" "}
                      {new Date(birthResult.submittedAt).toLocaleDateString()}
                    </div>
                  )}
                  {birthResult.processingOffice && (
                    <div>
                      <strong>Processing office:</strong> {birthResult.processingOffice}
                    </div>
                  )}
                  {birthResult.outstandingAction && (
                    <div>
                      <strong>Outstanding action:</strong>{" "}
                      {birthResult.outstandingAction}
                    </div>
                  )}
                </dl>
              )}
              <StatusTimeline
                stages={birthResult ? birthResult.stages : page.statusStages}
                currentIndex={result.stageIndex}
              />
            </>
          ) : (
            <Notice type="info" title="No status yet">
              {isDemoMode()
                ? "No demo application matches that reference and code."
                : page.emptyStateHint}
            </Notice>
          )}
        </div>
      </Section>
    </>
  );
}
