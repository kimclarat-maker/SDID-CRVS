import { DemoApplicant } from "../types";
import {
  FIRST_NAMES,
  LAST_NAMES,
  REGIONS,
  demoEmail,
  demoPhoneNumber,
  nextId,
  pick,
} from "./fixtures";

const APPLICANT_COUNT = 20;

export const seedApplicants = (): DemoApplicant[] =>
  Array.from({ length: APPLICANT_COUNT }, (_, i) => {
    const firstName = pick(FIRST_NAMES, i);
    const lastName = pick(LAST_NAMES, i + 7);
    const place = pick(REGIONS, i);
    const age = 1 + ((i * 7) % 78);
    const dob = new Date();
    dob.setFullYear(dob.getFullYear() - age, i % 12, 1 + (i % 27));

    return {
      id: nextId("APPLICANT"),
      identityNumber: `DEMO-ID-${(i + 1).toString().padStart(6, "0")}`,
      firstName,
      lastName,
      dob: dob.toISOString(),
      gender: i % 2 === 0 ? "female" : "male",
      citizenshipStatus:
        i % 9 === 0 ? "refugee" : i % 5 === 0 ? "resident" : "citizen",
      phoneNumber: demoPhoneNumber(i),
      email: demoEmail(firstName, lastName, i),
      region: place.region,
      district: place.district,
      localArea: place.localArea,
    };
  });
