import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/public/PageHeader";
import Section from "@/components/public/Section";
import Notice from "@/components/public/Notice";
import { demoCreateDivorceRegistrationDraft } from "@/demo/services/crvsDivorceRegistrations";
import { DEMO_DIVORCE_OFFICE_ID, DEMO_DIVORCE_OFFICE_NAME, DEMO_JURISDICTION } from "@/demo/seed/crvsAccounts";
import { DivorceApplicant } from "@/domain/crvs/types";
import { divorcePolicyConfig, requiredDocumentsFor } from "@/domain/crvs/divorcePolicyConfig";
import {
  DIVORCE_SOURCE_DESCRIPTIONS,
  DIVORCE_SOURCE_LABELS,
  PUBLIC_DIVORCE_SOURCES,
  PublicDivorceSubmissionSource,
  divorceDocumentLabel,
  relationshipForSource,
} from "../divorceShared";
import toastMessage from "@/utils/common/toastMessage";
import "@/screens/dashboard/crvs/shared.css";
import "../divorcePublic.css";

/** Public applicants have no staff session — the wizard and every demo
 * service call made from the public tree records this label instead, exactly
 * as the public marriage declaration flow does. */
const PUBLIC_ACTOR = { id: "public-applicant", name: "Public applicant" };

/**
 * Route /civil-registration/divorce/register — the entry point that turns a
 * visitor into a draft.
 *
 * The submission-source choice happens here, before the draft exists,
 * because it decides the applicant's default relationship to the case and
 * whether the request follows the foreign-decision path. The wizard's first
 * step shows the same choice again so it can still be changed.
 */
export default function DivorceRegistrationStart() {
  const navigate = useNavigate();
  const [source, setSource] = useState<PublicDivorceSubmissionSource>("APPLICANT");
  const [creating, setCreating] = useState(false);

  const previewDocuments = requiredDocumentsFor({
    applicantIsSpouse: source !== "INTERESTED_PERSON" && source !== "STAFF_ASSISTED",
    isForeign: source === "FOREIGN_DECISION",
  });

  const handleStart = () => {
    if (creating) return;
    setCreating(true);
    try {
      const applicant: DivorceApplicant = {
        documentType: "NATIONAL_ID",
        relationshipToCase: relationshipForSource(source),
        identityVerification: "NOT_VERIFIED",
      };
      const draft = demoCreateDivorceRegistrationDraft(
        {
          source,
          jurisdiction: DEMO_JURISDICTION,
          applicant,
          processingOfficeId: DEMO_DIVORCE_OFFICE_ID,
          processingOfficeName: DEMO_DIVORCE_OFFICE_NAME,
        },
        PUBLIC_ACTOR.id,
        PUBLIC_ACTOR.name
      );
      navigate(`/civil-registration/divorce/register/${draft.id}`);
    } catch (err) {
      toastMessage("error", err);
      setCreating(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Register a divorce granted by a court"
        description="Tell us who is registering, which marriage the divorce ends, and what the court decided. You can save your progress and come back at any time using your reference."
        eyebrow="Civil registration"
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "Civil registration", href: "/civil-registration" },
          { label: "Divorce registration", href: "/civil-registration/divorce" },
          { label: "Register a divorce" },
        ]}
      />

      <Section>
        <Notice type="info" title="This service records a decision a court has already made">
          Registering a divorce is an administrative step that comes after the court has finished. It does not file a
          divorce case, arrange a hearing, look at why the marriage ended, or decide anything about children,
          maintenance or property. If your divorce has not yet been granted, there is nothing to register yet.
        </Notice>

        <fieldset style={{ border: "none", margin: "1.5rem 0 0", padding: 0 }}>
          <legend>
            <h2 style={{ margin: 0 }}>Who is registering this divorce?</h2>
          </legend>
          <p className="public-form-hint">
            Your answer decides which declarations and documents you will be asked for.
          </p>

          <ul className="divorce-option-list">
            {PUBLIC_DIVORCE_SOURCES.map((option) => (
              <li key={option}>
                <label
                  className={`divorce-option-card${source === option ? " is-selected" : ""}`}
                  htmlFor={`divorce-start-source-${option}`}
                  style={{ display: "flex", gap: 12, alignItems: "flex-start", cursor: "pointer" }}
                >
                  <input
                    type="radio"
                    id={`divorce-start-source-${option}`}
                    name="divorce-start-source"
                    checked={source === option}
                    onChange={() => setSource(option)}
                    data-testid={`divorce-start-source-${option}`}
                    style={{ marginTop: 4 }}
                  />
                  <span>
                    <strong>{DIVORCE_SOURCE_LABELS[option]}</strong>
                    <span className="public-form-hint" style={{ display: "block", marginTop: 4 }}>
                      {DIVORCE_SOURCE_DESCRIPTIONS[option]}
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
              <li key={documentType}>{divorceDocumentLabel(documentType)}</li>
            ))}
          </ul>
          <p className="public-form-hint" style={{ margin: 0 }}>
            You can start now and upload documents as you go — nothing is submitted until you complete the final review
            step.
            {!divorcePolicyConfig.fees.required && " There is no fee for this service."}
          </p>
        </div>

        <div className="public-hero-actions" style={{ marginTop: "1.5rem" }}>
          <button
            type="button"
            className="public-btn public-btn-primary"
            onClick={handleStart}
            disabled={creating}
            data-testid="divorce-registration-start"
          >
            {creating ? "Creating your draft…" : "Start now"}
          </button>
          <button
            type="button"
            className="public-btn public-btn-outline"
            onClick={() => navigate("/civil-registration/divorce")}
            data-testid="divorce-registration-start-back"
          >
            Back to divorce registration
          </button>
        </div>
      </Section>
    </>
  );
}
