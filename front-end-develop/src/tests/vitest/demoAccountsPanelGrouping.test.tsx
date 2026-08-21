import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import DemoAccountsPanel from "@/components/demoAccountsPanel";
import { allStaffDemoCredentials } from "@/demo/credentials";

describe("DemoAccountsPanel grouping", () => {
  it("groups demo accounts into SDID staff / CRVS staff / Multi-workspace staff", () => {
    render(<DemoAccountsPanel accounts={allStaffDemoCredentials} onUseAccount={vi.fn()} />);

    expect(screen.getByText("SDID staff")).toBeInTheDocument();
    expect(screen.getByText("CRVS staff")).toBeInTheDocument();
    expect(screen.getByText("Multi-workspace staff")).toBeInTheDocument();
  });

  it("renders each group as a native, keyboard-accessible disclosure", () => {
    const { container } = render(
      <DemoAccountsPanel accounts={allStaffDemoCredentials} onUseAccount={vi.fn()} />
    );

    const groups = container.querySelectorAll("details.demo-account-group");
    expect(groups.length).toBe(3);
    groups.forEach((group) => {
      expect(group.querySelector("summary")).toBeTruthy();
    });
  });

  it("lists every demo account exactly once across the groups", () => {
    render(<DemoAccountsPanel accounts={allStaffDemoCredentials} onUseAccount={vi.fn()} />);

    allStaffDemoCredentials.forEach((account) => {
      expect(screen.getByText(account.email)).toBeInTheDocument();
    });
  });
});
