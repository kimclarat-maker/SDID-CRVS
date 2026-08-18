import { Route, Routes, Outlet } from "react-router-dom";

import { NavigationType } from "@/types/Navigation";
import { getStorage } from "@/utils/storage";
import { useEffect, useState } from "react";
import Doc from "@/screens/doc";

export const routes: NavigationType[] = [
  {
    path: "/doc/*",
    element: <Doc />,
  },
];

export default () => {
  const [token, setToken] = useState<string | null>(null);

  const fetchUserToken = async () => {
    try {
      const userLoggedIn = await getStorage();
      return userLoggedIn?.token;
    } catch (error) {
      console.error("Error fetching user token:", error);
      return null;
    }
  };

  useEffect(() => {
    fetchUserToken().then(setToken);
  }, [token]);

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
