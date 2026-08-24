import { useNavigate } from "react-router-dom";
import Empty from "@/components/empty";
import Button from "@/components/button";
import { CRVS_ROLES } from "@/constants/crvsRoles";
import { getAssignmentForWorkspace } from "@/utils/workspace";
import BirthNotificationOfficerHome from "./BirthNotificationOfficerHome";
import RegistrationOfficerHome from "./RegistrationOfficerHome";
import CivilRegistrarHome from "./CivilRegistrarHome";
import SupervisorHome from "./SupervisorHome";
import DeathNotificationOfficerHome from "./DeathNotificationOfficerHome";
import MedicalCertifierHome from "./MedicalCertifierHome";
import CrvsAuditorHome from "./CrvsAuditorHome";
import "../shared.css";

function PlatformAdministratorHome() {
  const navigate = useNavigate();
  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">Platform administration</h1>
        <p className="crvs-page-subtitle">Configure certificate templates, fees, validity, and delivery settings.</p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>
      <Button
        text="Open certificate configuration"
        appearance="primary"
        onClick={() => navigate("/dashboard/crvs/certificates/configuration")}
        testId="admin-home-open-configuration"
      />
    </div>
  );
}

/** Role-aware CRVS landing — one shell, different content per assignment. */
export default function CrvsHome() {
  const assignment = getAssignmentForWorkspace("CRVS");

  switch (assignment?.role) {
    case CRVS_ROLES.BIRTH_NOTIFICATION_OFFICER:
      return <BirthNotificationOfficerHome />;
    case CRVS_ROLES.CRVS_REGISTRATION_OFFICER:
      return <RegistrationOfficerHome />;
    case CRVS_ROLES.CIVIL_REGISTRAR:
      return <CivilRegistrarHome />;
    case CRVS_ROLES.CRVS_SUPERVISOR:
      return <SupervisorHome />;
    case CRVS_ROLES.PLATFORM_ADMINISTRATOR:
      return <PlatformAdministratorHome />;
    case CRVS_ROLES.DEATH_NOTIFICATION_OFFICER:
      return <DeathNotificationOfficerHome />;
    case CRVS_ROLES.MEDICAL_CERTIFIER:
      return <MedicalCertifierHome />;
    case CRVS_ROLES.CRVS_AUDITOR:
      return <CrvsAuditorHome />;
    default:
      return (
        <div className="crvs-page">
          <Empty
            icon="badge"
            title="No CRVS role assigned"
            description="Your account doesn't have a recognized CRVS role yet. Contact your administrator."
          />
        </div>
      );
  }
}
