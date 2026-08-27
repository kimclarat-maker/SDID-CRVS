import { Route, Routes, Outlet } from "react-router-dom";
import CrvsSidebar from "./components/CrvsSidebar";
import CrvsHome from "./home";
import RequirePermission from "@/navigation/guards/RequirePermission";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";

// Birth notification (Birth Notification Officer)
import NotificationsDashboard from "./notifications";
import NewNotification from "./notifications/new";
import NotificationDrafts from "./notifications/drafts";
import NotificationSubmitted from "./notifications/submitted";
import NotificationReturned from "./notifications/returned";
import NotificationAccepted from "./notifications/accepted";
import NotificationDetails from "./notifications/details";
import EditNotification from "./notifications/edit";

// Birth registration (CRVS Registration Officer)
import Births from "./births";
import NewBirthRegistration from "./births/new";
import RegisterFromNotification from "./births/new/fromNotification";
import BirthRegistrationDrafts from "./births/drafts";
import BirthRegistrationSubmitted from "./births/submitted";
import BirthRegistrationCorrections from "./births/corrections";
import BirthRegistrationDetails from "./births/details";
import EditBirthRegistration from "./births/edit";
import CorrectBirthRegistration from "./births/correct";
import BirthRegistrationSubmissionSuccess from "./births/submissionSuccess";

// Civil Registrar review
import ReviewQueue from "./review";
import ReviewWorkspace from "./review/workspace";

// CRVS Supervisor exceptions
import Exceptions from "./exceptions";
import LateRegistrations from "./exceptions/lateRegistrations";
import ExceptionDuplicates from "./exceptions/duplicates";
import SyncFailures from "./exceptions/syncFailures";
import ExceptionCaseDetails from "./exceptions/details";
import Reports from "./reports";
import Audit from "./audit";

// Registered births
import RegisteredBirths from "./registeredBirths";
import RegisteredBirthDetails from "./registeredBirths/details";
import SdidStatus from "./registeredBirths/sdidStatus";

// Death notifications (Death Notification Officer)
import DeathNotificationsDashboard from "./deathNotifications";
import NewDeathNotification from "./deathNotifications/new";
import DeathNotificationDetails from "./deathNotifications/details";
import EditDeathNotification from "./deathNotifications/edit";

// Death registrations (CRVS Registration Officer)
import DeathsDashboard from "./deaths";
import DeathRegistrationsQueue from "./deathRegistrations";
import NewDeathRegistration from "./deathRegistrations/new";
import DeathRegistrationDetails from "./deathRegistrations/details";
import EditDeathRegistration from "./deathRegistrations/edit";

// Civil Registrar death review
import DeathReviewQueue from "./deathReview";
import DeathReviewWorkspace from "./deathReview/workspace";

// CRVS Supervisor death exceptions
import DeathExceptions from "./deathExceptions";
import DeathDuplicates from "./deathExceptions/duplicates";
import DeathExceptionDetails from "./deathExceptions/details";
import DeathSyncFailures from "./deathSyncFailures";
import DeathAudit from "./deathAudit";

// Registered deaths
import RegisteredDeaths from "./registeredDeaths";
import RegisteredDeathDetails from "./registeredDeaths/details";
import SdidDeathStatus from "./registeredDeaths/sdidStatus";

// Marriage dashboard
import MarriagesDashboard from "./marriages";

// Marriage applications (CRVS Registration Officer)
import MarriageApplicationsQueue from "./marriageApplications";
import NewMarriageApplication from "./marriageApplications/new";
import MarriageApplicationDetails from "./marriageApplications/details";
import EditMarriageApplication from "./marriageApplications/edit";

// Civil Registrar marriage review
import MarriageReviewQueue from "./marriageReview";
import MarriageReviewWorkspace from "./marriageReview/workspace";

// Marriage corrections
import MarriageCorrectionsQueue from "./marriageCorrections";

// Marriage appointments
import MarriageAppointments from "./marriageAppointments";
import MarriageAppointmentCalendar from "./marriageAppointments/calendar";
import MarriageAppointmentDetails from "./marriageAppointments/details";

// Marriage ceremonies
import MarriageCeremonies from "./marriageCeremonies";
import MarriageCeremonyWorkspace from "./marriageCeremonies/workspace";

