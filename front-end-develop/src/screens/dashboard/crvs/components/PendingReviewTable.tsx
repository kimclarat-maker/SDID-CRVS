import { useNavigate } from "react-router-dom";
import { Whisper, Tooltip } from "rsuite";
import Button from "@/components/button";
import StatusBadge from "./StatusBadge";
import { getDemoData } from "@/demo/storage/demoStore";
import { getCurrentAccountId } from "@/utils/workspace";
import { canApproveCase } from "@/utils/workspace/crvsRules";

/**
 * Shared by the Civil Registrar's home landing and, as a compact glance
 * card, the /dashboard/crvs/review queue. Approval itself only happens in
 * the full review workspace (spec §13/§14) — this surfaces which
 * under-review cases are actually approvable by the signed-in registrar
 * right now (creator/conflict-of-interest/jurisdiction checks all applied)
 * and links straight to the decision panel for the ones that are.
 */
export default function PendingReviewTable() {
  const navigate = useNavigate();
  const currentAccountId = getCurrentAccountId();
  const db = getDemoData();
  const pendingReview = db.crvsRegistrations.filter((c) => c.status === "UNDER_REVIEW");

  return (
    <table className="crvs-table">
      <thead>
        <tr>
          <th>Reference</th>
          <th>Child</th>
          <th>Status</th>
          <th>Jurisdiction</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {pendingReview.map((c) => {
          const { allowed, reasons } = canApproveCase(currentAccountId, c);
          const actionButton = (
            <Button
              text="Review"
              size="sm"
              appearance="ghost"
              disabled={!allowed}
              onClick={() => navigate(`/dashboard/crvs/review/${c.id}/decision`)}
              testId={`review-${c.id}`}
            />
          );

          return (
            <tr key={c.id}>
              <td>{c.reference}</td>
              <td>{c.child.firstName ? `${c.child.firstName} ${c.child.lastName}` : `Unnamed ${c.child.lastName}`}</td>
              <td>
                <StatusBadge kind="registration" status={c.status} />
              </td>
              <td>{c.jurisdiction}</td>
              <td>
                {!allowed ? (
                  <Whisper placement="top" trigger="hover" speaker={<Tooltip>{reasons[0]}</Tooltip>}>
                    <span>{actionButton}</span>
                  </Whisper>
                ) : (
                  actionButton
                )}
              </td>
            </tr>
          );
        })}
        {pendingReview.length === 0 && (
          <tr>
            <td className="crvs-empty-row" colSpan={5}>
              Nothing pending review.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
