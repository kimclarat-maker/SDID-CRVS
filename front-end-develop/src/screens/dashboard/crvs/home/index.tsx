import Empty from "@/components/empty";
import { CRVS_ROLES } from "@/constants/crvsRoles";
import { getAssignmentForWorkspace } from "@/utils/workspace";
import BirthNotificationOfficerHome from "./BirthNotificationOfficerHome";
import RegistrationOfficerHome from "./RegistrationOfficerHome";
import CivilRegistrarHome from "./CivilRegistrarHome";
import SupervisorHome from "./SupervisorHome";
import "../shared.css";

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
