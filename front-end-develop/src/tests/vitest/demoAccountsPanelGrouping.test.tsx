import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import DemoAccountsPanel from "@/components/demoAccountsPanel";
import { allStaffDemoCredentials } from "@/demo/credentials";

function openDropdown() {
  fireEvent.click(screen.getByRole("button", { name: /demo accounts/i }));
}

describe("DemoAccountsPanel dropdown", () => {
  it("sits behind a single, real, keyboard-operable 'Demo accounts' button", () => {
    render(<DemoAccountsPanel accounts={allStaffDemoCredentials} onUseAccount={vi.fn()} />);

    const toggle = screen.getByRole("button", { name: /demo accounts/i });
    expect(toggle).toBeInTheDocument();
    expect(toggle.tagName.toLowerCase()).toBe("button");
  });

  it("groups demo accounts into SDID staff / CRVS staff / Multi-workspace staff once opened", () => {
    render(<DemoAccountsPanel accounts={allStaffDemoCredentials} onUseAccount={vi.fn()} />);
    openDropdown();

    expect(screen.getByText("SDID staff")).toBeInTheDocument();
    expect(screen.getByText("CRVS staff")).toBeInTheDocument();
    expect(screen.getByText("Multi-workspace staff")).toBeInTheDocument();
  });

  it("lists every demo account exactly once across the groups", () => {
    render(<DemoAccountsPanel accounts={allStaffDemoCredentials} onUseAccount={vi.fn()} />);
    openDropdown();

    allStaffDemoCredentials.forEach((account) => {
      expect(screen.getByText(account.email)).toBeInTheDocument();
    });
  });

  it("selecting an account calls onUseAccount with that credential", () => {
    const onUseAccount = vi.fn();
    render(<DemoAccountsPanel accounts={allStaffDemoCredentials} onUseAccount={onUseAccount} />);
    openDropdown();

    const target = allStaffDemoCredentials[0];
    fireEvent.click(screen.getByText(target.email));

    expect(onUseAccount).toHaveBeenCalledWith(target);
  });
});
