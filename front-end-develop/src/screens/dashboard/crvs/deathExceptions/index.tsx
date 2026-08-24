import { useNavigate } from "react-router-dom";
import CardCount from "@/components/card/count";
import CaseQueueTable, { QueueColumn } from "../components/CaseQueueTable";
import StatusBadge from "../components/StatusBadge";
import Button from "@/components/button";
import { getDemoData } from "@/demo/storage/demoStore";
import { DeathRegistrationCase } from "@/domain/crvs/types";
import { deceasedDisplayName } from "../deathShared";
import "../shared.css";

/** Combined exceptions view (spec §6): late, medico-legal, unidentified-
 * person, and possible-duplicate death cases in one queue, plus a link out
 * to the standalone sync-failures screen. */
export default function DeathExceptions() {
  const navigate = useNavigate();
  const db = getDemoData();
  const late = db.crvsDeathRegistrations.filter((c) => c.status === "LATE_REGISTRATION_REVIEW");
  const medicoLegal = db.crvsDeathRegistrations.filter((c) => c.status === "MEDICO_LEGAL_REVIEW");
  const unidentified = db.crvsDeathRegistrations.filter((c) => c.status === "UNIDENTIFIED_PERSON_REVIEW");
  const duplicates = db.crvsDeathRegistrations.filter((c) => c.duplicateCheck && c.duplicateCheck.overallLevel !== "NONE" && !c.duplicateCheck.resolution);
  const syncFailures = db.crvsDeathRegistrations.filter((c) => c.sdid.status === "FAILED" || c.sdid.status === "MANUAL_REVIEW");
  const combined = [...late, ...medicoLegal, ...unidentified];

  const columns: QueueColumn<DeathRegistrationCase>[] = [
    { key: "reference", header: "Reference", render: (c) => c.reference },
    { key: "deceased", header: "Deceased", render: (c) => deceasedDisplayName(c.deceased) },
    { key: "type", header: "Exception type", render: (c) => c.exception?.type.replace(/_/g, " ") || c.status.replace(/_/g, " ") },
    { key: "reason", header: "Reason", render: (c) => c.delayReason || c.exception?.reason || "—" },
    { key: "assigned", header: "Assigned to", render: (c) => c.reviewerName || "Unassigned" },
    { key: "status", header: "Status", render: (c) => <StatusBadge kind="deathRegistration" status={c.status} /> },
    { key: "action", header: "", render: (c) => <Button text="Review" size="sm" appearance="ghost" onClick={() => navigate(`/dashboard/crvs/death-exceptions/${c.id}`)} testId={`review-death-exception-${c.id}`} /> },
  ];

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">Death exceptions</h1>
        <p className="crvs-page-subtitle">Late, medico-legal, unidentified-person, and possible-duplicate death cases.</p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <div className="crvs-tile-grid">
        <CardCount name="Late registrations" count={late.length} icon="schedule" color="var(--status-warning)" />
        <CardCount name="Medico-legal" count={medicoLegal.length} icon="gavel" color="var(--status-warning)" />
        <CardCount name="Unidentified person" count={unidentified.length} icon="person_search" color="var(--status-warning)" />
        <CardCount name="Possible duplicates" count={duplicates.length} icon="content_copy" color="var(--status-warning)" />
        <CardCount name="Sync failures" count={syncFailures.length} icon="sync_problem" color="var(--status-danger)" onClick={() => navigate("/dashboard/crvs/death-sync-failures")} />
      </div>

      <div className="crvs-filter-bar">
        <Button text="Sync failures" appearance="ghost" onClick={() => navigate("/dashboard/crvs/death-sync-failures")} testId="tab-death-sync-failures" />
      </div>

      <div className="crvs-section">
        <CaseQueueTable rows={combined} columns={columns} getRowKey={(c) => c.id} emptyTitle="No exceptions right now" emptyDescription="Every death case is progressing through the standard flow." emptyIcon="task_alt" />
      </div>
    </div>
  );
}
