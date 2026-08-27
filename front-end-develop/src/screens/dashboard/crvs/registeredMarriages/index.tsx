import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CaseQueueTable, { QueueColumn } from "../components/CaseQueueTable";
import StatusBadge from "../components/StatusBadge";
import Button from "@/components/button";
import Empty from "@/components/empty";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { hasWorkspacePermission } from "@/utils/workspace";
import { demoListMarriageApplications } from "@/demo/services/crvsMarriageApplications";
import { MarriageApplication } from "@/domain/crvs/types";
import { applicantDisplayName, formatDate } from "../marriageShared";
import "../shared.css";

const CERTIFICATE_ELIGIBILITY_LABELS: Record<string, string> = {
  NOT_CHECKED: "Not checked",
  ELIGIBLE: "Eligible",
  INELIGIBLE: "Ineligible",
  MANUAL_REVIEW: "Manual review",
};

/** Registered marriages: the legally registered record queue — read-only
 * (spec §7 "the legal record must be read-only"). Mirrors registeredDeaths/
 * index.tsx's structure closely. */
export default function RegisteredMarriages() {
  const navigate = useNavigate();
  const canView = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_REGISTERED_VIEW);

  const [rows, setRows] = useState<MarriageApplication[]>([]);
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
      const { data } = await demoListMarriageApplications({ status: "REGISTERED", search: search || undefined, limit: 200 });
      setRows(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load registered marriages.");
    } finally {
      setLoading(false);
    }
  }, [canView, search]);

  useEffect(() => {
    load();
  }, [load]);

  const columns: QueueColumn<MarriageApplication>[] = [
    { key: "regNumber", header: "Registration number", render: (a) => a.registrationEvent?.registrationNumber || "—" },
    { key: "reference", header: "Reference", render: (a) => a.reference },
    { key: "spouses", header: "Spouses", render: (a) => `${applicantDisplayName(a.applicant1)} & ${applicantDisplayName(a.applicant2)}` },
    { key: "marriageDate", header: "Marriage date", render: (a) => formatDate(a.registrationEvent?.marriageDate) },
    { key: "office", header: "Office", render: (a) => a.registrationEvent?.officeName || a.officeName },
    { key: "sync", header: "SDID sync", render: (a) => <StatusBadge kind="marriageSync" status={a.sdid.status} /> },
    { key: "certificate", header: "Certificate eligibility", render: (a) => CERTIFICATE_ELIGIBILITY_LABELS[a.certificateEligibility?.status || "NOT_CHECKED"] },
    { key: "actions", header: "", render: (a) => <Button text="View" size="sm" appearance="ghost" onClick={() => navigate(`/dashboard/crvs/registered-marriages/${a.id}`)} testId={`registered-marriage-view-${a.id}`} /> },
  ];

  if (!canView) {
    return (
      <div className="crvs-page">
        <Empty icon="lock" title="You don't have access to registered marriages" isFullScreen />
      </div>
    );
  }

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">Registered marriages</h1>
        <p className="crvs-page-subtitle">Legally registered marriage records and their SDID synchronization status.</p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <div className="crvs-filter-bar">
        <div className="crvs-filter-field">
          <label htmlFor="registered-marriage-search">Search</label>
          <input id="registered-marriage-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Reference or applicant name" />
        </div>
      </div>

      <div className="crvs-section">
        <CaseQueueTable
          rows={rows}
          columns={columns}
          getRowKey={(a) => a.id}
          loading={loading}
          error={error}
          onRetry={load}
          emptyTitle="No registered marriages yet"
          emptyDescription="Approved applications appear here once a completed ceremony is registered."
          emptyIcon="verified"
        />
      </div>
    </div>
  );
}
