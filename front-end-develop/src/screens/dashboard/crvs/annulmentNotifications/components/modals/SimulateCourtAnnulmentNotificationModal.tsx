import { useState } from "react";
import ConfirmActionModal from "@/components/crvs/modals/ConfirmActionModal";
import Icon from "@/components/icon";
import { AnnulmentNotification } from "@/domain/crvs/types";
import { demoSimulateCourtAnnulmentNotification } from "@/demo/services/crvsAnnulmentNotifications";
import toastMessage from "@/utils/common/toastMessage";
import { todayIsoDate } from "../../../annulmentShared";

const EMPTY = {
  courtName: "Demo District Intermediate Court",
  courtCaseNumber: "",
  decisionNumber: "",
  decisionDate: todayIsoDate(),
  finalityDate: "",
  effectiveDate: "",
  legalEffectWordingAsReported: "",
  applicantNamesAsReported: "",
  marriageReferenceAsReported: "",
};

/**
 * Stands in for the court integration (spec §5A/§6A: "Do not make a real
 * court API call. Use a typed mock integration."). There is no inbound API
 * in this demo, so a Court Notification Officer pushes one through this form
 * and demoSimulateCourtAnnulmentNotification writes the typed mock
 * notification. Mirrors SimulateCourtNotificationModal.tsx from the divorce
 * module, with decisionNumber/decisionDate replacing judgmentNumber/
 * judgmentDate and the two annulment-only reported fields (effective date,
 * legal-effect wording) added.
 */
export default function SimulateCourtAnnulmentNotificationModal({
  show,
  onClose,
  actorName,
  onSimulated,
}: {
  show: boolean;
  onClose: () => void;
  actorName: string;
  onSimulated: (created: AnnulmentNotification) => void;
}) {
  const [form, setForm] = useState({ ...EMPTY });
  const [validationError, setValidationError] = useState<string | null>(null);

  const set = (patch: Partial<typeof EMPTY>) => setForm((prev) => ({ ...prev, ...patch }));

  const handleClose = () => {
    setForm({ ...EMPTY });
    setValidationError(null);
    onClose();
  };

  const handleConfirm = async () => {
    if (!form.courtName.trim() || !form.courtCaseNumber.trim() || !form.decisionNumber.trim() || !form.decisionDate || !form.applicantNamesAsReported.trim()) {
      setValidationError("Court, court case number, decision number, decision date, and reported names are all required.");
      throw new Error("Court, court case number, decision number, decision date, and reported names are all required.");
    }
    if (form.finalityDate && form.finalityDate < form.decisionDate) {
      setValidationError("The finality date cannot precede the decision date.");
      throw new Error("The finality date cannot precede the decision date.");
    }
    if (form.effectiveDate && form.effectiveDate < form.decisionDate) {
      setValidationError("The effective date cannot precede the decision date.");
      throw new Error("The effective date cannot precede the decision date.");
    }
    setValidationError(null);
    const created = demoSimulateCourtAnnulmentNotification(
      {
        courtName: form.courtName.trim(),
        courtCaseNumber: form.courtCaseNumber.trim(),
        decisionNumber: form.decisionNumber.trim(),
        decisionDate: form.decisionDate,
        finalityDate: form.finalityDate || undefined,
        effectiveDate: form.effectiveDate || undefined,
        legalEffectWordingAsReported: form.legalEffectWordingAsReported.trim() || undefined,
        applicantNamesAsReported: form.applicantNamesAsReported.trim(),
        marriageReferenceAsReported: form.marriageReferenceAsReported.trim() || undefined,
      },
      actorName
    );
    toastMessage("success", `Simulated court notification ${created.reference} received.`);
    onSimulated(created);
    handleClose();
  };

  return (
    <ConfirmActionModal
      show={show}
      onClose={handleClose}
      onConfirm={handleConfirm}
      title="Simulate a court notification"
      description="Creates one typed mock notification — no real court system is contacted."
      confirmLabel="Receive notification"
      testId="simulate-court-annulment-notification-modal"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="crvs-banner crvs-banner-info" style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
          <Icon name="info" />
          <span>This demo has no court integration. Use this form to stand in for an inbound court notification so the validation and conversion steps can be exercised.</span>
        </div>

        <div className="crvs-form-grid">
          <div className="crvs-form-group">
            <label htmlFor="sim-an-court-name">Court or authority</label>
            <input id="sim-an-court-name" value={form.courtName} onChange={(e) => set({ courtName: e.target.value })} data-testid="sim-an-court-name" />
          </div>
          <div className="crvs-form-group">
            <label htmlFor="sim-an-court-case">Court case number</label>
            <input id="sim-an-court-case" value={form.courtCaseNumber} onChange={(e) => set({ courtCaseNumber: e.target.value })} data-testid="sim-an-court-case" />
          </div>
          <div className="crvs-form-group">
            <label htmlFor="sim-an-decision-number">Decision number</label>
            <input id="sim-an-decision-number" value={form.decisionNumber} onChange={(e) => set({ decisionNumber: e.target.value })} data-testid="sim-an-decision-number" />
          </div>
          <div className="crvs-form-group">
            <label htmlFor="sim-an-decision-date">Decision date</label>
            <input id="sim-an-decision-date" type="date" value={form.decisionDate} onChange={(e) => set({ decisionDate: e.target.value })} data-testid="sim-an-decision-date" />
          </div>
          <div className="crvs-form-group">
            <label htmlFor="sim-an-finality-date">Finality date (optional)</label>
            <input id="sim-an-finality-date" type="date" value={form.finalityDate} onChange={(e) => set({ finalityDate: e.target.value })} data-testid="sim-an-finality-date" />
          </div>
          <div className="crvs-form-group">
            <label htmlFor="sim-an-effective-date">Effective date (optional)</label>
            <input id="sim-an-effective-date" type="date" value={form.effectiveDate} onChange={(e) => set({ effectiveDate: e.target.value })} data-testid="sim-an-effective-date" />
          </div>
          <div className="crvs-form-group">
            <label htmlFor="sim-an-marriage-ref">Reported marriage reference (optional)</label>
            <input id="sim-an-marriage-ref" value={form.marriageReferenceAsReported} onChange={(e) => set({ marriageReferenceAsReported: e.target.value })} data-testid="sim-an-marriage-ref" />
          </div>
        </div>

        <div className="crvs-form-group">
          <label htmlFor="sim-an-names">Affected persons as reported by the court</label>
          <input id="sim-an-names" placeholder="Nadia Correia & Emeka Obi" value={form.applicantNamesAsReported} onChange={(e) => set({ applicantNamesAsReported: e.target.value })} data-testid="sim-an-names" />
          <p className="crvs-form-hint">Use “Name A &amp; Name B” — validation splits on the ampersand when it searches for the existing marriage.</p>
        </div>

        <div className="crvs-form-group">
          <label htmlFor="sim-an-wording">Legal-effect wording as reported (optional)</label>
          <textarea
            id="sim-an-wording"
            rows={2}
            value={form.legalEffectWordingAsReported}
            onChange={(e) => set({ legalEffectWordingAsReported: e.target.value })}
            data-testid="sim-an-wording"
          />
          <p className="crvs-form-hint">Verbatim or near-verbatim text from the decision, if reported. This is not a legal-effect classification.</p>
        </div>

        {validationError && (
          <p className="crvs-form-error" role="alert">
            {validationError}
          </p>
        )}
      </div>
    </ConfirmActionModal>
  );
}
