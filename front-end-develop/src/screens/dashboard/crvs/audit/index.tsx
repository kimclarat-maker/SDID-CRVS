import { useEffect, useState } from "react";
import { demoListCrvsAuditEvents } from "@/demo/services/crvsAudit";
import { DemoAuditEvent } from "@/demo/types";
import CaseQueueTable, { QueueColumn } from "../components/CaseQueueTable";
import "../shared.css";

/** Supervisor audit-trail page (spec §16/§24) over every CRVS workflow
 * action — notification/registration lifecycle, evidence, identity lookup,
 * duplicate checks, review, corrections, reassignment, exceptions,
 * approval/rejection, official registration, and synchronization. Never
 * shows passwords, tokens, or document binary content — audit entries are
 * written that way at the source (demo/services/crvsAudit.ts). */
export default function Audit() {
  const [events, setEvents] = useState<DemoAuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    demoListCrvsAuditEvents({ limit: 200 }).then((res) => {
      setEvents(res.data);
      setLoading(false);
    });
  }, []);

  const filtered = search
    ? events.filter(
        (e) =>
          e.targetRef.toLowerCase().includes(search.toLowerCase()) ||
          e.actor.toLowerCase().includes(search.toLowerCase()) ||
          e.action.toLowerCase().includes(search.toLowerCase())
      )
    : events;

  const columns: QueueColumn<DemoAuditEvent>[] = [
    { key: "when", header: "When", render: (e) => new Date(e.at).toLocaleString() },
    { key: "actor", header: "Actor", render: (e) => e.actor },
    { key: "action", header: "Action", render: (e) => e.action },
    { key: "module", header: "Module", render: (e) => e.module.replace("crvs.", "").replace(/_/g, " ") },
    { key: "reference", header: "Reference", render: (e) => e.targetRef },
    { key: "details", header: "Details", render: (e) => e.details || "—" },
  ];

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">Audit history</h1>
        <p className="crvs-page-subtitle">Every notification, registration and synchronization action, in order.</p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <div className="crvs-filter-bar">
        <div className="crvs-filter-field">
          <label htmlFor="audit-search">Search</label>
          <input id="audit-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Reference, actor, action…" data-testid="audit-search" />
        </div>
      </div>

      <div className="crvs-section">
        <CaseQueueTable
          rows={filtered}
          columns={columns}
          getRowKey={(e) => e.id}
          loading={loading}
          emptyTitle="No audit activity yet"
          emptyDescription="Actions taken across the birth workflow will appear here."
          emptyIcon="history"
        />
      </div>
    </div>
  );
}
