import { useState } from "react";
import ConfirmActionModal from "@/components/crvs/modals/ConfirmActionModal";
import Icon from "@/components/icon";
import { DivorceNotification } from "@/domain/crvs/types";
import { demoSimulateCourtDivorceNotification } from "@/demo/services/crvsDivorceNotifications";
import toastMessage from "@/utils/common/toastMessage";
import { todayIsoDate } from "../../../divorceShared";

const EMPTY = {
  courtName: "Demo District Intermediate Court",
  courtCaseNumber: "",
  judgmentNumber: "",
  judgmentDate: todayIsoDate(),
  finalityDate: "",
  applicantNamesAsReported: "",
  marriageReferenceAsReported: "",
};

/**
 * Stands in for the court integration (spec §5A: "Do not make a real court
 * API call. Use a typed mock integration."). There is no inbound API in this
 * demo, so a Court Notification Officer pushes one through this form and
 * demoSimulateCourtDivorceNotification writes the typed mock notification.
 */
export default function SimulateCourtNotificationModal({
  show,
  onClose,
  actorName,
  onSimulated,
}: {
  show: boolean;
  onClose: () => void;
  actorName: string;
  onSimulated: (created: DivorceNotification) => void;
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
    if (!form.courtName.trim() || !form.courtCaseNumber.trim() || !form.judgmentNumber.trim() || !form.judgmentDate || !form.applicantNamesAsReported.trim()) {
      setValidationError("Court, court case number, judgment number, judgment date, and reported names are all required.");
      throw new Error("Court, court case number, judgment number, judgment date, and reported names are all required.");
    }
    if (form.finalityDate && form.finalityDate < form.judgmentDate) {
      setValidationError("The finality date cannot precede the judgment date.");
      throw new Error("The finality date cannot precede the judgment date.");
    }
    setValidationError(null);
    const created = demoSimulateCourtDivorceNotification(
      {
        courtName: form.courtName.trim(),
        courtCaseNumber: form.courtCaseNumber.trim(),
        judgmentNumber: form.judgmentNumber.trim(),
        judgmentDate: form.judgmentDate,
        finalityDate: form.finalityDate || undefined,
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
      testId="simulate-court-divorce-notification-modal"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="crvs-banner crvs-banner-info" style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
          <Icon name="info" />
          <span>This demo has no court integration. Use this form to stand in for an inbound court notification so the validation and conversion steps can be exercised.</span>
        </div>

        <div className="crvs-form-grid">
          <div className="crvs-form-group">
            <label htmlFor="sim-court-name">Court or authority</label>
            <input id="sim-court-name" value={form.courtName} onChange={(e) => set({ courtName: e.target.value })} data-testid="sim-court-name" />
          </div>
          <div className="crvs-form-group">
            <label htmlFor="sim-court-case">Court case number</label>
            <input id="sim-court-case" value={form.courtCaseNumber} onChange={(e) => set({ courtCaseNumber: e.target.value })} data-testid="sim-court-case" />
          </div>
          <div className="crvs-form-group">
            <label htmlFor="sim-judgment-number">Judgment number</label>
            <input id="sim-judgment-number" value={form.judgmentNumber} onChange={(e) => set({ judgmentNumber: e.target.value })} data-testid="sim-judgment-number" />
          </div>
          <div className="crvs-form-group">
            <label htmlFor="sim-judgment-date">Judgment date</label>
            <input id="sim-judgment-date" type="date" value={form.judgmentDate} onChange={(e) => set({ judgmentDate: e.target.value })} data-testid="sim-judgment-date" />
          </div>
          <div className="crvs-form-group">
            <label htmlFor="sim-finality-date">Finality date (optional)</label>
            <input id="sim-finality-date" type="date" value={form.finalityDate} onChange={(e) => set({ finalityDate: e.target.value })} data-testid="sim-finality-date" />
          </div>
          <div className="crvs-form-group">
            <label htmlFor="sim-marriage-ref">Reported marriage reference (optional)</label>
            <input id="sim-marriage-ref" value={form.marriageReferenceAsReported} onChange={(e) => set({ marriageReferenceAsReported: e.target.value })} data-testid="sim-marriage-ref" />
          </div>
        </div>

        <div className="crvs-form-group">
          <label htmlFor="sim-names">Former spouses as reported by the court</label>
          <input id="sim-names" placeholder="Lena Farrow & Tariq Haile" value={form.applicantNamesAsReported} onChange={(e) => set({ applicantNamesAsReported: e.target.value })} data-testid="sim-names" />
          <p className="crvs-form-hint">Use “Name A &amp; Name B” — validation splits on the ampersand when it searches for the existing marriage.</p>
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
