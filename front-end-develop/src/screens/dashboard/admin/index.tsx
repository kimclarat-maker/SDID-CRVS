import { Route, Routes, Outlet, useNavigate } from "react-router-dom";

import { NavigationType } from "@/types/Navigation";
import useCurrentPath from "@/hooks/useCurrentPath";
import Sidebar from "@/components/sidebar";
import Home from "./home";
import useScreenSize from "@/hooks/useScreenSize";
import { Suspense, useEffect } from "react";
import { clearStorage, getStorage } from "@/utils/storage";
import { Stack } from "rsuite";
import Analytics from "./analyticsV2";
import Reports from "./reports";
import Enrollments from "./enrollments";
import Prenrollment from "./prenrollement";
import Requests from "./requests";
import Schedules from "./schedules";
import Transfers from "./transfer";
import Notifications from "./notifications";
import Alerts from "./alerts";
import Centers from "./center";
import AppAccounts from "./accounts";
import Devices from "./devices";
import Logs from "./applogs";
import Settings from "./settings";
import Geography from "./geography";
import SupportingDocuments from "./suppportingDocument";
import RollBacks from "./requests/rollBacks";
import Loading from "@/components/loader";

const withSuspense = (Component: React.ComponentType) => (
  <Suspense fallback={<Loading isFullScreen />}>
    <Component />
  </Suspense>
);

export const routes: NavigationType[] = [
  {
    path: "/",
    element: withSuspense(Analytics)
  },
  {
    path: "/home",
    element: withSuspense(Analytics)
  },
  {
    path: "/dashboard",
    element: withSuspense(Analytics)
  },
  {
    path: "/home/:page",
    element: withSuspense(Analytics)
  },
  // {
  //   path: "/dashboard",
  //   element: withSuspense(Analytics),
  // },
  // {
  //   path: "/reports",
  //   element: <Reports />,
  // },
  {
    path: "/request/*",
    element: <Requests />
  },
  {
    path: "/enrollment/*",
    element: <Enrollments />
  },
  {
    path: "/prenrollment/*",
    element: <Prenrollment />
  },
  {
    path: "/schedules",
    element: <Schedules />
  },
  {
    path: "/schedules/transfer/list",
    element: <Schedules />
  },
  {
    path: "/schedules/transfer/:id",
    element: <Transfers />
  },
  {
    path: "/notifications",
    element: <Notifications />
  },
  {
    path: "/alerts",
    element: <Alerts />
  },
  {
    path: "/centers",
    element: <Centers />
  },
  {
    path: "/accounts",
    element: <AppAccounts />
  },
  {
    path: "/devices",
    element: <Devices />
  },
  {
    path: "/geography",
    element: <Geography />
  },
  {
    path: "/logs",
    element: <Logs />
  },
  {
    path: "/supporting-documents",
    element: <SupportingDocuments />
  },
  {
    path: "/settings",
    element: <Settings />
  },
  {
    path: "/rollback",
    element: <RollBacks />
  }
];

export default () => {
  const { isPhone, isTablet } = useScreenSize();
  const navigate = useNavigate();

  useEffect(() => {
    const getUserInfo = async () => {
      const user = await getStorage();

      // if (!user || !user.token) {
      //   clearStorage();
      //   navigate("/authentication/login");

      //   return;
      // }
    };

    getUserInfo();
  }, []);

  const PATH = useCurrentPath();

  if (!PATH.exist) return <></>;

  return (
    <Stack alignItems="flex-start">
      <Stack.Item>
        <Sidebar />
      </Stack.Item>
      <Stack.Item
        grow={1}
        style={{
          padding: isPhone || isTablet ? "1.2rem" : "16px 18px",
          overflowY: "auto",
          position: "relative",
          height: "100vh",
          paddingBottom: "5rem",
          overflowX: "hidden"
        }}
      >
        <Routes>
          {routes.map((route, index) => (
            <Route key={index} path={route.path} element={route.element} />
          ))}
        </Routes>
        <Outlet />
      </Stack.Item>
    </Stack>
  );
};
