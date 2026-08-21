import { Route, Routes, Outlet, useNavigate, Navigate } from "react-router-dom";

import { NavigationType } from "@/types/Navigation";
import useCurrentPath from "@/hooks/useCurrentPath";
import Admin from "./admin";
import Crvs from "./crvs";
import WorkspaceSelection from "./workspaces";
import AccessDenied from "./accessDenied";
import DashboardLayout from "@/layout/dashboard";
import { Suspense, useEffect } from "react";
import Loading from "@/components/loader";

import RevalidateAccount from "@/components/revalidateAccount";
import { useLocalService } from "@/context/LocalServiceContext";
import Health from "@/components/health";
import { clearStorage, getStorage } from "@/utils/storage";
import { POST_LOGIN_REDIRECT_KEY } from "@/navigation/guards/RequireAuth";
import RequireWorkspace from "@/navigation/guards/RequireWorkspace";
import WorkspaceHomeRedirect from "@/navigation/guards/WorkspaceHomeRedirect";

export const routes: NavigationType[] = [
  {
    path: "/",
    element: <WorkspaceHomeRedirect />,
  },
  {
    // Backwards-compatible: existing bookmarks/links into /dashboard/admin/*
    // keep working exactly as before, now gated by SDID workspace
    // membership instead of being reachable by any authenticated user.
    path: "/admin/*",
    element: (
      <RequireWorkspace workspace="SDID">
        <Admin />
      </RequireWorkspace>
    ),
  },
  {
    // Canonical SDID workspace entry point — forwards into the existing
    // SDID screens rather than duplicating them under a new namespace.
    path: "/sdid",
    element: (
      <RequireWorkspace workspace="SDID">
        <Navigate to="/dashboard/admin/prenrollment/search" replace />
      </RequireWorkspace>
    ),
  },
  {
    path: "/sdid/*",
    element: (
      <RequireWorkspace workspace="SDID">
        <Navigate to="/dashboard/admin/prenrollment/search" replace />
      </RequireWorkspace>
    ),
  },
  {
    path: "/crvs/*",
    element: (
      <RequireWorkspace workspace="CRVS">
        <Crvs />
      </RequireWorkspace>
    ),
  },
  {
    path: "/workspaces",
    element: <WorkspaceSelection />,
  },
  {
    path: "/access-denied",
    element: <AccessDenied />,
  },
];

export default () => {
  const PATH = useCurrentPath();
  const navigate = useNavigate();

  const {
    isOnline,
    isLocalServiceActive,
    isModalOpen,
    closeModal,
    retryLocalService,
    localServiceHealthData,
    networkHealthData,
  } = useLocalService();

  useEffect(() => {
    const getUser = async () => {
      const userLoggedIn = await getStorage();
      if (!userLoggedIn?.token) {
        clearStorage();
        navigate(`/staff/sign-in`);
        return;
      }

      // If the guard redirected here from a protected deep link, honour it
      // once and clear it so refreshing this page doesn't loop.
      const savedDestination = sessionStorage.getItem(POST_LOGIN_REDIRECT_KEY);
      if (savedDestination && savedDestination !== window.location.pathname) {
        sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY);
        navigate(savedDestination, { replace: true });
      } else if (savedDestination) {
        sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY);
      }
    };

    getUser();
  }, []);

  if (!PATH.exist) return <></>;

  return (
    <>
      <Suspense fallback={<Loading isFullScreen />}>
        <Health isOnline={isOnline} />
        <DashboardLayout
          isLocalServiceActive={isLocalServiceActive}
          retryLocalService={retryLocalService}
          localServiceHealthData={localServiceHealthData}
          networkHealthData={networkHealthData}
        >
          <Routes>
            {routes.map((route, index) => (
              <Route key={index} path={route.path} element={route.element} />
            ))}
          </Routes>
          <Outlet />
        </DashboardLayout>
      </Suspense>
      {/* {isModalOpen && (
        <RevalidateAccount
          open={isModalOpen}
          setOpen={closeModal}
          isOnline={isOnline}
        />
      )} */}
    </>
  );
};
