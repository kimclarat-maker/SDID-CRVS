import { useNavigate } from "react-router-dom";
import CardCount from "@/components/card/count";
import Button from "@/components/button";
import StatusBadge from "../components/StatusBadge";
import { getDemoData } from "@/demo/storage/demoStore";
import { deceasedDisplayName } from "../deathShared";

/** Medical Certifier home — cases needing certification, restricted to what
 * DEATH_CAUSE_VIEW/DEATH_CAUSE_EDIT actually grant (spec §2: no registration
 * drafting, no review/approval authority). */
export default function MedicalCertifierHome() {
  const navigate = useNavigate();
  const db = getDemoData();
  const pendingNotifications = db.crvsDeathNotifications.filter((n) => !n.medicalCertification?.isCertified && (n.status === "DRAFT" || n.status === "RETURNED"));
  const pendingRegistrations = db.crvsDeathRegistrations.filter((c) => !c.medicalCertification?.isCertified && (c.status === "DRAFT" || c.status === "CORRECTION_REQUIRED"));

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">Medical certification</h1>
        <p className="crvs-page-subtitle">Death notifications and registrations awaiting cause-of-death certification.</p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <div className="crvs-tile-grid">
        <CardCount
          name="Notifications awaiting certification"
          count={pendingNotifications.length}
          icon="assignment_late"
          color="var(--status-warning)"
          onClick={() => document.getElementById("medical-certifier-notifications-table")?.scrollIntoView({ behavior: "smooth", block: "start" })}
        />
        <CardCount
          name="Registrations awaiting certification"
          count={pendingRegistrations.length}
          icon="medical_information"
          color="var(--status-warning)"
          onClick={() => document.getElementById("medical-certifier-registrations-table")?.scrollIntoView({ behavior: "smooth", block: "start" })}
        />
      </div>

      <div className="crvs-section" id="medical-certifier-notifications-table">
        <h2 className="crvs-section-title">Notifications</h2>
        <table className="crvs-table">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Deceased</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {pendingNotifications.length === 0 && (
              <tr>
                <td className="crvs-empty-row" colSpan={3}>
                  Nothing awaiting certification.
                </td>
              </tr>
            )}
            {pendingNotifications.map((n) => (
              <tr key={n.id} style={{ cursor: "pointer" }} onClick={() => navigate(`/dashboard/crvs/death-notifications/${n.id}`)}>
                <td>{n.reference}</td>
                <td>{deceasedDisplayName(n.deceased)}</td>
                <td>
                  <StatusBadge kind="deathNotification" status={n.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="crvs-section" id="medical-certifier-registrations-table">
        <h2 className="crvs-section-title">Registrations</h2>
        <table className="crvs-table">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Deceased</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {pendingRegistrations.length === 0 && (
              <tr>
                <td className="crvs-empty-row" colSpan={3}>
                  Nothing awaiting certification.
                </td>
              </tr>
            )}
            {pendingRegistrations.map((c) => (
              <tr key={c.id} style={{ cursor: "pointer" }} onClick={() => navigate(`/dashboard/crvs/death-registrations/${c.id}`)}>
                <td>{c.reference}</td>
                <td>{deceasedDisplayName(c.deceased)}</td>
                <td>
                  <StatusBadge kind="deathRegistration" status={c.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Button text="Open death notifications" appearance="ghost" onClick={() => navigate("/dashboard/crvs/death-notifications")} testId="medical-certifier-open-notifications" />
    </div>
  );
}
