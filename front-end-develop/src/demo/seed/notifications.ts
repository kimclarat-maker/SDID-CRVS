import { DemoNotification, DemoRole } from "../types";
import { isoDaysAgo, nextId } from "./fixtures";

const TEMPLATES: { title: string; message: string; targetRole?: DemoRole }[] = [
  {
    title: "New application submitted",
    message: "A pre-enrolment application was submitted for review.",
    targetRole: "reviewer",
  },
  {
    title: "Application approved",
    message: "Application APP-DEMO-2026-0004 was approved.",
  },
  {
    title: "Exception flagged",
    message: "An application was flagged for a biometric quality exception.",
    targetRole: "supervisor",
  },
  {
    title: "Appointment reminder",
    message: "You have 3 appointments scheduled for today.",
    targetRole: "enrolment_officer",
  },
  {
    title: "Device maintenance due",
    message: "A signature pad at Central Registration Centre needs maintenance.",
    targetRole: "administrator",
  },
  {
    title: "Offline sync completed",
    message: "12 offline applications synchronised successfully.",
  },
  {
    title: "Correction requested",
    message: "A reviewer requested corrections on a submitted application.",
    targetRole: "enrolment_officer",
  },
  {
    title: "New staff account created",
    message: "A new enrolment officer account was created at Riverside Service Centre.",
    targetRole: "administrator",
  },
  {
    title: "Appointment transferred",
    message: "An appointment was transferred to Fairview District Office.",
  },
  {
    title: "Monthly report ready",
    message: "The monthly processing summary is ready to view.",
    targetRole: "supervisor",
  },
  {
    title: "Rollback recorded",
    message: "An application status was rolled back for further review.",
  },
  {
    title: "Sync retry needed",
    message: "One offline application failed to synchronise and needs a retry.",
    targetRole: "administrator",
  },
];

export const seedNotifications = (): DemoNotification[] =>
  TEMPLATES.map((t, i) => ({
    id: nextId("NOTIF"),
    title: t.title,
    message: t.message,
    read: i % 3 === 0,
    createdAt: isoDaysAgo(i),
    targetRole: t.targetRole,
  }));
