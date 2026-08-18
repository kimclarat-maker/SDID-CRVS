import { Route, Routes, Outlet } from "react-router-dom";

import { NavigationType } from "@/types/Navigation";
import DashboardLayout from "@/layout/dashboard";
import useCurrentPath from "@/hooks/useCurrentPath";
import Documentation from "./page/content";

export const routes: NavigationType[] = [
  {
    path: "/admin/*",
    element: <Documentation />,
  },
  {
    path: "/admin/content/:q",
    element: <Documentation />,
  },
];

export default () => {
  const PATH = useCurrentPath();

  if (!PATH.exist) return <></>;
  return (
    <DashboardLayout>
      <Routes>
        {routes.map((route, index) => (
          <Route key={index} path={route.path} element={route.element} />
        ))}
      </Routes>
      <Outlet />
    </DashboardLayout>
  );
};
