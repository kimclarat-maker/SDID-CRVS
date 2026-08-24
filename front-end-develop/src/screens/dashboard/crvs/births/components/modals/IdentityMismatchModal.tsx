import Modal from "@/components/Modal";
import Button from "@/components/button";
import Icon from "@/components/icon";

export type IdentityMismatchModalProps = {
  show: boolean;
  fieldLabel: string;
  sdidValue: string;
  enteredValue: string;
  onCorrectEntry: () => void;
  onRequestManualReview: () => void;
  onClose: () => void;
};

/** Shown when a manually entered value conflicts with a fetched SDID
 * match. Never silently overwrites the entered value — the officer must
 * explicitly choose to accept the SDID value or flag the record for manual
 * review (spec §10). */
export default function IdentityMismatchModal({
  show,
  fieldLabel,
  sdidValue,
  enteredValue,
  onCorrectEntry,
  onRequestManualReview,
  onClose,
}: IdentityMismatchModalProps) {
  return (
    <Modal show={show} handleClose={onClose} title="Identity details don't match" size="sm" testId="identity-mismatch-modal">
      <div style={{ padding: "0 24px 24px" }}>
        <div className="crvs-banner crvs-banner-warning">
          <Icon name="report" />
          <span>The SDID record for this document doesn't match what was entered for {fieldLabel}.</span>
        </div>
        <div className="crvs-section" style={{ marginTop: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
            <span className="crvs-form-hint">SDID record</span>
            <strong>{sdidValue}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
            <span className="crvs-form-hint">Entered in this application</span>
            <strong>{enteredValue}</strong>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
          <Button type="button" text="Cancel" appearance="ghost" onClick={onClose} testId="identity-mismatch-cancel" />
          <Button type="button" text="Request manual review" appearance="ghost" onClick={onRequestManualReview} testId="identity-mismatch-manual" />
          <Button type="button" text="Correct CRVS entry" appearance="primary" onClick={onCorrectEntry} testId="identity-mismatch-correct" />
        </div>
      </div>
    </Modal>
  );
}
