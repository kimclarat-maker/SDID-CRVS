import { afterEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, Navigate } from "react-router-dom";
import { cfg } from "@/constants/cfg";
import RequireWorkspace from "@/navigation/guards/RequireWorkspace";
import RequirePermission from "@/navigation/guards/RequirePermission";

const STORAGE_KEY = cfg.VITE_APP_NAME as string;

function seedSession(account: any) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ token: "t", account }));
}

function renderAt(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route
          path="/dashboard/admin/*"
          element={
            <RequireWorkspace workspace="SDID">
              <div>SDID screen</div>
            </RequireWorkspace>
          }
        />
        <Route
          path="/dashboard/sdid"
          element={
            <RequireWorkspace workspace="SDID">
              <Navigate to="/dashboard/admin/prenrollment/search" replace />
            </RequireWorkspace>
          }
        />
        <Route
          path="/dashboard/admin/prenrollment/search"
          element={<div>SDID prenrollment search</div>}
        />
        <Route
          path="/dashboard/crvs/*"
          element={
            <RequireWorkspace workspace="CRVS">
              <div>CRVS screen</div>
            </RequireWorkspace>
          }
        />
        <Route path="/dashboard/access-denied" element={<div>Access denied</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("RequireWorkspace", () => {
  afterEach(() => sessionStorage.clear());

  it("blocks a CRVS-only user from an SDID route", () => {
    seedSession({
      assignments: [{ workspace: "CRVS", role: "CIVIL_REGISTRAR", permissions: [] }],
    });
    renderAt("/dashboard/admin/home");
    expect(screen.getByText("Access denied")).toBeInTheDocument();
    expect(screen.queryByText("SDID screen")).not.toBeInTheDocument();
  });

  it("blocks an SDID-only (legacy) user from a CRVS route", () => {
    seedSession({ accessRole: { value: "enrolmentOfficer" }, permissions: [] });
    renderAt("/dashboard/crvs/births");
    expect(screen.getByText("Access denied")).toBeInTheDocument();
    expect(screen.queryByText("CRVS screen")).not.toBeInTheDocument();
  });

  it("allows a dual-workspace user into the SDID side", () => {
    seedSession({
      assignments: [
        { workspace: "SDID", role: "supervisor", permissions: [] },
        { workspace: "CRVS", role: "CIVIL_REGISTRAR", permissions: [] },
      ],
    });
    renderAt("/dashboard/admin/home");
    expect(screen.getByText("SDID screen")).toBeInTheDocument();
  });

  it("allows a dual-workspace user into the CRVS side", () => {
    seedSession({
      assignments: [
        { workspace: "SDID", role: "supervisor", permissions: [] },
        { workspace: "CRVS", role: "CIVIL_REGISTRAR", permissions: [] },
      ],
    });
    renderAt("/dashboard/crvs/home");
    expect(screen.getByText("CRVS screen")).toBeInTheDocument();
  });

  it("a legacy SUPERADMIN account cannot open CRVS routes", () => {
    seedSession({ accessRole: { value: "SUPERADMIN" }, permissions: [] });
    renderAt("/dashboard/crvs/births/review");
    expect(screen.getByText("Access denied")).toBeInTheDocument();
  });

  it("/dashboard/sdid forwards an SDID user to the prenrollment search screen", () => {
    seedSession({ accessRole: { value: "enrolmentOfficer" }, permissions: [] });
    renderAt("/dashboard/sdid");
    expect(screen.getByText("SDID prenrollment search")).toBeInTheDocument();
  });
});

describe("RequirePermission", () => {
  afterEach(() => sessionStorage.clear());

  it("redirects to access-denied when the workspace permission is missing", () => {
    seedSession({
      assignments: [
        {
          workspace: "CRVS",
          role: "CRVS_REGISTRATION_OFFICER",
          permissions: ["crvs.birth_draft.create"],
        },
      ],
    });
    render(
      <MemoryRouter initialEntries={["/x"]}>
        <Routes>
          <Route
            path="/x"
            element={
              <RequirePermission workspace="CRVS" permission="crvs.registration.approve">
                <div>Approve button</div>
              </RequirePermission>
            }
          />
          <Route path="/dashboard/access-denied" element={<div>Access denied</div>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText("Access denied")).toBeInTheDocument();
  });

  it("renders a fallback inline instead of redirecting, when a fallback is given", () => {
    seedSession({
      assignments: [
        { workspace: "CRVS", role: "CRVS_REGISTRATION_OFFICER", permissions: [] },
      ],
    });
    render(
      <MemoryRouter initialEntries={["/x"]}>
        <RequirePermission
          workspace="CRVS"
          permission="crvs.registration.approve"
          fallback={<div>Hidden from Registration Officer</div>}
        >
          <div>Approve button</div>
        </RequirePermission>
      </MemoryRouter>
    );
    expect(screen.getByText("Hidden from Registration Officer")).toBeInTheDocument();
    expect(screen.queryByText("Approve button")).not.toBeInTheDocument();
  });

  it("matches any permission when given an array", () => {
    seedSession({
      assignments: [
        { workspace: "CRVS", role: "CIVIL_REGISTRAR", permissions: ["crvs.evidence.review"] },
      ],
    });
    render(
      <MemoryRouter initialEntries={["/x"]}>
        <RequirePermission
          workspace="CRVS"
          permission={["crvs.registration.approve", "crvs.evidence.review"]}
          fallback={<div>Blocked</div>}
        >
          <div>Allowed</div>
        </RequirePermission>
      </MemoryRouter>
    );
    expect(screen.getByText("Allowed")).toBeInTheDocument();
  });
});
