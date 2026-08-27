import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Button from "@/components/button";
import Icon from "@/components/icon";
import Empty from "@/components/empty";
import SuccessModal from "@/components/crvs/modals/SuccessModal";
import ScheduleAppointmentModal from "../components/modals/ScheduleAppointmentModal";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { hasWorkspacePermission } from "@/utils/workspace";
import { demoListMarriageAppointments } from "@/demo/services/crvsMarriageAppointments";
import { computeSlotAvailability, SlotAvailability, SlotAvailabilityStatus } from "@/domain/crvs/marriageAppointmentAvailability";
import { marriagePolicyConfig } from "@/domain/crvs/marriagePolicyConfig";
import { DEMO_MARRIAGE_OFFICE_ID, DEMO_MARRIAGE_OFFICE_NAME } from "@/demo/seed/crvsAccounts";
import { MarriageAppointment } from "@/domain/crvs/types";
import { MARRIAGE_APPOINTMENT_STATUS_LABELS } from "@/domain/crvs/statusMachines";
import { todayIsoDate } from "../../marriageShared";
import "../../shared.css";

type ViewMode = "month" | "week" | "agenda";

const STATUS_LABEL: Record<SlotAvailabilityStatus, string> = {
  AVAILABLE: "Available",
  RESERVED: "Filling up",
  FULL: "Fully booked",
  BLOCKED: "Too soon to book",
  HOLIDAY: "Office closed",
};

const STATUS_CELL_CLASS: Record<SlotAvailabilityStatus, string> = {
  AVAILABLE: "status-available",
  RESERVED: "status-reserved",
  FULL: "status-full",
  BLOCKED: "status-blocked",
  HOLIDAY: "status-holiday",
};

function toIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function parseIso(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function startOfWeek(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - x.getDay());
  return x;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() + n);
  return x;
}

