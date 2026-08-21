import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { StaffWorkspace } from "@/types/Workspace";
import { hasWorkspacePermission } from "@/utils/workspace";

/**
 * Finer-grained than RequireWorkspace: gates a specific action/route on a
 * named permission within a workspace. Two usage modes:
 *  - route guard (no `fallback`): redirects to /dashboard/access-denied
 *  - inline gate (`fallback` provided): renders the fallback instead, for
 *    hiding/disabling a single button/section without leaving the page
 *    (e.g. an Approve action a Registration Officer shouldn't see at all).
 */
export default function RequirePermission({
  workspace,
  permission,
  children,
  fallback,
}: {
  workspace: StaffWorkspace;
  /** A single permission, or a list — any one match grants access. */
  permission: string | string[];
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const permissions = Array.isArray(permission) ? permission : [permission];
  const allowed = permissions.some((p) => hasWorkspacePermission(workspace, p));

  if (!allowed) {
    if (fallback !== undefined) return <>{fallback}</>;
    return <Navigate to="/dashboard/access-denied" replace />;
  }

  return <>{children}</>;
}
