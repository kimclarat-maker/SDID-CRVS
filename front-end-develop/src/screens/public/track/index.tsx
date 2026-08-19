import { FormEvent, useState } from "react";
import { usePublicLanguage } from "@/context/PublicLanguageContext";
import PageHeader from "@/components/public/PageHeader";
import Section from "@/components/public/Section";
import Notice from "@/components/public/Notice";
import StatusTimeline from "@/components/public/StatusTimeline";
import { isDemoMode } from "@/demo/config";
import { demoTrackApplication, DemoTrackingResult } from "@/demo/services/public";
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

    if (isDemoMode()) {
      const found = demoTrackApplication(reference, otp);
      if (found) {
        setDemoResult(found);
        setResult({ stageIndex: found.currentStageIndex });
        return;
      }
      setDemoResult(null);
      setResult(null);
      return;
    }

    // Deterministic mock status derived from the reference so this page
    // never needs a live backend to demonstrate the tracking experience.
    const mockStageIndex =
      reference.trim().length % page.statusStages.length;
    setDemoResult(null);
    setResult({ stageIndex: mockStageIndex });
  };

  return (
    <>
      <PageHeader
        title={page.heading}
        description={page.intro}
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
          >
            {page.submitLabel}
          </button>
        </form>

        {isDemoMode() && (
          <p style={{ marginTop: "1rem" }}>
            <DemoBadge /> Try it: reference{" "}
            <code>APP-DEMO-2026-0001</code>, code <code>246810</code>
          </p>
        )}

        <div
          style={{ marginTop: "1rem", maxWidth: 560 }}
          role="status"
          aria-live="polite"
        >
          {result ? (
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
              <StatusTimeline
                stages={page.statusStages}
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