function shiftAnchor(iso: string, viewMode: ViewMode, direction: 1 | -1): string {
  const d = parseIso(iso);
  if (viewMode === "month") d.setMonth(d.getMonth() + direction);
  else if (viewMode === "week") d.setDate(d.getDate() + direction * 7);
  else d.setDate(d.getDate() + direction * 30);
  return toIso(d);
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Marriage-appointment calendar (spec §6) — month/week/agenda views of
 * office capacity, computed via the shared computeSlotAvailability() so the
 * calendar, the schedule modal, and the service layer's own write-time
 * check all agree on the same derived state. No calendar library: every
 * view is a plain CSS-grid/flex layout over `.crvs-calendar-*` (added to
 * shared.css — no class here duplicates an existing token). */
export default function MarriageAppointmentCalendar() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const applicationIdParam = searchParams.get("applicationId") || undefined;

  const canView = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_APPOINTMENT_VIEW);
  const canCreate = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_APPOINTMENT_CREATE);

  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [anchorIso, setAnchorIso] = useState(todayIsoDate());
  const [officeFilter, setOfficeFilter] = useState(DEMO_MARRIAGE_OFFICE_ID);
  const [officiantFilter, setOfficiantFilter] = useState("");

  const [appointments, setAppointments] = useState<MarriageAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  const [scheduleDate, setScheduleDate] = useState<string | undefined>();
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduledAppointment, setScheduledAppointment] = useState<MarriageAppointment | undefined>();

  const anchorDate = useMemo(() => parseIso(anchorIso), [anchorIso]);

  const range = useMemo(() => {
    if (viewMode === "week") {
      const start = startOfWeek(anchorDate);
      return { start, end: addDays(start, 6) };
    }
    if (viewMode === "agenda") {
      return { start: anchorDate, end: addDays(anchorDate, 29) };
    }
    const start = startOfWeek(startOfMonth(anchorDate));
    const end = addDays(startOfWeek(endOfMonth(anchorDate)), 6);
    return { start, end };
  }, [viewMode, anchorDate]);

  const dateFrom = toIso(range.start);
  const dateTo = toIso(range.end);

  const load = useCallback(() => {
    if (!canView) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(undefined);
    demoListMarriageAppointments({ dateFrom, dateTo, limit: 2000 })
      .then((res) => setAppointments(res.data))
      .catch((err) => setError(err instanceof Error ? err.message : "Couldn't load the appointment calendar."))
      .finally(() => setLoading(false));
  }, [canView, dateFrom, dateTo]);

  useEffect(() => {
    load();
  }, [load]);

  const officeOptions = useMemo(() => {
    const map = new Map<string, string>([[DEMO_MARRIAGE_OFFICE_ID, DEMO_MARRIAGE_OFFICE_NAME]]);
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

  const days = useMemo(() => {
    const arr: Date[] = [];
    let cur = range.start;
    while (cur.getTime() <= range.end.getTime()) {
      arr.push(cur);
      cur = addDays(cur, 1);
    }
    return arr;
  }, [range]);

  const dayInfo = useCallback(
    (day: Date) => {
      const iso = toIso(day);
      const availability: SlotAvailability = computeSlotAvailability(officeFilter, iso, appointments);
      const dayAppointments = appointments.filter((a) => a.date.slice(0, 10) === iso && (!officiantFilter || a.officiantId === officiantFilter));
      return { iso, availability, dayAppointments };
    },
    [officeFilter, officiantFilter, appointments]
  );

  const officeName = officeOptions.find(([id]) => id === officeFilter)?.[1] || DEMO_MARRIAGE_OFFICE_NAME;

  const openSchedule = (iso?: string) => {
    setScheduleDate(iso || todayIsoDate());
    setShowSchedule(true);
  };

  const handleDayClick = (iso: string, availability: SlotAvailability) => {
    if (!canCreate) return;
    if (availability.status !== "AVAILABLE" && availability.status !== "RESERVED") return;
    openSchedule(iso);
  };

  const dayTitle = (availability: SlotAvailability): string => {
    if (!canCreate) return "You don't have permission to schedule appointments.";
    if (availability.status === "FULL") return "This date is fully booked at this office.";
    if (availability.status === "BLOCKED") return `Appointments must be booked at least ${marriagePolicyConfig.appointmentCapacity.minBookingLeadDays} days in advance.`;
    if (availability.status === "HOLIDAY") return "This date is a designated office-closure day.";
    return "Click to schedule an appointment on this date.";
  };

  if (!canView) {
    return (
      <div className="crvs-page">
        <Empty icon="lock" title="You don't have access to the appointment calendar" isFullScreen />
      </div>
    );
  }

  const headerLabel =
    viewMode === "month"
      ? anchorDate.toLocaleDateString(undefined, { month: "long", year: "numeric" })
      : `${range.start.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${range.end.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">Appointment calendar</h1>
        <p className="crvs-page-subtitle">Office capacity by day — click an available day to schedule a ceremony appointment.</p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      {applicationIdParam && canCreate && (
        <div className="crvs-banner crvs-banner-info" style={{ marginBottom: 12 }}>
          <Icon name="info" /> Scheduling an appointment for application <strong>{applicationIdParam}</strong>. Click an available day, or{" "}
          <button type="button" className="crvs-tab" style={{ padding: 0, minHeight: "auto", textDecoration: "underline" }} onClick={() => openSchedule(todayIsoDate())}>
            open the schedule form directly
          </button>
          .
        </div>
      )}

      <div className="crvs-filter-bar">
        <div className="crvs-filter-field">
          <label htmlFor="cal-view">View</label>
          <select id="cal-view" value={viewMode} onChange={(e) => setViewMode(e.target.value as ViewMode)} data-testid="calendar-view-mode">
            <option value="month">Month</option>
            <option value="week">Week</option>
            <option value="agenda">Agenda (30 days)</option>
          </select>
        </div>
        <div className="crvs-filter-field">
          <label htmlFor="cal-office">Office</label>
          <select id="cal-office" value={officeFilter} onChange={(e) => setOfficeFilter(e.target.value)} data-testid="calendar-office-filter">
            {officeOptions.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div className="crvs-filter-field">
          <label htmlFor="cal-officiant">Officiant</label>
          <select id="cal-officiant" value={officiantFilter} onChange={(e) => setOfficiantFilter(e.target.value)} data-testid="calendar-officiant-filter">
            <option value="">All officiants</option>
            {officiantOptions.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <Button text="" startIcon="chevron_left" appearance="ghost" type="button" onClick={() => setAnchorIso(shiftAnchor(anchorIso, viewMode, -1))} testId="calendar-prev" />
          <Button text="Today" appearance="ghost" type="button" onClick={() => setAnchorIso(todayIsoDate())} testId="calendar-today" />
          <Button text="" startIcon="chevron_right" appearance="ghost" type="button" onClick={() => setAnchorIso(shiftAnchor(anchorIso, viewMode, 1))} testId="calendar-next" />
          <strong style={{ marginLeft: 8 }}>{headerLabel}</strong>
        </div>
        {canCreate && <Button text="Schedule appointment" appearance="primary" startIcon="add_circle" type="button" onClick={() => openSchedule(todayIsoDate())} testId="calendar-schedule" />}
      </div>

      {error && (
        <div className="crvs-banner crvs-banner-danger" style={{ marginBottom: 12 }}>
          <Icon name="error" /> {error}{" "}
          <button type="button" className="crvs-tab" style={{ padding: 0, minHeight: "auto", textDecoration: "underline" }} onClick={load}>
            Try again
          </button>
        </div>
      )}
      {loading && <p className="crvs-form-hint" style={{ marginBottom: 8 }}>Loading calendar…</p>}

      <div className="crvs-section">
        {viewMode !== "agenda" ? (
          <>
            <div className="crvs-calendar-weekdays">
              {WEEKDAY_LABELS.map((w) => (
                <div key={w}>{w}</div>
              ))}
            </div>
            <div className="crvs-calendar-grid">
              {days.map((day) => {
                const { iso, availability, dayAppointments } = dayInfo(day);
                const isOutside = viewMode === "month" && day.getMonth() !== anchorDate.getMonth();
                const isToday = iso === todayIsoDate();
                const clickable = canCreate && (availability.status === "AVAILABLE" || availability.status === "RESERVED");
                return (
                  <button
                    type="button"
                    key={iso}
                    className={`crvs-calendar-cell ${STATUS_CELL_CLASS[availability.status]} ${isOutside ? "is-outside" : ""} ${isToday ? "is-today" : ""} ${
                      availability.isSpecialDay ? "is-special" : ""
                    } ${clickable ? "is-clickable" : ""}`}
                    onClick={() => handleDayClick(iso, availability)}
                    disabled={!clickable}
                    title={dayTitle(availability)}
                    data-testid={`calendar-day-${iso}`}
                  >
                    <span className="crvs-calendar-cell-date">
                      {day.getDate()}
                      {availability.isSpecialDay && <Icon name="star" testId={`calendar-special-${iso}`} />}
                    </span>
                    <span className="crvs-calendar-cell-status">{STATUS_LABEL[availability.status]}</span>
                    <span className="crvs-calendar-cell-status">
                      {availability.booked}/{availability.capacity} booked
                    </span>
                    {dayAppointments.slice(0, 2).map((a) => (
                      <span key={a.id} className="crvs-calendar-cell-status">
                        {a.timeSlot} · {a.reference}
                      </span>
                    ))}
                    {dayAppointments.length > 2 && <span className="crvs-calendar-cell-status">+{dayAppointments.length - 2} more</span>}
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {days.map((day) => {
              const { iso, availability, dayAppointments } = dayInfo(day);
              const clickable = canCreate && (availability.status === "AVAILABLE" || availability.status === "RESERVED");
              return (
                <div key={iso} className={`crvs-calendar-cell crvs-calendar-agenda-row ${STATUS_CELL_CLASS[availability.status]}`}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                    <strong>
                      {day.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                      {availability.isSpecialDay && <Icon name="star" />}
                    </strong>
                    <span className="crvs-calendar-cell-status">
                      {STATUS_LABEL[availability.status]} — {availability.booked}/{availability.capacity} booked
                    </span>
                    {clickable && <Button text="Schedule" size="sm" appearance="ghost" type="button" onClick={() => openSchedule(iso)} testId={`agenda-schedule-${iso}`} />}
                  </div>
                  {dayAppointments.length > 0 && (
                    <ul style={{ margin: "6px 0 0", paddingLeft: 20 }}>
                      {dayAppointments.map((a) => (
                        <li key={a.id}>
                          <button
                            type="button"
                            className="crvs-tab"
                            style={{ padding: 0, minHeight: "auto", textDecoration: "underline" }}
                            onClick={() => navigate(`/dashboard/crvs/marriage-appointments/${a.id}`)}
                          >
                            {a.timeSlot} · {a.reference}
                          </button>{" "}
                          — {MARRIAGE_APPOINTMENT_STATUS_LABELS[a.status]} — {a.officiantName || "Unassigned officiant"}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ScheduleAppointmentModal
        show={showSchedule}
        onClose={() => setShowSchedule(false)}
        defaultApplicationId={applicationIdParam}
        defaultDate={scheduleDate}
        officeId={officeFilter}
        officeName={officeName}
        onScheduled={(appointment) => {
          setShowSchedule(false);
          setScheduledAppointment(appointment);
          load();
        }}
      />

      <SuccessModal
        show={Boolean(scheduledAppointment)}
        onClose={() => setScheduledAppointment(undefined)}
        title="Appointment scheduled"
        description={scheduledAppointment ? `${scheduledAppointment.reference} — ${scheduledAppointment.date.slice(0, 10)} ${scheduledAppointment.timeSlot}` : undefined}
        primaryLabel="View appointment"
        onPrimary={() => scheduledAppointment && navigate(`/dashboard/crvs/marriage-appointments/${scheduledAppointment.id}`)}
        secondaryLabel="Close"
        onSecondary={() => setScheduledAppointment(undefined)}
        testId="appointment-scheduled-success"
      />
    </div>
  );
}
