import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Empty from "@/components/empty";
import Button from "@/components/button";
import { DescriptionList, DescriptionItem } from "@/components/descriptionList";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { hasWorkspacePermission } from "@/utils/workspace";
import { demoGetMarriageApplication } from "@/demo/services/crvsMarriageApplications";
import { MarriageApplication } from "@/domain/crvs/types";
import { applicantDisplayName, formatDateTime } from "../../marriageShared";
import { MARRIAGE_EXCEPTION_TYPE_LABELS } from "../index";
import ResolveMarriageExceptionModal, { MarriageExceptionResolutionType } from "../components/modals/ResolveMarriageExceptionModal";
import "../../shared.css";

export default function MarriageExceptionDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const canView = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_EXCEPTIONS_VIEW);
  const canResolve = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_EXCEPTION_REVIEW);

  const [application, setApplication] = useState<MarriageApplication | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [resolutionType, setResolutionType] = useState<MarriageExceptionResolutionType | undefined>();

  const load = () => {
    if (!id || !canView) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(undefined);
    demoGetMarriageApplication(id)
      .then((found) => {
        if (!found || !found.exception) {
          setError("This exception was not found.");
          return;
        }
        setApplication(found);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Couldn't load this exception."))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id, canView]);

  if (!canView) {
    return (
      <div className="crvs-page">
        <Empty icon="lock" title="You don't have access to this exception" isFullScreen />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="crvs-page">
        <Empty icon="hourglass_empty" title="Loading exception…" isFullScreen />
      </div>
    );
  }

  if (error || !application || !application.exception) {
    return (
      <div className="crvs-page">
        <Empty
          icon="error"
          title="Couldn't open this exception"
          description={error || "This exception was not found."}
          isFullScreen
          button={<Button text="Back to marriage exceptions" appearance="ghost" onClick={() => navigate("/dashboard/crvs/marriage-exceptions")} testId="mr-exception-details-back" />}
        />
      </div>
    );
  }

  const a = application;
  // Non-null: the guard above already returned if application.exception was
  // undefined, but that narrowing doesn't carry over to the `a` alias.
  const exception = a.exception!;

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 className="crvs-page-title">{a.reference}</h1>
            <p className="crvs-page-subtitle">{applicantDisplayName(a.applicant1)} &amp; {applicantDisplayName(a.applicant2)}</p>
          </div>
          <span className="crvs-status-pill crvs-status-warning">{exception.status}</span>
        </div>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <div className="crvs-section">
        <h2 className="crvs-section-title">Exception detail</h2>
        <DescriptionList columns={3}>
          <DescriptionItem label="Exception type" value={MARRIAGE_EXCEPTION_TYPE_LABELS[exception.type]} />
          <DescriptionItem label="Reason" value={exception.reason} />
          <DescriptionItem label="Triggering rule" value={exception.triggeringRule} />
          <DescriptionItem label="Assigned to" value={exception.assignedTo || a.reviewerName || "Unassigned"} />
          <DescriptionItem label="Priority" value={exception.priority} />
          <DescriptionItem label="Exception status" value={exception.status} />
        </DescriptionList>
      </div>

      <div className="crvs-section">
        <h2 className="crvs-section-title">Previous decisions</h2>
        {a.reviewDecisions.length === 0 ? (
          <p className="crvs-form-hint">No prior decisions recorded.</p>
        ) : (
          a.reviewDecisions.map((d, i) => (
            <div key={i} className="crvs-banner crvs-banner-info" style={{ marginBottom: 8 }}>
              {d.type.replace(/_/g, " ")} by {d.decidedBy} — {formatDateTime(d.decidedAt)} {d.reason ? `— ${d.reason}` : ""}
            </div>
          ))
        )}
        {exception.resolution && (
          <div className="crvs-banner crvs-banner-success">
            Resolved as {exception.resolution.type} by {exception.resolution.resolvedBy} — {exception.resolution.reason}
          </div>
        )}
      </div>

      {canResolve && !exception.resolution && (
        <div className="crvs-section">
          <h2 className="crvs-section-title">Resolution options</h2>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Button text="Clear exception" appearance="primary" onClick={() => setResolutionType("CLEAR")} testId="mr-exception-clear" />
            <Button text="Approve exception" appearance="ghost" onClick={() => setResolutionType("APPROVE")} testId="mr-exception-approve" />
            <Button text="Escalate" appearance="ghost" onClick={() => setResolutionType("ESCALATE")} testId="mr-exception-escalate" />
          </div>
          <p className="crvs-form-hint" style={{ marginTop: 8 }}>
            Rejecting the application itself is handled from the eligibility-review workspace, not from here.
          </p>
        </div>
      )}

      {!canResolve && exception.status === "OPEN" && (
        <div className="crvs-section">
          <p className="crvs-form-hint" title="You don't have MARRIAGE_EXCEPTION_REVIEW permission">
            You have view-only access to this exception.
          </p>
        </div>
      )}

      {resolutionType && (
        <ResolveMarriageExceptionModal
          show={!!resolutionType}
          onClose={() => setResolutionType(undefined)}
          type={resolutionType}
          application={a}
          onResolved={(updated) => {
            setApplication(updated);
            setResolutionType(undefined);
          }}
        />
      )}

      <div className="crvs-wizard-actions">
        <Button text="Back to marriage exceptions" appearance="ghost" onClick={() => navigate("/dashboard/crvs/marriage-exceptions")} testId="mr-exception-details-back-bottom" />
        <Button text="View application" appearance="ghost" onClick={() => navigate(`/dashboard/crvs/marriage-applications/${a.id}`)} testId="mr-exception-details-view-application" />
      </div>
    </div>
  );
}
