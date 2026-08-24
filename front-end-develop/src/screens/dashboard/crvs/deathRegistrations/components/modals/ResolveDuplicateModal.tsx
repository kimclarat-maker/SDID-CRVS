import StructuredReasonModal from "@/components/crvs/modals/StructuredReasonModal";
import { DeathRegistrationCase, DuplicateResolutionType } from "@/domain/crvs/types";
import { demoResolveDeathDuplicate } from "@/demo/services/crvsDeathDuplicateCheck";
import { getCurrentActorName } from "@/utils/workspace";

const RESOLUTION_OPTIONS: { value: DuplicateResolutionType; label: string }[] = [
  { value: "NOT_DUPLICATE", label: "Not a duplicate — different person" },
  { value: "LINKED", label: "Linked to the existing case" },
  { value: "RETURNED_FOR_CORRECTION", label: "Return for correction" },
  { value: "ESCALATED", label: "Escalate to supervisor" },
];

export default function ResolveDuplicateModal({
  show,
  onClose,
  deathCase,
  onResolved,
}: {
  show: boolean;
  onClose: () => void;
  deathCase: DeathRegistrationCase;
  onResolved: (updated: DeathRegistrationCase) => void;
}) {
  return (
    <StructuredReasonModal
      show={show}
      onClose={onClose}
      title="Resolve duplicate"
      description={deathCase.reference}
      reasonOptions={RESOLUTION_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
      noteLabel="Notes"
      noteRequired
      submitLabel="Resolve duplicate"
      testId="resolve-duplicate-modal"
      onSubmit={async ({ reason, note }) => {
        const updated = demoResolveDeathDuplicate(deathCase.id, { type: reason as DuplicateResolutionType, reason: note }, getCurrentActorName());
        onResolved(updated);
      }}
    />
  );
}
