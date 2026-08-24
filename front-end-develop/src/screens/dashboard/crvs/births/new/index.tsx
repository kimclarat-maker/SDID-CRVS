import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/icon";
import { hasWorkspacePermission } from "@/utils/workspace";
import { getAssignmentForWorkspace } from "@/utils/workspace";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { BirthNotification } from "@/domain/crvs/types";
import { demoCreateRegistrationDraft } from "@/demo/services/crvsRegistrations";
import toastMessage from "@/utils/common/toastMessage";
import {
  DEMO_FACILITY_ID,
  DEMO_FACILITY_NAME,
  DEMO_JURISDICTION,
  DEMO_PROCESSING_OFFICE,
} from "@/demo/seed/crvsAccounts";
import SelectNotificationModal from "../components/modals/SelectNotificationModal";
import RegistrationTypeModal, { DirectRegistrationTypeChoice } from "../components/modals/RegistrationTypeModal";
import RegistrationWizard from "../components/RegistrationWizard";
import { getActorName, emptyChild, emptyMother, emptyFather, emptyDeclarant, todayIsoDate } from "../shared";
import { BirthRegistrationCase } from "@/domain/crvs/types";
import "../../shared.css";

/** The birth-registration entry point (spec §8): two choice cards — convert
 * an accepted notification, or start a direct community/late/abroad/other
 * registration. The direct path is hosted right here once the officer picks
 * a category, per the milestone's allowance to keep it on this same route
 * rather than a second URL. */
export default function NewBirthRegistration() {
  const navigate = useNavigate();
  const [showSelectNotification, setShowSelectNotification] = useState(false);
  const [showRegistrationType, setShowRegistrationType] = useState(false);
  const [directDraft, setDirectDraft] = useState<BirthRegistrationCase | undefined>();

  const canCreateDraft = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.BIRTH_DRAFT_CREATE);
  const canConvert = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.REGISTRATION_CONVERT);

  const handleSelectNotification = (notification: BirthNotification) => {
    setShowSelectNotification(false);
    navigate(`/dashboard/crvs/births/new/from-notification/${notification.id}`);
  };

  const handleSelectType = (choice: DirectRegistrationTypeChoice) => {
    setShowRegistrationType(false);
    const assignment = getAssignmentForWorkspace("CRVS");
    try {
      const draft = demoCreateRegistrationDraft(
        {
          sourceType: choice.sourceType,
          occurrenceType: choice.occurrenceType,
          facilityId: choice.occurrenceType === "FACILITY" ? DEMO_FACILITY_ID : undefined,
          facilityName: choice.occurrenceType === "FACILITY" ? DEMO_FACILITY_NAME : undefined,
          placeOfBirth: "",
          processingOfficeId: assignment?.centerId || "OFFICE-DEMO-01",
          processingOfficeName: DEMO_PROCESSING_OFFICE,
          jurisdiction: assignment?.jurisdiction?.name || DEMO_JURISDICTION,
          dateOfBirth: "",
          dateReported: todayIsoDate(),
          directRegistrationReason: "",
          registrationCategory: choice.registrationCategory,
          child: emptyChild(),
          mother: emptyMother(),
          father: emptyFather(),
          declarant: emptyDeclarant(),
        },
        getActorName(),
        getActorName()
      );
      setDirectDraft(draft);
    } catch (err) {
      toastMessage("error", err);
    }
  };

  if (directDraft) {
    return (
      <div className="crvs-page">
        <RegistrationWizard
          registrationCase={directDraft}
          onCaseChange={setDirectDraft}
          onExit={() => navigate("/dashboard/crvs/births/drafts")}
          onSubmitted={(id) => navigate(`/dashboard/crvs/births/${id}/submission-success`)}
        />
      </div>
    );
  }

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">Register a birth</h1>
        <p className="crvs-page-subtitle">Convert an accepted notification, or start a direct registration.</p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <div className="crvs-card-grid">
        <button
          type="button"
          className="crvs-case-card"
          style={{ textAlign: "left", cursor: canConvert ? "pointer" : "not-allowed", opacity: canConvert ? 1 : 0.6 }}
          disabled={!canConvert}
          onClick={() => setShowSelectNotification(true)}
          data-testid="start-from-notification"
        >
          <div className="crvs-case-card-header">
            <Icon name="campaign" />
            <strong>Register from birth notification</strong>
          </div>
          <p className="crvs-form-hint" style={{ margin: 0 }}>
            Convert an accepted birth notification into a registration case, with child/mother/father details prefilled
            and the facility locked.
          </p>
        </button>

        <button
          type="button"
          className="crvs-case-card"
          style={{ textAlign: "left", cursor: canCreateDraft ? "pointer" : "not-allowed", opacity: canCreateDraft ? 1 : 0.6 }}
          disabled={!canCreateDraft}
          onClick={() => setShowRegistrationType(true)}
          data-testid="start-direct-registration"
        >
          <div className="crvs-case-card-header">
            <Icon name="edit_document" />
            <strong>Register community or late birth</strong>
          </div>
          <p className="crvs-form-hint" style={{ margin: 0 }}>
            Start a direct registration for a community birth, late registration, birth abroad, or other case with no
            prior notification.
          </p>
        </button>
      </div>

      <SelectNotificationModal show={showSelectNotification} onClose={() => setShowSelectNotification(false)} onSelect={handleSelectNotification} />
      <RegistrationTypeModal show={showRegistrationType} onClose={() => setShowRegistrationType(false)} onSelect={handleSelectType} />
    </div>
  );
}
