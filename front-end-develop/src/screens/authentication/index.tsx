import { Route, Routes, Outlet, Navigate } from "react-router-dom";

import { NavigationType } from "@/types/Navigation";
import useCurrentPath from "@/hooks/useCurrentPath";
import AppLayout from "@/layout";
import Login from "./login";
import ForgotPassword from "./forgotPassword";
import ResetPassword from "./resetPassword";

// The old internal AppLayout/Navbar-branded login screen has been retired
// in favour of the public-site-styled /staff/sign-in page (StaffSignIn +
// StaffAuthLayout), which reuses this same Login component. These entry
// points now just forward there instead of rendering the old chrome.
export const routes: NavigationType[] = [
  {
    path: "/",
    element: <Navigate to="/staff/sign-in" replace />,
  },
  {
    path: "/login",
    element: <Navigate to="/staff/sign-in" replace />,
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
