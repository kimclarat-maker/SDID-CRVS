import { useNavigate } from "react-router-dom";
import Empty from "@/components/empty";
import Button from "@/components/button";
import { clearStorage } from "@/utils/storage";
import { getWorkspaces, resolvePostLoginRoute } from "@/utils/workspace";
import "./styles.css";

/**
 * Reached when a route-level guard (RequireWorkspace/RequirePermission)
 * denies access, or when a signed-in staff member has no valid workspace
 * assignment at all.
 */
export default function AccessDenied() {
  const navigate = useNavigate();
  const hasAnyWorkspace = getWorkspaces().length > 0;

  const handleSignOut = async () => {
    await clearStorage();
    navigate("/staff/sign-in");
  };

  return (
    <div className="access-denied-shell">
      <Empty
        icon="block"
        title="You don't have access to this workspace"
        description="Your account isn't assigned to this workspace, or doesn't have permission for this action. If you believe this is a mistake, contact your administrator."
        button={
          <div className="access-denied-actions">
            {hasAnyWorkspace && (
              <Button
                text="Go to my workspace"
                onClick={() => navigate(resolvePostLoginRoute())}
                testId="access-denied-go-home"
              />
            )}
            <Button
              text="Sign out"
              appearance="ghost"
              onClick={handleSignOut}
              testId="access-denied-sign-out"
            />
          </div>
        }
      />
    </div>
  );
}
