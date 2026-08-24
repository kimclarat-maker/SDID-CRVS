import { useEffect, useState } from "react";
import { demoListCrvsAuditEvents } from "@/demo/services/crvsAudit";
import { DemoAuditEvent } from "@/demo/types";
import CaseQueueTable, { QueueColumn } from "../components/CaseQueueTable";
import "../shared.css";

/** Death-workflow audit trail (spec §6 route /dashboard/crvs/death-audit) —
 * scoped to crvs.death_* modules only, same underlying db.auditEvents
 * collection and demoListCrvsAuditEvents reader every other CRVS audit page
 * uses. */
export default function DeathAudit() {
  const [events, setEvents] = useState<DemoAuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    demoListCrvsAuditEvents({ limit: 500 }).then((res) => {
      setEvents(res.data.filter((e) => e.module.startsWith("crvs.death")));
      setLoading(false);
    });
  }, []);

  const filtered = search
    ? events.filter((e) => e.targetRef.toLowerCase().includes(search.toLowerCase()) || e.actor.toLowerCase().includes(search.toLowerCase()) || e.action.toLowerCase().includes(search.toLowerCase()))
    : events;

  const columns: QueueColumn<DemoAuditEvent>[] = [
    { key: "when", header: "When", render: (e) => new Date(e.at).toLocaleString() },
    { key: "actor", header: "Actor", render: (e) => e.actor },
    { key: "action", header: "Action", render: (e) => e.action },
    { key: "module", header: "Module", render: (e) => e.module.replace("crvs.death_", "").replace(/_/g, " ") },
    { key: "reference", header: "Reference", render: (e) => e.targetRef },
    { key: "details", header: "Details", render: (e) => e.details || "—" },
  ];

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">Death audit history</h1>
        <p className="crvs-page-subtitle">Every death-notification, registration, review, and synchronization action, in order.</p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <div className="crvs-filter-bar">
        <div className="crvs-filter-field">
          <label htmlFor="death-audit-search">Search</label>
          <input id="death-audit-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Reference, actor, action…" data-testid="death-audit-search" />
        </div>
      </div>

      <div className="crvs-section">
        <CaseQueueTable rows={filtered} columns={columns} getRowKey={(e) => e.id} loading={loading} emptyTitle="No audit activity yet" emptyDescription="Actions taken across the death workflow will appear here." emptyIcon="history" />
      </div>
    </div>
  );
}
