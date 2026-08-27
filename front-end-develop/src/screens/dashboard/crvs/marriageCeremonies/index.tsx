import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../shared.css";
import CaseQueueTable, { QueueColumn } from "../components/CaseQueueTable";
import Button from "@/components/button";
import Empty from "@/components/empty";
import { demoListMarriageApplications } from "@/demo/services/crvsMarriageApplications";
import { demoListMarriageCeremonies } from "@/demo/services/crvsMarriageCeremony";
import { witnessRequirementForSpouse } from "@/domain/crvs/marriagePolicyConfig";
import { MarriageApplication, MarriageCeremony } from "@/domain/crvs/types";
import { hasWorkspacePermission } from "@/utils/workspace";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { applicantDisplayName, todayIsoDate } from "../marriageShared";

type QueueStatus =
  | "AWAITING_ARRIVAL"
  | "PARTIALLY_CHECKED_IN"
  | "READY"
  | "IN_CEREMONY"
  | "COMPLETED"
  | "POSTPONED"
  | "NO_SHOW"
  | "CONSENT_DECLINED"
  | "CANCELLED";

const STATUS_LABELS: Record<QueueStatus, string> = {
  AWAITING_ARRIVAL: "Awaiting arrival",
  PARTIALLY_CHECKED_IN: "Partially checked in",
  READY: "Ready",
  IN_CEREMONY: "In ceremony",
  COMPLETED: "Completed",
  POSTPONED: "Postponed",
  NO_SHOW: "No-show",
  CONSENT_DECLINED: "Consent declined",
  CANCELLED: "Cancelled",
};

type Row = { application: MarriageApplication; ceremony?: MarriageCeremony; status: QueueStatus };

function deriveStatus(application: MarriageApplication, ceremony: MarriageCeremony | undefined): QueueStatus {
  if (!ceremony) return "AWAITING_ARRIVAL";
  if (ceremony.outcome === "COMPLETED") return "COMPLETED";
  if (ceremony.outcome === "POSTPONED") return "POSTPONED";
  if (ceremony.outcome === "NO_SHOW") return "NO_SHOW";
  if (ceremony.outcome === "CONSENT_DECLINED") return "CONSENT_DECLINED";
  if (ceremony.outcome === "CANCELLED") return "CANCELLED";
  if (ceremony.applicant1CheckedIn !== ceremony.applicant2CheckedIn) return "PARTIALLY_CHECKED_IN";
  if (!ceremony.applicant1CheckedIn && !ceremony.applicant2CheckedIn) return "AWAITING_ARRIVAL";
  const rule = witnessRequirementForSpouse();
  const witnesses1 = application.witnesses.filter((w) => w.spouseRole === "APPLICANT1" && !w.replaced).map((w) => w.id);
  const witnesses2 = application.witnesses.filter((w) => w.spouseRole === "APPLICANT2" && !w.replaced).map((w) => w.id);
  const checkedIn = new Set(ceremony.witnessCheckIns.filter((w) => w.checkedIn).map((w) => w.witnessId));
  const witnessesReady = witnesses1.filter((id) => checkedIn.has(id)).length >= rule.minimum && witnesses2.filter((id) => checkedIn.has(id)).length >= rule.minimum;
  if (!witnessesReady) return "PARTIALLY_CHECKED_IN";
  return application.status === "READY_FOR_CEREMONY" ? "READY" : "IN_CEREMONY";
}

/** Today's ceremony queue (spec §7) — statuses are all derived from ceremony
 * check-in/outcome state, never a persisted enum. */
export default function MarriageCeremoniesQueue() {
  const navigate = useNavigate();
  const canView = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_CEREMONY_VIEW);
  const canConduct = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_CEREMONY_CONDUCT) || hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_CHECKIN_MANAGE);

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [dateFrom, setDateFrom] = useState(todayIsoDate());
  const [dateTo, setDateTo] = useState(todayIsoDate());

  const load = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const { data: applications } = await demoListMarriageApplications({ limit: 500 });
      const ceremonies = demoListMarriageCeremonies({ dateFrom, dateTo });
      const relevant = applications.filter(
        (a) => !!a.appointmentId && ["APPOINTMENT_SCHEDULED", "READY_FOR_CEREMONY", "CEREMONY_COMPLETED", "NO_SHOW", "POSTPONED", "REJECTED"].includes(a.status)
      );
      const nextRows: Row[] = relevant.map((application) => {
        const ceremony = ceremonies.find((c) => c.applicationId === application.id);
        return { application, ceremony, status: deriveStatus(application, ceremony) };
      });
      setRows(nextRows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load the ceremony queue.");
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    if (canView) load();
  }, [canView, load]);

  const columns: QueueColumn<Row>[] = useMemo(
    () => [
      { key: "reference", header: "Reference", render: (r) => r.application.reference },
      { key: "applicants", header: "Applicants", render: (r) => `${applicantDisplayName(r.application.applicant1)} & ${applicantDisplayName(r.application.applicant2)}` },
      { key: "status", header: "Ceremony status", render: (r) => <span className="crvs-status-pill crvs-status-info">{STATUS_LABELS[r.status]}</span> },
      { key: "checkin", header: "Check-in", render: (r) => (r.ceremony ? `${r.ceremony.applicant1CheckedIn ? "1✓" : "1✗"} ${r.ceremony.applicant2CheckedIn ? "2✓" : "2✗"}` : "—") },
      {
        key: "actions",
        header: "",
        render: (r) => (
          <Button
            text="Open ceremony workspace"
            size="sm"
            appearance="primary"
            onClick={() => navigate(`/dashboard/crvs/marriage-ceremonies/${r.application.id}`)}
            disabled={!canConduct}
            testId={`open-ceremony-${r.application.id}`}
          />
        ),
      },
    ],
    [navigate, canConduct]
  );

  if (!canView) {
    return (
      <div className="crvs-page">
        <Empty icon="lock" title="You don't have access to marriage ceremonies" isFullScreen />
      </div>
    );
  }

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">Today's ceremonies</h1>
        <p className="crvs-page-subtitle">Physical check-in and civil-ceremony queue for scheduled appointments.</p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <div className="crvs-filter-bar">
        <div className="crvs-filter-field">
          <label htmlFor="ceremony-date-from">From</label>
          <input id="ceremony-date-from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div className="crvs-filter-field">
          <label htmlFor="ceremony-date-to">To</label>
          <input id="ceremony-date-to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
      </div>

      <div className="crvs-section">
        <CaseQueueTable
          rows={rows}
          columns={columns}
          getRowKey={(r) => r.application.id}
          loading={loading}
          error={error}
          onRetry={load}
          emptyTitle="No ceremonies in this range"
          emptyDescription="There are no scheduled appointments in the selected date range."
          emptyIcon="celebration"
        />
      </div>
    </div>
  );
}
