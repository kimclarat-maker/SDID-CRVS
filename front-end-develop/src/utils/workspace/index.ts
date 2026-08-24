import { cfg } from "@/constants/cfg";
import { JurisdictionLevel, StaffAssignment, StaffWorkspace } from "@/types/Workspace";

// Same storage key + read pattern as utils/common/permissions/defineAccess —
// synchronous sessionStorage reads, no new async plumbing.
const STORAGE_NAME = cfg.VITE_APP_NAME || "SDID-ENROLLMENT";
const ACTIVE_WORKSPACE_KEY = "activeWorkspace";

function readSession(): any | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_NAME);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Compatibility adapter: an account without `assignments` is legacy SDID
 * staff — synthesize a single SDID assignment from its existing
 * accessRole/permissions/centerId so nothing about the current SDID
 * permission model has to change.
 *
 * Inactive assignments (status === "inactive") are filtered out here, at
 * the single read path every other helper in this module goes through, so
 * a staff member who has lost an assignment falls back to the selector or
 * access-denied page instead of any guard having to check status itself.
 */
export function getStaffAssignments(): StaffAssignment[] {
  const session = readSession();
  const account = session?.account;
  if (!account) return [];

  if (Array.isArray(account.assignments) && account.assignments.length > 0) {
    return account.assignments.filter((a: StaffAssignment) => a.status !== "inactive");
  }

  return [
    {
      workspace: "SDID",
      role: account.accessRole?.value || account.accessRole?.name || "unknown",
      permissions: Array.isArray(account.permissions) ? account.permissions : [],
      centerId: account.centerId || account.center?._id,
      status: "active",
    },
  ];
}

/** The signed-in staff member's account id/email — used to compare against
 * case ownership (e.g. "can't approve a case you created"). */
export function getCurrentAccountId(): string | undefined {
  const session = readSession();
  return session?.account?._id || session?.email;
}

/** Display name for audit entries/statusHistory "by" fields — every CRVS
 * mutation service call needs one alongside getCurrentAccountId(). */
export function getCurrentActorName(): string {
  const session = readSession();
  const first = session?.account?.firstName || session?.firstName;
  const last = session?.account?.lastName || session?.lastName;
  if (first || last) return [first, last].filter(Boolean).join(" ");
  return session?.email || "Unknown staff member";
}

export function getWorkspaces(): StaffWorkspace[] {
  return Array.from(new Set(getStaffAssignments().map((a) => a.workspace)));
}

export function hasWorkspace(workspace: StaffWorkspace): boolean {
  return getWorkspaces().includes(workspace);
}

export function getAssignmentForWorkspace(
  workspace: StaffWorkspace
): StaffAssignment | undefined {
  return getStaffAssignments().find((a) => a.workspace === workspace);
}

/**
 * Mirrors the existing SUPERADMIN bypass in defineAccess(), but scoped to
 * SDID only. A legacy SUPERADMIN account never has a CRVS assignment (the
 * adapter above only ever produces an SDID one), so that alone keeps
 * platform administration and Civil Registrar authority separate for any
 * normal SDID-vs-CRVS workspace check.
 *
 * The extra `!permission.startsWith("crvs.")` guard covers the one way
 * that separation could still be bypassed: a caller (e.g. hasPermission()
 * below, iterating every current assignment) asking this same function
 * "does the SDID assignment grant this CRVS permission?" A SUPERADMIN's
 * SDID assignment must never answer yes to a CRVS-namespaced permission,
 * regardless of which workspace argument was passed.
 */
export function hasWorkspacePermission(
  workspace: StaffWorkspace,
  permission: string
): boolean {
  const assignment = getAssignmentForWorkspace(workspace);
  if (!assignment) return false;
  if (
    workspace === "SDID" &&
    assignment.role?.toUpperCase() === "SUPERADMIN" &&
    !permission.startsWith("crvs.")
  ) {
    return true;
  }
  return assignment.permissions.includes(permission);
}

