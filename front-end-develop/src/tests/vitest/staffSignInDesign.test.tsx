import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import StaffSignIn from "@/screens/staffSignIn";
import { platformConfig } from "@/config/platform.config";

function renderStaffSignIn() {
  return render(
    <MemoryRouter initialEntries={["/staff/sign-in"]}>
      <StaffSignIn />
    </MemoryRouter>
  );
}

describe("Redesigned staff sign-in page", () => {
  it("renders with the public design system's header and footer", () => {
    renderStaffSignIn();
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("shows a clear 'Staff sign in' heading and platform-name intro text", () => {
    renderStaffSignIn();
    expect(screen.getByRole("heading", { name: "Staff sign in" })).toBeInTheDocument();
    // platformConfig.platformName also appears in the public footer, so
    // scope the match to the intro copy specifically.
    expect(
      screen.getByText((_, node) => node?.className === "staff-auth-subtitle")
    ).toHaveTextContent(platformConfig.platformName);
  });

  it("links back to the public homepage", () => {
    renderStaffSignIn();
    const backLink = screen.getByRole("link", { name: /back to homepage/i });
    expect(backLink).toHaveAttribute("href", "/");
  });

  it("still exposes the staff-sign-in link in the header nav", () => {
    renderStaffSignIn();
    expect(screen.getByRole("link", { name: "Staff sign in" })).toHaveAttribute(
      "href",
      "/staff/sign-in"
    );
  });

  it("preserves the existing login form and its behavior (unmodified Login component)", () => {
    renderStaffSignIn();
    expect(screen.getByTestId("email")).toBeInTheDocument();
    expect(screen.getByTestId("password")).toBeInTheDocument();
    expect(screen.getByTestId("submit-button")).toBeInTheDocument();
    expect(screen.getByTestId("forgot_password")).toBeInTheDocument();
  });

  it("shows the two-column info/auth panel with its heading and trust points", () => {
    renderStaffSignIn();
    expect(
      screen.getByRole("heading", { name: /sign in to/i, level: 1 })
    ).toBeInTheDocument();
    expect(screen.getByText("Role-controlled access")).toBeInTheDocument();
    expect(screen.getByText("Auditable staff actions")).toBeInTheDocument();
    expect(screen.getByText("Secure identity verification")).toBeInTheDocument();
  });
});
