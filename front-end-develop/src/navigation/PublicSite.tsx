import { Route, Routes, Outlet, useLocation } from "react-router-dom";

import { NavigationType } from "@/types/Navigation";
import { PublicLanguageProvider } from "@/context/PublicLanguageContext";
import PublicLayout from "@/components/public/PublicLayout";

import Home from "@/screens/public/home";
import DigitalIdentity from "@/screens/public/digitalIdentity";
import CrvsOverview from "@/screens/public/crvsOverview";
import CivilRegistrationServicePage from "@/screens/public/civilRegistrationServicePage";
import DeathServiceLanding from "@/screens/public/civilRegistration/death";
import DeathReportStart from "@/screens/public/civilRegistration/death/report";
import PublicDeathReportWizard from "@/screens/public/civilRegistration/death/report/wizard";
import DeathReportSuccess from "@/screens/public/civilRegistration/death/success";
import PublicDeathCaseStatus from "@/screens/public/civilRegistration/death/case";
import PublicDeathCorrectionResponse from "@/screens/public/civilRegistration/death/respond";
import MarriageServiceLanding from "@/screens/public/civilRegistration/marriage";
import MarriageDeclarationStart from "@/screens/public/civilRegistration/marriage/declaration";
import PublicMarriageDeclarationWizard from "@/screens/public/civilRegistration/marriage/declaration/wizard";
import MarriageDeclarationPayment from "@/screens/public/civilRegistration/marriage/declaration/payment";
import MarriageDeclarationSuccess from "@/screens/public/civilRegistration/marriage/declaration/success";
import MarriagePublicTracking from "@/screens/public/civilRegistration/marriage/tracking";
import MarriagePartnerResponse from "@/screens/public/civilRegistration/marriage/respond";
import MarriageAppointmentManage from "@/screens/public/civilRegistration/marriage/appointment";
import DivorceServiceLanding from "@/screens/public/civilRegistration/divorce";
import DivorceRegistrationStart from "@/screens/public/civilRegistration/divorce/declaration";
import PublicDivorceRegistrationWizard from "@/screens/public/civilRegistration/divorce/declaration/wizard";
import DivorceRegistrationSuccess from "@/screens/public/civilRegistration/divorce/declaration/success";
import DivorcePublicTracking from "@/screens/public/civilRegistration/divorce/tracking";
import DivorceCorrectionResponse from "@/screens/public/civilRegistration/divorce/respond";
import Certificates from "@/screens/public/certificates";
import BirthCertificateLanding from "@/screens/public/certificates/birth";
import PublicBirthCertificateRequest from "@/screens/public/certificates/birth/request";
import ResumeBirthCertificateRequest from "@/screens/public/certificates/birth/request/resume";
import BirthCertificatePayment from "@/screens/public/certificates/birth/payment";
import BirthCertificateRequestSuccess from "@/screens/public/certificates/birth/success";
import BirthCertificateDownload from "@/screens/public/certificates/birth/download";
import Track from "@/screens/public/track";
import Verify from "@/screens/public/verify";
import ServiceCentres from "@/screens/public/serviceCentres";
import Requirements from "@/screens/public/requirements";
import Help from "@/screens/public/help";
import Complaints from "@/screens/public/complaints";
import Privacy from "@/screens/public/privacy";
import Accessibility from "@/screens/public/accessibility";
import PublicNotFound from "@/screens/public/notFound";

