import { FormEvent, useState } from "react";
import { usePublicLanguage } from "@/context/PublicLanguageContext";
import PageHeader from "@/components/public/PageHeader";
import Section from "@/components/public/Section";
import Notice from "@/components/public/Notice";
import Icon from "@/components/icon";
import { platformConfig } from "@/config/platform.config";
import { isDemoMode } from "@/demo/config";
import { demoVerifyDocument } from "@/demo/services/public";
import DemoBadge from "@/components/demoBadge";

interface VerifyFormErrors {
  documentNumber?: string;
  verificationCode?: string;
}

interface MockVerificationResult {
  isValid: boolean;
  issuingAuthority: string;
  documentType: string;
  documentStatus: string;
  holderMatch: string;
}

/**
 * Deterministic, client-side-only mock: verification here never queries a
 * real registry. It exists to demonstrate the disclosure-limited result
 * shape the real verification API must return (status, issuing authority,
 * document type, document status, minimal holder match — never a full
 * identity or civil-registration record).
 */
function buildMockResult(
  documentNumber: string,
  verificationCode: string
): MockVerificationResult {
  const isValid = (documentNumber.length + verificationCode.length) % 2 === 0;

  return {
    isValid,
    issuingAuthority: isValid
      ? platformConfig.authorities.civilRegistrationAuthority
      : "Not applicable",
    documentType: isValid ? "Civil registration certificate" : "Not applicable",
    documentStatus: isValid ? "Active" : "Not found",
    holderMatch: isValid ? "Name and date of birth match" : "Not applicable",
  };
}

type VerifyStatus = "valid" | "expired" | "revoked" | "not-found" | "invalid";

function resolveStatus(result: MockVerificationResult): VerifyStatus {
  const status = result.documentStatus.toLowerCase();
  if (status.includes("revoked")) return "revoked";
  if (status.includes("expired")) return "expired";
  if (status.includes("not found")) return "not-found";
  return result.isValid ? "valid" : "invalid";
}

const STATUS_PRESENTATION: Record<
  VerifyStatus,
  { type: "success" | "warning" | "danger"; label: string }
> = {
  valid: { type: "success", label: "Valid" },
  expired: { type: "warning", label: "Expired" },
  revoked: { type: "danger", label: "Revoked" },
  "not-found": { type: "warning", label: "Not found" },
  invalid: { type: "danger", label: "Invalid" },
};

export default function Verify() {
  const { content } = usePublicLanguage();
  const page = content.verify;

  const [documentNumber, setDocumentNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [errors, setErrors] = useState<VerifyFormErrors>({});
  const [result, setResult] = useState<MockVerificationResult | null>(null);

  const validate = (): boolean => {
    const nextErrors: VerifyFormErrors = {};
    if (!documentNumber.trim()) {
      nextErrors.documentNumber = "Enter the document number.";
    }
    if (!verificationCode.trim()) {
      nextErrors.verificationCode = "Enter the verification code.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) {
      setResult(null);
      return;
    }

    if (isDemoMode()) {
      const found = demoVerifyDocument(
        documentNumber.trim(),
        verificationCode.trim()
      );
      setResult(
        found
          ? {
              isValid: found.valid,
              issuingAuthority: found.issuingAuthority,
              documentType: found.documentType,
              documentStatus: found.status,
              holderMatch: `${found.maskedHolderName} (masked)`,
            }
          : {
              isValid: false,
              issuingAuthority: "Not applicable",
              documentType: "Not applicable",
              documentStatus: "Not found",
              holderMatch: "Not applicable",
            }
      );
      return;
    }

    setResult(buildMockResult(documentNumber.trim(), verificationCode.trim()));
  };

  return (
    <>
      <PageHeader
        title={page.heading}
        description={page.intro}
        eyebrow={content.common.nav.verify}
        breadcrumb={[
          { label: content.common.nav.home, href: "/" },
          { label: content.common.nav.verify },
        ]}
      />

      <Section>
        <Notice type="info" title="What this shows">
          {page.disclosureNote}
        </Notice>
        {isDemoMode() && (
          <p style={{ marginTop: "0.75rem" }}>
            <DemoBadge /> Try it: document{" "}
            <code>CERT-DEMO-2026-0001</code>, code <code>135790</code>
          </p>
        )}

        <div
          className="public-grid public-grid-2"
          style={{ marginTop: "1.5rem", alignItems: "start" }}
        >
          <div
            className="public-card"
            style={{ alignItems: "center", textAlign: "center" }}
          >
            <div
              aria-hidden="true"
              style={{
                width: 140,
                height: 140,
                border: "2px dashed var(--border-strong)",
                borderRadius: "var(--radius-md)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto",
              }}
            >
              <Icon name="qr_code_2" styles={{ fontSize: 64 }} />
            </div>
            <p>{page.qrHint}</p>
          </div>

          <form
            className="public-form"
            onSubmit={handleSubmit}
            data-testid="verify-form"
            noValidate
          >
            <div className="public-form-field">
              <label htmlFor="verify-document-number">
                {page.documentNumberLabel}
              </label>
              <input
                id="verify-document-number"
                type="text"
                value={documentNumber}
                onChange={(event) => setDocumentNumber(event.target.value)}
                aria-invalid={!!errors.documentNumber}
                aria-describedby={
                  errors.documentNumber ? "verify-document-number-error" : undefined
                }
                data-testid="verify-document-number-input"
              />
              {errors.documentNumber && (
                <p
                  id="verify-document-number-error"
                  className="public-form-error"
                  role="alert"
                >
                  {errors.documentNumber}
                </p>
              )}
            </div>

            <div className="public-form-field">
              <label htmlFor="verify-code">{page.verificationCodeLabel}</label>
              <input
                id="verify-code"
                type="text"
                value={verificationCode}
                onChange={(event) => setVerificationCode(event.target.value)}
                aria-invalid={!!errors.verificationCode}
                aria-describedby={
                  errors.verificationCode ? "verify-code-error" : undefined
                }
                data-testid="verify-code-input"
              />
              {errors.verificationCode && (
                <p id="verify-code-error" className="public-form-error" role="alert">
                  {errors.verificationCode}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="public-btn public-btn-primary"
              data-testid="verify-submit"
            >
              {page.submitLabel}
            </button>
          </form>
        </div>

        {result && (
          <div
            className="public-card"
            style={{ marginTop: "1.5rem", maxWidth: 480 }}
            role="status"
            aria-live="polite"
            data-testid="verify-result"
          >
            <Notice
              type={STATUS_PRESENTATION[resolveStatus(result)].type}
              title={page.resultLabels.status}
            >
              {STATUS_PRESENTATION[resolveStatus(result)].label}
            </Notice>
            <dl className="public-fact-list" style={{ marginTop: "1rem" }}>
              <div>
                <dt>{page.resultLabels.issuingAuthority}</dt>
                <dd>{result.issuingAuthority}</dd>
              </div>
              <div>
                <dt>{page.resultLabels.documentType}</dt>
                <dd>{result.documentType}</dd>
              </div>
              <div>
                <dt>{page.resultLabels.documentStatus}</dt>
                <dd>{result.documentStatus}</dd>
              </div>
              <div>
                <dt>{page.resultLabels.holderMatch}</dt>
                <dd>{result.holderMatch}</dd>
              </div>
            </dl>
          </div>
        )}
      </Section>
    </>
  );
}
