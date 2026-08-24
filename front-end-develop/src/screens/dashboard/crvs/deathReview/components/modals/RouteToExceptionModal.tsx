import StructuredReasonModal from "@/components/crvs/modals/StructuredReasonModal";
import { DeathRegistrationCase } from "@/domain/crvs/types";
import { demoRouteDeathCase, DeathExceptionRouteTarget } from "@/demo/services/crvsDeathRegistrations";
import { getCurrentActorName } from "@/utils/workspace";

const COPY: Record<DeathExceptionRouteTarget, { title: string; reasons: { value: string; label: string }[] }> = {
  LATE_REGISTRATION_REVIEW: {
    title: "Route to late-registration review",
    reasons: [
      { value: "Filed after deadline", label: "Filed after the standard filing deadline" },
      { value: "Requires supervisor sign-off", label: "Requires supervisor sign-off" },
      { value: "Other", label: "Other" },
    ],
  },
  MEDICO_LEGAL_REVIEW: {
    title: "Route to medico-legal review",
    reasons: [
      { value: "Suspected unnatural death", label: "Suspected unnatural death" },
      { value: "Pending investigation", label: "Pending police/forensic investigation" },
      { value: "Other", label: "Other" },
    ],
  },
  UNIDENTIFIED_PERSON_REVIEW: {
    title: "Route to unidentified-person review",
    reasons: [
      { value: "Identity not established", label: "Deceased identity not established" },
      { value: "Requires authority documentation", label: "Requires additional authority documentation" },
      { value: "Other", label: "Other" },
    ],
  },
};

/** Shared implementation behind "Route to late-registration review" /
 * "Route to medico-legal review" / "Route to unidentified-person review"
 * (spec §8) — one StructuredReasonModal instance parameterized per target. */
export default function RouteToExceptionModal({
  show,
  onClose,
  target,
  deathCase,
  onRouted,
}: {
  show: boolean;
  onClose: () => void;
  target: DeathExceptionRouteTarget;
  deathCase: DeathRegistrationCase;
  onRouted: (updated: DeathRegistrationCase) => void;
}) {
  const copy = COPY[target];
  return (
    <StructuredReasonModal
      show={show}
      onClose={onClose}
      title={copy.title}
      description={deathCase.reference}
      reasonOptions={copy.reasons}
      noteLabel="Additional detail"
      submitLabel="Route case"
      testId={`route-${target.toLowerCase()}-modal`}
      onSubmit={async ({ reason, note }) => {
        const updated = demoRouteDeathCase(deathCase.id, target, note ? `${reason} — ${note}` : reason, getCurrentActorName());
        onRouted(updated);
      }}
    />
  );
}
