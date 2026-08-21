import { Navigate } from "react-router-dom";
import { resolvePostLoginRoute } from "@/utils/workspace";

/** Used for bare /dashboard — sends the visitor to their resolved workspace home. */
export default function WorkspaceHomeRedirect() {
  return <Navigate to={resolvePostLoginRoute()} replace />;
}
