import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CaseQueueTable, { QueueColumn } from "../components/CaseQueueTable";
import StatusBadge from "../components/StatusBadge";
import Button from "@/components/button";
import Empty from "@/components/empty";
import RequirePermission from "@/navigation/guards/RequirePermission";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { demoListDeathRegistrations } from "@/demo/services/crvsDeathRegistrations";
import { DeathRegistrationCase } from "@/domain/crvs/types";
import { deceasedDisplayName, formatDate } from "../deathShared";
import "../shared.css";

function RegisteredDeathsInner() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<DeathRegistrationCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [search, setSearch] = useState("");

  const load = () => {
    setLoading(true);
    setError(undefined);
    demoListDeathRegistrations({ status: "REGISTERED", search: search || undefined, limit: 100 })
      .then((res) => setRows(res.data))
      .catch((err) => setError(err instanceof Error ? err.message : "Couldn't load registered deaths."))
      .finally(() => setLoading(false));
  };

  useEffect(load, [search]);

  const columns: QueueColumn<DeathRegistrationCase>[] = [
    { key: "recordNumber", header: "Death record number", render: (c) => c.officialDeathRecordNumber || "—" },
    { key: "reference", header: "Reference", render: (c) => c.reference },
    { key: "deceased", header: "Deceased", render: (c) => deceasedDisplayName(c.deceased) },
    { key: "registeredAt", header: "Registered", render: (c) => formatDate(c.registeredAt) },
    { key: "sync", header: "SDID sync", render: (c) => <StatusBadge kind="deathSync" status={c.sdid.status} /> },
    { key: "actions", header: "", render: (c) => <Button text="View" size="sm" appearance="ghost" onClick={() => navigate(`/dashboard/crvs/registered-deaths/${c.id}`)} testId={`registered-death-view-${c.id}`} /> },
  ];

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">Registered deaths</h1>
        <p className="crvs-page-subtitle">Legally registered death records and their SDID synchronization status.</p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <div className="crvs-filter-bar">
        <div className="crvs-filter-field">
          <label htmlFor="registered-death-search">Search</label>
          <input id="registered-death-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Reference, name, or record number" />
        </div>
      </div>

      <div className="crvs-section">
        <CaseQueueTable rows={rows} columns={columns} getRowKey={(c) => c.id} loading={loading} error={error} onRetry={load} emptyTitle="No registered deaths yet" emptyDescription="Approved cases appear here once registered." emptyIcon="verified" />
      </div>
    </div>
  );
}

export default function RegisteredDeaths() {
  return (
    <RequirePermission
      workspace="CRVS"
      permission={CRVS_PERMISSIONS.DEATH_REGISTRATION_VIEW}
      fallback={
        <div className="crvs-page">
          <Empty icon="lock" title="You don't have access to registered deaths" />
        </div>
      }
    >
      <RegisteredDeathsInner />
    </RequirePermission>
  );
}
