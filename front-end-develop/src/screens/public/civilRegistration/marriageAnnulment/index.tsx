import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/public/PageHeader";
import Section from "@/components/public/Section";
import Notice from "@/components/public/Notice";
import WarningModal from "@/components/crvs/modals/WarningModal";
import { annulmentPolicyConfig, requiredDocumentsFor } from "@/domain/crvs/annulmentPolicyConfig";
import { DEMO_ANNULMENT_OFFICE_NAME } from "@/demo/seed/crvsAccounts";
import { annulmentDocumentLabel } from "./marriageAnnulmentShared";
import "./marriageAnnulmentPublic.css";

type PendingRequest = "record" | "certificate";

/**
 * Marriage-annulment-service landing page (route
 * /civil-registration/marriage-annulment).
 *
 * Follows the divorce landing page's structure (which itself follows
 * marriage and death): this page needs several functional entry points and,
 * above all, has to carry the distinction the generic civil-registration
 * service-page template has no slot for — that this service registers an
 * annulment decision a court or legally recognized authority has ALREADY
 * made, and never itself decides whether a marriage was void or voidable.
 *
 * Every number, document list and requirement quoted below is read from
 * annulmentPolicyConfig; none is hardcoded here. This page carries no
 * PublicLanguageContext entry (unlike divorce/marriage/death, which have
 * hand-authored copy in src/config/publicContent), since none exists for
 * marriage annulment yet and adding one is outside this module's scope — the
 * copy below is authored directly instead.
 */
