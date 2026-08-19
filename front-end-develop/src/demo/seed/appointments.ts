import {
  DemoAccount,
  DemoApplicant,
  DemoApplication,
  DemoAppointment,
  DemoAppointmentStatus,
  DemoCenter,
} from "../types";
import { isoDaysFromNow, nextId, pick } from "./fixtures";

const APPOINTMENT_COUNT = 10;

const STATUS_CYCLE: DemoAppointmentStatus[] = [
  "scheduled",
  "scheduled",
  "completed",
  "completed",
  "cancelled",
  "transferred",
  "scheduled",
  "completed",
  "scheduled",
  "transferred",
];

export const seedAppointments = (
  applications: DemoApplication[],
  applicants: DemoApplicant[],
  centers: DemoCenter[],
  accounts: DemoAccount[]
): DemoAppointment[] => {
  const officers = accounts.filter((a) => a.role === "enrolment_officer");
  const candidates = applications.filter(
    (a) => a.type === "digitalIdentityPreEnrolment"
  );

  return Array.from({ length: APPOINTMENT_COUNT }, (_, i) => {
    const application = pick(candidates.length ? candidates : applications, i);
    const applicant = applicants.find((a) => a.id === application.applicantId);
    const center = centers.find((c) => c.id === application.centerId) || centers[0];
    const officer = pick(officers.length ? officers : accounts, i);
    const status = STATUS_CYCLE[i];
    const dayOffset = i - 4;

    return {
      id: nextId("APPT"),
      applicationId: application.id,
      applicantName: applicant
        ? `${applicant.firstName} ${applicant.lastName}`
        : "Demo Applicant",
      date: isoDaysFromNow(dayOffset).slice(0, 10),
      time: `${9 + (i % 7)}:00`,
      centerId: center.id,
      officerId: officer.id,
      status,
      transferHistory:
        status === "transferred"
          ? [
              {
                fromCenterId: centers[0].id,
                toCenterId: center.id,
                at: isoDaysFromNow(dayOffset - 3),
              },
            ]
          : [],
    };
  });
};
