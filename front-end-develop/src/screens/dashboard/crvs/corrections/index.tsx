import Button from "@/components/button";
import toastMessage from "@/utils/common/toastMessage";
import { crvsCorrectionRequests } from "@/demo/seed/crvs";
import "../shared.css";

export default function Corrections() {
  const handleRespond = () => {
    toastMessage("success", "Responding to corrections arrives in the next milestone.");
  };

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">Correction requests</h1>
        <p className="crvs-page-subtitle">
          Corrections requested by a Civil Registrar on submitted cases.
        </p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <div className="crvs-section">
        <table className="crvs-table">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Case</th>
              <th>Reason</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {crvsCorrectionRequests.map((c) => (
              <tr key={c.id}>
                <td>{c.reference}</td>
                <td>{c.caseReference}</td>
                <td>{c.reason}</td>
                <td>
                  <span
                    className={`crvs-status-pill ${
                      c.status === "open" ? "crvs-status-warning" : "crvs-status-success"
                    }`}
                  >
                    {c.status === "open" ? "Open" : "Resolved"}
                  </span>
                </td>
                <td>
                  {c.status === "open" && (
                    <Button
                      text="Respond"
                      size="sm"
                      appearance="ghost"
                      onClick={handleRespond}
                      testId={`respond-${c.id}`}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
