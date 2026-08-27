import Icon from "@/components/icon";
import { DivorceWizardStepProps } from "../wizardTypes";
import ErrorSummary from "../ErrorSummary";
import { divorcePolicyConfig } from "@/domain/crvs/divorcePolicyConfig";
import { DivorceProcessingOffice, DivorceProcessingOfficeJurisdictionResult } from "@/domain/crvs/types";
import { DEMO_DIVORCE_OFFICE_ID, DEMO_DIVORCE_OFFICE_NAME } from "@/demo/seed/crvsAccounts";

const EMBASSY_OFFICE_ID = "OFF-DIVORCE-DEMO-EMBASSY";
const EMBASSY_OFFICE_NAME = "Embassy / consular civil registration desk";

const JURISDICTION_RESULT_LABELS: Record<DivorceProcessingOfficeJurisdictionResult, string> = {
  CONFIRMED: "This office has jurisdiction over your request",
  ALTERNATIVE_REQUIRES_REASON: "This is not the expected office — a reason is required",
  UNRESOLVED: "Jurisdiction cannot be worked out yet",
};

type OfficeOption = {
  id: string;
  name: string;
  basis: string;
  description: string;
};

/**
 * Wizard step 9 — which office should process the request.
 *
 * The rule itself lives in divorcePolicyConfig.jurisdiction (the office
 * where the marriage was registered, or the applicant's own office), as does
 * whether an alternative office needs a reason — this component only applies
 * it and shows the result (spec §6).
 */
