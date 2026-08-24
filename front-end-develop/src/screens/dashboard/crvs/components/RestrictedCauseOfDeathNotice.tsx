import Icon from "@/components/icon";
import { hasWorkspacePermission } from "@/utils/workspace";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { CauseOfDeathClassification } from "@/domain/crvs/types";

/** Cause-of-death detail is restricted (spec §2/§9): a user without
 * DEATH_CAUSE_VIEW sees this notice instead of the medical detail — never a
 * masked/partial version of the same fields. Wrap this around wherever cause
 * fields would otherwise render, in every screen that shows them (wizard
 * review step, registration detail tabs, notification detail, registered
 * record). */
export default function RestrictedCauseOfDeathNotice({
  cause,
  children,
}: {
  cause: CauseOfDeathClassification | undefined;
  children: React.ReactNode;
}) {
  const canView = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DEATH_CAUSE_VIEW);

  if (!canView) {
    return (
      <div className="crvs-banner crvs-banner-warning" style={{ display: "flex", alignItems: "flex-start", gap: 8 }} data-testid="restricted-cause-notice">
        <Icon name="lock" />
        <span>
          Cause-of-death information is restricted. Your role does not include permission to view medical
          certification detail for this case.
        </span>
      </div>
    );
  }

  if (!cause) {
    return <p className="crvs-form-hint">No cause-of-death classification has been recorded yet.</p>;
  }

  return <>{children}</>;
}
