import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Icon from "@/components/icon";
import Button from "@/components/button";
import Empty from "@/components/empty";
import StatusBadge from "../../components/StatusBadge";
import { demoGetRegistration } from "@/demo/services/crvsRegistrations";
import { BirthRegistrationCase } from "@/domain/crvs/types";
import { childDisplayName, formatDateTime } from "../shared";
import "../../shared.css";

const NEXT_STEP_LABEL: Record<string, string> = {
  UNDER_REVIEW: "A Civil Registrar will review this application next.",
  LATE_REGISTRATION_REVIEW: "This late registration is queued for supervisor and registrar review.",
  EXCEPTION_REVIEW: "This case has been routed to exception review for a supervisor to resolve.",
  RESUBMITTED: "Your corrected application has been returned to the review queue.",
};

/** Confirmation page shown right after demoSubmitRegistration succeeds
 * (spec §9 step 8): application reference, submitted date, status,
 * processing office, next step and a track-status hint. */
export default function BirthRegistrationSubmissionSuccess() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const [registrationCase, setRegistrationCase] = useState<BirthRegistrationCase | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!caseId) return;
    let cancelled = false;
    demoGetRegistration(caseId)
      .then((c) => {
        if (!cancelled) setRegistrationCase(c);
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
        <p className="crvs-form-hint">Loading…</p>
      </div>
    );
  }

  if (!registrationCase) {
    return (
      <div className="crvs-page">
        <Empty icon="error" title="Application not found" button={<Button type="button" text="Back to dashboard" appearance="ghost" onClick={() => navigate("/dashboard/crvs")} testId="submission-success-back" />} />
      </div>
    );
  }

  return (
    <div className="crvs-page">
      <div className="crvs-section" style={{ textAlign: "center", padding: 40 }}>
        <Icon name="check_circle" styles={{ fontSize: 48, color: "var(--status-success)" }} />
        <h1 className="crvs-page-title" style={{ marginTop: 12 }}>Application submitted</h1>
        <p className="crvs-page-subtitle">{childDisplayName(registrationCase.child)}'s registration has been submitted successfully.</p>

        <div className="crvs-form-grid" style={{ textAlign: "left", maxWidth: 480, margin: "24px auto 0" }}>
          <div className="crvs-form-group">
            <label>Application reference</label>
            <strong>{registrationCase.reference}</strong>
          </div>
          <div className="crvs-form-group">
            <label>Submitted</label>
            <span>{formatDateTime(registrationCase.submittedAt)}</span>
          </div>
          <div className="crvs-form-group">
            <label>Status</label>
            <StatusBadge kind="registration" status={registrationCase.status} />
          </div>
          <div className="crvs-form-group">
            <label>Processing office</label>
            <span>{registrationCase.processingOfficeName}</span>
          </div>
        </div>

        <div className="crvs-banner crvs-banner-info" style={{ textAlign: "left", marginTop: 24 }}>
          <Icon name="info" />
          <span>{NEXT_STEP_LABEL[registrationCase.status] || "This application is now in the registration queue."}</span>
        </div>

        <p className="crvs-form-hint" style={{ marginTop: 16 }}>
          You can track this application's status any time from "My submitted registrations" using reference {registrationCase.reference}.
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 24 }}>
          <Button type="button" text="Return to dashboard" appearance="ghost" onClick={() => navigate("/dashboard/crvs")} testId="submission-success-dashboard" />
          <Button type="button" text="View application" appearance="primary" onClick={() => navigate(`/dashboard/crvs/births/${registrationCase.id}`)} testId="submission-success-view" />
        </div>
      </div>
    </div>
  );
}
