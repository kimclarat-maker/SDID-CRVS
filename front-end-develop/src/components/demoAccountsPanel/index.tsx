import { Fragment } from "react";
import { Dropdown } from "rsuite";
import { DemoCredential } from "@/demo/credentials";
import DropdownButton from "@/components/button/dropdownButton";
import "./styles.css";

type Props = {
  accounts: DemoCredential[];
  onUseAccount: (credential: DemoCredential) => void;
};

type Group = { key: string; label: string; accounts: DemoCredential[] };

// SDID/CRVS/multi-workspace, derived from each credential's own
// `workspaces` list rather than hardcoding role names, so this stays
// correct as roles are added.
function groupByWorkspace(accounts: DemoCredential[]): Group[] {
  const groups: Group[] = [
    { key: "sdid", label: "SDID staff", accounts: [] },
    { key: "crvs", label: "CRVS staff", accounts: [] },
    { key: "multi", label: "Multi-workspace staff", accounts: [] },
  ];

  accounts.forEach((account) => {
    if (account.workspaces.length > 1) {
      groups[2].accounts.push(account);
    } else if (account.workspaces[0] === "CRVS") {
      groups[1].accounts.push(account);
    } else {
      groups[0].accounts.push(account);
    }
  });

  return groups.filter((group) => group.accounts.length > 0);
}

export default function DemoAccountsPanel({ accounts, onUseAccount }: Props) {
  const groups = groupByWorkspace(accounts);

  return (
    <div className="demo-accounts-panel">
      <DropdownButton
        title="Demo accounts"
        appearance="ghost"
        placement="topStart"
        minWidth="340px"
        startIcon="badge"
        className="demo-accounts-dropdown"
      >
        <Dropdown.Item panel className="demo-accounts-dropdown-hint">
          This environment uses fictional data and does not connect to
          production services. Pick a role to fill in the form, then sign in.
        </Dropdown.Item>
        {groups.map((group, i) => (
          <Fragment key={group.key}>
            {i > 0 && <Dropdown.Separator />}
            <Dropdown.Item panel className="demo-account-group-label">
              {group.label}
            </Dropdown.Item>
            {group.accounts.map((account) => (
              <Dropdown.Item
                key={account.email}
                onSelect={() => onUseAccount(account)}
                data-testid={`demo-account-${account.email}`}
              >
                <div className="demo-account-role">
                  {account.roleLabel}
                  {account.workspaces?.map((workspace) => (
                    <span key={workspace} className="demo-account-workspace-tag">
                      {workspace}
                    </span>
                  ))}
                </div>
                <div className="demo-account-email">{account.email}</div>
              </Dropdown.Item>
            ))}
          </Fragment>
        ))}
      </DropdownButton>
    </div>
  );
}
