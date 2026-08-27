import { useState } from "react";
import StructuredReasonModal from "@/components/crvs/modals/StructuredReasonModal";
import { MarriageApplication } from "@/domain/crvs/types";
import { demoOpenMarriageObjection } from "@/demo/services/crvsMarriageObjections";
import { getCurrentActorName } from "@/utils/workspace";

const REASON_OPTIONS = [
  { value: "Existing marriage or relationship", label: "Existing marriage or relationship" },
  { value: "Identity or age dispute", label: "Identity or age dispute" },
  { value: "Lack of consent", label: "Lack of consent" },
  { value: "Prohibited relationship", label: "Prohibited relationship" },
  { value: "Other", label: "Other" },
];

/** Only ever reachable when marriagePolicyConfig.objection.enabled is true —
 * gate rendering of the button that opens this modal at the call site, not
 * here (defense in depth: demoOpenMarriageObjection also rejects when the
 * policy flag is off). */
export default function OpenMarriageObjectionModal({
  show,
  onClose,
  application,
  onOpened,
}: {
  show: boolean;
  onClose: () => void;
  application: MarriageApplication;
  onOpened: (updated: MarriageApplication) => void;
}) {
  const [raisedBy, setRaisedBy] = useState("");
  const [raisedByRelationship, setRaisedByRelationship] = useState("");

  return (
    <StructuredReasonModal
      show={show}
      onClose={onClose}
      title="Open objection"
      description={application.reference}
      reasonOptions={REASON_OPTIONS}
      noteLabel="Objection detail"
      noteRequired
      submitLabel="Open objection"
      testId="open-marriage-objection-modal"
      onSubmit={async ({ reason, note }) => {
        const updated = demoOpenMarriageObjection(
          application.id,
          { raisedBy: raisedBy || "Anonymous objector", raisedByRelationship: raisedByRelationship || undefined, reason: note || reason },
          getCurrentActorName()
        );
        onOpened(updated);
        setRaisedBy("");
        setRaisedByRelationship("");
      }}
    >
      <div className="crvs-form-grid">
        <div className="crvs-form-group">
          <label htmlFor="objection-raised-by">Raised by</label>
          <input id="objection-raised-by" value={raisedBy} onChange={(e) => setRaisedBy(e.target.value)} data-testid="objection-raised-by" />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="objection-relationship">Relationship to applicants</label>
          <input id="objection-relationship" value={raisedByRelationship} onChange={(e) => setRaisedByRelationship(e.target.value)} />
        </div>
      </div>
    </StructuredReasonModal>
  );
}
