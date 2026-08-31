import StructuredReasonModal, { ReasonOption } from "@/components/crvs/modals/StructuredReasonModal";
import { AnnulmentRegistration } from "@/domain/crvs/types";
import { demoRouteAnnulmentLegalEffectManualReview } from "@/demo/services/crvsAnnulmentLegalEffect";
import toastMessage from "@/utils/common/toastMessage";

const REASON_OPTIONS: ReasonOption[] = [
  { value: "Decision does not clearly state void or voidable", label: "Decision does not clearly state void or voidable" },
  { value: "Legal-effect wording is ambiguous", label: "Legal-effect wording is ambiguous" },
  { value: "Conflicting information across documents", label: "Conflicting information across documents" },
  { value: "Requires supervisor legal opinion", label: "Requires supervisor legal opinion" },
  { value: "Other", label: "Other" },
];

/** Stamps a manual-review proposal without confirming a classification, and
 * routes the case into LEGAL_EFFECT_REVIEW if it isn't already there (spec
 * §17 "route unclear effects to manual review rather than guessing"). */
export default function LegalEffectManualReviewModal({
  show,
  onClose,
  registration,
  actorName,
  onRouted,
}: {
  show: boolean;
  onClose: () => void;
  registration: AnnulmentRegistration | undefined;
  actorName: string;
  onRouted: (updated: AnnulmentRegistration) => void;
}) {
  if (!registration) return null;

  const handleSubmit = async ({ reason, note }: { reason: string; fields: string[]; note: string }) => {
    const finalReason = note ? `${reason}: ${note}` : reason;
    const updated = await demoRouteAnnulmentLegalEffectManualReview(registration.id, finalReason, actorName);
    toastMessage("success", `${updated.reference} routed for manual legal-effect review.`);
    onRouted(updated);
    onClose();
  };

  return (
    <StructuredReasonModal
      show={show}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Route legal effect to manual review"
      description={`${registration.reference} — marks the proposed classification as requiring manual review without confirming any classification.`}
      reasonOptions={REASON_OPTIONS}
      noteLabel="Additional detail (optional)"
      submitLabel="Route to manual review"
      testId="legal-effect-manual-review-modal"
    />
  );
}
