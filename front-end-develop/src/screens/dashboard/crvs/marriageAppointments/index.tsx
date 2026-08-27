import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import CaseQueueTable, { QueueColumn } from "../components/CaseQueueTable";
import StatusBadge from "../components/StatusBadge";
import Button from "@/components/button";
import Empty from "@/components/empty";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { hasWorkspacePermission } from "@/utils/workspace";
import { demoListMarriageAppointments } from "@/demo/services/crvsMarriageAppointments";
import { MarriageAppointment, MarriageAppointmentStatus } from "@/domain/crvs/types";
import { MARRIAGE_APPOINTMENT_STATUS_LABELS } from "@/domain/crvs/statusMachines";
import { formatDate } from "../marriageShared";
import "../shared.css";

const STATUS_OPTIONS: MarriageAppointmentStatus[] = ["SCHEDULED", "RESCHEDULE_REQUESTED", "CANCEL_REQUESTED", "CANCELLED", "COMPLETED", "NO_SHOW"];

/** Marriage-appointment queue (companion to marriageAppointments/calendar) —
 * a flat, filterable list of every scheduled ceremony appointment, mirroring
 * marriageApplications/index.tsx's saved-view queue shape but with simple
 * office/officiant/status/date-range filters instead of tabs, since
 * appointments don't have the same "my drafts vs eligibility review" shape
 * applications do. */
export default function MarriageAppointmentsQueue() {
  const navigate = useNavigate();
  const canView = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_APPOINTMENT_VIEW);

  const [appointments, setAppointments] = useState<MarriageAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  const [officeFilter, setOfficeFilter] = useState("");
  const [officiantFilter, setOfficiantFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const load = useCallback(async () => {
    if (!canView) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(undefined);
    try {
      const { data } = await demoListMarriageAppointments({ limit: 1000 });
      setAppointments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load marriage appointments.");
    } finally {
      setLoading(false);
    }
  }, [canView]);

  useEffect(() => {
    load();
  }, [load]);

  const officeOptions = useMemo(() => {
    const map = new Map<string, string>();
    appointments.forEach((a) => map.set(a.officeId, a.officeName));
    return Array.from(map.entries());
  }, [appointments]);

  const officiantOptions = useMemo(() => {
    const map = new Map<string, string>();
    appointments.forEach((a) => {
      if (a.officiantId) map.set(a.officiantId, a.officiantName || a.officiantId);
    });
    return Array.from(map.entries());
  }, [appointments]);

  const filtered = useMemo(
    () =>
      appointments.filter(
        (a) =>
          (!officeFilter || a.officeId === officeFilter) &&
          (!officiantFilter || a.officiantId === officiantFilter) &&
          (!statusFilter || a.status === statusFilter) &&
          (!dateFrom || a.date.slice(0, 10) >= dateFrom) &&
          (!dateTo || a.date.slice(0, 10) <= dateTo)
      ),
    [appointments, officeFilter, officiantFilter, statusFilter, dateFrom, dateTo]
  );

  const columns: QueueColumn<MarriageAppointment>[] = [
    { key: "reference", header: "Reference", render: (a) => a.reference },
    {
      key: "application",
      header: "Application",
      render: (a) => (
        <button
          type="button"
          className="crvs-tab"
          style={{ padding: 0, minHeight: "auto", textDecoration: "underline" }}
          onClick={() => navigate(`/dashboard/crvs/marriage-applications/${a.applicationId}`)}
        >
          {a.applicationReference}
        </button>
      ),
    },
    { key: "office", header: "Office", render: (a) => a.officeName },
    { key: "date", header: "Date", render: (a) => formatDate(a.date) },
    { key: "timeSlot", header: "Time slot", render: (a) => a.timeSlot },
    {
      key: "specialDay",
      header: "Special day",
      render: (a) => (a.isSpecialDay ? <span className="crvs-status-pill crvs-status-info">Special day</span> : "—"),
    },
    { key: "officiant", header: "Officiant", render: (a) => a.officiantName || "Unassigned" },
    { key: "status", header: "Status", render: (a) => <StatusBadge kind="marriageAppointment" status={a.status} /> },
    {
      key: "actions",
      header: "",
      render: (a) => <Button text="View" size="sm" appearance="ghost" type="button" onClick={() => navigate(`/dashboard/crvs/marriage-appointments/${a.id}`)} testId={`ma-view-${a.id}`} />,
    },
  ];

  if (!canView) {
    return (
      <div className="crvs-page">
        <Empty icon="lock" title="You don't have access to marriage appointments" isFullScreen />
      </div>
    );
  }

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">Marriage appointments</h1>
        <p className="crvs-page-subtitle">Every scheduled civil-ceremony appointment, filterable by office, officiant, status and date.</p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <div className="crvs-filter-bar">
        <Button text="Open calendar" appearance="primary" startIcon="calendar_month" type="button" onClick={() => navigate("/dashboard/crvs/marriage-appointments/calendar")} testId="ma-open-calendar" />
        <div className="crvs-filter-field">
          <label htmlFor="ma-filter-office">Office</label>
          <select id="ma-filter-office" value={officeFilter} onChange={(e) => setOfficeFilter(e.target.value)} data-testid="ma-filter-office">
            <option value="">All offices</option>
            {officeOptions.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div className="crvs-filter-field">
          <label htmlFor="ma-filter-officiant">Officiant</label>
          <select id="ma-filter-officiant" value={officiantFilter} onChange={(e) => setOfficiantFilter(e.target.value)} data-testid="ma-filter-officiant">
            <option value="">All officiants</option>
            {officiantOptions.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div className="crvs-filter-field">
          <label htmlFor="ma-filter-status">Status</label>
          <select id="ma-filter-status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} data-testid="ma-filter-status">
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {MARRIAGE_APPOINTMENT_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="crvs-filter-field">
          <label htmlFor="ma-filter-from">From</label>
          <input id="ma-filter-from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} data-testid="ma-filter-from" />
        </div>
        <div className="crvs-filter-field">
          <label htmlFor="ma-filter-to">To</label>
          <input id="ma-filter-to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} data-testid="ma-filter-to" />
        </div>
      </div>

      <div className="crvs-section">
        <CaseQueueTable
          rows={filtered}
          columns={columns}
          getRowKey={(a) => a.id}
          loading={loading}
          error={error}
          onRetry={load}
          emptyTitle="No appointments found"
          emptyDescription="No appointments match the current filters."
          emptyIcon="event_busy"
        />
      </div>
    </div>
  );
}
