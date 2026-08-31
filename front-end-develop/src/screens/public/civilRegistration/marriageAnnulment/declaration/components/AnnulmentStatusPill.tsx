import Icon from "@/components/icon";
import { AnnulmentRegistrationStatus } from "@/domain/crvs/types";
import { ANNULMENT_REGISTRATION_STATUS_LABELS } from "@/domain/crvs/statusMachines";
import { ANNULMENT_STATUS_ICON, ANNULMENT_STATUS_TONE } from "../../marriageAnnulmentShared";

/** StatusBadge (src/screens/dashboard/crvs/components/StatusBadge.tsx) has no
 * "annulmentRegistration" kind — marriageAnnulmentShared.ts documents this as
 * a deliberate choice, since it is a finalized contract file this module
 * must not modify. Every public annulment screen that needs a status pill
 * renders it through this one small component instead of repeating the
 * markup inline, reusing the same crvs-status-pill classes StatusBadge
 * itself uses so the look is identical. */
export default function AnnulmentStatusPill({ status }: { status: AnnulmentRegistrationStatus }) {
  const tone = ANNULMENT_STATUS_TONE[status] || "neutral";
  const icon = ANNULMENT_STATUS_ICON[status] || "help";
  return (
    <span className={`crvs-status-pill crvs-status-${tone} crvs-status-icon-label`}>
      <Icon name={icon} />
      {ANNULMENT_REGISTRATION_STATUS_LABELS[status]}
    </span>
  );
}
