import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Empty from "@/components/empty";
import Button from "@/components/button";
import { hasWorkspacePermission } from "@/utils/workspace";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { demoGetMarriageApplication } from "@/demo/services/crvsMarriageApplications";
import { MarriageApplication } from "@/domain/crvs/types";
import MarriageApplicationWizard from "../components/MarriageApplicationWizard";
import "../../shared.css";

export default function EditMarriageApplication() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const canEdit = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_APPLICATION_EDIT);

  const [application, setApplication] = useState<MarriageApplication | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !canEdit) {
      setLoading(false);
      return;
    }
    demoGetMarriageApplication(id).then(setApplication).finally(() => setLoading(false));
  }, [id, canEdit]);

  if (!canEdit) {
    return (
      <div className="crvs-page">
        <Empty icon="lock" title="You don't have access to this action" description="Editing marriage declarations requires marriage-application-edit access." />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="crvs-page">
        <p className="crvs-form-hint">Loading application…</p>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="crvs-page">
        <Empty
          icon="error"
          title="Application not found"
          button={<Button text="Back to marriage applications" appearance="ghost" onClick={() => navigate("/dashboard/crvs/marriage-applications")} testId="mr-edit-not-found-back" />}
        />
      </div>
    );
  }

  if (application.status !== "DRAFT" && application.status !== "CORRECTION_REQUIRED") {
    return (
      <div className="crvs-page">
        <Empty
          icon="lock"
          title="This application can no longer be edited from here"
          description={`Current status: ${application.status.replace(/_/g, " ")}.`}
          button={<Button text="View application" appearance="ghost" onClick={() => navigate(`/dashboard/crvs/marriage-applications/${application.id}`)} testId="mr-edit-view-instead" />}
        />
      </div>
    );
  }

  return (
    <div className="crvs-page">
      {application.status === "CORRECTION_REQUIRED" && (
        <div className="crvs-banner crvs-banner-warning" style={{ marginBottom: 16 }}>
          Correction requested — address the items below, then submit to resubmit for review.
          {application.correctionRequests
            .filter((c) => !c.resolvedAt)
            .map((c) => (
              <ul key={c.id} style={{ margin: "8px 0 0", paddingLeft: 20 }}>
                {c.items.map((item) => (
                  <li key={item.id}>
                    <strong>{item.section.replace(/_/g, " ")}:</strong> {item.reason} {item.note ? `— ${item.note}` : ""}
                  </li>
                ))}
              </ul>
            ))}
        </div>
      )}

      <MarriageApplicationWizard
        application={application}
        onCaseChange={setApplication}
        onExit={() => navigate(`/dashboard/crvs/marriage-applications/${application.id}`)}
        onSubmitted={(id) => navigate(`/dashboard/crvs/marriage-applications/${id}`)}
      />
    </div>
  );
}
