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
import DeathExceptionDetails from "./deathExceptions/details";
import DeathSyncFailures from "./deathSyncFailures";
import DeathAudit from "./deathAudit";

// Registered deaths
import RegisteredDeaths from "./registeredDeaths";
import RegisteredDeathDetails from "./registeredDeaths/details";
import SdidDeathStatus from "./registeredDeaths/sdidStatus";

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
              <RequirePermission
                workspace="CRVS"
                permission={[CRVS_PERMISSIONS.DUPLICATE_CHECK_RESOLVE, CRVS_PERMISSIONS.EXCEPTIONS_VIEW]}
              >
                <ExceptionDuplicates />
              </RequirePermission>
            }
          />
          <Route
            path="/exceptions/sync-failures"
            element={
              <RequirePermission workspace="CRVS" permission={CRVS_PERMISSIONS.EXCEPTIONS_VIEW}>
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
        </Routes>
        <Outlet />
      </main>
    </div>
  );
}
