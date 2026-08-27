import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePublicLanguage } from "@/context/PublicLanguageContext";
import PageHeader from "@/components/public/PageHeader";
import Section from "@/components/public/Section";
import Notice from "@/components/public/Notice";
import FaqList from "@/components/public/FaqList";
import WarningModal from "@/components/crvs/modals/WarningModal";
import { divorcePolicyConfig, requiredDocumentsFor } from "@/domain/crvs/divorcePolicyConfig";
import { DEMO_DIVORCE_OFFICE_NAME } from "@/demo/seed/crvsAccounts";
import { divorceDocumentLabel } from "./divorceShared";
import "./divorcePublic.css";

type PendingRequest = "record" | "certificate";

/**
 * Divorce-service landing page (route /civil-registration/divorce).
 *
 * Follows the marriage and death landing pages rather than the generic
 * CivilRegistrationServicePage template: this page needs several functional
 * entry points and, above all, has to carry the distinction the generic
 * template has no slot for — that this service registers a divorce a court
 * has ALREADY granted and never obtains one.
 *
 * Every number, document list and requirement quoted below is read from
 * divorcePolicyConfig; none is hardcoded here.
 */
export default function DivorceServiceLanding() {
  const navigate = useNavigate();
  const { content } = usePublicLanguage();
  const page = content.servicePages.divorce;

  const [resumeReference, setResumeReference] = useState("");
  const [trackReference, setTrackReference] = useState("");
  const [formError, setFormError] = useState<string | undefined>();
  const [pendingRequest, setPendingRequest] = useState<PendingRequest | undefined>();
  const [showServiceCentreInfo, setShowServiceCentreInfo] = useState(false);

  const standardDocuments = requiredDocumentsFor({ applicantIsSpouse: true, isForeign: false });
  const notASpouseDocuments = divorcePolicyConfig.requiredDocuments.APPLICANT_NOT_A_SPOUSE;
  const foreignDocuments = divorcePolicyConfig.requiredDocuments.FOREIGN;

  const handleResume = (event: React.FormEvent) => {
    event.preventDefault();
    if (!resumeReference.trim()) {
      setFormError("Enter the reference of the saved registration request you want to continue.");
      return;
    }
    setFormError(undefined);
    navigate(`/civil-registration/divorce/register/${resumeReference.trim()}`);
  };

  const handleTrack = (event: React.FormEvent) => {
    event.preventDefault();
    if (!trackReference.trim()) {
      setFormError("Enter your registration reference to track a request.");
      return;
    }
    setFormError(undefined);
    navigate(`/civil-registration/divorce/case/${trackReference.trim()}`);
  };

  /** Record and certificate services only exist once a divorce is
   * registered, so both actions route to the tracking page for that
   * reference — which tells the applicant whether it is available yet. With
   * no reference we explain that rather than leaving a dead button. */
  const handleRequestDocument = (request: PendingRequest) => {
    if (!trackReference.trim()) {
      setPendingRequest(request);
      return;
    }
    setFormError(undefined);
    navigate(`/civil-registration/divorce/case/${trackReference.trim()}?request=${request}`);
  };

  return (
    <>
      <PageHeader
        title="Register a divorce granted by a court"
        description="Record a divorce a court has already granted, track a request you have submitted, and request a divorce record or certificate once the divorce is registered."
        eyebrow={content.common.nav.civilRegistration}
        breadcrumb={[
          { label: content.common.nav.home, href: "/" },
          { label: content.common.nav.civilRegistration, href: "/civil-registration" },
          { label: "Divorce registration" },
        ]}
      />

      <Section spacing="compact">
        <div className="public-hero-actions" role="group" aria-label="Divorce registration actions">
          <button
            type="button"
            className="public-btn public-btn-primary"
            onClick={() => navigate("/civil-registration/divorce/register")}
            data-testid="divorce-landing-register"
          >
            Register an existing divorce
          </button>

          <form onSubmit={handleResume} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input
              aria-label="Saved registration reference"
              placeholder="Saved request reference"
              value={resumeReference}
              onChange={(e) => setResumeReference(e.target.value)}
              data-testid="divorce-landing-resume-input"
            />
            <button type="submit" className="public-btn public-btn-secondary" data-testid="divorce-landing-resume">
              Continue a saved request
            </button>
          </form>

          <form onSubmit={handleTrack} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input
              aria-label="Registration reference"
              placeholder="Registration reference"
              value={trackReference}
              onChange={(e) => setTrackReference(e.target.value)}
              data-testid="divorce-landing-track-input"
            />
            <button type="submit" className="public-btn public-btn-outline" data-testid="divorce-landing-track">
              Track a registration
            </button>
          </form>

          <button type="button" className="public-btn public-btn-outline" onClick={() => handleRequestDocument("record")} data-testid="divorce-landing-request-record">
            Request a divorce record
          </button>

          <button
            type="button"
            className="public-btn public-btn-outline"
            onClick={() => handleRequestDocument("certificate")}
            data-testid="divorce-landing-request-certificate"
          >
            Request a divorce certificate
          </button>
        </div>

        <p className="public-form-hint" style={{ marginTop: 4 }}>
          A divorce record or certificate can only be issued once the divorce has been registered. Enter your
          registration reference in the “Registration reference” field above, then choose one of those two actions.
        </p>

        {formError && (
          <p className="public-form-error" role="alert" style={{ marginTop: 8 }}>
            {formError}
          </p>
        )}
      </Section>

      <Section heading="Getting a divorce and registering one are different things">
        <p className="public-section-intro">{page.description}</p>
        <Notice type="warning" title="This service cannot grant you a divorce">
          Only a court can end a marriage. This service does not file a divorce case, arrange hearings, examine why a
          marriage ended, or decide anything about children, maintenance or property. It records a decision the court
          has already made, and it cannot change that decision. If a court has not yet granted your divorce, there is
          nothing to register yet — you will need the final decision first.
        </Notice>
        <Notice type="info" title="Why registration still matters">
          Until the divorce is registered, the civil register still shows the marriage as active and both former spouses
          as married. That affects anything which depends on civil status, including remarrying. Registration is what
          brings the register into line with the court's decision.
        </Notice>
      </Section>

      <Section alt heading="Who may submit a registration request">
        <ul className="public-grid public-grid-2" style={{ listStyle: "none", padding: 0 }}>
          {page.whoMayApply.map((item) => (
            <li key={item} className="public-card">
              {item}
            </li>
          ))}
        </ul>
        <p className="public-form-hint">
          If you are not one of the former spouses, you must declare the authority under which you are acting and upload
          the document that establishes it — for example a power of attorney or a court authorisation.
        </p>
      </Section>

      <Section heading="What you will need to tell us">
        <div className="public-grid public-grid-2">
          <div className="public-card">
            <h3>About the marriage</h3>
            <p>
              Enough to identify the marriage on the register: its registration or certificate number if you have it, or
              either former spouse's national ID number, or the names, date and place of the marriage. If it cannot be
              found, you can still continue — a registrar searches manually using your marriage certificate.
            </p>
          </div>
          <div className="public-card">
            <h3>About the court decision</h3>
            <ul>
              <li>The country and the court or authority that granted the divorce.</li>
              <li>The court case number and the judgment or order number.</li>
              <li>The date of the judgment and the date it became final.</li>
              <li>The type of decision, and the date it takes effect if the decision states one.</li>
            </ul>
            <p className="public-form-hint" style={{ margin: 0 }}>
              You are never asked why the divorce was granted, what was argued, or what the court decided about children,
              maintenance or property.
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
                <li key={documentType}>{divorceDocumentLabel(documentType)}</li>
              ))}
            </ul>
          </div>
          <div className="public-card">
            <h3>If you are not one of the former spouses</h3>
            <ul>
              {notASpouseDocuments.map((documentType) => (
                <li key={documentType}>{divorceDocumentLabel(documentType)}</li>
              ))}
            </ul>
            <h3 style={{ marginTop: "1rem" }}>If the divorce was granted abroad</h3>
            <ul>
              {foreignDocuments.map((documentType) => (
                <li key={documentType}>{divorceDocumentLabel(documentType)}</li>
              ))}
            </ul>
          </div>
        </div>
        <p className="public-form-hint">
          Upload a clear scan or photograph of each document — PDF, JPG or PNG up to 5MB. The registration form tells you
          exactly which documents your own circumstances require.
        </p>
      </Section>

      <Section heading="If the divorce was granted outside this country">
        <p className="public-section-intro">
          A decision granted abroad can be registered here, but it has to be recognised first. You will be asked for
          {divorcePolicyConfig.foreignJudgment.translationRequiredByDefault ? " a certified translation," : ""}
          {divorcePolicyConfig.foreignJudgment.authenticationRequiredByDefault ? " authentication or legalisation of the decision," : ""}
          {divorcePolicyConfig.foreignJudgment.exequaturOrRecognitionRequiredByDefault ? " and a recognition or exequatur decision." : "."}
        </p>
        {divorcePolicyConfig.foreignJudgment.alwaysRequiresSupervisorLegalReview && (
          <Notice type="info" title="A supervisor always reviews a foreign decision">
            Expect the recognition review to take up to {divorcePolicyConfig.sla.foreignReviewDays} working days on top
            of the usual review time. You can also ask an embassy or consular civil registration desk to handle the
            request instead of a local office.
          </Notice>
        )}
      </Section>

      <Section alt heading="What happens after you submit">
        <ol className="public-steps">
          {[
            `A registration officer reviews your request, usually within about ${divorcePolicyConfig.sla.reviewDays} working days.`,
            `The court decision is verified against the issuing court's details, which takes up to ${divorcePolicyConfig.sla.judgmentVerificationDays} working days.`,
            `If anything needs correcting you are sent a secure link and have ${divorcePolicyConfig.sla.correctionResponseDays} days to respond. Only the parts the officer asked about can be changed.`,
            "If the request is approved, the divorce is entered in the register and given a registration number.",
            "The existing marriage record is marked as dissolved. It is never deleted — the original marriage registration stays on the register as a permanent record.",
            "Both former spouses' national identity records are updated to show a civil status of divorced, through a separate tracked step.",
          ].map((step, index) => (
            <li className="public-step" key={step}>
              <span className="public-step-number" aria-hidden="true">
                {index + 1}
              </span>
              <p>{step}</p>
            </li>
          ))}
        </ol>
        <Notice type="info" title="Submitting a request never registers the divorce on its own">
          Registration happens only after a registration officer has verified the court decision and approved the
          request. Your submission acknowledgement is not a divorce certificate.
        </Notice>
      </Section>

      <Section heading="How your identity record is updated">
        <p className="public-section-intro">
          When the divorce is registered, each former spouse's identity record is updated separately to show a civil
          status of “{divorcePolicyConfig.sdidSync.maritalStatusOnSuccess.toLowerCase()}”, and the marriage relationship
          on both records is ended using the divorce's effective date. The relationship itself is not deleted, and
          neither is the original marriage registration — the register keeps the full history. If one of the two updates
          cannot be completed automatically, it is referred for manual follow-up without holding up the other.
        </p>
      </Section>

      <Section alt heading="Divorce records and certificates">
        <p className="public-section-intro">
          A divorce record or certificate can be requested once the divorce has been registered and any outstanding
          correction or review has been resolved. Track your request with your reference — the tracking page tells you
          when it becomes available, and the “Request a divorce record” and “Request a divorce certificate” actions at
          the top of this page take you there.
        </p>
        {!divorcePolicyConfig.fees.required && <p className="public-section-intro">There is no fee for registering a divorce.</p>}
      </Section>

      <Section heading="Frequently asked questions">
        <FaqList items={page.faqs} />
      </Section>

      <Section alt heading="Privacy and confidentiality">
        <Notice type="info" title="Court documents are treated as restricted">
          {page.privacyNotice}
        </Notice>
      </Section>

      <Section heading="Help and service centres">
        <div className="public-hero-actions">
          <button
            type="button"
            className="public-btn public-btn-secondary"
            onClick={() => navigate("/service-centres")}
            data-testid="divorce-landing-service-centres"
          >
            Find a service centre
          </button>
          <button
            type="button"
            className="public-btn public-btn-outline"
            onClick={() => setShowServiceCentreInfo(true)}
            data-testid="divorce-landing-office-info"
          >
            Which office handles divorce registration?
          </button>
          <button type="button" className="public-btn public-btn-outline" onClick={() => navigate("/help")} data-testid="divorce-landing-help">
            Get help
          </button>
        </div>
      </Section>

      <WarningModal
        show={!!pendingRequest}
        onClose={() => setPendingRequest(undefined)}
        title={pendingRequest === "certificate" ? "A divorce certificate needs a registered divorce" : "A divorce record needs a registered divorce"}
        primaryLabel="Enter my reference"
        onPrimary={() => {
          setPendingRequest(undefined);
          setFormError("Enter your registration reference above, then choose that action again.");
          document.querySelector<HTMLInputElement>('[data-testid="divorce-landing-track-input"]')?.focus();
        }}
        testId="divorce-landing-document-request-modal"
      >
        <p style={{ margin: 0 }}>
          {pendingRequest === "certificate"
            ? "A divorce certificate can only be issued after the divorce has been registered."
            : "A copy of a divorce record can only be issued after the divorce has been registered."}{" "}
          Enter your registration reference in the “Registration reference” field, and we will take you to your tracking
          page — it shows whether your divorce is registered yet and whether the document can be requested.
        </p>
        <p style={{ margin: "8px 0 0" }}>
          If you have not submitted a registration request yet, start with “Register an existing divorce”. If you have
          lost your reference, a service centre can help you find it.
        </p>
      </WarningModal>

      <WarningModal
        show={showServiceCentreInfo}
        onClose={() => setShowServiceCentreInfo(false)}
        title="Where divorce registrations are processed"
        primaryLabel="See all service centres"
        onPrimary={() => {
          setShowServiceCentreInfo(false);
          navigate("/service-centres");
        }}
        testId="divorce-landing-office-info-modal"
      >
        <p style={{ margin: 0 }}>
          A divorce is registered either at the office where the marriage was registered, or at the office covering
          where you live. If the divorce was granted abroad, an embassy or consular civil registration desk can handle
          it instead.
        </p>
        <p style={{ margin: "8px 0 0" }}>
          In this demonstration environment, divorce registrations are handled by <strong>{DEMO_DIVORCE_OFFICE_NAME}</strong>.
          The registration form lets you choose between the available offices, and asks for a reason if you pick one
          other than the expected office.
        </p>
      </WarningModal>
    </>
  );
}
