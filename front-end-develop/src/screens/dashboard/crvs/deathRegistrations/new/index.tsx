import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Icon from "@/components/icon";
import Empty from "@/components/empty";
import Button from "@/components/button";
import { hasWorkspacePermission, getCurrentAccountId, getCurrentActorName } from "@/utils/workspace";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { DeathRegistrationCase, DeathReportingPathway } from "@/domain/crvs/types";
import { demoCreateDeathRegistrationDraft } from "@/demo/services/crvsDeathRegistrations";
import { demoGetDeathNotification } from "@/demo/services/crvsDeathNotifications";
import { DEMO_FACILITY_ID, DEMO_FACILITY_NAME, DEMO_JURISDICTION, DEMO_PROCESSING_OFFICE } from "@/demo/seed/crvsAccounts";
import { emptyDeceased, emptyOccurrence, emptyDeathDeclarant, todayIsoDate } from "../../deathShared";
import PathwaySelectorModal from "../components/modals/PathwaySelectorModal";
import DeathRegistrationWizard from "../components/DeathRegistrationWizard";
import toastMessage from "@/utils/common/toastMessage";
import "../../shared.css";

/** Death-registration entry point (spec §6/§4): pick a pathway directly, or
 * arrive pre-filled from an accepted death notification via
 * ?fromNotification=<id> (see ConvertToDeathRegistrationModal). */
export default function NewDeathRegistration() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromNotificationId = searchParams.get("fromNotification");

  const canCreate = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DEATH_DRAFT_CREATE);
  const [showPathway, setShowPathway] = useState(false);
  const [draft, setDraft] = useState<DeathRegistrationCase | undefined>();
  const [loadingNotification, setLoadingNotification] = useState(!!fromNotificationId);

  const actorId = getCurrentAccountId() || "unknown";
  const actorName = getCurrentActorName();

  const createDraft = (pathway: DeathReportingPathway, seed?: { notificationId?: string; notificationReference?: string; deceased?: DeathRegistrationCase["deceased"]; occurrence?: DeathRegistrationCase["occurrence"]; facilityId?: string; facilityName?: string; medicalCertification?: DeathRegistrationCase["medicalCertification"] }) => {
    try {
      const created = demoCreateDeathRegistrationDraft(
        {
          pathway,
          notificationId: seed?.notificationId,
          notificationReference: seed?.notificationReference,
          facilityId: seed?.facilityId,
          facilityName: seed?.facilityName,
          processingOfficeId: "OFFICE-DEMO-01",
          processingOfficeName: DEMO_PROCESSING_OFFICE,
          jurisdiction: DEMO_JURISDICTION,
          dateOfDeath: seed?.occurrence?.dateOfDeath || "",
          dateReported: todayIsoDate(),
          deceased: seed?.deceased || emptyDeceased(),
          occurrence: seed?.occurrence || emptyOccurrence(),
          medicalCertification: seed?.medicalCertification,
          declarant: emptyDeathDeclarant(),
        },
        actorId,
        actorName
      );
      setDraft(created);
    } catch (err) {
      toastMessage("error", err);
    }
  };

  useEffect(() => {
    if (!fromNotificationId) return;
    demoGetDeathNotification(fromNotificationId)
      .then((notification) => {
        if (!notification) {
          toastMessage("error", "That death notification could not be found.");
          return;
        }
        createDraft(notification.pathway, {
          notificationId: notification.id,
          notificationReference: notification.reference,
          deceased: notification.deceased,
          occurrence: notification.occurrence,
          facilityId: notification.facilityId,
          facilityName: notification.facilityName,
          medicalCertification: notification.medicalCertification,
        });
      })
      .finally(() => setLoadingNotification(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromNotificationId]);

  if (!canCreate) {
    return (
      <div className="crvs-page">
        <Empty
          icon="lock"
          title="You don't have access to this action"
          description="Creating death registrations requires death-draft-create access."
          button={<Button text="Back to death registrations" appearance="ghost" onClick={() => navigate("/dashboard/crvs/death-registrations")} testId="new-death-registration-back" />}
        />
      </div>
    );
  }

  if (loadingNotification) {
    return (
      <div className="crvs-page">
        <p className="crvs-form-hint">Loading notification details…</p>
      </div>
    );
  }

  if (draft) {
    return (
      <div className="crvs-page">
        <DeathRegistrationWizard
          registrationCase={draft}
          onCaseChange={setDraft}
          onExit={() => navigate("/dashboard/crvs/death-registrations")}
          onSubmitted={(id) => navigate(`/dashboard/crvs/death-registrations/${id}`)}
        />
      </div>
    );
  }

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">Register a death</h1>
        <p className="crvs-page-subtitle">Select the pathway that matches this case.</p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <button type="button" className="crvs-case-card" style={{ textAlign: "left" }} onClick={() => setShowPathway(true)} data-testid="start-death-registration">
        <div className="crvs-case-card-header">
          <Icon name="add_circle" />
          <strong>Start a death registration</strong>
        </div>
        <p className="crvs-form-hint" style={{ margin: 0 }}>
          Choose a pathway (health-facility, community, late, medico-legal, or unidentified person) and complete the
          registration wizard.
        </p>
      </button>

      <PathwaySelectorModal
        show={showPathway}
        onClose={() => setShowPathway(false)}
        onSelect={(pathway) => {
          setShowPathway(false);
          createDraft(pathway, { deceased: emptyDeceased(), occurrence: { ...emptyOccurrence(), placeCategory: pathway === "HEALTH_FACILITY" ? "HEALTH_FACILITY" : "HOME" }, facilityId: pathway === "HEALTH_FACILITY" ? DEMO_FACILITY_ID : undefined, facilityName: pathway === "HEALTH_FACILITY" ? DEMO_FACILITY_NAME : undefined });
        }}
      />
    </div>
  );
}
