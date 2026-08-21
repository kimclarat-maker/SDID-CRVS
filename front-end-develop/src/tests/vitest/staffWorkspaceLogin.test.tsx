import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Login from "@/screens/authentication/login";
import WorkspaceSelection from "@/screens/dashboard/workspaces";
import { crvsDemoCredentials, dualWorkspaceDemoCredential, demoCredentials } from "@/demo/credentials";

function renderLoginWithWorkspaceStubs() {
  return render(
    <MemoryRouter initialEntries={["/staff/sign-in"]}>
      <Routes>
        <Route path="/staff/sign-in" element={<Login />} />
        <Route path="/dashboard/sdid" element={<div>SDID workspace home</div>} />
        <Route path="/dashboard/crvs" element={<div>CRVS workspace home</div>} />
        <Route path="/dashboard/workspaces" element={<WorkspaceSelection />} />
      </Routes>
    </MemoryRouter>
  );
}

async function submitDemoLogin(email: string, password: string) {
  fireEvent.change(screen.getByTestId("email"), { target: { value: email } });
  fireEvent.change(screen.getByTestId("password"), { target: { value: password } });
  fireEvent.click(screen.getByTestId("submit-button"));
}

describe("Demo-mode staff login routes by resolved workspace", () => {
  afterEach(() => {
    sessionStorage.clear();
    vi.unstubAllEnvs();
  });

  it("an SDID-only demo login lands on the SDID workspace", async () => {
    vi.stubEnv("VITE_DEMO_MODE", "true");
    const admin = demoCredentials.find((c) => c.role === "administrator")!;
    renderLoginWithWorkspaceStubs();

    await submitDemoLogin(admin.email, admin.password);

    expect(await screen.findByText("SDID workspace home")).toBeInTheDocument();
  });

  it("a CRVS-only demo login lands on the CRVS workspace", async () => {
    vi.stubEnv("VITE_DEMO_MODE", "true");
    const registrar = crvsDemoCredentials.find((c) => c.role === "CIVIL_REGISTRAR")!;
    renderLoginWithWorkspaceStubs();

    await submitDemoLogin(registrar.email, registrar.password);

    expect(await screen.findByText("CRVS workspace home")).toBeInTheDocument();
  });

  it("a dual-workspace demo login opens the workspace selector", async () => {
    vi.stubEnv("VITE_DEMO_MODE", "true");
    renderLoginWithWorkspaceStubs();

    await submitDemoLogin(dualWorkspaceDemoCredential.email, dualWorkspaceDemoCredential.password);

    expect(await screen.findByText("Choose a workspace")).toBeInTheDocument();
  });

  it("selecting a workspace card navigates to that workspace's home", async () => {
    vi.stubEnv("VITE_DEMO_MODE", "true");
    renderLoginWithWorkspaceStubs();

    await submitDemoLogin(dualWorkspaceDemoCredential.email, dualWorkspaceDemoCredential.password);
    await screen.findByText("Choose a workspace");

    fireEvent.click(screen.getByTestId("workspace-card-CRVS"));

    await waitFor(() => {
      expect(screen.getByText("CRVS workspace home")).toBeInTheDocument();
    });
  });
});
