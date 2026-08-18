import { Route, Routes, Outlet } from "react-router-dom";
import Approved from "./../requests/approved";
import useCurrentPath from "@/hooks/useCurrentPath";
import { NavigationType } from "@/types/Navigation";
import CitizenProfile from "../citizenProfile";
import BioRefresh from "../bioRefresh";
import Biometrics from "../biometrics";
import Pending from "../requests/pending/pending";
import InProgress from "../requests/pending/inProgress";
import Rejected from "../requests/rejected";

export const routes: NavigationType[] = [
  {
    path: "/",
    element: <Approved />,
  },
  {
    path: "/pending",
    element: <Pending />,
  },
  {
    path: "/in_progress",
    element: <InProgress />,
  },
  {
    path: "/rejected",
    element: <Rejected />,
  },
  {
    path: "/:id",
    element: <CitizenProfile />,
  },
  {
    path: "/bio-refresh/:id/:token",
    element: <BioRefresh />,
  },
  {
    path: "/biometrics/*",
    element: <Biometrics />,
  },
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