// Marriage objections
import MarriageObjectionsQueue from "./marriageObjections";
import MarriageObjectionDetails from "./marriageObjections/details";

// CRVS Supervisor marriage exceptions
import MarriageExceptions from "./marriageExceptions";
import MarriageExceptionDetails from "./marriageExceptions/details";
import MarriageSyncFailures from "./marriageSyncFailures";
import MarriageAudit from "./marriageAudit";

// Registered marriages
import RegisteredMarriages from "./registeredMarriages";
import RegisteredMarriageDetails from "./registeredMarriages/details";
import SdidMarriageStatus from "./registeredMarriages/sdidStatus";

// Divorce dashboard
import DivorcesDashboard from "./divorces";

// Divorce notifications (simulated court integration)
import DivorceNotificationsQueue from "./divorceNotifications";
import DivorceNotificationDetails from "./divorceNotifications/details";

// Divorce registrations (Divorce Registration Officer)
import DivorceRegistrationsQueue from "./divorceRegistrations";
import NewDivorceRegistration from "./divorceRegistrations/new";
import EditDivorceRegistration from "./divorceRegistrations/edit";
import DivorceRegistrationDetails from "./divorceRegistrations/details";

// Civil Registrar divorce review
import DivorceReviewQueue from "./divorceReview";
import DivorceReviewWorkspace from "./divorceReview/workspace";

// Divorce corrections
import DivorceCorrectionsQueue from "./divorceCorrections";

// CRVS Supervisor divorce exceptions
import DivorceExceptionsQueue from "./divorceExceptions";
import DivorceExceptionDetails from "./divorceExceptions/details";

// Foreign-divorce recognition review
import ForeignDivorcesQueue from "./foreignDivorces";
import ForeignDivorceDetails from "./foreignDivorces/details";

import DivorceSyncFailures from "./divorceSyncFailures";
import DivorceAudit from "./divorceAudit";

// Registered divorces
import RegisteredDivorces from "./registeredDivorces";
import RegisteredDivorceDetails from "./registeredDivorces/details";

// Birth-certificate lifecycle
import CertificatesDashboard from "./certificates";
import NewAssistedCertificateRequest from "./certificates/new";
import CertificateRequestsPage from "./certificates/requests";
import CertificateRequestDetails from "./certificates/requests/details";
import CertificateReviewWorkspace from "./certificates/review";
import IssuedCertificatesList from "./certificates/issued/list";
import IssuedCertificateDetails from "./certificates/issued";
import IssuedCertificateAudit from "./certificates/issued/audit";
import RevokedCertificates from "./certificates/revoked";
import CertificateConfiguration from "./certificates/configuration";

/**
 * CRVS workspace shell — mirrors screens/dashboard/admin/index.tsx's own
 * pattern (own sidebar + nested Routes sharing the dashboard-shell/
 * dashboard-main CSS), rather than introducing a second shell paradigm.
 * Mounted at /dashboard/crvs/* and already wrapped in
 * RequireWorkspace(workspace="CRVS") by screens/dashboard/index.tsx — each
 * sub-route below adds its own finer-grained permission check so a hidden
 * sidebar entry is never the only thing protecting it.
 */
