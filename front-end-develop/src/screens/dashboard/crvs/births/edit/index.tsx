import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Empty from "@/components/empty";
import Button from "@/components/button";
import { demoGetRegistration } from "@/demo/services/crvsRegistrations";
import { demoGetNotification } from "@/demo/services/crvsNotifications";
import { BirthNotification, BirthRegistrationCase } from "@/domain/crvs/types";
import RegistrationWizard from "../components/RegistrationWizard";
import "../../shared.css";

/** Hosts the 8-step wizard in edit mode for an existing DRAFT case (spec:
 * /dashboard/crvs/births/:caseId/edit). Any other status is no longer
 * editable through the wizard — the officer is redirected to the read-only
 * case-details page instead. */
export default function EditBirthRegistration() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [registrationCase, setRegistrationCase] = useState<BirthRegistrationCase | undefined>();
  const [originalNotification, setOriginalNotification] = useState<BirthNotification | undefined>();

  useEffect(() => {
    if (!caseId) return;
    let cancelled = false;
    setLoading(true);
    demoGetRegistration(caseId)
      .then(async (c) => {
        if (cancelled) return;
        if (!c) {
          setError("This registration case could not be found.");
          return;
        }
        if (c.status !== "DRAFT") {
          setError("This case is no longer a draft and can't be edited here.");
          setRegistrationCase(c);
          return;
        }
        setRegistrationCase(c);
        if (c.notificationId) {
          const notification = await demoGetNotification(c.notificationId);
          if (!cancelled) setOriginalNotification(notification);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || "Couldn't load this case.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [caseId]);

  if (loading) {
    return (
      <div className="crvs-page">
        <p className="crvs-form-hint">Loading application…</p>
      </div>
    );
  }

  if (error || !registrationCase) {
    return (
      <div className="crvs-page">
        <Empty
          icon="error"
          title="Can't edit this application"
          description={error || "Something went wrong."}
          button={
            <Button
              type="button"
              text={registrationCase ? "View case details" : "Back to drafts"}
              appearance="ghost"
              onClick={() => navigate(registrationCase ? `/dashboard/crvs/births/${registrationCase.id}` : "/dashboard/crvs/births/drafts")}
              testId="edit-back"
            />
          }
        />
      </div>
    );
  }

  return (
    <div className="crvs-page">
      <RegistrationWizard
        registrationCase={registrationCase}
        onCaseChange={setRegistrationCase}
        onExit={() => navigate(`/dashboard/crvs/births/${registrationCase.id}`)}
        onSubmitted={(id) => navigate(`/dashboard/crvs/births/${id}/submission-success`)}
        originalNotification={originalNotification}
      />
    </div>
  );
}
