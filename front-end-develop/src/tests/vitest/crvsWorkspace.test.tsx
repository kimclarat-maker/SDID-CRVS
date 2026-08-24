import { afterEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { cfg } from "@/constants/cfg";
import CrvsSidebar from "@/screens/dashboard/crvs/components/CrvsSidebar";
import PendingReviewTable from "@/screens/dashboard/crvs/components/PendingReviewTable";
import { canApproveRegistration } from "@/utils/workspace/crvsRules";
import { CIVIL_REGISTRAR_DEMO_ID, REGISTRATION_OFFICER_DEMO_ID } from "@/demo/seed/crvsAccounts";
import { resetDemoData } from "@/demo/storage/demoStore";

const STORAGE_KEY = cfg.VITE_APP_NAME as string;

function seedSession(account: any) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ token: "t", account }));
}

function renderSidebar() {
  return render(
    <MemoryRouter>
      <CrvsSidebar />
    </MemoryRouter>
  );
}

describe("canApproveRegistration", () => {
  it("a Civil Registrar cannot approve a case they created themselves", () => {
    expect(canApproveRegistration(CIVIL_REGISTRAR_DEMO_ID, CIVIL_REGISTRAR_DEMO_ID)).toBe(false);
  });

  it("a Civil Registrar can approve a case someone else submitted", () => {
    expect(canApproveRegistration(CIVIL_REGISTRAR_DEMO_ID, REGISTRATION_OFFICER_DEMO_ID)).toBe(
      true
    );
  });

  it("is false when either id is missing", () => {
    expect(canApproveRegistration(undefined, REGISTRATION_OFFICER_DEMO_ID)).toBe(false);
    expect(canApproveRegistration(CIVIL_REGISTRAR_DEMO_ID, undefined)).toBe(false);
  });
});

describe("CRVS sidebar shows role-specific menus", () => {
  afterEach(() => sessionStorage.clear());

  it("Birth Notification Officer sees notification menus, not the review queue", () => {
    seedSession({
      assignments: [
        {
          workspace: "CRVS",
          role: "BIRTH_NOTIFICATION_OFFICER",
          permissions: ["crvs.birth_notification.create", "crvs.birth_notification.view"],
        },
      ],
    });
    renderSidebar();
    expect(screen.getByText("Birth notifications")).toBeInTheDocument();
    expect(screen.getByText("New notification")).toBeInTheDocument();
    expect(screen.queryByText("Review queue")).not.toBeInTheDocument();
    expect(screen.queryByText("Reports")).not.toBeInTheDocument();
  });

  it("Civil Registrar sees the review queue and registered births, not notification/registration creation", () => {
    seedSession({
      assignments: [
        {
          workspace: "CRVS",
          role: "CIVIL_REGISTRAR",
          permissions: [
            "crvs.registration.view",
            "crvs.evidence.review",
            "crvs.correction.request",
            "crvs.registration.approve",
            "crvs.registration.reject",
            "crvs.audit.view",
            "crvs.registered.view",
          ],
        },
      ],
    });
    renderSidebar();
    expect(screen.getByText("Review queue")).toBeInTheDocument();
    expect(screen.getByText("Registered births")).toBeInTheDocument();
    expect(screen.getByText("Audit history")).toBeInTheDocument();
    expect(screen.queryByText("New notification")).not.toBeInTheDocument();
    expect(screen.queryByText("New registration")).not.toBeInTheDocument();
  });

  it("CRVS Supervisor sees Exceptions and Reports, not the review queue", () => {
    seedSession({
      assignments: [
        {
          workspace: "CRVS",
          role: "CRVS_SUPERVISOR",
          permissions: [
            "crvs.workload.view",
            "crvs.analytics.view",
            "crvs.exceptions.view",
            "crvs.case.reassign",
            "crvs.escalation.review",
            "crvs.audit.view",
          ],
        },
      ],
    });
    renderSidebar();
    expect(screen.getByText("Exceptions")).toBeInTheDocument();
    expect(screen.getByText("Reports")).toBeInTheDocument();
    expect(screen.queryByText("Review queue")).not.toBeInTheDocument();
  });
});

describe("Civil Registrar actions are not exposed to Registration Officers", () => {
  afterEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it("disables Review for a case the current Civil Registrar authored, and enables it for someone else's case", () => {
    resetDemoData();
    seedSession({
      _id: CIVIL_REGISTRAR_DEMO_ID,
      assignments: [
        {
          workspace: "CRVS",
          role: "CIVIL_REGISTRAR",
          permissions: ["crvs.registration.approve"],
          jurisdiction: { level: "DISTRICT", id: "dist-demo-01", name: "Demo District" },
        },
      ],
    });
    render(
      <MemoryRouter>
        <PendingReviewTable />
      </MemoryRouter>
    );

    // BR-DEMO-2026-0003 is fixture-authored by the Civil Registrar demo account.
    const ownCaseRow = screen.getByText("BR-DEMO-2026-0003").closest("tr")!;
    expect(ownCaseRow.querySelector("button")).toBeDisabled();

    // BR-DEMO-2026-0019 has no conflict of any kind — someone else's case, in jurisdiction.
    const otherCaseRow = screen.getByText("BR-DEMO-2026-0019").closest("tr")!;
    expect(otherCaseRow.querySelector("button")).not.toBeDisabled();
  });
});