export default function Crvs() {
  return (
    <div className="dashboard-shell">
      <CrvsSidebar />
      <main className="dashboard-main">
        <Routes>
          <Route path="/" element={<CrvsHome />} />

          {/* Birth notifications */}
          <Route
            path="/notifications"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.BIRTH_NOTIFICATION_VIEW}>
                <NotificationsDashboard />
              </RequirePermission>
            }
          />
          <Route
            path="/notifications/new"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.BIRTH_NOTIFICATION_CREATE}>
                <NewNotification />
              </RequirePermission>
            }
          />
          <Route
            path="/notifications/drafts"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.BIRTH_NOTIFICATION_VIEW}>
                <NotificationDrafts />
              </RequirePermission>
            }
          />
          <Route
            path="/notifications/submitted"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.BIRTH_NOTIFICATION_VIEW}>
                <NotificationSubmitted />
              </RequirePermission>
            }
          />
          <Route
            path="/notifications/returned"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.BIRTH_NOTIFICATION_VIEW}>
                <NotificationReturned />
              </RequirePermission>
            }
          />
          <Route
            path="/notifications/accepted"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.BIRTH_NOTIFICATION_VIEW}>
                <NotificationAccepted />
              </RequirePermission>
            }
          />
          <Route
            path="/notifications/:notificationId/edit"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.BIRTH_NOTIFICATION_EDIT}>
                <EditNotification />
              </RequirePermission>
            }
          />
          <Route
            path="/notifications/:notificationId"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.BIRTH_NOTIFICATION_VIEW}>
                <NotificationDetails />
              </RequirePermission>
            }
          />

          {/* Birth registrations */}
          <Route
            path="/births"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.REGISTRATION_VIEW}>
                <Births />
              </RequirePermission>
            }
          />
          <Route
            path="/births/new"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.BIRTH_DRAFT_CREATE}>
                <NewBirthRegistration />
              </RequirePermission>
            }
          />
          <Route
            path="/births/new/from-notification/:notificationId"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.REGISTRATION_CONVERT}>
                <RegisterFromNotification />
              </RequirePermission>
            }
          />
          <Route
            path="/births/drafts"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.BIRTH_DRAFT_EDIT}>
                <BirthRegistrationDrafts />
              </RequirePermission>
            }
          />
          <Route
            path="/births/submitted"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.REGISTRATION_VIEW}>
                <BirthRegistrationSubmitted />
              </RequirePermission>
            }
          />
          <Route
            path="/births/corrections"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.CORRECTION_RESPOND}>
                <BirthRegistrationCorrections />
              </RequirePermission>
            }
          />
          <Route
            path="/births/:caseId/edit"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.BIRTH_DRAFT_EDIT}>
                <EditBirthRegistration />
              </RequirePermission>
            }
          />
          <Route
            path="/births/:caseId/correct"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.CORRECTION_RESPOND}>
                <CorrectBirthRegistration />
              </RequirePermission>
            }
          />
          <Route
            path="/births/:caseId/submission-success"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.REGISTRATION_VIEW}>
                <BirthRegistrationSubmissionSuccess />
              </RequirePermission>
            }
          />
          <Route
            path="/births/:caseId"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.REGISTRATION_VIEW}>
                <BirthRegistrationDetails />
              </RequirePermission>
            }
          />

          {/* Civil Registrar review — the four filtered-view URLs from spec
              §3 (unassigned/my-reviews/resubmitted/duplicates) all resolve
              to the same tabbed queue component; deep-linking straight to a
              specific tab is a follow-up, not a routing gap. */}
          {["/review", "/review/unassigned", "/review/my-reviews", "/review/resubmitted", "/review/duplicates"].map(
            (path) => (
              <Route
                key={path}
                path={path}
                element={
                  <RequirePermission
                    workspace="CRVS"
                    permission={[CRVS_PERMISSIONS.EVIDENCE_REVIEW, CRVS_PERMISSIONS.REGISTRATION_APPROVE]}
                  >
                    <ReviewQueue />
                  </RequirePermission>
                }
              />
            )
          )}
          <Route
            path="/review/:caseId/decision"
            element={
              <RequirePermission
                workspace="CRVS"
                permission={[CRVS_PERMISSIONS.EVIDENCE_REVIEW, CRVS_PERMISSIONS.REGISTRATION_APPROVE]}
              >
                <ReviewWorkspace />
              </RequirePermission>
            }
          />
          <Route
            path="/review/:caseId"
            element={
              <RequirePermission
                workspace="CRVS"
                permission={[CRVS_PERMISSIONS.EVIDENCE_REVIEW, CRVS_PERMISSIONS.REGISTRATION_APPROVE]}
              >
                <ReviewWorkspace />
              </RequirePermission>
            }
          />

          {/* CRVS Supervisor exceptions */}
          <Route
            path="/exceptions"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.EXCEPTIONS_VIEW}>
                <Exceptions />
              </RequirePermission>
            }
          />
          <Route
            path="/exceptions/late-registrations"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.LATE_REGISTRATION_REVIEW}>
                <LateRegistrations />
              </RequirePermission>
            }
          />
          <Route
            path="/exceptions/duplicates"
            element={
              // Matches the permission ExceptionDuplicates itself checks
              // internally — a route guard broader than the page's own gate
              // would let a EXCEPTIONS_VIEW-only user navigate here only to
              // be turned away by the page, which is a worse experience
              // than being redirected to the shared access-denied screen.
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.DUPLICATE_CHECK_RESOLVE}>
                <ExceptionDuplicates />
              </RequirePermission>
            }
          />
          <Route
            path="/exceptions/sync-failures"
            element={
              // Matches SyncFailures' own internal permission check (see
              // note above).
              <RequirePermission
                workspace="CRVS"
                permission={[CRVS_PERMISSIONS.SYNC_RETRY, CRVS_PERMISSIONS.SYNC_MANUAL_REVIEW]}
              >
                <SyncFailures />
              </RequirePermission>
            }
          />
          <Route
            path="/exceptions/:caseId"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.EXCEPTIONS_VIEW}>
                <ExceptionCaseDetails />
              </RequirePermission>
            }
          />
          <Route
            path="/reports"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.ANALYTICS_VIEW}>
                <Reports />
              </RequirePermission>
            }
          />
          <Route
            path="/audit"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.AUDIT_VIEW}>
                <Audit />
              </RequirePermission>
            }
          />

          {/* Registered births */}
          <Route
            path="/registered-births"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.REGISTERED_VIEW}>
                <RegisteredBirths />
              </RequirePermission>
            }
          />
          <Route
            path="/registered-births/:caseId/sdid-status"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.REGISTERED_VIEW}>
                <SdidStatus />
              </RequirePermission>
            }
          />
          <Route
            path="/registered-births/:caseId"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.REGISTERED_VIEW}>
                <RegisteredBirthDetails />
              </RequirePermission>
            }
          />

          {/* Birth-certificate lifecycle */}
          <Route
            path="/certificates"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.CERTIFICATE_DASHBOARD_VIEW}>
                <CertificatesDashboard />
              </RequirePermission>
            }
          />
          <Route
            path="/certificates/new"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.CERTIFICATE_REQUEST_ASSIST}>
                <NewAssistedCertificateRequest />
              </RequirePermission>
            }
          />
          {["/certificates/requests", "/certificates/manual-review", "/certificates/payment-pending", "/certificates/delivery-failures"].map(
            (path) => (
              <Route
                key={path}
                path={path}
                element={
                  <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.CERTIFICATE_REQUEST_VIEW}>
                    <CertificateRequestsPage />
                  </RequirePermission>
                }
              />
            )
          )}
          <Route
            path="/certificates/requests/:requestId"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.CERTIFICATE_REQUEST_VIEW}>
                <CertificateRequestDetails />
              </RequirePermission>
            }
          />
          <Route
            path="/certificates/review/:requestId"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.CERTIFICATE_REVIEW_VIEW}>
                <CertificateReviewWorkspace />
              </RequirePermission>
            }
          />
          <Route
            path="/certificates/issued"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.CERTIFICATE_REQUEST_VIEW}>
                <IssuedCertificatesList />
              </RequirePermission>
            }
          />
          <Route
            path="/certificates/issued/:certificateId/audit"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.CERTIFICATE_AUDIT_VIEW}>
                <IssuedCertificateAudit />
              </RequirePermission>
            }
          />
          <Route
            path="/certificates/issued/:certificateId"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.CERTIFICATE_REQUEST_VIEW}>
                <IssuedCertificateDetails />
              </RequirePermission>
            }
          />
          <Route
            path="/certificates/revoked"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.CERTIFICATE_REQUEST_VIEW}>
                <RevokedCertificates />
              </RequirePermission>
            }
          />
          <Route
            path="/certificates/configuration"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.CERTIFICATE_CONFIGURATION_MANAGE}>
                <CertificateConfiguration />
              </RequirePermission>
            }
          />

          {/* Death dashboard */}
          <Route
            path="/deaths"
            element={
              <RequirePermission
                workspace="CRVS"
                permission={[CRVS_PERMISSIONS.DEATH_NOTIFICATION_VIEW, CRVS_PERMISSIONS.DEATH_REGISTRATION_VIEW]}
              >
                <DeathsDashboard />
              </RequirePermission>
            }
          />

          {/* Death notifications */}
          <Route
            path="/death-notifications"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.DEATH_NOTIFICATION_VIEW}>
                <DeathNotificationsDashboard />
              </RequirePermission>
            }
          />
          <Route
            path="/death-notifications/new"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.DEATH_NOTIFICATION_CREATE}>
                <NewDeathNotification />
              </RequirePermission>
            }
          />
          <Route
            path="/death-notifications/:notificationId/edit"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.DEATH_NOTIFICATION_EDIT}>
                <EditDeathNotification />
              </RequirePermission>
            }
          />
          <Route
            path="/death-notifications/:notificationId"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.DEATH_NOTIFICATION_VIEW}>
                <DeathNotificationDetails />
              </RequirePermission>
            }
          />

          {/* Death registrations */}
          <Route
            path="/death-registrations"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.DEATH_REGISTRATION_VIEW}>
                <DeathRegistrationsQueue />
              </RequirePermission>
            }
          />
          <Route
            path="/death-registrations/new"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.DEATH_DRAFT_CREATE}>
                <NewDeathRegistration />
              </RequirePermission>
            }
          />
          <Route
            path="/death-registrations/:caseId/edit"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.DEATH_DRAFT_EDIT}>
                <EditDeathRegistration />
              </RequirePermission>
            }
          />
          <Route
            path="/death-registrations/:caseId"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.DEATH_REGISTRATION_VIEW}>
                <DeathRegistrationDetails />
              </RequirePermission>
            }
          />

          {/* Civil Registrar death review */}
          <Route
            path="/death-review"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.DEATH_REGISTRATION_REVIEW}>
                <DeathReviewQueue />
              </RequirePermission>
            }
          />
          <Route
            path="/death-review/:caseId/decision"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.DEATH_REGISTRATION_REVIEW}>
                <DeathReviewWorkspace />
              </RequirePermission>
            }
          />
          <Route
            path="/death-review/:caseId"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.DEATH_REGISTRATION_REVIEW}>
                <DeathReviewWorkspace />
              </RequirePermission>
            }
          />

          {/* CRVS Supervisor death exceptions */}
          <Route
            path="/death-exceptions"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.DEATH_EXCEPTIONS_VIEW}>
                <DeathExceptions />
              </RequirePermission>
            }
          />
          <Route
            path="/death-exceptions/duplicates"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.DEATH_DUPLICATE_RESOLVE}>
                <DeathDuplicates />
              </RequirePermission>
            }
          />
          <Route
            path="/death-exceptions/:caseId"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.DEATH_EXCEPTIONS_VIEW}>
                <DeathExceptionDetails />
              </RequirePermission>
            }
          />
          <Route
            path="/death-sync-failures"
            element={
              <RequirePermission
                workspace="CRVS"
                permission={[CRVS_PERMISSIONS.DEATH_SDID_SYNC_RETRY, CRVS_PERMISSIONS.DEATH_SDID_SYNC_VIEW]}
              >
                <DeathSyncFailures />
              </RequirePermission>
            }
          />
          <Route
            path="/death-audit"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.DEATH_AUDIT_VIEW}>
                <DeathAudit />
              </RequirePermission>
            }
          />

          {/* Registered deaths */}
          <Route
            path="/registered-deaths"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.DEATH_REGISTRATION_VIEW}>
                <RegisteredDeaths />
              </RequirePermission>
            }
          />
          <Route
            path="/registered-deaths/:caseId/sdid-status"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.DEATH_REGISTRATION_VIEW}>
                <SdidDeathStatus />
              </RequirePermission>
            }
          />
          <Route
            path="/registered-deaths/:caseId"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.DEATH_REGISTRATION_VIEW}>
                <RegisteredDeathDetails />
              </RequirePermission>
            }
          />

          {/* Marriage dashboard */}
          <Route
            path="/marriages"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.MARRIAGE_APPLICATION_VIEW}>
                <MarriagesDashboard />
              </RequirePermission>
            }
          />

          {/* Marriage applications */}
          <Route
            path="/marriage-applications"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.MARRIAGE_APPLICATION_VIEW}>
                <MarriageApplicationsQueue />
              </RequirePermission>
            }
          />
          <Route
            path="/marriage-applications/new"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.MARRIAGE_APPLICATION_CREATE}>
                <NewMarriageApplication />
              </RequirePermission>
            }
          />
          <Route
            path="/marriage-applications/:id/edit"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.MARRIAGE_APPLICATION_EDIT}>
                <EditMarriageApplication />
              </RequirePermission>
            }
          />
          <Route
            path="/marriage-applications/:id"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.MARRIAGE_APPLICATION_VIEW}>
                <MarriageApplicationDetails />
              </RequirePermission>
            }
          />

          {/* Civil Registrar marriage review */}
          <Route
            path="/marriage-review"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.MARRIAGE_APPLICATION_REVIEW}>
                <MarriageReviewQueue />
              </RequirePermission>
            }
          />
          <Route
            path="/marriage-review/:caseId/decision"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.MARRIAGE_APPLICATION_REVIEW}>
                <MarriageReviewWorkspace />
              </RequirePermission>
            }
          />
          <Route
            path="/marriage-review/:caseId"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.MARRIAGE_APPLICATION_REVIEW}>
                <MarriageReviewWorkspace />
              </RequirePermission>
            }
          />

          {/* Marriage corrections */}
          <Route
            path="/marriage-corrections"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.MARRIAGE_CORRECTION_REQUEST}>
                <MarriageCorrectionsQueue />
              </RequirePermission>
            }
          />

          {/* Marriage appointments */}
          <Route
            path="/marriage-appointments"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.MARRIAGE_APPOINTMENT_VIEW}>
                <MarriageAppointments />
              </RequirePermission>
            }
          />
          <Route
            path="/marriage-appointments/calendar"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.MARRIAGE_APPOINTMENT_VIEW}>
                <MarriageAppointmentCalendar />
              </RequirePermission>
            }
          />
          <Route
            path="/marriage-appointments/:id"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.MARRIAGE_APPOINTMENT_VIEW}>
                <MarriageAppointmentDetails />
              </RequirePermission>
            }
          />

          {/* Marriage ceremonies */}
          <Route
            path="/marriage-ceremonies"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.MARRIAGE_CEREMONY_VIEW}>
                <MarriageCeremonies />
              </RequirePermission>
            }
          />
          <Route
            path="/marriage-ceremonies/:id"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.MARRIAGE_CEREMONY_VIEW}>
                <MarriageCeremonyWorkspace />
              </RequirePermission>
            }
          />

          {/* Marriage objections */}
          <Route
            path="/marriage-objections"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.MARRIAGE_OBJECTIONS_VIEW}>
                <MarriageObjectionsQueue />
              </RequirePermission>
            }
          />
          <Route
            path="/marriage-objections/:id"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.MARRIAGE_OBJECTIONS_VIEW}>
                <MarriageObjectionDetails />
              </RequirePermission>
            }
          />

          {/* CRVS Supervisor marriage exceptions */}
          <Route
            path="/marriage-exceptions"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.MARRIAGE_EXCEPTIONS_VIEW}>
                <MarriageExceptions />
              </RequirePermission>
            }
          />
          <Route
            path="/marriage-exceptions/:id"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.MARRIAGE_EXCEPTIONS_VIEW}>
                <MarriageExceptionDetails />
              </RequirePermission>
            }
          />
          <Route
            path="/marriage-sync-failures"
            element={
              <RequirePermission
                workspace="CRVS"
                permission={[CRVS_PERMISSIONS.MARRIAGE_SDID_SYNC_RETRY, CRVS_PERMISSIONS.MARRIAGE_SDID_SYNC_VIEW]}
              >
                <MarriageSyncFailures />
              </RequirePermission>
            }
          />
          <Route
            path="/marriage-audit"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.MARRIAGE_AUDIT_VIEW}>
                <MarriageAudit />
              </RequirePermission>
            }
          />

          {/* Registered marriages */}
          <Route
            path="/registered-marriages"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.MARRIAGE_REGISTERED_VIEW}>
                <RegisteredMarriages />
              </RequirePermission>
            }
          />
          <Route
            path="/registered-marriages/:id/sdid-status"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.MARRIAGE_REGISTERED_VIEW}>
                <SdidMarriageStatus />
              </RequirePermission>
            }
          />
          <Route
            path="/registered-marriages/:id"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.MARRIAGE_REGISTERED_VIEW}>
                <RegisteredMarriageDetails />
              </RequirePermission>
            }
          />

          {/* Divorce dashboard */}
          <Route
            path="/divorces"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.DIVORCE_REGISTRATION_VIEW}>
                <DivorcesDashboard />
              </RequirePermission>
            }
          />

          {/* Divorce notifications (simulated court integration) */}
          <Route
            path="/divorce-notifications"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.DIVORCE_NOTIFICATION_VIEW}>
                <DivorceNotificationsQueue />
              </RequirePermission>
            }
          />
          <Route
            path="/divorce-notifications/:id"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.DIVORCE_NOTIFICATION_VIEW}>
                <DivorceNotificationDetails />
              </RequirePermission>
            }
          />

          {/* Divorce registrations */}
          <Route
            path="/divorce-registrations"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.DIVORCE_REGISTRATION_VIEW}>
                <DivorceRegistrationsQueue />
              </RequirePermission>
            }
          />
          <Route
            path="/divorce-registrations/new"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.DIVORCE_REGISTRATION_CREATE}>
                <NewDivorceRegistration />
              </RequirePermission>
            }
          />
          <Route
            path="/divorce-registrations/:id/edit"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.DIVORCE_REGISTRATION_EDIT}>
                <EditDivorceRegistration />
              </RequirePermission>
            }
          />
          <Route
            path="/divorce-registrations/:id"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.DIVORCE_REGISTRATION_VIEW}>
                <DivorceRegistrationDetails />
              </RequirePermission>
            }
          />

          {/* Civil Registrar divorce review */}
          <Route
            path="/divorce-review"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.DIVORCE_REGISTRATION_REVIEW}>
                <DivorceReviewQueue />
              </RequirePermission>
            }
          />
          <Route
            path="/divorce-review/:caseId"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.DIVORCE_REGISTRATION_REVIEW}>
                <DivorceReviewWorkspace />
              </RequirePermission>
            }
          />

          {/* Divorce corrections */}
          <Route
            path="/divorce-corrections"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.DIVORCE_CORRECTION_REQUEST}>
                <DivorceCorrectionsQueue />
              </RequirePermission>
            }
          />

          {/* CRVS Supervisor divorce exceptions */}
          <Route
            path="/divorce-exceptions"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.DIVORCE_EXCEPTIONS_VIEW}>
                <DivorceExceptionsQueue />
              </RequirePermission>
            }
          />
          <Route
            path="/divorce-exceptions/:id"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.DIVORCE_EXCEPTIONS_VIEW}>
                <DivorceExceptionDetails />
              </RequirePermission>
            }
          />

          {/* Foreign-divorce recognition review */}
          <Route
            path="/foreign-divorces"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.DIVORCE_FOREIGN_JUDGMENT_REVIEW}>
                <ForeignDivorcesQueue />
              </RequirePermission>
            }
          />
          <Route
            path="/foreign-divorces/:id"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.DIVORCE_FOREIGN_JUDGMENT_REVIEW}>
                <ForeignDivorceDetails />
              </RequirePermission>
            }
          />

          <Route
            path="/divorce-sync-failures"
            element={
              <RequirePermission
                workspace="CRVS"
                permission={[CRVS_PERMISSIONS.DIVORCE_SDID_SYNC_RETRY, CRVS_PERMISSIONS.DIVORCE_SDID_SYNC_VIEW]}
              >
                <DivorceSyncFailures />
              </RequirePermission>
            }
          />
          <Route
            path="/divorce-audit"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.DIVORCE_AUDIT_VIEW}>
                <DivorceAudit />
              </RequirePermission>
            }
          />

          {/* Registered divorces */}
          <Route
            path="/registered-divorces"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.DIVORCE_REGISTERED_VIEW}>
                <RegisteredDivorces />
              </RequirePermission>
            }
          />
          <Route
            path="/registered-divorces/:id"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.DIVORCE_REGISTERED_VIEW}>
                <RegisteredDivorceDetails />
              </RequirePermission>
            }
          />
        </Routes>
        <Outlet />
      </main>
    </div>
  );
}
