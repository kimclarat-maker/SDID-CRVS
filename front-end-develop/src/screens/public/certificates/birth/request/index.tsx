import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/public/PageHeader";
import Section from "@/components/public/Section";
import CertificateRequestWizard from "@/screens/dashboard/crvs/certificates/components/CertificateRequestWizard";
import { demoCreateCertificateRequest } from "@/demo/services/crvsCertificates";
import { BirthCertificateRequest, IdentityDocumentType } from "@/domain/crvs/types";

const PUBLIC_ACTOR = { id: "public-requester", name: "Public requester" };

/**
 * Public request wizard entry (spec §14). The public site has its own,
 * modal-free design system (see /track, /verify) so a fully re-themed
 * public wizard would duplicate a large amount of step logic; instead this
 * hosts the same CertificateRequestWizard the staff-assisted flow uses
 * (spec's "one shared wizard component"), inside PublicLayout, at the cost
 * of the wizard chrome visually matching the staff dashboard rather than
 * the public design tokens. Noted as a scope trade-off, not an oversight.
 */
export default function PublicBirthCertificateRequest() {
  const navigate = useNavigate();
  const [requesterType, setRequesterType] = useState<"SELF" | "PARENT" | "GUARDIAN" | "AUTHORIZED_REPRESENTATIVE">("SELF");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [documentType, setDocumentType] = useState<IdentityDocumentType>("NATIONAL_ID");
  const [documentNumber, setDocumentNumber] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [request, setRequest] = useState<BirthCertificateRequest | undefined>();

  const handleStart = (event: React.FormEvent) => {
    event.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !documentNumber.trim() || !phoneNumber.trim()) {
      setError("Fill in your name, identification number, and phone number.");
      return;
    }
    if (!consent) {
      setError("Consent to identity verification is required to continue.");
      return;
    }
    setError(undefined);
    const draft = demoCreateCertificateRequest(
      { requesterType, firstName, lastName, documentType, documentNumber, phoneNumber },
      "PUBLIC_ONLINE",
      PUBLIC_ACTOR
    );
    setRequest(draft);
  };

  if (request) {
    return (
      <CertificateRequestWizard
        channel="PUBLIC_ONLINE"
        request={request}
        onRequestChange={setRequest}
        actorName={PUBLIC_ACTOR.name}
        onExit={() => navigate("/certificates/birth")}
        onSubmitted={(updated) => {
          if (updated.status === "PAYMENT_PENDING") {
            navigate(`/certificates/birth/request/${updated.id}/payment`);
          } else {
            navigate(`/certificates/birth/request/${updated.id}/success`);
          }
        }}
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Request a birth certificate"
        description="Step 1 of 6: tell us who is requesting this certificate."
        eyebrow="Certificates"
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "Birth certificate", href: "/certificates/birth" },
          { label: "Request" },
        ]}
      />
      <Section>
        <form className="public-form" onSubmit={handleStart} data-testid="public-cert-request-form" noValidate>
          <div className="public-form-field">
            <label htmlFor="pub-requester-type">Requester type</label>
            <select id="pub-requester-type" value={requesterType} onChange={(e) => setRequesterType(e.target.value as typeof requesterType)}>
              <option value="SELF">Myself (the person on the birth record)</option>
              <option value="PARENT">Parent</option>
              <option value="GUARDIAN">Legal guardian</option>
              <option value="AUTHORIZED_REPRESENTATIVE">Authorized representative</option>
            </select>
          </div>
          <div className="public-form-field">
            <label htmlFor="pub-first-name">First name</label>
            <input id="pub-first-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} data-testid="pub-first-name" />
          </div>
          <div className="public-form-field">
            <label htmlFor="pub-last-name">Last name</label>
            <input id="pub-last-name" value={lastName} onChange={(e) => setLastName(e.target.value)} data-testid="pub-last-name" />
          </div>
          <div className="public-form-field">
            <label htmlFor="pub-doc-type">Identification-document type</label>
            <select id="pub-doc-type" value={documentType} onChange={(e) => setDocumentType(e.target.value as IdentityDocumentType)}>
              <option value="NATIONAL_ID">National ID</option>
              <option value="PASSPORT">Passport</option>
              <option value="REFUGEE_ID">Refugee ID</option>
              <option value="DRIVER_LICENSE">Driver's license</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div className="public-form-field">
            <label htmlFor="pub-doc-number">Identification number</label>
            <input id="pub-doc-number" value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)} data-testid="pub-doc-number" />
          </div>
          <div className="public-form-field">
            <label htmlFor="pub-phone">Phone number</label>
            <input id="pub-phone" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} data-testid="pub-phone" />
            <p className="public-form-hint">Used only to send you a demo verification code and delivery updates.</p>
          </div>
          <label style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} data-testid="pub-consent" />
            <span>I consent to identity verification for this request.</span>
          </label>
          {error && (
            <p className="public-form-error" role="alert">
              {error}
            </p>
          )}
          <div style={{ display: "flex", gap: 12 }}>
            <button type="button" className="public-btn public-btn-outline" onClick={() => navigate("/certificates/birth")} data-testid="pub-cert-cancel">
              Cancel
            </button>
            <button type="submit" className="public-btn public-btn-primary" data-testid="pub-cert-continue">
              Continue
            </button>
          </div>
        </form>
      </Section>
    </>
  );
}
