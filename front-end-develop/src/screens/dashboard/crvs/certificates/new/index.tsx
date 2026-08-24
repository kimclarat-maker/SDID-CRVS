import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CertificateRequestWizard from "../components/CertificateRequestWizard";
import { demoCreateCertificateRequest } from "@/demo/services/crvsCertificates";
import { BirthCertificateRequest, IdentityDocumentType } from "@/domain/crvs/types";
import { getActorReference, getCurrentActorName } from "../utils";
import toastMessage from "@/utils/common/toastMessage";
import "../../shared.css";

/** Staff-assisted entry point (spec §16). Captures the requester present at
 * the service centre, then hands off to the same wizard the public site
 * uses, with the STAFF_ASSISTED channel so the requester is already marked
 * verified (they were verified in person). */
export default function NewAssistedCertificateRequest() {
  const navigate = useNavigate();
  const actor = getActorReference();
  const actorName = getCurrentActorName();

  const [requesterType, setRequesterType] = useState<"SELF" | "PARENT" | "GUARDIAN" | "AUTHORIZED_REPRESENTATIVE">("PARENT");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [documentType, setDocumentType] = useState<IdentityDocumentType>("NATIONAL_ID");
  const [documentNumber, setDocumentNumber] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [requesterPresent, setRequesterPresent] = useState(true);

  const [request, setRequest] = useState<BirthCertificateRequest | undefined>();

  const handleStart = () => {
    if (!firstName.trim() || !lastName.trim() || !documentNumber.trim()) {
      toastMessage("error", "Enter the requester's name and identification number.");
      return;
    }
    if (!requesterPresent) {
      toastMessage("error", "The requester must be present to start an assisted request.");
      return;
    }
    try {
      const draft = demoCreateCertificateRequest(
        { requesterType, firstName, lastName, documentType, documentNumber, phoneNumber },
        "STAFF_ASSISTED",
        actor
      );
      setRequest(draft);
    } catch (err) {
      toastMessage("error", err);
    }
  };

  if (request) {
    return (
      <CertificateRequestWizard
        channel="STAFF_ASSISTED"
        request={request}
        onRequestChange={setRequest}
        actorName={actorName}
        onExit={() => navigate("/dashboard/crvs/certificates/requests")}
        onSubmitted={(updated) => {
          if (updated.status === "PAYMENT_PENDING") {
            toastMessage("success", `${updated.applicationReference} submitted — record the payment or waive the fee to continue.`);
          } else if (updated.status === "MANUAL_REVIEW") {
            navigate(`/dashboard/crvs/certificates/review/${updated.id}`);
            return;
          }
          navigate(`/dashboard/crvs/certificates/requests/${updated.id}`);
        }}
      />
    );
  }

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">New assisted certificate request</h1>
        <p className="crvs-page-subtitle">Assist a citizen at a service centre with requesting a birth certificate.</p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <div className="crvs-section" style={{ maxWidth: 560, display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="crvs-form-group">
          <label htmlFor="assist-requester-type">Requester type</label>
          <select id="assist-requester-type" value={requesterType} onChange={(e) => setRequesterType(e.target.value as typeof requesterType)}>
            <option value="SELF">Self</option>
            <option value="PARENT">Parent</option>
            <option value="GUARDIAN">Guardian</option>
            <option value="AUTHORIZED_REPRESENTATIVE">Authorized representative</option>
          </select>
        </div>
        <div className="crvs-form-grid">
          <div className="crvs-form-group">
            <label htmlFor="assist-first-name">First name</label>
            <input id="assist-first-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div className="crvs-form-group">
            <label htmlFor="assist-last-name">Last name</label>
            <input id="assist-last-name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
        </div>
        <div className="crvs-form-grid">
          <div className="crvs-form-group">
            <label htmlFor="assist-doc-type">Identification type</label>
            <select id="assist-doc-type" value={documentType} onChange={(e) => setDocumentType(e.target.value as IdentityDocumentType)}>
              <option value="NATIONAL_ID">National ID</option>
              <option value="PASSPORT">Passport</option>
              <option value="REFUGEE_ID">Refugee ID</option>
              <option value="DRIVER_LICENSE">Driver's license</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div className="crvs-form-group">
            <label htmlFor="assist-doc-number">Identification number</label>
            <input id="assist-doc-number" value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)} />
          </div>
        </div>
        <div className="crvs-form-group">
          <label htmlFor="assist-phone">Phone number</label>
          <input id="assist-phone" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 400 }}>
          <input type="checkbox" checked={requesterPresent} onChange={(e) => setRequesterPresent(e.target.checked)} />
          The requester is present and I have verified their identification in person.
        </label>
        <p className="crvs-form-hint">Staff declaration: I am creating this request on behalf of the requester named above.</p>

        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" className="crvs-tab" onClick={() => navigate("/dashboard/crvs/certificates")} data-testid="assist-cancel">
            Cancel
          </button>
          <button type="button" className="crvs-tab is-active" onClick={handleStart} data-testid="assist-continue">
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
