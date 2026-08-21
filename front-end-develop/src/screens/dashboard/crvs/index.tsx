import { Route, Routes, Outlet } from "react-router-dom";
import CrvsSidebar from "./components/CrvsSidebar";
import CrvsHome from "./home";
import Births from "./births";
import NewBirthNotification from "./births/new";
import ReviewQueue from "./births/review";
import Corrections from "./corrections";
import Exceptions from "./exceptions";
import Reports from "./reports";
import RequirePermission from "@/navigation/guards/RequirePermission";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";

/**
 * CRVS workspace shell — mirrors screens/dashboard/admin/index.tsx's own
 * pattern (own sidebar + nested Routes sharing the dashboard-shell/
 * dashboard-main CSS), rather than introducing a second shell paradigm.
 * Mounted at /dashboard/crvs/* and already wrapped in
 * RequireWorkspace(workspace="CRVS") by screens/dashboard/index.tsx — each
 * sub-route below adds its own finer-grained permission check so a hidden
 * sidebar entry is never the only thing protecting it.
 */
export default function Crvs() {
  return (
    <div className="dashboard-shell">
      <CrvsSidebar />
      <main className="dashboard-main">
        <Routes>
          <Route path="/" element={<CrvsHome />} />
          <Route
            path="/births"
            element={
              <RequirePermission
                workspace="CRVS"
                permission={[
                  CRVS_PERMISSIONS.BIRTH_NOTIFICATION_VIEW,
                  CRVS_PERMISSIONS.REGISTRATION_VIEW,
                ]}
              >
                <Births />
              </RequirePermission>
            }
          />
          <Route
            path="/births/new"
            element={
              <RequirePermission
                workspace="CRVS"
                permission={CRVS_PERMISSIONS.BIRTH_NOTIFICATION_CREATE}
              >
                <NewBirthNotification />
              </RequirePermission>
            }
          />
          <Route
            path="/births/review"
            element={
              <RequirePermission
                workspace="CRVS"
                permission={[
                  CRVS_PERMISSIONS.EVIDENCE_REVIEW,
                  CRVS_PERMISSIONS.REGISTRATION_APPROVE,
                ]}
              >
                <ReviewQueue />
              </RequirePermission>
            }
          />
          <Route
            path="/corrections"
            element={
              <RequirePermission
                workspace="CRVS"
                permission={[
                  CRVS_PERMISSIONS.CORRECTION_RESPOND,
                  CRVS_PERMISSIONS.CORRECTION_REQUEST,
                ]}
              >
                <Corrections />
              </RequirePermission>
            }
          />
          <Route
            path="/exceptions"
            element={
              <RequirePermission
                workspace="CRVS"
                permission={CRVS_PERMISSIONS.EXCEPTIONS_VIEW}
              >
                <Exceptions />
              </RequirePermission>
            }
          />
          <Route
            path="/reports"
            element={
              <RequirePermission
                workspace="CRVS"
                permission={CRVS_PERMISSIONS.ANALYTICS_VIEW}
              >
                <Reports />
              </RequirePermission>
            }
          />
        </Routes>
        <Outlet />
      </main>
    </div>
  );
}
