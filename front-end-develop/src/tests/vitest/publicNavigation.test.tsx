import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import PublicSite from "@/navigation/PublicSite";

function renderPublicSiteAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <PublicSite />
    </MemoryRouter>
  );
}

describe("Public site navigation", () => {
  it("renders the homepage hero at /", () => {
    renderPublicSiteAt("/");
    expect(
      screen.getByText(
        "One trusted platform for civil registration and digital identity services."
      )
    ).toBeInTheDocument();
  });

  it("renders the skip-to-content link as the first focusable element", () => {
    renderPublicSiteAt("/");
    const skipLink = screen.getByText("Skip to main content");
    expect(skipLink).toHaveAttribute("href", "#main-content");
  });

  it("exposes a staff sign-in link in the header, not a login form", () => {
    renderPublicSiteAt("/");
    const staffLink = screen.getByRole("link", { name: "Staff sign in" });
    expect(staffLink).toHaveAttribute("href", "/staff/sign-in");
    expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument();
  });

  it("renders the digital identity page", () => {
    renderPublicSiteAt("/digital-identity");
    expect(
      screen.getByRole("heading", { name: "Digital Identity" })
    ).toBeInTheDocument();
  });

  it("renders the civil registration overview page", () => {
    renderPublicSiteAt("/civil-registration");
    expect(
      screen.getByRole("heading", { name: "Civil Registration" })
    ).toBeInTheDocument();
  });

  it("renders each civil registration service page via the shared template", () => {
    renderPublicSiteAt("/civil-registration/birth");
    expect(
      screen.getByRole("heading", { name: "Birth registration" })
    ).toBeInTheDocument();
  });

  it("renders the track page with a reference and OTP field", () => {
    renderPublicSiteAt("/track");
    expect(screen.getByTestId("track-reference-input")).toBeInTheDocument();
    expect(screen.getByTestId("track-otp-input")).toBeInTheDocument();
  });

  it("renders the verify page without exposing a full record form", () => {
    renderPublicSiteAt("/verify");
    expect(
      screen.getByTestId("verify-document-number-input")
    ).toBeInTheDocument();
    expect(screen.getByTestId("verify-code-input")).toBeInTheDocument();
  });

  it("does not render public content for reserved internal paths", () => {
    const { container } = renderPublicSiteAt("/dashboard/admin/home");
    expect(container).toBeEmptyDOMElement();
  });

  it("falls back to a public not-found page for unknown public routes", () => {
    renderPublicSiteAt("/this-route-does-not-exist");
    expect(
      screen.getByRole("heading", { name: "Page not found" })
    ).toBeInTheDocument();
  });
});
