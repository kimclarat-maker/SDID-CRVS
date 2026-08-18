import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import RequireAuth, {
  POST_LOGIN_REDIRECT_KEY,
} from "@/navigation/guards/RequireAuth";
import { cfg } from "@/constants/cfg";

function base64UrlEncode(value: string): string {
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function buildFakeJwt(expiresInSeconds: number): string {
  const header = base64UrlEncode(JSON.stringify({ alg: "none", typ: "JWT" }));
  const payload = base64UrlEncode(
    JSON.stringify({
      exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
    })
  );
  return `${header}.${payload}.signature`;
}

function renderGuardedDashboard(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route
          path="/dashboard/*"
          element={
            <RequireAuth>
              <div>Protected dashboard content</div>
            </RequireAuth>
          }
        />
        <Route path="/staff/sign-in" element={<div>Staff sign-in page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("Dashboard route authentication guard", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it("redirects unauthenticated visitors to /staff/sign-in", async () => {
    renderGuardedDashboard("/dashboard/admin/prenrollment/search");

    expect(await screen.findByText("Staff sign-in page")).toBeInTheDocument();
    expect(
      screen.queryByText("Protected dashboard content")
    ).not.toBeInTheDocument();
  });

  it("preserves the originally requested destination for post-login redirection", async () => {
    renderGuardedDashboard("/dashboard/admin/prenrollment/search");

    await screen.findByText("Staff sign-in page");
    expect(sessionStorage.getItem(POST_LOGIN_REDIRECT_KEY)).toBe(
      "/dashboard/admin/prenrollment/search"
    );
  });

  it("renders protected content for a signed-in user with a valid token", async () => {
    sessionStorage.setItem(
      cfg.VITE_APP_NAME as string,
      JSON.stringify({ token: buildFakeJwt(3600) })
    );

    renderGuardedDashboard("/dashboard/admin/home");

    expect(
      await screen.findByText("Protected dashboard content")
    ).toBeInTheDocument();
    expect(screen.queryByText("Staff sign-in page")).not.toBeInTheDocument();
  });

  it("treats an expired token as unauthenticated", async () => {
    sessionStorage.setItem(
      cfg.VITE_APP_NAME as string,
      JSON.stringify({ token: buildFakeJwt(-3600) })
    );

    renderGuardedDashboard("/dashboard/admin/home");

    expect(await screen.findByText("Staff sign-in page")).toBeInTheDocument();
  });
});
