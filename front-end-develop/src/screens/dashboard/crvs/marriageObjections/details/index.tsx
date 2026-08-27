import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Empty from "@/components/empty";
import Button from "@/components/button";
import StatusBadge from "../../components/StatusBadge";
import ConfirmActionModal from "@/components/crvs/modals/ConfirmActionModal";
import { DescriptionList, DescriptionItem } from "@/components/descriptionList";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { hasWorkspacePermission, getCurrentActorName } from "@/utils/workspace";
import { demoGetMarriageApplication } from "@/demo/services/crvsMarriageApplications";
import { demoWithdrawMarriageObjection } from "@/demo/services/crvsMarriageObjections";
import { marriagePolicyConfig } from "@/domain/crvs/marriagePolicyConfig";
import { MarriageApplication } from "@/domain/crvs/types";
import { applicantDisplayName, formatDateTime } from "../../marriageShared";
import ResolveMarriageObjectionModal, { ObjectionDecision } from "../components/modals/ResolveMarriageObjectionModal";
import toastMessage from "@/utils/common/toastMessage";
import "../../shared.css";

export default function MarriageObjectionDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const actorName = getCurrentActorName();

  const canView = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_OBJECTIONS_VIEW);
  const canResolve = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_OBJECTION_REVIEW);

  const [application, setApplication] = useState<MarriageApplication | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [decision, setDecision] = useState<ObjectionDecision | undefined>();
  const [showWithdraw, setShowWithdraw] = useState(false);

  const load = () => {
    if (!id || !canView || !marriagePolicyConfig.objection.enabled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(undefined);
    demoGetMarriageApplication(id)
      .then((found) => {
        if (!found || !found.objection) {
          setError("This objection was not found.");
          return;
        }
        setApplication(found);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Couldn't load this objection."))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id, canView]);

  if (!canView) {
    return (
      <div className="crvs-page">
        <Empty icon="lock" title="You don't have access to this objection" isFullScreen />
      </div>
    );
  }

  if (!marriagePolicyConfig.objection.enabled) {
    return (
      <div className="crvs-page">
        <Empty
          icon="block"
          title="Objections are not enabled by current policy"
          description="marriagePolicyConfig.objection.enabled is set to false, so objection detail pages are unavailable."
          isFullScreen
          button={<Button text="Back to marriage objections" appearance="ghost" onClick={() => navigate("/dashboard/crvs/marriage-objections")} testId="mr-objection-details-back" />}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="crvs-page">
        <Empty icon="hourglass_empty" title="Loading objection…" isFullScreen />
      </div>
    );
  }

  if (error || !application || !application.objection) {
    return (
      <div className="crvs-page">
        <Empty
          icon="error"
          title="Couldn't open this objection"
          description={error || "This objection was not found."}
          isFullScreen
          button={<Button text="Back to marriage objections" appearance="ghost" onClick={() => navigate("/dashboard/crvs/marriage-objections")} testId="mr-objection-details-back" />}
        />
      </div>
    );
  }

  const a = application;
  // Non-null: the guard above already returned if application.objection was
  // undefined, but that narrowing doesn't carry over to the `a` alias.
  const obj = a.objection!;
  const canAct = canResolve && obj.status === "PENDING";

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 className="crvs-page-title">{a.reference}</h1>
            <p className="crvs-page-subtitle">{applicantDisplayName(a.applicant1)} &amp; {applicantDisplayName(a.applicant2)}</p>
          </div>
          <StatusBadge kind="marriageObjection" status={obj.status} />
        </div>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <div className="crvs-section">
        <h2 className="crvs-section-title">Objection detail</h2>
        <DescriptionList columns={3}>
          <DescriptionItem label="Raised by" value={obj.raisedBy} />
          <DescriptionItem label="Relationship to applicants" value={obj.raisedByRelationship} />
          <DescriptionItem label="Raised at" value={formatDateTime(obj.raisedAt)} />
          <DescriptionItem label="Reason" value={obj.reason} />
          <DescriptionItem label="Status" value={obj.status} />
        </DescriptionList>
        {obj.evidenceRefs && obj.evidenceRefs.length > 0 && (
          <>
            <h3 className="crvs-section-title" style={{ marginTop: 16 }}>Evidence references</h3>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {obj.evidenceRefs.map((ref) => (
                <li key={ref}>{ref}</li>
              ))}
            </ul>
          </>
        )}
      </div>

      {obj.resolution && (
        <div className="crvs-section">
          <h2 className="crvs-section-title">Resolution</h2>
          <div className={`crvs-banner ${obj.resolution.type === "UPHOLD" ? "crvs-banner-danger" : "crvs-banner-success"}`}>
            {obj.resolution.type === "UPHOLD" ? "Upheld" : "Dismissed"} by {obj.resolution.resolvedBy} — {formatDateTime(obj.resolution.resolvedAt)}
            <div className="crvs-form-hint">{obj.resolution.reason}{obj.resolution.note ? ` — ${obj.resolution.note}` : ""}</div>
          </div>
        </div>
      )}

      {obj.withdrawnAt && (
        <div className="crvs-section">
          <div className="crvs-banner crvs-banner-info">Withdrawn at {formatDateTime(obj.withdrawnAt)}.</div>
        </div>
      )}

      {canAct ? (
        <div className="crvs-section">
          <h2 className="crvs-section-title">Resolution options</h2>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Button text="Uphold objection" appearance="primary" color="red" onClick={() => setDecision("UPHOLD")} testId="mr-objection-uphold" />
            <Button text="Dismiss objection" appearance="ghost" onClick={() => setDecision("DISMISS")} testId="mr-objection-dismiss" />
            <Button text="Withdraw objection" appearance="ghost" onClick={() => setShowWithdraw(true)} testId="mr-objection-withdraw" />
          </div>
        </div>
      ) : (
        obj.status === "PENDING" && (
          <div className="crvs-section">
            <p className="crvs-form-hint" title="You don't have MARRIAGE_OBJECTION_REVIEW permission">
              You have view-only access to this objection.
            </p>
          </div>
        )
      )}

      {decision && (
        <ResolveMarriageObjectionModal
          show={!!decision}
          onClose={() => setDecision(undefined)}
          decision={decision}
          application={a}
          onResolved={(updated) => {
            setApplication(updated);
            setDecision(undefined);
            toastMessage("success", `Objection ${decision === "UPHOLD" ? "upheld" : "dismissed"}.`);
          }}
        />
      )}

      <ConfirmActionModal
        show={showWithdraw}
        onClose={() => setShowWithdraw(false)}
        title="Withdraw objection"
        description={`${a.reference} — the objector no longer wishes to pursue this objection.`}
        confirmLabel="Withdraw"
        testId="mr-objection-withdraw-modal"
        onConfirm={async () => {
          const updated = demoWithdrawMarriageObjection(a.id, actorName);
          setApplication(updated);
          setShowWithdraw(false);
          toastMessage("success", "Objection withdrawn.");
        }}
      />

      <div className="crvs-wizard-actions">
        <Button text="Back to marriage objections" appearance="ghost" onClick={() => navigate("/dashboard/crvs/marriage-objections")} testId="mr-objection-details-back-bottom" />
        <Button text="View application" appearance="ghost" onClick={() => navigate(`/dashboard/crvs/marriage-applications/${a.id}`)} testId="mr-objection-details-view-application" />
      </div>
    </div>
  );
}
