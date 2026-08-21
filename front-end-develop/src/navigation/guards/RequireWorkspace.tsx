import { ReactNode, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { StaffWorkspace } from "@/types/Workspace";
import { hasWorkspace, setActiveWorkspace } from "@/utils/workspace";

/**
 * Protects a workspace's routes at the route level, not just its sidebar
 * entries — a CRVS-only user hitting /dashboard/admin/... (or an SDID-only
 * user hitting /dashboard/crvs/...) directly by URL lands here instead.
 * Sits inside /dashboard/*, which RequireAuth already wraps, so a valid
 * session is guaranteed before this ever runs.
 */
export default function RequireWorkspace({
  workspace,
  children,
}: {
  workspace: StaffWorkspace;
  children: ReactNode;
}) {
  const location = useLocation();
  const authorized = hasWorkspace(workspace);

  useEffect(() => {
    if (authorized) setActiveWorkspace(workspace);
  }, [authorized, workspace]);

  if (!authorized) {
    return (
      <Navigate
        to="/dashboard/access-denied"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  return <>{children}</>;
}
