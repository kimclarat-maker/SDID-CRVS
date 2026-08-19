import { demoCredentials } from "../credentials";
import { DemoAccount, DemoCenter, DemoRole } from "../types";
import { demoPhoneNumber, isoDaysAgo, nextId } from "./fixtures";

const EXTRA_STAFF: { role: DemoRole; firstName: string; lastName: string }[] =
  [
    { role: "enrolment_officer", firstName: "Amara", lastName: "Bello" },
    { role: "enrolment_officer", firstName: "Kofi", lastName: "Dubois" },
    { role: "reviewer", firstName: "Lena", lastName: "Mensah" },
    { role: "reviewer", firstName: "Tariq", lastName: "Okoye" },
];

export const seedAccounts = (centers: DemoCenter[]): DemoAccount[] => {
  const fromCredentials: DemoAccount[] = demoCredentials.map((cred, i) => {
    const [firstName, lastName] = cred.roleLabel.split(" ");
    return {
      id: nextId("ACC"),
      firstName: firstName || cred.roleLabel,
      lastName: lastName || "Demo",
      email: cred.email,
      role: cred.role,
      centerId: centers[i % centers.length].id,
      status: "active",
      phoneNumber: demoPhoneNumber(i),
      createdAt: isoDaysAgo(360),
    };
  });

  const extra: DemoAccount[] = EXTRA_STAFF.map((staff, i) => ({
    id: nextId("ACC"),
    firstName: staff.firstName,
    lastName: staff.lastName,
    email: `${staff.firstName.toLowerCase()}.${staff.lastName.toLowerCase()}@demo.identity.local`,
    role: staff.role,
    centerId: centers[(i + 1) % centers.length].id,
    status: i === EXTRA_STAFF.length - 1 ? "inactive" : "active",
    phoneNumber: demoPhoneNumber(i + 10),
    createdAt: isoDaysAgo(300 - i * 20),
  }));

  return [...fromCredentials, ...extra];
};
