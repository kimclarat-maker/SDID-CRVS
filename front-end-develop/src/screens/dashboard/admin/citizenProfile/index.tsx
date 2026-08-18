import { Route, Routes, Outlet } from "react-router-dom";
import useCurrentPath from "@/hooks/useCurrentPath";
import { NavigationType } from "@/types/Navigation";
import EnrollmentProfile from "./enrollment";
import CustomTabs from "@/components/tabs";
import { useContext } from "react";
import { LanguageContext } from "@/context/LanguageContext";
import { BioCaptureProvider } from "@/context/BioCapture";
import Historical from "./historical";

export default () => {
  const PATH = useCurrentPath();
  const { translation } = useContext(LanguageContext);

  const renderPage = () => {
    return (
      <CustomTabs
        options={[
          {
            title: translation.enrollment,
            data: <EnrollmentProfile type="normal" />,
          },
          {
            title: translation.historical,
            data: <Historical />,
          },
        ]}
      />
    );
  };

  const routes: NavigationType[] = [
    {
      path: "/",
      element: renderPage(),
    },
    {
      path: "/historical/:page",
      element: <EnrollmentProfile type="historical" />,
    },
  ];

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
