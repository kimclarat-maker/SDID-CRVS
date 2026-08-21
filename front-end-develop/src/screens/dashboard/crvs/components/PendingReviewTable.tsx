import { Whisper, Tooltip } from "rsuite";
import Button from "@/components/button";
import toastMessage from "@/utils/common/toastMessage";
import { crvsRegistrationCases } from "@/demo/seed/crvs";
import { getCurrentAccountId } from "@/utils/workspace";
import { canApproveRegistration } from "@/utils/workspace/crvsRules";

/**
 * Shared by the Civil Registrar's home landing and the dedicated
 * /dashboard/crvs/births/review queue page. The real approve/reject
 * mutation ships with the birth-registration workflow milestone — this
 * demonstrates the "can't approve your own case" guard against fixture
 * data in the meantime.
 */
export default function PendingReviewTable() {
  const currentAccountId = getCurrentAccountId();
  const pendingReview = crvsRegistrationCases.filter((c) => c.status === "submitted");

  const handleApproveClick = () => {
    toastMessage("success", "Approval workflow arrives in the next milestone.");
  };

  return (
    <table className="crvs-table">
      <thead>
        <tr>
          <th>Reference</th>
          <th>Child</th>
          <th>Submitted by</th>
          <th>Jurisdiction</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {pendingReview.map((c) => {
          const canApprove = canApproveRegistration(currentAccountId, c.submittedByOfficerId);
          const approveButton = (
            <Button
              text="Approve"
              size="sm"
              appearance="ghost"
              disabled={!canApprove}
              onClick={handleApproveClick}
              testId={`approve-${c.id}`}
            />
          );

          return (
            <tr key={c.id}>
              <td>{c.reference}</td>
              <td>{c.childName}</td>
              <td>{c.submittedByName}</td>
              <td>{c.jurisdiction}</td>
              <td>
                {!canApprove ? (
                  <Whisper
                    placement="top"
                    trigger="hover"
                    speaker={<Tooltip>You can't approve a case you created.</Tooltip>}
                  >
                    <span>{approveButton}</span>
                  </Whisper>
                ) : (
                  approveButton
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
