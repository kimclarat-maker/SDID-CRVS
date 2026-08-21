import { DemoCredential } from "@/demo/credentials";
import Button from "@/components/button";
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
      <div className="demo-accounts-panel-title">Demo accounts</div>
      <p className="demo-accounts-panel-hint">
        This environment uses fictional data and does not connect to
        production services. Pick a role to fill in the form, then sign in.
      </p>
      {groups.map((group) => (
        <details key={group.key} className="demo-account-group" open>
          <summary className="demo-account-group-summary">
            {group.label}
            <span className="demo-account-group-count">{group.accounts.length}</span>
          </summary>
          <div className="demo-account-group-body">
            {group.accounts.map((account) => (
              <div key={account.email} className="demo-account-row">
                <div>
                  <div className="demo-account-role">
                    {account.roleLabel}
                    {account.workspaces?.map((workspace) => (
                      <span key={workspace} className="demo-account-workspace-tag">
                        {workspace}
                      </span>
                    ))}
                  </div>
                  <div className="demo-account-email">{account.email}</div>
                  <div className="demo-account-password">{account.password}</div>
                </div>
                <Button
                  text="Use this account"
                  appearance="ghost"
                  size="sm"
                  onClick={() => onUseAccount(account)}
                  type="button"
                />
              </div>
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}