export default function MarriageAnnulmentServiceLanding() {
  const navigate = useNavigate();

  const [resumeReference, setResumeReference] = useState("");
  const [trackReference, setTrackReference] = useState("");
  const [formError, setFormError] = useState<string | undefined>();
  const [pendingRequest, setPendingRequest] = useState<PendingRequest | undefined>();
  const [showServiceCentreInfo, setShowServiceCentreInfo] = useState(false);

  const standardDocuments = requiredDocumentsFor({ applicantIsParty: true, isForeign: false });
  const notAPartyDocuments = annulmentPolicyConfig.requiredDocuments.APPLICANT_NOT_A_PARTY;
  const foreignDocuments = annulmentPolicyConfig.requiredDocuments.FOREIGN;

  const handleResume = (event: React.FormEvent) => {
    event.preventDefault();
    if (!resumeReference.trim()) {
      setFormError("Enter the reference of the saved registration request you want to continue.");
      return;
    }
    setFormError(undefined);
    navigate(`/civil-registration/marriage-annulment/register/${resumeReference.trim()}`);
  };

  const handleTrack = (event: React.FormEvent) => {
    event.preventDefault();
    if (!trackReference.trim()) {
      setFormError("Enter your registration reference to track a request.");
      return;
    }
    setFormError(undefined);
    navigate(`/civil-registration/marriage-annulment/case/${trackReference.trim()}`);
  };

  /** Record and certificate services only exist once an annulment is
   * registered, so both actions route to the tracking page for that
   * reference — which tells the applicant whether it is available yet. With
   * no reference we explain that rather than leaving a dead button. */
  const handleRequestDocument = (request: PendingRequest) => {
    if (!trackReference.trim()) {
      setPendingRequest(request);
      return;
    }
    setFormError(undefined);
    navigate(`/civil-registration/marriage-annulment/case/${trackReference.trim()}?request=${request}`);
  };

  return (
    <>
      <PageHeader
        title="Register a marriage annulment"
        description="Record an annulment decision a court or legally recognized authority has already made, track a request you have submitted, and request an annulment record or certificate once the annulment is registered."
        eyebrow="Civil registration"
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "Civil registration", href: "/civil-registration" },
          { label: "Marriage annulment registration" },
        ]}
      />

      <Section spacing="compact">
        <div className="public-hero-actions" role="group" aria-label="Marriage annulment registration actions">
          <button
            type="button"
            className="public-btn public-btn-primary"
            onClick={() => navigate("/civil-registration/marriage-annulment/register")}
            data-testid="annulment-landing-register"
          >
            Register an existing decision
          </button>

          <form onSubmit={handleResume} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input
              aria-label="Saved registration reference"
              placeholder="Saved request reference"
              value={resumeReference}
              onChange={(e) => setResumeReference(e.target.value)}
              data-testid="annulment-landing-resume-input"
            />
            <button type="submit" className="public-btn public-btn-secondary" data-testid="annulment-landing-resume">
              Continue a saved request
            </button>
          </form>

          <form onSubmit={handleTrack} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input
              aria-label="Registration reference"
              placeholder="Registration reference"
              value={trackReference}
              onChange={(e) => setTrackReference(e.target.value)}
              data-testid="annulment-landing-track-input"
            />
            <button type="submit" className="public-btn public-btn-outline" data-testid="annulment-landing-track">
              Track a registration
            </button>
          </form>

          <button
            type="button"
            className="public-btn public-btn-outline"
            onClick={() => handleRequestDocument("record")}
            data-testid="annulment-landing-request-record"
          >
            Request an annulment record
          </button>

          <button
            type="button"
            className="public-btn public-btn-outline"
            onClick={() => handleRequestDocument("certificate")}
            data-testid="annulment-landing-request-certificate"
          >
            Request an annulment certificate
          </button>
        </div>

        <p className="public-form-hint" style={{ marginTop: 4 }}>
          An annulment record or certificate can only be issued once the annulment has been registered. Enter your
          registration reference in the “Registration reference” field above, then choose one of those two actions.
        </p>

        {formError && (
          <p className="public-form-error" role="alert" style={{ marginTop: 8 }}>
            {formError}
          </p>
        )}
      </Section>

      <Section heading="Annulment, divorce and registering a decision are different things">
        <p className="public-section-intro">
          An annulment is a decision by a court or other legally recognized authority that a marriage was never validly
          formed (void) or is set aside from the point the decision is made (voidable) — a different legal effect from a
          divorce, which ends a validly-formed marriage. This service does none of that deciding. It only records a
          decision that has already been made, so the civil register reflects it.
        </p>
        <Notice type="warning" title="This service cannot annul your marriage">
          Only a court or other legally recognized authority can annul a marriage. This service does not open an
          annulment case, arrange hearings, examine the grounds for an annulment, or decide anything about children,
          maintenance or property. It records a decision that has already been made, and it cannot change that
          decision. If a decision has not yet been made, there is nothing to register yet — you will need the final
          decision first.
        </Notice>
        <Notice type="info" title="Why registration still matters">
          Until the annulment is registered, the civil register still shows the marriage as active. That affects
          anything which depends on civil status, including remarrying. Registration is what brings the register into
          line with the decision that has already been made.
        </Notice>
      </Section>

      <Section alt heading="Who may submit a registration request">
        <ul className="public-grid public-grid-2" style={{ listStyle: "none", padding: 0 }}>
          <li className="public-card">Either of the two people whose marriage was annulled, acting alone.</li>
          <li className="public-card">Both affected people, submitting together.</li>
          <li className="public-card">Another interested person acting under a declared authority, such as a power of attorney.</li>
          <li className="public-card">A registration officer, entering the request with an applicant at a service centre.</li>
        </ul>
        <p className="public-form-hint">
          If you are not one of the two affected people, you must declare the authority under which you are acting and
          upload the document that establishes it — for example a power of attorney or a court authorisation.
        </p>
      </Section>

      <Section heading="What you will need to tell us">
        <div className="public-grid public-grid-2">
          <div className="public-card">
            <h3>About the marriage</h3>
            <p>
              Enough to identify the marriage on the register: its registration or certificate number if you have it, or
              either affected person's national ID number, or the names, date and place of the marriage. If it cannot be
              found, you can still continue — a registrar searches manually using your marriage certificate.
            </p>
          </div>
          <div className="public-card">
            <h3>About the decision</h3>
            <ul>
              <li>The country and the court or authority that made the decision.</li>
              <li>The court case number and the decision number.</li>
              <li>The date of the decision and the date it became final.</li>
              <li>The type of decision, and the raw wording it uses about the marriage's status.</li>
            </ul>
            <p className="public-form-hint" style={{ margin: 0 }}>
              You are never asked why the annulment was decided, what was argued, or what the decision determined about
              children, maintenance or property. You are also never asked to classify the marriage's legal status
              yourself — only a registrar makes that classification, from the decision you upload.
            </p>
          </div>
        </div>
      </Section>

      <Section alt heading="Documents that may be required">
        <div className="public-grid public-grid-2">
          <div className="public-card">
            <h3>Always required</h3>
            <ul>
              {standardDocuments.map((documentType) => (
                <li key={documentType}>{annulmentDocumentLabel(documentType)}</li>
              ))}
            </ul>
          </div>
          <div className="public-card">
            <h3>If you are not one of the two affected people</h3>
            <ul>
              {notAPartyDocuments.map((documentType) => (
                <li key={documentType}>{annulmentDocumentLabel(documentType)}</li>
              ))}
            </ul>
            <h3 style={{ marginTop: "1rem" }}>If the decision was made abroad</h3>
            <ul>
              {foreignDocuments.map((documentType) => (
                <li key={documentType}>{annulmentDocumentLabel(documentType)}</li>
              ))}
            </ul>
          </div>
        </div>
        <p className="public-form-hint">
          Upload a clear scan or photograph of each document — PDF, JPG or PNG up to 5MB. The registration form tells you
          exactly which documents your own circumstances require.
        </p>
      </Section>

      <Section heading="If the decision was made outside this country">
        <p className="public-section-intro">
          A decision made abroad can be registered here, but it has to be recognised first. You will be asked for
          {annulmentPolicyConfig.foreignDecision.translationRequiredByDefault ? " a certified translation," : ""}
          {annulmentPolicyConfig.foreignDecision.authenticationRequiredByDefault ? " authentication or legalisation of the decision," : ""}
          {annulmentPolicyConfig.foreignDecision.exequaturOrRecognitionRequiredByDefault ? " and a recognition or exequatur decision." : "."}
        </p>
        {annulmentPolicyConfig.foreignDecision.alwaysRequiresSupervisorLegalReview && (
          <Notice type="info" title="A supervisor always reviews a foreign decision">
            Expect the recognition review to take up to {annulmentPolicyConfig.sla.foreignReviewDays} working days on
            top of the usual review time. You can also ask an embassy or consular civil registration desk to handle the
            request instead of a local office.
          </Notice>
        )}
      </Section>

      <Section alt heading="What happens after you submit">
        <ol className="public-steps">
          {[
            `A registration officer reviews your request, usually within about ${annulmentPolicyConfig.sla.reviewDays} working days.`,
            `The decision is verified against the issuing court or authority's details, which takes up to ${annulmentPolicyConfig.sla.decisionVerificationDays} working days.`,
            `Authorized staff review the wording you captured and make the final legal-effect classification — never made automatically, and never made by the applicant.`,
            `If anything needs correcting you are sent a secure link and have ${annulmentPolicyConfig.sla.correctionResponseDays} days to respond. Only the parts the officer asked about can be changed.`,
            "If the request is approved, the annulment is entered in the register and given a registration number.",
            "The existing marriage record is marked as annulled. It is never deleted — the original marriage registration stays on the register as a permanent record, with a complete timeline showing both events.",
            "Each affected person's national identity record is considered separately for an update — the resulting civil status is never assumed to be single; it follows from the confirmed legal-effect classification, and other identity information (name, nationality, address, family relationships) is never changed by this process.",
          ].map((step, index) => (
            <li className="public-step" key={step}>
              <span className="public-step-number" aria-hidden="true">
                {index + 1}
              </span>
              <p>{step}</p>
            </li>
          ))}
        </ol>
        <Notice type="info" title="Submitting a request never registers the annulment on its own">
          Registration happens only after a registration officer has verified the decision, classified its legal
          effect, and approved the request. Your submission acknowledgement is not an annulment certificate.
        </Notice>
      </Section>

      <Section heading="How your identity record is updated">
        <p className="public-section-intro">
          When the annulment is registered, each affected person's identity record is considered separately for an
          update. What gets written follows from the confirmed legal-effect classification — this service never
          automatically assumes the resulting civil status is single. If one update cannot be completed automatically,
          it is referred for manual follow-up without holding up the other. Nothing else about either person's identity
          — their name, nationality, address, or family relationships — is changed by this process.
        </p>
      </Section>

      <Section alt heading="Annulment records and certificates">
        <p className="public-section-intro">
          An annulment record or certificate can be requested once the annulment has been registered and any
          outstanding correction or review has been resolved. Track your request with your reference — the tracking
          page tells you when it becomes available, and the “Request an annulment record” and “Request an annulment
          certificate” actions at the top of this page take you there.
        </p>
      </Section>

      <Section heading="Frequently asked questions">
        <div className="public-grid public-grid-2">
          <div className="public-card">
            <h3>Can this service decide whether my marriage is annulled?</h3>
            <p>No. Only a court or other legally recognized authority can make that decision. This service records it.</p>
          </div>
          <div className="public-card">
            <h3>Will my original marriage record be deleted?</h3>
            <p>
              No. It is preserved and marked as annulled — the register keeps a complete history showing both the
              marriage and the annulment.
            </p>
          </div>
          <div className="public-card">
            <h3>Will my other identity details change automatically?</h3>
            <p>
              No. Only your civil status may be updated, and only once a registrar has classified the decision's legal
              effect. Your name, nationality, address and family relationships are never changed by this process.
            </p>
          </div>
          <div className="public-card">
            <h3>What if the marriage record cannot be found?</h3>
            <p>
              You can still continue. Upload your marriage certificate or record and a registrar will search for it
              manually — this does not stop your registration request.
            </p>
          </div>
        </div>
      </Section>

      <Section alt heading="Privacy and confidentiality">
        <Notice type="info" title="Court and authority documents are treated as restricted">
          The decision document and related court records you upload are visible only to you and to the staff handling
          this case. They are never shown on the public tracking page, and the other affected person's contact details
          and submitted information are never shown to you.
        </Notice>
      </Section>

      <Section heading="Help and service centres">
        <div className="public-hero-actions">
          <button
            type="button"
            className="public-btn public-btn-secondary"
            onClick={() => navigate("/service-centres")}
            data-testid="annulment-landing-service-centres"
          >
            Find a service centre
          </button>
          <button
            type="button"
            className="public-btn public-btn-outline"
            onClick={() => setShowServiceCentreInfo(true)}
            data-testid="annulment-landing-office-info"
          >
            Which office handles annulment registration?
          </button>
          <button type="button" className="public-btn public-btn-outline" onClick={() => navigate("/help")} data-testid="annulment-landing-help">
            Get help
          </button>
        </div>
      </Section>

      <WarningModal
        show={!!pendingRequest}
        onClose={() => setPendingRequest(undefined)}
        title={pendingRequest === "certificate" ? "An annulment certificate needs a registered annulment" : "An annulment record needs a registered annulment"}
        primaryLabel="Enter my reference"
        onPrimary={() => {
          setPendingRequest(undefined);
          setFormError("Enter your registration reference above, then choose that action again.");
          document.querySelector<HTMLInputElement>('[data-testid="annulment-landing-track-input"]')?.focus();
        }}
        testId="annulment-landing-document-request-modal"
      >
        <p style={{ margin: 0 }}>
          {pendingRequest === "certificate"
            ? "An annulment certificate can only be issued after the annulment has been registered."
            : "A copy of an annulment record can only be issued after the annulment has been registered."}{" "}
          Enter your registration reference in the “Registration reference” field, and we will take you to your
          tracking page — it shows whether your annulment is registered yet and whether the document can be requested.
        </p>
        <p style={{ margin: "8px 0 0" }}>
          If you have not submitted a registration request yet, start with “Register an existing decision”. If you have
          lost your reference, a service centre can help you find it.
        </p>
      </WarningModal>

      <WarningModal
        show={showServiceCentreInfo}
        onClose={() => setShowServiceCentreInfo(false)}
        title="Where annulment registrations are processed"
        primaryLabel="See all service centres"
        onPrimary={() => {
          setShowServiceCentreInfo(false);
          navigate("/service-centres");
        }}
        testId="annulment-landing-office-info-modal"
      >
        <p style={{ margin: 0 }}>
          An annulment is registered either at the office where the marriage was registered, or at the office covering
          where you live. If the decision was made abroad, an embassy or consular civil registration desk can handle it
          instead.
        </p>
        <p style={{ margin: "8px 0 0" }}>
          In this demonstration environment, marriage annulment registrations are handled by{" "}
          <strong>{DEMO_ANNULMENT_OFFICE_NAME}</strong>. The registration form lets you choose between the available
          offices, and asks for a reason if you pick one other than the expected office.
        </p>
      </WarningModal>
    </>
  );
}