export function shouldShowWorkspaceSelector(): boolean {
  return getWorkspaces().length > 1;
}

export function getActiveWorkspace(): StaffWorkspace | null {
  const stored = sessionStorage.getItem(ACTIVE_WORKSPACE_KEY) as StaffWorkspace | null;
  if (stored && hasWorkspace(stored)) return stored;

  const workspaces = getWorkspaces();
  return workspaces.length === 1 ? workspaces[0] : null;
}

export function setActiveWorkspace(workspace: StaffWorkspace): void {
  sessionStorage.setItem(ACTIVE_WORKSPACE_KEY, workspace);
}

// No explicit clearActiveWorkspace() is needed: the existing clearStorage()
// helper (utils/storage) already calls sessionStorage.clear() on logout,
// which wipes this key along with everything else.

export function workspaceHomePath(workspace: StaffWorkspace): string {
  return workspace === "SDID" ? "/dashboard/sdid" : "/dashboard/crvs";
}

/**
 * Where "go to my dashboard" should point right now, based on the
 * currently active workspace (not post-login resolution). Falls back to
 * the existing SDID home screen for legacy/SDID sessions so the Navbar's
 * long-standing "go to dashboard" link keeps its current destination
 * unless the active workspace is actually CRVS.
 */
export function currentWorkspaceHomePath(
  sdidFallback = "/dashboard/admin/home"
): string {
  return getActiveWorkspace() === "CRVS" ? "/dashboard/crvs" : sdidFallback;
}

/**
 * Single source of truth for where a staff member lands after
 * authenticating, replacing the previously scattered
 * navigate("/dashboard/admin") call sites.
 */
export function resolvePostLoginRoute(): string {
  const workspaces = getWorkspaces();
  if (workspaces.length === 0) return "/dashboard/access-denied";
  if (workspaces.length > 1) return "/dashboard/workspaces";
  return workspaceHomePath(workspaces[0]);
}

/** The assignment backing the currently active workspace, if any. */
export function getActiveAssignment(): StaffAssignment | undefined {
  const workspace = getActiveWorkspace();
  return workspace ? getAssignmentForWorkspace(workspace) : undefined;
}

/**
 * Workspace-agnostic permission check across every active assignment, for
 * call sites that only know the permission name (e.g. a shared component
 * rendered from both workspaces). Delegates to hasWorkspacePermission()
 * per assignment so the SDID-only SUPERADMIN bypass stays exactly as
 * scoped there — this never widens it.
 */
export function hasPermission(permission: string): boolean {
  return getStaffAssignments().some((a) => hasWorkspacePermission(a.workspace, permission));
}

export function hasAnyPermission(permissions: string[]): boolean {
  return permissions.some((p) => hasPermission(p));
}

/**
 * Whether the given workspace's assignment covers a target jurisdiction.
 * A NATIONAL-level assignment covers everything; otherwise the assignment
 * must name the exact same jurisdiction node. Hierarchy-aware coverage
 * (e.g. a PROVINCE assignment covering its DISTRICTs) is left for when a
 * real jurisdiction tree exists to validate against — this milestone only
 * ships the CRVS foundation, not jurisdiction-scoped case data.
 */
export function canAccessJurisdiction(
  workspace: StaffWorkspace,
  target: { level: JurisdictionLevel; id: string }
): boolean {
  const assignment = getAssignmentForWorkspace(workspace);
  const jurisdiction = assignment?.jurisdiction;
  if (!jurisdiction) return false;
  if (jurisdiction.level === "NATIONAL") return true;
  return jurisdiction.level === target.level && jurisdiction.id === target.id;
}

/** "CRVS_REGISTRATION_OFFICER" -> "Crvs Registration Officer"; "superAdmin" -> "Super Admin" */
export function formatRoleLabel(role: string | undefined): string {
  if (!role) return "Unknown role";
  const spaced = role
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase();
  return spaced.replace(/\b\w/g, (c) => c.toUpperCase());
}
