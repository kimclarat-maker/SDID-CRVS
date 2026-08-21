import { BirthNotification } from "@/domain/crvs/types";
import { isoDaysAgo } from "./fixtures";
import { DEMO_FACILITY_ID, DEMO_FACILITY_NAME, NOTIFIER_DEMO_ID, NOTIFIER_DEMO_NAME } from "./crvsAccounts";

const base = (
  overrides: Partial<BirthNotification> & Pick<BirthNotification, "id" | "reference" | "status">
): BirthNotification => ({
  facilityId: DEMO_FACILITY_ID,
  facilityName: DEMO_FACILITY_NAME,
  occurrenceType: "FACILITY",
  child: {
    firstName: "Baby",
    lastName: "Uwase",
    sex: "FEMALE",
    dateOfBirth: isoDaysAgo(9),
    timeOfBirth: "08:15",
    placeOfBirth: DEMO_FACILITY_NAME,
    multipleBirth: { isMultiple: false },
  },
  mother: {
    firstName: "Aline",
    lastName: "Uwase",
    documentType: "NATIONAL_ID",
    documentNumber: "DEMO-ID-000101",
    nationality: "Demo Republic",
    phone: "+000 555 0110",
    residence: "Riverside, Demo District",
    verification: "NOT_VERIFIED",
  },
  father: { availability: "NOT_DECLARED" },
  notifierId: NOTIFIER_DEMO_ID,
  notifierName: NOTIFIER_DEMO_NAME,
  createdAt: isoDaysAgo(9),
  updatedAt: isoDaysAgo(9),
  statusHistory: [{ status: "DRAFT", at: isoDaysAgo(9), by: NOTIFIER_DEMO_NAME }],
  version: 1,
  ...overrides,
});

export const seedCrvsNotifications = (): BirthNotification[] => [
  base({
    id: "BN-1",
    reference: "BN-DEMO-2026-0001",
    status: "DRAFT",
    child: {
      firstName: undefined,
      lastName: "Habimana",
      sex: "MALE",
      dateOfBirth: isoDaysAgo(2),
      placeOfBirth: DEMO_FACILITY_NAME,
      multipleBirth: { isMultiple: false },
    },
    mother: {
      firstName: "Divine",
      lastName: "Habimana",
      documentType: "NATIONAL_ID",
      documentNumber: "DEMO-ID-000102",
      nationality: "Demo Republic",
      residence: "Hillcrest, Demo District",
      verification: "NOT_VERIFIED",
    },
  }),
  base({
    id: "BN-2",
    reference: "BN-DEMO-2026-0002",
    status: "SUBMITTED",
    submittedAt: isoDaysAgo(5),
    child: { firstName: "Jabo", lastName: "Mugisha", sex: "MALE", dateOfBirth: isoDaysAgo(10), placeOfBirth: DEMO_FACILITY_NAME, multipleBirth: { isMultiple: false } },
    statusHistory: [
      { status: "DRAFT", at: isoDaysAgo(6), by: NOTIFIER_DEMO_NAME },
      { status: "SUBMITTED", at: isoDaysAgo(5), by: NOTIFIER_DEMO_NAME },
    ],
  }),
  base({
    id: "BN-3",
    reference: "BN-DEMO-2026-0003",
    status: "RETURNED",
    submittedAt: isoDaysAgo(8),
    returnedAt: isoDaysAgo(7),
    returnReason: {
      reason: "Missing information",
      fields: ["Mother's document number"],
      note: "Please confirm the mother's national ID number before we can accept this notification.",
    },
    child: { firstName: "Eric", lastName: "Niyonsaba", sex: "MALE", dateOfBirth: isoDaysAgo(16), placeOfBirth: "Demo Referral Hospital", multipleBirth: { isMultiple: false } },
    mother: {
      firstName: "Solange",
      lastName: "Niyonsaba",
      documentType: "NATIONAL_ID",
      documentNumber: undefined,
      nationality: "Demo Republic",
      verification: "NOT_VERIFIED",
    },
    statusHistory: [
      { status: "DRAFT", at: isoDaysAgo(9), by: NOTIFIER_DEMO_NAME },
      { status: "SUBMITTED", at: isoDaysAgo(8), by: NOTIFIER_DEMO_NAME },
      { status: "RETURNED", at: isoDaysAgo(7), by: "CRVS Registration Officer", note: "Missing mother's document number." },
    ],
  }),
  base({
    id: "BN-4",
    reference: "BN-DEMO-2026-0004",
    status: "ACCEPTED",
    submittedAt: isoDaysAgo(6),
    acceptedAt: isoDaysAgo(5),
    acceptedBy: "CRVS Registration Officer",
    child: { firstName: "Alice", lastName: "Iradukunda", sex: "FEMALE", dateOfBirth: isoDaysAgo(11), placeOfBirth: DEMO_FACILITY_NAME, multipleBirth: { isMultiple: false } },
    statusHistory: [
      { status: "DRAFT", at: isoDaysAgo(7), by: NOTIFIER_DEMO_NAME },
      { status: "SUBMITTED", at: isoDaysAgo(6), by: NOTIFIER_DEMO_NAME },
      { status: "ACCEPTED", at: isoDaysAgo(5), by: "CRVS Registration Officer" },
    ],
  }),
  base({
    id: "BN-5",
    reference: "BN-DEMO-2026-0005",
    status: "ACCEPTED",
    submittedAt: isoDaysAgo(20),
    acceptedAt: isoDaysAgo(19),
    acceptedBy: "CRVS Registration Officer",
    convertedToRegistrationId: "BR-1",
    child: { firstName: "Claude", lastName: "Nshimiyimana", sex: "MALE", dateOfBirth: isoDaysAgo(25), placeOfBirth: DEMO_FACILITY_NAME, multipleBirth: { isMultiple: false } },
    statusHistory: [
      { status: "DRAFT", at: isoDaysAgo(21), by: NOTIFIER_DEMO_NAME },
      { status: "SUBMITTED", at: isoDaysAgo(20), by: NOTIFIER_DEMO_NAME },
      { status: "ACCEPTED", at: isoDaysAgo(19), by: "CRVS Registration Officer" },
    ],
  }),
  base({
    id: "BN-6",
    reference: "BN-DEMO-2026-0006",
    status: "CANCELLED",
    cancelledAt: isoDaysAgo(3),
    cancellationReason: "Duplicate draft created in error.",
    child: { lastName: "Draft entry", sex: "UNKNOWN", dateOfBirth: isoDaysAgo(3), placeOfBirth: DEMO_FACILITY_NAME, multipleBirth: { isMultiple: false } },
    statusHistory: [
      { status: "DRAFT", at: isoDaysAgo(4), by: NOTIFIER_DEMO_NAME },
      { status: "CANCELLED", at: isoDaysAgo(3), by: NOTIFIER_DEMO_NAME, note: "Duplicate draft created in error." },
    ],
  }),
];
