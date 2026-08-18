import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getStorage } from "@/utils/storage";
import { isTokenExpired } from "@/utils/common/isTokenExpired";
import Loading from "@/components/loader";

export const POST_LOGIN_REDIRECT_KEY = "postLoginRedirect";

type AuthState = "checking" | "authorized" | "unauthorized";

export default function RequireAuth({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>("checking");
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      const user = await getStorage();
      const hasValidToken = !!user?.token && !isTokenExpired(user.token);

      if (!isMounted) return;
      setAuthState(hasValidToken ? "authorized" : "unauthorized");
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [location.pathname]);

  if (authState === "checking") {
    return <Loading isFullScreen />;
  }

  if (authState === "unauthorized") {
    const destination = `${location.pathname}${location.search}`;
    sessionStorage.setItem(POST_LOGIN_REDIRECT_KEY, destination);

    return (
      <Navigate to="/staff/sign-in" state={{ from: destination }} replace />
    );
  }

  return <>{children}</>;
}
