import PageHeader from "@/components/public/PageHeader";
import Section from "@/components/public/Section";
import Notice from "@/components/public/Notice";
import PublicButton from "@/components/public/PublicButton";
import DemoBadge from "@/components/demoBadge";
import { isDemoMode } from "@/demo/config";
import { getDemoData } from "@/demo/storage/demoStore";

/** Public birth-certificate landing page (spec §13). Purely informational —
 * it explains that this service requests proof of an already-registered
 * birth, and never implies that requesting a certificate registers an
 * unregistered birth. */
export default function BirthCertificateLanding() {
  const config = isDemoMode() ? getDemoData().crvsCertificateConfig : undefined;

  return (
    <>
      <PageHeader
        title="Birth certificate"
        description="Request an official-format demo document proving an already registered birth."
        eyebrow="Certificates"
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "Certificates", href: "/certificates" },
          { label: "Birth certificate" },
        ]}
      >
        <div className="public-hero-actions">
          <PublicButton href="/certificates/birth/request" variant="primary" testId="birth-cert-request-cta">
            Request birth certificate
          </PublicButton>
          <PublicButton href="/track" variant="secondary" testId="birth-cert-track-cta">
            Track request
          </PublicButton>
          <PublicButton href="/verify" variant="outline" testId="birth-cert-verify-cta">
            Verify certificate
          </PublicButton>
        </div>
      </PageHeader>

      <Section>
        <Notice type="info" title="What this service does">
          A birth certificate is documentary proof of a birth that has already been registered with the civil
          registration authority. Requesting a certificate does not register a birth — if the birth hasn't been
          registered yet, it must go through birth registration first.
        </Notice>
        {isDemoMode() && (
          <p style={{ marginTop: "0.75rem" }}>
            <DemoBadge /> This is a demonstration environment. Certificates generated here are watermarked "DEMO —
            NOT A LEGALLY VALID CERTIFICATE" and carry no legal effect.
          </p>
        )}
      </Section>

      <Section alt heading="Who may request">
        <ul className="public-fact-list">
          <li>The person named on the birth record, once they are of legal age.</li>
          <li>A parent of the child named on the record.</li>
          <li>A legal guardian, with supporting authorization.</li>
          <li>An authorized representative acting on behalf of the above.</li>
        </ul>
      </Section>

      <Section heading="Requirements">
        <div className="public-grid public-grid-3">
          <div className="public-card">
            <h3>Identification</h3>
            <p>A valid identification document for the requester.</p>
          </div>
          <div className="public-card">
            <h3>Birth-record details</h3>
            <p>The subject's NIN, citizen application number, or birth-record number, and date of birth.</p>
          </div>
          <div className="public-card">
            <h3>Relationship evidence</h3>
            <p>Where the requester is not the subject, evidence of relationship or authorization.</p>
          </div>
        </div>
      </Section>

      <Section alt heading="Processing guidance">
        <p className="public-section-intro">
          Requests for eligible, already-registered records are typically issued automatically once demo payment is
          completed. Requests needing manual review — a relationship that can't be automatically confirmed, multiple
          possible matches, or an underlying-record restriction — are reviewed by a Civil Registrar before issuance.
        </p>
      </Section>

      <Section heading="Fee guidance">
        <dl className="public-fact-list">
          <div>
            <dt>Demo fee</dt>
            <dd>{config ? `${config.currency} ${config.fee}` : "Configured per deployment"}</dd>
          </div>
          <div>
            <dt>Payment</dt>
            <dd>Simulated in this environment — no real payment provider is called, and no real card or bank details are collected.</dd>
          </div>
        </dl>
      </Section>

      <Section alt heading="Privacy">
        <Notice type="info" title="What we ask for">
          We only ask for what's needed to verify your identity and locate the matching birth record. Full identity
          numbers and unrelated records are never shown to a public requester.
        </Notice>
      </Section>

      <Section heading="Verification">
        <p className="public-section-intro">
          Every issued demo certificate carries a QR code and verification code that anyone can check at{" "}
          <a href="/verify">/verify</a> — the result shows only validity, issuing authority, document type, status,
          issue date, and a masked holder-name match, never full record details.
        </p>
      </Section>
    </>
  );
}
