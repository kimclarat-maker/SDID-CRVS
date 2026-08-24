import { afterEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { cfg } from "@/constants/cfg";
import RestrictedCauseOfDeathNotice from "@/screens/dashboard/crvs/components/RestrictedCauseOfDeathNotice";
import { CRVS_ROLE_PERMISSIONS } from "@/constants/crvsRoles";

const STORAGE_KEY = cfg.VITE_APP_NAME as string;

function seedSession(role: keyof typeof CRVS_ROLE_PERMISSIONS, id = "user@demo.identity.local") {
  sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ token: "t", account: { _id: id, assignments: [{ workspace: "CRVS", role, permissions: CRVS_ROLE_PERMISSIONS[role] }] } })
  );
}

const CAUSE = { immediateCause: "Cardiac arrest", mannerOfDeath: "NATURAL" as const };

describe("RestrictedCauseOfDeathNotice", () => {
  afterEach(() => sessionStorage.clear());

  it("shows the restricted notice, never the cause detail, for a role without DEATH_CAUSE_VIEW", () => {
    seedSession("DEATH_NOTIFICATION_OFFICER"); // has no DEATH_CAUSE_VIEW
    render(
      <RestrictedCauseOfDeathNotice cause={CAUSE}>
        <span data-testid="cause-detail">{CAUSE.immediateCause}</span>
      </RestrictedCauseOfDeathNotice>
    );
    expect(screen.getByTestId("restricted-cause-notice")).toBeInTheDocument();
    expect(screen.queryByTestId("cause-detail")).not.toBeInTheDocument();
    expect(screen.queryByText("Cardiac arrest")).not.toBeInTheDocument();
  });

  it("shows the cause detail for a role with DEATH_CAUSE_VIEW (Civil Registrar)", () => {
    seedSession("CIVIL_REGISTRAR");
    render(
      <RestrictedCauseOfDeathNotice cause={CAUSE}>
        <span data-testid="cause-detail">{CAUSE.immediateCause}</span>
      </RestrictedCauseOfDeathNotice>
    );
    expect(screen.queryByTestId("restricted-cause-notice")).not.toBeInTheDocument();
    expect(screen.getByTestId("cause-detail")).toBeInTheDocument();
  });

  it("shows the cause detail for MEDICAL_CERTIFIER, who is granted DEATH_CAUSE_VIEW explicitly", () => {
    seedSession("MEDICAL_CERTIFIER");
    render(
      <RestrictedCauseOfDeathNotice cause={CAUSE}>
        <span data-testid="cause-detail">{CAUSE.immediateCause}</span>
      </RestrictedCauseOfDeathNotice>
    );
    expect(screen.getByTestId("cause-detail")).toBeInTheDocument();
  });

  it("a CRVS Auditor (read-only, no DEATH_CAUSE_VIEW) sees the restricted notice", () => {
    seedSession("CRVS_AUDITOR");
    render(
      <RestrictedCauseOfDeathNotice cause={CAUSE}>
        <span data-testid="cause-detail">{CAUSE.immediateCause}</span>
      </RestrictedCauseOfDeathNotice>
    );
    expect(screen.getByTestId("restricted-cause-notice")).toBeInTheDocument();
  });

  it("with no session at all, defaults to restricted", () => {
    render(
      <RestrictedCauseOfDeathNotice cause={CAUSE}>
        <span data-testid="cause-detail">{CAUSE.immediateCause}</span>
      </RestrictedCauseOfDeathNotice>
    );
    expect(screen.getByTestId("restricted-cause-notice")).toBeInTheDocument();
  });
});
