import { ReactNode } from "react";

export const POST_LOGIN_REDIRECT_KEY = "postLoginRedirect";

export default function RequireAuth({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
