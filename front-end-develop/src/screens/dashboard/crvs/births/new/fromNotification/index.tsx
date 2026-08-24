import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Empty from "@/components/empty";
import Button from "@/components/button";
import { demoGetNotification, canConvertNotification } from "@/demo/services/crvsNotifications";
import { demoCreateRegistrationDraft } from "@/demo/services/crvsRegistrations";
import { BirthNotification, BirthRegistrationCase } from "@/domain/crvs/types";
import { getAssignmentForWorkspace } from "@/utils/workspace";
import {
  DEMO_JURISDICTION,
  DEMO_PROCESSING_OFFICE,
} from "@/demo/seed/crvsAccounts";
import RegistrationWizard from "../../components/RegistrationWizard";
import { getActorName, emptyDeclarant, todayIsoDate } from "../../shared";
import "../../../shared.css";

/** Entry point for converting an ACCEPTED birth notification into a
 * registration draft (spec §9): fetches the notification, re-verifies it's
 * still convertible (another officer could have converted it since the
 * queue was loaded), creates a prefilled+facility-locked draft, then hosts
 * the shared 8-step wizard against it. */
export default function RegisterFromNotification() {
  const { notificationId } = useParams<{ notificationId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [notification, setNotification] = useState<BirthNotification | undefined>();
  const [draft, setDraft] = useState<BirthRegistrationCase | undefined>();
  const createdRef = useRef(false);

  useEffect(() => {
    if (!notificationId || createdRef.current) return;
    let cancelled = false;
    setLoading(true);
    demoGetNotification(notificationId)
      .then((n) => {
        if (cancelled) return;
        if (!n) {
          setError("This birth notification could not be found.");
          return;
        }
        if (!canConvertNotification(n)) {
          setError("This notification is no longer available for conversion — it may already have been converted, or isn't accepted yet.");
          setNotification(n);
          return;
        }
        setNotification(n);
        createdRef.current = true;
        const assignment = getAssignmentForWorkspace("CRVS");
        const actorName = getActorName();
        const created = demoCreateRegistrationDraft(
          {
            sourceType: "FROM_NOTIFICATION",
            notificationId: n.id,
            notificationReference: n.reference,
            occurrenceType: n.occurrenceType,
            facilityId: n.facilityId,
            facilityName: n.facilityName,
            placeOfBirth: n.facilityName || "",
            processingOfficeId: assignment?.centerId || "OFFICE-DEMO-01",
            processingOfficeName: DEMO_PROCESSING_OFFICE,
            jurisdiction: assignment?.jurisdiction?.name || DEMO_JURISDICTION,
            dateOfBirth: n.child.dateOfBirth,
            dateReported: todayIsoDate(),
            registrationCategory: "Facility birth notification conversion",
            child: n.child,
            mother: n.mother,
            father: n.father,
            declarant: emptyDeclarant(),
          },
          actorName,
          actorName
        );
        setDraft(created);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || "Couldn't load this notification.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [notificationId]);

  if (loading) {
    return (
      <div className="crvs-page">
        <p className="crvs-form-hint">Preparing this registration…</p>
      </div>
    );
  }

  if (error || !draft) {
    return (
      <div className="crvs-page">
        <Empty
          icon="error"
          title="Can't start this registration"
          description={error || "Something went wrong."}
          button={<Button type="button" text="Back to birth registrations" appearance="ghost" onClick={() => navigate("/dashboard/crvs/births/new")} testId="from-notification-back" />}
        />
      </div>
    );
  }

  return (
    <div className="crvs-page">
      <RegistrationWizard
        registrationCase={draft}
        onCaseChange={setDraft}
        onExit={() => navigate("/dashboard/crvs/births/drafts")}
        onSubmitted={(id) => navigate(`/dashboard/crvs/births/${id}/submission-success`)}
        originalNotification={notification}
      />
    </div>
  );
}
