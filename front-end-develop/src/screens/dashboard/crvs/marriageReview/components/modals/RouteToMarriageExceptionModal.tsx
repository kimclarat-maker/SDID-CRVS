import StructuredReasonModal from "@/components/crvs/modals/StructuredReasonModal";
import { MarriageApplication, MarriageExceptionType } from "@/domain/crvs/types";
import { demoRouteMarriageToException } from "@/demo/services/crvsMarriageApplications";
import { getCurrentActorName } from "@/utils/workspace";

const REASON_OPTIONS: { value: MarriageExceptionType; label: string }[] = [
  { value: "UNDERAGE_WITHOUT_APPROVED_EXCEPTION", label: "Underage — requires an approved exception" },
  { value: "FOREIGN_DOCUMENT_REVIEW", label: "Foreign document requires authenticity review" },
  { value: "ADVANCE_NOTICE_WAIVED", label: "Advance-notice period waiver requested" },
  { value: "EXISTING_MARRIAGE_CONFLICT", label: "Existing-marriage conflict" },
  { value: "CIVIL_STATUS_MISMATCH", label: "Civil-status mismatch" },
  { value: "OTHER", label: "Other" },
];

/** Routes an ELIGIBILITY_REVIEW application to supervisor exception review —
 * attaches a side-record rather than changing the top-level status (spec
 * §5/§9: marriage has no dedicated exception-review application status,
 * unlike death's three branches — see statusMachines.ts's modeling notes). */
export default function RouteToMarriageExceptionModal({
  show,
  onClose,
  application,
  onRouted,
}: {
  show: boolean;
  onClose: () => void;
  application: MarriageApplication;
  onRouted: (updated: MarriageApplication) => void;
}) {
  return (
    <StructuredReasonModal
      show={show}
      onClose={onClose}
      title="Route to exception review"
      description={application.reference}
      reasonOptions={REASON_OPTIONS}
      noteLabel="Additional detail"
      submitLabel="Route to exception review"
      testId="route-marriage-exception-modal"
      onSubmit={async ({ reason, note }) => {
        const updated = demoRouteMarriageToException(
          application.id,
          { type: reason as MarriageExceptionType, reason: note || REASON_OPTIONS.find((o) => o.value === reason)?.label || reason },
          getCurrentActorName()
        );
        onRouted(updated);
      }}
    />
  );
}
