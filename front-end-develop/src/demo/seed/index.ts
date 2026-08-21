import { DEMO_DATA_VERSION } from "../config";
import { DemoDatabase } from "../types";
import { seedAccounts } from "./accounts";
import { seedAnalytics } from "./analytics";
import { seedApplicants } from "./applicants";
import { seedApplications } from "./applications";
import { seedAppointments } from "./appointments";
import { seedAuditEvents } from "./auditEvents";
import { seedCenters } from "./centers";
import { seedDevices } from "./devices";
import { seedNotifications } from "./notifications";
import { seedCrvsNotifications } from "./crvsNotifications";
import { seedCrvsRegistrations, seedCrvsFoundationalIdentities } from "./crvsRegistrations";

export const buildDemoDatabase = (): DemoDatabase => {
  const centers = seedCenters();
  const devices = seedDevices(centers);
  const accounts = seedAccounts(centers);
  const applicants = seedApplicants();
  const applications = seedApplications(applicants, centers, accounts);
  const appointments = seedAppointments(
    applications,
    applicants,
    centers,
    accounts
  );
  const notifications = seedNotifications();
  const auditEvents = seedAuditEvents(applications, accounts);
  const analytics = seedAnalytics();
  const crvsNotifications = seedCrvsNotifications();
  const crvsRegistrations = seedCrvsRegistrations();
  const crvsFoundationalIdentities = seedCrvsFoundationalIdentities();

  return {
    version: DEMO_DATA_VERSION,
    accounts,
    centers,
    devices,
    applicants,
    applications,
    appointments,
    notifications,
    auditEvents,
    analytics,
    crvsNotifications,
    crvsRegistrations,
    crvsFoundationalIdentities,
  };
};
