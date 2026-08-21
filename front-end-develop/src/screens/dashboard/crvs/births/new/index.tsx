import { useNavigate } from "react-router-dom";
import Empty from "@/components/empty";
import Button from "@/components/button";
import "../../shared.css";

/**
 * The birth-registration creation workflow is explicitly out of scope for
 * this milestone (auth/workspace foundations only) — this is the
 * placeholder the spec asks for rather than a broken or empty page.
 */
export default function NewBirthNotification() {
  const navigate = useNavigate();

  return (
    <div className="crvs-page">
      <Empty
        icon="construction"
        title="Coming in the next milestone"
        description="The birth notification/registration creation workflow will be available in a future release."
        button={
          <Button
            text="Back to CRVS home"
            appearance="ghost"
            onClick={() => navigate("/dashboard/crvs")}
            testId="crvs-coming-soon-back"
          />
        }
      />
    </div>
  );
}
