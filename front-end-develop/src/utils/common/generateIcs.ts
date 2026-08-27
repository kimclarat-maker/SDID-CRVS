// Minimal client-side .ics (iCalendar) file generator — no external calendar
// library. Used by the public marriage-appointment page's "Add to calendar"
// action, mirroring the Blob + temporary-anchor download pattern already
// used elsewhere in the public CRVS pages for plain-text downloads (see the
// death success page's handleDownloadAcknowledgement).
export type IcsEventInput = {
  title: string;
  description?: string;
  location?: string;
  /** ISO date, or ISO datetime, marking the event start. */
  startIso: string;
  durationMinutes?: number;
};

function formatIcsDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.toISOString().replace(/[-:]/g, "").split(".")[0]}Z`;
}

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

/** Builds a minimal valid iCalendar VEVENT and triggers a browser download.
 * Pure/side-effecting utility — no React, no service calls. */
export function generateIcsFile(event: IcsEventInput): void {
  const start = new Date(event.startIso);
  if (Number.isNaN(start.getTime())) return;
  const durationMinutes = event.durationMinutes ?? 30;
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SDID CRVS Demo//Marriage Appointment//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${Date.now()}-${Math.round(Math.random() * 100000)}@sdid-crvs-demo`,
    `DTSTAMP:${formatIcsDate(new Date().toISOString())}`,
    `DTSTART:${formatIcsDate(start.toISOString())}`,
    `DTEND:${formatIcsDate(end.toISOString())}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
    ...(event.description ? [`DESCRIPTION:${escapeIcsText(event.description)}`] : []),
    ...(event.location ? [`LOCATION:${escapeIcsText(event.location)}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${(event.title || "appointment").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
