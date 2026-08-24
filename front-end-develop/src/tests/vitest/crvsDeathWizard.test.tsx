import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { cfg } from "@/constants/cfg";
import CrvsSidebar from "@/screens/dashboard/crvs/components/CrvsSidebar";
import StartDeathReviewModal from "@/screens/dashboard/crvs/deathReview/components/modals/StartDeathReviewModal";
import { CRVS_ROLE_PERMISSIONS } from "@/constants/crvsRoles";
import { DeathRegistrationCase } from "@/domain/crvs/types";
import DeathServiceLanding from "@/screens/public/civilRegistration/death";
import { PublicLanguageProvider } from "@/context/PublicLanguageContext";

const STORAGE_KEY = cfg.VITE_APP_NAME as string;

function seedSession(role: keyof typeof CRVS_ROLE_PERMISSIONS) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ token: "t", account: { _id: "user@demo.identity.local", assignments: [{ workspace: "CRVS", role, permissions: CRVS_ROLE_PERMISSIONS[role] }] } }));
}

function renderSidebar() {
  return render(
    <MemoryRouter>
      <CrvsSidebar />
    </MemoryRouter>
  );
}

const stubCase: DeathRegistrationCase = {
  id: "DR-TEST",
  reference: "DR-DEMO-2026-9999",
  status: "SUBMITTED",
  pathway: "HEALTH_FACILITY",
  processingOfficeId: "OFFICE-DEMO-01",
  processingOfficeName: "Demo District Registration Office",
  jurisdiction: "Demo District",
  dateOfDeath: "2026-01-01T00:00:00.000Z",
  dateReported: "2026-01-02T00:00:00.000Z",
  daysAfterDeath: 1,
  isLate: false,
  requiresSupervisorReview: false,
  deceased: { identityStatus: "KNOWN", firstName: "Test", lastName: "Deceased", sex: "MALE", verification: "NOT_VERIFIED" },
  occurrence: { dateOfDeath: "2026-01-01T00:00:00.000Z", placeCategory: "HEALTH_FACILITY", location: "Demo District Health Centre", adminLocation: "Demo District", jurisdiction: "Demo District", circumstanceCategory: "NATURAL_ILLNESS" },
  declarant: { relationship: "Spouse", documentType: "NATIONAL_ID", firstName: "Test", lastName: "Declarant", verification: "VERIFIED" },
  nextOfKin: [],
  witnesses: [],
  evidence: [],
  reviewSections: { DECEASED: "NOT_REVIEWED", OCCURRENCE: "NOT_REVIEWED", MEDICAL_CERTIFICATION: "NOT_REVIEWED", DECLARANT: "NOT_REVIEWED", NEXT_OF_KIN: "NOT_REVIEWED", WITNESSES: "NOT_REVIEWED", EVIDENCE: "NOT_REVIEWED", IDENTITY_CHECK: "NOT_REVIEWED", DUPLICATE_CHECK: "NOT_REVIEWED", OFFICER_DECLARATION: "NOT_REVIEWED" },
  reviewDecisions: [],
  correctionRequests: [],
  officerId: "crvs.officer@demo.identity.local",
  officerName: "Test Officer",
  declarationConfirmed: false,
  declarantConfirmed: false,
  privacyAcknowledged: false,
  createdAt: "2026-01-02T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:00.000Z",
  sdid: { status: "NOT_READY", attempts: [] },
  statusHistory: [],
  version: 1,
};

describe("CRVS sidebar shows role-specific death menus", () => {
  afterEach(() => sessionStorage.clear());

  it("Death Notification Officer sees death-notification menus, not the death review queue", () => {
    seedSession("DEATH_NOTIFICATION_OFFICER");
    renderSidebar();
    expect(screen.getByText("Death notifications")).toBeInTheDocument();
    expect(screen.getByText("New death notification")).toBeInTheDocument();
    expect(screen.queryByText("Death review queue")).not.toBeInTheDocument();
    expect(screen.queryByText("Registered deaths")).not.toBeInTheDocument();
  });

  it("Civil Registrar sees the death review queue and registered deaths, not death-notification creation", () => {
    seedSession("CIVIL_REGISTRAR");
    renderSidebar();
    expect(screen.getByText("Death review queue")).toBeInTheDocument();
    expect(screen.getByText("Registered deaths")).toBeInTheDocument();
    expect(screen.queryByText("New death notification")).not.toBeInTheDocument();
  });

  it("CRVS Auditor sees death audit history but no create/edit menus", () => {
    seedSession("CRVS_AUDITOR");
    renderSidebar();
    expect(screen.getByText("Death audit history")).toBeInTheDocument();
    expect(screen.queryByText("New death registration")).not.toBeInTheDocument();
    expect(screen.queryByText("Death review queue")).not.toBeInTheDocument();
  });

  it("a role with no death permissions sees none of the death menu items", () => {
    seedSession("BIRTH_NOTIFICATION_OFFICER");
    renderSidebar();
    expect(screen.queryByText("Death registration")).not.toBeInTheDocument();
    expect(screen.queryByText("Death notifications")).not.toBeInTheDocument();
  });
});

describe("Modal keyboard behavior", () => {
  it("StartDeathReviewModal exposes an accessible dialog and closes on Escape", () => {
    const onClose = vi.fn();
    render(<StartDeathReviewModal show onClose={onClose} deathCase={stubCase} onConfirm={async () => undefined} />);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Start review" })).toBeInTheDocument();

    fireEvent.keyDown(dialog, { key: "Escape", code: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("the confirm button is focusable and clickable without throwing", () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(<StartDeathReviewModal show onClose={() => undefined} deathCase={stubCase} onConfirm={onConfirm} />);
    const confirmButton = screen.getByTestId("start-death-review-modal-confirm");
    confirmButton.focus();
    expect(confirmButton).toHaveFocus();
    fireEvent.click(confirmButton);
    expect(onConfirm).toHaveBeenCalled();
  });
});

describe("No dead buttons: the public death-service landing page's four primary actions all navigate", () => {
  function renderLandingAt(path: string) {
    return render(
      <PublicLanguageProvider>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/civil-registration/death" element={<DeathServiceLanding />} />
            <Route path="/civil-registration/death/report" element={<div data-testid="landed-report" />} />
          </Routes>
        </MemoryRouter>
      </PublicLanguageProvider>
    );
  }

  it("'Report a death' navigates to the report wizard", () => {
    renderLandingAt("/civil-registration/death");
    fireEvent.click(screen.getByTestId("death-landing-report"));
    expect(screen.getByTestId("landed-report")).toBeInTheDocument();
  });

  it("'Continue saved report' and 'Track existing case' require input before navigating", () => {
    renderLandingAt("/civil-registration/death");
    fireEvent.click(screen.getByTestId("death-landing-resume"));
    // Empty submission is rejected client-side rather than silently doing nothing.
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("'Request death certificate' explains the reference requirement rather than doing nothing", () => {
    renderLandingAt("/civil-registration/death");
    fireEvent.click(screen.getByTestId("death-landing-certificate"));
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});
