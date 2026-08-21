import { useNavigate } from "react-router-dom";
import Empty from "@/components/empty";
import Button from "@/components/button";
import "../shared.css";

export default function Reports() {
  const navigate = useNavigate();

  return (
    <div className="crvs-page">
      <Empty
        icon="insights"
        title="Coming in the next milestone"
        description="Detailed CRVS analytics and reporting will be available in a future release."
        button={
          <Button
            text="Back to CRVS home"
            appearance="ghost"
            onClick={() => navigate("/dashboard/crvs")}
            testId="crvs-reports-back"
          />
        }
      />
    </div>
  );
}
