import { Route, Routes, Outlet } from "react-router-dom";
import useCurrentPath from "@/hooks/useCurrentPath";
import { NavigationType } from "@/types/Navigation";
import { BioCaptureProvider } from "@/context/BioCapture";
import SearchCitizen from "../search/citizen";

export const routes: NavigationType[] = [
  {
    path: "/search",
    element: <SearchCitizen showTitle type="entry" />,
  },
];

export default () => {
  const PATH = useCurrentPath();

  if (!PATH.exist) return <></>;

  return (
    <BioCaptureProvider>
      <Routes>
        {routes.map((route, index) => (
          <Route key={index} path={route.path} element={route.element} />
        ))}
      </Routes>
      <Outlet />
    </BioCaptureProvider>
  );
};
