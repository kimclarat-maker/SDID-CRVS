import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/public/PageHeader";
import Section from "@/components/public/Section";
import Notice from "@/components/public/Notice";
import { demoCreateAnnulmentRegistrationDraft } from "@/demo/services/crvsAnnulmentRegistrations";
import { DEMO_ANNULMENT_OFFICE_ID, DEMO_ANNULMENT_OFFICE_NAME, DEMO_JURISDICTION } from "@/demo/seed/crvsAccounts";
import { AnnulmentApplicant } from "@/domain/crvs/types";
import { annulmentPolicyConfig, requiredDocumentsFor } from "@/domain/crvs/annulmentPolicyConfig";
import {
  ANNULMENT_SOURCE_DESCRIPTIONS,
  ANNULMENT_SOURCE_LABELS,
  PUBLIC_ANNULMENT_SOURCES,
  PublicAnnulmentSubmissionSource,
  annulmentDocumentLabel,
  applicantIsParty,
  relationshipForSource,
} from "../marriageAnnulmentShared";
import toastMessage from "@/utils/common/toastMessage";
import "@/screens/dashboard/crvs/shared.css";
import "../marriageAnnulmentPublic.css";

/** Public applicants have no staff session — the wizard and every demo
 * service call made from the public tree records this label instead, exactly
 * as the public divorce declaration flow does. */
const PUBLIC_ACTOR = { id: "public-applicant", name: "Public applicant" };

/**
 * Route /civil-registration/marriage-annulment/register — the entry point
 * that turns a visitor into a draft.
 *
 * The submission-source choice happens here, before the draft exists,
 * because it decides the applicant's default relationship to the marriage
 * and whether the request follows the foreign-decision path. The wizard's
 * first step shows the same choice again so it can still be changed.
 */
export default function AnnulmentRegistrationStart() {
  const navigate = useNavigate();
  const [source, setSource] = useState<PublicAnnulmentSubmissionSource>("APPLICANT");
  const [creating, setCreating] = useState(false);

  const previewDocuments = requiredDocumentsFor({
    applicantIsParty: applicantIsParty(relationshipForSource(source)),
    isForeign: source === "FOREIGN_DECISION",
  });

  const handleStart = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const applicant: AnnulmentApplicant = {
        documentType: "NATIONAL_ID",
        relationshipToCase: relationshipForSource(source),
        identityVerification: "NOT_VERIFIED",
      };
      const draft = await demoCreateAnnulmentRegistrationDraft(
        {
          source,
          jurisdiction: DEMO_JURISDICTION,
          applicant,
          processingOffice: {
            selectedProcessingOfficeId: DEMO_ANNULMENT_OFFICE_ID,
            selectedProcessingOfficeName: DEMO_ANNULMENT_OFFICE_NAME,
            embassyOrForeignOfficePath: false,
            jurisdictionResult: "UNRESOLVED",
          },
        },
        PUBLIC_ACTOR.id,
        PUBLIC_ACTOR.name
      );
      navigate(`/civil-registration/marriage-annulment/register/${draft.id}`);
    } catch (err) {
      toastMessage("error", err);
      setCreating(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Register a marriage annulment"
        description="Tell us who is registering, which marriage was annulled, and what the decision states. You can save your progress and come back at any time using your reference."
        eyebrow="Civil registration"
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "Civil registration", href: "/civil-registration" },
          { label: "Marriage annulment registration", href: "/civil-registration/marriage-annulment" },
          { label: "Register an annulment" },
        ]}
      />

      <Section>
        <Notice type="info" title="This service records a decision a court or authority has already made">
          Registering an annulment is an administrative step that comes after the decision has already been made. It
          does not open an annulment case, hold hearings, examine why a marriage was annulled, or decide anything about
          children, maintenance or property. If the decision has not yet been made, there is nothing to register yet.
        </Notice>

        <fieldset style={{ border: "none", margin: "1.5rem 0 0", padding: 0 }}>
          <legend>
            <h2 style={{ margin: 0 }}>Who is registering this annulment?</h2>
          </legend>
          <p className="public-form-hint">Your answer decides which declarations and documents you will be asked for.</p>

          <ul className="annulment-option-list">
            {PUBLIC_ANNULMENT_SOURCES.map((option) => (
              <li key={option}>
                <label
                  className={`annulment-option-card${source === option ? " is-selected" : ""}`}
                  htmlFor={`annulment-start-source-${option}`}
                  style={{ display: "flex", gap: 12, alignItems: "flex-start", cursor: "pointer" }}
                >
                  <input
                    type="radio"
                    id={`annulment-start-source-${option}`}
                    name="annulment-start-source"
                    checked={source === option}
                    onChange={() => setSource(option)}
                    data-testid={`annulment-start-source-${option}`}
                    style={{ marginTop: 4 }}
                  />
                  <span>
                    <strong>{ANNULMENT_SOURCE_LABELS[option]}</strong>
                    <span className="public-form-hint" style={{ display: "block", marginTop: 4 }}>
                      {ANNULMENT_SOURCE_DESCRIPTIONS[option]}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </fieldset>

        <div className="public-card" style={{ marginTop: "1.5rem" }}>
          <h3>What you will need for this route</h3>
          <ul>
            {previewDocuments.map((documentType) => (
              <li key={documentType}>{annulmentDocumentLabel(documentType)}</li>
            ))}
          </ul>
          <p className="public-form-hint" style={{ margin: 0 }}>
            You can start now and upload documents as you go — nothing is submitted until you complete the final review
            step.
          </p>
        </div>

        <div className="public-hero-actions" style={{ marginTop: "1.5rem" }}>
          <button
            type="button"
            className="public-btn public-btn-primary"
            onClick={handleStart}
            disabled={creating}
            data-testid="annulment-registration-start"
          >
            {creating ? "Creating your draft…" : "Start now"}
          </button>
          <button
            type="button"
            className="public-btn public-btn-outline"
            onClick={() => navigate("/civil-registration/marriage-annulment")}
            data-testid="annulment-registration-start-back"
          >
            Back to marriage annulment registration
          </button>
        </div>

        <p className="public-form-hint" style={{ marginTop: "1rem" }}>
          {annulmentPolicyConfig.foreignDecision.alwaysRequiresSupervisorLegalReview &&
            "A decision issued abroad is always reviewed by a supervisor before it can be registered."}
        </p>
      </Section>
    </>
  );
}
