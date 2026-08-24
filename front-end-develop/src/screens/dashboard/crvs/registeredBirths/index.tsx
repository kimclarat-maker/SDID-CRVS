import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import CaseQueueTable, { QueueColumn } from "../components/CaseQueueTable";
import StatusBadge from "../components/StatusBadge";
import Button from "@/components/button";
import { getDemoData } from "@/demo/storage/demoStore";
import { BirthRegistrationCase } from "@/domain/crvs/types";
import "../shared.css";

export default function RegisteredBirths() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    const db = getDemoData();
    let results = db.crvsRegistrations.filter((c) => c.status === "REGISTERED");
    if (search) {
      const term = search.toLowerCase();
      results = results.filter(
        (c) =>
          c.reference.toLowerCase().includes(term) ||
          (c.officialBirthRecordNumber || "").toLowerCase().includes(term) ||
          `${c.child.firstName || ""} ${c.child.lastName}`.toLowerCase().includes(term)
      );
    }
    return [...results].sort((a, b) => (a.registeredAt || "") < (b.registeredAt || "") ? 1 : -1);
  }, [search]);

  const columns: QueueColumn<BirthRegistrationCase>[] = [
    { key: "record", header: "Birth record number", render: (c) => c.officialBirthRecordNumber || "—" },
    { key: "child", header: "Child", render: (c) => (c.child.firstName ? `${c.child.firstName} ${c.child.lastName}` : `Unnamed ${c.child.lastName}`) },
    { key: "registeredAt", header: "Registered", render: (c) => (c.registeredAt ? new Date(c.registeredAt).toLocaleDateString() : "—") },
    { key: "jurisdiction", header: "Jurisdiction", render: (c) => c.jurisdiction },
    { key: "sync", header: "SDID synchronization", render: (c) => <StatusBadge kind="sync" status={c.sdid.status} /> },
    {
      key: "action",
      header: "",
      render: (c) => <Button text="View" size="sm" appearance="ghost" onClick={() => navigate(`/dashboard/crvs/registered-births/${c.id}`)} testId={`view-registered-${c.id}`} />,
    },
  ];

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">Registered births</h1>
        <p className="crvs-page-subtitle">Official CRVS birth records and their SDID synchronization status.</p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <div className="crvs-filter-bar">
        <div className="crvs-filter-field">
          <label htmlFor="registered-search">Search</label>
          <input id="registered-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Birth record number, reference, child…" data-testid="registered-search" />
        </div>
      </div>

      <div className="crvs-section">
        <CaseQueueTable
          rows={rows}
          columns={columns}
          getRowKey={(c) => c.id}
          emptyTitle="No registered births yet"
          emptyDescription="Cases appear here once a Civil Registrar approves and registers them."
          emptyIcon="verified"
        />
      </div>
    </div>
  );
}