export const routes: NavigationType[] = [
  { path: "/", element: <Home /> },
  { path: "/digital-identity", element: <DigitalIdentity /> },
  { path: "/civil-registration", element: <CrvsOverview /> },
  {
    path: "/civil-registration/birth",
    element: <CivilRegistrationServicePage serviceId="birth" />,
  },
  { path: "/civil-registration/death", element: <DeathServiceLanding /> },
  { path: "/civil-registration/death/report", element: <DeathReportStart /> },
  { path: "/civil-registration/death/report/:draftId", element: <PublicDeathReportWizard /> },
  { path: "/civil-registration/death/report/:draftId/review", element: <PublicDeathReportWizard /> },
  { path: "/civil-registration/death/report/:draftId/success", element: <DeathReportSuccess /> },
  { path: "/civil-registration/death/case/:reference", element: <PublicDeathCaseStatus /> },
  { path: "/civil-registration/death/respond/:token", element: <PublicDeathCorrectionResponse /> },
  { path: "/civil-registration/marriage", element: <MarriageServiceLanding /> },
  { path: "/civil-registration/marriage/declaration", element: <MarriageDeclarationStart /> },
  { path: "/civil-registration/marriage/declaration/:draftId", element: <PublicMarriageDeclarationWizard /> },
  { path: "/civil-registration/marriage/declaration/:draftId/review", element: <PublicMarriageDeclarationWizard /> },
  { path: "/civil-registration/marriage/declaration/:draftId/payment", element: <MarriageDeclarationPayment /> },
  { path: "/civil-registration/marriage/declaration/:draftId/success", element: <MarriageDeclarationSuccess /> },
  { path: "/civil-registration/marriage/application/:reference", element: <MarriagePublicTracking /> },
  { path: "/civil-registration/marriage/respond/:token", element: <MarriagePartnerResponse /> },
  { path: "/civil-registration/marriage/appointment/:reference", element: <MarriageAppointmentManage /> },
  { path: "/civil-registration/divorce", element: <DivorceServiceLanding /> },
  { path: "/civil-registration/divorce/register", element: <DivorceRegistrationStart /> },
  { path: "/civil-registration/divorce/register/:draftId", element: <PublicDivorceRegistrationWizard /> },
  { path: "/civil-registration/divorce/register/:draftId/review", element: <PublicDivorceRegistrationWizard /> },
  { path: "/civil-registration/divorce/register/:draftId/success", element: <DivorceRegistrationSuccess /> },
  { path: "/civil-registration/divorce/case/:reference", element: <DivorcePublicTracking /> },
  { path: "/civil-registration/divorce/respond/:token", element: <DivorceCorrectionResponse /> },
  { path: "/certificates", element: <Certificates /> },
  { path: "/certificates/birth", element: <BirthCertificateLanding /> },
  { path: "/certificates/birth/request", element: <PublicBirthCertificateRequest /> },
  { path: "/certificates/birth/request/:requestId", element: <ResumeBirthCertificateRequest /> },
  { path: "/certificates/birth/request/:requestId/payment", element: <BirthCertificatePayment /> },
  { path: "/certificates/birth/request/:requestId/success", element: <BirthCertificateRequestSuccess /> },
  { path: "/certificates/birth/download/:accessToken", element: <BirthCertificateDownload /> },
  { path: "/track", element: <Track /> },
  { path: "/verify", element: <Verify /> },
  { path: "/service-centres", element: <ServiceCentres /> },
  { path: "/requirements", element: <Requirements /> },
  { path: "/help", element: <Help /> },
  { path: "/complaints", element: <Complaints /> },
  { path: "/privacy", element: <Privacy /> },
  { path: "/accessibility", element: <Accessibility /> },
];

// Paths owned by other top-level routers (internal auth, dashboard, docs,
// dev-only tooling). PublicSite must never render over these, since it
// mounts as a sibling of Public/Private and has its own catch-all route.
const RESERVED_PREFIXES = [
  "/dashboard",
  "/authentication",
  "/staff",
  "/no-internet",
  "/camera",
  "/doc",
];

export default () => {
  const location = useLocation();

  const isReservedPath = RESERVED_PREFIXES.some(
    (prefix) =>
      location.pathname === prefix || location.pathname.startsWith(`${prefix}/`)
  );

  if (isReservedPath) return null;

  return (
    <PublicLanguageProvider>
      <PublicLayout>
        <Routes>
          {routes.map((route, index) => (
            <Route key={index} path={route.path} element={route.element} />
          ))}
          <Route path="*" element={<PublicNotFound />} />
        </Routes>
        <Outlet />
      </PublicLayout>
    </PublicLanguageProvider>
  );
};
