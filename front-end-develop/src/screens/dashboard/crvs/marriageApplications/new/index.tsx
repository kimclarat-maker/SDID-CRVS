import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Empty from "@/components/empty";
import Button from "@/components/button";
import { hasWorkspacePermission, getCurrentAccountId, getCurrentActorName } from "@/utils/workspace";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { MarriageApplication } from "@/domain/crvs/types";
import { demoCreateMarriageApplicationDraft } from "@/demo/services/crvsMarriageApplications";
import { emptyApplicant } from "../../marriageShared";
import MarriageApplicationWizard from "../components/MarriageApplicationWizard";
import toastMessage from "@/utils/common/toastMessage";
import "../../shared.css";

/** Marriage-declaration entry point (spec §9): creates an empty draft and
 * hands off directly to the wizard — unlike death, marriage has no pathway
 * to pick first. */
export default function NewMarriageApplication() {
  const navigate = useNavigate();
  const canCreate = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_APPLICATION_CREATE);
  const [draft, setDraft] = useState<MarriageApplication | undefined>();

  const actorId = getCurrentAccountId() || "unknown";
  const actorName = getCurrentActorName();

  const startDraft = () => {
    try {
      const created = demoCreateMarriageApplicationDraft(
        {
          officeId: "",
          officeName: "",
          officeType: "DISTRICT_SECTOR_OFFICE",
          jurisdiction: "",
          applicant1: emptyApplicant("APPLICANT1"),
          applicant2: emptyApplicant("APPLICANT2"),
          ceremonyType: "CIVIL",
          isSpecialDayRequest: false,
        },
        actorId,
        actorName
      );
      setDraft(created);
    } catch (err) {
      toastMessage("error", err);
    }
  };

  if (!canCreate) {
    return (
      <div className="crvs-page">
        <Empty
          icon="lock"
          title="You don't have access to this action"
          description="Creating marriage declarations requires marriage-application-create access."
          button={<Button text="Back to marriage applications" appearance="ghost" onClick={() => navigate("/dashboard/crvs/marriage-applications")} testId="new-marriage-application-back" />}
        />
      </div>
    );
  }

  if (draft) {
    return (
      <div className="crvs-page">
        <MarriageApplicationWizard
          application={draft}
          onCaseChange={setDraft}
          onExit={() => navigate("/dashboard/crvs/marriage-applications")}
          onSubmitted={(id) => navigate(`/dashboard/crvs/marriage-applications/${id}`)}
        />
      </div>
    );
  }

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">New marriage declaration</h1>
        <p className="crvs-page-subtitle">Start a new marriage declaration on behalf of both applicants.</p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <button type="button" className="crvs-case-card" style={{ textAlign: "left" }} onClick={startDraft} data-testid="start-marriage-declaration">
        <strong>Start a marriage declaration</strong>
        <p className="crvs-form-hint" style={{ margin: 0 }}>
          Opens the declaration wizard: service &amp; jurisdiction, both applicants, proposed marriage details, eligibility,
          evidence, witnesses, and review.
        </p>
      </button>
    </div>
  );
}
