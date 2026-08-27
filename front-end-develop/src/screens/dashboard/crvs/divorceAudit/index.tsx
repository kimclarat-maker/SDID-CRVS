import { useEffect, useState } from "react";
import { CrvsAuditModule, demoListCrvsAuditEvents } from "@/demo/services/crvsAudit";
import { DemoAuditEvent } from "@/demo/types";
import CaseQueueTable, { QueueColumn } from "../components/CaseQueueTable";
import Empty from "@/components/empty";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { hasWorkspacePermission } from "@/utils/workspace";
import { formatDateTime } from "../divorceShared";
import "../shared.css";

const MODULE_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All modules" },
  { value: "crvs.divorce_notification", label: "Court notification" },
  { value: "crvs.divorce_registration", label: "Registration" },
  { value: "crvs.divorce_review", label: "Review" },
  { value: "crvs.divorce_correction", label: "Correction" },
  { value: "crvs.divorce_exception", label: "Exception" },
  { value: "crvs.divorce_foreign_review", label: "Foreign-decision review" },
  { value: "crvs.divorce_judgment_verification", label: "Judgment verification" },
  { value: "crvs.divorce_registration_event", label: "Registration event" },
  { value: "crvs.divorce_marriage_status_update", label: "Marriage status update" },
  { value: "crvs.divorce_sync", label: "SDID synchronization" },
  { value: "crvs.divorce_certificate", label: "Certificate" },
  { value: "crvs.divorce_evidence", label: "Evidence" },
  { value: "crvs.divorce_identity_search", label: "Identity search" },
  { value: "crvs.divorce_reassignment", label: "Reassignment" },
];

/** Divorce-workflow audit trail — mirrors marriageAudit/index.tsx, scoped to
 * the crvs.divorce_* module tags, with a module dropdown alongside the
 * free-text search since the divorce module spans many audit modules. */
export default function DivorceAudit() {
  const canView = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_AUDIT_VIEW);

  const [events, setEvents] = useState<DemoAuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");

  useEffect(() => {
    if (!canView) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(undefined);
    demoListCrvsAuditEvents({ limit: 500, module: (moduleFilter || undefined) as CrvsAuditModule | undefined })
      .then((res) => {
        if (cancelled) return;
        setEvents(res.data.filter((e) => e.module.startsWith("crvs.divorce")));
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Couldn't load divorce audit history.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [canView, moduleFilter]);

  const filtered = search
    ? events.filter(
        (e) =>
          e.targetRef.toLowerCase().includes(search.toLowerCase()) ||
          e.actor.toLowerCase().includes(search.toLowerCase()) ||
          e.action.toLowerCase().includes(search.toLowerCase()) ||
          (e.details || "").toLowerCase().includes(search.toLowerCase())
      )
    : events;

  const columns: QueueColumn<DemoAuditEvent>[] = [
    { key: "when", header: "When", render: (e) => formatDateTime(e.at) },
    { key: "actor", header: "Actor", render: (e) => e.actor },
    { key: "action", header: "Action", render: (e) => e.action },
    { key: "module", header: "Module", render: (e) => e.module.replace("crvs.divorce_", "").replace(/_/g, " ") },
    { key: "reference", header: "Reference", render: (e) => e.targetRef },
    { key: "details", header: "Details", render: (e) => e.details || "—" },
  ];

  if (!canView) {
    return (
      <div className="crvs-page">
        <Empty icon="lock" title="You don't have access to divorce audit history" description="Viewing the divorce audit trail requires divorce-audit-view access." isFullScreen />
      </div>
    );
  }

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">Divorce audit history</h1>
        <p className="crvs-page-subtitle">
          Every court notification, registration, review, correction, exception, foreign-decision review, judgment verification, registration event, and synchronization action, in order.
        </p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <div className="crvs-filter-bar">
        <div className="crvs-filter-field" style={{ flex: 1, minWidth: 220 }}>
          <label htmlFor="divorce-audit-search">Search</label>
          <input id="divorce-audit-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Reference, actor, action, details…" data-testid="divorce-audit-search" />
        </div>
        <div className="crvs-filter-field">
          <label htmlFor="divorce-audit-module">Module</label>
          <select id="divorce-audit-module" value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)} data-testid="divorce-audit-module">
            {MODULE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="crvs-section">
        <CaseQueueTable
          rows={filtered}
          columns={columns}
          getRowKey={(e) => e.id}
          loading={loading}
          error={error}
          onRetry={() => setModuleFilter((m) => m)}
          emptyTitle="No audit activity yet"
          emptyDescription="Actions taken across the divorce workflow will appear here."
          emptyIcon="history"
        />
      </div>
    </div>
  );
}
