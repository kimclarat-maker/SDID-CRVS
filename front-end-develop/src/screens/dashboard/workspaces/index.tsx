import { Navigate, useNavigate } from "react-router-dom";
import Icon from "@/components/icon";
import {
  formatRoleLabel,
  getAssignmentForWorkspace,
  getWorkspaces,
  setActiveWorkspace,
  workspaceHomePath,
} from "@/utils/workspace";
import { StaffWorkspace } from "@/types/Workspace";
import "./styles.css";

const WORKSPACE_META: Record<StaffWorkspace, { name: string; description: string; icon: string }> = {
  SDID: {
    name: "SDID Enrolment",
    description: "Digital identity pre-enrolment, review and administration.",
    icon: "fingerprint",
  },
  CRVS: {
    name: "Civil Registration (CRVS)",
    description: "Birth notifications, registrations, corrections and exceptions.",
    icon: "badge",
  },
};

/**
 * Only reached by staff with more than one workspace assignment — users
 * with a single workspace are never routed here (see
 * utils/workspace/resolvePostLoginRoute), and if they land here manually
 * they're bounced straight to their one workspace.
 */
export default function WorkspaceSelection() {
  const navigate = useNavigate();
  const workspaces = getWorkspaces();

  if (workspaces.length === 0) {
    return <Navigate to="/dashboard/access-denied" replace />;
  }

  if (workspaces.length === 1) {
    return <Navigate to={workspaceHomePath(workspaces[0])} replace />;
  }

  const chooseWorkspace = (workspace: StaffWorkspace) => {
    setActiveWorkspace(workspace);
    navigate(workspaceHomePath(workspace));
  };

  return (
    <div className="workspace-select-shell">
      <h1 className="workspace-select-heading">Choose a workspace</h1>
      <p className="workspace-select-subtitle">
        Your account is authorized for more than one workspace. Pick one to
        continue — you can switch again later from the header.
      </p>

      <div className="workspace-card-grid">
        {workspaces.map((workspace) => {
          const assignment = getAssignmentForWorkspace(workspace);
          const meta = WORKSPACE_META[workspace];
          return (
            <button
              type="button"
              key={workspace}
              className="workspace-card"
              onClick={() => chooseWorkspace(workspace)}
              data-testid={`workspace-card-${workspace}`}
            >
              <span className="workspace-card-icon">
                <Icon name={meta.icon} styles={{ fontSize: 26 }} />
              </span>
              <p className="workspace-card-name">{meta.name}</p>
              <p className="workspace-card-role">
                Your role: {formatRoleLabel(assignment?.role)}
              </p>
              <p className="workspace-card-role">{meta.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
