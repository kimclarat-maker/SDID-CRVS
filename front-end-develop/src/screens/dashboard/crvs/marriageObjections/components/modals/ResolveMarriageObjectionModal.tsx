import StructuredReasonModal from "@/components/crvs/modals/StructuredReasonModal";
import { MarriageApplication } from "@/domain/crvs/types";
import { demoResolveMarriageObjection } from "@/demo/services/crvsMarriageObjections";
import { getCurrentActorName } from "@/utils/workspace";

export type ObjectionDecision = "UPHOLD" | "DISMISS";

const COPY: Record<ObjectionDecision, { title: string; submitLabel: string; description: string }> = {
  UPHOLD: {
    title: "Uphold objection",
    submitLabel: "Uphold objection",
    description: "Upholding this objection rejects the marriage application and notifies both applicants.",
  },
  DISMISS: {
    title: "Dismiss objection",
    submitLabel: "Dismiss objection",
    description: "Dismissing this objection clears it — the application continues through its normal workflow.",
  },
};

const REASON_OPTIONS = [
  { value: "Evidence supports the objection", label: "Evidence supports the objection" },
  { value: "Evidence does not support the objection", label: "Evidence does not support the objection" },
  { value: "Objector lacks standing", label: "Objector lacks standing" },
  { value: "Requires supervisor judgement", label: "Requires supervisor judgement" },
  { value: "Other", label: "Other" },
];

/** One parameterized modal behind Uphold / Dismiss (spec §5 objection
 * resolution) — composes StructuredReasonModal exactly like
 * deathExceptions' ResolveDeathExceptionModal does for its own resolution
 * options. */
export default function ResolveMarriageObjectionModal({
  show,
  onClose,
  decision,
  application,
  onResolved,
}: {
  show: boolean;
  onClose: () => void;
  decision: ObjectionDecision;
  application: MarriageApplication;
  onResolved: (updated: MarriageApplication) => void;
}) {
  const copy = COPY[decision];

  return (
    <StructuredReasonModal
      show={show}
      onClose={onClose}
      title={copy.title}
      description={`${application.reference} — ${copy.description}`}
      reasonOptions={REASON_OPTIONS}
      noteLabel="Notes"
      noteRequired={false}
      submitLabel={copy.submitLabel}
      destructive={decision === "UPHOLD"}
      testId={`resolve-marriage-objection-${decision.toLowerCase()}-modal`}
      onSubmit={async ({ reason, note }) => {
        const actorName = getCurrentActorName();
        const updated = demoResolveMarriageObjection(application.id, { decision, reason, note: note || undefined }, actorName);
        onResolved(updated);
      }}
    />
  );
}
