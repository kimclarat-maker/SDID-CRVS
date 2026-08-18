import { Route, Routes, Outlet } from "react-router-dom";

import { NavigationType } from "@/types/Navigation";
import Dashboard from "@/screens/dashboard";
import RequireAuth from "@/navigation/guards/RequireAuth";
// import { SessionProvider } from "@/context/SessionContext";

export const routes: NavigationType[] = [
  {
    path: "/dashboard/*",
    element: (
      <RequireAuth>
        <Dashboard />
      </RequireAuth>
    ),
  },
];

export default () => {
  return (
    <>
      {/* <SessionProvider> */}
      <Routes>
        {routes.map((route, index) => (
          <Route key={index} path={route.path} element={route.element} />
        ))}
      </Routes>
      <Outlet />
      {/* </SessionProvider> */}
    </>
  );
};
