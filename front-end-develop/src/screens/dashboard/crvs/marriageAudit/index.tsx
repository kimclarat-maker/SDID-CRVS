import { useEffect, useState } from "react";
import { demoListCrvsAuditEvents, CrvsAuditModule } from "@/demo/services/crvsAudit";
import { DemoAuditEvent } from "@/demo/types";
import CaseQueueTable, { QueueColumn } from "../components/CaseQueueTable";
import Empty from "@/components/empty";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { hasWorkspacePermission } from "@/utils/workspace";
import "../shared.css";

const MODULE_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All modules" },
  { value: "crvs.marriage_application", label: "Application" },
  { value: "crvs.marriage_review", label: "Review" },
  { value: "crvs.marriage_correction", label: "Correction" },
  { value: "crvs.marriage_reassignment", label: "Reassignment" },
  { value: "crvs.marriage_exception", label: "Exception" },
  { value: "crvs.marriage_objection", label: "Objection" },
  { value: "crvs.marriage_appointment", label: "Appointment" },
  { value: "crvs.marriage_checkin", label: "Check-in" },
  { value: "crvs.marriage_ceremony", label: "Ceremony" },
  { value: "crvs.marriage_registration", label: "Registration" },
  { value: "crvs.marriage_sync", label: "SDID synchronization" },
  { value: "crvs.marriage_certificate", label: "Certificate" },
  { value: "crvs.marriage_eligibility", label: "Eligibility" },
  { value: "crvs.marriage_evidence", label: "Evidence" },
  { value: "crvs.marriage_identity_search", label: "Identity search" },
  { value: "crvs.marriage_duplicate_check", label: "Duplicate check" },
  { value: "crvs.marriage_partner_response", label: "Partner response" },
];

/** Marriage-workflow audit trail — mirrors deathAudit/index.tsx's shape,
 * with an added module-filter dropdown (in addition to the free-text
 * search box) since the marriage module spans many more audit modules than
 * death's single crvs.death_* prefix. */
export default function MarriageAudit() {
  const canView = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_AUDIT_VIEW);

  const [events, setEvents] = useState<DemoAuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");

  useEffect(() => {
    if (!canView) {
      setLoading(false);
      return;
    }
    setLoading(true);
    demoListCrvsAuditEvents({ limit: 500, module: (moduleFilter || undefined) as CrvsAuditModule | undefined }).then((res) => {
      setEvents(res.data.filter((e) => e.module.startsWith("crvs.marriage")));
      setLoading(false);
    });
  }, [canView, moduleFilter]);

  const filtered = search
    ? events.filter((e) => e.targetRef.toLowerCase().includes(search.toLowerCase()) || e.actor.toLowerCase().includes(search.toLowerCase()) || e.action.toLowerCase().includes(search.toLowerCase()))
    : events;

  const columns: QueueColumn<DemoAuditEvent>[] = [
    { key: "when", header: "When", render: (e) => new Date(e.at).toLocaleString() },
    { key: "actor", header: "Actor", render: (e) => e.actor },
    { key: "action", header: "Action", render: (e) => e.action },
    { key: "module", header: "Module", render: (e) => e.module.replace("crvs.marriage_", "").replace(/_/g, " ") },
    { key: "reference", header: "Reference", render: (e) => e.targetRef },
    { key: "details", header: "Details", render: (e) => e.details || "—" },
  ];

  if (!canView) {
    return (
      <div className="crvs-page">
        <Empty icon="lock" title="You don't have access to marriage audit history" isFullScreen />
      </div>
    );
  }

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">Marriage audit history</h1>
        <p className="crvs-page-subtitle">Every marriage declaration, review, correction, exception, objection, appointment, ceremony, registration, and synchronization action, in order.</p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <div className="crvs-filter-bar">
        <div className="crvs-filter-field">
          <label htmlFor="marriage-audit-search">Search</label>
          <input id="marriage-audit-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Reference, actor, action…" data-testid="marriage-audit-search" />
        </div>
        <div className="crvs-filter-field">
          <label htmlFor="marriage-audit-module">Module</label>
          <select id="marriage-audit-module" value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)} data-testid="marriage-audit-module">
            {MODULE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="crvs-section">
        <CaseQueueTable rows={filtered} columns={columns} getRowKey={(e) => e.id} loading={loading} emptyTitle="No audit activity yet" emptyDescription="Actions taken across the marriage workflow will appear here." emptyIcon="history" />
      </div>
    </div>
  );
}