export default function ProcessingOfficeStep({ draft, onChange, errors, readOnly }: DivorceWizardStepProps) {
  const office = draft.processingOffice;

  const marriageOfficeName = draft.existingMarriage.selected?.officeName || office.marriageRegisteredOfficeName;
  const domicileOfficeName = office.applicantDomicileOfficeName || DEMO_DIVORCE_OFFICE_NAME;

  const options: OfficeOption[] = [
    ...(marriageOfficeName
      ? [
          {
            id: DEMO_DIVORCE_OFFICE_ID,
            name: marriageOfficeName,
            basis: "Office where the marriage was registered",
            description: "Usually the fastest route, because the marriage record is already held there.",
          },
        ]
      : []),
    {
      id: DEMO_DIVORCE_OFFICE_ID,
      name: domicileOfficeName,
      basis: "Office covering where you live",
      description: draft.applicant.residence ? `Based on the residence you gave: ${draft.applicant.residence}.` : "Based on your place of residence.",
    },
    ...(draft.judgment.isForeign
      ? [
          {
            id: EMBASSY_OFFICE_ID,
            name: EMBASSY_OFFICE_NAME,
            basis: "Embassy or consulate",
            description: "Available because the divorce was granted abroad, or because you live outside the country.",
          },
        ]
      : []),
  ];

  // Dedupe options that resolve to the same office name (the demo registry
  // uses one sector office for both bases).
  const uniqueOptions = options.filter((option, index) => options.findIndex((other) => other.name === option.name) === index);

  const jurisdictionFor = (name: string, isEmbassy: boolean): DivorceProcessingOfficeJurisdictionResult => {
    if (isEmbassy) return draft.judgment.isForeign ? "CONFIRMED" : "ALTERNATIVE_REQUIRES_REASON";
    if (!marriageOfficeName && !domicileOfficeName) return "UNRESOLVED";
    if (name === marriageOfficeName || name === domicileOfficeName) return "CONFIRMED";
    return "ALTERNATIVE_REQUIRES_REASON";
  };

  const setOffice = (patch: Partial<DivorceProcessingOffice>) => {
    const next: DivorceProcessingOffice = { ...office, ...patch };
    onChange({ processingOffice: next });
  };

  const selectOffice = (option: OfficeOption) => {
    const isEmbassy = option.id === EMBASSY_OFFICE_ID;
    setOffice({
      selectedProcessingOfficeId: option.id,
      selectedProcessingOfficeName: option.name,
      marriageRegisteredOfficeName: marriageOfficeName,
      applicantDomicileOfficeName: domicileOfficeName,
      embassyOrForeignOfficePath: isEmbassy,
      jurisdictionResult: jurisdictionFor(option.name, isEmbassy),
      alternativeReason: jurisdictionFor(option.name, isEmbassy) === "ALTERNATIVE_REQUIRES_REASON" ? office.alternativeReason : undefined,
    });
  };

  const needsReason =
    divorcePolicyConfig.jurisdiction.alternativeOfficeRequiresReason && office.jurisdictionResult === "ALTERNATIVE_REQUIRES_REASON";

  return (
    <div className="crvs-review-section">
      <h2 className="crvs-section-title">Where your request will be processed</h2>
      <ErrorSummary errors={errors} />

      <p className="crvs-form-hint">
        A divorce is registered either at the office where the marriage was registered or at the office covering where
        you live. If the decision was granted abroad, an embassy or consular desk can handle it instead.
      </p>

      <fieldset id="divorce-office-selected" style={{ border: "none", margin: "16px 0 0", padding: 0 }} tabIndex={-1}>
        <legend className="crvs-section-title" style={{ fontSize: "1rem", padding: 0 }}>
          Choose an office
        </legend>
        <ul className="divorce-option-list">
          {uniqueOptions.map((option) => {
            const selected = office.selectedProcessingOfficeName === option.name;
            return (
              <li key={`${option.id}-${option.name}`}>
                <label
                  className={`divorce-option-card${selected ? " is-selected" : ""}`}
                  htmlFor={`divorce-office-${option.id}-${option.basis.replace(/\s+/g, "-")}`}
                  style={{ display: "flex", gap: 12, alignItems: "flex-start", cursor: readOnly ? "default" : "pointer" }}
                >
                  <input
                    type="radio"
                    id={`divorce-office-${option.id}-${option.basis.replace(/\s+/g, "-")}`}
                    name="divorce-processing-office"
                    checked={selected}
                    disabled={readOnly}
                    onChange={() => selectOffice(option)}
                    data-testid={`divorce-office-option-${option.basis.replace(/\s+/g, "-").toLowerCase()}`}
                    style={{ marginTop: 4 }}
                  />
                  <span>
                    <strong>{option.name}</strong>
                    <span className="crvs-form-hint" style={{ display: "block", marginTop: 4 }}>
                      {option.basis} — {option.description}
                    </span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </fieldset>

      <div className="divorce-check-row" style={{ marginTop: 16 }}>
        <div className="divorce-check-row-label">
          <strong>Jurisdiction</strong>
          <p className="crvs-form-hint" style={{ margin: "4px 0 0" }}>
            {JURISDICTION_RESULT_LABELS[office.jurisdictionResult]}
          </p>
        </div>
        <span
          className={`crvs-status-pill ${
            office.jurisdictionResult === "CONFIRMED" ? "crvs-status-success" : office.jurisdictionResult === "UNRESOLVED" ? "crvs-status-neutral" : "crvs-status-warning"
          }`}
        >
          <Icon name={office.jurisdictionResult === "CONFIRMED" ? "check_circle" : "help"} />
          {office.jurisdictionResult.replace(/_/g, " ").toLowerCase()}
        </span>
      </div>

      {draft.judgment.isForeign && (
        <div className="crvs-form-group" style={{ marginTop: 16 }}>
          <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontWeight: 400 }}>
            <input
              type="checkbox"
              id="divorce-office-embassy-path"
              checked={office.embassyOrForeignOfficePath}
              disabled={readOnly}
              onChange={(e) =>
                setOffice({
                  embassyOrForeignOfficePath: e.target.checked,
                  selectedProcessingOfficeId: e.target.checked ? EMBASSY_OFFICE_ID : DEMO_DIVORCE_OFFICE_ID,
                  selectedProcessingOfficeName: e.target.checked ? EMBASSY_OFFICE_NAME : domicileOfficeName,
                  jurisdictionResult: "CONFIRMED",
                })
              }
              data-testid="divorce-office-embassy-path"
            />
            Handle this request through an embassy or consular civil registration desk.
          </label>
          <p className="crvs-form-hint">
            Choose this if you are outside the country, or if it is easier to present the original foreign documents at a
            consular desk.
          </p>
        </div>
      )}

      {needsReason && (
        <div className="crvs-form-group" style={{ marginTop: 16 }}>
          <label htmlFor="divorce-office-alternative-reason">Why this office rather than the expected one?</label>
          <textarea
            id="divorce-office-alternative-reason"
            rows={3}
            value={office.alternativeReason || ""}
            disabled={readOnly}
            onChange={(e) => setOffice({ alternativeReason: e.target.value })}
            data-testid="divorce-office-alternative-reason"
          />
          <p className="crvs-form-hint">
            A registrar has to record why an alternative office is handling the request. For example: you have moved, or
            the original office is not reachable.
          </p>
        </div>
      )}

      <div className="crvs-banner crvs-banner-info" style={{ marginTop: 16, alignItems: "flex-start" }}>
        <Icon name="apartment" />
        <div>
          <strong>Currently selected: {office.selectedProcessingOfficeName || "no office chosen yet"}</strong>
          <p style={{ margin: "6px 0 0" }}>
            If a registrar decides a different office should handle the request, it is transferred for you — you do not
            have to start again.
          </p>
        </div>
      </div>
    </div>
  );
}
