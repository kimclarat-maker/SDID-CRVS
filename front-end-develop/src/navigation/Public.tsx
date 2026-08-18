import { Route, Routes, Outlet } from "react-router-dom";

import { NavigationType } from "@/types/Navigation";
import useCurrentPath from "@/hooks/useCurrentPath";
import { Authentication } from "@/screens/authentication";
import NoInternet from "@/screens/noInternet";
import EnrollFromCamera from "@/screens/cameraTest";
import StaffSignIn from "@/screens/staffSignIn";

const isDevelopment = import.meta.env.DEV;

export const routes: NavigationType[] = [
  {
    path: "/no-internet",
    element: <NoInternet />,
  },
  {
    path: "/authentication/*",
    element: <Authentication />,
  },
  {
    path: "/staff/sign-in",
    element: <StaffSignIn />,
  },
  // Camera/biometric calibration tool: development use only, never
  // reachable in a production build.
  ...(isDevelopment
    ? [
        {
          path: "/camera/sample/*",
          element: <EnrollFromCamera />,
        },
      ]
    : []),
];

export default () => {
  const PATH = useCurrentPath();

  if (!PATH.exist) return <></>;

  return (
    <>
      <Routes>
        {routes.map((route, index) => (
          <Route key={index} path={route.path} element={route.element} />
        ))}
      </Routes>
      <Outlet />
    </>
  );
};
