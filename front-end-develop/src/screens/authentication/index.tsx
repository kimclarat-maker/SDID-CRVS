import { Route, Routes, Outlet } from "react-router-dom";

import { NavigationType } from "@/types/Navigation";
import useCurrentPath from "@/hooks/useCurrentPath";
import AppLayout from "@/layout";
import Login from "./login";
import ForgotPassword from "./forgotPassword";
import ResetPassword from "./resetPassword";

export const routes: NavigationType[] = [
  {
    path: "/",
    element: <Login />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/offline",
    element: <Login isLocalServiceEnabled />,
  },
  {
    path: "/forgotPassword",
    element: <ForgotPassword />,
  },
  {
    path: "/forgotPassword/:email",
    element: <ForgotPassword />,
  },
  {
    path: "/resetPassword/:token",
    element: <ResetPassword />,
  },
];

export const Authentication = () => {
  const PATH = useCurrentPath();

  if (!PATH.exist) return <></>;

  return (
    <AppLayout navbarContainerType="container">
      <Routes>
        {routes.map((route, index) => (
          <Route key={index} path={route.path} element={route.element} />
        ))}
      </Routes>
      <Outlet />
    </AppLayout>
  );
};
