import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CaseQueueTable, { QueueColumn } from "../components/CaseQueueTable";
import StatusBadge from "../components/StatusBadge";
import Button from "@/components/button";
import Empty from "@/components/empty";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { hasWorkspacePermission } from "@/utils/workspace";
import { demoListDivorceRegistrations } from "@/demo/services/crvsDivorceRegistrations";
import { DivorceRegistration } from "@/domain/crvs/types";
import { CERTIFICATE_ELIGIBILITY_LABELS, formatDate, formerSpousesLabel, marriageReferenceLabel } from "../divorceShared";
import "../shared.css";

/** Registered divorces: the legally registered record queue — read-only
 * (spec §21/§22 "the registered record must be read-only"). Mirrors
 * registeredMarriages/index.tsx's structure closely. */
export default function RegisteredDivorces() {
  const navigate = useNavigate();
  const canView = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_REGISTERED_VIEW);

  const [rows, setRows] = useState<DivorceRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    if (!canView) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(undefined);
    try {
      const { data } = await demoListDivorceRegistrations({ status: "REGISTERED", search: search || undefined, limit: 200 });
      setRows(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load registered divorces.");
    } finally {
      setLoading(false);
    }
  }, [canView, search]);

  useEffect(() => {
    load();
  }, [load]);

  const columns: QueueColumn<DivorceRegistration>[] = [
    { key: "regNumber", header: "Divorce registration number", render: (r) => r.registrationEvent?.registrationNumber || "—" },
    { key: "reference", header: "Case reference", render: (r) => r.reference },
    { key: "spouses", header: "Former spouses", render: (r) => formerSpousesLabel(r) },
    { key: "registered", header: "Registration date", render: (r) => formatDate(r.registrationEvent?.registeredAt || r.registeredAt) },
    { key: "effective", header: "Effective date", render: (r) => formatDate(r.registrationEvent?.effectiveDate) },
    { key: "court", header: "Court", render: (r) => r.judgment.courtOrAuthorityName || "—" },
    { key: "judgment", header: "Judgment number", render: (r) => r.judgment.judgmentNumber || "—" },
    { key: "marriage", header: "Marriage reference", render: (r) => marriageReferenceLabel(r) },
    { key: "office", header: "Registering office", render: (r) => r.registrationEvent?.officeName || r.processingOffice.selectedProcessingOfficeName },
    { key: "sync", header: "SDID sync", render: (r) => <StatusBadge kind="divorceSync" status={r.sdid.status} /> },
    { key: "certificate", header: "Certificate eligibility", render: (r) => CERTIFICATE_ELIGIBILITY_LABELS[r.certificateEligibility?.status || "NOT_CHECKED"] },
    {
      key: "actions",
      header: "",
      render: (r) => <Button text="View" size="sm" appearance="ghost" type="button" onClick={() => navigate(`/dashboard/crvs/registered-divorces/${r.id}`)} testId={`rd-view-${r.id}`} />,
    },
  ];

  if (!canView) {
    return (
      <div className="crvs-page">
        <Empty icon="lock" title="You don't have access to registered divorces" description="Viewing registered divorces requires divorce-registered-view access." isFullScreen />
      </div>
    );
  }

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">Registered divorces</h1>
        <p className="crvs-page-subtitle">Legally registered divorce records and their SDID synchronization status. These records are read-only.</p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <div className="crvs-filter-bar">
        <div className="crvs-filter-field" style={{ flex: 1, minWidth: 240 }}>
          <label htmlFor="registered-divorce-search">Search</label>
          <input
            id="registered-divorce-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Reference, court case number, judgment number, marriage number, or former spouse name"
            data-testid="registered-divorce-search"
          />
        </div>
      </div>

      <div className="crvs-section">
        <CaseQueueTable
          rows={rows}
          columns={columns}
          getRowKey={(r) => r.id}
          loading={loading}
          error={error}
          onRetry={load}
          emptyTitle="No registered divorces yet"
          emptyDescription="Approved cases appear here once a Civil Registrar completes registration."
          emptyIcon="verified"
        />
      </div>
    </div>
  );
}
