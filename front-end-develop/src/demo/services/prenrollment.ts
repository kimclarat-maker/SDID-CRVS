// Demo-mode backing for src/api/prenrollment (the admin/SDID "search by
// application number / National ID / prenrollment number" screen). Rather
// than inventing a new fixture, each of the 20 seeded db.applicants is
// projected onto the full production Prenrollment shape (using
// src/mocks/prenrollment.ts's records as a field-complete template so every
// nested section CitizenProfile renders — parent/spouse/address/etc. — has
// something to show), with only the searchable identity fields overridden
// per applicant so different search terms resolve to different people.
import prenrollmentTemplates from "@/mocks/prenrollment";
import { demoDelay } from "../config";
import { getDemoData } from "../storage/demoStore";
import { Prenrollment } from "@/types/Prenrollment";
import { DemoApplicant } from "../types";

const STATUS_CYCLE = ["PENDING", "APPROVED", "REJECTED"];

const buildDemoPrenrollment = (applicant: DemoApplicant, index: number): Prenrollment => {
  const template = prenrollmentTemplates[index % prenrollmentTemplates.length];
  const seq = (index + 1).toString().padStart(4, "0");

  return {
    ...template,
    _id: applicant.id,
    applicationNumber: `AP-DEMO-2026-${seq}`,
    preEnrollmentNumber: `PR-DEMO-2026-${seq}`,
    identifier: applicant.identityNumber,
    idNumber: applicant.identityNumber,
    firstName: applicant.firstName.toUpperCase(),
    middleName: null,
    lastName: applicant.lastName,
    gender: applicant.gender === "female" ? "FEMALE" : "MALE",
    maritalStatus: template.maritalStatus,
    phoneNumber: applicant.phoneNumber,
    email: applicant.email,
    dob: applicant.dob.slice(0, 10),
    province: applicant.region,
    district: applicant.district,
    village: applicant.localArea,
    citizenshipStatus: applicant.citizenshipStatus === "citizen" ? "NORMAL" : applicant.citizenshipStatus.toUpperCase(),
    status: STATUS_CYCLE[index % STATUS_CYCLE.length],
    enrollmentStatus: index % 3 === 1 ? "COMPLETED" : "PENDING",
    enrollmentNumber: index % 3 === 1 ? `EN-DEMO-2026-${seq}` : template.enrollmentNumber,
    fatherNames: template.fatherNames,
    motherNames: template.motherNames,
  } as unknown as Prenrollment;
};

export const demoListPrenrollmentRecords = (): Prenrollment[] => {
  const db = getDemoData();
  return db.applicants.map((a, i) => buildDemoPrenrollment(a, i));
};

// Matches the SearchCitizen screen's response-shape expectations: an exact
// single match comes back flat as `{ data: Prenrollment }` (checked via
// `data.data._id`); anything else (zero or multiple matches) comes back as
// `{ data: { data: Prenrollment[] } }`, which the screen treats as "show the
// picker" when non-empty or "no data found" when empty — never throws, since
// "nothing matched" is an expected, recoverable search outcome, not an error.
const respond = (matches: Prenrollment[]) =>
  demoDelay(matches.length === 1 ? { data: matches[0] } : { data: { data: matches } }, 400);

export const demoFetchPrenrollmentByIdentifier = async (identifier: string) => {
  const term = identifier.trim().toLowerCase();
  const records = demoListPrenrollmentRecords();
  const matches = records.filter(
    (r) =>
      r.identifier.toLowerCase() === term ||
      r.idNumber.toLowerCase() === term ||
      r.applicationNumber.toLowerCase() === term ||
      r.preEnrollmentNumber.toLowerCase() === term
  );
  return respond(matches);
};

export const demoFetchPrenrollmentByPrenrollmentNumber = async (prenrollmentNo: string) => {
  const term = prenrollmentNo.trim().toLowerCase();
  const records = demoListPrenrollmentRecords();
  const matches = records.filter((r) => r.preEnrollmentNumber.toLowerCase() === term);
  return respond(matches);
};

export const demoFetchPrenrollmentByDemographics = async (params: {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  fatherName?: string;
  motherName?: string;
}) => {
  const records = demoListPrenrollmentRecords();
  const matches = records.filter((r) => {
    if (params.firstName && !r.firstName.toLowerCase().includes(params.firstName.trim().toLowerCase())) return false;
    if (params.lastName && !r.lastName.toLowerCase().includes(params.lastName.trim().toLowerCase())) return false;
    if (params.dateOfBirth && r.dob !== params.dateOfBirth) return false;
    return true;
  });
  return respond(matches);
};
