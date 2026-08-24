import { useState } from "react";
import ConfirmActionModal from "@/components/crvs/modals/ConfirmActionModal";
import { DeathWitness } from "@/domain/crvs/types";
import { demoSearchSdidIdentity } from "@/demo/services/crvsIdentitySearch";
import { getCurrentActorName } from "@/utils/workspace";

/** Runs the same identity-search simulation against a witness's document
 * number and records the outcome as the witness's verification state
 * (spec §8 "Verify witness identity"). */
export default function VerifyWitnessModal({
  show,
  onClose,
  witness,
  onVerified,
}: {
  show: boolean;
  onClose: () => void;
  witness: DeathWitness | undefined;
  onVerified: (state: DeathWitness["verification"]) => void;
}) {
  const [result, setResult] = useState<string | undefined>();

  if (!witness) return null;

  return (
    <ConfirmActionModal
      show={show}
      onClose={onClose}
      title="Verify witness identity"
      description={`${witness.firstName} ${witness.lastName}`}
      confirmLabel="Run verification"
      testId="verify-witness-modal"
      onConfirm={async () => {
        const search = await demoSearchSdidIdentity(witness.documentType, witness.documentNumber || "", getCurrentActorName());
        const state = search.state === "MATCH_FOUND" ? "VERIFIED" : search.state === "SERVICE_UNAVAILABLE" ? "MANUAL_REVIEW_REQUIRED" : "UNVERIFIED_PROVIDED";
        setResult(state);
        onVerified(state);
      }}
    >
      <p style={{ margin: 0 }}>This checks the witness's document number against SDID records.</p>
      {result && <p className="crvs-form-hint" style={{ marginTop: 8 }}>Result: {result.replace(/_/g, " ").toLowerCase()}</p>}
    </ConfirmActionModal>
  );
}
